import { useState, type FormEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Link, Stack, TextField } from '@mui/material';
import AuthLayout from '@/components/layout/AuthLayout';
import { authApi } from '@/api/auth';
import { extractError } from '@/api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await authApi.forgotPassword(email);
      setDone(true);
    } catch (err) {
      setError(extractError(err, 'Could not initiate password reset.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="We'll email you a link to reset your password"
    >
      {done ? (
        <Stack spacing={2}>
          <Alert severity="success">
            If an account exists for <strong>{email}</strong>, a reset link has been sent.
          </Alert>
          <Link component={RouterLink} to="/login" underline="hover">
            Back to sign in
          </Link>
        </Stack>
      ) : (
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
            />
            <Button type="submit" variant="contained" size="large" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send reset link'}
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
