import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { useMyGroup } from "@/api/groups";

interface GroupBadgeProps {
  groupId?: number | null;
}

/**
 * Displays a small badge showing "Group: {name}" or "Private" next to list items.
 * Only renders when the logged-in user belongs to a group (otherwise everything is
 * private and the label would be redundant).
 */
export function GroupBadge({ groupId }: GroupBadgeProps) {
  const user = useAuthStore((s) => s.user);
  const { data: group } = useMyGroup();

  // Only show when the user is in a group — otherwise the distinction is meaningless
  if (!user?.group_id) return null;

  if (groupId) {
    return (
      <Badge variant="secondary" className="text-xs font-normal shrink-0">
        {group?.name ?? `Group #${groupId}`}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs font-normal shrink-0 text-muted-foreground">
      Private
    </Badge>
  );
}
