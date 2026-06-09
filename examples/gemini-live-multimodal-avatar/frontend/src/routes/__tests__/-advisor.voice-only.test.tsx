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
import { VoiceOnlyAdvisor } from '../advisor.voice-only';
import React from 'react';
import { OverlayProvider } from '../../context/OverlayContext';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({}),
  useNavigate: () => vi.fn(),
  useRouter: () => ({
    state: {
      location: { pathname: '/advisor/voice-only' }
    }
  }),
}));

vi.mock("../../context/OverlayContext", () => ({ useOverlay: () => ({ showOverlay: vi.fn(), hideOverlay: vi.fn(), activeOverlay: null }), OverlayProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children) }));
vi.mock('../../context/DemoConfigContext', () => ({
  useDemoConfig: vi.fn(() => ({
    selectedPersona: 'cre-advisor',
    interactionMode: 'voice-only',
    setSelectedPersona: vi.fn(),
    setInteractionMode: vi.fn(),
    languages: ['English'],
    setLanguages: vi.fn(),
    sessionId: 'test-session',
    resetSessionId: vi.fn(),
  })),
}));

// Mock dependencies
const mockGeminiLive = {
  connectionState: 'connected' as const,
  isMuted: false,
  isRecording: true,
  isProcessingTool: false,
  isAwaitingInput: false,
  messages: [],
  activeVisual: null,
  geminiStream: null,
  isAudioActive: true,
  isThinking: false,
  isInterrupted: false,
  clearMessages: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  activateMic: vi.fn().mockResolvedValue(undefined),
  setMuted: vi.fn(),
  sendTextMessage: vi.fn(),
};

vi.mock('../../hooks/useGeminiLive', () => ({
  useGeminiLive: vi.fn(() => mockGeminiLive),
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
    recordMetric: vi.fn(),
    startTurn: vi.fn(),
  })),
}));

vi.mock('../../api/config', () => ({
  fetchConfig: vi.fn(),
}));

// Mock useQuery
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

// Mock component with specific test IDs
vi.mock('../../components/AudioVisualizer', () => ({
  AudioVisualizer: ({ isActive, variant = 'orb' }: { isActive: boolean, variant?: string }) => <div data-testid="audio-visualizer" data-active={isActive} data-variant={variant} />,
}));

vi.mock('../../components/LoginScreen', () => ({
  LoginScreen: () => <div data-testid="login-screen" />,
}));

vi.mock('../../components/LobbyScreen', () => ({
  LobbyScreen: () => <div data-testid="lobby-screen" />,
}));

// Mock useState to force view='main'
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      if (initial === 'lobby') return actual.useState('main');
      return actual.useState(initial);
    },
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}><OverlayProvider>{children}</OverlayProvider></QueryClientProvider>
);

interface MockConfigOptions {
  queryKey: string[];
}

const mockQueryResult = (data: unknown): UseQueryResult<unknown, unknown> => ({
  data,
  isLoading: false,
  isError: false,
  isPending: false,
  isSuccess: true,
  status: 'success',
  error: null,
} as UseQueryResult<unknown, unknown>);

describe('Voice Only Advisor Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    mockGeminiLive.isRecording = true;
    mockGeminiLive.isMuted = false;
  });

  it('renders the Hero Visualizer', () => {
    vi.mocked(useQuery).mockImplementation((options: unknown) => {
      const opts = options as MockConfigOptions;
      if (opts.queryKey[0] === 'config') {
        return mockQueryResult({ client_name: 'Test Client' });
      }
      return mockQueryResult(null);
    });

    render(<VoiceOnlyAdvisor />, { wrapper });
    
    // Should show the visualizer in the top section
    const visualizers = screen.getAllByTestId('audio-visualizer');
    expect(visualizers.length).toBeGreaterThan(0);
  });

  it('hides the mini visualizer in the bottom bar when in Voice-Only mode', () => {
    vi.mocked(useQuery).mockImplementation((options: unknown) => {
      const opts = options as MockConfigOptions;
      if (opts.queryKey[0] === 'config') {
        return mockQueryResult({ client_name: 'Test Client' });
      }
      return mockQueryResult(null);
    });

    render(<VoiceOnlyAdvisor />, { wrapper });

    const visualizers = screen.getAllByTestId('audio-visualizer');
    const miniVisualizer = visualizers.find(v => v.getAttribute('data-variant') === 'bars');
    expect(miniVisualizer?.parentElement).toHaveStyle({ opacity: '0', visibility: 'hidden' });
  });
});
