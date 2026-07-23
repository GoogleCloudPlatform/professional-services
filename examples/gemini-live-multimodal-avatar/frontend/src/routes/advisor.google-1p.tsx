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
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchConfig } from '../api/config'
import { useGeminiLive } from '../hooks/useGeminiLive'
import { GeminiAvatarDisplay } from '../components/GeminiAvatarDisplay'
import type { GeminiAvatarDisplayHandle } from '../components/GeminiAvatarDisplay'
import { LobbyScreen } from '../components/LobbyScreen'
import { SuggestionChips } from '../components/SuggestionChips'
import { BottomActionBar } from '../components/BottomActionBar'
import { useTelemetry } from '../context/TelemetryContext'
import ShowAppointmentSlotsModal from '../components/ShowAppointmentSlotsModal'
import { useModalContext, type ShowAppointmentSlotsData } from '../context/ModalContext'
import { useDemoConfig } from '../context/DemoConfigContext'
import { useOverlay } from '../context/OverlayContext'

export const Route = createFileRoute('/advisor/google-1p')({
  component: Google1PAdvisor,
})

type ViewState = 'lobby' | 'main';

export function Google1PAdvisor() {
  const navigate = useNavigate();
  const { activeModal, modalData, closeModal } = useModalContext();
  const { setModelName } = useTelemetry();
  const { selectedPersona, setInteractionMode, languages, sessionId, resetSessionId, customAvatar, customVoice, customLanguageCode } = useDemoConfig();
  const { hideOverlay } = useOverlay();
  const [view, setView] = useState<ViewState>('lobby');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  
  const avatar1PRef = useRef<GeminiAvatarDisplayHandle>(null)

  // Sync interactionMode to DemoConfigContext on mount
  useEffect(() => {
    setInteractionMode('google_1p');
  }, [setInteractionMode]);

  const { data: config, isLoading, error: configError } = useQuery({
    queryKey: ['config', selectedPersona, languages.join(','), 'google_1p'],
    queryFn: () => fetchConfig(selectedPersona, languages, 'google_1p'),
  })

  // Synchronize model name to telemetry context
  useEffect(() => {
    if (config?.model_name) {
      setModelName(config.model_name);
    }
  }, [config?.model_name, setModelName]);

  const augmentedConfig = useMemo(() => config ? {
    ...config,
    google_1p_avatar_name: customAvatar || config.google_1p_avatar_name,
    google_1p_voice_name: customVoice || config.google_1p_voice_name,
    voice_language_code: customLanguageCode || config.voice_language_code,
    system_prompt: `${config.system_prompt}\n\nIMPORTANT INSTRUCTION:\nYour session_id is "${sessionId}". You MUST include this exact session_id string as an argument in EVERY tool call you make. Do not forget.`
  } : undefined, [config, sessionId, customAvatar, customVoice, customLanguageCode]);

  const handleVideoStart = useCallback(() => {
    setView('main');
  }, []);

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
    onVideoChunk: (payload) => avatar1PRef.current?.playVideoChunk(payload.base64, payload.mimeType),
    onInterrupt: () => avatar1PRef.current?.interrupt(),
    muteLocalPlayback: false, // 1P keeps local audio output active
    disableAudioOutput: false, 
    autoConnect: view === 'lobby' || view === 'main',
  });

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
    avatar1PRef.current?.interrupt();
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

  // Reset session and go to lobby when persona, language, or custom settings change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    disconnect();
    resetSessionId();
    setTimeout(() => {
      setView('lobby');
    }, 0);
  }, [selectedPersona, languages, customAvatar, customVoice, customLanguageCode, disconnect, resetSessionId]);

  if (configError) return <Box display="flex" justifyContent="center" alignItems="center" height="100%"><Typography color="error">Error loading configuration</Typography></Box>;

  const avatarStatus = connectionState === 'connected' ? 'ready' : 'initializing';
  const isActive = isRecording && !isMuted;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      {view === 'lobby' && (
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 50 }}>
          <LobbyScreen 
            clientName={config?.client_name} 
            disabled={isLoading || connectionState === 'connecting'} 
          />
        </Box>
      )}

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
          <Box sx={{ 
            height: '100%', 
            width: '100%', 
            visibility: view === 'main' ? 'visible' : 'hidden',
            position: view === 'main' ? 'relative' : 'absolute',
            zIndex: view === 'main' ? 1 : -1
          }}>
            <GeminiAvatarDisplay 
              ref={avatar1PRef}
              isConnected={connectionState === 'connected'}
              isSpeaking={!isThinking && connectionState === 'connected'}
              onVideoStart={handleVideoStart}
            />
          </Box>
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
        isAvatarDisabled={false}
        heygenStatus={avatarStatus}
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
