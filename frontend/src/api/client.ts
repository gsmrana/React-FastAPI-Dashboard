import axios from 'axios';

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Nexus Hub';
export const APP_VERSION = '1.0.0';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';
export const API_BASE = API_BASE_URL + API_PREFIX;

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track 401 redirects so we don't loop
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  unauthorizedHandler = fn;
}

apiClient.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url || '';
    if (status === 401 && !url.includes('/auth/jwt/login') && !url.includes('/users/me')) {
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

export function extractError(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { detail?: string | { msg?: string }[] | { reason?: string } }
      | undefined;
    if (typeof data?.detail === 'string') return data.detail;
    if (Array.isArray(data?.detail)) {
      return data.detail.map((d) => (typeof d === 'string' ? d : d.msg || '')).join(', ');
    }
    if (data?.detail && typeof data.detail === 'object' && 'reason' in data.detail) {
      return String(data.detail.reason);
    }
    return err.message || fallback;
  }
  return fallback;
}
