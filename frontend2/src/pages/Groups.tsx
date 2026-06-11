import { useState } from "react";
import { Loader2, Users, Plus, Trash2, LogOut, UserMinus, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { toastError } from "@/lib/api";
import { initials } from "@/lib/utils";
import {
  useMyGroup,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useInviteMember,
  useRemoveMember,
  useLeaveGroup,
} from "@/api/groups";
import type { Group } from "@/types/api";

// ─── No-group state ───────────────────────────────────────────────────────────
function CreateGroupPanel() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const create = useCreateGroup();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }
    try {
      await create.mutateAsync({ name: name.trim(), description: description.trim() || undefined });
      toast.success("Group created");
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <Card className="max-w-lg mx-auto mt-12">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" /> Create a Group
        </CardTitle>
        <CardDescription>
          Start a team workspace. Members you invite will share access to all your resources.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Group name *</Label>
          <Input
            placeholder="My Team"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Input
            placeholder="Optional description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Button className="w-full" onClick={handleCreate} disabled={create.isPending}>
          {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Create group
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Group header (name + edit) ───────────────────────────────────────────────
function GroupHeader({ group, isOwner }: { group: Group; isOwner: boolean }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const update = useUpdateGroup();
  const deleteGroup = useDeleteGroup();
  const leaveGroup = useLeaveGroup();

  const saveEdit = async () => {
    try {
      await update.mutateAsync({ id: group.id, body: { name: name.trim(), description: description.trim() || undefined } });
      toast.success("Group updated");
      setEditing(false);
    } catch (e) {
      toastError(e);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this group? All members will lose group membership.")) return;
    try {
      await deleteGroup.mutateAsync(group.id);
      toast.success("Group deleted");
    } catch (e) {
      toastError(e);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm("Leave this group?")) return;
    try {
      await leaveGroup.mutateAsync();
      toast.success("You have left the group");
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        {editing ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Group name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit} disabled={update.isPending}>
                {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span className="ml-1">Save</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{group.name}</h2>
                <Badge variant="secondary">Group #{group.id}</Badge>
              </div>
              {group.description && (
                <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Created {new Date(group.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {isOwner ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleteGroup.isPending}>
                    {deleteGroup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                    Delete
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={handleLeave} disabled={leaveGroup.isPending}>
                  {leaveGroup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4 mr-1" />}
                  Leave
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Members list + invite ────────────────────────────────────────────────────
function MembersPanel({ group, isOwner }: { group: Group; isOwner: boolean }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const invite = useInviteMember();
  const removeMember = useRemoveMember();
  const currentUser = useAuthStore((s) => s.user);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Enter an email address");
      return;
    }
    try {
      await invite.mutateAsync({ groupId: group.id, body: { email: inviteEmail.trim() } });
      toast.success("Member invited");
      setInviteEmail("");
    } catch (e) {
      toastError(e);
    }
  };

  const handleRemove = async (memberId: string, memberEmail: string) => {
    if (!window.confirm(`Remove ${memberEmail} from the group?`)) return;
    try {
      await removeMember.mutateAsync({ groupId: group.id, memberId });
      toast.success("Member removed");
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Members ({group.members.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {group.members.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-sm">
                {initials(member.full_name || member.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {member.full_name || member.email}
                {member.id === currentUser?.id && (
                  <span className="text-muted-foreground font-normal"> (you)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
            </div>
            <Badge variant={member.group_role === "owner" ? "default" : "secondary"}>
              {member.group_role ?? "member"}
            </Badge>
            {isOwner && member.group_role !== "owner" && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleRemove(member.id, member.email)}
                disabled={removeMember.isPending}
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {isOwner && (
          <>
            <Separator />
            <div className="space-y-1.5">
              <Label>Invite by email</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                />
                <Button onClick={handleInvite} disabled={invite.isPending}>
                  {invite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Groups() {
  const currentUser = useAuthStore((s) => s.user);
  const { data: group, isLoading, error } = useMyGroup();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 400 = "not a member of any group"
  const hasNoGroup = !group || (error as any)?.response?.status === 400 || (error as any)?.response?.status === 404;

  if (hasNoGroup) {
    return <CreateGroupPanel />;
  }

  const isOwner = currentUser?.group_role === "owner";

  return (
    <div className="max-w-2xl space-y-4">
      {/* <h1 className="text-2xl font-semibold">Group</h1> */}
      <GroupHeader group={group} isOwner={isOwner} />
      <MembersPanel group={group} isOwner={isOwner} />
    </div>
  );
}
