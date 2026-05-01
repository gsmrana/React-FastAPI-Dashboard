import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreateExpense, Expense, UpdateExpense } from "@/types/api";

const KEY = ["expenses"] as const;

export function useExpenses(opts?: {
  from_date?: string;
  to_date?: string;
  include_deleted?: boolean;
}) {
  return useQuery({
    queryKey: [...KEY, opts ?? {}],
    queryFn: async () => {
      const { data } = await api.get<Expense[]>("/expenses", { params: opts });
      return data;
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateExpense) => {
      const { data } = await api.post<Expense>("/expenses", body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: UpdateExpense }) => {
      const { data } = await api.patch<Expense>(`/expenses/${id}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, hard }: { id: number; hard?: boolean }) => {
      await api.delete(`/expenses/${id}`, { params: { hard_delete: hard } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
