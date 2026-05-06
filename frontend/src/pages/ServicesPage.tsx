import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add,
  ContentCopy,
  Delete,
  Edit,
  Launch,
  Star,
  StarBorder,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import Grid from '@mui/material/Grid2';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { servicesApi } from '@/api/modules';
import { SERVICE_CATEGORIES, labelOf } from '@/constants/enums';
import type { CreateService, Service } from '@/types';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import LoadingScreen from '@/components/common/LoadingScreen';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { extractError } from '@/api/client';

const emptyForm: CreateService = {
  name: '',
  url: '',
  username: '',
  password: '',
  notes: '',
  is_starred: false,
  category: 0,
  tags: '',
};

export default function ServicesPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<CreateService>(emptyForm);
  const [showPwd, setShowPwd] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const services = useQuery({ queryKey: ['services'], queryFn: () => servicesApi.list() });

  const createM = useMutation({
    mutationFn: (p: CreateService) => servicesApi.create(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      enqueueSnackbar('Service saved', { variant: 'success' });
      setOpen(false);
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });
  const updateM = useMutation({
    mutationFn: (p: { id: number; data: Partial<CreateService> }) =>
      servicesApi.update(p.id, p.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      enqueueSnackbar('Service updated', { variant: 'success' });
      setOpen(false);
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });
  const deleteM = useMutation({
    mutationFn: (id: number) => servicesApi.remove(id, false),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      enqueueSnackbar('Service deleted', { variant: 'info' });
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });

  const filtered = useMemo(() => {
    const all = services.data || [];
    const q = search.trim().toLowerCase();
    const sorted = [...all].sort((a, b) =>
      a.is_starred === b.is_starred ? a.name.localeCompare(b.name) : a.is_starred ? -1 : 1
    );
    if (!q) return sorted;
    return sorted.filter((s) =>
      [s.name, s.url, s.username, s.tags, s.notes].some((v) =>
        v?.toLowerCase().includes(q)
      )
    );
  }, [services.data, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowPwd(false);
    setOpen(true);
  };
  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      name: s.name,
      url: s.url,
      username: s.username,
      password: s.password,
      notes: s.notes,
      is_starred: s.is_starred,
      category: s.category,
      tags: s.tags,
    });
    setShowPwd(false);
    setOpen(true);
  };
  const submit = () => {
    if (!form.name.trim()) return;
    if (editing) updateM.mutate({ id: editing.id, data: form });
    else createM.mutate(form);
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      enqueueSnackbar(`${label} copied`, { variant: 'success' });
    } catch {
      enqueueSnackbar('Copy failed', { variant: 'error' });
    }
  };

  return (
    <Box>
      <PageHeader
        title="Services"
        subtitle="Vault for service credentials and quick links"
        actions={
          <>
            <TextField
              size="small"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 220 } }}
            />
            <Button startIcon={<Add />} variant="contained" onClick={openCreate}>
              New Service
            </Button>
          </>
        }
      />

      {/* <Alert severity="warning" sx={{ mb: 2 }}>
        Passwords are stored as-is on the server. Avoid using this for high-security secrets.
      </Alert> */}

      {services.isLoading ? (
        <LoadingScreen />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No services"
          message="Save your first service credential"
          action={
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
              New Service
            </Button>
          }
        />
      ) : (
        <Grid container spacing={2}>
          {filtered.map((s) => {
            const initial = s.name.trim().charAt(0).toUpperCase() || '?';
            const isRev = !!revealed[s.id];
            return (
              <Grid key={s.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'primary.main',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 18,
                        }}
                      >
                        {initial}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                          {s.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {labelOf(SERVICE_CATEGORIES, s.category)}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        sx={{ color: 'warning.main' }}
                        onClick={() =>
                          updateM.mutate({ id: s.id, data: { is_starred: !s.is_starred } })
                        }
                      >
                        {s.is_starred ? <Star /> : <StarBorder />}
                      </IconButton>
                    </Stack>
                    {s.url && (
                      <Stack direction="row" alignItems="center" gap={0.5} sx={{ mb: 0.5 }}>
                        <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                          {s.url}
                        </Typography>
                        <Tooltip title="Open">
                          <IconButton
                            size="small"
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Launch fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                    {s.username && (
                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <Typography variant="body2" sx={{ flex: 1 }} noWrap>
                          <strong>User:</strong> {s.username}
                        </Typography>
                        <IconButton size="small" onClick={() => copy(s.username, 'Username')}>
                          <ContentCopy fontSize="inherit" />
                        </IconButton>
                      </Stack>
                    )}
                    {s.password && (
                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <Typography
                          variant="body2"
                          sx={{ flex: 1, fontFamily: 'monospace' }}
                          noWrap
                        >
                          {isRev ? s.password : '••••••••'}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() =>
                            setRevealed((r) => ({ ...r, [s.id]: !r[s.id] }))
                          }
                        >
                          {isRev ? <VisibilityOff fontSize="inherit" /> : <Visibility fontSize="inherit" />}
                        </IconButton>
                        <IconButton size="small" onClick={() => copy(s.password, 'Password')}>
                          <ContentCopy fontSize="inherit" />
                        </IconButton>
                      </Stack>
                    )}
                    {s.tags && (
                      <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
                        {s.tags
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean)
                          .slice(0, 4)
                          .map((t) => (
                            <Chip key={t} size="small" label={t} variant="outlined" />
                          ))}
                      </Stack>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 2 }}>
                    <IconButton size="small" onClick={() => openEdit(s)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteId(s.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit service' : 'New service'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
            <TextField
              label="URL"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                fullWidth
              />
              <TextField
                label="Password"
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPwd((s) => !s)}
                        edge="end"
                      >
                        {showPwd ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: Number(e.target.value) })}
                fullWidth
              >
                {SERVICE_CATEGORIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                fullWidth
              />
            </Stack>
            <TextField
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={!form.name.trim() || createM.isPending || updateM.isPending}
          >
            {editing ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete service?"
        message="The service entry will be soft-deleted."
        destructive
        confirmText="Delete"
        onConfirm={() => deleteId && deleteM.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </Box>
  );
}
