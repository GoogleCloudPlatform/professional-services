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

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMCPExecution } from './useMCPExecution';
import * as toolsApi from '../api/tools';
import * as modalContext from '../context/ModalContext';
import { OverlayProvider } from '../context/OverlayContext';
import { GeminiLiveApi } from '../services/geminiLiveApi';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <OverlayProvider>{children}</OverlayProvider>
);

vi.mock('../api/tools', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/tools')>();
  return {
    ...actual,
    executeMCPTool: vi.fn(),
  };
});

vi.mock('../context/ModalContext', () => ({
  useModalContext: vi.fn(),
}));

vi.mock('../context/TelemetryContext', () => ({
  useTelemetry: vi.fn(() => ({ recordMetric: vi.fn() })),
}));

vi.mock('../context/DemoConfigContext', () => ({
  useDemoConfig: vi.fn(() => ({ 
    selectedPersona: 'test-persona',
    sessionId: 'test-session-id',
    languages: ['English'],
    setLanguages: vi.fn(),
    interactionMode: 'heygen',
    setInteractionMode: vi.fn(),
    resetSessionId: vi.fn()
  })),
}));

describe('useMCPExecution Modal Interception', () => {
  const mockOpenModal = vi.fn();
  const mockAddLog = vi.fn();
  const mockApiRef = { 
    current: { 
        sendToolResponse: vi.fn(),
        disconnect: vi.fn(),
        sendAudioChunk: vi.fn(),
        sendTextMessage: vi.fn(),
    } 
  } as unknown as React.MutableRefObject<GeminiLiveApi | null>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(modalContext.useModalContext).mockReturnValue({
      openModal: mockOpenModal,
      activeModal: null,
      modalData: null,
      closeModal: vi.fn()
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('triggers account_balance modal when get_account_balance tool is executed', async () => {
    const mockResponse = { balance: 5000 };
    vi.mocked(toolsApi.executeMCPTool).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMCPExecution(mockApiRef, mockAddLog, 'connected'), { wrapper });

    let callPromise: Promise<void>;
    await act(async () => {
      callPromise = result.current.handleToolCall({
        functionCall: { name: 'get_account_balance', args: {}, id: '1' }
      });
      await Promise.resolve(); // flush microtasks
    });

    await act(async () => {
      window.dispatchEvent(new Event('audio-playback-started'));
      await callPromise;
    });

    expect(mockOpenModal).toHaveBeenCalledWith('account_balance', mockResponse);
  });

  it('triggers recent_transactions modal when get_recent_transactions tool is executed', async () => {
    const mockResponse = [{ id: '1', amount: -50 }];
    vi.mocked(toolsApi.executeMCPTool).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMCPExecution(mockApiRef, mockAddLog, 'connected'), { wrapper });

    let callPromise: Promise<void>;
    await act(async () => {
      callPromise = result.current.handleToolCall({
        functionCall: { name: 'get_recent_transactions', args: {}, id: '2' }
      });
      await Promise.resolve();
    });

    await act(async () => {
      window.dispatchEvent(new Event('audio-playback-started'));
      await callPromise;
    });

    expect(mockOpenModal).toHaveBeenCalledWith('recent_transactions', mockResponse);
  });

  it('delays modal trigger until the audio-playback-started event fires', async () => {
    const mockResponse = { balance: 5000 };
    vi.mocked(toolsApi.executeMCPTool).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMCPExecution(mockApiRef, mockAddLog, 'connected'), { wrapper });

    let callPromise: Promise<void>;
    await act(async () => {
      callPromise = result.current.handleToolCall({
        functionCall: { name: 'get_account_balance', args: {}, id: '1' }
      });
      await Promise.resolve();
    });

    // Modal should NOT be called yet
    expect(mockOpenModal).not.toHaveBeenCalled();

    // Fire the event
    await act(async () => {
      window.dispatchEvent(new Event('audio-playback-started'));
      await callPromise;
    });

    // Now it should be called
    expect(mockOpenModal).toHaveBeenCalledWith('account_balance', mockResponse);
  });

  it('uses the 3.5s safety fallback if audio-playback-started never fires', async () => {
    const mockResponse = [{ id: '1', amount: -50 }];
    vi.mocked(toolsApi.executeMCPTool).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMCPExecution(mockApiRef, mockAddLog, 'connected'), { wrapper });

    let callPromise: Promise<void>;
    await act(async () => {
      callPromise = result.current.handleToolCall({
        functionCall: { name: 'get_recent_transactions', args: {}, id: '2' }
      });
      await Promise.resolve();
    });

    // Modal should NOT be called yet
    expect(mockOpenModal).not.toHaveBeenCalled();

    // Advance timers by just 3 seconds - still should not be called
    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
    });
    expect(mockOpenModal).not.toHaveBeenCalled();

    // Advance past the 3.5s fallback
    await act(async () => {
      vi.advanceTimersByTime(500);
      await callPromise;
    });

    // The safety fallback should have triggered it
    expect(mockOpenModal).toHaveBeenCalledWith('recent_transactions', mockResponse);
  });

  it('does NOT trigger schedule_appointment modal when schedule_appointment tool is executed', async () => {
    const mockResponse = { date: '2026-03-20', time: '10:00 AM' };
    vi.mocked(toolsApi.executeMCPTool).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMCPExecution(mockApiRef, mockAddLog, 'connected'), { wrapper });

    let callPromise: Promise<void>;
    await act(async () => {
      callPromise = result.current.handleToolCall({
        functionCall: { name: 'schedule_appointment', args: {}, id: '3' }
      });
      await Promise.resolve();
    });

    await act(async () => {
      window.dispatchEvent(new Event('audio-playback-started'));
      await callPromise;
    });

    expect(mockOpenModal).not.toHaveBeenCalled();
  });
  it("passes sessionId to executeMCPTool", async () => {
    const mockResponse = { success: true };
    vi.mocked(toolsApi.executeMCPTool).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMCPExecution(mockApiRef, mockAddLog, 'connected'), { wrapper });

    let callPromise: Promise<void>;
    await act(async () => {
      callPromise = result.current.handleToolCall({
        functionCall: { name: 'get_account_balance', args: { account_id: '123' }, id: '1' }
      });
      await Promise.resolve();
    });

    await act(async () => {
      window.dispatchEvent(new Event('audio-playback-started'));
      await callPromise;
    });

    expect(toolsApi.executeMCPTool).toHaveBeenCalledWith(
      'get_account_balance',
      { account_id: '123' },
      expect.any(String), // persona
      expect.any(String)  // sessionid
    );
  });

  it('triggers action_success modal when send_document_to_app is called with other document_type', async () => {
    const mockResponse = { status: 'success', document_type: 'tax_form', message: 'The tax_form has been pushed successfully.' };
    vi.mocked(toolsApi.executeMCPTool).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMCPExecution(mockApiRef, mockAddLog, 'connected'), { wrapper });

    let callPromise: Promise<void>;
    await act(async () => {
      callPromise = result.current.handleToolCall({
        functionCall: { name: 'send_document_to_app', args: { document_type: 'tax_form' }, id: '5' }
      });
      await Promise.resolve();
    });

    await act(async () => {
      window.dispatchEvent(new Event('audio-playback-started'));
      await callPromise;
    });

    expect(mockOpenModal).toHaveBeenCalledWith('action_success', {
      title: 'Document Sent',
      message: 'The tax_form has been pushed successfully.',
      details: {
        delivery: 'mobile_app_push',
        document_type: 'tax_form'
      }
    });
  });
});
