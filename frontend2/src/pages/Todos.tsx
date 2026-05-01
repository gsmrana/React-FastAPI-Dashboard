import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Star, Trash2, ListChecks, Loader2 } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import {
  useTodos,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
} from "@/api/todos";
import { todoSchema, type TodoValues } from "@/lib/schemas";
import { toastError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Todo } from "@/types/api";

const PRIORITIES = ["low", "medium", "high"];

export default function Todos() {
  const list = useTodos({ include_completed: true });
  const create = useCreateTodo();
  const update = useUpdateTodo();
  const del = useDeleteTodo();

  const [tab, setTab] = useState<"all" | "open" | "completed" | "starred">("open");
  const [quick, setQuick] = useState("");
  const [editing, setEditing] = useState<Todo | null>(null);
  const [open, setOpen] = useState(false);

  const form = useForm<TodoValues>({ resolver: zodResolver(todoSchema) });

  const filtered = useMemo(() => {
    return (list.data ?? []).filter((t) => {
      if (t.deleted_at) return false;
      if (tab === "open") return !t.is_completed;
      if (tab === "completed") return t.is_completed;
      if (tab === "starred") return t.is_starred;
      return true;
    });
  }, [list.data, tab]);

  const grouped = useMemo(() => {
    const m = new Map<string, Todo[]>();
    for (const t of filtered) {
      const k = t.category || "Uncategorized";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(t);
    }
    return Array.from(m.entries());
  }, [filtered]);

  const handleQuickAdd = async () => {
    if (!quick.trim()) return;
    try {
      await create.mutateAsync({ title: quick });
      setQuick("");
    } catch (e) {
      toastError(e);
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({ title: "", priority: "medium" });
    setOpen(true);
  };
  const openEdit = (t: Todo) => {
    setEditing(t);
    form.reset({
      title: t.title,
      notes: t.notes || "",
      category: t.category || "",
      priority: t.priority || "medium",
      tags: t.tags || "",
      is_starred: t.is_starred,
      is_completed: t.is_completed,
      deadline_at: t.deadline_at?.slice(0, 16) || "",
      remind_at: t.remind_at?.slice(0, 16) || "",
      repeat_type: t.repeat_type || "",
    });
    setOpen(true);
  };

  const onSubmit = async (vals: TodoValues) => {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex-1">
          <TabsList>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="starred">Starred</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="flex gap-2">
            <Input
              placeholder="Quick add a task and press Enter..."
              value={quick}
              onChange={(e) => setQuick(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
            />
            <Button onClick={handleQuickAdd} disabled={!quick.trim() || create.isPending}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {list.isLoading ? (
        <Skeleton className="h-40" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ListChecks} title="No tasks here" />
      ) : (
        <div className="space-y-4">
          {grouped.map(([category, items]) => (
            <Card key={category}>
              <CardContent className="p-3">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{category}</h3>
                <ul className="space-y-1">
                  {items.map((t) => (
                    <li
                      key={t.id}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent group",
                        t.is_completed && "opacity-60",
                      )}
                    >
                      <Checkbox
                        checked={t.is_completed}
                        onCheckedChange={(c) =>
                          update.mutate({ id: t.id, body: { is_completed: !!c } })
                        }
                      />
                      <button
                        onClick={() => openEdit(t)}
                        className={cn("flex-1 text-left text-sm truncate", t.is_completed && "line-through")}
                      >
                        {t.title}
                      </button>
                      {t.priority && (
                        <Badge
                          variant={
                            t.priority === "high"
                              ? "destructive"
                              : t.priority === "low"
                              ? "outline"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {t.priority}
                        </Badge>
                      )}
                      {t.deadline_at && (
                        <span
                          className={cn(
                            "text-xs",
                            isPast(parseISO(t.deadline_at)) && !t.is_completed
                              ? "text-destructive"
                              : "text-muted-foreground",
                          )}
                        >
                          {format(parseISO(t.deadline_at), "MMM d")}
                        </span>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => update.mutate({ id: t.id, body: { is_starred: !t.is_starred } })}
                      >
                        <Star
                          className={cn(
                            "h-3.5 w-3.5",
                            t.is_starred && "fill-yellow-400 text-yellow-400",
                          )}
                        />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100"
                        onClick={() => del.mutate({ id: t.id })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit task" : "New task"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={3} {...form.register("notes")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Input {...form.register("category")} />
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={form.watch("priority") || "medium"}
                  onValueChange={(v) => form.setValue("priority", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tags</Label>
                <Input {...form.register("tags")} />
              </div>
              <div>
                <Label>Repeat</Label>
                <Input {...form.register("repeat_type")} placeholder="daily, weekly..." />
              </div>
              <div>
                <Label>Deadline</Label>
                <Input type="datetime-local" {...form.register("deadline_at")} />
              </div>
              <div>
                <Label>Remind at</Label>
                <Input type="datetime-local" {...form.register("remind_at")} />
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
