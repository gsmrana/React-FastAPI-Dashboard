import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO, subDays } from "date-fns";
import { Plus, Trash2, Pencil, DollarSign, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "@/api/expenses";
import { expenseSchema, type ExpenseValues } from "@/lib/schemas";
import { toastError } from "@/lib/api";
import type { Expense } from "@/types/api";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function Expenses() {
  const [from, setFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const list = useExpenses({ from_date: from, to_date: to });
  const create = useCreateExpense();
  const update = useUpdateExpense();
  const del = useDeleteExpense();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const form = useForm<ExpenseValues>({ resolver: zodResolver(expenseSchema) });

  const items = list.data ?? [];
  const total = items.reduce((s, e) => s + e.amount, 0);
  const currency = items[0]?.currency || "USD";

  const byDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of items) {
      try {
        const k = format(parseISO(e.date), "MMM d");
        m.set(k, (m.get(k) ?? 0) + e.amount);
      } catch {
        /* ignore */
      }
    }
    return Array.from(m, ([day, amount]) => ({ day, amount }));
  }, [items]);

  const byPayment = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of items) {
      const k = e.payment_method || "Other";
      m.set(k, (m.get(k) ?? 0) + e.amount);
    }
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    form.reset({
      title: "",
      amount: 0,
      currency: "USD",
      date: format(new Date(), "yyyy-MM-dd"),
    });
    setOpen(true);
  };
  const openEdit = (e: Expense) => {
    setEditing(e);
    form.reset({
      title: e.title,
      description: e.description || "",
      date: e.date.slice(0, 10),
      category: e.category || "",
      tags: e.tags || "",
      location: e.location || "",
      payment_method: e.payment_method || "",
      amount: e.amount,
      currency: e.currency,
    });
    setOpen(true);
  };

  const onSubmit = async (vals: ExpenseValues) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, body: vals });
        toast.success("Updated");
      } else {
        await create.mutateAsync(vals);
        toast.success("Created");
      }
      setOpen(false);
    } catch (e) {
      toastError(e);
    }
  };

  const exportCsv = () => {
    const header = "Date,Title,Category,Amount,Currency,Payment,Location,Description\n";
    const rows = items
      .map((e) =>
        [
          e.date,
          escape(e.title),
          escape(e.category),
          e.amount,
          e.currency,
          escape(e.payment_method),
          escape(e.location),
          escape(e.description),
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="flex gap-2 items-center">
          <Label className="shrink-0">From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
          <Label className="shrink-0">To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
        </div>
        <div className="flex-1" />
        <Button variant="outline" onClick={exportCsv} disabled={!items.length}>
          <Download className="h-4 w-4" /> CSV
        </Button>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      {/* Summary + charts */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total in range</p>
            <p className="text-2xl font-bold">
              {currency} {total.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {items.length} entries
            </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Daily totals</CardTitle>
          </CardHeader>
          <CardContent className="h-[180px]">
            {byDay.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
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
            )}
          </CardContent>
        </Card>
      </div>

      {byPayment.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">By payment method</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byPayment} dataKey="value" nameKey="name" outerRadius={70} label>
                  {byPayment.map((_, i) => (
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
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {list.isLoading ? (
            <div className="p-4">
              <Skeleton className="h-32" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={DollarSign} title="No expenses in range" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs">{e.date.slice(0, 10)}</TableCell>
                    <TableCell className="font-medium">{e.title}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {e.category}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {e.payment_method}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {e.currency} {e.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(e)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => del.mutate({ id: e.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit expense" : "New expense"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Title</Label>
                <Input {...form.register("title")} />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" {...form.register("date")} />
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" step="0.01" {...form.register("amount")} />
              </div>
              <div>
                <Label>Currency</Label>
                <Input {...form.register("currency")} placeholder="USD" />
              </div>
              <div>
                <Label>Category</Label>
                <Input {...form.register("category")} />
              </div>
              <div>
                <Label>Payment method</Label>
                <Input {...form.register("payment_method")} />
              </div>
              <div>
                <Label>Location</Label>
                <Input {...form.register("location")} />
              </div>
              <div className="col-span-2">
                <Label>Tags</Label>
                <Input {...form.register("tags")} />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea rows={2} {...form.register("description")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>
                {(create.isPending || update.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function escape(s?: string | null) {
  if (!s) return "";
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
