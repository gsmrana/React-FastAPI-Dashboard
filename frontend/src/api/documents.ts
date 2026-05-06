import { apiClient, API_BASE } from './client';
import type { Document } from '@/types';

export const documentsApi = {
  list: async (): Promise<Document[]> => {
    const { data } = await apiClient.get<Document[]>('/documents');
    return data;
  },
  upload: async (files: File[], onProgress?: (pct: number) => void) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    const { data } = await apiClient.post('/documents/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    });
    return data;
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
