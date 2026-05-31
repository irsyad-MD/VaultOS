import { getSupabaseClient } from '@/template';
import {
  Account, Category, Transaction, Budget, Habit,
  Goal, ScheduleEvent, Task, Note,
} from '@/types';

const sb = () => getSupabaseClient();

// ─── FORMATTERS ────────────────────────────────────────────────────────────────
export const formatCurrency = (amount: number, compact = false): string => {
  if (compact && amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (compact && amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = diffMs / 3600000;
  const diffDays = diffMs / 86400000;
  if (diffHrs < 1) return 'Baru saja';
  if (diffHrs < 24) return `${Math.floor(diffHrs)} jam lalu`;
  if (diffDays < 2) return 'Kemarin';
  if (diffDays < 7) return `${Math.floor(diffDays)} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

export const formatShortDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export const getProgressPercent = (current: number, total: number): number =>
  total === 0 ? 0 : Math.min(100, Math.round((current / total) * 100));

// ─── CATEGORIES ─────────────────────────────────────────────────────────────────
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'user_id'>[] = [
  { name: 'Makanan', icon: 'restaurant', color: '#f97316', type: 'expense', is_default: true },
  { name: 'Transport', icon: 'directions-car', color: '#3b82f6', type: 'expense', is_default: true },
  { name: 'Belanja', icon: 'shopping-bag', color: '#ec4899', type: 'expense', is_default: true },
  { name: 'Tagihan', icon: 'receipt', color: '#f59e0b', type: 'expense', is_default: true },
  { name: 'Kesehatan', icon: 'favorite', color: '#ef4444', type: 'expense', is_default: true },
  { name: 'Hiburan', icon: 'movie', color: '#a855f7', type: 'expense', is_default: true },
  { name: 'Pendidikan', icon: 'school', color: '#06b6d4', type: 'expense', is_default: true },
  { name: 'Investasi', icon: 'trending-up', color: '#22c55e', type: 'both', is_default: true },
  { name: 'Gaji', icon: 'account-balance-wallet', color: '#22c55e', type: 'income', is_default: true },
  { name: 'Freelance', icon: 'work', color: '#6366f1', type: 'income', is_default: true },
  { name: 'Bisnis', icon: 'business', color: '#14b8a6', type: 'income', is_default: true },
  { name: 'Internet', icon: 'wifi', color: '#3b82f6', type: 'expense', is_default: true },
  { name: 'Listrik', icon: 'bolt', color: '#f59e0b', type: 'expense', is_default: true },
  { name: 'Travel', icon: 'flight', color: '#6366f1', type: 'expense', is_default: true },
  { name: 'Keluarga', icon: 'people', color: '#ec4899', type: 'expense', is_default: true },
  { name: 'Lainnya', icon: 'label', color: '#71717a', type: 'both', is_default: true },
];

export async function seedDefaultCategories(userId: string): Promise<Category[]> {
  const { data: existing } = await sb().from('categories').select('id').eq('user_id', userId).limit(1);
  if (existing && existing.length > 0) {
    const { data } = await sb().from('categories').select('*').eq('user_id', userId).order('name');
    return (data ?? []) as Category[];
  }
  const toInsert = DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: userId }));
  const { data } = await sb().from('categories').insert(toInsert).select('*');
  return (data ?? []) as Category[];
}

export async function fetchCategories(userId: string): Promise<Category[]> {
  const { data } = await sb().from('categories').select('*').eq('user_id', userId).order('name');
  return (data ?? []) as Category[];
}

export async function createCategory(cat: Omit<Category, 'id'>): Promise<Category | null> {
  const { data, error } = await sb().from('categories').insert(cat).select().single();
  if (error) throw error;
  return data as Category;
}

// ─── ACCOUNTS ────────────────────────────────────────────────────────────────────
export async function fetchAccounts(userId: string): Promise<Account[]> {
  const { data } = await sb().from('accounts').select('*').eq('user_id', userId).order('created_at');
  return (data ?? []) as Account[];
}

export async function createAccount(acc: Omit<Account, 'id'>): Promise<Account> {
  const { data, error } = await sb().from('accounts').insert(acc).select().single();
  if (error) throw error;
  return data as Account;
}

export async function updateAccountBalance(id: string, balance: number): Promise<void> {
  await sb().from('accounts').update({ balance }).eq('id', id);
}

export async function deleteAccount(id: string): Promise<void> {
  await sb().from('accounts').delete().eq('id', id);
}

// ─── TRANSACTIONS ──────────────────────────────────────────────────────────────
export async function fetchTransactions(userId: string, limit?: number): Promise<Transaction[]> {
  let q = sb()
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (limit) q = q.limit(limit);
  const { data } = await q;
  return (data ?? []) as Transaction[];
}

export async function createTransaction(txn: Omit<Transaction, 'id'>): Promise<Transaction> {
  const { data, error } = await sb().from('transactions').insert(txn).select().single();
  if (error) throw error;
  return data as Transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  await sb().from('transactions').delete().eq('id', id);
}

// ─── BUDGETS ─────────────────────────────────────────────────────────────────────
export async function fetchBudgets(userId: string, monthYear?: string): Promise<Budget[]> {
  const now = monthYear ?? new Date().toISOString().slice(0, 7);
  const { data } = await sb()
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month_year', now);
  return (data ?? []) as Budget[];
}

export async function createBudget(bud: Omit<Budget, 'id'>): Promise<Budget> {
  const { data, error } = await sb().from('budgets').insert(bud).select().single();
  if (error) throw error;
  return data as Budget;
}

export async function deleteBudget(id: string): Promise<void> {
  await sb().from('budgets').delete().eq('id', id);
}

// ─── EVENTS ──────────────────────────────────────────────────────────────────────
export async function fetchEvents(userId: string): Promise<ScheduleEvent[]> {
  const { data } = await sb()
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  return (data ?? []) as ScheduleEvent[];
}

export async function createEvent(evt: Omit<ScheduleEvent, 'id'>): Promise<ScheduleEvent> {
  const { data, error } = await sb().from('events').insert(evt).select().single();
  if (error) throw error;
  return data as ScheduleEvent;
}

export async function deleteEvent(id: string): Promise<void> {
  await sb().from('events').delete().eq('id', id);
}

// ─── TASKS ────────────────────────────────────────────────────────────────────────
export async function fetchTasks(userId: string): Promise<Task[]> {
  const { data } = await sb()
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data ?? []) as Task[];
}

export async function createTask(task: Omit<Task, 'id'>): Promise<Task> {
  const { data, error } = await sb().from('tasks').insert(task).select().single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  await sb().from('tasks').update(updates).eq('id', id);
}

export async function deleteTask(id: string): Promise<void> {
  await sb().from('tasks').delete().eq('id', id);
}

// ─── HABITS ───────────────────────────────────────────────────────────────────────
export async function fetchHabits(userId: string): Promise<Habit[]> {
  const { data } = await sb()
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at');
  return (data ?? []) as Habit[];
}

export async function fetchHabitCompletions(userId: string, since?: string): Promise<{ habit_id: string; completed_date: string }[]> {
  const sinceDate = since ?? new Date(Date.now() - 30 * 86400 * 1000).toISOString().split('T')[0];
  const { data } = await sb()
    .from('habit_completions')
    .select('habit_id, completed_date')
    .eq('user_id', userId)
    .gte('completed_date', sinceDate);
  return data ?? [];
}

export async function toggleHabitCompletion(habitId: string, userId: string, date: string): Promise<boolean> {
  const { data: existing } = await sb()
    .from('habit_completions')
    .select('id')
    .eq('habit_id', habitId)
    .eq('completed_date', date)
    .single();

  if (existing) {
    await sb().from('habit_completions').delete().eq('habit_id', habitId).eq('completed_date', date);
    return false;
  } else {
    await sb().from('habit_completions').insert({ habit_id: habitId, user_id: userId, completed_date: date });
    return true;
  }
}

export async function createHabit(habit: Omit<Habit, 'id' | 'streak' | 'longest_streak'>): Promise<Habit> {
  const { data, error } = await sb().from('habits').insert({ ...habit, streak: 0, longest_streak: 0 }).select().single();
  if (error) throw error;
  return data as Habit;
}

export async function deleteHabit(id: string): Promise<void> {
  await sb().from('habits').delete().eq('id', id);
}

// ─── GOALS ───────────────────────────────────────────────────────────────────────
export async function fetchGoals(userId: string): Promise<Goal[]> {
  const { data } = await sb()
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data ?? []) as Goal[];
}

export async function createGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
  const { data, error } = await sb().from('goals').insert(goal).select().single();
  if (error) throw error;
  return data as Goal;
}

export async function topUpGoal(id: string, addAmount: number, current: number): Promise<void> {
  await sb().from('goals').update({ current_amount: current + addAmount }).eq('id', id);
}

export async function deleteGoal(id: string): Promise<void> {
  await sb().from('goals').delete().eq('id', id);
}

// ─── NOTES ───────────────────────────────────────────────────────────────────────
export async function fetchNotes(userId: string): Promise<Note[]> {
  const { data } = await sb()
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });
  return (data ?? []) as Note[];
}

export async function createNote(note: Omit<Note, 'id'>): Promise<Note> {
  const { data, error } = await sb().from('notes').insert(note).select().single();
  if (error) throw error;
  return data as Note;
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<void> {
  await sb().from('notes').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
}

export async function deleteNote(id: string): Promise<void> {
  await sb().from('notes').delete().eq('id', id);
}
