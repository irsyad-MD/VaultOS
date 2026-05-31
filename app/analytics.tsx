import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Share, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, getProgressPercent } from '@/services/db';
import { SpendingDonut, IncomeExpenseChart } from '@/components';

function buildCSV(transactions: any[], categories: any[], accounts: any[]): string {
  const header = 'Tanggal,Tipe,Deskripsi,Kategori,Akun,Nominal,Catatan';
  const rows = transactions.map((t) => {
    const cat = categories.find((c: any) => c.id === t.category_id)?.name ?? 'Lainnya';
    const acc = accounts.find((a: any) => a.id === t.account_id)?.name ?? '-';
    const date = new Date(t.date).toLocaleDateString('id-ID');
    return [date, t.type, `"${t.description}"`, cat, acc, t.amount, `"${t.notes ?? ''}"`].join(',');
  });
  return [header, ...rows].join('\n');
}

function buildTransactionText(transactions: any[], categories: any[], accounts: any[]): string {
  const lines = [
    'LAPORAN TRANSAKSI VAULTOS',
    '========================',
    `Diekspor: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    `Total: ${transactions.length} transaksi`,
    '',
    ...transactions.map((t) => {
      const cat = categories.find((c: any) => c.id === t.category_id)?.name ?? 'Lainnya';
      const acc = accounts.find((a: any) => a.id === t.account_id)?.name ?? '-';
      const date = new Date(t.date).toLocaleDateString('id-ID');
      const prefix = t.type === 'income' ? '+' : t.type === 'transfer' ? '' : '-';
      return `${date} | ${t.description} | ${cat} | ${acc} | ${prefix}${formatCurrency(t.amount, true)}`;
    }),
  ];
  return lines.join('\n');
}

export default function AnalyticsScreen() {
  const { transactions, categories, accounts, budgets, goals } = useApp();
  const [activeTab, setActiveTab] = useState<'overview'|'transactions'|'budgets'>('overview');

  const now = new Date();
  const currentMonthYear = now.toISOString().slice(0, 7);

  const thisMonthTxns = transactions.filter((t) => t.date.startsWith(currentMonthYear));
  const income = thisMonthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = thisMonthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = income - expense;

  // Monthly trend (last 6 months)
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const ym = d.toISOString().slice(0, 7);
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const monthTxns = transactions.filter((t) => t.date.startsWith(ym));
    return {
      month: months[d.getMonth()],
      income: monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  });

  // Spending by category
  const catSpend = categories
    .map((cat) => {
      const val = thisMonthTxns.filter((t) => t.type === 'expense' && t.category_id === cat.id).reduce((s, t) => s + t.amount, 0);
      return { name: cat.name, value: val, color: cat.color, percentage: expense > 0 ? Math.round((val / expense) * 100) : 0 };
    })
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const handleExport = async () => {
    try {
      const text = buildTransactionText(transactions, categories, accounts);
      await Share.share({
        message: text,
        title: 'Laporan Transaksi VaultOS',
      });
    } catch (e) {
      Alert.alert('Gagal Export', 'Tidak dapat membagikan laporan.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const csv = buildCSV(transactions, categories, accounts);
      await Share.share({
        message: csv,
        title: 'VaultOS_Transaksi.csv',
      });
    } catch (e) {
      Alert.alert('Gagal Export', 'Tidak dapat membagikan CSV.');
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderColor: Colors.success + '40' }]}>
          <MaterialIcons name="trending-up" size={20} color={Colors.success} />
          <Text style={styles.summaryLabel}>Pemasukan</Text>
          <Text style={[styles.summaryVal, { color: Colors.success }]}>{formatCurrency(income, true)}</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: Colors.danger + '40' }]}>
          <MaterialIcons name="trending-down" size={20} color={Colors.danger} />
          <Text style={styles.summaryLabel}>Pengeluaran</Text>
          <Text style={[styles.summaryVal, { color: Colors.danger }]}>{formatCurrency(expense, true)}</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: Colors.primary + '40' }]}>
          <MaterialIcons name="savings" size={20} color={Colors.primary} />
          <Text style={styles.summaryLabel}>Tabungan</Text>
          <Text style={[styles.summaryVal, { color: savings >= 0 ? Colors.primary : Colors.danger }]}>{formatCurrency(Math.abs(savings), true)}</Text>
        </View>
      </View>

      {/* Tab */}
      <View style={styles.tabRow}>
        {(['overview','transactions','budgets'] as const).map((tab) => (
          <Pressable key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'overview' ? 'Ringkasan' : tab === 'transactions' ? 'Transaksi' : 'Anggaran'}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'overview' ? (
        <>
          {/* Income vs Expense Chart */}
          {chartData.some((d) => d.income > 0 || d.expense > 0) ? (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Tren 6 Bulan</Text>
              <IncomeExpenseChart data={chartData} />
            </View>
          ) : null}

          {/* Category Spending */}
          {catSpend.length > 0 ? (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Distribusi Pengeluaran Bulan Ini</Text>
              <SpendingDonut data={catSpend} />
              {catSpend.map((c, i) => (
                <View key={i} style={styles.catRow}>
                  <View style={[styles.catDot, { backgroundColor: c.color }]} />
                  <Text style={styles.catName}>{c.name}</Text>
                  <Text style={styles.catPct}>{c.percentage}%</Text>
                  <Text style={styles.catVal}>{formatCurrency(c.value, true)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Goals Progress */}
          {goals.length > 0 ? (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Tujuan Keuangan</Text>
              {goals.map((g) => {
                const p = getProgressPercent(g.current_amount, g.target_amount);
                return (
                  <View key={g.id} style={styles.goalRow}>
                    <View style={[styles.goalDot, { backgroundColor: g.color + '20' }]}>
                      <MaterialIcons name={g.icon as any} size={16} color={g.color} />
                    </View>
                    <View style={styles.goalInfo}>
                      <View style={styles.goalTitleRow}>
                        <Text style={styles.goalName}>{g.name}</Text>
                        <Text style={[styles.goalPct, { color: g.color }]}>{p}%</Text>
                      </View>
                      <View style={styles.progressBg}>
                        <View style={[styles.progressFill, { width: `${p}%` as any, backgroundColor: g.color }]} />
                      </View>
                      <Text style={styles.goalAmounts}>{formatCurrency(g.current_amount, true)} / {formatCurrency(g.target_amount, true)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {transactions.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="analytics" size={64} color={Colors.textDisabled} />
              <Text style={styles.emptyTitle}>Belum ada data</Text>
              <Text style={styles.emptyText}>Tambah transaksi untuk melihat analitik</Text>
            </View>
          ) : null}
        </>
      ) : activeTab === 'transactions' ? (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Semua Transaksi ({transactions.length})</Text>
          {transactions.slice(0, 50).map((t) => {
            const cat = categories.find((c) => c.id === t.category_id);
            const isIncome = t.type === 'income';
            return (
              <View key={t.id} style={styles.txnRow}>
                <View style={[styles.txnIcon, { backgroundColor: (cat?.color ?? Colors.primary) + '20' }]}>
                  <MaterialIcons name={(cat?.icon as any) ?? 'receipt'} size={16} color={cat?.color ?? Colors.primary} />
                </View>
                <View style={styles.txnInfo}>
                  <Text style={styles.txnDesc} numberOfLines={1}>{t.description}</Text>
                  <Text style={styles.txnDate}>{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
                <Text style={[styles.txnAmount, { color: isIncome ? Colors.success : Colors.danger }]}>
                  {isIncome ? '+' : '-'}{formatCurrency(t.amount, true)}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Anggaran Bulan Ini ({budgets.length})</Text>
          {budgets.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada anggaran untuk bulan ini</Text>
          ) : (
            budgets.map((b) => {
              const cat = categories.find((c) => c.id === b.category_id);
              const spent = thisMonthTxns.filter((t) => t.type === 'expense' && t.category_id === b.category_id).reduce((s, t) => s + t.amount, 0);
              const pct = getProgressPercent(spent, b.budget_limit);
              return (
                <View key={b.id} style={styles.budgetRow}>
                  <View style={styles.budgetInfo}>
                    <Text style={styles.budgetName}>{b.name}</Text>
                    <Text style={styles.budgetAmounts}>{formatCurrency(spent, true)} / {formatCurrency(b.budget_limit, true)}</Text>
                  </View>
                  <View style={styles.budgetBarBg}>
                    <View style={[styles.budgetBarFill, { width: `${Math.min(100, pct)}%` as any, backgroundColor: pct > 100 ? Colors.danger : b.color }]} />
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Export Buttons */}
      <View style={styles.exportSection}>
        <Text style={styles.exportTitle}>Ekspor Laporan</Text>
        <View style={styles.exportRow}>
          <Pressable style={({ pressed }) => [styles.exportBtn, pressed && styles.pressed]} onPress={handleExport}>
            <MaterialIcons name="share" size={18} color={Colors.primary} />
            <Text style={styles.exportBtnText}>Bagikan Laporan</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.exportBtn, pressed && styles.pressed]} onPress={handleExportCSV}>
            <MaterialIcons name="table-chart" size={18} color={Colors.success} />
            <Text style={[styles.exportBtnText, { color: Colors.success }]}>Export CSV</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, gap: Spacing.xl, paddingBottom: Spacing.xxl },
  summaryRow: { flexDirection: 'row', gap: Spacing.md },
  summaryCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, gap: Spacing.xs, alignItems: 'center' },
  summaryLabel: { fontSize: Typography.xs, color: Colors.textMuted },
  summaryVal: { fontSize: Typography.sm, fontWeight: Typography.bold },
  tabRow: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.md, padding: 3, borderWidth: 1, borderColor: Colors.border, gap: 3 },
  tabBtn: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.medium },
  tabTextActive: { color: '#fff' },
  chartCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  chartTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary },
  catPct: { fontSize: Typography.xs, color: Colors.textMuted, width: 36, textAlign: 'right' },
  catVal: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text, width: 70, textAlign: 'right' },
  goalRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  goalDot: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  goalInfo: { flex: 1, gap: 4 },
  goalTitleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  goalName: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.text },
  goalPct: { fontSize: Typography.xs, fontWeight: Typography.bold },
  progressBg: { height: 6, backgroundColor: Colors.cardElevated, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  goalAmounts: { fontSize: Typography.xs, color: Colors.textMuted },
  txnRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  txnIcon: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  txnInfo: { flex: 1 },
  txnDesc: { fontSize: Typography.sm, color: Colors.text, fontWeight: Typography.medium },
  txnDate: { fontSize: Typography.xs, color: Colors.textMuted },
  txnAmount: { fontSize: Typography.sm, fontWeight: Typography.bold },
  budgetRow: { gap: Spacing.xs, paddingVertical: Spacing.xs },
  budgetInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetName: { fontSize: Typography.sm, color: Colors.text, fontWeight: Typography.medium },
  budgetAmounts: { fontSize: Typography.xs, color: Colors.textMuted },
  budgetBarBg: { height: 8, backgroundColor: Colors.cardElevated, borderRadius: 4, overflow: 'hidden' },
  budgetBarFill: { height: '100%', borderRadius: 4 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textSecondary },
  emptyText: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  exportSection: { gap: Spacing.md },
  exportTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  exportRow: { flexDirection: 'row', gap: Spacing.md },
  exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, height: 52 },
  exportBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.primary },
  pressed: { opacity: 0.7 },
});
