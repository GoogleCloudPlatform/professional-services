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

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAudioRecorder } from './useAudioRecorder';
import { fetchMCPTools } from '../api/tools';
import { useErrorContext } from '../context/ErrorContext';
import { useTelemetry } from '../context/TelemetryContext';
import { useTelemetryEmit } from './useTelemetryEmit';
import { TelemetryEvent } from '../types/telemetry';
import { type ConfigResponse } from '../api/config';
import { useAudioPlayer } from './useAudioPlayer';
import { useMCPExecution } from './useMCPExecution';
import type { ActiveVisual } from './useMCPExecution';
import { useTranscription } from './useTranscription';
import { useGeminiSocket } from './useGeminiSocket';
import { useDemoConfig } from '../context/DemoConfigContext';
import { useGeminiModalAutomation } from './useGeminiModalAutomation';
import { useGeminiTelemetryMapping } from './useGeminiTelemetryMapping';
import { useModalContext } from '../context/ModalContext';
import { useOverlay } from '../context/OverlayContext';

// Re-export Message type from useTranscription for backward compatibility
export type { Message } from './useTranscription';
export { type ActiveVisual };

export interface UseGeminiLiveOptions {
  config: ConfigResponse | undefined;
  onAudioChunk?: (base64Audio: string) => void;
  onVideoChunk?: (payload: { base64: string; mimeType: string }) => void;
  onInterrupt?: () => void;
  muteLocalPlayback?: boolean;
  disableAudioOutput?: boolean;
  onModelTextChunk?: (text: string) => void;
  onTurnComplete?: () => void;
  onTurnStart?: () => void;
  onToolCall?: (toolName: string) => void;
  autoConnect?: boolean;
}

/**
 * useGeminiLive is the primary orchestrator hook for the Gemini Live session.
 * It manages the connection lifecycle, audio/video streaming, MCP tool execution, 
 * and conversational state by delegating to specialized sub-hooks.
 */
export function useGeminiLive({
  config,
  onAudioChunk,
  onVideoChunk,
  onInterrupt,
  muteLocalPlayback = false,
  disableAudioOutput = false,
  onModelTextChunk,
  onTurnComplete,
  onToolCall,
  autoConnect = false
}: UseGeminiLiveOptions) {
  const [connectionState, setConnectionState] = useState<'connected' | 'disconnected' | 'error' | 'connecting'>('disconnected');
  const connectionStateRef = useRef<'connected' | 'disconnected' | 'error' | 'connecting'>('disconnected');
  
  const { addLog } = useErrorContext();
  const { recordMetric } = useTelemetry();
  const { emitEvent } = useTelemetryEmit();
  const { selectedPersona, resumptionHandle, setResumptionHandle, interactionMode } = useDemoConfig();
  const { activeModal } = useModalContext();
  const { activeOverlay } = useOverlay();

  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);
  const isAudioActiveRef = useRef<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState<boolean>(false);
  const [isInterrupted, setIsInterrupted] = useState<boolean>(false);
  const apiRef = useRef<import('../services/geminiLiveApi').IGeminiLiveClient | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const isProcessingToolRef = useRef<boolean>(false);

  // --- Sub-Hook Initialization ---
  const { handleUserStartedSpeaking } = useGeminiModalAutomation();
  const telemetryMapping = useGeminiTelemetryMapping();
  
  const { data: mcpTools = [], isLoading: isMcpToolsLoading, isError: isMcpToolsError, error: mcpToolsError } = useQuery({
    queryKey: ['mcpTools', selectedPersona],
    queryFn: () => fetchMCPTools(selectedPersona),
  });

  const {
    messages,
    textBufferRef,
    outputBufferRef,
    clearMessages,
    handleTranscription,
    flushBufferToMessages,
    flushTextBuffer,
    dispatchTranscriptEvent
  } = useTranscription({ 
    onModelTextChunk, 
    isAudioActive,
    onTranscriptionComplete: (text, sender) => {
        recordMetric(sender === 'user' ? 'userText' : 'modelText', text);
    }
  });

  const { isProcessingTool, activeVisual, handleToolCall: baseHandleToolCall, clearActiveVisual } = useMCPExecution(apiRef, addLog, connectionState);

  // --- Callback Refs for Closure Stability ---
  const onAudioChunkRef = useRef(onAudioChunk);
  const onVideoChunkRef = useRef(onVideoChunk);
  const onInterruptRef = useRef(onInterrupt);
  const onTurnCompleteRef = useRef(onTurnComplete);
  const onToolCallRef = useRef(onToolCall);
  const onModelTextChunkRef = useRef(onModelTextChunk);

  useEffect(() => { onAudioChunkRef.current = onAudioChunk; }, [onAudioChunk]);
  useEffect(() => { onVideoChunkRef.current = onVideoChunk; }, [onVideoChunk]);
  useEffect(() => { onInterruptRef.current = onInterrupt; }, [onInterrupt]);
  useEffect(() => { onTurnCompleteRef.current = onTurnComplete; }, [onTurnComplete]);
  useEffect(() => { onToolCallRef.current = onToolCall; }, [onToolCall]);
  useEffect(() => { onModelTextChunkRef.current = onModelTextChunk; }, [onModelTextChunk]);

  const { geminiStream, playAudioChunk, stopAudioPlayback, suspendAudioContext, resumeAudioContext } = useAudioPlayer({
    onAudioChunk: onAudioChunk,
    muteLocalPlayback, 
    onPlaybackStart: () => telemetryMapping.handlePlaybackStart(interactionMode === 'voice-only')
  });

  // --- Socket Event Handlers ---

  const handleAudioReceived = useCallback((payload: { base64: string; buffer: ArrayBuffer }) => {
    if (disableAudioOutput) {
      if (onAudioChunkRef.current) onAudioChunkRef.current(payload.base64);
    } else {
      playAudioChunk(payload.buffer, payload.base64);
      // Removed secondary call to onAudioChunkRef to prevent duplicate dispatch, as useAudioPlayer handles it
    }
    
    telemetryMapping.handleFirstResponse();
    setIsThinking(false);
    setIsModelSpeaking(true);
  }, [disableAudioOutput, playAudioChunk, telemetryMapping]);

  const handleSocketToolCall = useCallback((tc: import('../services/geminiLiveApi').ToolCall) => {
    isProcessingToolRef.current = true; // Synchronously set to true to block any micro-task audio chunks immediately
    telemetryMapping.handleFirstResponse();
    setIsThinking(false);
    setIsModelSpeaking(false);
    stopAudioPlayback();

    emitEvent(TelemetryEvent.TOOL_CALL_START, undefined, { toolName: tc.functionCall.name });
    if (onToolCallRef.current) onToolCallRef.current(tc.functionCall.name);
    
    baseHandleToolCall(tc).finally(() => {
        isProcessingToolRef.current = false; // Reset once processing is fully completed
        // Reset model response tracking so the response to the tool is timed as a new generation
        telemetryMapping.resetMapping();
        // Start latency timer for the post-tool model response
        telemetryMapping.handleIntentFinished();
    });
  }, [emitEvent, baseHandleToolCall, stopAudioPlayback, telemetryMapping]);

  const handleSocketTranscription = useCallback((tr: { text: string; type: 'input' | 'output'; finished?: boolean }) => {
    if (!tr.text) return; // Ignore empty transcripts

    if (tr.type === 'input') {
        if (!telemetryMapping.getHasActiveTurn()) {
            handleUserStartedSpeaking();
            telemetryMapping.handleTurnStart();
            dispatchTranscriptEvent('output', ''); // Clear cinematic text when user starts speaking
        }
    }

    if (tr.type === 'output') {
      telemetryMapping.handleFirstResponse();
      setIsThinking(false);
      setIsModelSpeaking(true);
    }

    handleTranscription(tr);
  }, [handleTranscription, telemetryMapping, handleUserStartedSpeaking, dispatchTranscriptEvent]);

  const handleSocketInterrupted = useCallback(() => {
    stopAudioPlayback();
    textBufferRef.current = '';
    
    telemetryMapping.handleTurnEnd();
    telemetryMapping.resetAll();

    setIsThinking(false);
    setIsModelSpeaking(false);
    setIsInterrupted(true);
    setTimeout(() => setIsInterrupted(false), 800);

    dispatchTranscriptEvent('input', '');
    dispatchTranscriptEvent('output', '');

    flushBufferToMessages('user', true);
    flushBufferToMessages('model', true);
    
    if (onInterruptRef.current) onInterruptRef.current();
  }, [stopAudioPlayback, dispatchTranscriptEvent, flushBufferToMessages, textBufferRef, telemetryMapping]);

  const handleAudioChunk = useCallback((data: ArrayBuffer) => {
    if (isProcessingTool || isProcessingToolRef.current) return;
    if (apiRef.current && connectionStateRef.current === 'connected') {
      apiRef.current.sendAudioChunk(data);
    }
  }, [isProcessingTool]);

  const handleVADStateChange = useCallback((isSpeaking: boolean) => {
    if (isSpeaking) {
        const promoted = telemetryMapping.handleVADSpeechDetected();
        if (!promoted) return;
    }

    if (telemetryMapping.getHasModelResponded()) return;

    if (!isSpeaking) {
        telemetryMapping.handleVADSilenceDetected();
        setIsThinking(true);
    }
  }, [telemetryMapping]);

  const { isRecording, isMuted, startRecording, stopRecording, setMuted } = useAudioRecorder(handleAudioChunk, handleVADStateChange);

  const wasRecordingBeforeDisconnectRef = useRef<boolean>(false);

  const activateMic = useCallback(async () => {
    await resumeAudioContext();
    try {
        if (!isRecording) await startRecording();
        setIsAudioActive(true);
        isAudioActiveRef.current = true;
        
        if (textBufferRef.current && onModelTextChunkRef.current) {
            outputBufferRef.current.push(textBufferRef.current);
            flushBufferToMessages('model');
            flushTextBuffer();
            if (textBufferRef.current) {
                onModelTextChunkRef.current(textBufferRef.current.trim());
                textBufferRef.current = '';
            }
        }
    } catch (err: unknown) {
        addLog('error', 'Failed to start local audio recording', { error: err instanceof Error ? err.message : err });
        throw err;
    }
  }, [resumeAudioContext, startRecording, isRecording, addLog, flushBufferToMessages, flushTextBuffer, textBufferRef, outputBufferRef]);

  const handleSocketStateChange = useCallback((state: 'connected' | 'disconnected' | 'error' | 'connecting') => {
    if (state === 'connected') {
        if (wasRecordingBeforeDisconnectRef.current) {
            console.log('[useGeminiLive] Re-activating microphone after auto-reconnect');
            activateMic().catch(err => console.error('Failed to auto-resume mic:', err));
            wasRecordingBeforeDisconnectRef.current = false;
        }
    } else if (state === 'error' && connectionStateRef.current !== 'error') {
        addLog('error', `WebSocket connection failed`);
    }
    
    setConnectionState(state);
    connectionStateRef.current = state;
    
    if (state === 'disconnected' || state === 'error') {
        if (isRecording) {
            wasRecordingBeforeDisconnectRef.current = true;
        }
        stopRecording();
        setIsAudioActive(false);
        isAudioActiveRef.current = false;
        telemetryMapping.resetAll();
    }
  }, [addLog, stopRecording, telemetryMapping, isRecording, activateMic]);

  const handleSocketTurnComplete = useCallback(() => {
    if (textBufferRef.current && onModelTextChunkRef.current) {
        if (isAudioActiveRef.current) {
            onModelTextChunkRef.current(textBufferRef.current.trim());
            textBufferRef.current = '';
        }
    }
    
    flushBufferToMessages('user');
    flushBufferToMessages('model');

    telemetryMapping.handleTurnEnd();
    setIsModelSpeaking(false);

    if (onTurnCompleteRef.current) onTurnCompleteRef.current();
  }, [flushBufferToMessages, textBufferRef, telemetryMapping]);

  const isAwaitingInput = activeModal === 'show_appointment_slots' || activeOverlay !== null;

  const { connectToSocket, disconnectSocket } = useGeminiSocket({
    apiRef,
    config,
    mcpTools,
    onAudioReceived: handleAudioReceived,
    onVideoReceived: (v) => onVideoChunkRef.current?.(v),
    onToolCall: handleSocketToolCall,
    onTranscription: handleSocketTranscription,
    onInterrupted: handleSocketInterrupted,
    onStateChange: handleSocketStateChange,
    onError: (msg) => addLog('error', msg),
    onTurnComplete: handleSocketTurnComplete,
    onTelemetry: (key, val, meta) => telemetryMapping.handleSocketTelemetry(key, val, meta as Record<string, unknown>),
    resumptionHandle,
    onResumptionHandleUpdate: setResumptionHandle
  });

  const connect = useCallback(async (background: boolean = false) => {
    if (isConnectingRef.current || isMcpToolsLoading) return;
    isConnectingRef.current = true;
    setConnectionState('connecting');
    connectionStateRef.current = 'connecting';

    if (!config) {
        addLog('error', 'Cannot connect: Configuration not loaded');
        isConnectingRef.current = false;
        return;
    }
    
    try {
        await resumeAudioContext();
    } catch (e) {
        console.warn('Failed to resume AudioContext early:', e);
    }

    clearMessages();
    clearActiveVisual();

    if (isMcpToolsError) {
        addLog('error', 'Failed to fetch MCP tools', { error: mcpToolsError instanceof Error ? mcpToolsError.message : mcpToolsError });
        setConnectionState('error');
        isConnectingRef.current = false;
        return;
    }
    
    const api = await connectToSocket();
    if (!api) {
      addLog('error', 'Failed to connect to Gemini Live API');
      isConnectingRef.current = false;
      return;
    }
    
    setIsAudioActive(true);
    isAudioActiveRef.current = true;

    if (!background) {
        try {
            await activateMic();
        } catch {
            api.disconnect();
        }
    }
    
    isConnectingRef.current = false;
  }, [config, isMcpToolsError, mcpToolsError, isMcpToolsLoading, addLog, resumeAudioContext, clearMessages, clearActiveVisual, connectToSocket, activateMic]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (autoConnect && config && connectionState === 'disconnected' && !isMcpToolsLoading) {
        timeoutId = setTimeout(() => connect(true), 0);
    }
    return () => clearTimeout(timeoutId);
  }, [autoConnect, config, connectionState, connect, isMcpToolsLoading]);

  const disconnect = useCallback(() => {
    disconnectSocket();
    setConnectionState('disconnected');
    connectionStateRef.current = 'disconnected';
    stopRecording();
    stopAudioPlayback();
    setIsAudioActive(false);
    isAudioActiveRef.current = false;
    setIsThinking(false);
    setIsModelSpeaking(false);
    telemetryMapping.resetAll();
    suspendAudioContext();
    isConnectingRef.current = false;
  }, [stopRecording, stopAudioPlayback, suspendAudioContext, disconnectSocket, telemetryMapping]);

  const disconnectRef = useRef(disconnect);
  useEffect(() => { disconnectRef.current = disconnect; }, [disconnect]);

  useEffect(() => {
    return () => { disconnectRef.current(); };
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (apiRef.current) {
        const timestamp = Date.now();
        telemetryMapping.handleTurnStart(timestamp);
        telemetryMapping.handleIntentFinished(timestamp);
        setIsThinking(true);
        setIsModelSpeaking(false);

        // --- TRANSIENT CLICK SUPPRESSION ---
        // Temporarily flag the pipeline as processing a tool/system message 
        // to prevent the microphone from picking up the physical mouse click
        // and sending it as an interruption to the server.
        isProcessingToolRef.current = true;
        setTimeout(() => {
          // Release it safely after the physical transient has passed,
          // allowing the standard MCP tool execution lock to take over if needed.
          isProcessingToolRef.current = false;
        }, 800);

        apiRef.current.sendTextMessage(text);
    }
  }, [telemetryMapping]);

  return {
    connectionState,
    isRecording,
    isMuted,
    isProcessingTool,
    isAwaitingInput,
    messages,
    activeVisual,
    geminiStream: disableAudioOutput ? null : geminiStream,
    isAudioActive,
    isThinking,
    isModelSpeaking,
    isInterrupted,
    clearMessages,
    connect,
    disconnect,
    activateMic,
    setMuted,
    sendTextMessage
  };
}
