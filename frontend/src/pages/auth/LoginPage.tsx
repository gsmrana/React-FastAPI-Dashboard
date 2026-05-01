import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import AuthLayout from '@/components/layout/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { extractError } from '@/api/client';

export default function LoginPage() {
  const { login } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ username: email, password });
      const next = params.get('next') || '/';
      navigate(next, { replace: true });
    } catch (err) {
      setError(extractError(err, 'Login failed. Check your credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to your dashboard">
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            fullWidth
            autoComplete="email"
          />
          <TextField
            label="Password"
            type={showPwd ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPwd((s) => !s)} edge="end" size="small">
                    {showPwd ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link component={RouterLink} to="/forgot-password" underline="hover">
              Forgot password?
            </Link>
          </Box>
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            Don't have an account?{' '}
            <Link component={RouterLink} to="/register" underline="hover">
              Create one
            </Link>
          </Box>
        </Stack>
      </Box>
    </AuthLayout>
  );
}
