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
import { Box, Typography, Paper, Stack, Divider, CircularProgress, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Shield, Lock } from 'lucide-react';
import { fadeIn, pulse } from '../theme/animations';

interface LobbyScreenProps {
  clientName?: string;
  disabled?: boolean;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ clientName }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        bgcolor: 'background.default',
        p: 3,
        animation: `${fadeIn} 0.6s ease-out`,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 5,
          width: '100%',
          maxWidth: 400,
          borderRadius: 3,
          textAlign: 'center',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
          bgcolor: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle top accent bar */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: 'primary.main' }} />
        
        <Stack spacing={4} alignItems="center">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.secondary.main, 0.05),
              color: 'primary.main',
              animation: `${pulse} 3s infinite ease-in-out`,
            }}
          >
            <Shield size={40} strokeWidth={1.5} />
          </Box>

          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 2, display: 'block', mb: 1 }}>
              Institutional Access
            </Typography>
            <Typography variant="h5" fontWeight="700" sx={{ color: 'text.primary', letterSpacing: -0.5 }}>
              Connecting to Advisor
            </Typography>
          </Box>

          <Divider sx={{ width: '100%', opacity: 0.6 }} />

          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, px: 2, lineHeight: 1.6 }}>
              {clientName 
                ? `Securing high-priority session for ${clientName}. Establishing encrypted real-time channel.` 
                : 'Initializing institutional-grade encrypted real-time link with your dedicated advisor.'}
            </Typography>
            
            <Stack spacing={3} alignItems="center">
              <CircularProgress 
                size={24} 
                thickness={4} 
                sx={{ color: 'primary.main', opacity: 0.8 }} 
              />
              
              <Stack 
                direction="row" 
                spacing={1.5} 
                alignItems="center" 
                justifyContent="center"
                sx={{ 
                  bgcolor: alpha(theme.palette.secondary.main, 0.03), 
                  py: 1.5, 
                  px: 3, 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Lock size={16} color={theme.palette.text.secondary} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                  End-to-End Encryption
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Paper>
      
      <Stack direction="row" spacing={2} sx={{ mt: 4, opacity: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Security Verified
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>•</Typography>
        <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Private Session
        </Typography>
      </Stack>
    </Box>
  );
};
