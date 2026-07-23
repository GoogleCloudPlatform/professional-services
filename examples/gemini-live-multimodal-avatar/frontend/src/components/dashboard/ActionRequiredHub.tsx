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
import { AlertCircle, FileText, ChevronRight } from 'lucide-react';

interface ActionItem {
  id: string;
  type: string;
  title: string;
  description: string;
}

export function ActionRequiredHub({ items }: { items: ActionItem[] }) {
  if (!items || items.length === 0) return null;

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ mb: 1, ml: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
        Action Required
      </Typography>
      <Stack spacing={0.75}>
        {items.map(item => (
          <Card key={item.id} elevation={0} sx={{ border: '1px solid', borderColor: item.type === 'alert' ? 'warning.light' : 'divider', bgcolor: item.type === 'alert' ? 'rgba(245, 158, 11, 0.05)' : 'white' }}>
            <CardContent sx={{ p: '12px !important' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ 
                  p: 0.75, 
                  borderRadius: 1.5, 
                  bgcolor: item.type === 'alert' ? 'warning.main' : 'secondary.main',
                  color: 'white',
                  display: 'flex'
                }}>
                  {item.type === 'alert' ? <AlertCircle size={16} /> : <FileText size={16} />}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight="700" sx={{ fontSize: '0.8rem' }}>{item.title}</Typography>
                  <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500, fontSize: '0.7rem' }}>{item.description}</Typography>
                </Box>
                <ChevronRight size={14} color="#94a3b8" />
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
