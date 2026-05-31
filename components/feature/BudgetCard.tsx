import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { ProgressBar } from '@/components/ui';
import { formatCurrency, getProgressPercent } from '@/services/db';

interface BudgetCardProps {
  budget: {
    id: string;
    name: string;
    icon: string;
    color: string;
    budget_limit: number;
    spent: number;
    period: string;
    category_id: string;
    category?: { name: string; icon: string; color: string };
  };
}

export function BudgetCard({ budget }: BudgetCardProps) {
  const spent = budget.spent ?? 0;
  const limit = budget.budget_limit;
  const progress = getProgressPercent(spent, limit);
  const isOver = spent > limit;
  const remaining = limit - spent;
  const displayColor = budget.category?.color ?? budget.color;
  const displayIcon = budget.category?.icon ?? budget.icon;
  const displayName = budget.name;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: displayColor + '20' }]}>
          <MaterialIcons name={displayIcon as any} size={18} color={displayColor} />
        </View>
        <View style={styles.titleGroup}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.period}>{budget.period === 'monthly' ? 'Bulanan' : budget.period === 'weekly' ? 'Mingguan' : 'Tahunan'}</Text>
        </View>
        {isOver ? (
          <View style={styles.overBadge}>
            <Text style={styles.overText}>Lebih</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.progressSection}>
        <ProgressBar progress={progress} color={isOver ? Colors.danger : displayColor} height={7} />
        <View style={styles.progressLabels}>
          <Text style={styles.spentText}>{formatCurrency(spent, true)} dipakai</Text>
          <Text style={styles.percentText}>{progress}%</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.limitText}>Batas: {formatCurrency(limit, true)}</Text>
        <Text style={[styles.remainText, { color: isOver ? Colors.danger : Colors.success }]}>
          {isOver ? `Lebih ${formatCurrency(Math.abs(remaining), true)}` : `Sisa ${formatCurrency(remaining, true)}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconWrap: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  titleGroup: { flex: 1 },
  name: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  period: { fontSize: Typography.xs, color: Colors.textMuted },
  overBadge: { backgroundColor: Colors.dangerSurface, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  overText: { fontSize: Typography.xs, color: Colors.danger, fontWeight: Typography.semibold },
  progressSection: { gap: Spacing.xs },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spentText: { fontSize: Typography.xs, color: Colors.textMuted },
  percentText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.semibold },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  limitText: { fontSize: Typography.xs, color: Colors.textMuted },
  remainText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
});
