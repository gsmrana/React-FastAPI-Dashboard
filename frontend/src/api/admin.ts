import { apiClient } from './client';
import type { User, AdminUser, AdminUserUpdate, GroupSummary } from '@/types';

export const adminApi = {
  sysinfo: async () => (await apiClient.get('/admin/sysinfo')).data,
  appconfig: async () => (await apiClient.get('/admin/appconfig')).data,
  applogView: async () => (await apiClient.get('/admin/applog/view')).data,
  applogDownloadUrl: () => '/admin/applog/download',

  listUsers: async (params?: { offset?: number; limit?: number }) => {
    const { data } = await apiClient.get<AdminUser[]>('/admin/users', { params });
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

  updateUser: async (id: string, payload: AdminUserUpdate) =>
    (await apiClient.patch<AdminUser>(`/admin/users/${id}`, payload)).data,

  deleteUser: async (id: string) =>
    apiClient.delete(`/admin/users/${id}`),

  listGroups: async () => {
    const { data } = await apiClient.get<GroupSummary[]>('/admin/groups');
    return data;
  },

  userByEmail: async (email: string) => {
    const { data } = await apiClient.post<AdminUser>(
      `/admin/user-by-email`,
      undefined,
      { params: { email } }
    );
    return data;
  },
};
