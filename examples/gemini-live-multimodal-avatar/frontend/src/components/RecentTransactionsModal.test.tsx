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
import RecentTransactionsModal from './RecentTransactionsModal';

describe('RecentTransactionsModal', () => {
  const mockTransactions = [
    { date: '2026-03-10', description: 'Grocery Store', amount: -50.25, id: '1' },
    { date: '2026-03-12', description: 'Salary Deposit', amount: 2000.00, id: '2' },
  ];

  it('renders a list of transactions when open', () => {
    const handleClose = vi.fn();
    
    render(
      <RecentTransactionsModal 
        open={true} 
        onClose={handleClose} 
        transactions={mockTransactions}
      />
    );

    expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
    
    // Check if transactions are rendered
    expect(screen.getByText('Grocery Store')).toBeInTheDocument();
    expect(screen.getByText('-50.25')).toBeInTheDocument();
    
    expect(screen.getByText('Salary Deposit')).toBeInTheDocument();
    expect(screen.getByText('2000')).toBeInTheDocument();
  });

  it('displays a message when there are no transactions', () => {
    const handleClose = vi.fn();
    
    render(
      <RecentTransactionsModal 
        open={true} 
        onClose={handleClose} 
        transactions={[]}
      />
    );

    expect(screen.getByText(/no recent transactions/i)).toBeInTheDocument();
  });
});
