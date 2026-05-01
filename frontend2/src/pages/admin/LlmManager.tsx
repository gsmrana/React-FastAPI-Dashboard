import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, RefreshCw, Eye, EyeOff, Copy, Loader2, Cpu } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import {
  useLlmConfigs,
  useCreateLlm,
  useUpdateLlm,
  useDeleteLlm,
} from "@/api/llm-configs";
import { llmSchema, type LlmValues } from "@/lib/schemas";
import { toastError, api } from "@/lib/api";
import type { LlmConfig } from "@/types/api";

export default function LlmManager() {
  const list = useLlmConfigs();
  const create = useCreateLlm();
  const update = useUpdateLlm();
  const del = useDeleteLlm();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LlmConfig | null>(null);
  const [showKey, setShowKey] = useState<Record<number, boolean>>({});

  const form = useForm<LlmValues>({ resolver: zodResolver(llmSchema) });

  const openCreate = () => {
    setEditing(null);
    form.reset({ provider: "openai", title: "", model_name: "", is_active: true, temperature: 0.7 });
    setOpen(true);
  };
  const openEdit = (l: LlmConfig) => {
    setEditing(l);
    form.reset({
      provider: l.provider,
      category: l.category || "",
      is_active: l.is_active,
      title: l.title,
      model_name: l.model_name,
      api_endpoint: l.api_endpoint || "",
      api_key: l.api_key || "",
      temperature: l.temperature ?? 0.7,
      notes: l.notes || "",
      tags: l.tags || "",
      is_starred: l.is_starred,
    });
    setOpen(true);
  };

  const onSubmit = async (vals: LlmValues) => {
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

  const refreshCache = async () => {
    try {
      await api.get("/llm-configs/cached", { params: { force_refresh: true } });
      qc.invalidateQueries({ queryKey: ["llm-configs"] });
      toast.success("Cache refreshed");
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Button onClick={refreshCache} variant="outline">
          <RefreshCw className="h-4 w-4" /> Refresh cache
        </Button>
        <div className="flex-1" />
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {list.isLoading ? (
            <div className="p-4">
              <Skeleton className="h-32" />
            </div>
          ) : (list.data ?? []).length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Cpu} title="No LLM configs" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="hidden lg:table-cell">API key</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(list.data ?? []).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{l.provider}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{l.model_name}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {l.api_key ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs">
                            {showKey[l.id] ? l.api_key : `${l.api_key.slice(0, 4)}••••${l.api_key.slice(-4)}`}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => setShowKey((s) => ({ ...s, [l.id]: !s[l.id] }))}
                          >
                            {showKey[l.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => navigator.clipboard.writeText(l.api_key!).then(() => toast.success("Copied"))}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={l.is_active}
                        onCheckedChange={(v) => update.mutate({ id: l.id, body: { is_active: v } })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(l)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => del.mutate({ id: l.id })}
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit LLM" : "New LLM"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Provider</Label>
                <Input {...form.register("provider")} placeholder="openai, anthropic..." />
              </div>
              <div>
                <Label>Category</Label>
                <Input {...form.register("category")} />
              </div>
              <div className="col-span-2">
                <Label>Title</Label>
                <Input {...form.register("title")} />
              </div>
              <div className="col-span-2">
                <Label>Model name</Label>
                <Input {...form.register("model_name")} placeholder="gpt-4o-mini..." />
              </div>
              <div className="col-span-2">
                <Label>API endpoint</Label>
                <Input {...form.register("api_endpoint")} placeholder="https://..." />
              </div>
              <div className="col-span-2">
                <Label>API key</Label>
                <Input type="password" {...form.register("api_key")} />
              </div>
              <div>
                <Label>Temperature</Label>
                <Input type="number" step="0.1" min="0" max="2" {...form.register("temperature")} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={!!form.watch("is_active")}
                  onCheckedChange={(v) => form.setValue("is_active", v)}
                />
                <Label>Active</Label>
              </div>
              <div className="col-span-2">
                <Label>Tags</Label>
                <Input {...form.register("tags")} />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea rows={2} {...form.register("notes")} />
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
