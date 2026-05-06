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
    const { data } = await apiClient.get<Todo[]>('/todos', { params });
    return data;
  },
  get: async (id: number) => (await apiClient.get<Todo>(`/todos/${id}`)).data,
  create: async (payload: CreateTodo) =>
    (await apiClient.post<Todo>('/todos', payload)).data,
  update: async (id: number, payload: UpdateTodo) =>
    (await apiClient.patch<Todo>(`/todos/${id}`, payload)).data,
  remove: async (id: number, hard = false) =>
    apiClient.delete(`/todos/${id}`, { params: { hard_delete: hard } }),
};

// ----- Expenses -----
export const expensesApi = {
  list: async (params?: { from_date?: string; to_date?: string; include_deleted?: boolean }) => {
    const { data } = await apiClient.get<Expense[]>('/expenses', { params });
    return data;
  },
  get: async (id: number) => (await apiClient.get<Expense>(`/expenses/${id}`)).data,
  create: async (payload: CreateExpense) =>
    (await apiClient.post<Expense>('/expenses', payload)).data,
  update: async (id: number, payload: UpdateExpense) =>
    (await apiClient.patch<Expense>(`/expenses/${id}`, payload)).data,
  remove: async (id: number, hard = false) =>
    apiClient.delete(`/expenses/${id}`, { params: { hard_delete: hard } }),
};

// ----- Notepads -----
export const notepadsApi = {
  list: async (params?: { include_deleted?: boolean }) => {
    const { data } = await apiClient.get<Note[]>('/notepads', { params });
    return data;
  },
  get: async (id: number) => (await apiClient.get<Note>(`/notepads/${id}`)).data,
  create: async (payload: CreateNote) =>
    (await apiClient.post<Note>('/notepads', payload)).data,
  update: async (id: number, payload: UpdateNote) =>
    (await apiClient.patch<Note>(`/notepads/${id}`, payload)).data,
  remove: async (id: number, hard = false) =>
    apiClient.delete(`/notepads/${id}`, { params: { hard_delete: hard } }),
};

// ----- Services -----
export const servicesApi = {
  list: async (params?: { include_deleted?: boolean }) => {
    const { data } = await apiClient.get<Service[]>('/services', { params });
    return data;
  },
  get: async (id: number) => (await apiClient.get<Service>(`/services/${id}`)).data,
  create: async (payload: CreateService) =>
    (await apiClient.post<Service>('/services', payload)).data,
  update: async (id: number, payload: UpdateService) =>
    (await apiClient.patch<Service>(`/services/${id}`, payload)).data,
  remove: async (id: number, hard = false) =>
    apiClient.delete(`/services/${id}`, { params: { hard_delete: hard } }),
};

// ----- LLM Configs -----
export const llmApi = {
  list: async (params?: { is_active?: boolean; include_deleted?: boolean }) => {
    const { data } = await apiClient.get<LLMConfig[]>('/llm-configs', { params });
    return data;
  },
  cached: async (force_refresh = false) => {
    const { data } = await apiClient.get<LLMConfig[]>('/llm-configs/cached', {
      params: { force_refresh },
    });
    return data;
  },
  get: async (id: number) =>
    (await apiClient.get<LLMConfig>(`/llm-configs/${id}`)).data,
  create: async (payload: CreateLLMConfig) =>
    (await apiClient.post<LLMConfig>('/llm-configs', payload)).data,
  update: async (id: number, payload: UpdateLLMConfig) =>
    (await apiClient.patch<LLMConfig>(`/llm-configs/${id}`, payload)).data,
  remove: async (id: number, hard = false) =>
    apiClient.delete(`/llm-configs/${id}`, { params: { hard_delete: hard } }),
};
