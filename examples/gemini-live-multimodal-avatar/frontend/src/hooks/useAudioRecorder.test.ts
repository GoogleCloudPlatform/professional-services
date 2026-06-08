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
import { useAudioRecorder } from './useAudioRecorder';

// Mock MediaDevices and AudioContext
const mockGetUserMedia = vi.fn();
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: { getUserMedia: mockGetUserMedia },
  writable: true,
});

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockCreateMediaStreamSource = vi.fn().mockReturnValue({ connect: mockConnect });

class MockAudioWorklet {
  addModule = vi.fn().mockResolvedValue(undefined);
}

class MockAudioWorkletNode {
  static instances: MockAudioWorkletNode[] = [];
  port = { onmessage: null as ((ev: { data: unknown }) => void) | null };
  connect = mockConnect;
  disconnect = mockDisconnect;
  constructor() {
    MockAudioWorkletNode.instances.push(this);
  }
}

class MockAudioContext {
  sampleRate = 16000;
  state = 'running';
  createMediaStreamSource = mockCreateMediaStreamSource;
  audioWorklet = new MockAudioWorklet();
  destination = {};
  close = vi.fn().mockResolvedValue(undefined);
  resume = vi.fn().mockResolvedValue(undefined);
}

vi.stubGlobal('AudioContext', MockAudioContext);
vi.stubGlobal('AudioWorkletNode', MockAudioWorkletNode);

describe('useAudioRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockAudioWorkletNode.instances = [];
  });

  it('should call getUserMedia with strict constraints initially', async () => {
    mockGetUserMedia.mockResolvedValue(new MediaStream());
    const onAudioChunk = vi.fn();
    const { result } = renderHook(() => useAudioRecorder(onAudioChunk));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  });

  it('should fallback to generic constraints if OverconstrainedError occurs', async () => {
    // Create an OverconstrainedError
    const overconstrainedError = new Error('Overconstrained');
    overconstrainedError.name = 'OverconstrainedError';
    
    mockGetUserMedia
      .mockRejectedValueOnce(overconstrainedError)
      .mockResolvedValueOnce(new MediaStream());

    const onAudioChunk = vi.fn();
    const { result } = renderHook(() => useAudioRecorder(onAudioChunk));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
    expect(mockGetUserMedia).toHaveBeenLastCalledWith({ audio: true });
  });

  it('should pass received ArrayBuffer PCM data directly to onAudioChunk', async () => {
    mockGetUserMedia.mockResolvedValue(new MediaStream());
    const onAudioChunk = vi.fn();
    const { result } = renderHook(() => useAudioRecorder(onAudioChunk));

    await act(async () => {
      await result.current.startRecording();
    });

    const workletNode = MockAudioWorkletNode.instances[0];
    expect(workletNode).toBeDefined();

    // Simulate receiving PCM data (Int16Array as a buffer)
    // We'll send [72, 101, 108, 108, 111] which is "Hello" in ASCII
    const data = new Uint8Array([72, 101, 108, 108, 111]);
    
    act(() => {
      // @ts-expect-error - Simulating event
      workletNode.port.onmessage({ data: data.buffer });
      // Flush the batch
      // @ts-expect-error - Simulating VAD_SILENCE event
      workletNode.port.onmessage({ data: { type: 'VAD_SILENCE' } });
    });

    // The mock event arrayBuffer contains the ASCII values for "Hello"
    // Expect to be called with an ArrayBuffer containing those bytes
    const expectedBuffer = new Uint8Array([72, 101, 108, 108, 111]).buffer;
    expect(onAudioChunk).toHaveBeenCalledWith(expectedBuffer);
  });
});
