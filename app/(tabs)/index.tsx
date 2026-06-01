import React, { useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  withSpring, Easing,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, getProgressPercent } from '@/services/db';
import {
  BalanceCard, TransactionItem, StatCard, AIInsightCard,
  IncomeExpenseChart, SpendingDonut, Card,
} from '@/components';

function useFadeSlide(delay = 0) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 120 }));
  }, []);
  return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
}

export default function DashboardScreen() {
  const router = useRouter();
  const { accounts, transactions, budgets, events, habits, habitCompletions, goals, categories, loading } = useApp();

  const now = new Date();
  const currentMonthYear = now.toISOString().slice(0, 7);
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam';

  const totalBalance = useMemo(() => accounts.filter((a) => !a.is_hidden).reduce((s, a) => s + a.balance, 0), [accounts]);
  const thisMonthTxns = useMemo(() => transactions.filter((t) => t.date.startsWith(currentMonthYear)), [transactions, currentMonthYear]);
  const monthlyIncome = useMemo(() => thisMonthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0), [thisMonthTxns]);
  const monthlyExpense = useMemo(() => thisMonthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [thisMonthTxns]);
  const monthlySavings = monthlyIncome - monthlyExpense;
  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);
  const upcomingEvents = useMemo(() =>
    events.filter((e) => new Date(e.date).getTime() >= Date.now() - 86400 * 1000).slice(0, 3), [events]);
  const today = now.toISOString().split('T')[0];
  const todayCompletedHabits = useMemo(() => habitCompletions.filter((c) => c.completed_date === today).length, [habitCompletions, today]);
  const budgetOverspent = useMemo(() =>
    budgets.filter((b) => {
      const spent = thisMonthTxns.filter((t) => t.type === 'expense' && t.category_id === b.category_id).reduce((s, t) => s + t.amount, 0);
      return spent > b.budget_limit;
    }).length, [budgets, thisMonthTxns]);
  const chartData = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const ym = d.toISOString().slice(0, 7);
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const mTxns = transactions.filter((t) => t.date.startsWith(ym));
    return {
      month: months[d.getMonth()],
      income: mTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: mTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  }), [transactions]);
  const balanceChartData = chartData.map((d) => ({ value: d.income - d.expense }));
  const spendingData = useMemo(() => {
    return categories
      .map((cat) => {
        const val = thisMonthTxns.filter((t) => t.type === 'expense' && t.category_id === cat.id).reduce((s, t) => s + t.amount, 0);
        return { name: cat.name, value: val, color: cat.color, percentage: monthlyExpense > 0 ? Math.round((val / monthlyExpense) * 100) : 0 };
      })
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [categories, thisMonthTxns, monthlyExpense]);
  const aiInsights = useMemo(() => {
    const insights = [];
    if (budgetOverspent > 0) insights.push({ id: 'ins_1', type: 'warning', icon: 'warning', title: 'Anggaran Terlampaui', description: `${budgetOverspent} kategori melebihi anggaran bulan ini.`, color: Colors.warning });
    if (goals.length > 0) {
      const topGoal = goals[0];
      const p = getProgressPercent(topGoal.current_amount, topGoal.target_amount);
      insights.push({ id: 'ins_2', type: 'success', icon: 'savings', title: 'Progres Tujuan', description: `${topGoal.name} sudah ${p}% tercapai. Tetap semangat!`, color: Colors.success });
    }
    if (monthlySavings > 0) insights.push({ id: 'ins_3', type: 'info', icon: 'lightbulb', title: 'Tabungan Bulan Ini', description: `Kamu berhasil menabung ${formatCurrency(monthlySavings, true)} bulan ini.`, color: Colors.primary });
    if (insights.length === 0) insights.push({ id: 'ins_0', type: 'info', icon: 'add-circle', title: 'Mulai Catat', description: 'Tambahkan transaksi pertama kamu untuk melihat insight keuangan.', color: Colors.primary });
    return insights;
  }, [budgetOverspent, goals, monthlySavings]);

  const getCat = (catId: string) => categories.find((c) => c.id === catId);
  const getAcc = (accId: string) => accounts.find((a) => a.id === accId);

  // Animations
  const headerAnim = useFadeSlide(0);
  const balanceAnim = useFadeSlide(80);
  const actionsAnim = useFadeSlide(160);
  const statsAnim = useFadeSlide(220);
  const chartsAnim = useFadeSlide(300);
  const insightsAnim = useFadeSlide(360);
  const eventsAnim = useFadeSlide(420);
  const txnsAnim = useFadeSlide(480);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <Animated.View style={[styles.header, headerAnim]}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.subtitle}>VaultOS — Personal Finance OS</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} hitSlop={8} onPress={() => router.push('/notifications-screen')}>
              <MaterialIcons name="notifications-none" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View style={balanceAnim}>
          <BalanceCard
            totalBalance={totalBalance}
            monthlyIncome={monthlyIncome}
            monthlyExpense={monthlyExpense}
            chartData={balanceChartData}
          />
        </Animated.View>

        <Animated.View style={[styles.quickActions, actionsAnim]}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
              onPress={() => { if (action.route) router.push(action.route as any); }}
            >
              <View style={[styles.quickIcon, { backgroundColor: action.color + '20' }]}>
                <MaterialIcons name={action.icon as any} size={20} color={action.color} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </Animated.View>

        <Animated.View style={[styles.statsRow, statsAnim]}>
          <StatCard label="Tabungan" value={formatCurrency(monthlySavings, true)} icon="savings" iconColor={monthlySavings >= 0 ? Colors.success : Colors.danger} />
          <StatCard label="Kebiasaan" value={`${todayCompletedHabits}/${habits.length}`} icon="loop" iconColor={Colors.purple} />
          <StatCard label="Overspent" value={`${budgetOverspent} kat`} icon="warning" iconColor={budgetOverspent > 0 ? Colors.danger : Colors.success} />
        </Animated.View>

        <Animated.View style={chartsAnim}>
          {chartData.some((d) => d.income > 0 || d.expense > 0) ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Pemasukan vs Pengeluaran</Text>
                <Text style={styles.sectionSub}>6 bulan</Text>
              </View>
              <Card style={styles.chartCard}><IncomeExpenseChart data={chartData} /></Card>
            </View>
          ) : null}

          {spendingData.length > 0 ? (
            <View style={[styles.section, { marginTop: Spacing.xl }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Pengeluaran Bulan Ini</Text>
                <Text style={styles.sectionSub}>{formatCurrency(monthlyExpense, true)}</Text>
              </View>
              <Card style={styles.chartCard}><SpendingDonut data={spendingData} /></Card>
            </View>
          ) : null}
        </Animated.View>

        <Animated.View style={[styles.section, insightsAnim]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Insights</Text>
            <View style={styles.aiBadge}>
              <MaterialIcons name="auto-awesome" size={11} color={Colors.primary} />
              <Text style={styles.aiBadgeText}>Smart</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.insightsRow}>
              {aiInsights.map((ins) => (<AIInsightCard key={ins.id} insight={ins} />))}
            </View>
          </ScrollView>
        </Animated.View>

        {upcomingEvents.length > 0 ? (
          <Animated.View style={[styles.section, eventsAnim]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Jadwal Mendatang</Text>
              <Pressable onPress={() => router.push('/(tabs)/calendar')}><Text style={styles.seeAll}>Lihat semua</Text></Pressable>
            </View>
            <View style={styles.eventsCard}>
              {upcomingEvents.map((evt, i) => (
                <View key={evt.id} style={[styles.eventRow, i < upcomingEvents.length - 1 && styles.eventRowBorder]}>
                  <View style={[styles.eventDot, { backgroundColor: evt.color }]} />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle} numberOfLines={1}>{evt.title}</Text>
                    <Text style={styles.eventMeta}>{evt.start_time} · {new Date(evt.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
                  </View>
                  <View style={[styles.eventCategory, { backgroundColor: evt.color + '20' }]}>
                    <Text style={[styles.eventCatText, { color: evt.color }]}>{evt.category}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}

        <Animated.View style={[styles.section, txnsAnim]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
            <Pressable onPress={() => router.push('/(tabs)/transactions')}><Text style={styles.seeAll}>Lihat semua</Text></Pressable>
          </View>
          {recentTransactions.length === 0 ? (
            <View style={styles.emptyTxn}>
              <MaterialIcons name="receipt-long" size={36} color={Colors.textDisabled} />
              <Text style={styles.emptyTxnText}>Belum ada transaksi. Tambah sekarang!</Text>
            </View>
          ) : (
            <Card padding={0}>
              {recentTransactions.map((txn, idx) => (
                <View key={txn.id}>
                  <TransactionItem transaction={txn} category={getCat(txn.category_id)} account={getAcc(txn.account_id)} />
                  {idx < recentTransactions.length - 1 ? <View style={styles.separator} /> : null}
                </View>
              ))}
            </Card>
          )}
        </Animated.View>

        <View style={styles.bottomPad} />
      </ScrollView>

      <Pressable style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]} onPress={() => router.push('/add-transaction')}>
        <MaterialIcons name="add" size={28} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

const QUICK_ACTIONS = [
  { id: 'add', label: 'Tambah', icon: 'add-circle', color: Colors.primary, route: '/add-transaction' },
  { id: 'accounts', label: 'Akun', icon: 'account-balance-wallet', color: Colors.gold, route: '/accounts' },
  { id: 'analytics', label: 'Analitik', icon: 'analytics', color: Colors.cyan, route: '/analytics' },
  { id: 'goals', label: 'Tujuan', icon: 'savings', color: Colors.success, route: '/goals' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { gap: Spacing.xl, paddingBottom: Spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.md },
  greeting: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  subtitle: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: { width: 40, height: 40, backgroundColor: Colors.card, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  quickActions: { flexDirection: 'row', paddingHorizontal: Spacing.base, gap: Spacing.sm },
  quickAction: { flex: 1, alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.card, borderRadius: Radius.lg, paddingVertical: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  quickIcon: { width: 42, height: 42, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.medium },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, gap: Spacing.md },
  section: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  sectionSub: { fontSize: Typography.xs, color: Colors.textMuted },
  seeAll: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.medium },
  chartCard: { padding: Spacing.base },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.primaryMuted, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  aiBadgeText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.semibold },
  insightsRow: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.xs },
  eventsCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  eventRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.md },
  eventRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  eventDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  eventInfo: { flex: 1, gap: 2 },
  eventTitle: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.text },
  eventMeta: { fontSize: Typography.xs, color: Colors.textMuted },
  eventCategory: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  eventCatText: { fontSize: Typography.xs, fontWeight: Typography.semibold, textTransform: 'capitalize' },
  emptyTxn: { alignItems: 'center', paddingVertical: 40, gap: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  emptyTxnText: { fontSize: Typography.sm, color: Colors.textMuted },
  separator: { height: 1, backgroundColor: Colors.borderSubtle, marginHorizontal: Spacing.base },
  bottomPad: { height: Spacing.lg },
  fab: { position: 'absolute', bottom: 90, right: Spacing.base, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  fabPressed: { transform: [{ scale: 0.93 }], opacity: 0.85 },
});
