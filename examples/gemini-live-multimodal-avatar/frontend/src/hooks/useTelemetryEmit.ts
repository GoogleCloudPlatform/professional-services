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

import { useCallback } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { TelemetryEvent } from '../types/telemetry';

export function useTelemetryEmit() {
  const { recordMetric } = useTelemetry();

  const emitEvent = useCallback((event: TelemetryEvent, value?: number, metadata?: Record<string, unknown>) => {
    // 1. Map Event to Log Phase for visual consistency in console
    const phaseMap: Record<TelemetryEvent, string> = {
      [TelemetryEvent.USER_STARTED_SPEAKING]: 'Input',
      [TelemetryEvent.USER_STOPPED_SPEAKING]: 'Input',
      [TelemetryEvent.LLM_FIRST_BYTE]: 'LLM',
      [TelemetryEvent.TOOL_CALL_START]: 'Tool',
      [TelemetryEvent.TOOL_CALL_END]: 'Tool',
      [TelemetryEvent.AVATAR_STARTED_MOVING]: 'Playback',
      [TelemetryEvent.AUDIO_PLAYBACK_STARTED]: 'Playback',
      [TelemetryEvent.PLAYBACK_HALTED]: 'Interrupt',
      [TelemetryEvent.WEBSOCKET_OPENED]: 'Init',
    };

    const phase = phaseMap[event] || 'Other';
    const metadataStr = metadata ? ` (Metadata: ${JSON.stringify(metadata)})` : '';
    console.log(`[Telemetry] [Phase: ${phase}] ${event}${value !== undefined ? ` (Value: ${value.toFixed(2)}ms)` : ''}${metadataStr}`);

    // 2. Map Event to State Metric Keys
    if (value !== undefined) {
      if (event === TelemetryEvent.LLM_FIRST_BYTE) {
        recordMetric('aiProcessingLatency', value);
      } else if (event === TelemetryEvent.TOOL_CALL_END) {
        recordMetric('toolExecutionLatency', value, metadata); // Save to tree later via reducer
      } else if (event === TelemetryEvent.AVATAR_STARTED_MOVING || event === TelemetryEvent.AUDIO_PLAYBACK_STARTED) {
        recordMetric('totalTurnLatency', value);
      } else if (event === TelemetryEvent.WEBSOCKET_OPENED) {
        recordMetric('networkPing', value);
      }
    }
  }, [recordMetric]);

  return { emitEvent };
}
