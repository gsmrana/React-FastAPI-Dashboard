import axios, { AxiosError } from "axios";
import { toast } from "sonner";

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Nexus Hub';
export const APP_VERSION = '1.0.0';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';
export const API_BASE = API_BASE_URL + API_PREFIX;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    if (
      status === 401 &&
      !url.includes("/auth/jwt/login") &&
      !url.includes("/users/me")
    ) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export function extractError(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { detail?: unknown } | undefined;
    const detail = data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length) {
      const first = detail[0] as { msg?: string; loc?: unknown[] };
      const loc = Array.isArray(first.loc) ? first.loc.slice(-1)[0] : "";
      return `${loc ? `${loc}: ` : ""}${first.msg ?? fallback}`;
    }
    if (detail && typeof detail === "object") {
      return JSON.stringify(detail);
    }
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function toastError(err: unknown, fallback?: string) {
  toast.error(extractError(err, fallback));
}
