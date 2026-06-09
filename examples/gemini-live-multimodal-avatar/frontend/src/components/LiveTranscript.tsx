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

import { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

interface LiveTranscriptProps {
  type: 'input' | 'output';
}

export const LiveTranscript = ({ type }: LiveTranscriptProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const text = customEvent.detail || '';
      const hasText = !!text;
      
      if (type === 'output') {
          // Removed noisy partial transcription logging
      }

      requestAnimationFrame(() => {
        if (textRef.current) {
          textRef.current.innerText = text;
        }
        
        if (containerRef.current) {
          // Asymmetric transition: Fast out (0.15s), smooth in (0.3s)
          containerRef.current.style.transition = hasText 
            ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
            : 'all 0.15s ease-in';

          if (hasText) {
            containerRef.current.style.opacity = '1';
            containerRef.current.style.transform = 'translateX(-50%) translateY(0)';
          } else {
            containerRef.current.style.opacity = '0';
            containerRef.current.style.transform = 'translateX(-50%) translateY(10px)';
          }
        }
      });
    };

    window.addEventListener(`transcript-update-${type}`, handler);
    return () => {
      window.removeEventListener(`transcript-update-${type}`, handler);
    };
  }, [type]);

  // The "Invisible Approach" for User Input
  if (type === 'input') {
    return null;
  }

  return (
    <Box
      ref={containerRef}
      role="status"
      aria-live="polite"
      sx={{
        position: 'absolute',
        zIndex: 20,
        opacity: 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none',
        contain: 'layout paint',
        bottom: '10%',
        left: '50%',
        transform: 'translateX(-50%) translateY(10px)',
        width: '80%',
        textAlign: 'center',
      }}
    >
      <Typography 
        variant="h5" 
        component="span" 
        ref={textRef}
        sx={{
          fontWeight: 500,
          color: 'rgba(255, 255, 255, 0.95)',
          textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 4px 16px rgba(0,0,0,0.7)',
          bgcolor: 'transparent',
          lineHeight: 1.4,
          display: 'inline-block',
          letterSpacing: 0.3,
          maxWidth: '900px',
        }}
      />
    </Box>
  );
};
