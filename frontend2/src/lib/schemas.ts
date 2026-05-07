import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().email(),
    full_name: z.string().min(1, "Full name is required"),
    password: z.string().min(6, "At least 6 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const emailOnlySchema = z.object({ email: z.string().email() });
export type EmailOnlyValues = z.infer<typeof emailOnlySchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(6),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const profileUpdateSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  full_name: z.string().optional(),
  password: z.string().min(6).optional().or(z.literal("")),
});
export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;

export const todoSchema = z.object({
  title: z.string().min(1, "Title required"),
  notes: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  tags: z.string().optional(),
  is_starred: z.boolean().optional(),
  is_completed: z.boolean().optional(),
  deadline_at: z.string().optional(),
  remind_at: z.string().optional(),
  repeat_type: z.string().optional(),
});
export type TodoValues = z.infer<typeof todoSchema>;

export const noteSchema = z.object({
  title: z.string().min(1, "Title required"),
  content: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  is_starred: z.boolean().optional(),
});
export type NoteValues = z.infer<typeof noteSchema>;

export const expenseSchema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date required"),
  category: z.string().optional(),
  tags: z.string().optional(),
  location: z.string().optional(),
  payment_method: z.string().optional(),
  amount: z.coerce.number().nonnegative(),
  currency: z.string().min(1, "Currency required"),
});
export type ExpenseValues = z.infer<typeof expenseSchema>;

export const serviceSchema = z.object({
  name: z.string().min(1, "Name required"),
  url: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  notes: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  is_starred: z.boolean().optional(),
});
export type ServiceValues = z.infer<typeof serviceSchema>;

export const llmSchema = z.object({
  provider: z.string().min(1),
  category: z.string().optional(),
  is_active: z.boolean().optional(),
  title: z.string().min(1),
  model_name: z.string().min(1),
  api_endpoint: z.string().optional(),
  api_key: z.string().optional(),
  temperature: z.coerce.number().min(0).max(2).optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  is_starred: z.boolean().optional(),
});
export type LlmValues = z.infer<typeof llmSchema>;

export const renameDocSchema = z.object({
  filename: z.string().min(1),
  new_filename: z.string().min(1),
});
export type RenameDocValues = z.infer<typeof renameDocSchema>;
