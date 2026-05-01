import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid2';
import { useSnackbar } from 'notistack';
import { authApi } from '@/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/common/PageHeader';
import { extractError } from '@/api/client';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(user?.full_name || '');
    setEmail(user?.email || '');
  }, [user]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await authApi.updateMe({ full_name: fullName });
      await refresh();
      enqueueSnackbar('Profile updated', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(extractError(err), { variant: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    setPwdError(null);
    if (newPwd !== confirmPwd) {
      setPwdError('Passwords do not match');
      return;
    }
    if (newPwd.length < 8) {
      setPwdError('Password must be at least 8 characters');
      return;
    }
    setSavingPwd(true);
    try {
      await authApi.updateMe({ password: newPwd });
      enqueueSnackbar('Password changed', { variant: 'success' });
      setOldPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      setPwdError(extractError(err, 'Could not change password'));
    } finally {
      setSavingPwd(false);
    }
  };

  if (!user) return null;

  const initials = (user.full_name || user.email)
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Box>
      <PageHeader title="Profile" subtitle="Manage your account" />
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Stack alignItems="center" spacing={2} sx={{ py: 2 }}>
                <Box
                  sx={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 36,
                    fontWeight: 700,
                  }}
                >
                  {initials}
                </Box>
                <Typography variant="h6">{user.full_name || 'Unnamed user'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
                <Stack direction="row" gap={1}>
                  {user.is_superuser && <Chip color="secondary" size="small" label="Admin" />}
                  <Chip
                    size="small"
                    color={user.is_verified ? 'success' : 'warning'}
                    label={user.is_verified ? 'Verified' : 'Unverified'}
                  />
                  <Chip
                    size="small"
                    color={user.is_active ? 'success' : 'default'}
                    label={user.is_active ? 'Active' : 'Inactive'}
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Account details
              </Typography>
              <Stack spacing={2}>
                <TextField label="Email" value={email} disabled fullWidth />
                <TextField
                  label="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  fullWidth
                />
                <Box>
                  <Button variant="contained" onClick={saveProfile} disabled={savingProfile}>
                    {savingProfile ? 'Saving...' : 'Save changes'}
                  </Button>
                </Box>
              </Stack>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                Change password
              </Typography>
              <Stack spacing={2}>
                {pwdError && <Alert severity="error">{pwdError}</Alert>}
                <TextField
                  label="Current password (optional)"
                  type="password"
                  value={oldPwd}
                  onChange={(e) => setOldPwd(e.target.value)}
                  fullWidth
                  helperText="Leave empty if not enforced by your server"
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="New password"
                    type="password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    fullWidth
                    inputProps={{ minLength: 8 }}
                  />
                  <TextField
                    label="Confirm new password"
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    fullWidth
                  />
                </Stack>
                <Box>
                  <Button
                    variant="contained"
                    onClick={savePassword}
                    disabled={savingPwd || !newPwd}
                  >
                    {savingPwd ? 'Updating...' : 'Update password'}
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
