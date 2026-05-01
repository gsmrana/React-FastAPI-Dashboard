import { apiClient } from './client';
import type {
  Todo,
  CreateTodo,
  UpdateTodo,
  Expense,
  CreateExpense,
  UpdateExpense,
  Note,
  CreateNote,
  UpdateNote,
  Service,
  CreateService,
  UpdateService,
  LLMConfig,
  CreateLLMConfig,
  UpdateLLMConfig,
} from '@/types';

// ----- Todos -----
export const todosApi = {
  list: async (params?: { include_completed?: boolean; include_deleted?: boolean }) => {
    const { data } = await apiClient.get<Todo[]>('/api/v1/todos', { params });
    return data;
  },
  get: async (id: number) => (await apiClient.get<Todo>(`/api/v1/todos/${id}`)).data,
  create: async (payload: CreateTodo) =>
    (await apiClient.post<Todo>('/api/v1/todos', payload)).data,
  update: async (id: number, payload: UpdateTodo) =>
    (await apiClient.patch<Todo>(`/api/v1/todos/${id}`, payload)).data,
  remove: async (id: number, hard = false) =>
    apiClient.delete(`/api/v1/todos/${id}`, { params: { hard_delete: hard } }),
};

// ----- Expenses -----
export const expensesApi = {
  list: async (params?: { from_date?: string; to_date?: string; include_deleted?: boolean }) => {
    const { data } = await apiClient.get<Expense[]>('/api/v1/expenses', { params });
    return data;
  },
  get: async (id: number) => (await apiClient.get<Expense>(`/api/v1/expenses/${id}`)).data,
  create: async (payload: CreateExpense) =>
    (await apiClient.post<Expense>('/api/v1/expenses', payload)).data,
  update: async (id: number, payload: UpdateExpense) =>
    (await apiClient.patch<Expense>(`/api/v1/expenses/${id}`, payload)).data,
  remove: async (id: number, hard = false) =>
    apiClient.delete(`/api/v1/expenses/${id}`, { params: { hard_delete: hard } }),
};

// ----- Notepads -----
export const notepadsApi = {
  list: async (params?: { include_deleted?: boolean }) => {
    const { data } = await apiClient.get<Note[]>('/api/v1/notepads', { params });
    return data;
  },
  get: async (id: number) => (await apiClient.get<Note>(`/api/v1/notepads/${id}`)).data,
  create: async (payload: CreateNote) =>
    (await apiClient.post<Note>('/api/v1/notepads', payload)).data,
  update: async (id: number, payload: UpdateNote) =>
    (await apiClient.patch<Note>(`/api/v1/notepads/${id}`, payload)).data,
  remove: async (id: number, hard = false) =>
    apiClient.delete(`/api/v1/notepads/${id}`, { params: { hard_delete: hard } }),
};

// ----- Services -----
export const servicesApi = {
  list: async (params?: { include_deleted?: boolean }) => {
    const { data } = await apiClient.get<Service[]>('/api/v1/services', { params });
    return data;
  },
  get: async (id: number) => (await apiClient.get<Service>(`/api/v1/services/${id}`)).data,
  create: async (payload: CreateService) =>
    (await apiClient.post<Service>('/api/v1/services', payload)).data,
  update: async (id: number, payload: UpdateService) =>
    (await apiClient.patch<Service>(`/api/v1/services/${id}`, payload)).data,
  remove: async (id: number, hard = false) =>
    apiClient.delete(`/api/v1/services/${id}`, { params: { hard_delete: hard } }),
};

// ----- LLM Configs -----
export const llmApi = {
  list: async (params?: { is_active?: boolean; include_deleted?: boolean }) => {
    const { data } = await apiClient.get<LLMConfig[]>('/api/v1/llm-configs', { params });
    return data;
  },
  cached: async (force_refresh = false) => {
    const { data } = await apiClient.get<LLMConfig[]>('/api/v1/llm-configs/cached', {
      params: { force_refresh },
    });
    return data;
  },
  get: async (id: number) =>
    (await apiClient.get<LLMConfig>(`/api/v1/llm-configs/${id}`)).data,
  create: async (payload: CreateLLMConfig) =>
    (await apiClient.post<LLMConfig>('/api/v1/llm-configs', payload)).data,
  update: async (id: number, payload: UpdateLLMConfig) =>
    (await apiClient.patch<LLMConfig>(`/api/v1/llm-configs/${id}`, payload)).data,
  remove: async (id: number, hard = false) =>
    apiClient.delete(`/api/v1/llm-configs/${id}`, { params: { hard_delete: hard } }),
};
