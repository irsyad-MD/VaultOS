export interface Account {
  id: string;
  user_id?: string;
  name: string;
  type: 'bank' | 'ewallet' | 'cash' | 'investment' | 'crypto';
  bank_key: string;
  balance: number;
  account_number: string;
  color: string;
  is_default: boolean;
  is_hidden: boolean;
  created_at?: string;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  is_default?: boolean;
}

export interface Transaction {
  id: string;
  user_id?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  category_id: string;
  account_id: string;
  to_account_id?: string;
  date: string;
  tags: string[];
  notes: string;
  receipt_url?: string;
  created_at?: string;
  // Joined
  category?: Category;
  account?: Account;
}

export interface Budget {
  id: string;
  user_id?: string;
  category_id: string;
  name: string;
  budget_limit: number;
  spent?: number;
  period: 'monthly' | 'yearly' | 'weekly';
  color: string;
  icon: string;
  month_year: string;
  category?: Category;
}

export interface Habit {
  id: string;
  user_id?: string;
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  target_count: number;
  streak: number;
  longest_streak: number;
  created_at?: string;
  completed_dates?: string[];
}

export interface Goal {
  id: string;
  user_id?: string;
  name: string;
  icon: string;
  color: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  category: string;
  monthly_contribution: number;
  created_at?: string;
}

export interface ScheduleEvent {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  color: string;
  category: string;
  reminder_minutes: number;
  is_recurring: boolean;
  created_at?: string;
}

export interface Task {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  due_date?: string;
  category: string;
  tags: string[];
  created_at?: string;
}

export interface Note {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  color: string;
  is_pinned: boolean;
  tags: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ChartDataPoint {
  month: string;
  income: number;
  expense: number;
}

export interface SpendingCategory {
  name: string;
  value: number;
  color: string;
  percentage: number;
}
