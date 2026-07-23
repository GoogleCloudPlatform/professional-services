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
import { Route } from '../__root';
import React from 'react';
import { cymbalTheme } from '../../theme/cymbalTheme';

// Mock dependencies
vi.mock('@tanstack/react-router', () => ({
  createRootRoute: vi.fn((options) => options),
  Outlet: () => null,
  useLocation: vi.fn(() => ({ pathname: '/' })),
  useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock('../../context/ErrorProvider', () => ({
  ErrorProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../context/ErrorContext', () => ({
  useErrorContext: vi.fn(() => ({ logs: [], clearLogs: vi.fn() })),
}));

vi.mock('../../context/ModalContext', () => ({
  ModalProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: vi.fn(() => ({
    user: { email: 'test@example.com' },
    loading: false,
    logout: vi.fn(),
  })),
}));

vi.mock('../../components/GlobalModals', () => ({
  default: () => null,
}));

vi.mock('@tanstack/react-router-devtools', () => ({
  TanStackRouterDevtools: () => null,
}));

// Mock TelemetrySidebar
vi.mock('../../components/TelemetrySidebar', () => ({
  TelemetrySidebar: () => <div data-testid="mock-telemetry-sidebar" />
}));

// Mock DemoSidebar
vi.mock('../../components/DemoSidebar', () => ({
  DemoSidebar: () => <div data-testid="mock-demo-sidebar" />
}));

// Mock Material UI ThemeProvider to track arguments
const mockThemeProvider = vi.fn(({ children }: { children: React.ReactNode }) => <div>{children}</div>);
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@mui/material');
  return {
    ...actual,
    ThemeProvider: (props: { theme: unknown, children: React.ReactNode }) => mockThemeProvider(props),
  };
});

interface RootRouteOptions {
  component: React.ComponentType;
}

describe('Root Route Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create root route correctly', () => {
    expect(Route).toBeDefined();
    expect(Route).toBeTruthy();
  });

  it('should use the cymbalTheme in ThemeProvider', () => {
    const RootComponent = (Route as unknown as RootRouteOptions).component;
    render(<RootComponent />);
    
    // ThemeProvider should have been called
    expect(mockThemeProvider).toHaveBeenCalled();
    
    // The theme prop should be cymbalTheme
    const lastCall = mockThemeProvider.mock.calls[mockThemeProvider.mock.calls.length - 1];
    expect((lastCall[0] as unknown as { theme: unknown }).theme).toBe(cymbalTheme);
  });

  it('should render the TelemetrySidebar component', () => {
    const RootComponent = (Route as unknown as RootRouteOptions).component;
    const { getByTestId } = render(<RootComponent />);
    
    expect(getByTestId('mock-telemetry-sidebar')).toBeInTheDocument();
  });
});
