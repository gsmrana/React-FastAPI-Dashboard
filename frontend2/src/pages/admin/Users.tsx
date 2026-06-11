import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminUsers,
  useCreateAdminUser,
  useAdminGroups,
  useUpdateAdminUser,
  useDeleteAdminUser,
  useFindUserByEmail,
} from "@/api/admin";
import { toastError } from "@/lib/api";
import type { AdminUserRead } from "@/types/api";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().optional(),
  is_superuser: z.boolean().optional(),
  is_verified: z.boolean().optional(),
});
type CreateValues = z.infer<typeof createSchema>;

const editSchema = z.object({
  email: z.string().email().optional(),
  full_name: z.string().optional(),
  password: z.string().min(6).optional().or(z.literal("")),
  is_active: z.boolean().optional(),
  is_superuser: z.boolean().optional(),
  is_verified: z.boolean().optional(),
  group_id: z.number().nullable().optional(),
  group_role: z.enum(["owner", "member"]).nullable().optional(),
  remove_from_group: z.boolean().optional(),
});
type EditValues = z.infer<typeof editSchema>;

export default function Users() {
  const [offset, setOffset] = useState(0);
  const limit = 25;
  const list = useAdminUsers({ offset, limit });
  const create = useCreateAdminUser();
  const find = useFindUserByEmail();
  const groups = useAdminGroups();
  const update = useUpdateAdminUser();
  const remove = useDeleteAdminUser();
  const [open, setOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [found, setFound] = useState<AdminUserRead | null>(null);
  const [editUser, setEditUser] = useState<AdminUserRead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRead | null>(null);

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { is_superuser: false, is_verified: true },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  const openEdit = (u: AdminUserRead) => {
    setEditUser(u);
    editForm.reset({
      email: u.email,
      full_name: u.full_name ?? "",
      password: "",
      is_active: u.is_active,
      is_superuser: u.is_superuser,
      is_verified: u.is_verified,
      group_id: u.group_id ?? null,
      group_role: u.group_role ?? null,
      remove_from_group: false,
    });
  };

  const onSubmit = async (vals: CreateValues) => {
    try {
      await create.mutateAsync(vals);
      toast.success("User created");
      setOpen(false);
      form.reset();
    } catch (e) {
      toastError(e);
    }
  };

  const onEdit = async (vals: EditValues) => {
    if (!editUser) return;
    try {
      const payload = { ...vals };
      if (!payload.password) delete payload.password;
      await update.mutateAsync({ id: editUser.id, payload });
      toast.success("User updated");
      setEditUser(null);
    } catch (e) {
      toastError(e);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      toast.success("User deleted");
      setDeleteTarget(null);
    } catch (e) {
      toastError(e);
    }
  };

  const onFind = async () => {
    if (!searchEmail.trim()) return;
    try {
      const u = await find.mutateAsync(searchEmail.trim());
      setFound(u);
    } catch (e) {
      setFound(null);
      toastError(e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Find user by email..."
            className="pl-9"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onFind()}
          />
        </div>
        <Button onClick={onFind} variant="outline" disabled={find.isPending}>
          Find
        </Button>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New user
        </Button>
      </div>

      {found && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Found:</p>
            <UserInline user={found} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {list.isLoading ? (
            <div className="p-4">
              <Skeleton className="h-32" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Role</TableHead>
                  <TableHead className="hidden lg:table-cell">Group</TableHead>
                  <TableHead className="hidden lg:table-cell">ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(list.data ?? []).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{u.full_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {!u.is_active && <Badge variant="destructive">Inactive</Badge>}
                        {u.is_verified ? (
                          <Badge variant="secondary">Verified</Badge>
                        ) : (
                          <Badge variant="outline">Unverified</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.is_superuser ? (
                          <Badge variant="default">Admin</Badge>
                        ) : (
                          <Badge variant="secondary">User</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {u.group_name ? (
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline">{u.group_name}</Badge>
                          {u.group_role && (
                            <Badge variant={u.group_role === "owner" ? "secondary" : "outline"}>
                              {u.group_role}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                      {u.id}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(u)}
                          title="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(u)}
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
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

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {offset + 1}–{offset + (list.data?.length ?? 0)}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={(list.data?.length ?? 0) < limit}
            onClick={() => setOffset(offset + limit)}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input type="email" {...form.register("email")} />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" {...form.register("password")} />
            </div>
            <div>
              <Label>Full name</Label>
              <Input {...form.register("full_name")} />
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!form.watch("is_superuser")}
                  onCheckedChange={(v) => form.setValue("is_superuser", v)}
                />
                <Label>Admin</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!form.watch("is_verified")}
                  onCheckedChange={(v) => form.setValue("is_verified", v)}
                />
                <Label>Verified</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit User Dialog ─────────────────────────────────── */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input type="email" {...editForm.register("email")} />
            </div>
            <div>
              <Label>Full name</Label>
              <Input {...editForm.register("full_name")} />
            </div>
            <div>
              <Label>New password (leave blank to keep)</Label>
              <Input type="password" {...editForm.register("password")} />
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!editForm.watch("is_active")}
                  onCheckedChange={(v) => editForm.setValue("is_active", v)}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!editForm.watch("is_superuser")}
                  onCheckedChange={(v) => editForm.setValue("is_superuser", v)}
                />
                <Label>Admin</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!editForm.watch("is_verified")}
                  onCheckedChange={(v) => editForm.setValue("is_verified", v)}
                />
                <Label>Verified</Label>
              </div>
            </div>
            <div>
              <Label>Group</Label>
              <Select
                value={
                  editForm.watch("remove_from_group")
                    ? "__none__"
                    : (editForm.watch("group_id")?.toString() ?? "__none__")
                }
                onValueChange={(val) => {
                  if (val === "__none__") {
                    editForm.setValue("group_id", null);
                    editForm.setValue("group_role", null);
                    editForm.setValue("remove_from_group", true);
                  } else {
                    editForm.setValue("group_id", Number(val));
                    editForm.setValue("remove_from_group", false);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (remove from group)</SelectItem>
                  {(groups.data ?? []).map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editForm.watch("remove_from_group") && editForm.watch("group_id") && (
              <div>
                <Label>Group role</Label>
                <Select
                  value={editForm.watch("group_role") ?? "member"}
                  onValueChange={(val) =>
                    editForm.setValue("group_role", val as "owner" | "member")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={update.isPending}>
                {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.email}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onDelete}
              disabled={remove.isPending}
            >
              {remove.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UserInline({ user }: { user: AdminUserRead }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-medium">{user.email}</span>
      <span className="text-muted-foreground">{user.full_name}</span>
      {user.is_superuser && <Badge>Admin</Badge>}
      {user.is_verified ? <Badge variant="secondary">Verified</Badge> : <Badge variant="outline">Unverified</Badge>}
      {user.group_name && (
        <>
          <Badge variant="outline">{user.group_name}</Badge>
          {user.group_role && (
            <Badge variant={user.group_role === "owner" ? "default" : "secondary"}>{user.group_role}</Badge>
          )}
        </>
      )}
      <span className="font-mono text-xs text-muted-foreground">{user.id}</span>
    </div>
  );
}

void format;
void parseISO;
