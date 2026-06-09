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

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  TextField,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export interface AppointmentSlot {
  id: string;
  label: string;
}

interface ShowAppointmentSlotsModalProps {
  open: boolean;
  slots: AppointmentSlot[];
  initialLocation?: string;
  initialTopic?: string;
  isAvatarSpeaking?: boolean;
  onClose: () => void;
  onConfirm: (slot: AppointmentSlot, location: string, topic: string) => void;
}

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 400 },
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const ShowAppointmentSlotsModal: React.FC<ShowAppointmentSlotsModalProps> = ({
  open,
  slots,
  initialLocation,
  initialTopic,
  isAvatarSpeaking,
  onClose,
  onConfirm,
}) => {
  const [selectedSlotId, setSelectedSlotId] = useState<string | undefined>(undefined);
  const [prevOpen, setPrevOpen] = useState(false);
  const [location, setLocation] = useState(initialLocation || '');
  const [topic, setTopic] = useState(initialTopic || '');

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setLocation(initialLocation || '');
      setTopic(initialTopic || '');
      setSelectedSlotId(undefined);
    }
  }

  useEffect(() => {
    if (!open && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [open]);

  const handleConfirm = () => {
    const selectedSlot = slots.find((s) => s.id === selectedSlotId);
    if (selectedSlot) {
      onConfirm(selectedSlot, location, topic);
    }
  };

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      aria-labelledby="modal-modal-title"
      disableScrollLock
      disablePortal
      disableAutoFocus
      disableEnforceFocus
      disableRestoreFocus
      hideBackdrop={false}
      slotProps={{
        backdrop: {
          sx: {
            position: 'absolute',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }
      }}
      sx={{ position: 'absolute', zIndex: 1300 }}
    >
      <Box sx={style}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Schedule Appointment
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Typography variant="body2" color="text.secondary" mb={3}>
          Please select an available time slot for your appointment.
        </Typography>

        <Stack spacing={2} mb={3}>
          <TextField
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            variant="outlined"
            size="small"
            fullWidth
          />
          <TextField
            label="Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            variant="outlined"
            size="small"
            fullWidth
          />
        </Stack>

        <Stack spacing={2} mb={4}>
          {(slots || []).map((slot) => (
            <Paper
              key={slot.id}              variant="outlined"
              sx={{
                p: 2,
                cursor: 'pointer',
                borderColor: selectedSlotId === slot.id ? 'primary.main' : 'divider',
                bgcolor: selectedSlotId === slot.id ? 'primary.light' : 'background.paper',
                '&:hover': {
                  bgcolor: selectedSlotId === slot.id ? 'primary.light' : 'action.hover',
                },
              }}
              onClick={() => setSelectedSlotId(slot.id)}
            >
              <Typography variant="body1" align="center">
                {slot.label}
              </Typography>
            </Paper>
          ))}
        </Stack>

        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!selectedSlotId || isAvatarSpeaking}
            onClick={handleConfirm}
          >
            {isAvatarSpeaking ? 'Please wait...' : 'Confirm Appointment'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ShowAppointmentSlotsModal;
