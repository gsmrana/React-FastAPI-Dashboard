import { apiClient } from './client';
import type { User } from '@/types';

export interface LoginCredentials {
  username: string; // backend uses email as username
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name?: string;
}

export const authApi = {
  async me(): Promise<User> {
    const { data } = await apiClient.get<User>('/api/v1/users/me');
    return data;
  },

  async login(creds: LoginCredentials): Promise<void> {
    const form = new URLSearchParams();
    form.set('username', creds.username);
    form.set('password', creds.password);
    await apiClient.post('/api/v1/auth/jwt/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },

  async logout(): Promise<void> {
    await apiClient.post('/api/v1/auth/jwt/logout');
  },

  async register(payload: RegisterPayload): Promise<User> {
    const { data } = await apiClient.post<User>('/api/v1/auth/register', payload);
    return data;
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/api/v1/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/api/v1/auth/reset-password', { token, password });
  },

  async requestVerifyToken(email: string): Promise<void> {
    await apiClient.post('/api/v1/auth/request-verify-token', { email });
  },

  async verify(token: string): Promise<User> {
    const { data } = await apiClient.post<User>('/api/v1/auth/verify', { token });
    return data;
  },

  async updateMe(payload: Partial<User & { password: string }>): Promise<User> {
    const { data } = await apiClient.patch<User>('/api/v1/users/me', payload);
    return data;
  },
};
