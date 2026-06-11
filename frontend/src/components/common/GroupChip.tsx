import Chip from '@mui/material/Chip';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { groupsApi } from '@/api/groups';

interface GroupChipProps {
  groupId?: number | null;
  size?: 'small' | 'medium';
}

/**
 * Shows a small MUI Chip with the group name or "Personal".
 * Only renders when the logged-in user belongs to a group.
 */
export default function GroupChip({ groupId, size = 'small' }: GroupChipProps) {
  const { user } = useAuth();
  const groupQuery = useQuery({
    queryKey: ['groups', 'me'],
    queryFn: () => groupsApi.getMyGroup(),
    enabled: !!user?.group_id,
    retry: false,
  });

  if (!user?.group_id) return null;

  if (groupId) {
    return (
      <Chip
        size={size}
        label={groupQuery.data?.name ?? `Group #${groupId}`}
        color="primary"
        variant="outlined"
      />
    );
  }

  return (
    <Chip
      size={size}
      label="Personal"
      variant="outlined"
      sx={{ color: 'text.secondary', borderColor: 'divider' }}
    />
  );
}
