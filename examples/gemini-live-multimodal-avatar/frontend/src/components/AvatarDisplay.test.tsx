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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarDisplay, type AvatarDisplayHandle } from './AvatarDisplay';
import { OverlayProvider } from '../context/OverlayContext';
import { ErrorProvider } from '../context/ErrorProvider';
import { createRef } from 'react';
import { LiveAvatarSession } from '@heygen/liveavatar-web-sdk';

const mockSession = {
  attach: vi.fn(),
  repeatAudio: vi.fn(),
  interrupt: vi.fn(),
  room: {
    localParticipant: {
      publishTrack: vi.fn().mockResolvedValue({ track: { stop: vi.fn() } }),
      unpublishTrack: vi.fn(),
    },
  },
} as unknown as LiveAvatarSession;

vi.mock('@heygen/liveavatar-web-sdk', () => ({
  LiveAvatarSession: vi.fn(),
}));

vi.mock('livekit-client', () => ({
  LocalAudioTrack: vi.fn().mockImplementation(function() {
    return {};
  }),
}));

describe('AvatarDisplay Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when session is null', () => {
    render(
      <ErrorProvider>
        <OverlayProvider>
          <AvatarDisplay session={null} />
        </OverlayProvider>
      </ErrorProvider>
    );
    
    expect(screen.getByText('Initializing Avatar...')).toBeInTheDocument();
  });

  it('renders a video element', () => {
    // Basic test to verify it renders correctly without legacy inline styles breaking the layout
    const { container } = render(
      <ErrorProvider>
        <OverlayProvider>
          <AvatarDisplay session={null} />
        </OverlayProvider>
      </ErrorProvider>
    );
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
  });

  it('calls session.attach when session is provided', () => {
    render(
      <ErrorProvider>
        <OverlayProvider>
          <AvatarDisplay session={mockSession} />
        </OverlayProvider>
      </ErrorProvider>
    );
    expect(mockSession.attach).toHaveBeenCalled();
  });

  it('exposes speak, interrupt, and resetLogGates via ref', () => {
    const ref = createRef<AvatarDisplayHandle>();
    render(
      <ErrorProvider>
        <OverlayProvider>
          <AvatarDisplay ref={ref} session={mockSession} />
        </OverlayProvider>
      </ErrorProvider>
    );

    expect(ref.current).toBeDefined();
    
    ref.current?.speak('base64audio');
    expect(mockSession.repeatAudio).toHaveBeenCalledWith('base64audio');

    ref.current?.interrupt();
    expect(mockSession.interrupt).toHaveBeenCalled();

    // Just verify it doesn't crash
    ref.current?.resetLogGates();
  });
});
