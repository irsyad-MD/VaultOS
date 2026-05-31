import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  iconColor: string;
  trend?: string;
  trendUp?: boolean;
  style?: ViewStyle;
}

export function StatCard({ label, value, icon, iconColor, trend, trendUp, style }: StatCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + '20' }]}>
        <MaterialIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={styles.value} numberOfLines={1}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      {trend ? (
        <View style={styles.trendRow}>
          <MaterialIcons
            name={trendUp ? 'arrow-upward' : 'arrow-downward'}
            size={11}
            color={trendUp ? Colors.success : Colors.danger}
          />
          <Text style={[styles.trendText, { color: trendUp ? Colors.success : Colors.danger }]}>
            {trend}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  label: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  trendText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },
});
