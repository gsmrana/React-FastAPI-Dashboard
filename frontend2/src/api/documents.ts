import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE } from "@/lib/api";
import type { Document } from "@/types/api";

const KEY = ["documents"] as const;

export function useDocuments() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Document[]>("/documents");
      return data;
    },
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      files,
      group_id,
      onProgress,
    }: {
      files: File[];
      group_id?: number | null;
      onProgress?: (pct: number) => void;
    }) => {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      const params: Record<string, unknown> = {};
      if (group_id !== undefined) params.group_id = group_id;
      const { data } = await api.post("/documents/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        params,
        onUploadProgress: (evt) => {
          if (evt.total && onProgress) onProgress(Math.round((evt.loaded * 100) / evt.total));
        },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: {
      id: number;
      filename?: string;
      category?: number;
      is_starred?: number;
      tags?: string;
      description?: string;
      group_id?: number | null;
    }) => {
      const { id, ...body } = vals;
      const { data } = await api.patch<Document>(`/documents/${id}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/documents/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function thumbnailUrl(id: number, width = 240, height = 240) {
  return `${API_BASE}/documents/thumbnail/${id}?width=${width}&height=${height}`;
}
export function viewUrl(id: number) {
  return `${API_BASE}/documents/view/${id}`;
}
export function downloadUrl(id: number) {
  return `${API_BASE}/documents/download/${id}`;
}
