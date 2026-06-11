import { MenuItem, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { groupsApi } from '@/api/groups';

interface GroupFieldProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}

/**
 * Renders an MUI select for group assignment when the logged-in user belongs to a group.
 * Options: "Private (No Group)" → null, or the user's group name → group_id.
 * Returns null when the user has no group (nothing to choose from).
 */
export default function GroupField({ value, onChange, disabled }: GroupFieldProps) {
  const { user } = useAuth();
  const groupQuery = useQuery({
    queryKey: ['groups', 'me'],
    queryFn: () => groupsApi.getMyGroup(),
    enabled: !!user?.group_id,
    retry: false,
  });

  if (!user?.group_id) return null;

  const selectValue = value === null || value === undefined ? 'private' : String(value);

  function handleChange(raw: string) {
    onChange(raw === 'private' ? null : Number(raw));
  }

  return (
    <TextField
      select
      label="Group"
      value={selectValue}
      onChange={(e) => handleChange(e.target.value)}
      disabled={disabled}
      fullWidth
      size="small"
    >
      <MenuItem value="private">Private (No Group)</MenuItem>
      <MenuItem value={String(user.group_id)}>
        {groupQuery.data?.name ?? `Group #${user.group_id}`}
      </MenuItem>
    </TextField>
  );
}
