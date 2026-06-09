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

export interface Account {
  id: string;
  name: string;
  last4: string;
  balance: number;
  type: 'checking' | 'savings' | 'loan';
}

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  category: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  type: 'alert' | 'document' | 'task';
}

export const mockBankingService = {
  getAccounts: async (): Promise<Account[]> => {
    return [
      { id: '1', name: 'Wealth Checking Account', last4: '9921', balance: 245900.00, type: 'checking' },
      { id: '2', name: 'Cymbal Premium Savings', last4: '1102', balance: 112142.00, type: 'savings' },
      { id: '3', name: 'Cymbal Wealth Portfolio', last4: '4412', balance: 1250000.00, type: 'loan' },
    ];
  },

  getTransactions: async (): Promise<Transaction[]> => {
    return [
      { id: 't1', merchant: 'Wealth Management Transfer', amount: -10000.00, date: '2026-05-28', category: 'Investments' },
      { id: 't2', merchant: 'Luxury Hotel & Resort', amount: -1540.20, date: '2026-05-26', category: 'Travel' },
      { id: 't3', merchant: 'Investor\'s Edge Allocation', amount: -5000.00, date: '2026-05-24', category: 'Brokerage' },
      { id: 't4', merchant: 'Quarterly Portfolio Return', amount: 12450.00, date: '2026-05-22', category: 'Dividends' },
    ];
  },

  getActionItems: async (): Promise<ActionItem[]> => {
    return [
      { id: 'a1', title: 'Pending Portfolio Transfer', description: 'Amount: $500,000 | Target: Wealth Portfolio', type: 'alert' },
      { id: 'a2', title: 'Contribution Reminder', description: 'TFSA / RRSP contribution room remaining: $12,500.', type: 'task' },
      { id: 'a3', title: 'Financial Plan Review', description: 'Your annual financial plan update is ready to review with your advisor.', type: 'document' },
    ];
  },

  getTotalLiquidity: async (): Promise<number> => {
    const accounts = await mockBankingService.getAccounts();
    // In wealth context, net worth includes checking, savings, and investments
    return accounts.reduce((acc, curr) => acc + curr.balance, 0);
  },

  getActiveCredit: async (): Promise<number> => {
    return 2500000.00; // Total facility size
  }
};
