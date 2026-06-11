// Backend API types — mirror Pydantic schemas

export interface UserRead {
  id: string;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  group_id?: number | null;
  group_role?: "owner" | "member" | null;
}

/** Extended UserRead returned by admin endpoints — includes group_name. */
export interface AdminUserRead extends UserRead {
  group_name?: string | null;
}

export interface GroupSummary {
  id: number;
  name: string;
  description?: string | null;
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
type ServerAuditFields = Omit<AuditFields, "group_id">;

export interface Todo extends AuditFields {
  id: number;
  title: string;
  notes?: string | null;
  is_starred: boolean;
  is_completed: boolean;
  category?: string | null;
  priority?: string | null;
  tags?: string | null;
  repeat_type?: string | null;
  deadline_at?: string | null;
  remind_at?: string | null;
}
export type CreateTodo = Partial<Omit<Todo, "id" | keyof ServerAuditFields>> & { title: string };
export type UpdateTodo = Partial<Omit<Todo, "id" | keyof ServerAuditFields>>;

export interface Note extends AuditFields {
  id: number;
  title: string;
  content?: string | null;
  category?: string | null;
  is_starred: boolean;
  tags?: string | null;
}
export type CreateNote = Partial<Omit<Note, "id" | keyof ServerAuditFields>> & { title: string };
export type UpdateNote = Partial<Omit<Note, "id" | keyof ServerAuditFields>>;

export interface Expense extends AuditFields {
  id: number;
  title: string;
  description?: string | null;
  date: string;
  category?: string | null;
  tags?: string | null;
  location?: string | null;
  payment_method?: string | null;
  amount: number;
  currency: string;
}
export type CreateExpense = Partial<Omit<Expense, "id" | keyof ServerAuditFields>> & {
  title: string;
  amount: number;
  date: string;
  currency: string;
};
export type UpdateExpense = Partial<Omit<Expense, "id" | keyof ServerAuditFields>>;

export interface Service extends AuditFields {
  id: number;
  name: string;
  url?: string | null;
  username?: string | null;
  password?: string | null;
  notes?: string | null;
  is_starred: boolean;
  category?: string | null;
  tags?: string | null;
}
export type CreateService = Partial<Omit<Service, "id" | keyof ServerAuditFields>> & { name: string };
export type UpdateService = Partial<Omit<Service, "id" | keyof ServerAuditFields>>;

export interface LlmConfig extends AuditFields {
  id: number;
  provider: string;
  category?: string | null;
  is_active: boolean;
  title: string;
  model_name: string;
  api_endpoint?: string | null;
  api_key?: string | null;
  temperature?: number | null;
  notes?: string | null;
  is_starred: boolean;
  tags?: string | null;
}
export type CreateLlm = Partial<Omit<LlmConfig, "id" | keyof AuditFields>> & {
  provider: string;
  title: string;
  model_name: string;
};
export type UpdateLlm = Partial<Omit<LlmConfig, "id" | keyof AuditFields>>;

export interface Document {
  id?: number;
  filename: string;
  filepath?: string;
  filesize: number;
  category?: string | null;
  is_starred?: boolean;
  tags?: string | null;
  description?: string | null;
  created_at?: string | null;
  modified_at?: string | null;
  group_id?: number | null;
}

export interface ChatRequest {
  llm_id: number;
  message: string;
  session_id?: string;
  system_prompt?: string;
}

export interface ChatResponse {
  llm_id: number;
  response: string;
  session_id?: string;
  message_count?: number;
}

export interface ChatMessage {
  /** LangChain message type: human | ai | system */
  type: "human" | "ai" | "system" | string;
  content: string;
}

export interface HistoryResponse {
  session_id: string;
  messages: ChatMessage[];
  message_count: number;
}

export interface SessionInfo {
  session_id: string;
  message_count: number;
}

export interface SessionsResponse {
  total_sessions: number;
  sessions: SessionInfo[];
}

export interface HealthLive {
  status: string;
  uptime_seconds: number;
  server_time: string;
}
export interface HealthReady {
  status: string;
  detail?: string;
}

export interface SysInfo {
  [key: string]: unknown;
}

export interface AppConfig {
  [key: string]: unknown;
}
