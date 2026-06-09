/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import workletUrl from './recorderWorklet?worker&url';
import { AUDIO_CONFIG } from '../api/config';

function mergeArrayBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  const totalLength = buffers.reduce((acc, b) => acc + b.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const b of buffers) {
    result.set(new Uint8Array(b), offset);
    offset += b.byteLength;
  }
  return result.buffer;
}

export function useAudioRecorder(
  onAudioChunk: (data: ArrayBuffer) => void,
  onVADStateChange?: (isSpeaking: boolean, delayMs?: number) => void
) {
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef<boolean>(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const batchBufferRef = useRef<ArrayBuffer[]>([]);
  const AUDIO_BATCH_SIZE = 3; // Batch 3 x 32ms chunks = 96ms payload to reduce WebSocket frame overhead
  
  // PERSISTENT AUDIO LIFECYCLE ARCHITECTURE:
  // To achieve zero-latency microphone unmuting across multiple conversational bursts, 
  // we do NOT destroy the `AudioContext` or `AudioWorkletNode` when `stopRecording()` is called. 
  // Initializing these objects requires asynchronously fetching permissions, loading WASM/JS blobs, 
  // and building the hardware routing, which causes noticeable lag. By holding them in memory, 
  // subsequent `startRecording()` calls are near instantaneous.
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const isWorkletLoadedRef = useRef<boolean>(false);

  const onAudioChunkRef = useRef(onAudioChunk);
  const onVADStateChangeRef = useRef(onVADStateChange);

  useEffect(() => {
    onAudioChunkRef.current = onAudioChunk;
  }, [onAudioChunk]);

  useEffect(() => {
    onVADStateChangeRef.current = onVADStateChange;
  }, [onVADStateChange]);

  const startPromiseRef = useRef<Promise<void> | null>(null);

  const startRecording = useCallback(async () => {
    if (startPromiseRef.current) return startPromiseRef.current;

    startPromiseRef.current = (async () => {
      try {
        setIsMuted(false);
        isRecordingRef.current = true;

        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
          audioContextRef.current = new AudioContextClass({ sampleRate: AUDIO_CONFIG.INPUT_SAMPLE_RATE });
        }

        const ctx = audioContextRef.current;

        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        
        if (!isRecordingRef.current) return;

        const constraints = {
          audio: {
            sampleRate: AUDIO_CONFIG.INPUT_SAMPLE_RATE,
            channelCount: AUDIO_CONFIG.CHANNELS,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        };

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err: unknown) {
          console.warn('[useAudioRecorder] Strict constraints failed, falling back to default audio', err);
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        
        if (!isRecordingRef.current) {
           stream.getTracks().forEach(t => t.stop());
           return;
        }
        
        streamRef.current = stream;

        if (!isWorkletLoadedRef.current) {
          await ctx.audioWorklet.addModule(workletUrl);
          isWorkletLoadedRef.current = true;
        }
        
        if (!isRecordingRef.current) {
           stream.getTracks().forEach(t => t.stop());
           streamRef.current = null;
           return;
        }

        const source = ctx.createMediaStreamSource(stream);
        sourceNodeRef.current = source;

        const workletNode = new AudioWorkletNode(ctx, 'recorder-processor');
        workletNodeRef.current = workletNode;

        workletNode.port.onmessage = (event) => {
          if (!isRecordingRef.current) return;
          
          if (event.data.type === 'VAD_START') {
              onVADStateChangeRef.current?.(true);
              return;
          }
          if (event.data.type === 'VAD_SILENCE') {
              if (batchBufferRef.current.length > 0) {
                  const combined = mergeArrayBuffers(batchBufferRef.current);
                  onAudioChunkRef.current(combined);
                  batchBufferRef.current = [];
              }
              onVADStateChangeRef.current?.(false, event.data.delayMs);
              return;
          }
          
          const arrayBuffer = event.data;
          if (!arrayBuffer || arrayBuffer.byteLength === undefined) return;
          
          batchBufferRef.current.push(arrayBuffer);
          if (batchBufferRef.current.length >= AUDIO_BATCH_SIZE) {
              const combined = mergeArrayBuffers(batchBufferRef.current);
              onAudioChunkRef.current(combined);
              batchBufferRef.current = [];
          }
        };

        source.connect(workletNode);
        workletNode.connect(ctx.destination);
        
        setIsRecording(true);
        console.log('[useAudioRecorder] Audio pipeline active.');
      } catch (err) {
        console.error('[useAudioRecorder] Failed to start audio recording:', err);
        isRecordingRef.current = false;
        throw err;
      } finally {
        startPromiseRef.current = null;
      }
    })();

    return startPromiseRef.current;
  }, []);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    // Retain AudioContext and Worklet in memory for instant reuse
    setIsRecording(false);
    setIsMuted(false);
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage({
        type: 'SET_MUTED',
        payload: muted
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(e => console.warn('[useAudioRecorder] close error', e));
      }
    };
  }, []);

  return { isRecording, isMuted, startRecording, stopRecording, setMuted };
}
