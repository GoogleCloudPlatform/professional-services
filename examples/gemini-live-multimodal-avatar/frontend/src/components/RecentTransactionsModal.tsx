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
import { 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper 
} from '@mui/material';
import ResponseModal from './ResponseModal';

export interface Transaction {
  id?: string;
  date?: string;
  description?: string;
  amount?: number | string;
}

interface RecentTransactionsModalProps {
  open: boolean;
  onClose: () => void;
  transactions: Transaction[] | null;
}

const RecentTransactionsModal: React.FC<RecentTransactionsModalProps> = ({ open, onClose, transactions }) => {
  return (
    <ResponseModal open={open} onClose={onClose} title="Recent Transactions">
      {transactions && transactions.length > 0 ? (
        <TableContainer component={Paper} elevation={0} variant="outlined">
          <Table size="small" aria-label="recent transactions table">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((row, index) => (
                <TableRow
                  key={row.id || index}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {row.date || 'N/A'}
                  </TableCell>
                  <TableCell>{row.description || 'N/A'}</TableCell>
                  <TableCell align="right" sx={{ 
                    color: typeof row.amount === 'number' ? (row.amount < 0 ? 'error.main' : 'success.main') : 'inherit',
                    fontWeight: 'bold'
                  }}>
                    {row.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography color="text.secondary">No recent transactions found.</Typography>
      )}
    </ResponseModal>
  );
};

export default RecentTransactionsModal;
