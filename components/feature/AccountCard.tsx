import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { Account } from '@/types';
import { formatCurrency } from '@/services/financeService';

const BANK_ICONS: Record<string, string> = {
  bca: 'account-balance',
  bni: 'account-balance',
  bri: 'account-balance',
  mandiri: 'account-balance',
  cimb: 'account-balance',
  permata: 'account-balance',
  jago: 'smartphone',
  seabank: 'smartphone',
  blu: 'smartphone',
  ocbc: 'account-balance',
  neo: 'smartphone',
  gopay: 'account-balance-wallet',
  ovo: 'account-balance-wallet',
  dana: 'account-balance-wallet',
  shopeepay: 'account-balance-wallet',
  linkaja: 'account-balance-wallet',
  paypal: 'payment',
  cash: 'payments',
};

interface AccountCardProps {
  account: Account;
  onPress?: () => void;
  compact?: boolean;
}

export function AccountCard({ account, onPress, compact = false }: AccountCardProps) {
  const icon = (BANK_ICONS[account.bankKey] ?? 'account-balance') as any;

  if (compact) {
    return (
      <Pressable
        style={({ pressed }) => [styles.compact, pressed && styles.pressed]}
        onPress={onPress}
      >
        <View style={[styles.compactIcon, { backgroundColor: account.color + '25' }]}>
          <MaterialIcons name={icon} size={18} color={account.color} />
        </View>
        <View>
          <Text style={styles.compactName} numberOfLines={1}>{account.name}</Text>
          <Text style={[styles.compactBalance, { color: account.color }]}>
            {formatCurrency(account.balance, true)}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: account.color + '25' }]}>
          <MaterialIcons name={icon} size={22} color={account.color} />
        </View>
        {account.isDefault ? (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Utama</Text>
          </View>
        ) : null}
      </View>

      {/* Balance */}
      <Text style={styles.balance}>{formatCurrency(account.balance)}</Text>

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.name}>{account.name}</Text>
          <Text style={styles.number}>{account.accountNumber}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={18} color={Colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    width: 180,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultBadge: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  defaultText: {
    fontSize: Typography.xs,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  balance: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.text,
  },
  number: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    width: 140,
  },
  compactIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactName: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  compactBalance: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
});
