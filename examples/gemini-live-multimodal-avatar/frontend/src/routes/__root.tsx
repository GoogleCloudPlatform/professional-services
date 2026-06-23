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

import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
// TO RE-ENABLE OAUTH REDIRECTS: Uncomment useNavigate:
// import { useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Box, AppBar, Toolbar, Typography, Button, CssBaseline, ThemeProvider, Paper, IconButton, CircularProgress } from '@mui/material'
import { ErrorProvider } from '../context/ErrorProvider'
import { useErrorContext } from '../context/ErrorContext'
import { ModalProvider } from '../context/ModalContext'
import { TelemetryProvider } from '../context/TelemetryContext'
import { DemoConfigProvider } from '../context/DemoConfigContext'
import { OverlayProvider } from '../context/OverlayContext'
import GlobalModals from '../components/GlobalModals'
import { TelemetrySidebar } from '../components/TelemetrySidebar'
import { DemoSidebar } from '../components/DemoSidebar'
import { useState } from 'react'
// TO RE-ENABLE OAUTH REDIRECTS: Uncomment useRef and useEffect:
// import { useRef, useEffect } from 'react'
import { Bug, X, MessageCircle } from 'lucide-react'
import { cymbalTheme } from '../theme/cymbalTheme'
import { useAriaHiddenHack } from '../hooks/useAriaHiddenHack'
import { AuthProvider, useAuth } from '../context/AuthContext'

function HeaderGreeting() {
  return (
    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
      <img src="/logo-with-text.svg" alt="Cymbal Advisor" style={{ height: '32px' }} />
    </Box>
  )
}

function DebugPanel() {
  const { logs, clearLogs } = useErrorContext();
  const [isOpen, setIsOpen] = useState(false);

  const errorCount = logs.filter(l => l.level === 'error').length;

  if (logs.length === 0) return null;

  if (!isOpen) {
    return (
      <Button 
        variant="contained" 
        color={errorCount > 0 ? "error" : "primary"}
        onClick={() => setIsOpen(true)}
        sx={{ position: 'fixed', bottom: 16, right: 64, zIndex: 9999, borderRadius: 8 }}
        startIcon={<Bug size={18} />}
      >
        Logs ({logs.length})
      </Button>
    )
  }

  return (
    <Paper 
      elevation={6}
      sx={{ 
        position: 'fixed', 
        bottom: 16, 
        right: 16, 
        width: 400, 
        maxHeight: 300, 
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'grey.200', borderBottom: 1, borderColor: 'grey.300' }}>
        <Typography variant="subtitle2" fontWeight="bold">Debug Logs</Typography>
        <Box>
          <Button size="small" onClick={clearLogs}>Clear</Button>
          <IconButton size="small" onClick={() => setIsOpen(false)}>
            <X size={16} />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ p: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
        {logs.map(log => (
          <Box key={log.id} sx={{ p: 1, borderRadius: 1, bgcolor: log.level === 'error' ? 'error.light' : log.level === 'warn' ? 'warning.light' : 'info.light', color: 'white' }}>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
              {log.timestamp.toLocaleTimeString()} - {log.level.toUpperCase()}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {log.message}
            </Typography>
            {!!log.details && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontFamily: 'monospace', wordBreak: 'break-all', opacity: 0.9 }}>
                {JSON.stringify(log.details)}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

function RootContent() {
  const { user, loading } = useAuth();
  const location = useLocation();
  // TO RE-ENABLE OAUTH REDIRECTS: Uncomment these:
  // const navigate = useNavigate();
  // const isRedirecting = useRef(false);
  useAriaHiddenHack();

  const isLoginPage = location.pathname === '/login';

  // TO RE-ENABLE OAUTH REDIRECTS: Uncomment this useEffect to enforce authentication:
  /*
  useEffect(() => {
    console.log(`[RootContent] Redirect useEffect run: user=${user?.email}, loading=${loading}, isLoginPage=${isLoginPage}, isRedirecting.current=${isRedirecting.current}, pathname=${location.pathname}`);

    if (isLoginPage) {
      isRedirecting.current = false;
    }

    if (!loading && !user && !isLoginPage && !isRedirecting.current) {
      console.log('[RootContent] Condition met: redirecting to /login');
      isRedirecting.current = true;
      navigate({ to: '/login' });
    }
  }, [user, loading, isLoginPage, navigate, location.pathname]);
  */

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#0f172a' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user && !isLoginPage) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#0f172a' }}>
        <CircularProgress />
      </Box>
    );
  }



  // If on login page, render clean layout without sidebars/header
  if (isLoginPage) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        bgcolor: '#0f172a', 
        p: { xs: 0, sm: 2 } 
      }}>
        <Box sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          height: { xs: '100vh', sm: 'calc(100vh - 32px)' },
          p: { xs: 0, sm: '12px' }, 
          bgcolor: { xs: 'transparent', sm: '#0f172a' }, 
          borderRadius: { xs: 0, sm: '48px' }, 
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ 
            width: '100%', 
            flexGrow: 1,
            bgcolor: 'background.default', 
            display: 'flex', 
            flexDirection: 'column',
            position: 'relative',
            borderRadius: { xs: 0, sm: '36px' },
            overflow: 'hidden',
            border: { xs: 'none', sm: '2px solid #334155' }
          }}>
            <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Outlet />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  // Default layout with sidebars and header
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      bgcolor: '#0f172a', 
      gap: 2, 
      p: { xs: 0, sm: 2 } 
    }}>
      <Box sx={{ 
        display: { xs: 'none', lg: 'block' }, 
        height: 'calc(100vh - 32px)',
        bgcolor: '#1e293b', 
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        opacity: 0.8 
      }}>
        <DemoSidebar />
      </Box>
      
      {/* Mobile Device Chrome */}
      <Box sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 480,
        height: { xs: '100vh', sm: 'calc(100vh - 32px)' },
        p: { xs: 0, sm: '12px' }, 
        bgcolor: { xs: 'transparent', sm: '#0f172a' }, 
        borderRadius: { xs: 0, sm: '48px' }, 
        boxShadow: { xs: 'none', sm: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' },
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Internal Screen */}
        <Box sx={{ 
          width: '100%', 
          flexGrow: 1,
          bgcolor: 'background.default', 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          borderRadius: { xs: 0, sm: '36px' },
          overflow: 'hidden',
          border: { xs: 'none', sm: '2px solid #334155' }
        }}>
          <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'grey.100', bgcolor: 'white' }}>
            <Toolbar>
              <HeaderGreeting />
              <IconButton color="secondary">
                <MessageCircle size={24} />
              </IconButton>
            </Toolbar>
          </AppBar>
          <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Outlet />
          </Box>
          <GlobalModals />
        </Box>
      </Box>

      <Box sx={{ 
        display: { xs: 'none', md: 'block' }, 
        height: 'calc(100vh - 32px)',
        bgcolor: '#1e293b', 
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        opacity: 0.8 
      }}>
        <TelemetrySidebar />
      </Box>
    </Box>
  );
}

function RootComponent() {
  return (
    <ErrorProvider>
      <DemoConfigProvider>
        <TelemetryProvider>
          <ThemeProvider theme={cymbalTheme}>
            <OverlayProvider>
              <ModalProvider>
                <CssBaseline />
                <AuthProvider>
                  <RootContent />
                  <DebugPanel />
                  <TanStackRouterDevtools />
                </AuthProvider>
              </ModalProvider>
            </OverlayProvider>
          </ThemeProvider>
        </TelemetryProvider>
      </DemoConfigProvider>
    </ErrorProvider>
  );
}

export const Route = createRootRoute({
  component: RootComponent
})