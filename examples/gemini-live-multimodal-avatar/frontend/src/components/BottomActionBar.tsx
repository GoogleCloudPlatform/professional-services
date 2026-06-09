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
import { Box, Button, CircularProgress, IconButton } from '@mui/material';
import { Mic, MicOff, XCircle } from 'lucide-react';
import { keyframes } from '@mui/system';
import { AudioVisualizer } from './AudioVisualizer';

const pulseGlow = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(196, 31, 62, 0.4);
  }
  70% {
    box-shadow: 0 0 0 20px rgba(196, 31, 62, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(196, 31, 62, 0);
  }
`;

const pulseGlowWarning = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(255, 179, 0, 0.4);
  }
  70% {
    box-shadow: 0 0 0 20px rgba(255, 179, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 179, 0, 0);
  }
`;

interface BottomActionBarProps {
  isActive: boolean;
  isThinking?: boolean;
  isInterrupted?: boolean;
  isAwaitingInput?: boolean;
  isAvatarDisabled: boolean;
  heygenStatus: string;
  connectionState: string;
  isMuted: boolean;
  handleEndSession: () => void;
  handleMicClick: () => void;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  isActive,
  isThinking = false,
  isInterrupted = false,
  isAwaitingInput = false,
  isAvatarDisabled,
  heygenStatus,
  connectionState,
  isMuted,
  handleEndSession,
  handleMicClick
}) => {
  return (
    <Box sx={{ 
      p: 4,
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      position: 'relative',
      bgcolor: 'background.default',
      gap: 4
    }}>
      {/* Audio Visualizer pinned just above the mic (Space reserved to prevent layout shifts) */}
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        display: 'flex', 
        justifyContent: 'center',
        opacity: (isActive || isThinking || isInterrupted || isAwaitingInput) && !isAvatarDisabled && heygenStatus !== 'error' ? 1 : 0,
        visibility: (isActive || isThinking || isInterrupted || isAwaitingInput) && !isAvatarDisabled && heygenStatus !== 'error' ? 'visible' : 'hidden',
        transition: 'opacity 0.3s ease, visibility 0.3s ease'
      }}>
        <AudioVisualizer isActive={isActive} isThinking={isThinking} isInterrupted={isInterrupted} isAwaitingInput={isAwaitingInput} variant="bars" />
      </Box>
      
      {connectionState === 'connected' && (
        <IconButton 
          onClick={handleEndSession}
          sx={{ 
            color: 'error.main', 
            bgcolor: 'rgba(211, 47, 47, 0.1)', 
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(211, 47, 47, 0.2)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': { 
              bgcolor: 'rgba(211, 47, 47, 0.25)', 
              color: 'error.dark', 
              transform: 'scale(1.05)' 
            },
            '&:active': { transform: 'scale(0.92)' }
          }}
        >
          <XCircle size={32} />
        </IconButton>
      )}

      <Box sx={{ position: 'relative' }}>
        {connectionState === 'connected' && isMuted && (
          <CircularProgress size={80} sx={{ position: 'absolute', top: -4, left: -4, color: 'secondary.main', opacity: 0.5 }} />
        )}

        <Button
          onClick={handleMicClick}
          variant="contained"
          sx={{
            minWidth: 72,
            width: 72,
            height: 72,
            borderRadius: '50%',
            bgcolor: isAwaitingInput ? '#FFB300' : (isActive ? 'secondary.main' : 'primary.main'),
            color: 'white',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: isAwaitingInput ? '#FFA000' : (isActive ? 'secondary.dark' : 'primary.dark'),
              transform: 'scale(1.05)'
            },
            '&:active': {
              transform: 'scale(0.92)'
            },
            animation: isAwaitingInput ? `${pulseGlowWarning} 2s infinite` : (isActive ? `${pulseGlow} 2s infinite` : 'none'),
            boxShadow: (isActive || isAwaitingInput) ? 'none' : '0 8px 32px rgba(196, 31, 62, 0.15)',
            zIndex: 10,
          }}
        >
          {isActive || isAwaitingInput ? <Mic size={32} /> : <MicOff size={32} />}
        </Button>
      </Box>
    </Box>
  );
};
