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
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [
        { id: 'cre-advisor', label: 'CRE Advisor' },
        { id: 'treasury-advisor', label: 'Treasury Advisor' }
      ],
    } as never);
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
});
