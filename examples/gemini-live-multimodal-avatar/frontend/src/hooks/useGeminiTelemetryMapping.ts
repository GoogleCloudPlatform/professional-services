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

import { useCallback, useRef, useMemo } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { useTelemetryEmit } from './useTelemetryEmit';
import { telemetry, VAD_OVERHEAD } from '../utils/telemetry';
import { TelemetryEvent } from '../types/telemetry';
import type { NumericTelemetryMetric } from '../types/telemetry';

/**
 * useGeminiTelemetryMapping encapsulates the complex mapping between low-level 
 * Gemini Live socket events and high-level business/performance telemetry metrics.
 */
export function useGeminiTelemetryMapping() {
  const { recordMetric, startTurn } = useTelemetry();
  const { emitEvent } = useTelemetryEmit();

  const hasModelRespondedRef = useRef<boolean>(false);
  const hasActiveTurnRef = useRef<boolean>(false);
  const turnCompleteTimestampRef = useRef<number>(0);
  const vadStartTimestampRef = useRef<number>(0);

  const handleTurnStart = useCallback((vadTimestamp?: number) => {
    if (hasActiveTurnRef.current) return;
    
    hasActiveTurnRef.current = true;
    const turnId = `turn_${Date.now()}`;
    startTurn(turnId);
    recordMetric('turnStartTimestamp', vadTimestamp || Date.now());
  }, [startTurn, recordMetric]);

  const handleTurnEnd = useCallback(() => {
    if (!hasActiveTurnRef.current) return;

    const now = Date.now();
    recordMetric('turnEndTimestamp', now);
    turnCompleteTimestampRef.current = now;
    hasActiveTurnRef.current = false;
    hasModelRespondedRef.current = false;
  }, [recordMetric]);

  const handleFirstResponse = useCallback(() => {
    if (hasModelRespondedRef.current) return;
    
    hasModelRespondedRef.current = true;
    
    // RACE CONDITION FIX: If the model responds before local VAD detected silence,
    // we use a heuristic to set the "T0" for the response window.
    if (telemetry.getElapsed('totalTurnLatency') === undefined) {
        // If we have a VAD start timestamp, it means the user was speaking.
        // We use that as the absolute earliest T0 if nothing else is set.
        const heuristicT0 = vadStartTimestampRef.current || Date.now();
        telemetry.setTimer('totalTurnLatency', heuristicT0);
    }

    const g2g = telemetry.getElapsed('totalTurnLatency');
    if (g2g !== undefined) {
        // Record the elapsed time. We use Math.max(250, ...) to ensure a realistic physical baseline.
        recordMetric('totalTurnLatency', Math.max(250, g2g));
    }
  }, [recordMetric]);

  const handlePlaybackStart = useCallback((isVoiceOnly?: boolean) => {
    const g2g = telemetry.getElapsed('totalTurnLatency');
    if (g2g !== undefined) {
        recordMetric('totalTurnLatency', Math.max(250, g2g));
    }
    emitEvent(
        isVoiceOnly ? TelemetryEvent.AUDIO_PLAYBACK_STARTED : TelemetryEvent.AVATAR_STARTED_MOVING,
        g2g || 0
    );
  }, [recordMetric, emitEvent]);

  const handleIntentFinished = useCallback((timestamp?: number) => {
    if (hasModelRespondedRef.current) return;
    
    // Set the "T0" for latency tracking. If no timestamp is provided, use NOW.
    // This allows us to track latency for button-presses, text messages, 
    // and tool completions where VAD isn't involved.
    if (telemetry.getElapsed('totalTurnLatency') === undefined) {
        telemetry.setTimer('totalTurnLatency', timestamp || Date.now());
    }
  }, []);

  const handleVADSpeechDetected = useCallback(() => {
    const now = Date.now();
    // Prevent Phantom Turns from room noise or trailing echo immediately after the AI finishes
    if (now - turnCompleteTimestampRef.current < 1000) return false;

    vadStartTimestampRef.current = now;
    telemetry.clearTimer('totalTurnLatency');
    return true;
  }, []);

  const handleVADSilenceDetected = useCallback(() => {
    if (hasModelRespondedRef.current) return;

    const speechDuration = Date.now() - vadStartTimestampRef.current;
    if (speechDuration < 350) return; // False start filter

    const compensation = VAD_OVERHEAD;
    const silenceTime = Date.now() - compensation;
    
    handleIntentFinished(silenceTime);
    
    if (hasActiveTurnRef.current) {
        recordMetric('vadOverhead', compensation);
        recordMetric('userSilenceTimestamp', silenceTime);
    }
  }, [recordMetric, handleIntentFinished]);

  const handleSocketTelemetry = useCallback((key: NumericTelemetryMetric, val: number, meta?: Record<string, unknown>) => {
    recordMetric(key, val, meta);
  }, [recordMetric]);

  const resetMapping = useCallback(() => {
    hasModelRespondedRef.current = false;
    telemetry.clearTimer('totalTurnLatency');
  }, []);

  const resetAll = useCallback(() => {
    hasModelRespondedRef.current = false;
    hasActiveTurnRef.current = false;
    telemetry.clearTimer('totalTurnLatency');
  }, []);

  return useMemo(() => ({
    handleTurnStart,
    handleTurnEnd,
    handleFirstResponse,
    handlePlaybackStart,
    handleIntentFinished,
    handleVADSpeechDetected,
    handleVADSilenceDetected,
    handleSocketTelemetry,
    resetMapping,
    resetAll,
    getHasModelResponded: () => hasModelRespondedRef.current,
    getHasActiveTurn: () => hasActiveTurnRef.current,
    getVadStartTimestamp: () => vadStartTimestampRef.current
  }), [
    handleTurnStart,
    handleTurnEnd,
    handleFirstResponse,
    handlePlaybackStart,
    handleIntentFinished,
    handleVADSpeechDetected,
    handleVADSilenceDetected,
    handleSocketTelemetry,
    resetMapping,
    resetAll
  ]);
}
