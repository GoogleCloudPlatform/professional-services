import React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

function BypassedLoginComponent() {
  const navigate = useNavigate()
  React.useEffect(() => {
    navigate({ to: '/dashboard' })
  }, [navigate])
  return null
}

export const Route = createFileRoute('/login')({
  component: BypassedLoginComponent,
})

// TO RE-ENABLE OAUTH / FIREBASE SIGN-IN SCREEN:
// 1. Replace the Route component above with:
//    export const Route = createFileRoute('/login')({
//      component: LoginComponent,
//    })
// 2. Uncomment the imports and the LoginComponent code below.

/*
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Alert,
  CircularProgress
} from '@mui/material'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../config/firebase'
import { useAuth } from '../context/AuthContext'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

function LoginComponent() {
  const { user, loading: authLoading, error: authError, clearError } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  React.useEffect(() => {
    if (user && !authLoading) {
      navigate({ to: '/dashboard' })
    }
  }, [user, authLoading, navigate])

  const handleGoogleSignIn = async () => {
    setError(null)
    clearError()
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Google Sign-In failed')
      }
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0f172a' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100%', 
      bgcolor: '#f8fafc', 
      p: 2 
    }}>
      <Card sx={{ maxWidth: 400, width: '100%', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <img src="/logo-with-text.svg" alt="Cymbal Advisor" style={{ height: '40px', marginBottom: '16px' }} />
            <Typography variant="h5" fontWeight="700" color="text.primary">
              Welcome to Cymbal Advisor
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Sign in to access your dashboard
            </Typography>
          </Box>

          {(error || authError) && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error || authError}</Alert>}

          <Button
            fullWidth
            variant="outlined"
            onClick={handleGoogleSignIn}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
            sx={{ 
              py: 1.5, 
              borderRadius: 2, 
              borderColor: 'divider', 
              color: 'text.primary',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              '&:hover': {
                bgcolor: 'grey.50',
                borderColor: 'grey.300'
              }
            }}
          >
            {loading ? 'Signing in...' : 'Continue with Google'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
*/
