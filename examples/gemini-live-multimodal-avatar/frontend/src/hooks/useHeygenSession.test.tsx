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

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useHeygenSession } from './useHeygenSession';
import { LiveAvatarSession } from '@heygen/liveavatar-web-sdk';
import { ErrorProvider } from '../context/ErrorProvider';
import React from 'react';

const mockRecordMetric = vi.fn();
vi.mock('../context/TelemetryContext', () => ({
  useTelemetry: vi.fn(() => ({ 
    recordMetric: mockRecordMetric,
    currentTurnId: 'test-turn'
  }))
}));

// Mock the SDK
vi.mock('@heygen/liveavatar-web-sdk', () => {
  return {
    LiveAvatarSession: vi.fn().mockImplementation(function(this: { _callbacks: Record<string, () => void>, on: unknown, start: unknown, stop: unknown }) {
      this._callbacks = {};
      this.on = vi.fn().mockImplementation((event: string, cb: () => void) => {
        this._callbacks[event] = cb;
      });
      this.start = vi.fn().mockImplementation(async () => {
        if (this._callbacks['session.stream_ready']) {
          setTimeout(() => this._callbacks['session.stream_ready'](), 10);
        }
      });
      this.stop = vi.fn().mockResolvedValue(undefined);
    }),
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ErrorProvider>{children}</ErrorProvider>
);

describe('useHeygenSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing if no token is provided', () => {
    const { result } = renderHook(() => useHeygenSession(undefined), { wrapper });
    expect(result.current.status).toBe('idle');
    expect(LiveAvatarSession).not.toHaveBeenCalled();
  });

  it('starts initializing when a token is provided', async () => {
    const { result } = renderHook(() => useHeygenSession('test-token'), { wrapper });
    
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    }, { timeout: 2000 });
    
    expect(LiveAvatarSession).toHaveBeenCalledWith('test-token', expect.any(Object));
    expect(result.current.session).not.toBeNull();
  });

  it('stops the session on unmount', async () => {
    const { result, unmount } = renderHook(() => useHeygenSession('test-token'), { wrapper });
    
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    }, { timeout: 2000 });
    
    const session = result.current.session;
    unmount();
    
    expect(session?.stop).toHaveBeenCalled();
  });

  it('force stops the active session when token becomes falsy', async () => {
    const { result, rerender } = renderHook((props: { token?: string }) => useHeygenSession(props.token), {
      initialProps: { token: 'test-token' as string | undefined },
      wrapper
    });

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    }, { timeout: 2000 });

    const activeSession = result.current.session;

    // Remove token (simulate Voice-Only toggle)
    rerender({ token: undefined as string | undefined });

    await waitFor(() => {
      expect(activeSession?.stop).toHaveBeenCalled();
      expect(result.current.status).toBe('idle');
      expect(result.current.session).toBeNull();
    });
  });

  it('bypasses double-start in React Strict Mode by aborting if unmounted during 50ms delay', async () => {
    const { result, unmount } = renderHook(() => useHeygenSession('strict-mode-token'), { wrapper });
    
    // Immediately unmount before the 50ms delay finishes
    unmount();

    // Verify it never actually tried to connect
    await new Promise((resolve) => setTimeout(resolve, 100)); // wait past the 50ms delay
    expect(result.current.session).toBeNull();
    
    // Check if any instance was started
    const mockInstance = vi.mocked(LiveAvatarSession).mock.results[0]?.value;
    if (mockInstance) {
      expect(mockInstance.start).not.toHaveBeenCalled();
    }
  });
});
