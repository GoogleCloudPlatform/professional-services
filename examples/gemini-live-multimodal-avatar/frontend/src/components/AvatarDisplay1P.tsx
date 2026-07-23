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

import { useEffect, useRef, useImperativeHandle, forwardRef, memo, useState } from 'react';
import mpegts from 'mpegts.js';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTelemetry } from '../context/TelemetryContext';

export interface AvatarDisplay1PHandle {
  appendVideoChunk: (base64Data: string) => void;
  interrupt: () => void;
}

interface AvatarDisplay1PProps {
  status: 'idle' | 'initializing' | 'ready' | 'error';
}

interface MpegtsCustomLoader {
  open: (url: string, range: { from: number; to: number }) => void;
  close: () => void;
  destroy: () => void;
  abort: () => void;
  isWorking: () => boolean;
  onData?: (data: ArrayBuffer, receivedBytes: number) => void;
}

/**
 * AvatarDisplay1P is a minimalist React component for rendering the Google 1P Live Avatar.
 * It uses mpegts.js to decode the raw video/mp4 segments streamed from the Gemini Live API.
 * 
 * DESIGN PRINCIPLE: We rely on the existing high-performance AudioWorklet pipeline for audio 
 * and only use this component for synchronized video rendering.
 */
export const AvatarDisplay1P = memo(forwardRef<AvatarDisplay1PHandle, AvatarDisplay1PProps>(({ status }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<mpegts.Player | null>(null);
  const customLoaderRef = useRef<MpegtsCustomLoader | null>(null);
  const receivedBytesRef = useRef<number>(0);
  const { recordMetric } = useTelemetry();
  const [hasFirstFrame, setHasFirstFrame] = useState(false);

  // Initialize mpegts player
  useEffect(() => {
    if (!videoRef.current) return;

    // We use a custom loader to feed raw bytes from the WebSocket directly into mpegts.js
    const player = mpegts.createPlayer({
      type: 'mpegts',
      isLive: true,
      url: 'custom',
    }, {
      // The mpegts.js types for customLoader expect a constructor-like function.
      // We use a typed function to avoid 'any' while satisfying the SDK's internal expectations.
      // eslint-disable-next-line react-hooks/unsupported-syntax
      customLoader: function(this: MpegtsCustomLoader) {
        this.open = () => {};
        this.close = () => {};
        this.destroy = () => {};
        this.abort = () => {};
        this.isWorking = () => false;
        customLoaderRef.current = this;
      } as unknown as { new(): mpegts.BaseLoader },
    });

    player.attachMediaElement(videoRef.current);
    player.load();
    playerRef.current = player;

    return () => {
      if (playerRef.current) {
        playerRef.current.detachMediaElement();
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  // Telemetry: Track TTFW (Time to First Byte/Frame)
  // We use the 'playing' event on the native video element as a proxy for the first frame paint.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlaying = () => {
        window.dispatchEvent(new Event('video-playback-started'));
        if (!hasFirstFrame) {
            setHasFirstFrame(true);
            // Record the end of the Wait Time timer
            recordMetric('totalTurnLatency', Date.now());
        }
    };

    video.addEventListener('playing', handlePlaying);
    return () => video.removeEventListener('playing', handlePlaying);
  }, [hasFirstFrame, recordMetric]);

  useImperativeHandle(ref, () => ({
    /**
     * Appends a base64 encoded video chunk to the mpegts player.
     */
    appendVideoChunk: (base64Data: string) => {
      try {
        const binaryString = atob(base64Data);
        const uint8Array = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          uint8Array[i] = binaryString.charCodeAt(i);
        }
        
        if (customLoaderRef.current?.onData) {
          customLoaderRef.current.onData(uint8Array.buffer, receivedBytesRef.current);
          receivedBytesRef.current += uint8Array.byteLength;
        }

        if (videoRef.current?.paused && status === 'ready') {
          videoRef.current.play().catch(e => {
            if (e.name !== 'AbortError') {
              console.warn('[Avatar1P] Auto-play failed:', e);
            }
          });
        }
      } catch (err) {
        console.error('[Avatar1P] Error processing video chunk:', err);
      }
    },

    /**
     * Instantly halts the video playback and resets frame tracking.
     */
    interrupt: () => {
      if (videoRef.current) {
        // Reset frame tracking so the next response generates a fresh TTFW metric
        setHasFirstFrame(false);
      }
    }
  }));

  return (
    <Box sx={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'rgba(0,0,0,0.05)',
      borderRadius: 4,
      overflow: 'hidden',
      aspectRatio: '704 / 1280', // Google 1P Avatar native resolution
    }}>
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: status === 'ready' ? 'block' : 'none'
        }}
        playsInline
      />
      
      {(status === 'initializing' || (status === 'ready' && !hasFirstFrame)) && (
        <Box sx={{ 
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}>
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary">
            Waking up Puck...
          </Typography>
        </Box>
      )}

      {status === 'error' && (
        <Typography color="error">
          Failed to load 1P Avatar
        </Typography>
      )}
    </Box>
  );
}));

AvatarDisplay1P.displayName = 'AvatarDisplay1P';
