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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Mocks ---
const mockSendRealtimeInput = vi.fn();
const mockSendToolResponse = vi.fn();
const mockConnect = vi.fn().mockResolvedValue({ 
    close: vi.fn(),
    sendRealtimeInput: mockSendRealtimeInput,
    sendToolResponse: mockSendToolResponse
});
const mockGoogleGenAIConstructor = vi.fn();

vi.mock('@google/genai', () => {
    class MockGoogleGenAI {
        public live = { connect: mockConnect };
        public apiClient = { isVertexAI: vi.fn(), getProject: vi.fn(), getLocation: vi.fn() };
        constructor(...args: unknown[]) {
            mockGoogleGenAIConstructor(...args);
        }
    }
    return {
        GoogleGenAI: MockGoogleGenAI,
        Modality: { AUDIO: 'AUDIO', VIDEO: 'VIDEO' },
        ThinkingLevel: { MINIMAL: 'MINIMAL' },
        StartSensitivity: { START_SENSITIVITY_HIGH: 'START_SENSITIVITY_HIGH' },
        EndSensitivity: { END_SENSITIVITY_HIGH: 'END_SENSITIVITY_HIGH' },
        TurnCoverage: { TURN_INCLUDES_ALL_INPUT: 'TURN_INCLUDES_ALL_INPUT' },
    };
});

// We need a specific type for our mocked global to avoid `any`
interface MockGlobal {
    postMessage: ReturnType<typeof vi.fn>;
    WebSocket: unknown;
    onmessage: ((event: { data: { type: string; payload: Record<string, unknown> } }) => Promise<void>) | null;
    location: {
        origin: string;
    }
}

const mockPostMessage = vi.fn();
const mockGlobal: MockGlobal = {
    postMessage: mockPostMessage,
    WebSocket: vi.fn(),
    onmessage: null,
    location: {
        origin: 'http://localhost:3000'
    }
};

describe('NetworkWorker Initialization & Vertex AI Routing', () => {
    let OriginalWebSocket: unknown;

    beforeEach(async () => {
        vi.clearAllMocks();
        
        OriginalWebSocket = globalThis.WebSocket;
        
        // Setup the mock environment for the worker script to execute within
        Object.defineProperty(globalThis, 'self', { value: mockGlobal, writable: true });
        Object.defineProperty(globalThis, 'postMessage', { value: mockPostMessage, writable: true });

        // Dynamically import the worker to ensure it binds to our fresh mocks
        await import('./networkWorker');
    });

    afterEach(() => {
        globalThis.WebSocket = OriginalWebSocket as typeof WebSocket;
        vi.resetModules();
    });

    const triggerInitialize = async (payloadOverrides: Record<string, unknown> = {}) => {
        const basePayload = {
            modelName: 'gemini-live-2.5-flash-native-audio',
            apiKey: 'test-api-key',
            systemPrompt: 'You are a test assistant',
            tools: [],
            useVertexAI: false,
            vertexProject: '',
            vertexLocation: '',
            avatarMode: 'none',
            ...payloadOverrides
        };

        if (mockGlobal.onmessage) {
            await mockGlobal.onmessage({
                data: {
                    type: 'INITIALIZE',
                    payload: basePayload
                }
            } as MessageEvent);
        }
    };

    describe('Developer API (Standard) Connection', () => {
        it('should initialize GoogleGenAI with only apiKey', async () => {
            await triggerInitialize({ useVertexAI: false, apiKey: 'test-api-key' });

            expect(mockGoogleGenAIConstructor).toHaveBeenCalledWith({
                apiKey: 'test-api-key'
            });
        });
    });

    describe('Vertex AI Proxy Connection', () => {
        it('should initialize GoogleGenAI with proxy baseUrl when using Vertex AI', async () => {
            await triggerInitialize({ useVertexAI: true, apiKey: 'test-api-key' });

            expect(mockGoogleGenAIConstructor).toHaveBeenCalledWith({
                apiKey: 'proxy',
                vertexai: true,
                httpOptions: {
                    baseUrl: 'http://localhost:3000/api/live-avatar'
                }
            });
        });

        it('should use the raw model name and let the proxy handle qualification', async () => {
             await triggerInitialize({
                useVertexAI: true,
                modelName: 'publishers/google/models/gemini-live-2.5-flash-native-audio',
                vertexProject: 'vibe-coding-test-demart',
                vertexLocation: 'us-central1'
            });

            const connectArgs = mockConnect.mock.calls[0][0] as { model: string; };

            expect(connectArgs.model).toBe('publishers/google/models/gemini-live-2.5-flash-native-audio');
        });
    });

    describe('Modality and Protocol Selection', () => {
        it('should use VIDEO modality and avatarConfig for 1P Avatar', async () => {
            await triggerInitialize({
                avatarMode: 'google_1p',
                useVertexAI: true
            });

            const connectArgs = mockConnect.mock.calls[0][0] as { model: string; config: { responseModalities: string[]; avatarConfig: { avatarName: string } }; }; 

            expect(connectArgs.config.responseModalities).toContain('VIDEO');
            expect(connectArgs.config.avatarConfig).toEqual({ avatarName: 'Jay' });
        });

        it('should use modern AUDIO configuration for 2.5 models on Developer API', async () => {
            await triggerInitialize({
                modelName: 'publishers/google/models/gemini-live-2.5-flash-native-audio',
                useVertexAI: false
            });

            const connectArgs = mockConnect.mock.calls[0][0] as { model: string; config: { realtimeInputConfig: unknown; contextWindowCompression: unknown; responseModalities: unknown; tools: Array<{ functionDeclarations: Array<{ parameters: { type: string, properties: Record<string, { type: string }> } }> }>; }; callbacks: { onmessage: (msg: unknown) => void; }; };

            expect(connectArgs.config!.realtimeInputConfig).toBeDefined();
            expect(connectArgs.config!.contextWindowCompression).toBeDefined();
        });

        it('should strip advanced configurations for 2.5 models on Vertex AI proxy to prevent upstream rejection', async () => {
            await triggerInitialize({
                modelName: 'publishers/google/models/gemini-live-2.5-flash-native-audio',
                useVertexAI: true
            });

            const connectArgs = mockConnect.mock.calls[0][0] as { model: string; config: { realtimeInputConfig: unknown; contextWindowCompression: unknown; responseModalities: unknown; tools: Array<{ functionDeclarations: Array<{ parameters: { type: string, properties: Record<string, { type: string }> } }> }>; }; callbacks: { onmessage: (msg: unknown) => void; }; };

            expect(connectArgs.config!.realtimeInputConfig).toBeUndefined();
            expect(connectArgs.config!.contextWindowCompression).toBeUndefined();
            expect(connectArgs.config!.responseModalities).toBeDefined();
        });
        
        it('should use legacy configuration for 1.5 models', async () => {
            await triggerInitialize({
                modelName: 'gemini-1.5-pro'
            });

            const connectArgs = mockConnect.mock.calls[0][0] as { model: string; config: { realtimeInputConfig: unknown; contextWindowCompression: unknown; responseModalities: unknown; tools: Array<{ functionDeclarations: Array<{ parameters: { type: string, properties: Record<string, { type: string }> } }> }>; }; callbacks: { onmessage: (msg: unknown) => void; }; };

            expect(connectArgs.config!.realtimeInputConfig).toBeUndefined();
            expect(connectArgs.config!.contextWindowCompression).toBeUndefined();
        });

        it('should map google1PAvatarName to correct voice in Voice-Only mode (avatarMode = none)', async () => {
            await triggerInitialize({
                avatarMode: 'none',
                google1PAvatarName: 'Paul'
            });

            const connectArgs = mockConnect.mock.calls[0][0] as { model: string; config: { speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: string } } } } };
            
            expect(connectArgs.config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('charon');
        });

        it('should map Jay to Alnilam in Voice-Only mode', async () => {
            await triggerInitialize({
                avatarMode: 'none',
                google1PAvatarName: 'Jay'
            });

            const connectArgs = mockConnect.mock.calls[0][0] as { model: string; config: { speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: string } } } } };
            
            expect(connectArgs.config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('alnilam');
        });
    });

    describe('Outbound message handling (v2.2.0 Protocol)', () => {
        it('should use sendRealtimeInput for audio data', async () => {
            await triggerInitialize();
            
            const buffer = new Uint8Array([104, 105]).buffer; 

            if (mockGlobal.onmessage) {
                await mockGlobal.onmessage({
                    data: {
                        type: 'SEND_AUDIO',
                        payload: buffer
                    }
                } as MessageEvent);
            }

            expect(mockSendRealtimeInput).toHaveBeenCalledWith({
                audio: {
                    data: btoa('hi'),
                    mimeType: 'audio/pcm;rate=16000'
                }
            });
        });

        it('should use sendRealtimeInput for text data', async () => {
            await triggerInitialize();
            
            if (mockGlobal.onmessage) {
                await mockGlobal.onmessage({
                    data: {
                        type: 'SEND_TEXT',
                        payload: 'Hello Gemini'
                    }
                } as MessageEvent);
            }

            expect(mockSendRealtimeInput).toHaveBeenCalledWith({
                text: 'Hello Gemini'
            });
        });

        it('should use sendToolResponse for function results', async () => {
            await triggerInitialize();
            
            if (mockGlobal.onmessage) {
                await mockGlobal.onmessage({
                    data: {
                        type: 'TOOL_RESPONSE',
                        payload: { id: 'call_123', toolName: 'get_balance', result: { balance: 100 } }
                    }
                } as MessageEvent);
            }

            expect(mockSendToolResponse).toHaveBeenCalledWith({
                functionResponses: [{
                    id: 'call_123',
                    name: 'get_balance',
                    response: { balance: 100 }
                }]
            });
        });
    });

    describe('Race Condition Handling', () => {
        it('should drop trailing media chunks after an interruption until turn is complete', async () => {
            await triggerInitialize();
            const connectArgs = mockConnect.mock.calls[0][0] as { model: string; config: unknown; callbacks: { onmessage: (msg: { serverContent: { interrupted?: boolean; turnComplete?: boolean; modelTurn?: { parts: Array<{ inlineData: { data: string; mimeType: string; } }> } } }) => void; }; };
            const onMessageCallback = connectArgs.callbacks!.onmessage;

            // 1. Receive Interruption
            onMessageCallback({
                serverContent: { interrupted: true }
            });
            expect(mockPostMessage).toHaveBeenCalledWith({ type: 'INTERRUPTED' });
            mockPostMessage.mockClear();

            // 2. Receive a media chunk (should be ignored)
            onMessageCallback({
                serverContent: {
                    modelTurn: {
                        parts: [{ inlineData: { data: 'Y2h1bms=', mimeType: 'video/mp4' } }]
                    }
                }
            });
            expect(mockPostMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'VIDEO_DATA' }));

            // 3. Receive Turn Complete
            onMessageCallback({
                serverContent: { turnComplete: true }
            });
            expect(mockPostMessage).toHaveBeenCalledWith({ type: 'TURN_COMPLETE' });
            mockPostMessage.mockClear();

            // 4. Receive a new media chunk (should be processed)
            onMessageCallback({
                serverContent: {
                    modelTurn: {
                        parts: [{ inlineData: { data: 'YXVkaQ==', mimeType: 'audio/pcm' } }]
                    }
                }
            });
            expect(mockPostMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'AUDIO_DATA' }),
                expect.any(Array)
            );
        });
    });

    describe('Transcription handling', () => {
        it('should dispatch TRANSCRIPTION events for output text from server', async () => {
            await triggerInitialize({ useVertexAI: false, apiKey: 'test-api-key' });
            const connectArgs = mockConnect.mock.calls[0][0] as { model: string; config: { realtimeInputConfig: unknown; contextWindowCompression: unknown; responseModalities: unknown; tools: Array<{ functionDeclarations: Array<{ parameters: { type: string, properties: Record<string, { type: string }> } }> }>; }; callbacks: { onmessage: (msg: unknown) => void; }; };
            const onMessageCallback = connectArgs.callbacks!.onmessage;

            onMessageCallback({
                serverContent: {
                    outputTranscription: { text: 'Hello from model', finished: true }
                }
            });

            expect(mockPostMessage).toHaveBeenCalledWith({
                type: 'TRANSCRIPTION',
                payload: { text: 'Hello from model', type: 'output', finished: true }
            });
        });

        it('should dispatch TRANSCRIPTION events for input text from server', async () => {
            await triggerInitialize({ useVertexAI: false, apiKey: 'test-api-key' });
            const connectArgs = mockConnect.mock.calls[0][0] as { model: string; config: { realtimeInputConfig: unknown; contextWindowCompression: unknown; responseModalities: unknown; tools: Array<{ functionDeclarations: Array<{ parameters: { type: string, properties: Record<string, { type: string }> } }> }>; }; callbacks: { onmessage: (msg: unknown) => void; }; };
            const onMessageCallback = connectArgs.callbacks!.onmessage;

            onMessageCallback({
                serverContent: {
                    inputTranscription: { text: 'Hello from user', finished: false }
                }
            });

            expect(mockPostMessage).toHaveBeenCalledWith({
                type: 'TRANSCRIPTION',
                payload: { text: 'Hello from user', type: 'input', finished: false }
            });
        });
    });
});
