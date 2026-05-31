import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { formatCurrency } from '@/services/financeService';
import { MiniLineChart } from './MiniLineChart';

interface BalanceCardProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  chartData?: { value: number }[];
}

export function BalanceCard({
  totalBalance,
  monthlyIncome,
  monthlyExpense,
  chartData,
}: BalanceCardProps) {
  const [hidden, setHidden] = useState(false);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>Total Saldo</Text>
          <Text style={styles.balance}>
            {hidden ? 'Rp ••••••••' : formatCurrency(totalBalance)}
          </Text>
        </View>
        <Pressable onPress={() => setHidden((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
          <MaterialIcons
            name={hidden ? 'visibility-off' : 'visibility'}
            size={20}
            color={Colors.textSecondary}
          />
        </Pressable>
      </View>

      {/* Chart */}
      {chartData && chartData.length > 1 ? (
        <View style={styles.chartRow}>
          <MiniLineChart data={chartData} color={Colors.primaryLight} width={200} height={44} />
        </View>
      ) : null}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: Colors.successSurface }]}>
            <MaterialIcons name="trending-up" size={14} color={Colors.success} />
          </View>
          <View>
            <Text style={styles.statLabel}>Pemasukan</Text>
            <Text style={[styles.statValue, { color: Colors.success }]}>
              {hidden ? '••••' : formatCurrency(monthlyIncome, true)}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: Colors.dangerSurface }]}>
            <MaterialIcons name="trending-down" size={14} color={Colors.danger} />
          </View>
          <View>
            <Text style={styles.statLabel}>Pengeluaran</Text>
            <Text style={[styles.statValue, { color: Colors.danger }]}>
              {hidden ? '••••' : formatCurrency(monthlyExpense, true)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.base,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    backgroundColor: Colors.primary,
    overflow: 'hidden',
    ...Shadows.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.xs,
  },
  balance: {
    fontSize: Typography.xxxl,
    fontWeight: Typography.extrabold,
    color: '#fff',
    letterSpacing: -0.5,
  },
  eyeBtn: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartRow: {
    marginBottom: Spacing.base,
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: Radius.md,
    padding: Spacing.base,
    gap: Spacing.base,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  statValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
