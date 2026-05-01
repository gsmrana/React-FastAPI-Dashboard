import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { useAdminUsers, useCreateAdminUser, useFindUserByEmail } from "@/api/admin";
import { toastError } from "@/lib/api";
import type { UserRead } from "@/types/api";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().optional(),
  is_superuser: z.boolean().optional(),
  is_verified: z.boolean().optional(),
});
type CreateValues = z.infer<typeof createSchema>;

export default function Users() {
  const [offset, setOffset] = useState(0);
  const limit = 25;
  const list = useAdminUsers({ offset, limit });
  const create = useCreateAdminUser();
  const find = useFindUserByEmail();
  const [open, setOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [found, setFound] = useState<UserRead | null>(null);

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { is_superuser: false, is_verified: true },
  });

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
                  <TableHead className="hidden lg:table-cell">ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(list.data ?? []).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{u.full_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.is_superuser && <Badge>Admin</Badge>}
                        {u.is_verified ? (
                          <Badge variant="secondary">Verified</Badge>
                        ) : (
                          <Badge variant="outline">Unverified</Badge>
                        )}
                        {!u.is_active && <Badge variant="destructive">Inactive</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                      {u.id}
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
    </div>
  );
}

function UserInline({ user }: { user: UserRead }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-medium">{user.email}</span>
      <span className="text-muted-foreground">{user.full_name}</span>
      {user.is_superuser && <Badge>Admin</Badge>}
      {user.is_verified ? <Badge variant="secondary">Verified</Badge> : <Badge variant="outline">Unverified</Badge>}
      <span className="font-mono text-xs text-muted-foreground">{user.id}</span>
    </div>
  );
}

void format;
void parseISO;
