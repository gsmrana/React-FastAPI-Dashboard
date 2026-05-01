import { apiClient, API_BASE } from './client';
import type { ChatHistory, ChatRequest, ChatResponse } from '@/types';

export const chatbotApi = {
  ask: async (payload: ChatRequest): Promise<ChatResponse> => {
    const { data } = await apiClient.post<ChatResponse>('/api/v1/ask/simple', payload);
    return data;
  },
  chat: async (payload: ChatRequest): Promise<ChatResponse> => {
    const { data } = await apiClient.post<ChatResponse>('/api/v1/chat/simple', payload);
    return data;
  },
  history: async (session_id: string): Promise<ChatHistory> => {
    const { data } = await apiClient.get<ChatHistory>(
      `/api/v1/chat/history/${encodeURIComponent(session_id)}`
    );
    return data;
  },
  sessions: async (): Promise<string[]> => {
    const { data } = await apiClient.get<string[] | { sessions: string[] }>(
      '/api/v1/chat/sessions'
    );
    return Array.isArray(data) ? data : data.sessions ?? [];
  },

  /**
   * Stream a chat response. Calls onChunk for each text chunk, returns the full text.
   * Uses fetch (not axios) so we can read body incrementally.
   */
  async stream(
    payload: ChatRequest,
    opts: {
      persistent?: boolean;
      signal?: AbortSignal;
      onChunk: (chunk: string) => void;
    }
  ): Promise<string> {
    const path = opts.persistent ? '/api/v1/chat/stream' : '/api/v1/ask/stream';
    const url = `${API_BASE}${path}?event_stream=true`;
    const resp = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(payload),
      signal: opts.signal,
    });
    if (!resp.ok || !resp.body) {
      throw new Error(`Stream failed: ${resp.status} ${resp.statusText}`);
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // SSE: chunks separated by \n\n; lines starting with "data: "
        let idx;
        while ((idx = buffer.indexOf('\n\n')) >= 0) {
          const event = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          for (const line of event.split('\n')) {
            if (line.startsWith('data:')) {
              const data = line.slice(5).trimStart();
              if (data === '[DONE]') continue;
              fullText += data;
              opts.onChunk(data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    return fullText;
  },
};
