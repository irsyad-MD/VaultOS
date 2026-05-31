import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Transaction, Category, Account } from '@/types';
import { formatCurrency, formatDate } from '@/services/db';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  account?: Account;
  onPress?: () => void;
}

export function TransactionItem({ transaction, category, account, onPress }: TransactionItemProps) {
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const amountColor = isIncome ? Colors.success : isTransfer ? Colors.info : Colors.danger;
  const prefix = isIncome ? '+' : isTransfer ? '' : '-';

  return (
    <Pressable style={({ pressed }) => [styles.container, pressed && styles.pressed]} onPress={onPress}>
      <View style={[styles.iconWrap, { backgroundColor: (category?.color ?? Colors.primary) + '20' }]}>
        <MaterialIcons name={(category?.icon as any) ?? 'receipt'} size={20} color={category?.color ?? Colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{transaction.description}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{category?.name ?? 'Lainnya'}</Text>
          {account ? (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.metaText}>{account.name}</Text>
            </>
          ) : null}
          <Text style={styles.dot}>·</Text>
          <Text style={styles.metaText}>{formatDate(transaction.date)}</Text>
        </View>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {prefix}{formatCurrency(transaction.amount, true)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.base, gap: Spacing.md },
  pressed: { opacity: 0.7, backgroundColor: Colors.cardElevated, borderRadius: Radius.md },
  iconWrap: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info: { flex: 1, gap: 2 },
  title: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  metaText: { fontSize: Typography.xs, color: Colors.textMuted },
  dot: { fontSize: Typography.xs, color: Colors.textDisabled, marginHorizontal: 3 },
  amount: { fontSize: Typography.sm, fontWeight: Typography.bold, flexShrink: 0 },
});
