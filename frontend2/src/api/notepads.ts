import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreateNote, Note, UpdateNote } from "@/types/api";

const KEY = ["notepads"] as const;

export function useNotes(opts?: { include_deleted?: boolean }) {
  return useQuery({
    queryKey: [...KEY, opts ?? {}],
    queryFn: async () => {
      const { data } = await api.get<Note[]>("/notepads", { params: opts });
      return data;
    },
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateNote) => {
      const { data } = await api.post<Note>("/notepads", body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: UpdateNote }) => {
      const { data } = await api.patch<Note>(`/notepads/${id}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, hard }: { id: number; hard?: boolean }) => {
      await api.delete(`/notepads/${id}`, { params: { hard_delete: hard } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
