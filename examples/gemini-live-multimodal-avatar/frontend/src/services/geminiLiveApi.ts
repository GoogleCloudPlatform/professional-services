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

import type { GeminiLiveApiOptions, IGeminiLiveClient } from './geminiLiveApi.types';
import NetworkWorker from '../workers/networkWorker?worker';

export type { ToolCall, Transcription, MCPTool, GeminiLiveApiOptions, IGeminiLiveClient } from './geminiLiveApi.types';

/**
 * GeminiLiveApi (Worker Proxy)
...
 * This class now acts as a lightweight proxy that communicates with a WebWorker.
 * By moving the actual GoogleGenAI SDK and WebSocket logic to a background thread,
 * we ensure that network I/O and audio encoding never block the main UI thread.
 */
export class GeminiLiveApi implements IGeminiLiveClient {
  private worker: Worker | null = null;
  private options: GeminiLiveApiOptions;

  constructor(options: GeminiLiveApiOptions) {
    this.options = options;
  }

  public async connect() {
    try {
        this.worker = new NetworkWorker();

        this.worker.onmessage = (event) => {
            const { type, payload, error } = event.data;

            switch (type) {
                case 'STATE_CHANGE':
                    this.options.onStateChange(payload);
                    if (payload === 'error') {
                        console.error('[GeminiLiveApi] Worker reported error:', error);
                    }
                    break;
                case 'AUDIO_DATA':
                    this.options.onAudioReceived(payload);
                    break;
                case 'VIDEO_DATA':
                    if (this.options.onVideoReceived) {
                        this.options.onVideoReceived(payload);
                    }
                    break;
                case 'TOOL_CALL':
                    this.options.onToolCall(payload);
                    break;
                case 'TRANSCRIPTION':
                    this.options.onTranscription(payload);
                    break;
                case 'INTERRUPTED':
                    this.options.onInterrupted();
                    break;
                case 'TURN_COMPLETE':
                    if (this.options.onTurnComplete) this.options.onTurnComplete();
                    break;
                case 'TELEMETRY':
                    if (this.options.onTelemetry) {
                        this.options.onTelemetry(payload.key, payload.value);
                    }
                    break;
            }
        };

        const tools = this.options.mcpTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
        }));

        this.worker.postMessage({
            type: 'INITIALIZE',
            payload: {
                apiKey: this.options.apiKey,
                modelName: this.options.modelName,
                systemPrompt: this.options.systemPrompt,
                mcpTools: this.options.mcpTools,
                useVertexAI: this.options.useVertexAI,
                vertexProject: this.options.vertexProject,
                vertexLocation: this.options.vertexLocation,
                avatarMode: this.options.avatarMode,
                google1PAvatarName: this.options.google1PAvatarName,
                google1PVoiceName: this.options.google1PVoiceName,
                vadSilenceDurationMs: this.options.vadSilenceDurationMs,
                tools
            }
        });

    } catch (e) {
        console.error('[GeminiLiveApi] Failed to spawn worker:', e);
        this.options.onStateChange('error');
    }
  }

  public disconnect() {
    if (this.worker) {
        this.worker.postMessage({ type: 'DISCONNECT' });
        this.worker.terminate();
        this.worker = null;
    }
  }

  public sendAudioChunk(data: ArrayBuffer) {
    if (this.worker) {
        this.worker.postMessage({ type: 'SEND_AUDIO', payload: data }, [data]);
    }
  }

  public sendToolResponse(toolName: string, id: string, result: unknown) {
    if (this.worker) {
        this.worker.postMessage({
            type: 'TOOL_RESPONSE',
            payload: { toolName, id, result }
        });
    }
  }

  public sendTextMessage(text: string) {
    if (this.worker) {
        // useGeminiLive already started the timer for text, so we just proxy
        this.worker.postMessage({ type: 'SEND_TEXT', payload: text });
    }
  }

  public setSilenceTimestamp(timestamp: number) {
    if (this.worker) {
        this.worker.postMessage({ type: 'START_LATENCY_TIMER', payload: timestamp });
    }
  }
}
