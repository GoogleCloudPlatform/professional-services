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

import { Box, Typography, Stack, Button, Paper, keyframes } from '@mui/material';
import { LayoutDashboard, CreditCard, MessageCircle, PieChart, User } from 'lucide-react';

const subtlePulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(6, 78, 59, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(6, 78, 59, 0); }
  100% { box-shadow: 0 0 0 0 rgba(6, 78, 59, 0); }
`;

interface BottomNavigationProps {
  onAdvisorClick: () => void;
}

export function BottomNavigation({ onAdvisorClick }: BottomNavigationProps) {
  return (
    <Paper elevation={0} sx={{ 
      position: 'absolute', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      p: 1, 
      pb: 1.5,
      bgcolor: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid',
      borderColor: 'divider',
      zIndex: 100
    }}>
      <Stack direction="row" justifyContent="space-around" alignItems="center">
        <Stack alignItems="center" spacing={0.25} sx={{ color: 'primary.main', flex: 1 }}>
          <LayoutDashboard size={20} />
          <Typography variant="caption" fontWeight="700" sx={{ fontSize: '0.6rem' }}>Home</Typography>
        </Stack>
        <Stack alignItems="center" spacing={0.25} sx={{ color: 'text.disabled', flex: 1 }}>
          <CreditCard size={20} />
          <Typography variant="caption" fontWeight="600" sx={{ fontSize: '0.6rem' }}>Cards</Typography>
        </Stack>
        
        {/* Central Advisor Button */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', mt: -3 }}>
          <Button
            onClick={onAdvisorClick}
            variant="contained"
            color="primary"
            sx={{ 
              width: 56, 
              height: 56, 
              borderRadius: '50%', 
              minWidth: 0, 
              p: 0,
              boxShadow: '0 6px 16px rgba(196, 31, 62, 0.3)',
              border: 'none',
              animation: `${subtlePulse} 3s infinite ease-in-out`,
              transform: 'translateY(-4px)'
            }}
          >
            <MessageCircle size={28} color="white" />
          </Button>
          <Typography variant="caption" fontWeight="700" color="primary.main" sx={{ mt: 0.5, fontSize: '0.6rem' }}>
            My Advisor
          </Typography>
        </Box>

        <Stack alignItems="center" spacing={0.25} sx={{ color: 'text.disabled', flex: 1 }}>
          <PieChart size={20} />
          <Typography variant="caption" fontWeight="600" sx={{ fontSize: '0.6rem' }}>Investments</Typography>
        </Stack>
        <Stack alignItems="center" spacing={0.25} sx={{ color: 'text.disabled', flex: 1 }}>
          <User size={20} />
          <Typography variant="caption" fontWeight="600" sx={{ fontSize: '0.6rem' }}>Profile</Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}