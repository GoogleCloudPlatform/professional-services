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

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GlobalModals from './GlobalModals';
import * as ModalContext from '../context/ModalContext';

vi.mock('../context/ModalContext', () => ({
  useModalContext: vi.fn()
}));

describe('GlobalModals Component', () => {
  it('renders without crashing', () => {
    vi.mocked(ModalContext.useModalContext).mockReturnValue({
      activeModal: null,
      modalData: null,
      openModal: vi.fn(),
      closeModal: vi.fn()
    });

    render(<GlobalModals />);
    
    // As it renders no modals when activeModal is null, it should be empty
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the Account Balance modal when active', () => {
    vi.mocked(ModalContext.useModalContext).mockReturnValue({
      activeModal: 'account_balance',
      modalData: { balance: 100, currency: 'USD' },
      openModal: vi.fn(),
      closeModal: vi.fn()
    });

    render(<GlobalModals />);

    expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument();
    expect(screen.getByText(/Account Balance/i)).toBeInTheDocument();
  });

});
