import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSupabaseClient } from '@/template';
import {
  Account, Category, Transaction, Budget, Habit,
  Goal, ScheduleEvent, Task, Note,
} from '@/types';
import {
  fetchAccounts, fetchCategories, seedDefaultCategories,
  fetchTransactions, fetchBudgets,
  fetchEvents, fetchTasks,
  fetchHabits, fetchHabitCompletions, toggleHabitCompletion,
  fetchGoals, topUpGoal as dbTopUpGoal,
  fetchNotes,
  createTransaction as dbCreateTransaction,
  createAccount as dbCreateAccount,
  createBudget as dbCreateBudget,
  createEvent as dbCreateEvent,
  createTask as dbCreateTask,
  updateTask as dbUpdateTask,
  createHabit as dbCreateHabit,
  createGoal as dbCreateGoal,
  createNote as dbCreateNote,
  updateNote as dbUpdateNote,
  deleteNote as dbDeleteNote,
  deleteAccount as dbDeleteAccount,
  deleteEvent as dbDeleteEvent,
  deleteTask as dbDeleteTask,
  deleteHabit as dbDeleteHabit,
  deleteGoal as dbDeleteGoal,
  deleteTransaction as dbDeleteTransaction,
} from '@/services/db';

interface AppContextType {
  userId: string | null;
  loading: boolean;

  // Data
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  events: ScheduleEvent[];
  tasks: Task[];
  habits: Habit[];
  habitCompletions: { habit_id: string; completed_date: string }[];
  goals: Goal[];
  notes: Note[];

  // Refresh
  refreshAll: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshAccounts: () => Promise<void>;
  refreshBudgets: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  refreshHabits: () => Promise<void>;
  refreshGoals: () => Promise<void>;
  refreshNotes: () => Promise<void>;

  // Actions
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  addAccount: (a: Omit<Account, 'id'>) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  addBudget: (b: Omit<Budget, 'id'>) => Promise<void>;
  addEvent: (e: Omit<ScheduleEvent, 'id'>) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  addTask: (t: Omit<Task, 'id'>) => Promise<void>;
  updateTaskStatus: (id: string, status: Task['status']) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  addHabit: (h: Omit<Habit, 'id' | 'streak' | 'longest_streak'>) => Promise<void>;
  toggleHabit: (habitId: string) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
  addGoal: (g: Omit<Goal, 'id'>) => Promise<void>;
  topUpGoal: (id: string, amount: number) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  addNote: (n: Omit<Note, 'id'>) => Promise<void>;
  editNote: (id: string, updates: Partial<Note>) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<{ habit_id: string; completed_date: string }[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const sb = getSupabaseClient();
    sb.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadAll = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const [cats, accs, txns, buds, evts, tks, hbts, hcps, gls, nts] = await Promise.all([
        seedDefaultCategories(uid),
        fetchAccounts(uid),
        fetchTransactions(uid),
        fetchBudgets(uid),
        fetchEvents(uid),
        fetchTasks(uid),
        fetchHabits(uid),
        fetchHabitCompletions(uid),
        fetchGoals(uid),
        fetchNotes(uid),
      ]);
      setCategories(cats);
      setAccounts(accs);
      setTransactions(txns);
      setBudgets(buds);
      setEvents(evts);
      setTasks(tks);
      setHabits(hbts);
      setHabitCompletions(hcps);
      setGoals(gls);
      setNotes(nts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) loadAll(userId);
    else setLoading(false);
  }, [userId, loadAll]);

  const refreshAll = useCallback(async () => { if (userId) await loadAll(userId); }, [userId, loadAll]);
  const refreshAccounts = useCallback(async () => { if (!userId) return; setAccounts(await fetchAccounts(userId)); }, [userId]);
  const refreshTransactions = useCallback(async () => { if (!userId) return; setTransactions(await fetchTransactions(userId)); }, [userId]);
  const refreshBudgets = useCallback(async () => { if (!userId) return; setBudgets(await fetchBudgets(userId)); }, [userId]);
  const refreshEvents = useCallback(async () => { if (!userId) return; setEvents(await fetchEvents(userId)); }, [userId]);
  const refreshTasks = useCallback(async () => { if (!userId) return; setTasks(await fetchTasks(userId)); }, [userId]);
  const refreshHabits = useCallback(async () => {
    if (!userId) return;
    const [h, c] = await Promise.all([fetchHabits(userId), fetchHabitCompletions(userId)]);
    setHabits(h); setHabitCompletions(c);
  }, [userId]);
  const refreshGoals = useCallback(async () => { if (!userId) return; setGoals(await fetchGoals(userId)); }, [userId]);
  const refreshNotes = useCallback(async () => { if (!userId) return; setNotes(await fetchNotes(userId)); }, [userId]);

  // ── Actions ──
  const addTransaction = useCallback(async (t: Omit<Transaction, 'id'>) => {
    if (!userId) return;
    await dbCreateTransaction({ ...t, user_id: userId });
    await refreshTransactions();
    await refreshAccounts();
  }, [userId, refreshTransactions, refreshAccounts]);

  const addAccount = useCallback(async (a: Omit<Account, 'id'>) => {
    if (!userId) return;
    await dbCreateAccount({ ...a, user_id: userId });
    await refreshAccounts();
  }, [userId, refreshAccounts]);

  const removeAccount = useCallback(async (id: string) => {
    await dbDeleteAccount(id);
    await refreshAccounts();
  }, [refreshAccounts]);

  const addBudget = useCallback(async (b: Omit<Budget, 'id'>) => {
    if (!userId) return;
    await dbCreateBudget({ ...b, user_id: userId });
    await refreshBudgets();
  }, [userId, refreshBudgets]);

  const addEvent = useCallback(async (e: Omit<ScheduleEvent, 'id'>) => {
    if (!userId) return;
    await dbCreateEvent({ ...e, user_id: userId });
    await refreshEvents();
  }, [userId, refreshEvents]);

  const removeEvent = useCallback(async (id: string) => {
    await dbDeleteEvent(id);
    await refreshEvents();
  }, [refreshEvents]);

  const addTask = useCallback(async (t: Omit<Task, 'id'>) => {
    if (!userId) return;
    await dbCreateTask({ ...t, user_id: userId });
    await refreshTasks();
  }, [userId, refreshTasks]);

  const updateTaskStatus = useCallback(async (id: string, status: Task['status']) => {
    await dbUpdateTask(id, { status });
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
  }, []);

  const removeTask = useCallback(async (id: string) => {
    await dbDeleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addHabit = useCallback(async (h: Omit<Habit, 'id' | 'streak' | 'longest_streak'>) => {
    if (!userId) return;
    await dbCreateHabit({ ...h, user_id: userId });
    await refreshHabits();
  }, [userId, refreshHabits]);

  const toggleHabit = useCallback(async (habitId: string) => {
    if (!userId) return;
    const today = new Date().toISOString().split('T')[0];
    const done = await toggleHabitCompletion(habitId, userId, today);
    setHabitCompletions((prev) => {
      if (done) return [...prev, { habit_id: habitId, completed_date: today }];
      return prev.filter((c) => !(c.habit_id === habitId && c.completed_date === today));
    });
  }, [userId]);

  const removeHabit = useCallback(async (id: string) => {
    await dbDeleteHabit(id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const addGoal = useCallback(async (g: Omit<Goal, 'id'>) => {
    if (!userId) return;
    await dbCreateGoal({ ...g, user_id: userId });
    await refreshGoals();
  }, [userId, refreshGoals]);

  const topUpGoal = useCallback(async (id: string, amount: number) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    await dbTopUpGoal(id, amount, goal.current_amount);
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, current_amount: g.current_amount + amount } : g));
  }, [goals]);

  const removeGoal = useCallback(async (id: string) => {
    await dbDeleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const addNote = useCallback(async (n: Omit<Note, 'id'>) => {
    if (!userId) return;
    await dbCreateNote({ ...n, user_id: userId });
    await refreshNotes();
  }, [userId, refreshNotes]);

  const editNote = useCallback(async (id: string, updates: Partial<Note>) => {
    await dbUpdateNote(id, updates);
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, ...updates } : n));
  }, []);

  const removeNote = useCallback(async (id: string) => {
    await dbDeleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      userId, loading,
      accounts, categories, transactions, budgets,
      events, tasks, habits, habitCompletions, goals, notes,
      refreshAll, refreshTransactions, refreshAccounts, refreshBudgets,
      refreshEvents, refreshTasks, refreshHabits, refreshGoals, refreshNotes,
      addTransaction, addAccount, removeAccount,
      addBudget,
      addEvent, removeEvent,
      addTask, updateTaskStatus, removeTask,
      addHabit, toggleHabit, removeHabit,
      addGoal, topUpGoal, removeGoal,
      addNote, editNote, removeNote,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
