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
import { Box, Typography, Stack, Paper, LinearProgress } from '@mui/material';
import { Landmark, TrendingUp } from 'lucide-react';

export const LoanDrawdownOverlay: React.FC = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 4,
        bgcolor: 'rgba(6, 78, 59, 0.9)',
        color: 'white',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%',
        maxWidth: 340,
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }}>
            <Landmark size={20} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, textTransform: 'uppercase' }}>
              Loan Drawdown Request
            </Typography>
            <Typography variant="h6" fontWeight="800">
              $150,000.00
            </Typography>
          </Box>
        </Stack>
        
        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Facility Utilization</Typography>
            <Typography variant="caption" fontWeight="700">62%</Typography>
          </Stack>
          <LinearProgress 
            variant="determinate" 
            value={62} 
            sx={{ 
              height: 6, 
              borderRadius: 3, 
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': { bgcolor: 'white' }
            }} 
          />
        </Box>

        <Typography variant="caption" sx={{ opacity: 0.7, fontStyle: 'italic' }}>
          * Pending final site inspection for Lot 7
        </Typography>
      </Stack>
    </Paper>
  );
};

export const WorkingCapitalOverlay: React.FC = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 4,
        bgcolor: 'rgba(30, 41, 59, 0.9)',
        color: 'white',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%',
        maxWidth: 340,
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }}>
            <TrendingUp size={20} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, textTransform: 'uppercase' }}>
              Working Capital Analysis
            </Typography>
            <Typography variant="h6" fontWeight="800">
              Positive Cash Flow
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ opacity: 0.6, display: 'block' }}>DSCR</Typography>
            <Typography variant="subtitle2" fontWeight="700">1.45x</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ opacity: 0.6, display: 'block' }}>Quick Ratio</Typography>
            <Typography variant="subtitle2" fontWeight="700">1.2x</Typography>
          </Box>
        </Stack>

        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          Current liquidity supports a $250k extension.
        </Typography>
      </Stack>
    </Paper>
  );
};
