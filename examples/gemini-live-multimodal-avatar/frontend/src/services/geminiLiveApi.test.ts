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

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { GeminiLiveApi } from './geminiLiveApi';

interface MockWorker {
    onmessage: ((ev: MessageEvent) => void) | null;
    postMessage: Mock;
    terminate: Mock;
}

// Mock the worker import string
vi.mock('../workers/networkWorker?worker', () => {
    class MockWorkerClass {
        onmessage: ((ev: MessageEvent) => void) | null = null;
        postMessage = vi.fn();
        terminate = vi.fn();
        constructor() {
            (global as unknown as { lastMockWorker: MockWorkerClass }).lastMockWorker = this;
        }
    }
    return {
        default: MockWorkerClass
    };
});

describe('GeminiLiveApi (Worker Proxy)', () => {
    let onAudioReceived: Mock;
    let onTranscription: Mock;
    let onStateChange: Mock;
    let onToolCall: Mock;
    let onInterrupted: Mock;
    let onTurnComplete: Mock;
    let onTelemetry: Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        onAudioReceived = vi.fn();
        onTranscription = vi.fn();
        onStateChange = vi.fn();
        onToolCall = vi.fn();
        onInterrupted = vi.fn();
        onTurnComplete = vi.fn();
        onTelemetry = vi.fn();
        delete (global as unknown as Record<string, unknown>).lastMockWorker;
    });

    const createApi = () => {
        return new GeminiLiveApi({
            modelName: 'gemini-3.1-flash',
            systemPrompt: 'test',
            mcpTools: [],
            useVertexAI: false,
            onAudioReceived,
            onTranscription,
            onToolCall,
            onInterrupted,
            onStateChange,
            onTurnComplete,
            onTelemetry,
        });
    };

    it('should initialize worker and send INITIALIZE message on connect', async () => {
        const api = createApi();
        await api.connect();

        const worker = (global as unknown as { lastMockWorker: MockWorker }).lastMockWorker;
        expect(worker).toBeDefined();
        expect(worker.postMessage).toHaveBeenCalledWith(expect.objectContaining({
            type: 'INITIALIZE',
            payload: expect.objectContaining({
                modelName: 'gemini-3.1-flash'
            })
        }));
    });

    it('should pass custom settings (voice language code, avatar, voice name) to worker in INITIALIZE payload', async () => {
        const api = new GeminiLiveApi({
            modelName: 'gemini-3.1-flash',
            systemPrompt: 'test',
            mcpTools: [],
            useVertexAI: false,
            google1PAvatarName: 'Paul',
            google1PVoiceName: 'Charon',
            voiceLanguageCode: 'en-GB',
            onAudioReceived,
            onTranscription,
            onToolCall,
            onInterrupted,
            onStateChange,
            onTurnComplete,
            onTelemetry,
        });
        await api.connect();

        const worker = (global as unknown as { lastMockWorker: MockWorker }).lastMockWorker;
        expect(worker).toBeDefined();
        expect(worker.postMessage).toHaveBeenCalledWith(expect.objectContaining({
            type: 'INITIALIZE',
            payload: expect.objectContaining({
                google1PAvatarName: 'Paul',
                google1PVoiceName: 'Charon',
                voiceLanguageCode: 'en-GB'
            })
        }));
    });

    it('should proxy sendAudioChunk to worker', async () => {
        const api = createApi();
        await api.connect();
        const buffer = new ArrayBuffer(10);
        api.sendAudioChunk(buffer);

        const worker = (global as unknown as { lastMockWorker: MockWorker }).lastMockWorker;
        expect(worker.postMessage).toHaveBeenCalledWith(
            { type: 'SEND_AUDIO', payload: buffer },
            [buffer]
        );
    });

    it('should handle incoming messages from worker', async () => {
        const api = createApi();
        await api.connect();
        const worker = (global as unknown as { lastMockWorker: MockWorker }).lastMockWorker;

        const testMessages = [
            { type: 'AUDIO_DATA', payload: 'audio', handler: onAudioReceived },
            { type: 'TRANSCRIPTION', payload: 'text', handler: onTranscription },
            { type: 'STATE_CHANGE', payload: 'connected', handler: onStateChange },
            { type: 'TOOL_CALL', payload: { name: 't' }, handler: onToolCall },
            { type: 'INTERRUPTED', payload: null, handler: onInterrupted },
            { type: 'TURN_COMPLETE', payload: null, handler: onTurnComplete },
        ];

        testMessages.forEach(({ type, payload, handler }) => {
            worker.onmessage!({ data: { type, payload } } as MessageEvent);
            if (payload) {
                expect(handler).toHaveBeenCalledWith(payload);
            } else {
                expect(handler).toHaveBeenCalled();
            }
        });

        // Test TELEMETRY specifically
        worker.onmessage!({ data: { type: 'TELEMETRY', payload: { key: 'k', value: 1 } } } as MessageEvent);
        expect(onTelemetry).toHaveBeenCalledWith('k', 1);
    });

    it('should terminate worker on disconnect', async () => {
        const api = createApi();
        await api.connect();
        const worker = (global as unknown as { lastMockWorker: MockWorker }).lastMockWorker;
        api.disconnect();

        expect(worker.terminate).toHaveBeenCalled();
    });

    it('should proxy other methods to worker', async () => {
        const api = createApi();
        await api.connect();
        const worker = (global as unknown as { lastMockWorker: MockWorker }).lastMockWorker;

        api.sendToolResponse('tool', '1', 'res');
        expect(worker.postMessage).toHaveBeenCalledWith({
            type: 'TOOL_RESPONSE',
            payload: { toolName: 'tool', id: '1', result: 'res' }
        });

        api.sendTextMessage('hi');
        expect(worker.postMessage).toHaveBeenCalledWith({
            type: 'SEND_TEXT',
            payload: 'hi'
        });
    });
});
