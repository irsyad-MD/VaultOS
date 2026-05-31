import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { BudgetCard, ProgressBar, SpendingDonut } from '@/components';
import { formatCurrency, getProgressPercent } from '@/services/db';
import { useRouter } from 'expo-router';

export default function BudgetScreen() {
  const { budgets, categories, transactions, loading } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'budget' | 'analytics'>('budget');

  const currentMonthYear = new Date().toISOString().slice(0, 7);
  const thisMonthTxns = transactions.filter((t) => t.date.startsWith(currentMonthYear) && t.type === 'expense');

  // Compute spent per category
  const budgetsWithSpent = useMemo(() =>
    budgets.map((b) => {
      const spent = thisMonthTxns.filter((t) => t.category_id === b.category_id).reduce((s, t) => s + t.amount, 0);
      const cat = categories.find((c) => c.id === b.category_id);
      return { ...b, spent, category: cat };
    }),
    [budgets, thisMonthTxns, categories]
  );

  const totalBudget = budgets.reduce((s, b) => s + b.budget_limit, 0);
  const totalSpent = budgetsWithSpent.reduce((s, b) => s + b.spent, 0);
  const overspentCount = budgetsWithSpent.filter((b) => b.spent > b.budget_limit).length;
  const overallProgress = getProgressPercent(totalSpent, totalBudget);
  const remaining = totalBudget - totalSpent;

  // Spending by category for donut
  const spendingData = useMemo(() => {
    const totalExpense = thisMonthTxns.reduce((s, t) => s + t.amount, 0);
    return categories
      .map((cat) => {
        const val = thisMonthTxns.filter((t) => t.category_id === cat.id).reduce((s, t) => s + t.amount, 0);
        return { name: cat.name, value: val, color: cat.color, percentage: totalExpense > 0 ? Math.round((val / totalExpense) * 100) : 0 };
      })
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categories, thisMonthTxns]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Anggaran</Text>
          <Text style={styles.period}>{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</Text>
        </View>

        {/* Overall Card */}
        {budgets.length > 0 ? (
          <View style={styles.overallCard}>
            <View style={styles.overallTop}>
              <View>
                <Text style={styles.overallLabel}>Total Anggaran</Text>
                <Text style={styles.overallAmount}>{formatCurrency(totalBudget)}</Text>
              </View>
              {overspentCount > 0 ? (
                <View style={styles.warningBadge}>
                  <MaterialIcons name="warning" size={14} color={Colors.warning} />
                  <Text style={styles.warningText}>{overspentCount} lebih batas</Text>
                </View>
              ) : (
                <View style={styles.safeBadge}>
                  <MaterialIcons name="check-circle" size={14} color={Colors.success} />
                  <Text style={styles.safeText}>Aman</Text>
                </View>
              )}
            </View>
            <ProgressBar progress={overallProgress} color={overallProgress > 90 ? Colors.danger : Colors.primary} height={10} showLabel />
            <View style={styles.overallStats}>
              <View style={styles.overallStat}>
                <Text style={styles.statLabel}>Dipakai</Text>
                <Text style={[styles.statValue, { color: Colors.danger }]}>{formatCurrency(totalSpent, true)}</Text>
              </View>
              <View style={styles.overallStat}>
                <Text style={styles.statLabel}>Sisa</Text>
                <Text style={[styles.statValue, { color: remaining >= 0 ? Colors.success : Colors.danger }]}>{formatCurrency(Math.abs(remaining), true)}</Text>
              </View>
              <View style={styles.overallStat}>
                <Text style={styles.statLabel}>Progres</Text>
                <Text style={[styles.statValue, { color: Colors.text }]}>{overallProgress}%</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Tab */}
        <View style={styles.tabRow}>
          {(['budget', 'analytics'] as const).map((tab) => (
            <Pressable key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab === 'budget' ? 'Anggaran' : 'Analitik'}</Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'budget' ? (
          <View style={styles.budgetList}>
            {budgetsWithSpent.length === 0 && !loading ? (
              <View style={styles.empty}>
                <MaterialIcons name="pie-chart" size={64} color={Colors.textDisabled} />
                <Text style={styles.emptyTitle}>Belum ada anggaran</Text>
                <Text style={styles.emptyText}>Tambahkan anggaran untuk melacak pengeluaran kamu</Text>
              </View>
            ) : (
              budgetsWithSpent.map((b) => (
                <BudgetCard key={b.id} budget={b} />
              ))
            )}
          </View>
        ) : (
          <View style={styles.analyticsSection}>
            {spendingData.length > 0 ? (
              <>
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Distribusi Pengeluaran</Text>
                  <SpendingDonut data={spendingData} size={160} />
                </View>
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Kategori Terbesar</Text>
                  {spendingData.map((d, i) => (
                    <View key={i} style={styles.categoryRow}>
                      <View style={styles.categoryLeft}>
                        <View style={[styles.colorDot, { backgroundColor: d.color }]} />
                        <Text style={styles.categoryName}>{d.name}</Text>
                      </View>
                      <View style={styles.categoryRight}>
                        <Text style={styles.categoryValue}>{formatCurrency(d.value, true)}</Text>
                        <Text style={styles.categoryPercent}>{d.percentage}%</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.empty}>
                <MaterialIcons name="analytics" size={48} color={Colors.textDisabled} />
                <Text style={styles.emptyTitle}>Belum ada data</Text>
                <Text style={styles.emptyText}>Tambah transaksi untuk melihat analitik</Text>
              </View>
            )}
          </View>
        )}



        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { gap: Spacing.xl, paddingBottom: Spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.base },
  title: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.text },
  period: { fontSize: Typography.sm, color: Colors.textMuted },
  overallCard: { marginHorizontal: Spacing.base, backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border, gap: Spacing.lg },
  overallTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  overallLabel: { fontSize: Typography.sm, color: Colors.textMuted, marginBottom: Spacing.xs },
  overallAmount: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text },
  warningBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.warningSurface, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  warningText: { fontSize: Typography.xs, color: Colors.warning, fontWeight: Typography.semibold },
  safeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.successSurface, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  safeText: { fontSize: Typography.xs, color: Colors.success, fontWeight: Typography.semibold },
  overallStats: { flexDirection: 'row', gap: Spacing.base },
  overallStat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: Typography.xs, color: Colors.textMuted, marginBottom: 2 },
  statValue: { fontSize: Typography.sm, fontWeight: Typography.bold },
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.base, backgroundColor: Colors.card, borderRadius: Radius.md, padding: 3, borderWidth: 1, borderColor: Colors.border },
  tabBtn: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: Typography.medium },
  tabTextActive: { color: '#fff' },
  budgetList: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  analyticsSection: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  sectionCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text, marginBottom: Spacing.xs },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { fontSize: Typography.sm, color: Colors.textSecondary },
  categoryRight: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  categoryValue: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  categoryPercent: { fontSize: Typography.xs, color: Colors.textMuted, width: 36, textAlign: 'right' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textSecondary },
  emptyText: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  addBudget: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primaryMuted, borderRadius: Radius.lg, marginHorizontal: Spacing.base, padding: Spacing.base, borderWidth: 1, borderColor: Colors.primary + '40', borderStyle: 'dashed' },
  addBudgetText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold },
  bottomPad: { height: Spacing.lg },
});
