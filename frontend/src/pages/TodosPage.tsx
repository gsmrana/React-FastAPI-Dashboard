import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
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
  Star,
  StarBorder,
} from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import dayjs, { type Dayjs } from 'dayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import { todosApi } from '@/api/modules';
import {
  TODO_CATEGORIES,
  TODO_PRIORITIES,
  TODO_REPEAT,
  labelOf,
} from '@/constants/enums';
import type { Todo, CreateTodo } from '@/types';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import LoadingScreen from '@/components/common/LoadingScreen';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { extractError } from '@/api/client';

const emptyForm: CreateTodo = {
  title: '',
  notes: '',
  is_starred: false,
  is_completed: false,
  category: 0,
  priority: 1,
  tags: '',
  repeat_type: 0,
  deadline_at: null,
  remind_at: null,
};

export default function TodosPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [includeCompleted, setIncludeCompleted] = useState(true);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);
  const [form, setForm] = useState<CreateTodo>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const todos = useQuery({
    queryKey: ['todos', { includeCompleted, includeDeleted }],
    queryFn: () =>
      todosApi.list({
        include_completed: includeCompleted,
        include_deleted: includeDeleted,
      }),
  });

  const createM = useMutation({
    mutationFn: (payload: CreateTodo) => todosApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['todos'] });
      enqueueSnackbar('Todo created', { variant: 'success' });
      setOpen(false);
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });

  const updateM = useMutation({
    mutationFn: (params: { id: number; data: Partial<CreateTodo> }) =>
      todosApi.update(params.id, params.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });

  const deleteM = useMutation({
    mutationFn: (id: number) => todosApi.remove(id, false),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['todos'] });
      enqueueSnackbar('Todo deleted', { variant: 'info' });
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });

  const filtered = useMemo(() => {
    const all = todos.data || [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q) ||
        t.tags.toLowerCase().includes(q)
    );
  }, [todos.data, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (t: Todo) => {
    setEditing(t);
    setForm({
      title: t.title,
      notes: t.notes,
      is_starred: t.is_starred,
      is_completed: t.is_completed,
      category: t.category,
      priority: t.priority,
      tags: t.tags,
      repeat_type: t.repeat_type,
      deadline_at: t.deadline_at,
      remind_at: t.remind_at,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.title.trim()) return;
    if (editing) {
      updateM.mutate(
        { id: editing.id, data: form },
        { onSuccess: () => setOpen(false) }
      );
    } else {
      createM.mutate(form);
    }
  };

  // Group by priority
  const groups = TODO_PRIORITIES.map((p) => ({
    ...p,
    items: filtered.filter((t) => t.priority === p.value && !t.is_completed),
  }));
  const completed = filtered.filter((t) => t.is_completed);

  return (
    <Box>
      <PageHeader
        title="Todos"
        subtitle="Plan, prioritize, and complete your tasks"
        actions={
          <>
            <TextField
              size="small"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 220 } }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={includeCompleted}
                  onChange={(e) => setIncludeCompleted(e.target.checked)}
                  size="small"
                />
              }
              label="Completed"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={includeDeleted}
                  onChange={(e) => setIncludeDeleted(e.target.checked)}
                  size="small"
                />
              }
              label="Deleted"
            />
            <Button startIcon={<Add />} variant="contained" onClick={openCreate}>
              New Todo
            </Button>
          </>
        }
      />

      {todos.isLoading ? (
        <LoadingScreen />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No todos yet"
          message="Create your first task to get started"
          action={
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
              New Todo
            </Button>
          }
        />
      ) : (
        <Stack spacing={3}>
          {groups.map((g) => (
            <Box key={g.value}>
              <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
                <Chip label={g.label} color={g.color} size="small" />
                <Typography variant="subtitle2" color="text.secondary">
                  {g.items.length} task{g.items.length === 1 ? '' : 's'}
                </Typography>
              </Stack>
              {g.items.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>
                  Nothing here.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {g.items.map((t) => (
                    <TodoCard
                      key={t.id}
                      todo={t}
                      onToggle={() =>
                        updateM.mutate({
                          id: t.id,
                          data: { is_completed: !t.is_completed },
                        })
                      }
                      onStar={() =>
                        updateM.mutate({
                          id: t.id,
                          data: { is_starred: !t.is_starred },
                        })
                      }
                      onEdit={() => openEdit(t)}
                      onDelete={() => setDeleteId(t.id)}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          ))}
          {completed.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Completed ({completed.length})
              </Typography>
              <Stack spacing={1.25}>
                {completed.map((t) => (
                  <TodoCard
                    key={t.id}
                    todo={t}
                    onToggle={() =>
                      updateM.mutate({
                        id: t.id,
                        data: { is_completed: !t.is_completed },
                      })
                    }
                    onStar={() =>
                      updateM.mutate({ id: t.id, data: { is_starred: !t.is_starred } })
                    }
                    onEdit={() => openEdit(t)}
                    onDelete={() => setDeleteId(t.id)}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit todo' : 'New todo'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              autoFocus
            />
            <TextField
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              multiline
              minRows={3}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                fullWidth
              >
                {TODO_PRIORITIES.map((p) => (
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
                {TODO_CATEGORIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <DateTimePicker
                label="Deadline"
                value={form.deadline_at ? dayjs(form.deadline_at) : null}
                onChange={(v: Dayjs | null) =>
                  setForm({
                    ...form,
                    deadline_at: v ? v.format('YYYY-MM-DD HH:mm:ss') : null,
                  })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DateTimePicker
                label="Remind at"
                value={form.remind_at ? dayjs(form.remind_at) : null}
                onChange={(v: Dayjs | null) =>
                  setForm({
                    ...form,
                    remind_at: v ? v.format('YYYY-MM-DD HH:mm:ss') : null,
                  })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Repeat"
                value={form.repeat_type}
                onChange={(e) =>
                  setForm({ ...form, repeat_type: Number(e.target.value) })
                }
                fullWidth
              >
                {TODO_REPEAT.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Tags (comma-separated)"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                fullWidth
              />
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_starred}
                  onChange={(e) => setForm({ ...form, is_starred: e.target.checked })}
                />
              }
              label="Starred"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={!form.title.trim() || createM.isPending || updateM.isPending}
          >
            {editing ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete todo?"
        message="The todo will be soft-deleted. You can recover it from 'Deleted' filter."
        destructive
        confirmText="Delete"
        onConfirm={() => deleteId && deleteM.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </Box>
  );
}

function TodoCard({
  todo,
  onToggle,
  onStar,
  onEdit,
  onDelete,
}: {
  todo: Todo;
  onToggle: () => void;
  onStar: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const overdue =
    todo.deadline_at &&
    !todo.is_completed &&
    dayjs(todo.deadline_at).isBefore(dayjs());

  return (
    <Card
      variant="outlined"
      sx={{
        transition: 'border-color 0.15s, transform 0.1s',
        '&:hover': { borderColor: 'primary.main' },
        opacity: todo.is_completed ? 0.7 : 1,
      }}
    >
      <CardContent
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, '&:last-child': { pb: 2 } }}
      >
        <Checkbox checked={todo.is_completed} onChange={onToggle} />
        <Tooltip title={todo.is_starred ? 'Unstar' : 'Star'}>
          <IconButton size="small" onClick={onStar} sx={{ color: 'warning.main' }}>
            {todo.is_starred ? <Star /> : <StarBorder />}
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 500,
              textDecoration: todo.is_completed ? 'line-through' : 'none',
            }}
            noWrap
          >
            {todo.title}
          </Typography>
          <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap" sx={{ mt: 0.25 }}>
            <Chip
              size="small"
              variant="outlined"
              label={labelOf(TODO_CATEGORIES, todo.category)}
            />
            {todo.deadline_at && (
              <Chip
                size="small"
                color={overdue ? 'error' : 'default'}
                variant="outlined"
                label={dayjs(todo.deadline_at).format('MMM D, HH:mm')}
              />
            )}
            {todo.tags &&
              todo.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
                .slice(0, 4)
                .map((t) => (
                  <Chip key={t} size="small" label={t} variant="outlined" />
                ))}
          </Stack>
        </Box>
        <IconButton size="small" onClick={onEdit}>
          <Edit fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={onDelete} color="error">
          <Delete fontSize="small" />
        </IconButton>
      </CardContent>
    </Card>
  );
}
