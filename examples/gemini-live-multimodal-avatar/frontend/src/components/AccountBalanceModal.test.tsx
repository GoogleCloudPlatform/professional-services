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
import { describe, it, expect, vi } from 'vitest';
import AccountBalanceModal from './AccountBalanceModal';

describe('AccountBalanceModal', () => {
  const mockBalanceData = {
    account_number: '1234567890',
    balance: '$1,000,000',
    currency: 'USD'
  };

  it('renders the account balance data when open', () => {
    const handleClose = vi.fn();
    
    render(
      <AccountBalanceModal 
        open={true} 
        onClose={handleClose} 
        data={mockBalanceData}
      />
    );

    expect(screen.getByText('Account Balance')).toBeInTheDocument();
    expect(screen.getByText(/1234567890/i)).toBeInTheDocument();
    expect(screen.getByText(/\$1,000,000/i)).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    const handleClose = vi.fn();
    
    render(
      <AccountBalanceModal 
        open={false} 
        onClose={handleClose} 
        data={mockBalanceData}
      />
    );

    expect(screen.queryByText('Account Balance')).not.toBeInTheDocument();
  });
});
