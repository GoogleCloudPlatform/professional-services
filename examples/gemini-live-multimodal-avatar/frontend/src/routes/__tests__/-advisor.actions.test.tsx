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
import { render } from '@testing-library/react';

import { HeygenAdvisor } from '../advisor.heygen';
import React from 'react';
import { OverlayProvider } from '../../context/OverlayContext';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useGeminiLive } from '../../hooks/useGeminiLive';
import { useDemoConfig } from '../../context/DemoConfigContext';

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({}),
  useNavigate: () => vi.fn(),
  useRouter: () => ({
    state: {
      location: { pathname: '/advisor/heygen' }
    }
  }),
}));

// Global mocks for state control
let mockView = 'main';

// Mock the hooks used in Index
vi.mock("../../context/OverlayContext", () => ({ useOverlay: () => ({ showOverlay: vi.fn(), hideOverlay: vi.fn(), activeOverlay: null }), OverlayProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children) }));
vi.mock('../../context/DemoConfigContext', () => ({
  useDemoConfig: vi.fn(() => ({
    selectedPersona: 'cre-advisor',
    interactionMode: 'heygen',
    setSelectedPersona: vi.fn(),
    setInteractionMode: vi.fn(), sessionId: "test-session", resetSessionId: vi.fn(),
    languages: ['English'], setLanguages: vi.fn(),
    resumptionHandle: null, setResumptionHandle: vi.fn()
  })),
}));

vi.mock('../../hooks/useGeminiLive', () => ({
  useGeminiLive: vi.fn(),
}));

vi.mock('../../hooks/useHeygenSession', () => ({
  useHeygenSession: vi.fn(() => ({
    session: null,
    status: 'ready',
    speakText: vi.fn(),
    error: null,
  })),
}));

vi.mock('../../context/ModalContext', () => ({
  useModalContext: vi.fn(() => ({
    activeModal: null,
    modalData: null,
    closeModal: vi.fn(),
    openModal: vi.fn(),
  })),
}));

vi.mock('../../context/TelemetryContext', () => ({
  useTelemetry: vi.fn(() => ({
    setModelName: vi.fn(),
  })),
}));

vi.mock('../../api/config', () => ({
  fetchConfig: vi.fn(),
  fetchHeygenToken: vi.fn(),
}));

// Mock useQuery
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

// Mock components to avoid deep rendering issues
const mockSpeak = vi.fn();
const mockInterrupt = vi.fn();
vi.mock('../../components/AvatarDisplay', async () => {
  const React = await import('react');
  return {
    AvatarDisplay: React.forwardRef((_props, ref) => {
      React.useImperativeHandle(ref, () => ({
        speak: mockSpeak,
        interrupt: mockInterrupt,
        resetLogGates: vi.fn(),
      }));
      return <div data-testid="avatar-display" />;
    }),
  };
});

vi.mock('../../components/AudioVisualizer', () => ({
  AudioVisualizer: () => <div data-testid="audio-visualizer" />,
}));

vi.mock('../../components/LoginScreen', () => ({
  // @ts-expect-error - Mocking LoginScreen props
  LoginScreen: ({ onLogin }) => <button data-testid="login-button" onClick={onLogin}>Login</button>,
}));

vi.mock('../../components/LobbyScreen', () => ({
  LobbyScreen: () => <div data-testid="lobby-screen" />,
}));

// Mock React.useState
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: vi.fn((initial: unknown) => {
      if (initial === 'lobby') return [mockView, (v: unknown) => { mockView = v as string; }];
      return actual.useState(initial);
    }),
  };
});

// Create a wrapper with QueryClientProvider
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}><OverlayProvider>{children}</OverlayProvider></QueryClientProvider>
);

interface MockGeminiOptions {
  onAudioChunk?: (chunk: string) => void;
  onInterrupt?: () => void;
  muteLocalPlayback?: boolean;
}

describe('Heygen Advisor Route Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockView = 'main';

    // @ts-expect-error - Mocking useQuery
    vi.mocked(useQuery).mockReturnValue({
      data: { client_name: 'Test Client', avatar_mode: 'heygen' },
      isLoading: false,
      isError: false,
    });

    // @ts-expect-error - Mocking useGeminiLive
    vi.mocked(useGeminiLive).mockReturnValue({
      connectionState: 'connected',
      isMuted: false,
      isRecording: true,
      isProcessingTool: false,
      messages: [],
      activeVisual: null,
      geminiStream: null,
      disconnect: vi.fn(),
      activateMic: vi.fn().mockResolvedValue(undefined),
      setMuted: vi.fn(),
    });
    
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('should call handleHeygenAudio when useGeminiLive triggers onAudioChunk', async () => {
    let capturedOnAudioChunk: ((chunk: string) => void) | undefined;

    // @ts-expect-error - Mocking useQuery
    vi.mocked(useQuery).mockImplementation((options: unknown) => {
      const opts = options as { queryKey: string[] };
      if (opts.queryKey[0] === 'config') {
        return { data: { client_name: 'Test', avatar_mode: 'heygen' }, isLoading: false, isError: false } as unknown;
      }
      if (opts.queryKey[0] === 'heygenToken') {
        return { data: 'fake-token', isLoading: false, isError: false } as unknown;
      }
      return { data: null, isLoading: false, isError: false } as unknown;
    });

    // @ts-expect-error - Mocking useGeminiLive
    vi.mocked(useGeminiLive).mockImplementation((options: unknown) => {
      const opts = options as MockGeminiOptions;
      capturedOnAudioChunk = opts.onAudioChunk;
      return {
        connectionState: 'connected',
        messages: [],
        disconnect: vi.fn(),
        activateMic: vi.fn().mockResolvedValue(undefined),
        setMuted: vi.fn(),
      };
    });

    render(<HeygenAdvisor />, { wrapper });

    // Trigger the callback
    expect(capturedOnAudioChunk).toBeDefined();
    if (capturedOnAudioChunk) capturedOnAudioChunk('base64data');

    expect(mockSpeak).toHaveBeenCalledWith('base64data');
  });

  it('should call handleHeygenInterrupt when useGeminiLive triggers onInterrupt', () => {
    let capturedOnInterrupt: (() => void) | undefined;
    // @ts-expect-error - Mocking useGeminiLive
    vi.mocked(useGeminiLive).mockImplementation((options: unknown) => {
      const opts = options as MockGeminiOptions;
      capturedOnInterrupt = opts.onInterrupt;
      return {
        connectionState: 'connected',
        messages: [],
        disconnect: vi.fn(),
        activateMic: vi.fn().mockResolvedValue(undefined),
        setMuted: vi.fn(),
      };
    });

    render(<HeygenAdvisor />, { wrapper });

    // Trigger the callback
    expect(capturedOnInterrupt).toBeDefined();
    if (capturedOnInterrupt) capturedOnInterrupt();

    expect(mockInterrupt).toHaveBeenCalled();
  });

  it('should reset session and go to lobby when settings change after initial mount', () => {
    const mockDisconnect = vi.fn();
    
    // @ts-expect-error - Mocking useGeminiLive
    vi.mocked(useGeminiLive).mockReturnValue({
      connectionState: 'connected',
      messages: [],
      disconnect: mockDisconnect,
      activateMic: vi.fn().mockResolvedValue(undefined),
      setMuted: vi.fn(),
    });

    // Initial mount with Avatar mode
    let selectedPersona = 'cre-advisor';
    vi.mocked(useDemoConfig).mockImplementation(() => ({
      selectedPersona: selectedPersona,
      interactionMode: 'heygen',
      setSelectedPersona: vi.fn(),
      setInteractionMode: vi.fn(), sessionId: "test-session", resetSessionId: vi.fn(),
      languages: ['English'], setLanguages: vi.fn(),
      resumptionHandle: null, setResumptionHandle: vi.fn()
    }));

    // Start in 'main' view to test the reset
    mockView = 'main';
    const { rerender } = render(<HeygenAdvisor />, { wrapper });

    // Ensure it didn't reset on initial mount
    expect(mockDisconnect).not.toHaveBeenCalled();

    // Trigger a setting change (persona changes)
    selectedPersona = 'cashflow-advisor';
    rerender(<HeygenAdvisor />);

    // Now it should have disconnected and gone back to lobby
    expect(mockDisconnect).toHaveBeenCalled();
    expect(mockView).toBe('lobby');
  });
});
