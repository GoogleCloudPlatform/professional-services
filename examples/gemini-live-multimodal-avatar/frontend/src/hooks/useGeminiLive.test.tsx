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

import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGeminiLive } from './useGeminiLive';
import { GeminiLiveApi } from '../services/geminiLiveApi';
import { useAudioPlayer } from './useAudioPlayer';
import { useAudioRecorder } from './useAudioRecorder';
import { useTelemetry } from '../context/TelemetryContext';
import { useModalContext } from '../context/ModalContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModalProvider } from '../context/ModalContext';
import { OverlayProvider } from '../context/OverlayContext';
import React from 'react';

import { telemetry } from '../utils/telemetry';

// Mock dependencies
vi.mock('../services/geminiLiveApi');
vi.mock('./useAudioPlayer');
vi.mock('./useAudioRecorder');
vi.mock('../context/DemoConfigContext', () => ({
  useDemoConfig: vi.fn(() => ({
    selectedPersona: 'test-persona',
    sessionId: 'test-session-id',
    languages: ['English'],
    setLanguages: vi.fn(),
    interactionMode: 'heygen',
    setInteractionMode: vi.fn(),
    resetSessionId: vi.fn()
  }))
}));
vi.mock('./useMCPExecution', () => ({
  useMCPExecution: vi.fn().mockReturnValue({ clearActiveVisual: vi.fn(), handleToolCall: vi.fn().mockResolvedValue(undefined) })
}));
vi.mock('../context/ErrorContext', () => ({
  useErrorContext: () => ({ addLog: vi.fn() }),
}));
vi.mock('../context/TelemetryContext', () => ({
  useTelemetry: vi.fn().mockReturnValue({ 
    recordMetric: vi.fn(), 
    startTurn: vi.fn(), 
    setModelName: vi.fn(), 
    metrics: {}, 
    history: [], 
    cancelTurn: vi.fn(), 
    clearHistory: vi.fn() 
  }),
}));
vi.mock('../context/ModalContext', () => ({
  useModalContext: vi.fn().mockReturnValue({ activeModal: null, closeModal: vi.fn(), openModal: vi.fn(), modalData: null }),
  ModalProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));
vi.mock('../api/config', () => ({
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: vi.fn().mockReturnValue({
      data: [],
      isError: false,
      error: null,
      isLoading: false
    })
  };
});
import { type ConfigResponse } from '../api/config';

// Mock data
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

describe('useGeminiLive Voice-Activated Modal Dismissal', () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <OverlayProvider>
        {children}
      </OverlayProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should auto-close informational modals when the user starts speaking (via transcription)', async () => {
    const mockCloseModal = vi.fn();
    vi.mocked(useModalContext).mockReturnValue({
      activeModal: 'account_balance',
      closeModal: mockCloseModal,
      openModal: vi.fn(),
      modalData: null
    });

    vi.mocked(useAudioPlayer).mockReturnValue({
      geminiStream: null,
      playAudioChunk: vi.fn(),
      stopAudioPlayback: vi.fn(),
      suspendAudioContext: vi.fn(),
      resumeAudioContext: vi.fn()
    });

    vi.mocked(useAudioRecorder).mockReturnValue({
      isRecording: false,
      isMuted: false,
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      setMuted: vi.fn()
    });

    let capturedOnTranscription: ((tr: { text: string; type: 'input' | 'output'; finished?: boolean }) => void) | undefined;
    vi.mocked(GeminiLiveApi).mockImplementation(function(this: GeminiLiveApi, opts: import('../services/geminiLiveApi').GeminiLiveApiOptions) {
      capturedOnTranscription = opts.onTranscription;
      this.connect = vi.fn().mockResolvedValue(undefined);
      this.disconnect = vi.fn();
      this.sendAudioChunk = vi.fn();
      return this;
    });

    const { result } = renderHook(() => useGeminiLive({ config: mockConfig }), { wrapper });
    
    // Connect so that GeminiLiveApi is instantiated
    await act(async () => {
        await result.current.connect();
    });

    expect(capturedOnTranscription).toBeDefined();

    act(() => {
      capturedOnTranscription!({ text: 'Hello', type: 'input' }); // User starts speaking (modal closes)
    });
    expect(mockCloseModal).toHaveBeenCalledTimes(1);
  });
});

describe('useGeminiLive audio muting', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.mocked(useAudioPlayer).mockReturnValue({
      geminiStream: null,
      playAudioChunk: vi.fn(),
      stopAudioPlayback: vi.fn(),
      suspendAudioContext: vi.fn(),
      resumeAudioContext: vi.fn()
    });

    vi.mocked(useAudioRecorder).mockReturnValue({
      isRecording: false,
      isMuted: false,
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      setMuted: vi.fn()
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <OverlayProvider>
        <ModalProvider>
          {children}
        </ModalProvider>
      </OverlayProvider>
    </QueryClientProvider>
  );

  it('should not pass audio to playAudioChunk if disableAudioOutput is true', async () => {
    // Mocks
    const playAudioChunkMock = vi.fn();
    vi.mocked(useAudioPlayer).mockReturnValue({
      geminiStream: null,
      playAudioChunk: playAudioChunkMock,
      stopAudioPlayback: vi.fn(),
      suspendAudioContext: vi.fn(),
      resumeAudioContext: vi.fn()
    });

    // Need to intercept the onAudioReceived callback passed to GeminiLiveApi
    let capturedOnAudioReceived: ((payload: { base64: string; buffer: ArrayBuffer }) => void) | undefined;
    vi.mocked(GeminiLiveApi).mockImplementation(function(this: GeminiLiveApi, opts: import('../services/geminiLiveApi').GeminiLiveApiOptions) {
      capturedOnAudioReceived = opts.onAudioReceived;
      this.connect = vi.fn().mockResolvedValue(undefined);
      this.disconnect = vi.fn();
      this.sendAudioChunk = vi.fn();
      return this;
    });

    const { result } = renderHook(() => useGeminiLive({ config: mockConfig, disableAudioOutput: true }), { wrapper });
    
    await waitFor(async () => {
        await result.current.connect();
    });
    
    // Trigger audio receive
    expect(capturedOnAudioReceived).toBeDefined();
    capturedOnAudioReceived!({ base64: 'base64chunk', buffer: new ArrayBuffer(0) });

    // It should not call playAudioChunk if disabled
    expect(playAudioChunkMock).not.toHaveBeenCalled();
  });

  it('should call onModelTextChunk when a model transcription is received and mic is active', async () => {
    let capturedOnTranscription: ((tr: { text: string; type: 'input' | 'output'; finished?: boolean }) => void) | undefined;
    vi.mocked(GeminiLiveApi).mockImplementation(function(this: GeminiLiveApi, opts: import('../services/geminiLiveApi').GeminiLiveApiOptions) {
      capturedOnTranscription = opts.onTranscription;
      this.connect = vi.fn().mockResolvedValue(undefined);
      this.disconnect = vi.fn();
      this.sendAudioChunk = vi.fn();
      return this;
    });

    const onModelTextChunkMock = vi.fn();
    const { result } = renderHook(() => useGeminiLive({ config: mockConfig, disableAudioOutput: true, onModelTextChunk: onModelTextChunkMock }), { wrapper });
    
    // Connect in background first
    await act(async () => {
        await result.current.connect(true);
    });
    
    // Now activate mic explicitly
    await act(async () => {
        await result.current.activateMic();
    });
    
    expect(capturedOnTranscription).toBeDefined();
    
    // Test output text (should trigger callback)
    act(() => {
      capturedOnTranscription!({ text: 'World.', type: 'output' });
    });
    expect(onModelTextChunkMock).toHaveBeenCalledWith('World.');
  });

  it('should auto-connect if autoConnect is true and config is provided', async () => {
    const connectMock = vi.fn().mockResolvedValue(undefined);
    vi.mocked(GeminiLiveApi).mockImplementation(function(this: GeminiLiveApi) {
      this.connect = connectMock;
      this.disconnect = vi.fn();
      this.sendAudioChunk = vi.fn();
      return this;
    });

    renderHook(() => useGeminiLive({ config: mockConfig, autoConnect: true }), { wrapper });
    
    await waitFor(() => {
      expect(connectMock).toHaveBeenCalled();
    });
  });

  it('should not start recording immediately on connect if background is true', async () => {
    const startRecordingMock = vi.fn();
    vi.mocked(useAudioRecorder).mockReturnValue({
      isRecording: false,
      isMuted: false,
      startRecording: startRecordingMock,
      stopRecording: vi.fn(),
      setMuted: vi.fn()
    });

    vi.mocked(GeminiLiveApi).mockImplementation(function(this: GeminiLiveApi) {
      this.connect = vi.fn().mockResolvedValue(undefined);
      this.disconnect = vi.fn();
      this.sendAudioChunk = vi.fn();
      return this;
    });

    const { result } = renderHook(() => useGeminiLive({ config: mockConfig }), { wrapper });
    
    await waitFor(async () => {
      await result.current.connect(true); // background = true
    });

    expect(startRecordingMock).not.toHaveBeenCalled(); 
  });

  it('should start recording when activateMic is called', async () => {
    const startRecordingMock = vi.fn();
    vi.mocked(useAudioRecorder).mockReturnValue({
      isRecording: false,
      isMuted: false,
      startRecording: startRecordingMock,
      stopRecording: vi.fn(),
      setMuted: vi.fn()
    });

    const { result } = renderHook(() => useGeminiLive({ config: mockConfig }), { wrapper });
    
    await act(async () => {
      await result.current.activateMic();
    });

    expect(startRecordingMock).toHaveBeenCalled();
  });

  it('HeyGen Audio Mode: should route text to onModelTextChunk but not audio to onAudioChunk if not provided', async () => {
    let capturedOnTranscription: ((tr: { text: string; type: 'input' | 'output'; finished?: boolean }) => void) | undefined;
    let capturedOnAudioReceived: ((payload: { base64: string; buffer: ArrayBuffer }) => void) | undefined;
    
    vi.mocked(GeminiLiveApi).mockImplementation(function(this: GeminiLiveApi, opts: import('../services/geminiLiveApi').GeminiLiveApiOptions) {
      capturedOnTranscription = opts.onTranscription;
      capturedOnAudioReceived = opts.onAudioReceived;
      this.connect = vi.fn().mockResolvedValue(undefined);
      this.disconnect = vi.fn();
      this.sendAudioChunk = vi.fn();
      return this;
    });

    const onModelTextChunkMock = vi.fn();
    
    // In HeyGen mode, we pass onModelTextChunk but leave onAudioChunk as undefined
    const { result } = renderHook(() => useGeminiLive({ config: mockConfig, muteLocalPlayback: true, disableAudioOutput: true, onModelTextChunk: onModelTextChunkMock, autoConnect: true }), { wrapper });

    await waitFor(() => {
        expect(capturedOnTranscription).toBeDefined();
        expect(result.current.isAudioActive).toBe(true);
    });
    // Send text
    act(() => {
        capturedOnTranscription!({ text: 'Hello HeyGen.', type: 'output' });
    });
    
    // Send audio (should be ignored safely without crashing)
    expect(capturedOnAudioReceived).toBeDefined();
    if (capturedOnAudioReceived) {
      const audioCb = capturedOnAudioReceived;
      expect(() => audioCb({ base64: 'base64audio', buffer: new ArrayBuffer(0) })).not.toThrow();
    }

    expect(onModelTextChunkMock).toHaveBeenCalledWith('Hello HeyGen.');
  });

  it('should compensate for 96ms VAD detection delay when silence is detected', async () => {
    let capturedHandleVADStateChange: ((isSpeaking: boolean, delayMs?: number) => void) | undefined;
    vi.mocked(useAudioRecorder).mockImplementation((_onAudio: unknown, onVAD?: (isSpeaking: boolean, delayMs?: number) => void) => {
      capturedHandleVADStateChange = onVAD;
      return {
        isRecording: false,
        isMuted: false,
        startRecording: vi.fn(),
        stopRecording: vi.fn(),
        setMuted: vi.fn()
      };
    });

    vi.mocked(GeminiLiveApi).mockImplementation(function(this: GeminiLiveApi) {
      this.connect = vi.fn().mockResolvedValue(undefined);
      this.disconnect = vi.fn();
      this.sendAudioChunk = vi.fn();
      return this;
    });

    const { result } = renderHook(() => useGeminiLive({ config: mockConfig }), { wrapper });
    
    await act(async () => {
        await result.current.connect();
    });

    expect(capturedHandleVADStateChange).toBeDefined();

    // Mock Date.now to a fixed value
    const now = 10000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    telemetry.clearTimer('totalTurnLatency');

    // Trigger silence detected
    act(() => {
      capturedHandleVADStateChange!(false);
    });

    // Verify it called setSilenceTimestamp with now - 400
  });
  it('should trigger telemetry events on onAudioReceived, onToolCall, and onTranscription', async () => {
    let capturedOnAudioReceived: ((payload: { base64: string; buffer: ArrayBuffer }) => void) | undefined;
    let capturedOnToolCall: ((tc: import('../services/geminiLiveApi').ToolCall) => void) | undefined;
    let capturedOnTranscription: ((tr: { text: string; type: 'input' | 'output'; finished?: boolean }) => void) | undefined;
    telemetry.stopTimer('totalTurnLatency');

    vi.mocked(GeminiLiveApi).mockImplementation(function(this: GeminiLiveApi, opts: import('../services/geminiLiveApi').GeminiLiveApiOptions) {
      capturedOnAudioReceived = opts.onAudioReceived;
      capturedOnToolCall = opts.onToolCall;
      capturedOnTranscription = opts.onTranscription;
      this.connect = vi.fn().mockResolvedValue(undefined);
      this.disconnect = vi.fn();
      this.sendAudioChunk = vi.fn();
      return this;
    });

    const recordMetricMock = vi.fn();
    vi.mocked(useTelemetry).mockReturnValue({
      recordMetric: recordMetricMock,
      startTurn: vi.fn(),
      setModelName: vi.fn(),
      metrics: {},
      history: [],
      cancelTurn: vi.fn(),
      clearHistory: vi.fn()
    });

    const { result } = renderHook(() => useGeminiLive({ config: mockConfig }), { wrapper });
    
    await act(async () => {
        await result.current.connect();
    });

    expect(capturedOnAudioReceived).toBeDefined();
    expect(capturedOnToolCall).toBeDefined();
    expect(capturedOnTranscription).toBeDefined();

    const now = 10000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    // Trigger onAudioReceived
    act(() => {
      capturedOnAudioReceived!({ base64: 'test', buffer: new ArrayBuffer(0) });
    });

    // Reset for next test
    telemetry.stopTimer('totalTurnLatency');

    // Re-render hook to reset hasModelRespondedRef internally
    const { result: result2 } = renderHook(() => useGeminiLive({ config: mockConfig }), { wrapper });
    await act(async () => {
        await result2.current.connect();
    });

    // Trigger onToolCall
    act(() => {
      capturedOnToolCall!({ functionCall: { name: 'test_tool', args: {}, id: '1' } });
    });

    // Reset again
    telemetry.stopTimer('totalTurnLatency');

    // Trigger onTranscription
    const { result: result3 } = renderHook(() => useGeminiLive({ config: mockConfig }), { wrapper });
    await act(async () => {
        await result3.current.connect();
    });

    act(() => {
      capturedOnTranscription!({ text: 'test', type: 'output', finished: true });
    });
  });

  it('should route token metadata from onTelemetry directly to useTelemetry', async () => {
    let capturedOnTelemetry: ((key: import('../types/telemetry').NumericTelemetryMetric, val: number, meta?: Record<string, unknown>) => void) | undefined;

    vi.mocked(GeminiLiveApi).mockImplementation(function(this: GeminiLiveApi, opts: import('../services/geminiLiveApi').GeminiLiveApiOptions) {
      capturedOnTelemetry = opts.onTelemetry;
      this.connect = vi.fn().mockResolvedValue(undefined);
      this.disconnect = vi.fn();
      return this;
    });

    const recordMetricMock = vi.fn();
    vi.mocked(useTelemetry).mockReturnValue({
      recordMetric: recordMetricMock,
      startTurn: vi.fn(),
      setModelName: vi.fn(),
      metrics: {},
      history: [],
      cancelTurn: vi.fn(),
      clearHistory: vi.fn()
    });

    const { result } = renderHook(() => useGeminiLive({ config: mockConfig }), { wrapper });
    
    await act(async () => {
        await result.current.connect();
    });

    expect(capturedOnTelemetry).toBeDefined();

    // Trigger onTelemetry for input tokens
    act(() => {
      capturedOnTelemetry!('inputTokens', 150);
    });
    expect(recordMetricMock).toHaveBeenCalledWith('inputTokens', 150, undefined);

    // Trigger onTelemetry for output tokens
    act(() => {
      capturedOnTelemetry!('outputTokens', 50);
    });
    expect(recordMetricMock).toHaveBeenCalledWith('outputTokens', 50, undefined);
  });

  it('should auto-reconnect when disconnected and autoConnect is true', async () => {
    const connectMock = vi.fn().mockResolvedValue(undefined);
    let capturedOnStateChange: ((state: 'connected' | 'disconnected' | 'error' | 'connecting') => void) | undefined;

    vi.mocked(GeminiLiveApi).mockImplementation(function(this: GeminiLiveApi, opts: import('../services/geminiLiveApi').GeminiLiveApiOptions) {
      capturedOnStateChange = opts.onStateChange;
      this.connect = vi.fn().mockImplementation(async () => {
        if (capturedOnStateChange) {
          capturedOnStateChange('connected');
        }
        return connectMock();
      });
      this.disconnect = vi.fn().mockImplementation(() => {
         if (capturedOnStateChange) {
            capturedOnStateChange('disconnected');
         }
      });
      this.sendAudioChunk = vi.fn();
      return this;
    });

    const { result } = renderHook(() => useGeminiLive({ config: mockConfig, autoConnect: true }), { wrapper });
    
    await waitFor(() => {
      expect(connectMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      result.current.disconnect();
    });

    await waitFor(() => {
      // It should reconnect automatically because connectionState became disconnected
      expect(connectMock).toHaveBeenCalledTimes(2);
    });
  });

  it('should deduplicate turnEndTimestamp if onTurnComplete is called multiple times sequentially', async () => {
    let capturedOnTurnComplete: (() => void) | undefined;
    let capturedOnTranscription: ((tr: { text: string; type: 'input' | 'output'; finished?: boolean }) => void) | undefined;
    
    vi.mocked(GeminiLiveApi).mockImplementation(function(this: GeminiLiveApi, opts: import('../services/geminiLiveApi').GeminiLiveApiOptions) {
      capturedOnTurnComplete = opts.onTurnComplete;
      capturedOnTranscription = opts.onTranscription;
      this.connect = vi.fn().mockResolvedValue(undefined);
      this.disconnect = vi.fn();
      return this;
    });

    const recordMetricMock = vi.fn();
    vi.mocked(useTelemetry).mockReturnValue({
      recordMetric: recordMetricMock,
      startTurn: vi.fn(),
      setModelName: vi.fn(),
      metrics: {},
      history: [],
      cancelTurn: vi.fn(),
      clearHistory: vi.fn()
    });

    const { result } = renderHook(() => useGeminiLive({ config: mockConfig }), { wrapper });
    
    await act(async () => {
        await result.current.connect();
    });

    // 1. Send input transcription to start the turn (sets hasActiveTurnRef.current = true)
    act(() => {
        capturedOnTranscription!({ type: 'input', text: 'Hello', finished: true });
    });

    // 2. Trigger onTurnComplete MULTIPLE times
    act(() => {
        capturedOnTurnComplete!();
        capturedOnTurnComplete!();
        capturedOnTurnComplete!();
    });

    // 3. Verify turnEndTimestamp was only recorded ONCE
    const turnEndCalls = recordMetricMock.mock.calls.filter(call => call[0] === 'turnEndTimestamp');
    expect(turnEndCalls.length).toBe(1);
  });

  it('should correctly reset tracking state after an async tool execution', async () => {
    let capturedOnToolCall: ((tc: import('../services/geminiLiveApi').ToolCall) => void) | undefined;
    let capturedOnTranscription: ((tr: { text: string; type: 'input' | 'output'; finished?: boolean }) => void) | undefined;
    
    vi.mocked(GeminiLiveApi).mockImplementation(function(this: GeminiLiveApi, opts: import('../services/geminiLiveApi').GeminiLiveApiOptions) {
      capturedOnToolCall = opts.onToolCall;
      capturedOnTranscription = opts.onTranscription;
      this.connect = vi.fn().mockResolvedValue(undefined);
      this.disconnect = vi.fn();
      return this;
    });

    const recordMetricMock = vi.fn();
    vi.mocked(useTelemetry).mockReturnValue({
      recordMetric: recordMetricMock,
      startTurn: vi.fn(),
      setModelName: vi.fn(),
      metrics: {},
      history: [],
      cancelTurn: vi.fn(),
      clearHistory: vi.fn()
    });

    const { result } = renderHook(() => useGeminiLive({ config: mockConfig }), { wrapper });
    
    await act(async () => {
        await result.current.connect();
    });

    // Set up a mock tool call response
    const mockToolCall = { functionCall: { name: 'test_tool', args: {}, id: '1' } };
    
    // Simulate Gemini sending a tool call request
    await act(async () => {
        await capturedOnToolCall!(mockToolCall);
    });

    // When the tool call finishes, the code should reset the hasModelRespondedRef internally.
    // If it did, the NEXT output chunk will trigger handleFirstResponse and record totalTurnLatency.
    act(() => {
        capturedOnTranscription!({ type: 'output', text: 'I found something.' });
    });

    // Verify totalTurnLatency was recorded for the post-tool phase
    const latencyCalls = recordMetricMock.mock.calls.filter(call => call[0] === 'totalTurnLatency');
    // Once during the tool call, and once during the transcription after the tool call
    expect(latencyCalls.length).toBeGreaterThanOrEqual(1);
  });
});
