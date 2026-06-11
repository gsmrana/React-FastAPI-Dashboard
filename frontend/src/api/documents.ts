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
  update: async (
    id: number,
    body: {
      filename?: string;
      category?: number;
      is_starred?: number;
      tags?: string;
      description?: string;
      group_id?: number | null;
    },
  ) => {
    const { data } = await apiClient.patch<Document>(`/documents/${id}`, body);
    return data;
  },
  remove: async (id: number) => {
    return apiClient.delete(`/documents/${id}`);
  },
  thumbnailUrl: (id: number, width = 240, height = 240) =>
    `${API_BASE}/documents/thumbnail/${id}?width=${width}&height=${height}`,
  viewUrl: (id: number) =>
    `${API_BASE}/documents/view/${id}`,
  downloadUrl: (id: number) =>
    `${API_BASE}/documents/download/${id}`,
};
