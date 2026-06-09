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

import { Box, Typography, Stack, Card, CardContent } from '@mui/material';

interface Account {
  id: string;
  name: string;
  last4: string;
  balance: number;
  type: string;
}

export function AccountsFeed({ accounts }: { accounts: Account[] }) {
  const filteredAccounts = accounts?.filter(a => a.type !== 'loan') || [];
  
  if (filteredAccounts.length === 0) return null;

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ mb: 1, ml: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
        Cash & Deposits
      </Typography>
      <Stack spacing={1}>
        {filteredAccounts.map(account => (
          <Card key={account.id} elevation={0} sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: '12px !important' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.primary" fontWeight="700" sx={{ fontSize: '0.8rem' }}>
                    {account.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight="500" sx={{ display: 'block', fontSize: '0.65rem' }}>
                    Ending in {account.last4}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" fontWeight="700" sx={{ color: 'text.primary' }}>
                    ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>Available</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
