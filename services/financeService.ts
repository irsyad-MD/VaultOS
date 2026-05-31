// Legacy service file - kept for backward compatibility
// All data operations now go through services/db.ts and contexts/AppContext.tsx

export { formatCurrency, formatDate, formatShortDate, getProgressPercent } from './db';

// Stub functions for any remaining legacy references
export const getAccounts = () => [];
export const getTotalBalance = () => 0;
export const getAccountById = (_id: string) => undefined;
export const getTransactions = () => [];
export const getRecentTransactions = (_limit?: number) => [];
export const getTransactionsByType = (_type: string) => [];
export const getMonthlyIncome = () => 0;
export const getMonthlyExpense = () => 0;
export const getMonthlySavings = () => 0;
export const getBudgets = () => [];
export const getBudgetOverspent = () => [];
export const getCategories = () => [];
export const getCategoryById = (_id: string) => undefined;
export const getHabits = () => [];
export const getTodayCompletedHabits = () => 0;
export const getGoals = () => [];
export const getEvents = () => [];
export const getUpcomingEvents = (_limit?: number) => [];
export const getTasks = () => [];
export const getTasksByStatus = (_status: string) => [];
export const getMonthlyChartData = () => [];
export const getSpendingByCategory = () => [];
export const getAIInsights = () => [];
