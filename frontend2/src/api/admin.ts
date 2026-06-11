import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE } from "@/lib/api";
import type { AppConfig, SysInfo, UserRead, AdminUserRead } from "@/types/api";

export function useSysInfo() {
  return useQuery({
    queryKey: ["admin", "sysinfo"],
    queryFn: async () => {
      const { data } = await api.get<SysInfo>("/admin/sysinfo");
      return data;
    },
    refetchInterval: 10_000,
  });
}

export function useAppConfig() {
  return useQuery({
    queryKey: ["admin", "appconfig"],
    queryFn: async () => {
      const { data } = await api.get<AppConfig>("/admin/appconfig");
      return data;
    },
  });
}

export function useAppLog(autoRefresh = false) {
  return useQuery({
    queryKey: ["admin", "applog"],
    queryFn: async () => {
      const { data } = await api.get<string>("/admin/applog/view", { responseType: "text" });
      return data;
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });
}

export function appLogDownloadUrl() {
  return `${API_BASE}/admin/applog/download`;
}

export function useAdminUsers(params?: { offset?: number; limit?: number }) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: async () => {
      const { data } = await api.get<AdminUserRead[]>("/admin/users", { params });
      return data;
    },
  });
}

export function useFindUserByEmail() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post<AdminUserRead>(
        `/admin/user-by-email`,
        null,
        { params: { email } },
      );
      return data;
    },
  });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      email: string;
      password: string;
      full_name?: string;
      is_superuser?: boolean;
      is_verified?: boolean;
    }) => {
      const { data } = await api.post<UserRead>("/admin/users", body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminGroups() {
  return useQuery({
    queryKey: ["admin", "groups"],
    queryFn: async () => {
      const { data } = await api.get<import("@/types/api").GroupSummary[]>("/admin/groups");
      return data;
    },
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        email?: string;
        password?: string;
        full_name?: string;
        is_active?: boolean;
        is_superuser?: boolean;
        is_verified?: boolean;
        group_id?: number | null;
        group_role?: "owner" | "member" | null;
        remove_from_group?: boolean;
      };
    }) => {
      const { data } = await api.patch<AdminUserRead>(`/admin/users/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useDeleteAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}
