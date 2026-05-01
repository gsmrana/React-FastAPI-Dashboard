// Enum-like maps for select fields. Backend stores as int; UI shows label.

export const TODO_CATEGORIES = [
  { value: 0, label: 'Personal' },
  { value: 1, label: 'Work' },
  { value: 2, label: 'Shopping' },
  { value: 3, label: 'Health' },
  { value: 4, label: 'Other' },
];

export const TODO_PRIORITIES = [
  { value: 0, label: 'Low', color: 'success' as const },
  { value: 1, label: 'Medium', color: 'warning' as const },
  { value: 2, label: 'High', color: 'error' as const },
];

export const TODO_REPEAT = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Daily' },
  { value: 2, label: 'Weekly' },
  { value: 3, label: 'Monthly' },
  { value: 4, label: 'Yearly' },
];

export const EXPENSE_CATEGORIES = [
  { value: 0, label: 'Food' },
  { value: 1, label: 'Transport' },
  { value: 2, label: 'Shopping' },
  { value: 3, label: 'Bills' },
  { value: 4, label: 'Entertainment' },
  { value: 5, label: 'Health' },
  { value: 6, label: 'Travel' },
  { value: 7, label: 'Other' },
];

export const EXPENSE_PAYMENT_METHODS = [
  { value: 0, label: 'Cash' },
  { value: 1, label: 'Credit Card' },
  { value: 2, label: 'Debit Card' },
  { value: 3, label: 'Bank Transfer' },
  { value: 4, label: 'Mobile Wallet' },
  { value: 5, label: 'Other' },
];

export const NOTE_CATEGORIES = [
  { value: 0, label: 'General' },
  { value: 1, label: 'Idea' },
  { value: 2, label: 'Journal' },
  { value: 3, label: 'Work' },
  { value: 4, label: 'Other' },
];

export const SERVICE_CATEGORIES = [
  { value: 0, label: 'General' },
  { value: 1, label: 'Email' },
  { value: 2, label: 'Banking' },
  { value: 3, label: 'Social' },
  { value: 4, label: 'Cloud' },
  { value: 5, label: 'Other' },
];

export const LLM_PROVIDERS = [
  { value: 0, label: 'OpenAI' },
  { value: 1, label: 'Anthropic' },
  { value: 2, label: 'Azure OpenAI' },
  { value: 3, label: 'Google' },
  { value: 4, label: 'Ollama' },
  { value: 5, label: 'Other' },
];

export const LLM_CATEGORIES = [
  { value: 0, label: 'LLM' },
  { value: 1, label: 'Embeddings' },
  { value: 2, label: 'Vision' },
];

export function labelOf(
  list: ReadonlyArray<{ value: number; label: string }>,
  value: number | undefined | null,
  fallback = '—'
): string {
  if (value == null) return fallback;
  return list.find((x) => x.value === value)?.label ?? `#${value}`;
}
