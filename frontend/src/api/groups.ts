import { apiClient } from './client';
import type { Group, CreateGroup, UpdateGroup, GroupInvite } from '@/types';

export const groupsApi = {
  async getMyGroup(): Promise<Group> {
    const { data } = await apiClient.get<Group>('/groups/me');
    return data;
  },

  async createGroup(payload: CreateGroup): Promise<Group> {
    const { data } = await apiClient.post<Group>('/groups', payload);
    return data;
  },

  async updateGroup(id: number, payload: UpdateGroup): Promise<Group> {
    const { data } = await apiClient.put<Group>(`/groups/${id}`, payload);
    return data;
  },

  async deleteGroup(id: number): Promise<void> {
    await apiClient.delete(`/groups/${id}`);
  },

  async inviteMember(groupId: number, payload: GroupInvite): Promise<Group> {
    const { data } = await apiClient.post<Group>(`/groups/${groupId}/invite`, payload);
    return data;
  },

  async removeMember(groupId: number, memberId: string): Promise<Group> {
    const { data } = await apiClient.delete<Group>(`/groups/${groupId}/members/${memberId}`);
    return data;
  },

  async leaveGroup(): Promise<void> {
    await apiClient.post('/groups/leave');
  },
};
