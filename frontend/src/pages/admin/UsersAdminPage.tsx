import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TablePagination,
} from '@mui/material';
import { Add, Delete, Edit, Search } from '@mui/icons-material';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { adminApi } from '@/api/admin';
import PageHeader from '@/components/common/PageHeader';
import LoadingScreen from '@/components/common/LoadingScreen';
import { extractError } from '@/api/client';
import type { AdminUser, AdminUserUpdate, GroupSummary } from '@/types';

export default function UsersAdminPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<AdminUser | null>(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    is_active: true,
    is_superuser: false,
    is_verified: true,
  });

  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<AdminUserUpdate>({});
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const users = useQuery({
    queryKey: ['admin-users', { page, rowsPerPage }],
    queryFn: () =>
      adminApi.listUsers({ offset: page * rowsPerPage, limit: rowsPerPage }),
  });

  const createM = useMutation({
    mutationFn: () => adminApi.createUser(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      enqueueSnackbar('User created', { variant: 'success' });
      setOpen(false);
      setForm({
        email: '',
        password: '',
        full_name: '',
        is_active: true,
        is_superuser: false,
        is_verified: true,
      });
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });

  const groups = useQuery({
    queryKey: ['admin-groups'],
    queryFn: () => adminApi.listGroups(),
  });

  const updateM = useMutation({
    mutationFn: (payload: AdminUserUpdate) =>
      adminApi.updateUser(editUser!.id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      enqueueSnackbar('User updated', { variant: 'success' });
      setEditUser(null);
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });

  const deleteM = useMutation({
    mutationFn: () => adminApi.deleteUser(deleteTarget!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      enqueueSnackbar('User deleted', { variant: 'success' });
      setDeleteTarget(null);
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });

  const openEdit = (u: AdminUser) => {
    setEditUser(u);
    setEditForm({
      email: u.email,
      full_name: u.full_name ?? '',
      is_active: u.is_active,
      is_superuser: u.is_superuser,
      is_verified: u.is_verified,
      group_id: u.group_id ?? null,
      group_role: u.group_role ?? null,
      remove_from_group: false,
    });
  };

  const lookup = async () => {
    if (!searchEmail.trim()) return;
    try {
      const u = await adminApi.userByEmail(searchEmail.trim());
      setFoundUser(u);
    } catch (e) {
      setFoundUser(null);
      enqueueSnackbar(extractError(e, 'User not found'), { variant: 'error' });
    }
  };

  return (
    <Box>
      <PageHeader
        title="User Manager"
        subtitle="Admin: list, search, and create users"
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
            New User
          </Button>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
            <TextField
              size="small"
              label="Find by email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              fullWidth
            />
            <Button startIcon={<Search />} variant="outlined" onClick={lookup}>
              Find
            </Button>
          </Stack>
          {foundUser && (
            <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
              <Typography variant="subtitle2" gutterBottom>Found:</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                <Typography variant="body2" fontWeight={600}>{foundUser.email}</Typography>
                {foundUser.full_name && <Typography variant="body2" color="text.secondary">{foundUser.full_name}</Typography>}
                {!foundUser.is_active && <Chip size="small" color="default" label="Inactive" />}
                {/* <Chip size="small" label={foundUser.is_active ? 'Active' : 'Inactive'} color={foundUser.is_active ? 'success' : 'default'} /> */}
                <Chip size="small" label={foundUser.is_verified ? 'Verified' : 'Unverified'} color={foundUser.is_verified ? 'primary' : 'warning'} />
                {foundUser.is_superuser && <Chip size="small" color="secondary" label="Admin" />}
                {foundUser.group_name && <Chip size="small" variant="outlined" label={foundUser.group_name} />}
                {foundUser.group_role && <Chip size="small" color={foundUser.group_role === 'owner' ? 'primary' : 'default'} label={foundUser.group_role} />}
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{foundUser.id}</Typography>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {users.isLoading ? (
        <LoadingScreen />
      ) : (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Group</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(users.data || []).map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.full_name || '—'}</TableCell>
                    <TableCell>
                      <Stack direction="row" gap={0.5}>
                        {/* <Chip
                          size="small"
                          label={u.is_active ? 'Active' : 'Inactive'}
                          color={u.is_active ? 'success' : 'default'}
                        /> */}
                        {!u.is_active && <Chip size="small" color="default" label="Inactive" />}
                        <Chip
                          size="small"
                          label={u.is_verified ? 'Verified' : 'Unverified'}
                          color={u.is_verified ? 'primary' : 'warning'}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {u.is_superuser ? (
                        <Chip size="small" color="secondary" label="Admin" />
                      ) : (
                        <Chip size="small" color="default" label="User" />
                      )}
                    </TableCell>
                    <TableCell>
                      {u.group_name ? (
                        <Stack direction="row" gap={0.5} flexWrap="wrap">
                          <Chip size="small" variant="outlined" label={u.group_name} />
                          {u.group_role && (
                            <Chip
                              size="small"
                              color={u.group_role === 'owner' ? 'primary' : 'default'}
                              label={u.group_role}
                            />
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', color: 'text.secondary' }}>
                      {u.id}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" gap={0.5}>
                        <IconButton size="small" onClick={() => openEdit(u)} title="Edit user">
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(u)} title="Delete user">
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {(users.data || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      No users
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={-1}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
            labelDisplayedRows={({ from, to }) => `${from}–${to}`}
          />
        </Paper>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New user</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              fullWidth
              inputProps={{ minLength: 8 }}
            />
            <TextField
              label="Full name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              fullWidth
            />
            <Stack direction="row" gap={2} flexWrap="wrap">
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_verified}
                    onChange={(e) => setForm({ ...form, is_verified: e.target.checked })}
                  />
                }
                label="Verified"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_superuser}
                    onChange={(e) => setForm({ ...form, is_superuser: e.target.checked })}
                  />
                }
                label="Admin"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createM.mutate()}
            disabled={!form.email || !form.password || createM.isPending}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit User Dialog ─────────────────────────────────── */}
      <Dialog open={!!editUser} onClose={() => setEditUser(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit user</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Email"
              type="email"
              value={editForm.email ?? ''}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Full name"
              value={editForm.full_name ?? ''}
              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              fullWidth
            />
            <TextField
              label="New password (leave blank to keep)"
              type="password"
              value={editForm.password ?? ''}
              onChange={(e) =>
                setEditForm({ ...editForm, password: e.target.value || undefined })
              }
              fullWidth
            />
            <Stack direction="row" gap={2} flexWrap="wrap">
              <FormControlLabel
                control={
                  <Switch
                    checked={editForm.is_active ?? true}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editForm.is_verified ?? true}
                    onChange={(e) => setEditForm({ ...editForm, is_verified: e.target.checked })}
                  />
                }
                label="Verified"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editForm.is_superuser ?? false}
                    onChange={(e) => setEditForm({ ...editForm, is_superuser: e.target.checked })}
                  />
                }
                label="Admin"
              />
            </Stack>
            <FormControl fullWidth size="small">
              <InputLabel>Group</InputLabel>
              <Select
                label="Group"
                value={
                  editForm.remove_from_group
                    ? '__none__'
                    : (editForm.group_id?.toString() ?? '__none__')
                }
                onChange={(e) => {
                  if (e.target.value === '__none__') {
                    setEditForm({ ...editForm, group_id: null, group_role: null, remove_from_group: true });
                  } else {
                    setEditForm({ ...editForm, group_id: Number(e.target.value), remove_from_group: false });
                  }
                }}
              >
                <MenuItem value="__none__"><em>None (remove from group)</em></MenuItem>
                {(groups.data ?? []).map((g: GroupSummary) => (
                  <MenuItem key={g.id} value={g.id.toString()}>{g.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {!editForm.remove_from_group && editForm.group_id && (
              <FormControl fullWidth size="small">
                <InputLabel>Group role</InputLabel>
                <Select
                  label="Group role"
                  value={editForm.group_role ?? 'member'}
                  onChange={(e) =>
                    setEditForm({ ...editForm, group_role: e.target.value as 'owner' | 'member' })
                  }
                >
                  <MenuItem value="member">Member</MenuItem>
                  <MenuItem value="owner">Owner</MenuItem>
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => updateM.mutate(editForm)}
            disabled={updateM.isPending}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ────────────────────────── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs">
        <DialogTitle>Delete user?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteTarget?.email}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteM.mutate()}
            disabled={deleteM.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
