// Shared TypeScript types matching backend schemas

export interface AuditFields {
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_by?: string | null;
}

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  full_name?: string;
}

export interface Todo extends AuditFields {
  id: number;
  title: string;
  notes: string;
  is_starred: boolean;
  is_completed: boolean;
  category: number;
  priority: number;
  tags: string;
  repeat_type: number;
  deadline_at?: string | null;
  remind_at?: string | null;
}

export type CreateTodo = Omit<Todo, 'id' | keyof AuditFields>;
export type UpdateTodo = Partial<CreateTodo>;

export interface Expense extends AuditFields {
  id: number;
  title: string;
  description: string;
  date: string;
  category: number;
  tags: string;
  location: string;
  payment_method: number;
  amount: number;
  currency: string;
}

export type CreateExpense = Omit<Expense, 'id' | keyof AuditFields>;
export type UpdateExpense = Partial<CreateExpense>;

export interface Note extends AuditFields {
  id: number;
  title: string;
  content: string;
  category: number;
  is_starred: number;
  tags: string;
}

export type CreateNote = Omit<Note, 'id' | keyof AuditFields>;
export type UpdateNote = Partial<CreateNote>;

export interface Service extends AuditFields {
  id: number;
  name: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  is_starred: boolean;
  category: number;
  tags: string;
}

export type CreateService = Omit<Service, 'id' | keyof AuditFields>;
export type UpdateService = Partial<CreateService>;

export interface LLMConfig extends AuditFields {
  id: number;
  provider: number;
  category: number;
  is_active: boolean;
  title: string;
  model_name: string;
  api_endpoint: string;
  api_key: string;
  temperature: number;
  notes: string;
  is_starred: boolean;
  tags: string;
}

export type CreateLLMConfig = Omit<LLMConfig, 'id' | keyof AuditFields>;
export type UpdateLLMConfig = Partial<CreateLLMConfig>;

export interface Document {
  id: string;
  filename: string;
  filepath: string;
  filesize: string;
  category?: number;
  is_starred?: number;
  tags?: string;
  description?: string;
  created_at?: string;
  modified_at?: string;
}

export interface ChatSession {
  session_id: string;
  message_count: number;
}

export interface ChatSessionResponse {
  total_sessions: number;
  sessions: ChatSession[];
}

export interface ChatMessage {
  type: 'human' | 'ai' | 'system';
  content: string;
}

export interface ChatHistory {
  session_id: string;
  messages: ChatMessage[];
  message_count: number;
}

export interface ChatResponse {
  llm_id: number;
  response: string;
  session_id: string;
  message_count: number;
}

export interface ChatRequest {
  llm_id: number;
  message: string;
  session_id?: string;
  system_prompt?: string;
}
