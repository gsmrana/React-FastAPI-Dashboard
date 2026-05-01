import { useEffect, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Link, Stack, TextField } from '@mui/material';
import AuthLayout from '@/components/layout/AuthLayout';
import { authApi } from '@/api/auth';
import { extractError } from '@/api/client';

export default function VerifyPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>(
    token ? 'verifying' : 'idle'
  );
  const [error, setError] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState('');
  const [resendDone, setResendDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        await authApi.verify(token);
        setStatus('success');
      } catch (err) {
        setError(extractError(err, 'Verification failed.'));
        setStatus('error');
      }
    })();
  }, [token]);

  const requestNew = async () => {
    setResendDone(false);
    try {
      await authApi.requestVerifyToken(resendEmail);
      setResendDone(true);
    } catch (err) {
      setError(extractError(err, 'Could not request a new verification link.'));
    }
  };

  return (
    <AuthLayout title="Email verification">
      {status === 'verifying' && (
        <Stack alignItems="center" spacing={2} sx={{ py: 2 }}>
          <CircularProgress />
          <Box>Verifying your email...</Box>
        </Stack>
      )}
      {status === 'success' && (
        <Stack spacing={2}>
          <Alert severity="success">Your email has been verified! You can now sign in.</Alert>
          <Link component={RouterLink} to="/login" underline="hover">
            Continue to sign in →
          </Link>
        </Stack>
      )}
      {status === 'error' && (
        <Stack spacing={2}>
          <Alert severity="error">{error || 'Token is invalid or expired.'}</Alert>
          <Box>Request a new verification link:</Box>
          <TextField
            label="Email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            type="email"
            fullWidth
          />
          <Button onClick={requestNew} variant="contained">
            Send new link
          </Button>
          {resendDone && <Alert severity="success">If an account exists, a link has been sent.</Alert>}
        </Stack>
      )}
      {status === 'idle' && (
        <Stack spacing={2}>
          <Alert severity="info">
            Open the verification link from your email to verify your account.
          </Alert>
          <TextField
            label="Email (resend link)"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            type="email"
            fullWidth
          />
          <Button onClick={requestNew} variant="contained">
            Send verification link
          </Button>
          {resendDone && <Alert severity="success">If an account exists, a link has been sent.</Alert>}
        </Stack>
      )}
    </AuthLayout>
  );
}
