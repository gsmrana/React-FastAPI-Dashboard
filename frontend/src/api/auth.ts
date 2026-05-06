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
    const { data } = await apiClient.get<User>('/users/me');
    return data;
  },

  async login(creds: LoginCredentials): Promise<void> {
    const form = new URLSearchParams();
    form.set('username', creds.username);
    form.set('password', creds.password);
    await apiClient.post('/auth/jwt/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/jwt/logout');
  },

  async register(payload: RegisterPayload): Promise<User> {
    const { data } = await apiClient.post<User>('/auth/register', payload);
    return data;
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password });
  },

  async requestVerifyToken(email: string): Promise<void> {
    await apiClient.post('/auth/request-verify-token', { email });
  },

  async verify(token: string): Promise<User> {
    const { data } = await apiClient.post<User>('/auth/verify', { token });
    return data;
  },

  async updateMe(payload: Partial<User & { password: string }>): Promise<User> {
    const { data } = await apiClient.patch<User>('/users/me', payload);
    return data;
  },
};
