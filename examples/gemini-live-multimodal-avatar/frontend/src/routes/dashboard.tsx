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

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { 
  Box, 
  Typography, 
  Stack, 
  IconButton, 
  Button, 
  Avatar,
} from '@mui/material'
import { 
  Bell, 
  User,
  Plus,
  Send,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { mockBankingService } from '../services/mockBankingService'
import { ActionRequiredHub } from '../components/dashboard/ActionRequiredHub'
import { AccountsFeed } from '../components/dashboard/AccountsFeed'
import { TotalBalanceHero } from '../components/dashboard/TotalBalanceHero'
import { CreditFacilities } from '../components/dashboard/CreditFacilities'
import { RecentActivity } from '../components/dashboard/RecentActivity'
import { BottomNavigation } from '../components/dashboard/BottomNavigation'
import { useDemoConfig } from '../context/DemoConfigContext'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const navigate = useNavigate()
  const { interactionMode } = useDemoConfig()

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: mockBankingService.getAccounts
  })

  const { data: activeCredit } = useQuery({
    queryKey: ['activeCredit'],
    queryFn: mockBankingService.getActiveCredit
  })

  const { data: actionItems } = useQuery({
    queryKey: ['actionItems'],
    queryFn: mockBankingService.getActionItems
  })

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: mockBankingService.getTransactions
  })

  const totalBalance = accounts?.reduce((acc, curr) => acc + (curr.type !== 'loan' ? curr.balance : 0), 0) || 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.default' }}>
      
      {/* Header */}
      <Box sx={{ p: 1.5, px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontWeight: 700, fontSize: '0.6rem', letterSpacing: -0.2 }}>CB</Avatar>
          <Box>
            <Typography variant="body2" fontWeight="700" sx={{ lineHeight: 1, fontSize: '0.8rem' }}>Cymbal</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Commercial Banking</Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={0.25}>
          <IconButton size="small">
            <Bell size={18} color="#64748b" />
          </IconButton>
          <IconButton size="small">
            <User size={18} color="#64748b" />
          </IconButton>
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, pb: 12 }}>
        
        <TotalBalanceHero totalBalance={totalBalance} />

        {/* Quick Actions Row */}
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          <Button 
            fullWidth 
            variant="contained" 
            size="small" 
            startIcon={<Plus size={16} />}
            sx={{ borderRadius: 2, py: 1, fontSize: '0.75rem', fontWeight: 700 }}
          >
            Invest
          </Button>
          <Button 
            fullWidth 
            variant="outlined" 
            size="small" 
            startIcon={<Send size={16} />}
            sx={{ borderRadius: 2, py: 1, fontSize: '0.75rem', fontWeight: 700, borderColor: 'divider', color: 'text.primary' }}
          >
            Transfer
          </Button>
        </Stack>

        <Stack spacing={3}>
          <ActionRequiredHub items={actionItems || []} />
          <AccountsFeed accounts={accounts || []} />
          <CreditFacilities accounts={accounts || []} activeCredit={activeCredit || 0} />
          <RecentActivity transactions={transactions || []} />
        </Stack>
      </Box>

      <BottomNavigation onAdvisorClick={() => navigate({ to: `/advisor/${interactionMode.replace('_', '-')}` })} />
    </Box>
  )
}
