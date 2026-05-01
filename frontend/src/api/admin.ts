import { apiClient } from './client';
import type { User } from '@/types';

export const adminApi = {
  sysinfo: async () => (await apiClient.get('/api/v1/admin/sysinfo')).data,
  appconfig: async () => (await apiClient.get('/api/v1/admin/appconfig')).data,
  applogView: async () => (await apiClient.get('/api/v1/admin/applog/view')).data,
  applogDownloadUrl: () => '/api/v1/admin/applog/download',

  listUsers: async (params?: { offset?: number; limit?: number }) => {
    const { data } = await apiClient.get<User[]>('/api/v1/admin/users', { params });
    return data;
  },
  createUser: async (payload: {
    email: string;
    password: string;
    full_name?: string;
    is_active?: boolean;
    is_superuser?: boolean;
    is_verified?: boolean;
  }) => (await apiClient.post<User>('/api/v1/admin/users', payload)).data,

  userByEmail: async (email: string) => {
    const { data } = await apiClient.post<User>(
      `/api/v1/admin/user-by-email`,
      undefined,
      { params: { email } }
    );
    return data;
  },
};
