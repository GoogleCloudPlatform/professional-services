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
import { Box, Typography, IconButton, Paper } from '@mui/material';
import { ScanFace } from 'lucide-react';

export interface Persona {
  id: string;
  label: string;
}

export type InteractionMode = 'voice-only' | 'heygen' | 'google_1p';

export interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
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
      }}
    >
      <Box sx={{ mb: 8, textAlign: 'center' }}>
        <img src="/logo-with-text.svg" alt="Cymbal" style={{ height: 40 }} />
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          bgcolor: 'transparent',
          maxWidth: 400,
          textAlign: 'center',
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight="800" sx={{ letterSpacing: -0.5, color: 'primary.main' }}>
          Commercial Banking
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 6, fontWeight: 500 }}>
          Secure Biometric Authentication
        </Typography>

        <IconButton
          onClick={onLogin}
          data-testid="login-icon"
          sx={{
            width: 100,
            height: 100,
            bgcolor: 'white',
            color: 'primary.main',
            border: '1px solid',
            borderColor: 'grey.200',
            borderRadius: 4,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            '&:hover': {
              bgcolor: 'grey.50',
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
              borderColor: 'primary.light',
            },
            '&:active': {
              transform: 'translateY(0)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }
          }}
        >
          <ScanFace size={48} strokeWidth={1.5} />
        </IconButton>

        <Typography variant="caption" sx={{ mt: 4, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>
          Sign in with FaceID
        </Typography>
      </Paper>
    </Box>
  );
};