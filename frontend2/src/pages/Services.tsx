import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Star,
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  Wrench,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "@/api/services";
import { serviceSchema, type ServiceValues } from "@/lib/schemas";
import { toastError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Service } from "@/types/api";

export default function Services() {
  const list = useServices();
  const create = useCreateService();
  const update = useUpdateService();
  const del = useDeleteService();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);
  const [showPwd, setShowPwd] = useState<Record<number, boolean>>({});

  const form = useForm<ServiceValues>({ resolver: zodResolver(serviceSchema) });

  const filtered = (list.data ?? []).filter(
    (s) =>
      !s.deleted_at &&
      (!search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.category || "").toLowerCase().includes(search.toLowerCase())),
  );

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", url: "", username: "", password: "" });
    setOpen(true);
  };
  const openEdit = (s: Service) => {
    setEditing(s);
    form.reset({
      name: s.name,
      url: s.url || "",
      username: s.username || "",
      password: s.password || "",
      notes: s.notes || "",
      category: s.category || "",
      tags: s.tags || "",
      is_starred: s.is_starred,
    });
    setOpen(true);
  };

  const onSubmit = async (vals: ServiceValues) => {
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

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      {list.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Wrench} title="No services" action={<Button onClick={openCreate}><Plus className="h-4 w-4"/>New</Button>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.id} className="group">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{s.name}</h3>
                    {s.category && <p className="text-xs text-muted-foreground">{s.category}</p>}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => update.mutate({ id: s.id, body: { is_starred: !s.is_starred } })}
                  >
                    <Star className={cn("h-4 w-4", s.is_starred && "fill-yellow-400 text-yellow-400")} />
                  </Button>
                </div>
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 truncate"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{s.url}</span>
                  </a>
                )}
                {s.username && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">User:</span>
                    <span className="font-mono truncate flex-1">{s.username}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copy(s.username!)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {s.password && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">Pass:</span>
                    <span className="font-mono truncate flex-1">
                      {showPwd[s.id] ? s.password : "••••••••"}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => setShowPwd((p) => ({ ...p, [s.id]: !p[s.id] }))}
                    >
                      {showPwd[s.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copy(s.password!)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {s.tags && (
                  <div className="flex flex-wrap gap-1">
                    {s.tags.split(",").filter(Boolean).map((t) => (
                      <Badge key={t} variant="outline">
                        {t.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => del.mutate({ id: s.id })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit service" : "New service"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Name</Label>
                <Input {...form.register("name")} />
              </div>
              <div className="col-span-2">
                <Label>URL</Label>
                <Input {...form.register("url")} placeholder="https://..." />
              </div>
              <div>
                <Label>Username</Label>
                <Input {...form.register("username")} />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" {...form.register("password")} />
              </div>
              <div>
                <Label>Category</Label>
                <Input {...form.register("category")} />
              </div>
              <div>
                <Label>Tags</Label>
                <Input {...form.register("tags")} />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea rows={3} {...form.register("notes")} />
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
