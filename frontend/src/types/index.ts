// Shared TypeScript types matching backend schemas

export interface AuditFields {
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_by?: string | null;
  group_id?: number | null;
}

/** Audit fields that are always server-managed and never sent by the client. */
type ServerAuditFields = Omit<AuditFields, 'group_id'>;

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  full_name?: string;
  group_id?: number | null;
  group_role?: 'owner' | 'member' | null;
}

/** Extended User returned by admin endpoints — includes group_name. */
export interface AdminUser extends User {
  group_name?: string | null;
}

export interface GroupSummary {
  id: number;
  name: string;
  description?: string | null;
}

export interface AdminUserUpdate {
  email?: string;
  password?: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  is_verified?: boolean;
  group_id?: number | null;
  group_role?: 'owner' | 'member' | null;
  remove_from_group?: boolean;
}

export interface GroupMember {
  id: string;
  email: string;
  full_name: string;
  group_role?: string | null;
}

export interface Group {
  id: number;
  name: string;
  description?: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  members: GroupMember[];
}

export type CreateGroup = { name: string; description?: string };
export type UpdateGroup = { name?: string; description?: string };
export type GroupInvite = { email: string };

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

export type CreateTodo = Omit<Todo, 'id' | keyof ServerAuditFields>;
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

export type CreateExpense = Omit<Expense, 'id' | keyof ServerAuditFields>;
export type UpdateExpense = Partial<CreateExpense>;

export interface Note extends AuditFields {
  id: number;
  title: string;
  content: string;
  category: number;
  is_starred: number;
  tags: string;
}

export type CreateNote = Omit<Note, 'id' | keyof ServerAuditFields>;
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

export type CreateService = Omit<Service, 'id' | keyof ServerAuditFields>;
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

export type CreateLLMConfig = Omit<LLMConfig, 'id' | keyof ServerAuditFields>;
export type UpdateLLMConfig = Partial<CreateLLMConfig>;

export interface Document {
  id: number;
  filename: string;
  filepath: string;
  filesize: number;
  category?: number;
  is_starred?: number;
  tags?: string;
  description?: string;
  created_at?: string;
  modified_at?: string;
  group_id?: number | null;
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
