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

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Box, Snackbar, Typography } from '@mui/material'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchConfig } from '../api/config'
import { useGeminiLive } from '../hooks/useGeminiLive'
import { LobbyScreen } from '../components/LobbyScreen'
import { SuggestionChips } from '../components/SuggestionChips'
import { VoiceOnlyDisplay } from '../components/VoiceOnlyDisplay'
import { BottomActionBar } from '../components/BottomActionBar'
import { useTelemetry } from '../context/TelemetryContext'
import ShowAppointmentSlotsModal from '../components/ShowAppointmentSlotsModal'
import { useModalContext, type ShowAppointmentSlotsData } from '../context/ModalContext'
import { useDemoConfig } from '../context/DemoConfigContext'
import { useOverlay } from '../context/OverlayContext'

export const Route = createFileRoute('/advisor/voice-only')({
  component: VoiceOnlyAdvisor,
})

type ViewState = 'lobby' | 'main';

export function VoiceOnlyAdvisor() {
  const navigate = useNavigate();
  const { activeModal, modalData, closeModal } = useModalContext();
  const { setModelName } = useTelemetry();
  const { selectedPersona, setInteractionMode, languages, sessionId, resetSessionId } = useDemoConfig();
  const { hideOverlay } = useOverlay();
  const [view, setView] = useState<ViewState>('lobby');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  // Sync interactionMode to DemoConfigContext on mount
  useEffect(() => {
    setInteractionMode('voice-only');
  }, [setInteractionMode]);

  const { data: config, isLoading, error: configError } = useQuery({
    queryKey: ['config', selectedPersona, languages.join(','), 'none'],
    queryFn: () => fetchConfig(selectedPersona, languages, 'none'),
  })

  // Synchronize model name to telemetry context
  useEffect(() => {
    if (config?.model_name) {
      setModelName(config.model_name);
    }
  }, [config?.model_name, setModelName]);

  const augmentedConfig = useMemo(() => config ? {
    ...config,
    system_prompt: `${config.system_prompt}\n\nIMPORTANT INSTRUCTION:\nYour session_id is "${sessionId}". You MUST include this exact session_id string as an argument in EVERY tool call you make. Do not forget.`
  } : undefined, [config, sessionId]);

  const {
    connectionState,
    isMuted,
    isRecording,
    isAwaitingInput,
    isThinking,
    isInterrupted,
    isModelSpeaking,
    disconnect,
    activateMic,
    setMuted,
    sendTextMessage
  } = useGeminiLive({
    config: augmentedConfig,
    muteLocalPlayback: false, 
    disableAudioOutput: false, 
    autoConnect: view === 'lobby' || view === 'main',
  });

  // Auto-transition from Lobby to Main for Voice-Only immediately when config is loaded
  useEffect(() => {
    if (view === 'lobby' && config) {
      setTimeout(() => setView('main'), 0);
    }
  }, [view, config]);

  const handleConfirmAppointment = (slot: { id: string, label: string }, location: string, topic: string) => {
    closeModal();
    sendTextMessage(`I have selected the appointment slot: ${slot.label} at the ${location} to discuss ${topic}`);
  };

  const handleMicClick = async () => {
    if (!config) {
      setErrorMessage('API configuration is not loaded yet.')
      return
    }
    
    try {
      if (isRecording) {
        setMuted(!isMuted);
      } else {
        await activateMic();
      }
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Failed to access microphone or connect to Gemini.');
    }
  }

  const handleEndSession = () => {
    hideOverlay();
    disconnect();
    resetSessionId();
    navigate({ to: '/dashboard' });
  }

  const isInitialMount = useRef(true);

  // Listen for generic text message events from global modals
  useEffect(() => {
    const handleSendToAI = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      sendTextMessage(customEvent.detail);
    };

    window.addEventListener('send-to-ai', handleSendToAI);
    return () => {
      window.removeEventListener('send-to-ai', handleSendToAI);
    };
  }, [sendTextMessage]);

  // Reset session and go to lobby when persona or language changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    disconnect();
    resetSessionId();
    setView('lobby');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPersona, languages]);

  // Auto-activate microphone when seamlessly transitioning to Voice-Only mode
  useEffect(() => {
    if (view === 'main' && connectionState === 'connected' && !isRecording && !isMuted) {
      activateMic().catch(e => {
        console.error('Failed to auto-activate mic:', e);
      });
    }
  }, [view, connectionState, isRecording, isMuted, activateMic]);

  if (configError) return <Box display="flex" justifyContent="center" alignItems="center" height="100%"><Typography color="error">Error loading configuration</Typography></Box>;

  if (view === 'lobby') {
    return (
      <LobbyScreen 
        clientName={config?.client_name} 
        disabled={isLoading} 
      />
    )
  }

  const isActive = isRecording && !isMuted;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      <ShowAppointmentSlotsModal
        open={activeModal === 'show_appointment_slots'}
        slots={(modalData as ShowAppointmentSlotsData)?.slots || config?.available_appointments || []}
        initialLocation={(modalData as ShowAppointmentSlotsData)?.location}
        initialTopic={(modalData as ShowAppointmentSlotsData)?.topic}
        isAvatarSpeaking={isModelSpeaking}
        onClose={closeModal}
        onConfirm={handleConfirmAppointment}
      />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0,
          transition: 'all 0.4s ease-in-out',
          position: 'relative'
        }}>
          <VoiceOnlyDisplay isActive={isActive} isThinking={isThinking} isInterrupted={isInterrupted} isAwaitingInput={isAwaitingInput} />
        </Box>
      </Box>

      <SuggestionChips 
        visible={!isActive && !isThinking && connectionState === 'connected'}
        onSuggestionClick={(text) => sendTextMessage(text)}
        suggestions={[
          "What's my cash flow look like?",
          "Show my recent transactions",
          "Analyze my working capital",
          "Schedule a meeting"
        ]}
      />

      <BottomActionBar 
        isActive={isActive}
        isThinking={isThinking}
        isInterrupted={isInterrupted}
        isAwaitingInput={isAwaitingInput}
        isAvatarDisabled={true}
        heygenStatus="idle"
        connectionState={connectionState}
        isMuted={isMuted}
        handleEndSession={handleEndSession}
        handleMicClick={handleMicClick}
      />

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(undefined)}
        message={errorMessage}
      />
    </Box>
  )
}
