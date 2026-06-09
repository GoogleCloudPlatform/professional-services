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

import { useCallback, useRef, useEffect } from 'react';
import { GeminiLiveApi } from '../services/geminiLiveApi';
import type { IGeminiLiveClient, ToolCall } from '../services/geminiLiveApi';
import { type ConfigResponse } from '../api/config';
import type { NumericTelemetryMetric } from '../types/telemetry';
import { type LiveServerMessage } from '@google/genai';
import { liveServiceConfiguration } from '../resources/live_service_configuration';

export interface UseGeminiSocketOptions {
  apiRef: React.MutableRefObject<IGeminiLiveClient | null>;
  config: ConfigResponse | undefined;
  mcpTools: import('../api/tools').MCPTool[];
  onAudioReceived: (payload: { base64: string; buffer: ArrayBuffer }) => void;
  onVideoReceived?: (payload: { base64: string; mimeType: string }) => void;
  onToolCall: (toolCall: ToolCall) => void;
  onTranscription: (transcription: { text: string; type: 'input' | 'output'; finished?: boolean }) => void;
  onInterrupted: () => void;
  onStateChange: (state: 'connected' | 'disconnected' | 'error' | 'connecting') => void;
  onError?: (message: string) => void;
  onTurnComplete: () => void;
  onTelemetry: (key: NumericTelemetryMetric, val: number, meta?: unknown) => void;
  resumptionHandle?: string | null;
  onResumptionHandleUpdate?: (handle: string | null) => void;
}

export function useGeminiSocket({
  apiRef,
  config,
  mcpTools,
  onAudioReceived,
  onVideoReceived,
  onToolCall,
  onTranscription,
  onInterrupted,
  onStateChange,
  onError,
  onTurnComplete,
  onTelemetry,
  resumptionHandle,
  onResumptionHandleUpdate
}: UseGeminiSocketOptions) {
  const connectIdRef = useRef<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const resumptionHandleRef = useRef<string | null>(resumptionHandle || null);
  const isIgnoringTrailingChunksRef = useRef<boolean>(false);

  useEffect(() => {
    resumptionHandleRef.current = resumptionHandle || null;
  }, [resumptionHandle]);

  const callbacksRef = useRef({
    onAudioReceived,
    onVideoReceived,
    onToolCall,
    onTranscription,
    onInterrupted,
    onStateChange,
    onError,
    onTurnComplete,
    onTelemetry,
    onResumptionHandleUpdate
  });

  useEffect(() => {
    callbacksRef.current = {
      onAudioReceived,
      onVideoReceived,
      onToolCall,
      onTranscription,
      onInterrupted,
      onStateChange,
      onError,
      onTurnComplete,
      onTelemetry,
      onResumptionHandleUpdate
    };
  });

  const connectToSocketRef = useRef<(() => Promise<IGeminiLiveClient | null>) | null>(null);

  const connectToSocket = useCallback(async () => {
    const currentConnectId = ++connectIdRef.current;
    const isCurrent = () => currentConnectId === connectIdRef.current;

    // Clear any pending reconnects
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (!config) {
      callbacksRef.current.onStateChange('error');
      return null;
    }

    // 1. DIRECT WEBSOCKET PROXY BYPASS FOR GOOGLE 1P AVATAR MODE
    if (config.avatar_mode === 'google_1p') {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/ws-proxy`;

        callbacksRef.current.onStateChange('connecting');
        console.log('[useGeminiSocket] Connecting to proxy:', wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[useGeminiSocket] Proxy WebSocket opened');
          isIgnoringTrailingChunksRef.current = false;
          if (!isCurrent()) {
            ws.close();
            return;
          }
          
          callbacksRef.current.onStateChange('connected');
          retryCountRef.current = 0; // Reset retry count on successful connection

          // Send setup message
          let voiceName: string | undefined;
          if (config?.avatar_mode === 'heygen') {
            voiceName = 'Aoede';
          } else if (config?.google_1p_voice_name) {
            voiceName = config.google_1p_voice_name;
          }

          const setupMessage = {
            setup: {
              model: liveServiceConfiguration.model || 'publishers/google/models/gemini-live-2.5-flash-native-audio',
              generationConfig: {
                speechConfig: voiceName ? {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: voiceName
                    }
                  }
                } : liveServiceConfiguration.generationConfig?.speechConfig,
                responseModalities: ["VIDEO"],
              },
              outputAudioTranscription: {},
              inputAudioTranscription: {},
              systemInstruction: { parts: [{ text: config.system_prompt || "You are a helpful assistant." }] },
              tools: mcpTools.length > 0 ? [{ 
                functionDeclarations: mcpTools.map(t => ({ 
                  name: t.name, 
                  description: t.description, 
                  // Vertex AI Live API requires JSON Schema types to be UPPERCASE
                  parameters: t.inputSchema ? JSON.parse(JSON.stringify(t.inputSchema).replace(/"type":"([a-z]+)"/g, (_m, p1) => `"type":"${p1.toUpperCase()}"`)) : undefined 
                })) 
              }] : [],
              avatarConfig: {
                ...liveServiceConfiguration.avatarConfig,
                avatarName: config.google_1p_avatar_name || liveServiceConfiguration.avatarConfig?.avatarName || 'Piper',
              },
              // Enable session resumption
              sessionResumption: resumptionHandleRef.current ? { handle: resumptionHandleRef.current } : {}
            }
          };
          
          if (resumptionHandleRef.current) {
            console.log('[useGeminiSocket] Resuming session with handle:', resumptionHandleRef.current);
          } else {
            console.log('[useGeminiSocket] Starting new session with resumption enabled');
          }
          
          ws.send(JSON.stringify(setupMessage));
        };

        ws.onmessage = async (event) => {
          if (!isCurrent()) return;

          let message: LiveServerMessage;
          try {
              let text: string;
              if (event.data instanceof Blob) {
                  text = await event.data.text();
              } else {
                  text = event.data;
              }
              message = JSON.parse(text);
          } catch (e) {
              console.error('[useGeminiSocket] Failed to parse message', e);
              return;
          }

          // Handle session resumption updates
          // Note: SessionResumptionUpdate is part of the LiveServerMessage in the latest SDKs
          const resumptionUpdate = (message as { sessionResumptionUpdate?: { newHandle: string } }).sessionResumptionUpdate;
          if (resumptionUpdate?.newHandle) {
            console.log('[useGeminiSocket] Received new session handle:', resumptionUpdate.newHandle);
            callbacksRef.current.onResumptionHandleUpdate?.(resumptionUpdate.newHandle);
          }

          let isInterruptedInThisMessage = false;
          if (message.serverContent?.interrupted) {
            isIgnoringTrailingChunksRef.current = true;
            isInterruptedInThisMessage = true;
            callbacksRef.current.onInterrupted();
          }

          if (message.serverContent?.inputTranscription) {
            isIgnoringTrailingChunksRef.current = false;
            const tx = message.serverContent.inputTranscription as unknown as { text: string; finished: boolean };
            if (tx.text) {
              callbacksRef.current.onTranscription({ text: tx.text, type: 'input', finished: tx.finished });
            }
          }

          if (message.serverContent?.outputTranscription) {
            const tx = message.serverContent.outputTranscription as unknown as { text: string; finished: boolean };
            if (tx.text) {
              callbacksRef.current.onTranscription({ text: tx.text, type: 'output', finished: tx.finished });
            }
          }

          if (message.serverContent?.modelTurn?.parts) {
            if (!isInterruptedInThisMessage) {
                const hasNewTurnIndicator = message.serverContent.modelTurn.parts.some(p => p.text || p.functionCall);
                if (hasNewTurnIndicator) {
                    if (isIgnoringTrailingChunksRef.current) {
                        console.warn('[useGeminiSocket][RED-HANDED] Resuming chunks - New turn indicator received.');
                    }
                    isIgnoringTrailingChunksRef.current = false;
                }
            }

            for (const part of message.serverContent.modelTurn.parts) {
              if (part.inlineData?.data) {
                const base64Data = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || '';

                if (mimeType.startsWith('video/') || mimeType.startsWith('image/') || mimeType === '') {
                  // NEVER drop video chunks, even during interruption. 
                  // Dropping fMP4 chunks breaks the sequence decoder and causes fatal playback freezes.
                  callbacksRef.current.onVideoReceived?.({
                    base64: base64Data,
                    mimeType: mimeType || 'video/mp4'
                  });
                } else if (mimeType.startsWith('audio/')) {
                  if (isIgnoringTrailingChunksRef.current) {
                      // console.warn('[useGeminiSocket][RED-HANDED] Dropping trailing audio chunk');
                      continue;
                  }
                  try {
                    const res = await fetch(`data:application/octet-stream;base64,${base64Data}`);
                    const buffer = await res.arrayBuffer();
                    callbacksRef.current.onAudioReceived({
                        base64: base64Data,
                        buffer: buffer
                    });
                  } catch (e) {
                    console.error('[useGeminiSocket] Error decoding audio:', e);
                  }
                }
              }
              if (part.functionCall) {
                callbacksRef.current.onToolCall({
                  functionCall: {
                    name: part.functionCall.name || '',
                    args: (part.functionCall.args as Record<string, unknown>) || {},
                    id: part.functionCall.id || part.functionCall.name || ''
                  }
                });
              }
              if (part.text) {
                callbacksRef.current.onTranscription({ text: part.text, type: 'output' });
              }
            }
          }

          if (message.toolCall?.functionCalls) {
            message.toolCall.functionCalls.forEach((call) => {
              callbacksRef.current.onToolCall({
                functionCall: {
                  name: call.name || '',
                  args: (call.args as Record<string, unknown>) || {},
                  id: call.id || call.name || ''
                }
              });
            });
          }

          if (message.serverContent?.turnComplete) {
            isIgnoringTrailingChunksRef.current = false;
            callbacksRef.current.onTurnComplete();
          }

          // Capture usage metadata if available (usually at end of turn)
          if (message.usageMetadata) {
            const metadata = message.usageMetadata as Record<string, unknown>;
            const inputTokens = message.usageMetadata.promptTokenCount ?? (metadata.prompt_token_count as number | undefined);
            const outputTokens = message.usageMetadata.responseTokenCount ?? 
                                 (metadata.candidatesTokenCount as number | undefined) ?? 
                                 (metadata.response_token_count as number | undefined) ?? 
                                 (metadata.candidates_token_count as number | undefined);
            const totalTokens = message.usageMetadata.totalTokenCount ?? (metadata.total_token_count as number | undefined);

            if (inputTokens !== undefined) {
              callbacksRef.current.onTelemetry('inputTokens', inputTokens);
            }
            if (outputTokens !== undefined) {
              callbacksRef.current.onTelemetry('outputTokens', outputTokens);
            }
            if (totalTokens !== undefined) {
              callbacksRef.current.onTelemetry('totalTokens', totalTokens);
            }
          }
        };

        ws.onerror = (err) => {
          console.error('[useGeminiSocket] WebSocket Error:', err);
          if (isCurrent()) {
            callbacksRef.current.onStateChange('error');
          }
        };

        ws.onclose = (e) => {
          console.log(`[useGeminiSocket] WebSocket closed: ${e.code} ${e.reason}`);
          if (!isCurrent()) return;

          callbacksRef.current.onStateChange('disconnected');

          // Auto-reconnect logic for non-normal closures
          // 1011 (Internal Error), 1006 (Abnormal Closure), 1005 (No Status)
          if (e.code !== 1000 && e.code !== 1001) {
            if (e.reason === 'Auth failure' || retryCountRef.current >= 3) {
              const msg = e.reason === 'Auth failure' 
                ? 'Authentication expired. Please run "make auth" in your terminal to continue.'
                : 'Connection failed after multiple retries.';
              callbacksRef.current.onError?.(msg);
              callbacksRef.current.onStateChange('error');
              return;
            }

            const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000); // Exponential backoff max 10s
            console.warn(`[useGeminiSocket] Unexpected disconnect. Retrying in ${delay}ms... (Attempt ${retryCountRef.current + 1})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              retryCountRef.current++;
              connectToSocketRef.current?.();
            }, delay);
          }
        };

        const apiWrapper: IGeminiLiveClient = {
          disconnect: () => {
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            ws.close(1000, 'Manual disconnect');
          },
          sendAudioChunk: (data: ArrayBuffer) => {
            const bytes = new Uint8Array(data);
            let binary = '';
            const chunkSize = 8192;
            for (let i = 0; i < bytes.length; i += chunkSize) {
                binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
            }
            const base64Audio = btoa(binary);
            ws.send(JSON.stringify({
                realtimeInput: {
                    mediaChunks: [{ data: base64Audio, mimeType: 'audio/pcm;rate=16000' }]
                }
            }));
          },
          sendTextMessage: (text: string) => {
            ws.send(JSON.stringify({
                clientContent: {
                    turns: [{
                        role: 'user',
                        parts: [{ text }]
                    }],
                    turnComplete: true
                }
            }));
          },
          sendToolResponse: (toolName: string, id: string, response: unknown) => {
            const respObj = (response && typeof response === 'object') ? (response as Record<string, unknown>) : {};
            ws.send(JSON.stringify({
                toolResponse: {
                    functionResponses: [{
                        name: toolName,
                        id: id,
                        response: respObj
                    }],
                }
            }));
          },
          setSilenceTimestamp: () => {
            // Telemetry placeholder
          }
        };

        apiRef.current = apiWrapper;
        return apiWrapper;

      } catch (err) {
        console.error('[useGeminiSocket] Connection failed', err);
        if (isCurrent()) {
          callbacksRef.current.onStateChange('error');
        }
        return null;
      }
    }

    // 2. STANDARD WORKER-BASED API FOR ALL OTHER MODES
    const api = new GeminiLiveApi({
      apiKey: config.live_api_key,
      modelName: config.model_name,
      systemPrompt: config.system_prompt || "You are a helpful assistant.",
      mcpTools,
      useVertexAI: config.use_vertex_ai,
      vertexProject: config.vertex_project_id,
      vertexLocation: config.vertex_location,
      avatarMode: config.avatar_mode,
      google1PAvatarName: config.google_1p_avatar_name,
      google1PVoiceName: config.google_1p_voice_name,
      vadSilenceDurationMs: config.vad_silence_duration_ms,
      onAudioReceived: (p) => { if (isCurrent()) callbacksRef.current.onAudioReceived(p); },
      onVideoReceived: (v) => { 
        if (isCurrent()) callbacksRef.current.onVideoReceived?.({ base64: v, mimeType: 'video/mp4' }); 
      },
      onToolCall: (tc) => { if (isCurrent()) callbacksRef.current.onToolCall(tc); },
      onTranscription: (tr) => { if (isCurrent()) callbacksRef.current.onTranscription(tr); },
      onInterrupted: () => { if (isCurrent()) callbacksRef.current.onInterrupted(); },
      onStateChange: (state) => { if (isCurrent()) callbacksRef.current.onStateChange(state); },
      onTurnComplete: () => { if (isCurrent()) callbacksRef.current.onTurnComplete(); },
      onTelemetry: (key, val, meta) => { if (isCurrent()) callbacksRef.current.onTelemetry(key, val, meta); }
    });
    
    apiRef.current = api;
    
    try {
      await api.connect();
      if (!isCurrent()) {
        api.disconnect();
        return null;
      }
      return api;
    } catch {
      if (isCurrent()) {
        callbacksRef.current.onStateChange('error');
      }
      return null;
    }
  }, [apiRef, config, mcpTools]);

  useEffect(() => {
    connectToSocketRef.current = connectToSocket;
  }, [connectToSocket]);

  const disconnectSocket = useCallback(() => {
    connectIdRef.current++;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (apiRef.current) {
      apiRef.current.disconnect();
      apiRef.current = null;
    }
    callbacksRef.current.onStateChange('disconnected');
  }, [apiRef]);

  return { connectToSocket, disconnectSocket };
}