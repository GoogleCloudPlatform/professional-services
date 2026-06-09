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

import { Box, Paper, Typography, Select, MenuItem, FormControl, CircularProgress, IconButton, ToggleButton, ToggleButtonGroup, Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useDemoConfig, SUPPORTED_LANGUAGES } from '../context/DemoConfigContext';
import React, { useState } from 'react';
import type { Persona } from './LoginScreen';
import { ChevronLeft, ChevronRight, Settings, Globe } from 'lucide-react';

export const DemoSidebar = () => {
  const { selectedPersona, setSelectedPersona, languages, setLanguages, interactionMode, setInteractionMode } = useDemoConfig();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: personas = [], isLoading } = useQuery<Persona[]>({
    queryKey: ['scenarios'],
    queryFn: async () => {
      const response = await apiClient.get<Persona[]>('/v1/scenarios');
      return response.data;
    },
  });

  // Keep selected persona in sync if it's missing or if data just loaded
  React.useEffect(() => {
    const personaList = personas || [];
    if (personaList.length > 0 && (!selectedPersona || !personaList.find(p => p.id === selectedPersona))) {
      setSelectedPersona(personaList[0].id);
    }
  }, [personas, selectedPersona, setSelectedPersona]);

  return (
    <Paper
      elevation={0}
      sx={{
        width: isCollapsed ? 64 : 320,
        height: '100%',
        bgcolor: 'white',
        borderRight: '1px solid',
        borderColor: 'grey.200',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: { xs: 0, sm: '8px 0 0 8px' },
      }}
    >
      <Box sx={{ 
        p: isCollapsed ? 1 : 3, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 3,
        height: '100%'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isCollapsed ? 'center' : 'space-between',
          mb: isCollapsed ? 0 : 2 
        }}>
          {!isCollapsed && (
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, fontWeight: 'bold', display: 'block' }}>
              Demo Settings
            </Typography>
          )}
          <IconButton size="small" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </IconButton>
        </Box>

        {!isCollapsed && (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Scenario Persona
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    id="demo-scenario-select"
                    value={selectedPersona || ''}
                    onChange={(e) => setSelectedPersona(e.target.value)}
                    disabled={isLoading}
                    displayEmpty
                    sx={{ '& .MuiSelect-select': { whiteSpace: 'normal', wordBreak: 'break-word', py: 1.5, fontSize: '0.875rem' } }}
                  >
                    {isLoading && (
                      <MenuItem value={selectedPersona || ''} disabled>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={16} />
                          Loading scenarios...
                        </Box>
                      </MenuItem>
                    )}
                    {!isLoading && (personas || []).map((p) => (
                      <MenuItem key={p.id} value={p.id} sx={{ whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '0.875rem' }}>
                        {p.label}
                      </MenuItem>
                    ))}
                    {!isLoading && selectedPersona && !(personas || []).find(p => p.id === selectedPersona) && (
                      <MenuItem value={selectedPersona} sx={{ display: 'none' }}>{selectedPersona}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Globe size={14} /> Advisor Language
                </Typography>
                <ToggleButtonGroup
                  value={languages}
                  onChange={(_, val) => {
                    // Prevent deselecting all languages
                    if (val.length > 0) setLanguages(val);
                  }}
                  aria-label="advisor language"
                  fullWidth
                  size="small"
                  color="primary"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <ToggleButton 
                      key={lang.value} 
                      value={lang.value} 
                      sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'none' }}
                    >
                      {lang.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
                  Interaction Mode (Agent Type)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    onClick={() => setInteractionMode('voice-only')}
                    variant={interactionMode === 'voice-only' ? 'contained' : 'outlined'}
                    size="small"
                    fullWidth
                    sx={{ textTransform: 'none', fontSize: '0.825rem', justifyContent: 'flex-start', py: 1, px: 1.5, fontWeight: 700 }}
                  >
                    Voice-Only Advisor
                  </Button>
                  <Button
                    onClick={() => setInteractionMode('heygen')}
                    variant={interactionMode === 'heygen' ? 'contained' : 'outlined'}
                    size="small"
                    fullWidth
                    sx={{ textTransform: 'none', fontSize: '0.825rem', justifyContent: 'flex-start', py: 1, px: 1.5, fontWeight: 700 }}
                  >
                    HeyGen (3P) Video Avatar
                  </Button>
                  <Button
                    onClick={() => setInteractionMode('google_1p')}
                    variant={interactionMode === 'google_1p' ? 'contained' : 'outlined'}
                    size="small"
                    fullWidth
                    sx={{ textTransform: 'none', fontSize: '0.825rem', justifyContent: 'flex-start', py: 1, px: 1.5, fontWeight: 700 }}
                  >
                    Google (1P) Video Avatar
                  </Button>
                </Box>
              </Box>
            </Box>

            <Box sx={{ mt: 'auto', p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed', borderColor: 'grey.300' }}>
               <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                  Settings change instantly and will reset your session.
               </Typography>
            </Box>
          </>
        )}

        {isCollapsed && (
          <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center', pb: 2 }}>
            <Settings size={20} color="#64748b" />
          </Box>
        )}
      </Box>
    </Paper>
  );
};