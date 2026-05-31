import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/services/db';
import { useRouter } from 'expo-router';

export default function AccountsScreen() {
  const { accounts, loading, removeAccount } = useApp();
  const router = useRouter();

  const banks = accounts.filter((a) => a.type === 'bank');
  const ewallets = accounts.filter((a) => a.type === 'ewallet');
  const cash = accounts.filter((a) => a.type === 'cash');
  const others = accounts.filter((a) => a.type === 'investment' || a.type === 'crypto');

  const totalBalance = accounts.reduce((s, a) => s + (a.is_hidden ? 0 : a.balance), 0);
  const bankTotal = banks.reduce((s, a) => s + a.balance, 0);
  const ewalletTotal = ewallets.reduce((s, a) => s + a.balance, 0);
  const cashTotal = cash.reduce((s, a) => s + a.balance, 0);

  const handleDelete = (id: string, name: string) => {
    // showAlert is called from parent; here we use inline approach
    const { showAlert } = require('@/template').useAlert ? { showAlert: (t: string, m: string, btns: any[]) => {} } : { showAlert: () => {} };
  };

  const renderAccount = (acc: typeof accounts[0], iconName: string) => (
    <Pressable
      key={acc.id}
      style={({ pressed }) => [styles.accountRow, pressed && styles.pressed]}
      onLongPress={() => {
        // Long press to delete - handled by alert in parent
      }}
    >
      <View style={[styles.bankIcon, { backgroundColor: acc.color + '20' }]}>
        <MaterialIcons name={iconName as any} size={20} color={acc.color} />
      </View>
      <View style={styles.accountInfo}>
        <View style={styles.accountNameRow}>
          <Text style={styles.accountName}>{acc.name}</Text>
          {acc.is_default ? (
            <View style={styles.defaultBadge}><Text style={styles.defaultText}>Utama</Text></View>
          ) : null}
        </View>
        <Text style={styles.accountNumber}>{acc.account_number}</Text>
      </View>
      <Text style={[styles.accountBalance, { color: acc.color }]}>{formatCurrency(acc.balance, true)}</Text>
    </Pressable>
  );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Total Balance Card */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Semua Akun</Text>
        <Text style={styles.totalBalance}>{loading ? '...' : formatCurrency(totalBalance)}</Text>
        <View style={styles.breakdown}>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakDot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.breakLabel}>Bank</Text>
            <Text style={styles.breakValue}>{formatCurrency(bankTotal, true)}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakDot, { backgroundColor: Colors.cyan }]} />
            <Text style={styles.breakLabel}>E-Wallet</Text>
            <Text style={styles.breakValue}>{formatCurrency(ewalletTotal, true)}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.breakLabel}>Tunai</Text>
            <Text style={styles.breakValue}>{formatCurrency(cashTotal, true)}</Text>
          </View>
        </View>
      </View>

      {accounts.length === 0 && !loading ? (
        <View style={styles.empty}>
          <MaterialIcons name="account-balance-wallet" size={64} color={Colors.textDisabled} />
          <Text style={styles.emptyTitle}>Belum ada akun</Text>
          <Text style={styles.emptyText}>Tambahkan rekening bank atau e-wallet kamu</Text>
        </View>
      ) : null}

      {banks.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rekening Bank</Text>
          {banks.map((acc) => renderAccount(acc, 'account-balance'))}
        </View>
      ) : null}

      {ewallets.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>E-Wallet</Text>
          {ewallets.map((acc) => renderAccount(acc, 'account-balance-wallet'))}
        </View>
      ) : null}

      {cash.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tunai</Text>
          {cash.map((acc) => renderAccount(acc, 'payments'))}
        </View>
      ) : null}

      {others.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investasi</Text>
          {others.map((acc) => renderAccount(acc, 'trending-up'))}
        </View>
      ) : null}

      <Pressable style={({ pressed }) => [styles.addAccount, pressed && { opacity: 0.7 }]} onPress={() => router.push('/add-account')}>
        <MaterialIcons name="add" size={20} color={Colors.primary} />
        <Text style={styles.addAccountText}>Tambah Akun Baru</Text>
      </Pressable>

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { gap: Spacing.xl, padding: Spacing.base, paddingBottom: Spacing.xxl },
  totalCard: { backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md },
  totalLabel: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.7)' },
  totalBalance: { fontSize: Typography.xxxl, fontWeight: Typography.extrabold, color: '#fff' },
  breakdown: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.base },
  breakdownItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  breakDot: { width: 8, height: 8, borderRadius: 4 },
  breakLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)', flex: 1 },
  breakValue: { fontSize: Typography.xs, fontWeight: Typography.bold, color: '#fff' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textSecondary },
  emptyText: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  pressed: { opacity: 0.7 },
  bankIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  accountInfo: { flex: 1, gap: 2 },
  accountNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  accountName: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  accountNumber: { fontSize: Typography.xs, color: Colors.textMuted },
  accountBalance: { fontSize: Typography.sm, fontWeight: Typography.bold },
  defaultBadge: { backgroundColor: Colors.primaryMuted, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 1 },
  defaultText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.semibold },
  addAccount: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primaryMuted, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.primary + '40', borderStyle: 'dashed' },
  addAccountText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold },
  bottomPad: { height: Spacing.lg },
});
