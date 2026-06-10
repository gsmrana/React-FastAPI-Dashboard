import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import GroupIcon from '@mui/icons-material/Group';
import { useSnackbar } from 'notistack';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/common/PageHeader';
import { groupsApi } from '@/api/groups';
import { extractError } from '@/api/client';
import type { Group } from '@/types';

function avatarInitials(name?: string, email?: string): string {
  const src = name || email || '?';
  return src
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function GroupsPage() {
  const { user, refresh } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // create-group form
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // edit group form
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // invite form
  const [inviteEmail, setInviteEmail] = useState('');

  const isOwner = user?.group_role === 'owner';

  const loadGroup = async () => {
    try {
      const g = await groupsApi.getMyGroup();
      setGroup(g);
    } catch {
      setGroup(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroup();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) {
      enqueueSnackbar('Group name is required', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const g = await groupsApi.createGroup({ name: newName.trim(), description: newDesc.trim() || undefined });
      setGroup(g);
      await refresh();
      enqueueSnackbar('Group created', { variant: 'success' });
    } catch (e) {
      enqueueSnackbar(extractError(e), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    setEditName(group?.name ?? '');
    setEditDesc(group?.description ?? '');
    setEditing(true);
  };

  const handleUpdate = async () => {
    if (!group) return;
    setSaving(true);
    try {
      const g = await groupsApi.updateGroup(group.id, { name: editName.trim(), description: editDesc.trim() || undefined });
      setGroup(g);
      setEditing(false);
      enqueueSnackbar('Group updated', { variant: 'success' });
    } catch (e) {
      enqueueSnackbar(extractError(e), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!group) return;
    if (!window.confirm('Delete this group? All members will lose group membership.')) return;
    setSaving(true);
    try {
      await groupsApi.deleteGroup(group.id);
      setGroup(null);
      await refresh();
      enqueueSnackbar('Group deleted', { variant: 'success' });
    } catch (e) {
      enqueueSnackbar(extractError(e), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave this group?')) return;
    setSaving(true);
    try {
      await groupsApi.leaveGroup();
      setGroup(null);
      await refresh();
      enqueueSnackbar('You have left the group', { variant: 'success' });
    } catch (e) {
      enqueueSnackbar(extractError(e), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!group || !inviteEmail.trim()) {
      enqueueSnackbar('Enter an email address', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const g = await groupsApi.inviteMember(group.id, { email: inviteEmail.trim() });
      setGroup(g);
      setInviteEmail('');
      enqueueSnackbar('Member invited', { variant: 'success' });
    } catch (e) {
      enqueueSnackbar(extractError(e), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (memberId: string, memberEmail: string) => {
    if (!group || !window.confirm(`Remove ${memberEmail} from the group?`)) return;
    setSaving(true);
    try {
      const g = await groupsApi.removeMember(group.id, memberId);
      setGroup(g);
      enqueueSnackbar('Member removed', { variant: 'success' });
    } catch (e) {
      enqueueSnackbar(extractError(e), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  // ── No group state ──────────────────────────────────────────────────────────
  if (!group) {
    return (
      <Box maxWidth={480} mx="auto" mt={6}>
        <PageHeader title="Group"/>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Create a Group</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Start a team workspace. Members you invite will share access to all your resources.
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Group name *"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                size="small"
                fullWidth
              />
              <TextField
                label="Description"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                size="small"
                fullWidth
              />
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                onClick={handleCreate}
                disabled={saving}
              >
                Create group
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // ── Has group state ─────────────────────────────────────────────────────────
  return (
    <Box maxWidth={640}>
      <PageHeader title="Group" />

      {/* Group header card */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          {editing ? (
            <Stack spacing={2}>
              <TextField
                label="Group name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                size="small"
                fullWidth
              />
              <TextField
                label="Description"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                size="small"
                fullWidth
              />
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
                  onClick={handleUpdate}
                  disabled={saving}
                >
                  Save
                </Button>
                <Button size="small" variant="outlined" startIcon={<CloseIcon />} onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
              <Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6">{group.name}</Typography>
                  <Chip label={`Group #${group.id}`} size="small" />
                </Box>
                {group.description && (
                  <Typography variant="body2" color="text.secondary">{group.description}</Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  Created {new Date(group.created_at).toLocaleDateString()}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexShrink={0}>
                {isOwner ? (
                  <>
                    <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={startEdit}>
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <DeleteIcon />}
                      onClick={handleDelete}
                      disabled={saving}
                    >
                      Delete
                    </Button>
                  </>
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <ExitToAppIcon />}
                    onClick={handleLeave}
                    disabled={saving}
                  >
                    Leave
                  </Button>
                )}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Members card */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>
            Members ({group.members.length})
          </Typography>
          <List disablePadding>
            {group.members.map((member, idx) => (
              <Box key={member.id}>
                <ListItem
                  disablePadding
                  sx={{ py: 0.5 }}
                  secondaryAction={
                    isOwner && member.group_role !== 'owner' ? (
                      <IconButton
                        edge="end"
                        size="small"
                        color="error"
                        onClick={() => handleRemove(member.id, member.email)}
                        disabled={saving}
                      >
                        <PersonRemoveIcon fontSize="small" />
                      </IconButton>
                    ) : null
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 36, height: 36, fontSize: 14 }}>
                      {avatarInitials(member.full_name, member.email)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>{member.full_name || member.email}</span>
                        {member.id === user?.id && (
                          <Typography variant="caption" color="text.secondary">(you)</Typography>
                        )}
                        <Chip
                          label={member.group_role ?? 'member'}
                          size="small"
                          color={member.group_role === 'owner' ? 'primary' : 'default'}
                        />
                      </Box>
                    }
                    secondary={member.email}
                  />
                </ListItem>
                {idx < group.members.length - 1 && <Divider component="li" />}
              </Box>
            ))}
          </List>

          {isOwner && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" mb={1}>Invite by email</Typography>
              <Stack direction="row" spacing={1}>
                <TextField
                  placeholder="user@example.com"
                  size="small"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={handleInvite}
                  disabled={saving}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  {saving ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
                </Button>
              </Stack>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
