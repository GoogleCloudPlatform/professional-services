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

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DemoSidebar } from './DemoSidebar';
import { DemoConfigProvider } from '../context/DemoConfigContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { apiClient } from '../api/client';

vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
let mockPathname = '/dashboard';
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <DemoConfigProvider>
        {ui}
      </DemoConfigProvider>
    </QueryClientProvider>
  );
};

describe('DemoSidebar', () => {
  beforeEach(() => {
    mockPathname = '/dashboard';
    queryClient.clear();
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url.includes('/scenarios')) {
        return {
          data: [
            { id: 'cre-advisor', label: 'CRE Advisor' },
            { id: 'treasury-advisor', label: 'Treasury Advisor' }
          ]
        };
      }
      if (url.includes('/config')) {
        return {
          data: {
            live_api_key: 'test-key',
            model_name: 'test-model',
            system_prompt: 'test prompt',
            use_vertex_ai: false,
            avatar_mode: 'none',
            google_1p_avatar_name: 'Vera',
            google_1p_voice_name: 'Aoede',
            voice_language_code: 'en-GB',
            vad_silence_duration_ms: 400
          }
        };
      }
      return { data: null };
    });
  });

  it('renders demo settings title', () => {
    renderWithProvider(<DemoSidebar />);
    expect(screen.getByText(/Demo Settings/i)).toBeInTheDocument();
  });

  it('renders persona and interaction mode selects', () => {
    renderWithProvider(<DemoSidebar />);
    expect(screen.getByText(/Scenario Persona/i)).toBeInTheDocument();
    expect(screen.getByText(/Interaction Mode/i)).toBeInTheDocument();
  });

  it('allows changing interaction mode', async () => {
    renderWithProvider(<DemoSidebar />);
    
    // google-1p is the default
    const googleBtn = screen.getByRole('button', { name: /Google \(1P\)/i });
    expect(googleBtn).toHaveClass('MuiButton-contained');

    const heygenBtn = screen.getByRole('button', { name: /HeyGen \(3P\)/i });
    expect(heygenBtn).toHaveClass('MuiButton-outlined');

    fireEvent.click(heygenBtn);

    expect(heygenBtn).toHaveClass('MuiButton-contained');
    expect(googleBtn).toHaveClass('MuiButton-outlined');
  });

  it('renders and allows changing the Advisor Language', async () => {
    renderWithProvider(<DemoSidebar />);
    
    expect(screen.getByText(/Advisor Language/i)).toBeInTheDocument();
    
    const englishToggle = screen.getByRole('button', { name: /English/i });
    const spanishToggle = screen.getByRole('button', { name: /Español/i });
    
    expect(englishToggle).toBeInTheDocument();
    expect(spanishToggle).toBeInTheDocument();
    expect(englishToggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('displays loading state for scenarios', () => {
    // Force loading state by not resolving the promise yet
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    renderWithProvider(<DemoSidebar />);
    // The Select component might show the default value or loading text
    expect(screen.getByText(/Scenario Persona/i)).toBeInTheDocument();
  });

  it('does not navigate when changing interaction mode on dashboard', () => {
    mockPathname = '/dashboard';
    renderWithProvider(<DemoSidebar />);
    const heygenBtn = screen.getByRole('button', { name: /HeyGen \(3P\)/i });
    fireEvent.click(heygenBtn);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to new advisor mode when changing mode while on an advisor page', () => {
    mockPathname = '/advisor/google-1p';
    renderWithProvider(<DemoSidebar />);
    const heygenBtn = screen.getByRole('button', { name: /HeyGen \(3P\)/i });
    fireEvent.click(heygenBtn);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/advisor/heygen' });
  });

  it('renders custom voice, avatar, and language options returned by the backend config', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url.includes('/scenarios')) {
        return { data: [{ id: 'cre-advisor', label: 'CRE Advisor' }] };
      }
      if (url.includes('/config')) {
        return {
          data: {
            live_api_key: 'test-key',
            model_name: 'test-model',
            use_vertex_ai: false,
            avatar_mode: 'none',
            google_1p_avatar_name: 'Vera',
            google_1p_voice_name: 'Aoede',
            voice_language_code: 'en-GB',
            supported_voices: [
              { value: 'CustomVoice1', label: 'Custom Voice 1' }
            ],
            supported_avatars: [
              { value: 'CustomAvatar1', label: 'Custom Avatar 1' }
            ],
            supported_language_codes: [
              { value: 'de-DE', label: 'German (Germany) - de-DE' }
            ]
          }
        };
      }
      return { data: null };
    });

    renderWithProvider(<DemoSidebar />);

    // 1. Verify and click Avatar Select
    const avatarSelectWrapper = await screen.findByTestId('avatar-select');
    const avatarSelectButton = avatarSelectWrapper.querySelector('.MuiSelect-select') || avatarSelectWrapper;
    fireEvent.mouseDown(avatarSelectButton);
    expect(await screen.findByText('Custom Avatar 1')).toBeInTheDocument();
    
    // Close popover
    const backdrop1 = screen.getByRole('presentation');
    fireEvent.click(backdrop1);

    // 2. Verify and click Voice Select
    const voiceSelectWrapper = await screen.findByTestId('voice-select');
    const voiceSelectButton = voiceSelectWrapper.querySelector('.MuiSelect-select') || voiceSelectWrapper;
    fireEvent.mouseDown(voiceSelectButton);
    expect(await screen.findByText('Custom Voice 1')).toBeInTheDocument();
    
    const backdrop2 = screen.getByRole('presentation');
    fireEvent.click(backdrop2);

    // 3. Verify and click Locale Select
    const localeSelectWrapper = await screen.findByTestId('locale-select');
    const localeSelectButton = localeSelectWrapper.querySelector('.MuiSelect-select') || localeSelectWrapper;
    fireEvent.mouseDown(localeSelectButton);
    expect(await screen.findByText('German (Germany) - de-DE')).toBeInTheDocument();
  });
});
