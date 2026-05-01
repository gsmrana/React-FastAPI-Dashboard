import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  CheckCircleOutline,
  Receipt,
  StickyNote2,
  VpnKey,
  Folder,
  TrendingUp,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import {
  todosApi,
  expensesApi,
  notepadsApi,
  servicesApi,
} from '@/api/modules';
import { documentsApi } from '@/api/documents';
import { useAuth } from '@/contexts/AuthContext';
import {
  TODO_PRIORITIES,
  EXPENSE_CATEGORIES,
  labelOf,
} from '@/constants/enums';
import PageHeader from '@/components/common/PageHeader';
import type { ReactNode } from 'react';

function StatCard({
  icon,
  label,
  value,
  hint,
  to,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  to?: string;
  color?: string;
}) {
  const theme = useTheme();
  return (
    <Card
      component={to ? RouterLink : 'div'}
      {...(to ? { to } : {})}
      sx={{
        textDecoration: 'none',
        height: '100%',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': to
          ? { transform: 'translateY(-2px)', boxShadow: theme.shadows[4] }
          : undefined,
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="overline" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
              {value}
            </Typography>
            {hint && (
              <Typography variant="caption" color="text.secondary">
                {hint}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: color || 'primary.main',
              color: '#fff',
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

const PIE_COLORS = ['#4caf50', '#ff9800', '#f44336', '#2196f3', '#9c27b0'];

export default function DashboardPage() {
  const { user } = useAuth();
  const theme = useTheme();

  const todos = useQuery({ queryKey: ['todos'], queryFn: () => todosApi.list() });
  const expenses = useQuery({
    queryKey: ['expenses', 'dashboard'],
    queryFn: () =>
      expensesApi.list({
        from_date: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
        to_date: dayjs().format('YYYY-MM-DD'),
      }),
  });
  const notes = useQuery({ queryKey: ['notes'], queryFn: () => notepadsApi.list() });
  const services = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.list(),
  });
  const documents = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list(),
  });

  const todosPending = (todos.data || []).filter((t) => !t.is_completed).length;
  const monthExpenses = (expenses.data || []).filter((e) =>
    dayjs(e.date).isAfter(dayjs().startOf('month'))
  );
  const monthTotal = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  // Charts data
  const expByCategory = EXPENSE_CATEGORIES.map((c) => ({
    name: c.label,
    total: monthExpenses
      .filter((e) => e.category === c.value)
      .reduce((s, e) => s + Number(e.amount || 0), 0),
  })).filter((d) => d.total > 0);

  const todosByPriority = TODO_PRIORITIES.map((p) => ({
    name: p.label,
    value: (todos.data || []).filter((t) => t.priority === p.value && !t.is_completed)
      .length,
  })).filter((d) => d.value > 0);

  // Last 30 days expense line
  const dailyExpense: { date: string; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = dayjs().subtract(i, 'day').format('MM-DD');
    const dateStr = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const total = (expenses.data || [])
      .filter((e) => dayjs(e.date).format('YYYY-MM-DD') === dateStr)
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    dailyExpense.push({ date: d, total });
  }

  const recentTodos = (todos.data || [])
    .filter((t) => !t.is_completed)
    .slice(0, 5);
  const recentExpenses = (expenses.data || []).slice(0, 5);
  const greeting =
    new Date().getHours() < 12
      ? 'Good morning'
      : new Date().getHours() < 18
        ? 'Good afternoon'
        : 'Good evening';

  return (
    <Box>
      <PageHeader
        title={`${greeting}${user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}`}
        subtitle="Here's what's happening in your workspace"
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard
            icon={<CheckCircleOutline />}
            label="Pending todos"
            value={todosPending}
            hint={`${todos.data?.length ?? 0} total`}
            to="/todos"
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard
            icon={<Receipt />}
            label="Spent this month"
            value={monthTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            hint={`${monthExpenses.length} txn`}
            to="/expenses"
            color="#f57c00"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard
            icon={<StickyNote2 />}
            label="Notes"
            value={notes.data?.length ?? 0}
            to="/notepad"
            color="#7b1fa2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard
            icon={<VpnKey />}
            label="Services"
            value={services.data?.length ?? 0}
            to="/services"
            color="#2e7d32"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard
            icon={<Folder />}
            label="Documents"
            value={documents.data?.length ?? 0}
            to="/files"
            color="#0288d1"
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6">Expenses (last 30 days)</Typography>
                <Chip icon={<TrendingUp />} label={`${monthExpenses.length} txns`} size="small" />
              </Stack>
              <Box sx={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={dailyExpense}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Pending todos by priority
              </Typography>
              <Box sx={{ width: '100%', height: 280 }}>
                {todosByPriority.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={todosByPriority}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {todosByPriority.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                    <Typography color="text.secondary">No pending todos</Typography>
                  </Stack>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Expenses by category (this month)
              </Typography>
              <Box sx={{ width: '100%', height: 260 }}>
                {expByCategory.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={expByCategory}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="total" fill={theme.palette.secondary.main} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                    <Typography color="text.secondary">No expenses yet</Typography>
                  </Stack>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Upcoming todos
              </Typography>
              <Stack spacing={1.5}>
                {recentTodos.length === 0 && (
                  <Typography color="text.secondary" variant="body2">
                    Nothing to do — you're all caught up!
                  </Typography>
                )}
                {recentTodos.map((t) => {
                  const pri = TODO_PRIORITIES.find((p) => p.value === t.priority);
                  return (
                    <Stack key={t.id} direction="row" alignItems="center" gap={1.5}>
                      <Chip
                        label={pri?.label || '—'}
                        size="small"
                        color={pri?.color || 'default'}
                        sx={{ minWidth: 64 }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap variant="body2" sx={{ fontWeight: 500 }}>
                          {t.title}
                        </Typography>
                        {t.deadline_at && (
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(t.deadline_at).format('MMM D, HH:mm')}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent expenses
              </Typography>
              <Stack spacing={1.5}>
                {recentExpenses.length === 0 && (
                  <Typography color="text.secondary" variant="body2">
                    No recent transactions.
                  </Typography>
                )}
                {recentExpenses.map((e) => (
                  <Stack key={e.id} direction="row" alignItems="center" gap={1.5}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography noWrap variant="body2" sx={{ fontWeight: 500 }}>
                        {e.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(e.date).format('MMM D')} · {labelOf(EXPENSE_CATEGORIES, e.category)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {Number(e.amount).toFixed(2)} {e.currency}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
