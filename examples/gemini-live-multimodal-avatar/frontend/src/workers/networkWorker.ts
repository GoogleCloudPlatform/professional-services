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

import { 
    GoogleGenAI, 
    Modality, 
    type Session, 
    type LiveServerMessage, 
    type LiveConnectConfig,

    type Content,
    type GoogleGenAIOptions,
    StartSensitivity,
    EndSensitivity,
    TurnCoverage,
} from '@google/genai';
import { TelemetryService } from '../utils/telemetry';

const telemetry = new TelemetryService();

/**
 * The NetworkWorker acts as a background proxy for the Gemini Live API.
 * It handles the WebSocket connection, audio chunk encoding, and message parsing
 * on a separate thread, ensuring the main UI thread remains fluid.
 */

let session: Session | null = null;
let modelName = '';
let isLegacy = false;
let isIgnoringTrailingChunks = false;
let hasLoggedFirstAudioChunk = false;
const processedToolCallIds = new Set<string>();

// Typed reference to postMessage to avoid DOM vs Worker signature conflicts in TS
const workerPostMessage = (self as unknown as Worker).postMessage.bind(self);

const processToolCall = (name: string, args: Record<string, unknown>, id: string) => {
    if (processedToolCallIds.has(id)) return;
    processedToolCallIds.add(id);
    workerPostMessage({ 
        type: 'TOOL_CALL', 
        payload: { 
            functionCall: { name, args, id } 
        } 
    });
};

/**
 * High-performance conversion from ArrayBuffer to Base64 string for background threads.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

const isLegacyProtocol = (name: string): boolean => {
    return name.includes('1.5');
};

/**
 * Builds the setup configuration for the Gemini Live session based on the requested modality.
 */
const buildLiveConnectConfig = (payload: {
    systemPrompt: string;
    tools: import('@google/genai').FunctionDeclaration[];
    useVertexAI: boolean;
    avatarMode: string;
    google1PAvatarName?: string;
    google1PVoiceName?: string;
    vadSilenceDurationMs?: number;
    voiceLanguageCode?: string;
}): LiveConnectConfig => {
    const baseConfig: LiveConnectConfig = {
        systemInstruction: { parts: [{ text: payload.systemPrompt }] } as Content,
        tools: payload.tools.length > 0 ? [{
            functionDeclarations: payload.useVertexAI 
                ? (payload.tools as unknown as Record<string, unknown>[]).map((t: Record<string, unknown>) => ({
                    ...t,
                    parameters: t.parameters 
                        ? JSON.parse(JSON.stringify(t.parameters).replace(/"type":"([a-z]+)"/g, (_m, p1) => `"type":"${p1.toUpperCase()}"`)) 
                        : undefined
                })) 
                : payload.tools
        }] : undefined
    };

    if (isLegacy) {
        return { ...baseConfig, responseModalities: [Modality.AUDIO] };
    }

    let voiceName = "aoede";
    if (payload.avatarMode === 'heygen') {
        voiceName = "aoede";
    } else if (payload.google1PVoiceName) {
        voiceName = payload.google1PVoiceName.toLowerCase();
    } else if (payload.google1PAvatarName) {
        switch (payload.google1PAvatarName.toLowerCase()) {
            case 'paul':
                voiceName = 'charon';
                break;
            case 'vera':
                voiceName = 'aoede';
                break;
            case 'kai':
                voiceName = 'puck';
                break;
            case 'jay':
                voiceName = 'alnilam';
                break;
            default:
                voiceName = 'aoede';
        }
    }

    const speechConfig = { 
        languageCode: payload.voiceLanguageCode || "en-GB",
        voiceConfig: { prebuiltVoiceConfig: { voiceName } } 
    };

    // MODALITY: GOOGLE 1P AVATAR
    if (payload.avatarMode === 'google_1p') {
        let avatarName = payload.google1PAvatarName || "Jay";
        avatarName = avatarName.charAt(0).toUpperCase() + avatarName.slice(1).toLowerCase();
        return {
            ...baseConfig,
            speechConfig,
            responseModalities: [Modality.VIDEO],
            outputAudioTranscription: {},
            inputAudioTranscription: {},
            avatarConfig: {
                avatarName: avatarName
            }
        };
    }

    // MODALITY: VOICE ONLY OR HEYGEN (AUDIO ONLY)
    const standardConfig: LiveConnectConfig = {
        ...baseConfig,
        speechConfig,
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        inputAudioTranscription: {},
    };

    // Vertex AI currently rejects realtimeInputConfig, contextWindowCompression, and thinkingConfig
    // with a 1007 Invalid Argument. We must send a stripped-down config.
    if (payload.useVertexAI) {
        return standardConfig;
    }

    return {
        ...standardConfig,
        realtimeInputConfig: {
            automaticActivityDetection: {
                startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
                endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH,
                silenceDurationMs: payload.vadSilenceDurationMs ?? 400,
            },
            turnCoverage: TurnCoverage.TURN_INCLUDES_ALL_INPUT,
        },
        contextWindowCompression: {
            triggerTokens: "100000",
            slidingWindow: {
                targetTokens: "80000"
            }
        }
    };
};

self.onmessage = async (event) => {
    const { type, payload } = event.data;

    switch (type) {
        case 'INITIALIZE':
            try {
                modelName = payload.modelName;
                isLegacy = isLegacyProtocol(modelName);
                isIgnoringTrailingChunks = false;
                hasLoggedFirstAudioChunk = false;

                // SECURE BACKEND PROXY CONNECTION
                // If using Vertex AI, we connect to our local Go proxy instead of Google directly.
                // This allows the backend to handle authentication (ADC/OAuth) securely.
                const aiConfig: GoogleGenAIOptions = {
                    apiKey: payload.useVertexAI ? 'proxy' : (payload.apiKey || 'dummy'),
                    ...(payload.useVertexAI && {
                        vertexai: true,
                        httpOptions: {
                            // Point the SDK to our local Go backend proxy endpoint
                            baseUrl: `${self.location.origin}/api/live-avatar`,
                        }
                    })
                };

                // Monkey-patch WebSocket to inject the token cleanly after the SDK constructs the full URL
                if (payload.useVertexAI && payload.authToken) {
                    const OriginalWebSocket = globalThis.WebSocket;
                    globalThis.WebSocket = class extends OriginalWebSocket {
                        constructor(url: string | URL, protocols?: string | string[]) {
                            let wsUrl = url.toString();
                            // Append the token properly to the final URL
                            if (wsUrl.includes('/api/live-avatar') && !wsUrl.includes('token=')) {
                                const separator = wsUrl.includes('?') ? '&' : '?';
                                wsUrl = wsUrl + separator + 'token=' + encodeURIComponent(payload.authToken!);
                            }
                            super(wsUrl, protocols);
                        }
                    };
                }

                const ai = new GoogleGenAI(aiConfig);
                
                // If using Vertex mode via proxy, we must manually bypass the SDK's 
                // internal client-side project/location checks which would otherwise 
                // throw "Vertex AI project based authentication is not supported on browser runtimes".
                if (payload.useVertexAI) {
                    const patchedAi = ai as unknown as import('@google/genai').GoogleGenAIPatch;
                    patchedAi.apiClient.isVertexAI = () => true;
                    patchedAi.apiClient.getProject = () => payload.vertexProject || "proxy";
                    patchedAi.apiClient.getLocation = () => payload.vertexLocation || "proxy";
                }

                const config = buildLiveConnectConfig(payload);

                const connectParams = {
                    model: modelName,
                    config: config,
                    
                    callbacks: {
                        onopen: () => {
                            console.log('[NetworkWorker] Socket opened');
                        },
                        onclose: (event: CloseEvent) => {
                            console.log(`[NetworkWorker] Socket closed. Code: ${event?.code}, Reason: ${event?.reason}`);
                            workerPostMessage({ type: 'STATE_CHANGE', payload: 'disconnected', code: event?.code, reason: event?.reason });
                        },
                        onmessage: (msg: LiveServerMessage) => handleMessage(msg),
                        onerror: (err: unknown) => {
                            console.error('[NetworkWorker] SDK Error:', err);
                            workerPostMessage({ type: 'STATE_CHANGE', payload: 'error', error: String(err) });
                        }
                    }
                };

                session = await ai.live.connect(connectParams);

                // Note: WebSocket monitoring is currently disabled as the SDK doesn't expose the raw WS
                // easily when using the high-level ai.live.connect interface.

                workerPostMessage({ type: 'STATE_CHANGE', payload: 'connected' });
            } catch (err: unknown) {
                console.error('[NetworkWorker] Connection failed:', err);
                workerPostMessage({ type: 'STATE_CHANGE', payload: 'error', error: err instanceof Error ? err.message : String(err) });
            }
            break;

        case 'SEND_AUDIO':
            if (session) {
                if (!hasLoggedFirstAudioChunk) {
                    console.log('[NetworkWorker] Forwarding first audio chunk to Gemini');
                    hasLoggedFirstAudioChunk = true;
                }
                session.sendRealtimeInput({ 
                    audio: { 
                        data: arrayBufferToBase64(payload as ArrayBuffer), 
                        mimeType: 'audio/pcm;rate=16000' 
                    }
                });
            }
            break;

        case 'SEND_TEXT':
            if (session) {
                session.sendRealtimeInput({ 
                    text: payload
                });
            }
            break;

        case 'TOOL_RESPONSE':
            if (session) {
                const respObj = (payload.result && typeof payload.result === 'object') ? (payload.result as Record<string, unknown>) : {};
                session.sendToolResponse({ 
                    functionResponses: [{ 
                        id: payload.id, 
                        name: payload.toolName,
                        response: respObj
                    }] 
                });


            }
            break;

        case 'START_LATENCY_TIMER':
            // Use the compensated timestamp from the main thread as the start of AI processing
            telemetry.setTimer('aiProcessingLatency', payload);
            break;

        case 'DISCONNECT':
            if (session) {
                session.close();
                session = null;
            }
            workerPostMessage({ type: 'STATE_CHANGE', payload: 'disconnected' });
            break;
    }
};

const handleMessage = (msg: LiveServerMessage) => {
    try {
      let isInterruptedInThisMessage = false;
      if (msg.serverContent?.interrupted) {
        isIgnoringTrailingChunks = true;
        isInterruptedInThisMessage = true;
        workerPostMessage({ type: 'INTERRUPTED' });
      }

      if (msg.serverContent?.inputTranscription) {
        isIgnoringTrailingChunks = false;
        workerPostMessage({ 
            type: 'TRANSCRIPTION', 
            payload: { 
                text: msg.serverContent.inputTranscription.text, 
                type: 'input',
                finished: msg.serverContent.inputTranscription.finished
            } 
        });
      }

      if (msg.serverContent?.modelTurn?.parts) {
        if (!isInterruptedInThisMessage) {
            const hasNewTurnIndicator = msg.serverContent.modelTurn.parts.some(p => p.text || p.functionCall);
            if (hasNewTurnIndicator) {
                isIgnoringTrailingChunks = false;
            }
        }

        msg.serverContent.modelTurn.parts.forEach((part) => {
          if (part.inlineData?.data) {
            // DEFENSIVE FIX: Resolve "Trailing Interruption" Race Condition.
            // If we've been interrupted, discard any further chunks until the turn is complete.
            if (isIgnoringTrailingChunks) return;

            const base64Data = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || '';

            if (mimeType.startsWith('audio/')) {
                // Background decoding: Base64 -> Int16 -> Float32
                const binaryString = atob(base64Data);
                const uint8Array = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    uint8Array[i] = binaryString.charCodeAt(i);
                }
                const pcmData = new Int16Array(uint8Array.buffer);
                const floatData = new Float32Array(pcmData.length);
                for (let i = 0; i < pcmData.length; i++) {
                    floatData[i] = pcmData[i] / 32768.0;
                }

                workerPostMessage({ 
                    type: 'AUDIO_DATA', 
                    payload: {
                        base64: base64Data,
                        buffer: floatData.buffer
                    } 
                }, [floatData.buffer]);
            } else if (mimeType.startsWith('video/') || mimeType === '') {
                // Forward raw base64 video chunks (MP4 segments) to the main thread for mpegts.js
                workerPostMessage({ 
                    type: 'VIDEO_DATA', 
                    payload: base64Data
                });
            }
          }
          if (part.text) {
              workerPostMessage({
                  type: 'TRANSCRIPTION',
                  payload: {
                      text: part.text,
                      type: 'output'
                  }
              });
          }
          if (part.functionCall) {
            processToolCall(
                part.functionCall.name || '', 
                (part.functionCall.args as Record<string, unknown>) || {}, 
                part.functionCall.id || ''
            );
          }
        });
      }

      if (msg.toolCall?.functionCalls) {
        msg.toolCall.functionCalls.forEach((call) => {
          processToolCall(
              call.name || '',
              (call.args as Record<string, unknown>) || {},
              call.id || call.name || ''
          );
        });
      }

      if (msg.serverContent?.turnComplete) {
        isIgnoringTrailingChunks = false;
        hasLoggedFirstAudioChunk = false;
        workerPostMessage({ type: 'TURN_COMPLETE' });
      }

      if (msg.serverContent?.outputTranscription) {
          workerPostMessage({ 
            type: 'TRANSCRIPTION', 
            payload: { 
                text: msg.serverContent.outputTranscription.text, 
                type: 'output',
                finished: msg.serverContent.outputTranscription.finished
            } 
        });
      }

      // Capture usage metadata if available (usually at end of turn)
      if (msg.usageMetadata) {
          const metadata = msg.usageMetadata as Record<string, unknown>;
          const inputTokens = msg.usageMetadata.promptTokenCount ?? (metadata.prompt_token_count as number | undefined);
          const outputTokens = msg.usageMetadata.responseTokenCount ?? 
                               (metadata.candidatesTokenCount as number | undefined) ?? 
                               (metadata.response_token_count as number | undefined) ?? 
                               (metadata.candidates_token_count as number | undefined);
          const totalTokens = msg.usageMetadata.totalTokenCount ?? (metadata.total_token_count as number | undefined);

          if (inputTokens !== undefined) {
              workerPostMessage({
                  type: 'TELEMETRY',
                  payload: {
                      key: 'inputTokens',
                      value: inputTokens
                  }
              });
          }
          if (outputTokens !== undefined) {
              workerPostMessage({
                  type: 'TELEMETRY',
                  payload: {
                      key: 'outputTokens',
                      value: outputTokens
                  }
              });
          }
          if (totalTokens !== undefined) {
              workerPostMessage({
                  type: 'TELEMETRY',
                  payload: {
                      key: 'totalTokens',
                      value: totalTokens
                  }
              });
          }
      }

    } catch (err) {
      console.error('[NetworkWorker] Error handling message:', err);
    }
}
