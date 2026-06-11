import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/auth-store";
import { useMyGroup } from "@/api/groups";

interface GroupSelectProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}

/**
 * Renders a group-selector when the logged-in user belongs to a group.
 * Options: "Personal (No Group)" → null, or the user's group name → group_id.
 * Returns null when the user has no group (nothing to choose from).
 */
export function GroupSelect({ value, onChange, disabled }: GroupSelectProps) {
  const user = useAuthStore((s) => s.user);
  const { data: group } = useMyGroup();

  if (!user?.group_id) return null;

  const selectValue = value === null || value === undefined ? "personal" : String(value);

  function handleChange(raw: string) {
    onChange(raw === "personal" ? null : Number(raw));
  }

  return (
    <Select value={selectValue} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select group…" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="personal">Personal (No Group)</SelectItem>
        <SelectItem value={String(user.group_id)}>
          {group?.name ?? `Group #${user.group_id}`}
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
