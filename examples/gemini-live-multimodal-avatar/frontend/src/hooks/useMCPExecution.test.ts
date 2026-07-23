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
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMCPExecution } from './useMCPExecution';
import { executeMCPTool } from '../api/tools';

// Mock dependencies
vi.mock('../api/tools', () => ({
  executeMCPTool: vi.fn(),
  ActionSuccessDataSchema: {
    parse: vi.fn((data) => data)
  }
}));

vi.mock('../context/ModalContext', () => ({
  useModalContext: () => ({
    openModal: vi.fn(),
    closeModal: vi.fn()
  })
}));

vi.mock('./useTelemetryEmit', () => ({
  useTelemetryEmit: () => ({
    emitEvent: vi.fn()
  })
}));

vi.mock('../context/DemoConfigContext', () => ({
  useDemoConfig: () => ({
    selectedPersona: 'test-persona',
    sessionId: 'test-session-id'
  })
}));

vi.mock('../context/OverlayContext', () => ({
  useOverlay: () => ({
    showOverlay: vi.fn(),
    hideOverlay: vi.fn()
  })
}));

import type { IGeminiLiveClient } from '../services/geminiLiveApi';

// ... (rest of mocks)

describe('useMCPExecution Sequence Logic', () => {
  const mockAddLog = vi.fn();
  const mockApi: IGeminiLiveClient = {
    sendToolResponse: vi.fn(),
    disconnect: vi.fn(),
    sendAudioChunk: vi.fn(),
    sendTextMessage: vi.fn(),
    setSilenceTimestamp: vi.fn()
  };
  const apiRef = { current: mockApi };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('SHOULD NOT unblock the pipeline until AFTER the tool response is sent to the network', async () => {
    // 1. Setup a delayed tool execution
    let resolveTool: (val: unknown) => void;
    const toolPromise = new Promise((resolve) => {
      resolveTool = resolve;
    });
    vi.mocked(executeMCPTool).mockReturnValue(toolPromise as Promise<unknown>);

    const { result } = renderHook(() => useMCPExecution(apiRef as unknown as React.MutableRefObject<IGeminiLiveClient>, mockAddLog, 'connected'));

    // 2. Trigger the tool call
    const toolCall = {
      functionCall: {
        name: 'get_account_balance',
        args: {},
        id: 'call_123'
      }
    };

    let callPromise: Promise<void>;
    await act(async () => {
      callPromise = result.current.handleToolCall(toolCall);
    });

    // 3. Verify tool is "Processing" (Mic blocked)
    expect(result.current.isProcessingTool).toBe(true);
    expect(mockApi.sendToolResponse).not.toHaveBeenCalled();

    // 4. Resolve the backend call
    await act(async () => {
      resolveTool!({ balance: 100 });
      // DO NOT await toolPromise here in a way that blocks the test.
      // Wait for the inner promises to settle up to the EventListener registration
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockApi.sendToolResponse).toHaveBeenCalled();
    
    // With the new sync logic, it should still be true here because audio hasn't started
    expect(result.current.isProcessingTool).toBe(true);

    // 6. Simulate audio playback starting
    await act(async () => {
      window.dispatchEvent(new Event('audio-playback-started'));
      // Now that the event is fired, the handleToolCall Promise should resolve
      await callPromise!;
    });

    // 7. Now it should be unblocked
    expect(result.current.isProcessingTool).toBe(false);
  });
});
