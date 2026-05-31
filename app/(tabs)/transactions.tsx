import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, Pressable, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { TransactionItem } from '@/components';
import { formatCurrency } from '@/services/db';

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'income', label: 'Masuk' },
  { key: 'expense', label: 'Keluar' },
  { key: 'transfer', label: 'Transfer' },
] as const;

export default function TransactionsScreen() {
  const router = useRouter();
  const { transactions, categories, accounts, loading } = useApp();
  const [filter, setFilter] = useState<'all'|'income'|'expense'|'transfer'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesFilter = filter === 'all' || t.type === filter;
      const matchesSearch = searchQuery === '' ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [transactions, filter, searchQuery]);

  const currentMonthYear = new Date().toISOString().slice(0, 7);
  const thisMonth = transactions.filter((t) => t.date.startsWith(currentMonthYear));
  const totalIncome = thisMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = thisMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const getCat = (catId: string) => categories.find((c) => c.id === catId);
  const getAcc = (accId: string) => accounts.find((a) => a.id === accId);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transaksi</Text>
        <Pressable style={styles.addBtn} onPress={() => router.push('/add-transaction')}>
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Tambah</Text>
        </Pressable>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryIcon, { backgroundColor: Colors.successSurface }]}>
            <MaterialIcons name="trending-up" size={16} color={Colors.success} />
          </View>
          <View>
            <Text style={styles.summaryLabel}>Pemasukan</Text>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>{formatCurrency(totalIncome, true)}</Text>
          </View>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={[styles.summaryIcon, { backgroundColor: Colors.dangerSurface }]}>
            <MaterialIcons name="trending-down" size={16} color={Colors.danger} />
          </View>
          <View>
            <Text style={styles.summaryLabel}>Pengeluaran</Text>
            <Text style={[styles.summaryValue, { color: Colors.danger }]}>{formatCurrency(totalExpense, true)}</Text>
          </View>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={[styles.summaryIcon, { backgroundColor: Colors.primaryMuted }]}>
            <MaterialIcons name="savings" size={16} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.summaryLabel}>Tabungan</Text>
            <Text style={[styles.summaryValue, { color: totalIncome - totalExpense >= 0 ? Colors.primary : Colors.danger }]}>
              {formatCurrency(Math.abs(totalIncome - totalExpense), true)}
            </Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari transaksi..."
          placeholderTextColor={Colors.textDisabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <MaterialIcons name="close" size={16} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Filters */}
      <View style={styles.filterBarWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBarContent}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            category={getCat(item.category_id)}
            account={getAcc(item.account_id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="receipt-long" size={48} color={Colors.textDisabled} />
            <Text style={styles.emptyTitle}>{loading ? 'Memuat...' : 'Tidak ada transaksi'}</Text>
            <Text style={styles.emptyText}>{loading ? '' : 'Tekan Tambah untuk mencatat transaksi pertama'}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.base },
  title: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  addBtnText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.semibold },
  summary: { flexDirection: 'row', marginHorizontal: Spacing.base, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  summaryItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  summaryIcon: { width: 32, height: 32, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontSize: Typography.xs, color: Colors.textMuted },
  summaryValue: { fontSize: Typography.sm, fontWeight: Typography.bold },
  summaryDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.sm },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, marginHorizontal: Spacing.base, paddingHorizontal: Spacing.md, height: 44, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  searchInput: { flex: 1, fontSize: Typography.sm, color: Colors.text },
  filterBarWrap: { height: 48, marginBottom: Spacing.sm },
  filterBarContent: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingVertical: Spacing.xs },
  filterChip: { height: 34, paddingHorizontal: Spacing.base, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  filterActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  filterTextActive: { color: '#fff' },
  listContent: { paddingBottom: Spacing.xxl, paddingHorizontal: Spacing.xs },
  separator: { height: 1, backgroundColor: Colors.borderSubtle, marginHorizontal: Spacing.base },
  empty: { alignItems: 'center', paddingVertical: 80, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textSecondary },
  emptyText: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
