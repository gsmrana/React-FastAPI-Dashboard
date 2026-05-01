import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/lib/api";
import type { AppConfig, SysInfo, UserRead } from "@/types/api";

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
  return `${API_BASE_URL}/admin/applog/download`;
}

export function useAdminUsers(params?: { offset?: number; limit?: number }) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: async () => {
      const { data } = await api.get<UserRead[]>("/admin/users", { params });
      return data;
    },
  });
}

export function useFindUserByEmail() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post<UserRead>(
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
