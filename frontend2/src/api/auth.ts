import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRead } from "@/types/api";

export function useMe(enabled = true) {
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const { data } = await api.get<UserRead>("/users/me");
        setUser(data);
        return data;
      } catch (e) {
        clear();
        throw e;
      }
    },
    enabled,
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (vals: { email: string; password: string }) => {
      // fastapi-users expects form-urlencoded with username/password
      const body = new URLSearchParams();
      body.set("username", vals.email);
      body.set("password", vals.password);
      await api.post("/auth/jwt/login", body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const { data } = await api.get<UserRead>("/users/me");
      return data;
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: async () => {
      try {
        await api.post("/auth/jwt/logout");
      } catch {
        // ignore
      }
      clear();
      qc.clear();
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (vals: { email: string; password: string; full_name?: string }) => {
      const { data } = await api.post<UserRead>("/auth/register", vals);
      return data;
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (vals: { email: string }) => {
      await api.post("/auth/forgot-password", vals);
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (vals: { token: string; password: string }) => {
      await api.post("/auth/reset-password", vals);
    },
  });
}

export function useRequestVerify() {
  return useMutation({
    mutationFn: async (vals: { email: string }) => {
      await api.post("/auth/request-verify-token", vals);
    },
  });
}

export function useVerify() {
  return useMutation({
    mutationFn: async (vals: { token: string }) => {
      const { data } = await api.post<UserRead>("/auth/verify", vals);
      return data;
    },
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (vals: Partial<{ email: string; password: string; full_name: string }>) => {
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(vals)) if (v) payload[k] = v;
      const { data } = await api.patch<UserRead>("/users/me", payload);
      return data;
    },
    onSuccess: (data) => {
      setUser(data);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
