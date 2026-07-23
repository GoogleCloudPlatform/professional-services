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

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LobbyScreen } from './LobbyScreen';

describe('LobbyScreen', () => {
  it('renders the professional transition message', () => {
    render(<LobbyScreen />);
    expect(screen.getByText(/Connecting to Advisor/i)).toBeInTheDocument();
    expect(screen.getByText(/Institutional Access/i)).toBeInTheDocument();
    expect(screen.getByText(/Initializing institutional-grade encrypted real-time link/i)).toBeInTheDocument();
    expect(screen.getByText(/End-to-End Encryption/i)).toBeInTheDocument();
  });

  it('renders a progress indicator', () => {
    render(<LobbyScreen />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders the shield icon', () => {
    const { container } = render(<LobbyScreen />);
    expect(container.querySelector('.lucide-shield')).toBeInTheDocument();
  });
});
