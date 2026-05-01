import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/lib/api";
import type { ChatRequest, ChatResponse, HistoryResponse, SessionsResponse } from "@/types/api";

const KEY = ["chat"] as const;

export function useMySessions() {
  return useQuery({
    queryKey: [...KEY, "sessions", "me"],
    queryFn: async () => {
      const { data } = await api.get<SessionsResponse>("/chat/sessions/me");
      return data;
    },
  });
}

export function useChatHistory(sessionId?: string) {
  return useQuery({
    queryKey: [...KEY, "history", sessionId],
    queryFn: async () => {
      const { data } = await api.get<HistoryResponse>(`/chat/history/${sessionId}`);
      return data;
    },
    enabled: !!sessionId,
  });
}

export function useNewSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.get<SessionsResponse>("/chat/sessions/new");
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, "sessions"] }),
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/chat/sessions/${sessionId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, "sessions"] }),
  });
}

export function useDeleteAllSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete("/chat/sessions");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, "sessions"] }),
  });
}

export function useChatSimple() {
  return useMutation({
    mutationFn: async (req: ChatRequest) => {
      const { data } = await api.post<ChatResponse>("/chat/simple", req);
      return data;
    },
  });
}

export function useAskSimple() {
  return useMutation({
    mutationFn: async (req: ChatRequest) => {
      const { data } = await api.post<ChatResponse>("/ask/simple", req);
      return data;
    },
  });
}

/** Streaming chat: yields token chunks as they arrive. */
export async function streamChat(
  req: ChatRequest,
  onToken: (chunk: string) => void,
  signal?: AbortSignal,
) {
  const res = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`Chat stream failed: ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) onToken(decoder.decode(value, { stream: true }));
  }
}
