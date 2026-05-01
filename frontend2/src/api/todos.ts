import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreateTodo, Todo, UpdateTodo } from "@/types/api";

const KEY = ["todos"] as const;

export function useTodos(opts?: { include_completed?: boolean; include_deleted?: boolean }) {
  return useQuery({
    queryKey: [...KEY, opts ?? {}],
    queryFn: async () => {
      const { data } = await api.get<Todo[]>("/todos", { params: opts });
      return data;
    },
  });
}

export function useTodo(id?: number) {
  return useQuery({
    queryKey: [...KEY, "detail", id],
    queryFn: async () => {
      const { data } = await api.get<Todo>(`/todos/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateTodo) => {
      const { data } = await api.post<Todo>("/todos", body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: UpdateTodo }) => {
      const { data } = await api.patch<Todo>(`/todos/${id}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, hard }: { id: number; hard?: boolean }) => {
      await api.delete(`/todos/${id}`, { params: { hard_delete: hard } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
