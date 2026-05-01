import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreateService, Service, UpdateService } from "@/types/api";

const KEY = ["services"] as const;

export function useServices(opts?: { include_deleted?: boolean }) {
  return useQuery({
    queryKey: [...KEY, opts ?? {}],
    queryFn: async () => {
      const { data } = await api.get<Service[]>("/services", { params: opts });
      return data;
    },
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateService) => {
      const { data } = await api.post<Service>("/services", body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: UpdateService }) => {
      const { data } = await api.patch<Service>(`/services/${id}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, hard }: { id: number; hard?: boolean }) => {
      await api.delete(`/services/${id}`, { params: { hard_delete: hard } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
