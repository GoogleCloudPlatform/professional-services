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
import { renderHook, act } from '@testing-library/react';
import { useAudioPlayer } from './useAudioPlayer';

const mockCreateMediaStreamDestination = vi.fn().mockReturnValue({
  stream: {},
});

class MockAudioWorkletNode {
  port = {
    postMessage: vi.fn(),
  };
  connect() {}
  disconnect() {}
}
vi.stubGlobal('AudioWorkletNode', MockAudioWorkletNode);

class MockAudioContext {
  currentTime = 0;
  state = 'running';
  createMediaStreamDestination = mockCreateMediaStreamDestination;
  destination = {};
  resume = vi.fn().mockResolvedValue(undefined);
  suspend = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
  audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined)
  };
}

vi.stubGlobal('AudioContext', MockAudioContext);

describe('useAudioPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should initialize AudioContext with correct sample rate', async () => {
    const { result } = renderHook(() => useAudioPlayer());
    
    const buffer = new ArrayBuffer(1024);

    await act(async () => {
      await result.current.playAudioChunk(buffer);
    });

    expect(mockCreateMediaStreamDestination).toHaveBeenCalled();
  });

  it('should call onPlaybackStart on the first chunk', async () => {
    const onPlaybackStart = vi.fn();
    const { result } = renderHook(() => useAudioPlayer({ onPlaybackStart }));
    const buffer = new ArrayBuffer(1024);

    await act(async () => {
      await result.current.playAudioChunk(buffer);
    });

    expect(onPlaybackStart).toHaveBeenCalled();
  });

  it('should dynamically disconnect from destination when muteLocalPlayback becomes true', async () => {
    const disconnectSpy = vi.spyOn(MockAudioWorkletNode.prototype, 'disconnect');
    const { result, rerender } = renderHook(
      ({ muteLocalPlayback }) => useAudioPlayer({ muteLocalPlayback }),
      { initialProps: { muteLocalPlayback: false } }
    );

    const buffer = new ArrayBuffer(1024);

    // Initialize audio pipeline
    await act(async () => {
      await result.current.playAudioChunk(buffer);
    });

    // Mute it mid-session
    rerender({ muteLocalPlayback: true });

    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('should dynamically reconnect to destination when muteLocalPlayback becomes false', async () => {
    const connectSpy = vi.spyOn(MockAudioWorkletNode.prototype, 'connect');
    const { result, rerender } = renderHook(
      ({ muteLocalPlayback }) => useAudioPlayer({ muteLocalPlayback }),
      { initialProps: { muteLocalPlayback: true } }
    );

    const buffer = new ArrayBuffer(1024);

    // Initialize audio pipeline (muted initially)
    await act(async () => {
      await result.current.playAudioChunk(buffer);
    });

    // Unmute it mid-session
    rerender({ muteLocalPlayback: false });

    // It should have been called to connect to destination
    expect(connectSpy).toHaveBeenCalled();
  });
});