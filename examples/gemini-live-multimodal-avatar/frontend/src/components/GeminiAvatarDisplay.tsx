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

import { useEffect, useRef, useImperativeHandle, forwardRef, useState, memo, useCallback } from 'react';
import { Box } from '@mui/material';
import { useOverlay } from '../context/OverlayContext';
import { LoanDrawdownOverlay, WorkingCapitalOverlay } from './ContextualOverlays';

interface GeminiAvatarDisplayProps {
  isProcessing?: boolean;
  isSpeaking?: boolean;
  isConnected?: boolean;
  onVideoStart?: () => void;
}

export interface GeminiAvatarDisplayHandle {
  playVideoChunk: (base64Chunk: string, mimeType: string) => void;
  interrupt: () => void;
}

export const GeminiAvatarDisplay = memo(forwardRef<GeminiAvatarDisplayHandle, GeminiAvatarDisplayProps>((props, ref) => {
  const { isSpeaking = false, isConnected = false, onVideoStart } = props;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const queueRef = useRef<ArrayBuffer[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const isSpeakingRef = useRef(isSpeaking);

  const captureLastFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState >= 2) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  const [prevIsConnected, setPrevIsConnected] = useState(isConnected);
  if (isConnected !== prevIsConnected) {
    setPrevIsConnected(isConnected);
    if (!isConnected) {
      setHasVideo(false);
      setIsReady(false);
    }
  }

  const triggerReset = useCallback(() => {
    captureLastFrame();
    setResetTrigger(prev => prev + 1);
  }, [captureLastFrame]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const video = videoRef.current;
        if (video && video.paused && isConnected && hasVideo) {
          console.log('[GeminiAvatarDisplay] Tab became visible, ensuring video is playing');
          video.play().catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, hasVideo]);

  useEffect(() => {
    let animationFrameId: number;
    let stuckFrames = 0;
    let lastTime = -1;

    const loop = () => {
      const video = videoRef.current;
      if (video && isConnected && hasVideo) {
        // Detect if video is stuck and needs gap jumping
        if (!video.paused && video.readyState >= 1) {
          if (video.currentTime === lastTime) {
            stuckFrames++;
            if (stuckFrames > 30) { // ~500ms stuck
              if (video.buffered.length > 0) {
                // Find where we are in the buffer
                let currentRange = -1;
                for (let i = 0; i < video.buffered.length; i++) {
                  if (video.currentTime >= video.buffered.start(i) && video.currentTime <= video.buffered.end(i)) {
                    currentRange = i;
                    break;
                  }
                }

                // If not in a range (gap), or at the edge of one with another ahead
                if (currentRange === -1 || (currentRange < video.buffered.length - 1 && video.buffered.end(currentRange) - video.currentTime < 0.1)) {
                  let nextRange = currentRange + 1;
                  if (currentRange === -1) {
                    for (let i = 0; i < video.buffered.length; i++) {
                      if (video.buffered.start(i) > video.currentTime) {
                        nextRange = i;
                        break;
                      }
                    }
                  }
                  
                  if (nextRange < video.buffered.length) {
                    const targetTime = video.buffered.start(nextRange) + 0.05;
                    console.warn(`[GeminiAvatarDisplay] GAP DETECTED: Jumping from ${video.currentTime.toFixed(3)} to ${targetTime.toFixed(3)}`);
                    video.currentTime = targetTime;
                  }
                }
              }
            }
          } else {
            stuckFrames = 0;
          }
        }
        lastTime = video.currentTime;

        // More aggressive check for stalled playback when data is available
        if (video.readyState >= 2 && video.paused && video.buffered.length > 0) {
             video.play().catch(() => {});
        }

        if (video.readyState >= 2 && !video.paused && video.buffered.length > 0) {
          const bufferedEnd = video.buffered.end(video.buffered.length - 1);
          const bufferAhead = bufferedEnd - video.currentTime;

          if (isSpeakingRef.current) {
            video.playbackRate = 1.0;
          } else {
            if (bufferAhead > 2.0) {
              video.currentTime = bufferedEnd - 0.05;
              video.playbackRate = 1.0;
            } else if (bufferAhead > 0.5) {
              video.playbackRate = Math.min(1.2, 1.0 + bufferAhead * 1.5);
            } else {
              video.playbackRate = 1.0;
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isConnected, hasVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlaying = () => {
      setHasVideo(true);
      if (onVideoStart) {
        onVideoStart();
      }
    };

    const handleStalled = () => {
      console.warn('[GeminiAvatarDisplay] Video stalled, attempting to resume...');
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        // If we are behind the end of the buffer, jump forward to catch up
        if (bufferedEnd - video.currentTime > 0.1) {
          console.log('[GeminiAvatarDisplay] Jumping forward to end of buffer');
          video.currentTime = bufferedEnd - 0.05;
        }
      }
      video.play().catch(err => {
        if (err.name !== 'AbortError') {
          console.error('[GeminiAvatarDisplay] Failed to resume from stall:', err);
        }
      });
    };

    const handleWaiting = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        console.warn(`[GeminiAvatarDisplay] Video waiting. paused=${video.paused}, readyState=${video.readyState}, currentTime=${video.currentTime.toFixed(3)}, bufferedEnd=${bufferedEnd.toFixed(3)}`);
      } else {
        console.warn(`[GeminiAvatarDisplay] Video waiting. Buffer is empty. paused=${video.paused}`);
      }
    };

    const handleError = (e: Event) => {
        const target = e.target as HTMLVideoElement;
        console.error('[GeminiAvatarDisplay][RED-HANDED] Video Error:', target.error, e);
    };

    video.addEventListener('playing', handlePlaying);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('error', handleError);
    
    return () => {
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('error', handleError);
    };
  }, [onVideoStart]);
  const { activeOverlay } = useOverlay();

  const codec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';

  const processQueue = useCallback(() => {
    const sourceBuffer = sourceBufferRef.current;
    const mediaSource = mediaSourceRef.current;

    if (!sourceBuffer || sourceBuffer.updating) return;
    
    // Don't append if the media source is closed or detached
    if (!mediaSource || mediaSource.readyState !== 'open') {
      return;
    }

    if (queueRef.current.length > 0) {
      const chunk = queueRef.current.shift();
      if (chunk) {
        try {
          sourceBuffer.appendBuffer(chunk);
        } catch (e) {
          console.error('[GeminiAvatarDisplay] Error appending buffer:', e);
          if (e instanceof Error && e.name === 'InvalidStateError') {
             triggerReset();
          }
        }
      }
    }

    // Auto-resume playback: If the video was paused or stalled (which happens when the
    // MediaSource buffer runs dry during tool calls/background latency), and we now have
    // buffered data available, explicitly call play() to resume the real-time stream.
    const video = videoRef.current;

    // Detect fatal video decoder crashes (e.g. from background suspension)
    if (video && video.error) {
      console.error('[GeminiAvatarDisplay] Video element hit a fatal error, forcing pipeline rebuild. Error:', video.error);
      triggerReset();
      return;
    }

    if (video) {
      if (video.buffered.length > 0) {
         const bufferedEnd = video.buffered.end(video.buffered.length - 1);
         // Log if we have data but we are not playing and not explicitly paused
         if (!video.paused && video.readyState < 3 && bufferedEnd > video.currentTime) {
             console.warn(`[GeminiAvatarDisplay] MICRO-GAP SUSPECT: New chunk added. video.paused=${video.paused}, readyState=${video.readyState}, currentTime=${video.currentTime.toFixed(3)}, bufferedEnd=${bufferedEnd.toFixed(3)}. Auto-resume BYPASSED because paused is false.`);
         }
      }

      if (video.paused && video.buffered.length > 0) {
        // Small check to ensure we don't spam play() if it's already attempting
        if (video.readyState >= 2) {
          video.play().catch(err => {
            if (err.name !== 'AbortError') {
              console.warn('[GeminiAvatarDisplay] Failed to auto-resume play:', err);
            }
          });
        }
      }
    }
  }, [triggerReset]);

  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  useImperativeHandle(ref, () => ({
    playVideoChunk: (base64Chunk: string) => {
      const arrayBuffer = base64ToArrayBuffer(base64Chunk);
      queueRef.current.push(arrayBuffer);
      processQueue();
      if (!isReady) {
        setIsReady(true);
      }
    },
    interrupt: () => {
      console.warn('[GeminiAvatarDisplay][RED-HANDED] INTERRUPT CALLED:', {
          queueLength: queueRef.current.length,
          paused: videoRef.current?.paused,
          readyState: videoRef.current?.readyState,
          currentTime: videoRef.current?.currentTime,
          bufferedRanges: videoRef.current ? Array.from({length: videoRef.current.buffered.length}, (_, i) => [videoRef.current!.buffered.start(i), videoRef.current!.buffered.end(i)]) : []
      });
      // 0. Capture the last frame to show in case of an unexpected pipeline rebuild
      captureLastFrame();

      // 1. DO NOT empty the queue. Emptying the queue drops downloaded chunks 
      // that haven't been appended to the SourceBuffer yet, breaking the fMP4 
      // mathematical sequence and causing a PIPELINE_ERROR_DECODE crash.
      // The `useEffect` playback loop will automatically jump the video's currentTime
      // forward to skip trailing frames since `isSpeaking` becomes false.
      
      // 2. DO NOT touch the SourceBuffer (no abort(), no remove()).
    }
  }));

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isConnected) {
        if (!isConnected) {
            if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
                try { mediaSourceRef.current.endOfStream(); } catch { /* Ignore stream end errors */ }
            }
            if (video) video.src = '';
            mediaSourceRef.current = null;
            sourceBufferRef.current = null;
            queueRef.current = [];
        }
        return;
    }

    // Initialize or Re-initialize MediaSource
    if ('MediaSource' in window && MediaSource.isTypeSupported(codec)) {
      console.log('[GeminiAvatarDisplay] Initializing new MediaSource (isConnected:', isConnected, ', resetTrigger:', resetTrigger, ')');
      const mediaSource = new MediaSource();
      mediaSourceRef.current = mediaSource;
      const url = URL.createObjectURL(mediaSource);
      video.src = url;

      const onSourceOpen = () => {
        console.log('[GeminiAvatarDisplay] MediaSource opened');
        try {
          const sourceBuffer = mediaSource.addSourceBuffer(codec);
          sourceBuffer.mode = 'sequence'; // Ensure segments are played in order
          sourceBufferRef.current = sourceBuffer;
          
          sourceBuffer.addEventListener('error', (e) => {
            console.error('[GeminiAvatarDisplay][RED-HANDED] SourceBuffer error event:', e);
          });
          sourceBuffer.addEventListener('abort', (e) => {
            console.warn('[GeminiAvatarDisplay][RED-HANDED] SourceBuffer abort event:', e);
          });

          sourceBuffer.addEventListener('updateend', () => {
            processQueue();
          });
          
          // Drain any chunks that arrived while MediaSource was opening
          processQueue();
        } catch (e) {
          console.error('[GeminiAvatarDisplay] Error adding source buffer:', e);
        }
      };

      mediaSource.addEventListener('sourceopen', onSourceOpen);

      return () => {
        console.log('[GeminiAvatarDisplay] Cleaning up MediaSource');
        mediaSource.removeEventListener('sourceopen', onSourceOpen);
        if (mediaSource.readyState === 'open') {
          try {
            mediaSource.endOfStream();
          } catch {
            // Handle occasional stream close errors
          }
        }
        video.src = '';
        URL.revokeObjectURL(url);
        sourceBufferRef.current = null;
        mediaSourceRef.current = null;
        queueRef.current = [];
      };
    } else {
      console.error('[GeminiAvatarDisplay] Unsupported MIME type or codec:', codec);
    }
  }, [isConnected, resetTrigger, processQueue]);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', borderRadius: 4, overflow: 'hidden', bgcolor: 'grey.200' }}>
      {/* Fallback Canvas to display the last known good frame during decoder rebuilds */}
      <canvas
        ref={canvasRef}
        style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            zIndex: 0
        }}
      />
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            transform: 'translateZ(0)',
            transition: 'opacity 0.5s ease-in-out',
            opacity: hasVideo ? 1 : 0,
            zIndex: hasVideo ? 1 : 0,
            position: 'relative' // Sit on top of the canvas
        }}
      />

      {/* Contextual Overlays */}
      {activeOverlay && (
        <Box sx={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '50%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
          zIndex: 5
        }} />
      )}
      <Box sx={{ 
        position: 'absolute', 
        bottom: 24, left: 0, right: 0, 
        display: 'flex', 
        justifyContent: 'center',
        px: 2,
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        <Box sx={{ pointerEvents: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
          {activeOverlay === 'loan_drawdown' && <LoanDrawdownOverlay />}
          {activeOverlay === 'working_capital' && <WorkingCapitalOverlay />}
        </Box>
      </Box>
    </Box>
  );
}));

GeminiAvatarDisplay.displayName = 'GeminiAvatarDisplay';
