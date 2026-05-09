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
      onProgress,
    }: {
      files: File[];
      onProgress?: (pct: number) => void;
    }) => {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      const { data } = await api.post("/documents/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (evt.total && onProgress) onProgress(Math.round((evt.loaded * 100) / evt.total));
        },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRenameDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: { filename: string; new_filename: string }) => {
      const { data } = await api.patch("/documents", vals);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (filename: string) => {
      await api.delete("/documents", { data: { filename } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function thumbnailUrl(filename: string, width = 240, height = 240) {
  return `${API_BASE}/documents/thumbnail/${encodeURIComponent(filename)}?width=${width}&height=${height}`;
}
export function viewUrl(filename: string) {
  return `${API_BASE}/documents/view/${encodeURIComponent(filename)}`;
}
export function downloadUrl(filename: string) {
  return `${API_BASE}/documents/download/${encodeURIComponent(filename)}`;
}
