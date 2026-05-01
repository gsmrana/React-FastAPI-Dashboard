import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLogout, useUpdateMe } from "@/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { profileUpdateSchema, type ProfileUpdateValues } from "@/lib/schemas";
import { toastError } from "@/lib/api";
import { initials } from "@/lib/utils";

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const update = useUpdateMe();
  const logout = useLogout();
  const navigate = useNavigate();

  const form = useForm<ProfileUpdateValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { email: user?.email, full_name: user?.full_name || "", password: "" },
  });

  const onSubmit = async (vals: ProfileUpdateValues) => {
    const payload: Record<string, string> = {};
    if (vals.email && vals.email !== user?.email) payload.email = vals.email;
    if (vals.full_name && vals.full_name !== (user?.full_name || "")) payload.full_name = vals.full_name;
    if (vals.password) payload.password = vals.password;
    if (Object.keys(payload).length === 0) {
      toast.info("Nothing to update");
      return;
    }
    try {
      await update.mutateAsync(payload);
      toast.success("Profile updated");
      form.setValue("password", "");
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl">
              {initials(user?.full_name || user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold truncate">{user?.full_name || "User"}</h2>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {user?.is_superuser && <Badge>Admin</Badge>}
              {user?.is_verified ? (
                <Badge variant="secondary">Verified</Badge>
              ) : (
                <Badge variant="outline">Not verified</Badge>
              )}
              {user?.is_active && <Badge variant="secondary">Active</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="danger">Danger</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account settings</CardTitle>
              <CardDescription>Update your profile information.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                <div>
                  <Label>Email</Label>
                  <Input type="email" {...form.register("email")} />
                </div>
                <div>
                  <Label>Full name</Label>
                  <Input {...form.register("full_name")} />
                </div>
                <div>
                  <Label>New password (leave blank to keep current)</Label>
                  <Input type="password" {...form.register("password")} />
                </div>
                <Button type="submit" disabled={update.isPending}>
                  {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card>
            <CardHeader>
              <CardTitle>Sign out</CardTitle>
              <CardDescription>Sign out of your account on this device.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={async () => {
                  await logout.mutateAsync();
                  navigate("/login");
                }}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
