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

import { useEffect, useRef, useImperativeHandle, forwardRef, memo, useState } from 'react';
import { LiveAvatarSession } from '@heygen/liveavatar-web-sdk';
import { Box, CircularProgress, Typography, IconButton } from '@mui/material';
import { X } from 'lucide-react';
import { useOverlay } from '../context/OverlayContext';
import { useErrorContext } from '../context/ErrorContext';

import { LoanDrawdownOverlay, WorkingCapitalOverlay } from './ContextualOverlays';

import { LiveTranscript } from './LiveTranscript';

interface AvatarDisplayProps {
  session: LiveAvatarSession | null;
  onEndSession?: () => void;
  isProcessing?: boolean;
}

export interface AvatarDisplayHandle {
  speak: (base64Audio: string) => void;
  interrupt: () => void;
  resetLogGates: () => void;
}

export const AvatarDisplay = memo(forwardRef<AvatarDisplayHandle, AvatarDisplayProps>(({ session, onEndSession }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { addLog } = useErrorContext();
  const hasLoggedChunkRef = useRef<boolean>(false);
  const audioQueueRef = useRef<string[]>([]);
  const { activeOverlay } = useOverlay();
  const [isVideoReady, setIsVideoReady] = useState(false);

  useImperativeHandle(ref, () => ({
    speak: (base64Audio: string) => {
      if (session) {
        if (!hasLoggedChunkRef.current) {
            addLog('info', '[AvatarDisplay] Sending first audio chunk of turn to HeyGen SDK (repeatAudio)');
            hasLoggedChunkRef.current = true;
        }
        session.repeatAudio(base64Audio);
      } else {
        addLog('info', '[AvatarDisplay] Session not ready, queuing audio chunk');
        audioQueueRef.current.push(base64Audio);
      }
    },
    interrupt: () => {
      audioQueueRef.current = []; // Clear queue on interrupt
      if (session) {
        addLog('info', '[AvatarDisplay] Interrupting HeyGen');
        hasLoggedChunkRef.current = false; // Reset log gate on interrupt
        session.interrupt();
      }
    },
    resetLogGates: () => {
        hasLoggedChunkRef.current = false;
    }
  }));

  useEffect(() => {
    if (session && videoRef.current) {
        addLog('info', '[AvatarDisplay] Attaching video element...');
        session.attach(videoRef.current);
        
        // Flush queue if there's pending audio
        if (audioQueueRef.current.length > 0) {
            addLog('info', `[AvatarDisplay] Flushing ${audioQueueRef.current.length} queued audio chunks`);
            audioQueueRef.current.forEach(chunk => session.repeatAudio(chunk));
            audioQueueRef.current = [];
            hasLoggedChunkRef.current = true;
        }
    } else if (!session) {
        addLog('info', '[AvatarDisplay] Rendered but session is null');
    }
  }, [session, addLog]);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', borderRadius: 4, overflow: 'hidden', bgcolor: 'grey.200' }}>
      {(!session || !isVideoReady) && (
        <Box 
          display="flex" 
          flexDirection="column" 
          justifyContent="center" 
          alignItems="center" 
          height="100%" 
          gap={2} 
          position="absolute" 
          top={0} left={0} right={0} bottom={0}
          zIndex={20}
          bgcolor="grey.200"
        >
          <CircularProgress />
          <Typography color="text.secondary">Initializing Avatar...</Typography>
        </Box>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        onCanPlay={() => setIsVideoReady(true)}
        style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            transform: 'translateZ(0)', // Force dedicated GPU layer
            willChange: 'transform',    // Hint to browser compositor
            opacity: isVideoReady ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out'
        }}
      />

      {/* Subtitle Overlays */}
      <LiveTranscript type="output" />
      <LiveTranscript type="input" />

      {/* Dismiss / End Call FAB */}
      {onEndSession && (
        <IconButton
          onClick={onEndSession}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            bgcolor: 'rgba(0,0,0,0.5)',
            color: 'white',
            backdropFilter: 'blur(4px)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            zIndex: 30
          }}
        >
          <X size={20} />
        </IconButton>
      )}

      {/* Bottom Scrim for Legibility */}
      {activeOverlay && (
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
          zIndex: 5
        }} />
      )}

      {/* Contextual Overlays */}
      <Box sx={{ 
        position: 'absolute', 
        bottom: 24, 
        left: 0, 
        right: 0, 
        display: 'flex', 
        justifyContent: 'center',
        px: 2,
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        <Box sx={{ pointerEvents: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
          {activeOverlay === 'loan_drawdown' && <LoanDrawdownOverlay />}
          {activeOverlay === 'working_capital' && <WorkingCapitalOverlay />}
        </Box>
      </Box>
    </Box>
  );
}));

AvatarDisplay.displayName = 'AvatarDisplay';
