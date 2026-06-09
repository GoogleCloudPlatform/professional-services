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

import type { NumericTelemetryMetric } from '../types/telemetry';

export type ToolCall = {
  functionCall: {
    name: string;
    args: Record<string, unknown>;
    id: string;
  };
};

export type Transcription = {
  text: string;
  type: 'input' | 'output';
  finished?: boolean;
};

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: unknown;
}

export interface GeminiLiveApiOptions {
  apiKey?: string;
  modelName: string;
  systemPrompt: string;
  mcpTools: MCPTool[];
  useVertexAI: boolean;
  vertexProject?: string;
  vertexLocation?: string;
  avatarMode?: 'none' | 'heygen' | 'google_1p';
  google1PAvatarName?: string;
  google1PVoiceName?: string;
  vadSilenceDurationMs?: number;
  onAudioReceived: (payload: { base64: string; buffer: ArrayBuffer }) => void;
  onVideoReceived?: (base64: string) => void;
  onToolCall: (toolCall: ToolCall) => void;
  onTranscription: (transcription: Transcription) => void;
  onInterrupted: () => void;
  onStateChange: (state: 'connected' | 'disconnected' | 'error' | 'connecting') => void;
  onTurnComplete?: () => void;
  onTelemetry?: (metric: NumericTelemetryMetric, value: number, metadata?: Record<string, unknown>) => void;
}

export interface IGeminiLiveClient {
  disconnect(): void;
  sendAudioChunk(data: ArrayBuffer): void;
  sendTextMessage(text: string): void;
  sendToolResponse(toolName: string, id: string, result: unknown): void;
  setSilenceTimestamp(timestamp: number): void;
}
