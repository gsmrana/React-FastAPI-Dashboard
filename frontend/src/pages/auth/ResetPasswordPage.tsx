import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Link, Stack, TextField } from '@mui/material';
import AuthLayout from '@/components/layout/AuthLayout';
import { authApi } from '@/api/auth';
import { extractError } from '@/api/client';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Missing reset token in link.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(extractError(err, 'Could not reset password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="Enter a new password for your account">
      {done ? (
        <Alert severity="success">Password updated. Redirecting to sign in...</Alert>
      ) : (
        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              fullWidth
              inputProps={{ minLength: 8 }}
            />
            <TextField
              label="Confirm new password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              fullWidth
            />
            <Button type="submit" variant="contained" size="large" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update password'}
            </Button>
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Link component={RouterLink} to="/login" underline="hover">
                Back to sign in
              </Link>
            </Box>
          </Stack>
        </Box>
      )}
    </AuthLayout>
  );
}
