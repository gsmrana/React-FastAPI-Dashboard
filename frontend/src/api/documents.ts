import { apiClient, API_BASE } from './client';
import type { Document } from '@/types';

export const documentsApi = {
  list: async (): Promise<Document[]> => {
    const { data } = await apiClient.get<Document[]>('/documents');
    return data;
  },
  upload: async (files: File[], group_id?: number | null, onProgress?: (pct: number) => void) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    const params: Record<string, unknown> = {};
    if (group_id !== undefined) params.group_id = group_id;
    const { data } = await apiClient.post('/documents/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params,
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    });
    return data;
  },
  updateGroup: async (id: number | string, group_id: number | null) => {
    const { data } = await apiClient.patch(`/documents/${id}/group`, { group_id });
    return data as Document;
  },
  rename: async (filename: string, new_filename: string) => {
    const { data } = await apiClient.patch('/documents', { filename, new_filename });
    return data;
  },
  remove: async (filename: string) => {
    return apiClient.delete('/documents', { data: { filename } });
  },
  thumbnailUrl: (filename: string, width = 160, height = 160) =>
    `${API_BASE}/documents/thumbnail/${encodeURIComponent(filename)}?width=${width}&height=${height}`,
  viewUrl: (filename: string) =>
    `${API_BASE}/documents/view/${encodeURIComponent(filename)}`,
  downloadUrl: (filename: string) =>
    `${API_BASE}/documents/download/${encodeURIComponent(filename)}`,
};
