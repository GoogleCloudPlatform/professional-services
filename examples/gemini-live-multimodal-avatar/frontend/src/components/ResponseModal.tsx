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

import React, { useEffect } from 'react';
import { Box, Modal, Typography, IconButton, Divider, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ResponseModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  autoCloseDuration?: number;
  maxHeight?: string | number;
  height?: string | number;
  disablePortal?: boolean;
}

const ResponseModal: React.FC<ResponseModalProps> = ({ 
  open, 
  onClose, 
  title, 
  children, 
  autoCloseDuration, 
  maxHeight, 
  height,
  disablePortal = true
}) => {
  useEffect(() => {
    if (open && autoCloseDuration) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [open, autoCloseDuration, onClose]);

  useEffect(() => {
    if (!open && document.activeElement instanceof HTMLElement) {
      // Blur the active element when the modal begins closing to prevent 
      // Chrome's "Blocked aria-hidden because descendant retained focus" warning
      // during the exit animation.
      document.activeElement.blur();
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      disablePortal={disablePortal}
      disableScrollLock
      disableAutoFocus
      disableEnforceFocus
      disableRestoreFocus
      hideBackdrop={false}
      slotProps={{
        backdrop: {
          sx: {
            position: disablePortal ? 'absolute' : 'fixed',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)'
          }
        }
      }}
      sx={{ 
        position: disablePortal ? 'absolute' : 'fixed',
        zIndex: 1300,
        display: 'flex',
        alignItems: disablePortal ? 'flex-end' : { xs: 'flex-end', md: 'center' },
        justifyContent: 'center',
        inset: 0,
      }}
    >
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Box
          role="dialog"
          aria-labelledby="response-modal-title"
          sx={{
            width: '100%',
            maxWidth: disablePortal ? '100%' : { xs: '100%', md: 850 },
            height: height || 'auto',
            maxHeight: maxHeight || '85%',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderBottomLeftRadius: disablePortal ? 0 : { xs: 0, md: 24 },
            borderBottomRightRadius: disablePortal ? 0 : { xs: 0, md: 24 },
            bgcolor: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderBottom: 'none',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            outline: 'none',
          }}
        >
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography id="response-modal-title" variant="h6" fontWeight={600} color="white">
              {title}
            </Typography>
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                '&:hover': { color: 'white', bgcolor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
          <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto', color: 'rgba(255, 255, 255, 0.9)' }}>
            {children}
          </Box>
        </Box>
      </Slide>
    </Modal>
  );
};

export default ResponseModal;
