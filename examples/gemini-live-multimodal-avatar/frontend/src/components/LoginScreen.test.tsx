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
import { LoginScreen } from './LoginScreen';
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
      {ui}
    </QueryClientProvider>
  );
};

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [{ id: 'cre-advisor', label: 'CRE Advisor' }],
    } as never);
  });

  it('renders the login icon', () => {
    renderWithProvider(<LoginScreen onLogin={vi.fn()} />);
    expect(screen.getByTestId('login-icon')).toBeInTheDocument();
  });

  it('calls onLogin when the login button is clicked', () => {
    const onLogin = vi.fn();
    renderWithProvider(<LoginScreen onLogin={onLogin} />);
    
    const button = screen.getByTestId('login-icon');
    fireEvent.click(button);
    
    expect(onLogin).toHaveBeenCalledTimes(1);
  });

  it('displays the welcome message', () => {
    renderWithProvider(<LoginScreen onLogin={vi.fn()} />);
    expect(screen.getByText(/Commercial Banking/i)).toBeInTheDocument();
    expect(screen.getByText(/Secure Biometric Authentication/i)).toBeInTheDocument();
  });

  it('does NOT render the Audio Generation Mode toggle', () => {
    renderWithProvider(<LoginScreen onLogin={vi.fn()} />);
    expect(screen.queryByText(/Audio Generation Mode/i)).not.toBeInTheDocument();
  });
});
