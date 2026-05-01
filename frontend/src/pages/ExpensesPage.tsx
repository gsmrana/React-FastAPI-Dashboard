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
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
  FormControlLabel,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import Grid from '@mui/material/Grid2';
import { DatePicker } from '@mui/x-date-pickers';
import { useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { expensesApi } from '@/api/modules';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_METHODS,
  labelOf,
} from '@/constants/enums';
import type { CreateExpense, Expense } from '@/types';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import LoadingScreen from '@/components/common/LoadingScreen';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { extractError } from '@/api/client';

const emptyForm: CreateExpense = {
  title: '',
  description: '',
  date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  category: 0,
  tags: '',
  location: '',
  payment_method: 0,
  amount: 0,
  currency: 'BDT',
};

export default function ExpensesPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [from, setFrom] = useState<Dayjs | null>(dayjs().startOf('month'));
  const [to, setTo] = useState<Dayjs | null>(dayjs().endOf('month'));
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<CreateExpense>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const expenses = useQuery({
    queryKey: ['expenses', { from: from?.format('YYYY-MM-DD'), to: to?.format('YYYY-MM-DD'), includeDeleted }],
    queryFn: () =>
      expensesApi.list({
        from_date: from ? from.format('YYYY-MM-DD') : undefined,
        to_date: to ? to.format('YYYY-MM-DD') : undefined,
        include_deleted: includeDeleted,
      }),
  });

  const createM = useMutation({
    mutationFn: (p: CreateExpense) => expensesApi.create(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      enqueueSnackbar('Expense added', { variant: 'success' });
      setOpen(false);
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });
  const updateM = useMutation({
    mutationFn: (p: { id: number; data: Partial<CreateExpense> }) =>
      expensesApi.update(p.id, p.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      enqueueSnackbar('Expense updated', { variant: 'success' });
      setOpen(false);
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });
  const deleteM = useMutation({
    mutationFn: (id: number) => expensesApi.remove(id, false),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      enqueueSnackbar('Expense deleted', { variant: 'info' });
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });

  const filtered = useMemo(() => {
    const all = expenses.data || [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((e) =>
      [e.title, e.description, e.tags, e.location].some((v) =>
        v?.toLowerCase().includes(q)
      )
    );
  }, [expenses.data, search]);

  const total = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);
  const byCategory: Record<number, number> = {};
  filtered.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount || 0);
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };
  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({
      title: e.title,
      description: e.description,
      date: e.date,
      category: e.category,
      tags: e.tags,
      location: e.location,
      payment_method: e.payment_method,
      amount: e.amount,
      currency: e.currency,
    });
    setOpen(true);
  };
  const submit = () => {
    if (!form.title.trim()) return;
    if (editing) updateM.mutate({ id: editing.id, data: form });
    else createM.mutate(form);
  };

  return (
    <Box>
      <PageHeader
        title="Expenses"
        subtitle="Track your spending and stay on budget"
        actions={
          <Button startIcon={<Add />} variant="contained" onClick={openCreate}>
            New Expense
          </Button>
        }
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <DatePicker
          label="From"
          value={from}
          onChange={setFrom}
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />
        <DatePicker
          label="To"
          value={to}
          onChange={setTo}
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />
        <TextField
          size="small"
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
        />
        <FormControlLabel
          control={
            <Switch
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
              size="small"
            />
          }
          label="Show deleted"
          sx={{ whiteSpace: 'nowrap' }}
        />
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Total
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {filtered.length} transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {Object.entries(byCategory)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([cat, amt]) => (
            <Grid key={cat} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    {labelOf(EXPENSE_CATEGORIES, Number(cat))}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {amt.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {((amt / Math.max(total, 1)) * 100).toFixed(1)}% of total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      {expenses.isLoading ? (
        <LoadingScreen />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No expenses"
          message="Try adjusting filters or add your first expense"
          action={
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
              New Expense
            </Button>
          }
        />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {dayjs(e.date).format('YYYY-MM-DD')}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {e.title}
                    </Typography>
                    {e.location && (
                      <Typography variant="caption" color="text.secondary">
                        {e.location}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={labelOf(EXPENSE_CATEGORIES, e.category)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {labelOf(EXPENSE_PAYMENT_METHODS, e.payment_method)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {Number(e.amount).toFixed(2)} {e.currency}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(e)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteId(e.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit expense' : 'New expense'}</DialogTitle>
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
                label="Amount"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                required
                fullWidth
              />
              <TextField
                label="Currency"
                value={form.currency}
                onChange={(e) =>
                  setForm({ ...form, currency: e.target.value.toUpperCase().slice(0, 3) })
                }
                fullWidth
                inputProps={{ maxLength: 3 }}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <DatePicker
                label="Date"
                value={dayjs(form.date)}
                onChange={(v) =>
                  setForm({ ...form, date: (v || dayjs()).format('YYYY-MM-DD HH:mm:ss') })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
              <TextField
                select
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: Number(e.target.value) })}
                fullWidth
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Payment method"
                value={form.payment_method}
                onChange={(e) =>
                  setForm({ ...form, payment_method: Number(e.target.value) })
                }
                fullWidth
              >
                {EXPENSE_PAYMENT_METHODS.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                fullWidth
              />
            </Stack>
            <TextField
              label="Tags (comma-separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
            disabled={!form.title.trim() || createM.isPending || updateM.isPending}
          >
            {editing ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete expense?"
        message="This expense will be soft-deleted."
        destructive
        confirmText="Delete"
        onConfirm={() => deleteId && deleteM.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </Box>
  );
}
