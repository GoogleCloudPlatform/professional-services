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
import { Box, Chip, Stack } from '@mui/material';
import { Sparkles } from 'lucide-react';

interface SuggestionChipsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  visible: boolean;
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({ 
  suggestions, 
  onSuggestionClick, 
  visible 
}) => {
  return (
    <Box 
      sx={{ 
        position: 'absolute',
        bottom: 120, // Positioned above the BottomActionBar
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        px: 2,
        opacity: visible ? 1 : 0,
        visibility: visible ? 'visible' : 'hidden',
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: visible ? 'auto' : 'none',
        zIndex: 15
      }}
    >
      <Stack 
        direction="row" 
        spacing={1.5} 
        sx={{ 
          overflowX: 'auto', 
          pb: 1,
          px: 1,
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {suggestions.map((text, i) => (
          <Chip
            key={i}
            label={text}
            onClick={() => onSuggestionClick(text)}
            icon={<Sparkles size={14} style={{ color: 'inherit' }} />}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'text.secondary',
              height: 40,
              px: 1,
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.12)',
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              },
              '&:active': {
                transform: 'translateY(0) scale(0.96)'
              },
              '& .MuiChip-label': {
                px: 1.5
              }
            }}
          />
        ))}
      </Stack>
    </Box>
  );
};
