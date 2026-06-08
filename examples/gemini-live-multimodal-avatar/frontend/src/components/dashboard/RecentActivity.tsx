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

import { Box, Typography, Stack, Paper, Divider } from '@mui/material';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  date: string;
}

export function RecentActivity({ transactions }: { transactions: Transaction[] }) {
  if (!transactions || transactions.length === 0) return null;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, ml: 0.5, mr: 0.5 }}>
        <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
          Recent Activity
        </Typography>
        <Typography variant="caption" color="primary.main" fontWeight="700" sx={{ cursor: 'pointer', fontSize: '0.65rem' }}>
          Full Statement
        </Typography>
      </Stack>
      <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <Stack divider={<Divider flexItem sx={{ opacity: 0.5 }} />}>
          {transactions.map(tx => (
            <Box key={tx.id} sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'white' }}>
              <Box sx={{ 
                p: 0.75, 
                borderRadius: 1, 
                bgcolor: tx.amount < 0 ? 'slate.50' : 'rgba(16, 185, 129, 0.05)',
                color: tx.amount < 0 ? 'text.secondary' : 'success.main',
                display: 'flex',
                border: '1px solid',
                borderColor: 'divider'
              }}>
                {tx.amount < 0 ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" fontWeight="700" sx={{ fontSize: '0.75rem' }}>{tx.merchant}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight="500" sx={{ fontSize: '0.65rem' }}>{tx.category} • {tx.date}</Typography>
              </Box>
              <Typography variant="body2" fontWeight="700" sx={{ fontSize: '0.75rem' }} color={tx.amount < 0 ? 'text.primary' : 'success.main'}>
                {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}