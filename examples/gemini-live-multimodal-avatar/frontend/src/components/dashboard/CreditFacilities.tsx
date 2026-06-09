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

import { Box, Typography, Stack, Card, CardContent, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { PieChart } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  last4: string;
  balance: number;
  type: string;
}

export function CreditFacilities({ accounts, activeCredit }: { accounts: Account[], activeCredit: number }) {
  const theme = useTheme();
  const facilities = accounts?.filter(a => a.type === 'loan') || [];

  if (facilities.length === 0) return null;

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ mb: 1, ml: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
        Investment Portfolios
      </Typography>
      {facilities.map(account => (
         <Card key={account.id} elevation={0} sx={{ border: '1px solid', borderColor: 'primary.light', bgcolor: 'white' }}>
           <CardContent sx={{ p: '12px !important' }}>
             <Stack direction="row" justifyContent="space-between" alignItems="center">
               <Box>
                 <Typography variant="body2" color="primary.main" fontWeight="700" sx={{ fontSize: '0.8rem' }}>
                   {account.name}
                 </Typography>
                 <Typography variant="caption" color="text.secondary" fontWeight="500" sx={{ display: 'block', fontSize: '0.65rem' }}>
                   Investments • {account.last4}
                 </Typography>
                 <Typography variant="body2" fontWeight="700" sx={{ mt: 0.5 }}>
                   ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                 </Typography>
                 <Typography variant="caption" color="text.disabled" fontWeight="500" sx={{ fontSize: '0.65rem' }}>
                   ${(activeCredit || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })} retirement target
                 </Typography>
               </Box>
               <Box sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.08), p: 1, borderRadius: 1 }}>
                  <PieChart size={16} color={theme.palette.secondary.main} />
               </Box>
             </Stack>
           </CardContent>
         </Card>
      ))}
    </Box>
  );
}