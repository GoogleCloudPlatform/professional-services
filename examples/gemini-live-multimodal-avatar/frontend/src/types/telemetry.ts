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

export interface MCPToolLog {
  toolName: string;
  latency: number;
  timestamp: number;
}

export const TelemetryEvent = {
  USER_STARTED_SPEAKING: 'USER_STARTED_SPEAKING',
  USER_STOPPED_SPEAKING: 'USER_STOPPED_SPEAKING',
  LLM_FIRST_BYTE: 'LLM_FIRST_BYTE',
  TOOL_CALL_START: 'TOOL_CALL_START',
  TOOL_CALL_END: 'TOOL_CALL_END',
  AVATAR_STARTED_MOVING: 'AVATAR_STARTED_MOVING',
  AUDIO_PLAYBACK_STARTED: 'AUDIO_PLAYBACK_STARTED',
  PLAYBACK_HALTED: 'PLAYBACK_HALTED',
  WEBSOCKET_OPENED: 'WEBSOCKET_OPENED'
} as const;

export type TelemetryEvent = typeof TelemetryEvent[keyof typeof TelemetryEvent];
export type TelemetryMetricKey = NumericTelemetryMetric | TextTelemetryMetric;

export type TextTelemetryMetric =
  | 'userText'
  | 'modelText';

export type NumericTelemetryMetric = 
  | 'totalTurnLatency'
  | 'ttsProcessingLatency'
  | 'aiProcessingLatency'
  | 'avatarGenerationTime'
  | 'networkPing'
  | 'toolExecutionLatency'
  | 'animationSyncDrift'
  | 'interruptionLatency'
  | 'vadOverhead'
  | 'turnStartTimestamp'
  | 'turnEndTimestamp'
  | 'userSilenceTimestamp'
  | 'inputTokens'
  | 'outputTokens'
  | 'totalTokens';

export interface TelemetryMetrics {
  audioMode?: string;
  modelName?: string;
  turnId?: string;
  turnStartTimestamp?: number;
  turnEndTimestamp?: number;
  userSilenceTimestamp?: number;
  timestamp?: number;
  totalTurnLatency?: number; // Glass-to-Glass: VAD_SILENCE to Avatar Moving
  ttsProcessingLatency?: number; // Time from sending text to HeyGen to Avatar Moving
  aiProcessingLatency?: number; // Time to First Byte from Gemini LLM
  avatarGenerationTime?: number;
  networkPing?: number;
  vadOverhead?: number; // Dynamic VAD silence delay compensation
  toolExecutionLatency?: number; // Aggregated or latest
  toolExecutions?: MCPToolLog[]; // Tree Structure trace!
  animationSyncDrift?: number; // Drift between audio and avatar
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  interruptionLatency?: number; // Time from VAD_START to audio halted
  userText?: string;
  modelText?: string;
}

declare global {
  interface Window {
    lastAudioPlaybackStart?: number;
  }
}
