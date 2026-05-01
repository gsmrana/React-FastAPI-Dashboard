import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreateLlm, LlmConfig, UpdateLlm } from "@/types/api";

const KEY = ["llm-configs"] as const;

export function useLlmConfigs(opts?: { is_active?: boolean; include_deleted?: boolean }) {
  return useQuery({
    queryKey: [...KEY, opts ?? {}],
    queryFn: async () => {
      const { data } = await api.get<LlmConfig[]>("/llm-configs", { params: opts });
      return data;
    },
  });
}

export function useCachedLlmConfigs(force = false) {
  return useQuery({
    queryKey: [...KEY, "cached", force],
    queryFn: async () => {
      const { data } = await api.get<LlmConfig[]>("/llm-configs/cached", {
        params: { force_refresh: force },
      });
      return data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useCreateLlm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateLlm) => {
      const { data } = await api.post<LlmConfig>("/llm-configs", body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateLlm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: UpdateLlm }) => {
      const { data } = await api.patch<LlmConfig>(`/llm-configs/${id}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteLlm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, hard }: { id: number; hard?: boolean }) => {
      await api.delete(`/llm-configs/${id}`, { params: { hard_delete: hard } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
