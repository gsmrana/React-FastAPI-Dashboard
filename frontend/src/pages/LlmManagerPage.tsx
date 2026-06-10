import {
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
  Slider,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Refresh,
  Star,
  StarBorder,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import Grid from '@mui/material/Grid2';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { llmApi } from '@/api/modules';
import { LLM_PROVIDERS, LLM_CATEGORIES, labelOf } from '@/constants/enums';
import type { CreateLLMConfig, LLMConfig } from '@/types';
import PageHeader from '@/components/common/PageHeader';
import LoadingScreen from '@/components/common/LoadingScreen';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { extractError } from '@/api/client';

const emptyForm: CreateLLMConfig = {
  provider: 0,
  category: 0,
  is_active: false,
  title: '',
  model_name: '',
  api_endpoint: '',
  api_key: '',
  temperature: 0.5,
  notes: '',
  is_starred: false,
  tags: '',
};

export default function LlmManagerPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LLMConfig | null>(null);
  const [form, setForm] = useState<CreateLLMConfig>(emptyForm);
  const [showKey, setShowKey] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const list = useQuery({ queryKey: ['llm-configs'], queryFn: () => llmApi.list() });

  const createM = useMutation({
    mutationFn: (p: CreateLLMConfig) => llmApi.create(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['llm-configs'] });
      enqueueSnackbar('LLM config created', { variant: 'success' });
      setOpen(false);
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });
  const updateM = useMutation({
    mutationFn: (p: { id: number; data: Partial<CreateLLMConfig> }) =>
      llmApi.update(p.id, p.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['llm-configs'] });
      qc.invalidateQueries({ queryKey: ['llm-cached'] });
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });
  const deleteM = useMutation({
    mutationFn: (id: number) => llmApi.remove(id, false),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['llm-configs'] });
      enqueueSnackbar('Deleted', { variant: 'info' });
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });

  const refreshCache = async () => {
    try {
      await llmApi.cached(true);
      qc.invalidateQueries({ queryKey: ['llm-cached'] });
      enqueueSnackbar('Cache refreshed', { variant: 'success' });
    } catch (e) {
      enqueueSnackbar(extractError(e), { variant: 'error' });
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowKey(false);
    setOpen(true);
  };
  const openEdit = (l: LLMConfig) => {
    setEditing(l);
    setForm({
      provider: l.provider,
      category: l.category,
      is_active: l.is_active,
      title: l.title,
      model_name: l.model_name,
      api_endpoint: l.api_endpoint,
      api_key: l.api_key,
      temperature: l.temperature,
      notes: l.notes,
      is_starred: l.is_starred,
      tags: l.tags,
    });
    setShowKey(false);
    setOpen(true);
  };
  const submit = () => {
    if (!form.title.trim() || !form.model_name.trim()) return;
    if (editing) {
      updateM.mutate(
        { id: editing.id, data: form },
        { onSuccess: () => setOpen(false) }
      );
    } else {
      createM.mutate(form);
    }
  };

  return (
    <Box>
      <PageHeader
        title="LLM Manager"
        subtitle="Manage language-model configurations and credentials"
        actions={
          <>
            <Button startIcon={<Refresh />} onClick={refreshCache}>
              Refresh cache
            </Button>
            <Button startIcon={<Add />} variant="contained" onClick={openCreate}>
              New LLM
            </Button>
          </>
        }
      />

      {list.isLoading ? (
        <LoadingScreen />
      ) : (list.data || []).length === 0 ? (
        <EmptyState
          title="No LLM configs"
          message="Add your first model configuration"
          action={
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
              New LLM
            </Button>
          }
        />
      ) : (
        <Grid container spacing={2}>
          {(list.data || []).map((l) => (
            <Grid key={l.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }} noWrap>
                      {l.title}
                    </Typography>
                    <IconButton
                      size="small"
                      sx={{ color: 'warning.main' }}
                      onClick={() =>
                        updateM.mutate({ id: l.id, data: { is_starred: !l.is_starred } })
                      }
                    >
                      {l.is_starred ? <Star /> : <StarBorder />}
                    </IconButton>
                  </Stack>
                  <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mb: 1.5 }}>
                    <Chip size="small" label={labelOf(LLM_PROVIDERS, l.provider)} />
                    <Chip
                      size="small"
                      variant="outlined"
                      label={labelOf(LLM_CATEGORIES, l.category)}
                    />
                    {l.is_active && <Chip size="small" color="success" label="Active" />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    <strong>Model:</strong> {l.model_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    <strong>Endpoint:</strong> {l.api_endpoint}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Temp:</strong> {l.temperature}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={l.is_active}
                        onChange={(e) =>
                          updateM.mutate({ id: l.id, data: { is_active: e.target.checked } })
                        }
                      />
                    }
                    label="Active"
                  />
                  <Box>
                    <IconButton size="small" onClick={() => openEdit(l)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteId(l.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit LLM config' : 'New LLM config'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              autoFocus
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Provider"
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: Number(e.target.value) })}
                fullWidth
              >
                {LLM_PROVIDERS.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: Number(e.target.value) })}
                fullWidth
              >
                {LLM_CATEGORIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <TextField
              label="Model name"
              value={form.model_name}
              onChange={(e) => setForm({ ...form, model_name: e.target.value })}
              required
            />
            <TextField
              label="API endpoint"
              value={form.api_endpoint}
              onChange={(e) => setForm({ ...form, api_endpoint: e.target.value })}
              required
            />
            <TextField
              label="API key"
              type={showKey ? 'text' : 'password'}
              value={form.api_key}
              onChange={(e) => setForm({ ...form, api_key: e.target.value })}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={showKey ? 'Hide' : 'Show'}>
                      <IconButton size="small" onClick={() => setShowKey((s) => !s)}>
                        {showKey ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Temperature: {form.temperature}
              </Typography>
              <Slider
                min={0}
                max={2}
                step={0.1}
                value={form.temperature}
                onChange={(_, v) => setForm({ ...form, temperature: v as number })}
              />
            </Box>
            <TextField
              label="Tags"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
            <TextField
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              multiline
              minRows={2}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={
              !form.title.trim() ||
              !form.model_name.trim() ||
              createM.isPending ||
              updateM.isPending
            }
          >
            {editing ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete LLM config?"
        message="This config will be soft-deleted."
        destructive
        confirmText="Delete"
        onConfirm={() => deleteId && deleteM.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </Box>
  );
}
