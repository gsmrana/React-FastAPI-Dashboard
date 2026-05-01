import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Star, Trash2, StickyNote, Loader2 } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { Markdown } from "@/components/markdown";
import {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from "@/api/notepads";
import { noteSchema, type NoteValues } from "@/lib/schemas";
import { toastError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/api";

export default function Notes() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [editing, setEditing] = useState<Note | null>(null);
  const [open, setOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const includeDel = tab === "trash";
  const list = useNotes({ include_deleted: includeDel });
  const create = useCreateNote();
  const update = useUpdateNote();
  const del = useDeleteNote();

  const form = useForm<NoteValues>({ resolver: zodResolver(noteSchema) });

  const filtered = (list.data ?? []).filter((n) => {
    const isDel = !!n.deleted_at;
    if (tab === "active" && isDel) return false;
    if (tab === "trash" && !isDel) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      (n.content || "").toLowerCase().includes(q) ||
      (n.tags || "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ title: "", content: "", category: "", tags: "", is_starred: false });
    setOpen(true);
    setPreviewMode(false);
  };
  const openEdit = (n: Note) => {
    setEditing(n);
    form.reset({
      title: n.title,
      content: n.content || "",
      category: n.category || "",
      tags: n.tags || "",
      is_starred: n.is_starred,
    });
    setOpen(true);
    setPreviewMode(false);
  };

  const onSubmit = async (vals: NoteValues) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, body: vals });
        toast.success("Note updated");
      } else {
        await create.mutateAsync(vals);
        toast.success("Note created");
      }
      setOpen(false);
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "active" | "trash")}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="trash">Trash</TabsTrigger>
          </TabsList>
        </Tabs>
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
        <EmptyState
          icon={StickyNote}
          title={tab === "trash" ? "Trash is empty" : "No notes yet"}
          action={tab === "active" ? <Button onClick={openCreate}><Plus className="h-4 w-4"/>New note</Button> : null}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((n) => (
            <Card key={n.id} className="group cursor-pointer hover:shadow-md" onClick={() => openEdit(n)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <h3 className="font-medium flex-1 truncate">{n.title}</h3>
                  {n.is_starred && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await del.mutateAsync({ id: n.id, hard: tab === "trash" });
                        toast.success("Deleted");
                      } catch (err) {
                        toastError(err);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                  {n.content || "(empty)"}
                </p>
                {(n.category || n.tags) && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {n.category && <Badge variant="secondary">{n.category}</Badge>}
                    {n.tags?.split(",").filter(Boolean).map((t) => (
                      <Badge key={t} variant="outline">
                        {t.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit note" : "New note"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Input {...form.register("category")} />
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input {...form.register("tags")} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Content</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setPreviewMode((p) => !p)}
                >
                  {previewMode ? "Edit" : "Preview"}
                </Button>
              </div>
              {previewMode ? (
                <div className="min-h-[200px] border rounded-md p-3">
                  <Markdown>{form.watch("content") || ""}</Markdown>
                </div>
              ) : (
                <Textarea rows={10} {...form.register("content")} className={cn("font-mono text-sm")} />
              )}
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
