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
import { Box, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ResponseModal from './ResponseModal';

export interface ActionSuccessData {
  title: string;
  message: string;
  details?: Record<string, string>;
}

interface ActionSuccessModalProps {
  open: boolean;
  onClose: () => void;
  data: ActionSuccessData | null;
}

const ActionSuccessModal: React.FC<ActionSuccessModalProps> = ({ open, onClose, data }) => {
  if (!data) return null;

  return (
    <ResponseModal open={open} onClose={onClose} title={data.title} autoCloseDuration={4000}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mt: 4 }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {data.message}
        </Typography>
        {data.details && Object.keys(data.details).length > 0 && (
          <Box sx={{ mt: 3, width: '100%', bgcolor: 'rgba(0,0,0,0.2)', p: 2, borderRadius: 2 }}>
            {Object.entries(data.details).map(([key, value]) => (
              <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                  {key.replace('_', ' ')}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </ResponseModal>
  );
};

export default ActionSuccessModal;
