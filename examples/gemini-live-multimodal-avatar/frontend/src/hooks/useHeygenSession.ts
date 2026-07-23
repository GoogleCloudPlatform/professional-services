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

import { useState, useEffect, useRef } from 'react';
import { LiveAvatarSession } from '@heygen/liveavatar-web-sdk';
import { useTelemetry } from '../context/TelemetryContext';
import { telemetry } from '../utils/telemetry';
import { useErrorContext } from '../context/ErrorContext';

export type HeygenSessionStatus = 'idle' | 'initializing' | 'ready' | 'error';

export function useHeygenSession(token: string | undefined) {
  const { recordMetric, currentTurnId } = useTelemetry();
  const { addLog } = useErrorContext();
  const [session, setSession] = useState<LiveAvatarSession | null>(null);
  const activeSessionRef = useRef<LiveAvatarSession | null>(null);
  const [status, setStatus] = useState<HeygenSessionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const hasLoggedSpeakStartedRef = useRef<boolean>(false);

  useEffect(() => {
    if (currentTurnId) {
        hasLoggedSpeakStartedRef.current = false;
    }
  }, [currentTurnId]);

  // Handle forceful cleanup when token is removed (e.g. switching to voice-only)
  useEffect(() => {
    if (!token) {
      const cleanupSession = async () => {
        if (activeSessionRef.current) {
          try {
            await activeSessionRef.current.stop();
          } catch (e) {
            console.warn('[useHeygenSession] failed to stop previous session', e);
          }
          activeSessionRef.current = null;
        }
        setSession(null);
        setStatus('idle');
      };
      
      cleanupSession();
      return;
    }

    let currentSession: LiveAvatarSession | null = null;
    let mounted = true;

    const init = async () => {
      let isInitError = false;
      try {
        setStatus('initializing');
        const sessionConfig = { 
          videoQuality: 'medium',
          isSandbox: false 
        };
        
        currentSession = new LiveAvatarSession(
            token, 
            sessionConfig as unknown as ConstructorParameters<typeof LiveAvatarSession>[1]
        );
        activeSessionRef.current = currentSession;
        
        // Safely attach event listener (defensive check against SDK updates)
        if (typeof currentSession.on === 'function') {
          // @ts-expect-error - Event string is valid at runtime but missing from current SDK typings
          currentSession.on('avatar.speak_started', () => {
            // SDK emits this for every chunk; we only care about the first one per sentence turn
            if (hasLoggedSpeakStartedRef.current || !mounted) return;
            hasLoggedSpeakStartedRef.current = true;

            // Use requestAnimationFrame to measure the EXACT moment the browser 
            // paints the first moving frame of the avatar video, eliminating the "Last Mile" illusion.
            requestAnimationFrame(() => {
                // Calculate drift from local audio playback
                if (window.lastAudioPlaybackStart && window.lastAudioPlaybackStart > 0) {
                   const driftMs = Date.now() - window.lastAudioPlaybackStart;
                   recordMetric('animationSyncDrift', driftMs);
                   window.lastAudioPlaybackStart = 0; // Clear it for the next turn
                }
    
                
    
                const g2g = telemetry.getElapsed('totalTurnLatency');
                if (g2g !== undefined) {
                    recordMetric('totalTurnLatency', g2g);
                }
            });
          });
        } else {
          addLog('error', '[Telemetry Warning] HeyGen SDK changed: currentSession.on is not a function. TTS Latency will not be tracked.');
        }

        const waitForStreamReady = new Promise<void>((resolve) => {
          if (typeof currentSession!.on === 'function') {
            let streamReadyResolved = false;
            // @ts-expect-error - Event string is valid at runtime
            currentSession!.on('session.stream_ready', () => {
              streamReadyResolved = true;
              resolve();
            });
            // Fallback timeout
            setTimeout(() => {
              if (isInitError) return;
              if (!streamReadyResolved) {
                resolve();
              }
            }, 5000); // Reverted to 5s
          } else {
            resolve();
          }
        });
        
        // Wait a tiny bit to see if we get unmounted immediately (React Strict Mode double-mount)
        await new Promise(resolve => setTimeout(resolve, 50));
        if (!mounted) return;

        await currentSession.start();
        await waitForStreamReady;
        
        if (mounted) {
          setSession(currentSession);
          setStatus('ready');
        } else {
          const stopResult = currentSession.stop();
          if (stopResult && stopResult.catch) {
            stopResult.catch((e: unknown) => console.warn('[useHeygenSession] stop error during init unmount', e));
          }
        }
      } catch (err: unknown) {
        isInitError = true;
        if (mounted) {
          addLog('error', '[useHeygenSession] Failed to init HeyGen', { error: err instanceof Error ? err.message : String(err) });
          setError(err instanceof Error ? err.message : 'Failed to init HeyGen');
          setStatus('error');
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (currentSession) {
        const stopResult = currentSession.stop();
        if (stopResult && stopResult.catch) {
          stopResult.catch((e: unknown) => console.warn('[useHeygenSession] stop error during cleanup', e));
        }
      }
    };
  }, [token, recordMetric, addLog]);

  return { session, status, error };
}

