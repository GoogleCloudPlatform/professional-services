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

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGeminiSocket } from './useGeminiSocket';
import { GeminiLiveApi } from '../services/geminiLiveApi';
import { type ConfigResponse } from '../api/config';

// Mock dependencies
vi.mock('../services/geminiLiveApi');
vi.mock('../api/config', () => ({
}));

describe('useGeminiSocket', () => {
  const mockConfig: ConfigResponse = {
    live_api_key: 'test-key',
    model_name: 'test-model',
    system_prompt: 'test prompt',
    use_vertex_ai: false,
    vertex_project_id: '',
    vertex_location: '',
    vad_silence_duration_ms: 400,
    avatar_mode: 'none'
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
    onTelemetry: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers onStateChange with error if connection fails', async () => {
    vi.mocked(GeminiLiveApi).mockImplementation(function(this: unknown) {
      const self = this as { connect: unknown, disconnect: unknown };
      self.connect = vi.fn().mockRejectedValue(new Error('Connection failed'));
      self.disconnect = vi.fn();
      return self as unknown as GeminiLiveApi;
    });

    const { result } = renderHook(() => useGeminiSocket(defaultProps));

    await result.current.connectToSocket();

    await waitFor(() => {
        expect(defaultProps.onStateChange).toHaveBeenCalledWith('error');
    });
  });

  it('triggers onStateChange with disconnected when disconnectSocket is called', async () => {
      const mockDisconnect = vi.fn();
      vi.mocked(GeminiLiveApi).mockImplementation(function(this: unknown) {
        const self = this as { connect: unknown, disconnect: unknown };
        self.connect = vi.fn().mockResolvedValue(undefined);
        self.disconnect = mockDisconnect;
        return self as unknown as GeminiLiveApi;
      });

      const { result } = renderHook(() => useGeminiSocket(defaultProps));

      await result.current.connectToSocket();
      
      result.current.disconnectSocket();

      expect(mockDisconnect).toHaveBeenCalled();
      expect(defaultProps.onStateChange).toHaveBeenCalledWith('disconnected');
  });
});
