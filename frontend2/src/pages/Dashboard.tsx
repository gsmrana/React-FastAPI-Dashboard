import { Link } from "react-router-dom";
import {
  ListChecks,
  StickyNote,
  DollarSign,
  FolderKanban,
  Wrench,
  Cpu,
  Bot,
  ArrowRight,
  Plus,
} from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTodos } from "@/api/todos";
import { useNotes } from "@/api/notepads";
import { useExpenses } from "@/api/expenses";
import { useDocuments } from "@/api/documents";
import { useServices } from "@/api/services";
import { useLlmConfigs } from "@/api/llm-configs";
import { useAuthStore } from "@/stores/auth-store";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const todos = useTodos({ include_completed: true });
  const notes = useNotes();
  const docs = useDocuments();
  const services = useServices();
  const llms = useLlmConfigs({ is_active: true });

  const fromDate = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const toDate = format(new Date(), "yyyy-MM-dd");
  const expenses = useExpenses({ from_date: fromDate, to_date: toDate });

  const openTodos = todos.data?.filter((t) => !t.is_completed).length ?? 0;
  const completedTodos = todos.data?.filter((t) => t.is_completed).length ?? 0;
  const totalExpenses = (expenses.data ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);
  const currency = expenses.data?.[0]?.currency || "USD";

  // Build daily expense series
  const byDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const k = format(subDays(new Date(), i), "MMM d");
    byDay.set(k, 0);
  }
  for (const e of expenses.data ?? []) {
    try {
      const k = format(parseISO(e.date), "MMM d");
      if (byDay.has(k)) byDay.set(k, (byDay.get(k) ?? 0) + (e.amount ?? 0));
    } catch {
      /* ignore */
    }
  }
  const dailySeries = Array.from(byDay, ([day, amount]) => ({ day, amount }));

  // Expense by category pie
  const catMap = new Map<string, number>();
  for (const e of expenses.data ?? []) {
    const c = e.category || "Uncategorized";
    catMap.set(c, (catMap.get(c) ?? 0) + (e.amount ?? 0));
  }
  const catData = Array.from(catMap, ([name, value]) => ({ name, value }));

  // Todos completion in last 14 days (from updated_at when is_completed)
  const days = Array.from({ length: 14 }, (_, i) => format(subDays(new Date(), 13 - i), "MMM d"));
  const completedMap = new Map(days.map((d) => [d, 0] as [string, number]));
  for (const t of todos.data ?? []) {
    if (!t.is_completed || !t.updated_at) continue;
    try {
      const k = format(parseISO(t.updated_at), "MMM d");
      if (completedMap.has(k)) completedMap.set(k, (completedMap.get(k) ?? 0) + 1);
    } catch {
      /* ignore */
    }
  }
  const completionSeries = days.map((day) => ({ day, completed: completedMap.get(day) ?? 0 }));

  const recentTodos = (todos.data ?? [])
    .filter((t) => !t.is_completed)
    .slice(0, 5);
  const recentNotes = (notes.data ?? []).slice(0, 5);
  const recentDocs = (docs.data ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}!
        </h2>
        <p className="text-muted-foreground">Here's what's happening across your hub.</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Kpi
          title="Open To-Dos"
          value={openTodos}
          icon={ListChecks}
          loading={todos.isLoading}
          to="/todos"
          sub={`${completedTodos} done`}
        />
        <Kpi
          title="Notes"
          value={notes.data?.length ?? 0}
          icon={StickyNote}
          loading={notes.isLoading}
          to="/notes"
        />
        <Kpi
          title="Spent (30d)"
          value={`${currency} ${totalExpenses.toFixed(2)}`}
          icon={DollarSign}
          loading={expenses.isLoading}
          to="/expenses"
        />
        <Kpi
          title="Files"
          value={docs.data?.length ?? 0}
          icon={FolderKanban}
          loading={docs.isLoading}
          to="/files"
        />
        <Kpi
          title="Services"
          value={services.data?.length ?? 0}
          icon={Wrench}
          loading={services.isLoading}
          to="/services"
        />
        <Kpi
          title="Active LLMs"
          value={llms.data?.length ?? 0}
          icon={Cpu}
          loading={llms.isLoading}
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to="/todos">
            <Plus className="h-4 w-4" /> New To-Do
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/notes">
            <Plus className="h-4 w-4" /> New Note
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/files">
            <Plus className="h-4 w-4" /> Upload File
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/chat">
            <Bot className="h-4 w-4" /> Open Chat
          </Link>
        </Button>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily expenses (30 days)</CardTitle>
            <CardDescription>Total spent per day</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} />
                <RTooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                  }}
                />
                <Bar dataKey="amount" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By category</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {catData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                    {catData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks completed (14 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={completionSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <RTooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                }}
              />
              <Line type="monotone" dataKey="completed" stroke="hsl(var(--chart-2))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <div className="grid gap-4 md:grid-cols-3">
        <RecentList
          title="Recent To-Dos"
          to="/todos"
          empty="No open tasks"
          items={recentTodos.map((t) => ({ id: t.id, title: t.title, badge: t.priority || undefined }))}
        />
        <RecentList
          title="Recent Notes"
          to="/notes"
          empty="No notes yet"
          items={recentNotes.map((n) => ({ id: n.id, title: n.title, badge: n.category || undefined }))}
        />
        <RecentList
          title="Recent Files"
          to="/files"
          empty="No files yet"
          items={recentDocs.map((d) => ({ id: d.filename, title: d.filename }))}
        />
      </div>
    </div>
  );
}

function Kpi({
  title,
  value,
  icon: Icon,
  loading,
  to,
  sub,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  to?: string;
  sub?: string;
}) {
  const inner = (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{title}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="text-2xl font-bold truncate">{value}</div>
        )}
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function RecentList({
  title,
  to,
  items,
  empty,
}: {
  title: string;
  to: string;
  items: { id: string | number; title: string; badge?: string }[];
  empty: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button asChild size="sm" variant="ghost">
          <Link to={to}>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{empty}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between gap-2 py-1 border-b last:border-0"
              >
                <span className="truncate text-sm">{it.title}</span>
                {it.badge && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {it.badge}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
