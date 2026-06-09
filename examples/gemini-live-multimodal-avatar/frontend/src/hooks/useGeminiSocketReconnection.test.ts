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

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGeminiSocket } from './useGeminiSocket';
import { type ConfigResponse } from '../api/config';

// Mock dependencies
vi.mock('../services/geminiLiveApi');
vi.mock('../resources/live_service_configuration', () => ({
  liveServiceConfiguration: {
    model: 'test-model',
    avatarConfig: { avatarName: 'Piper' }
  }
}));

interface MockWebSocket {
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  readyState: number;
  onopen: () => void;
  onmessage: (event: { data: string }) => void;
  onclose: (event: { code: number; reason?: string }) => void;
  onerror: (err: unknown) => void;
}

describe('useGeminiSocket Reconnection', () => {
  const mockConfig: ConfigResponse = {
    live_api_key: 'test-key',
    model_name: 'test-model',
    system_prompt: 'test prompt',
    use_vertex_ai: false,
    vertex_project_id: 'test-project',
    vertex_location: 'test-location',
    vad_silence_duration_ms: 400,
    avatar_mode: 'google_1p' // Ensure we trigger the Proxy path
  };

  const defaultProps = {
    apiRef: { current: null },
    config: mockConfig,
    mcpTools: [],
    onAudioReceived: vi.fn(),
    onVideoReceived: vi.fn(),
    onToolCall: vi.fn(),
    onTranscription: vi.fn(),
    onInterrupted: vi.fn(),
    onStateChange: vi.fn(),
    onTurnComplete: vi.fn(),
    onTelemetry: vi.fn(),
    resumptionHandle: null as string | null,
    onResumptionHandleUpdate: vi.fn()
  };

  let mockWs: MockWebSocket;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Mock WebSocket using a spy that acts as a constructor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const MockWebSocketSpy = vi.fn().mockImplementation(function(this: any) {
      this.send = vi.fn();
      this.close = vi.fn();
      this.readyState = 1;
      this.onopen = vi.fn();
      this.onmessage = vi.fn();
      this.onerror = vi.fn();
      this.onclose = vi.fn();
       
      mockWs = this as unknown as MockWebSocket;
    });
    (global as unknown as { WebSocket: unknown }).WebSocket = MockWebSocketSpy;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should enable session resumption in the setup message', async () => {
    const { result } = renderHook(() => useGeminiSocket(defaultProps));

    await act(async () => {
      await result.current.connectToSocket();
    });

    // Simulate open
    mockWs.onopen();

    expect(mockWs.send).toHaveBeenCalled();
    const setupMsg = JSON.parse(mockWs.send.mock.calls[0][0]);
    expect(setupMsg.setup.sessionResumption).toEqual({});
  });

  it('should call onResumptionHandleUpdate when session handle is received', async () => {
    const { result } = renderHook(() => useGeminiSocket(defaultProps));

    await act(async () => {
      await result.current.connectToSocket();
    });

    mockWs.onopen();
    
    await act(async () => {
      mockWs.onmessage({ data: JSON.stringify({ sessionResumptionUpdate: { newHandle: 'test-handle-123' } }) });
    });

    expect(defaultProps.onResumptionHandleUpdate).toHaveBeenCalledWith('test-handle-123');
  });

  it('should use provided resumptionHandle for reconnection', async () => {
    const propsWithHandle = {
        ...defaultProps,
        resumptionHandle: 'stored-handle-456'
    };
    const { result } = renderHook(() => useGeminiSocket(propsWithHandle));

    await act(async () => {
      await result.current.connectToSocket();
    });

    mockWs.onopen();
    
    const setupMsg = JSON.parse(mockWs.send.mock.calls[0][0]);
    expect(setupMsg.setup.sessionResumption).toEqual({ handle: 'stored-handle-456' });
  });

  it('should trigger auto-reconnect on unexpected closure', async () => {
    const { result } = renderHook(() => useGeminiSocket(defaultProps));

    await act(async () => {
      await result.current.connectToSocket();
    });

    mockWs.onopen();
    
    // Simulate disconnect (1011 Internal Error)
    await act(async () => {
      mockWs.onclose({ code: 1011, reason: 'Internal Server Error' });
    });

    expect(defaultProps.onStateChange).toHaveBeenCalledWith('disconnected');

    // Advance timers to trigger reconnect
    await act(async () => {
      vi.runAllTimers();
    });

    // Verify new WebSocket created
    expect(global.WebSocket).toHaveBeenCalledTimes(2);
  });
});
