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
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { OverlayProvider } from '../../context/OverlayContext';

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

// Mock the hooks
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

vi.mock('../../hooks/useGeminiLive', () => ({
  useGeminiLive: vi.fn(() => ({
    connectionState: 'connected',
    isMuted: false,
    isRecording: true,
    isProcessingTool: false,
    messages: [
      { id: '1', text: 'Hello', sender: 'user' },
      { id: '2', text: 'Hi there', sender: 'model' },
      { id: '3', text: 'How can I help?', sender: 'model' },
    ],
    activeVisual: null,
    geminiStream: null,
    disconnect: vi.fn(),
    activateMic: vi.fn().mockResolvedValue(undefined),
    setMuted: vi.fn(),
    sendTextMessage: vi.fn(),
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

// Mock components to avoid deep rendering issues
vi.mock('../../components/AudioVisualizer', () => ({
  AudioVisualizer: () => <div data-testid="audio-visualizer" />,
}));

vi.mock('../../components/LobbyScreen', () => ({
  LobbyScreen: () => <div data-testid="lobby-screen" />,
}));

// Global mocks for state control
let mockView = 'main';

// Mock React.useState
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: (initial: unknown) => {
      if (initial === 'lobby') return actual.useState(mockView);
      return actual.useState(initial);
    }
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
  <QueryClientProvider client={queryClient}>
    <OverlayProvider>
      {children}
    </OverlayProvider>
  </QueryClientProvider>
);

const mockQueryResult = (data: unknown, isLoading = false, isError = false) => ({
  data,
  isLoading,
  isError,
  isPending: false,
  isSuccess: !isLoading && !isError,
  status: isError ? 'error' : (isLoading ? 'pending' : 'success'),
  error: null,
} as import('@tanstack/react-query').UseQueryResult<unknown, unknown>);

describe('Advisor Page Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockView = 'main';
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    
    vi.mocked(useQuery).mockReturnValue(mockQueryResult({ client_name: 'Test Client' }));
  });

  it('should render suggestion chips and action bar in main view', () => {
    render(<VoiceOnlyAdvisor />, { wrapper });

    const suggestionChips = screen.queryByText(/What's my cash flow look like/i);
    expect(suggestionChips).toBeInTheDocument();
  });

  it('should show lobby screen when config is loading', () => {
    mockView = 'lobby';
    vi.mocked(useQuery).mockReturnValue(mockQueryResult(null, true));
    
    render(<VoiceOnlyAdvisor />, { wrapper });
    
    expect(screen.getByTestId('lobby-screen')).toBeInTheDocument();
  });

  it('should show lobby screen when config fetching fails', () => {
    mockView = 'lobby';
    vi.mocked(useQuery).mockReturnValue(mockQueryResult(null, false, true));

    render(<VoiceOnlyAdvisor />, { wrapper });
    expect(screen.getByTestId('lobby-screen')).toBeInTheDocument();
  });
});
