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

import { useRef, useCallback, useState, useEffect } from 'react';
import { AUDIO_CONFIG } from '../api/config';
import workletUrl from './playbackWorklet?worker&url';

export interface UseAudioPlayerOptions {
  onAudioChunk?: (base64Audio: string) => void;
  muteLocalPlayback?: boolean;
  onPlaybackStart?: () => void;
}

export function useAudioPlayer({ onAudioChunk, muteLocalPlayback = false, onPlaybackStart }: UseAudioPlayerOptions = {}) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const [geminiStream, setGeminiStream] = useState<MediaStream | null>(null);
  const isWorkletLoadedRef = useRef<boolean>(false);
  const chunksReceivedRef = useRef<number>(0);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  const initAudio = useCallback(async () => {
    if (initPromiseRef.current) return initPromiseRef.current;
    
    initPromiseRef.current = (async () => {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass({ sampleRate: AUDIO_CONFIG.OUTPUT_SAMPLE_RATE });
        audioContextRef.current = ctx;
        
        const dest = ctx.createMediaStreamDestination();
        mediaStreamDestinationRef.current = dest;
        setGeminiStream(dest.stream);
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      if (!isWorkletLoadedRef.current) {
          await ctx.audioWorklet.addModule(workletUrl);
          isWorkletLoadedRef.current = true;
          
          const workletNode = new AudioWorkletNode(ctx, 'playback-processor');
          workletNodeRef.current = workletNode;
          
          if (!muteLocalPlayback) {
              workletNode.connect(ctx.destination);
          }
          if (mediaStreamDestinationRef.current) {
              workletNode.connect(mediaStreamDestinationRef.current);
          }
      }
    })();
    
    return initPromiseRef.current;
  }, [muteLocalPlayback]);

  // Dynamically update audio routing when muteLocalPlayback changes mid-session
  useEffect(() => {
    if (workletNodeRef.current && audioContextRef.current) {
      const workletNode = workletNodeRef.current;
      const ctx = audioContextRef.current;
      if (!muteLocalPlayback) {
        // Try to connect, might throw if already connected but usually safe or we can just try/catch
        try {
          workletNode.connect(ctx.destination);
        } catch {
          // ignore
        }
      } else {
        try {
          workletNode.disconnect(ctx.destination);
        } catch {
          // ignore if not connected
        }
      }
    }
  }, [muteLocalPlayback]);

  const playAudioChunk = useCallback(async (floatBuffer: ArrayBuffer, base64Audio?: string) => {
    try {
      // Deliver base64 audio to external consumers (HeyGen) immediately to prevent burst-delivery
      // caused by awaiting initAudio, which can result in chipmunk speed-up.
      if (onAudioChunk && base64Audio) {
        onAudioChunk(base64Audio);
      }

      if (!isWorkletLoadedRef.current || !workletNodeRef.current) {
        await initAudio();
      }
      
      if (!workletNodeRef.current) return;

      workletNodeRef.current.port.postMessage({ type: 'AUDIO', payload: floatBuffer }, [floatBuffer]);
      
      chunksReceivedRef.current += 1;
      // Capture local playback timestamp for drift calculation
      if (chunksReceivedRef.current === 1) { // First chunk of the sentence
        window.lastAudioPlaybackStart = Date.now(); 
        window.dispatchEvent(new CustomEvent('audio-playback-started', { detail: { timestamp: window.lastAudioPlaybackStart } }));
        if (onPlaybackStart) {
          onPlaybackStart();
        }
      }

    } catch (e) {
      console.error('Failed to play audio chunk:', e);
    }
  }, [onAudioChunk, onPlaybackStart, initAudio]);

  const stopAudioPlayback = useCallback(() => {
    if (workletNodeRef.current) {
        workletNodeRef.current.port.postMessage({ type: 'FLUSH' });
    }
    chunksReceivedRef.current = 0;
  }, []);

  const suspendAudioContext = useCallback(async () => {
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
          await audioContextRef.current.suspend();
      }
  }, []);

  const resumeAudioContext = useCallback(async () => {
      await initAudio();
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
      }
  }, [initAudio]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(e => console.warn('[useAudioPlayer] Failed to close AudioContext:', e));
        audioContextRef.current = null;
        isWorkletLoadedRef.current = false;
        initPromiseRef.current = null;
      }
    };
  }, []);

  return {
    geminiStream,
    playAudioChunk,
    stopAudioPlayback,
    suspendAudioContext,
    resumeAudioContext
  };
}
