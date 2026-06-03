import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { formatCurrency } from '@/services/financeService';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface BalanceCardProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  chartData?: { value: number }[];
}

// Renders an income-vs-expense trend line:
// - line goes UP when income > expense (positive net)
// - line goes DOWN when income < expense (negative net)
// - uses semi-transparent white stroke for "glass" effect
function TrendLineChart({ data }: { data: { value: number }[] }) {
  if (!data || data.length < 2) return null;

  const width = 220;
  const height = 48;
  const padding = 6;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => ({
    x: padding + (i / (values.length - 1)) * chartW,
    // Invert Y: higher value → higher on screen (lower Y coordinate)
    y: padding + chartH - ((v - min) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  // Gradient fill below the line
  const fillPath = linePath
    + ` L ${points[points.length - 1].x.toFixed(1)} ${(padding + chartH).toFixed(1)}`
    + ` L ${points[0].x.toFixed(1)} ${(padding + chartH).toFixed(1)} Z`;

  // Determine overall trend color
  const lastVal = values[values.length - 1];
  const firstVal = values[0];
  const isPositive = lastVal >= firstVal;
  const lineColor = isPositive ? 'rgba(255,255,255,0.9)' : 'rgba(255,160,160,0.85)';
  const fillStartColor = isPositive ? 'rgba(255,255,255,0.25)' : 'rgba(255,80,80,0.25)';

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={fillStartColor} stopOpacity={1} />
          <Stop offset="100%" stopColor="rgba(0,0,0,0)" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {/* Fill area */}
      <Path d={fillPath} fill="url(#trendFill)" />
      {/* Trend line */}
      <Path
        d={linePath}
        stroke={lineColor}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BalanceCard({
  totalBalance,
  monthlyIncome,
  monthlyExpense,
  chartData,
}: BalanceCardProps) {
  const [hidden, setHidden] = useState(false);

  // Determine if current month is net positive or negative
  const netSavings = monthlyIncome - monthlyExpense;
  const isPositive = netSavings >= 0;

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
        <View style={styles.headerRight}>
          {/* Trend indicator */}
          <View style={[styles.trendBadge, { backgroundColor: isPositive ? 'rgba(255,255,255,0.18)' : 'rgba(255,80,80,0.22)' }]}>
            <MaterialIcons
              name={isPositive ? 'trending-up' : 'trending-down'}
              size={14}
              color={isPositive ? '#fff' : '#fca5a5'}
            />
            <Text style={[styles.trendText, { color: isPositive ? '#fff' : '#fca5a5' }]}>
              {isPositive ? '+' : ''}{formatCurrency(netSavings, true)}
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
      </View>

      {/* Trend chart — line goes up for income, down for expense */}
      {chartData && chartData.length >= 2 ? (
        <View style={styles.chartRow}>
          <TrendLineChart data={chartData} />
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
  headerRight: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  trendText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
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
    marginLeft: -4,
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
