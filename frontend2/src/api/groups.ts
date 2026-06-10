import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Group, CreateGroup, UpdateGroup, GroupInvite } from "@/types/api";

const KEY = ["groups"] as const;
const MY_GROUP_KEY = [...KEY, "me"] as const;

export function useMyGroup() {
  return useQuery({
    queryKey: MY_GROUP_KEY,
    queryFn: async () => {
      const { data } = await api.get<Group>("/groups/me");
      return data;
    },
    retry: false,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateGroup) => {
      const { data } = await api.post<Group>("/groups", body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_GROUP_KEY });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: UpdateGroup }) => {
      const { data } = await api.put<Group>(`/groups/${id}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: MY_GROUP_KEY }),
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/groups/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_GROUP_KEY });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, body }: { groupId: number; body: GroupInvite }) => {
      const { data } = await api.post<Group>(`/groups/${groupId}/invite`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: MY_GROUP_KEY }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, memberId }: { groupId: number; memberId: string }) => {
      const { data } = await api.delete<Group>(`/groups/${groupId}/members/${memberId}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: MY_GROUP_KEY }),
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post("/groups/leave");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_GROUP_KEY });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
