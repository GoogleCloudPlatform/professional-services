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

import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import ResponseModal from './ResponseModal';

export interface AccountBalanceData {
  account_number?: string;
  account_type?: string;
  balance?: string | number;
  currency?: string;
}

interface AccountBalanceModalProps {
  open: boolean;
  onClose: () => void;
  data: AccountBalanceData | AccountBalanceData[] | null;
}

const AccountBalanceModal: React.FC<AccountBalanceModalProps> = ({ open, onClose, data }) => {
  // Normalize data to always be an array
  const accounts = Array.isArray(data) ? data : data ? [data] : [];

  return (
    <ResponseModal open={open} onClose={onClose} title={accounts.length > 1 ? "Account Balances" : "Account Balance"}>
      {accounts.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {accounts.map((account, index) => (
            <React.Fragment key={account.account_number || index}>
              <Box>
                {account.account_type && (
                  <Typography variant="h6" color="text.primary" gutterBottom>
                    {account.account_type}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  Account Number
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {account.account_number || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Available Balance
                </Typography>
                <Typography variant="h5" color="primary.main" fontWeight="bold">
                  {account.currency ? `${account.currency} ` : ''}
                  {account.balance !== undefined ? account.balance : 'N/A'}
                </Typography>
              </Box>
              {index < accounts.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Box>
      ) : (
        <Typography color="text.secondary">No balance data available.</Typography>
      )}
    </ResponseModal>
  );
};

export default AccountBalanceModal;
