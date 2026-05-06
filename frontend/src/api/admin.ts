import { apiClient } from './client';
import type { User } from '@/types';

export const adminApi = {
  sysinfo: async () => (await apiClient.get('/admin/sysinfo')).data,
  appconfig: async () => (await apiClient.get('/admin/appconfig')).data,
  applogView: async () => (await apiClient.get('/admin/applog/view')).data,
  applogDownloadUrl: () => '/admin/applog/download',

  listUsers: async (params?: { offset?: number; limit?: number }) => {
    const { data } = await apiClient.get<User[]>('/admin/users', { params });
    return data;
  },
  createUser: async (payload: {
    email: string;
    password: string;
    full_name?: string;
    is_active?: boolean;
    is_superuser?: boolean;
    is_verified?: boolean;
  }) => (await apiClient.post<User>('/admin/users', payload)).data,

  userByEmail: async (email: string) => {
    const { data } = await apiClient.post<User>(
      `/admin/user-by-email`,
      undefined,
      { params: { email } }
    );
    return data;
  },
};
