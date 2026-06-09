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
import { Box } from '@mui/material';
import { AudioVisualizer } from './AudioVisualizer';
import { LiveTranscript } from './LiveTranscript';

interface VoiceOnlyDisplayProps {
  isActive: boolean;
  isThinking?: boolean;
  isInterrupted?: boolean;
  isAwaitingInput?: boolean;
}

export const VoiceOnlyDisplay: React.FC<VoiceOnlyDisplayProps> = ({ 
  isActive, 
  isThinking = false, 
  isInterrupted = false,
  isAwaitingInput = false
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      gap: 3,
      width: '100%',
      height: '100%',
      position: 'relative',
      background: isActive || isAwaitingInput
        ? isAwaitingInput
          ? 'radial-gradient(ellipse at 80% 20%, rgba(255,179,0,0.08) 0%, rgba(255,179,0,0) 60%), radial-gradient(ellipse at 20% 80%, rgba(255,179,0,0.05) 0%, rgba(255,179,0,0) 60%)'
          : 'radial-gradient(ellipse at 80% 20%, rgba(0,191,165,0.08) 0%, rgba(0,191,165,0) 60%), radial-gradient(ellipse at 20% 80%, rgba(0,158,37,0.05) 0%, rgba(0,158,37,0) 60%)'
        : isThinking
          ? 'radial-gradient(ellipse at 80% 20%, rgba(0,150,255,0.08) 0%, rgba(0,150,255,0) 60%)'
          : isInterrupted
            ? 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)'
            : 'radial-gradient(ellipse at 80% 20%, rgba(0,191,165,0.02) 0%, rgba(0,191,165,0) 60%)',
      transition: 'background 1.5s ease-in-out'
    }}>
      <Box sx={{ transform: 'scale(1.5)', mb: 1 }}>
        <AudioVisualizer isActive={isActive} isThinking={isThinking} isInterrupted={isInterrupted} isAwaitingInput={isAwaitingInput} />
      </Box>
      
      {/* Fixed Positioning for Transcripts in Voice-Only Mode */}
      <LiveTranscript type="output" />
      <LiveTranscript type="input" />
    </Box>
  );
};
