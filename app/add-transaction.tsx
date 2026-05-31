import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, getProgressPercent } from '@/services/db';
import { scheduleEventReminder } from '@/services/notificationService';

type TxType = 'expense' | 'income' | 'transfer';

const TYPE_CONFIG: Record<TxType, { label: string; color: string; icon: string }> = {
  expense: { label: 'Pengeluaran', color: Colors.danger, icon: 'trending-down' },
  income: { label: 'Pemasukan', color: Colors.success, icon: 'trending-up' },
  transfer: { label: 'Transfer', color: Colors.info, icon: 'swap-horiz' },
};

function formatInput(raw: string): string {
  const num = raw.replace(/\D/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('id-ID').format(Number(num));
}

function parseInput(formatted: string): number {
  return Number(formatted.replace(/\D/g, ''));
}

export default function AddTransactionScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { categories, accounts, addTransaction } = useApp();

  const [txType, setTxType] = useState<TxType>('expense');
  const [amountRaw, setAmountRaw] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredCats = categories.filter((c) => c.type === txType || c.type === 'both');
  const amount = parseInput(amountRaw);
  const canSubmit = amount > 0 && description.trim().length > 0 && selectedAccount !== '' && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) {
      showAlert('Lengkapi Data', 'Masukkan nominal, deskripsi, dan pilih akun.');
      return;
    }
    if (txType === 'transfer' && toAccount === selectedAccount) {
      showAlert('Akun Sama', 'Pilih akun tujuan yang berbeda.');
      return;
    }
    setSaving(true);
    try {
      await addTransaction({
        type: txType,
        amount,
        description: description.trim(),
        category_id: selectedCategory,
        account_id: selectedAccount,
        to_account_id: txType === 'transfer' ? toAccount : undefined,
        date: new Date().toISOString(),
        tags: [],
        notes: notes.trim(),
      });
      showAlert('Berhasil', `${TYPE_CONFIG[txType].label} ${formatCurrency(amount)} dicatat.`, [
        { text: 'Tambah Lagi', style: 'default', onPress: () => { setAmountRaw(''); setDescription(''); setNotes(''); setSelectedCategory(''); } },
        { text: 'Selesai', style: 'cancel', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      showAlert('Gagal', e.message ?? 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  const typeColor = TYPE_CONFIG[txType].color;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type Selector */}
        <View style={styles.typeRow}>
          {(Object.keys(TYPE_CONFIG) as TxType[]).map((t) => (
            <Pressable
              key={t}
              style={[styles.typeBtn, txType === t && { backgroundColor: TYPE_CONFIG[t].color, borderColor: TYPE_CONFIG[t].color }]}
              onPress={() => { setTxType(t); setSelectedCategory(''); }}
            >
              <MaterialIcons name={TYPE_CONFIG[t].icon as any} size={16} color={txType === t ? '#fff' : Colors.textSecondary} />
              <Text style={[styles.typeBtnText, txType === t && styles.typeBtnTextActive]}>{TYPE_CONFIG[t].label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Amount */}
        <View style={[styles.amountCard, { borderColor: typeColor + '60' }]}>
          <Text style={styles.fieldLabel}>Nominal</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currency, { color: typeColor }]}>Rp</Text>
            <TextInput
              style={[styles.amountInput, { color: typeColor }]}
              placeholder="0"
              placeholderTextColor={Colors.textDisabled}
              value={amountRaw}
              onChangeText={(v) => setAmountRaw(formatInput(v))}
              keyboardType="numeric"
              autoFocus
            />
          </View>
          {amount > 0 ? <Text style={styles.amountSpelled}>{formatCurrency(amount)}</Text> : null}
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Deskripsi *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Contoh: Makan siang..."
            placeholderTextColor={Colors.textDisabled}
            value={description}
            onChangeText={setDescription}
            maxLength={100}
          />
        </View>

        {/* Category */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Kategori</Text>
          {filteredCats.length === 0 ? (
            <Text style={styles.emptyText}>Tidak ada kategori tersedia</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {filteredCats.map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={[styles.categoryChip, selectedCategory === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <MaterialIcons name={cat.icon as any} size={14} color={selectedCategory === cat.id ? '#fff' : cat.color} />
                    <Text style={[styles.chipText, { color: selectedCategory === cat.id ? '#fff' : Colors.textSecondary }]}>{cat.name}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Account */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Dari Akun *</Text>
          {accounts.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada akun. Tambah akun terlebih dahulu.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {accounts.map((acc) => (
                  <Pressable
                    key={acc.id}
                    style={[styles.accountChip, selectedAccount === acc.id && { borderColor: acc.color, backgroundColor: acc.color + '15' }]}
                    onPress={() => setSelectedAccount(acc.id)}
                  >
                    <MaterialIcons name="account-balance-wallet" size={14} color={selectedAccount === acc.id ? acc.color : Colors.textMuted} />
                    <Text style={[styles.chipText, { color: selectedAccount === acc.id ? acc.color : Colors.textSecondary }]}>{acc.name}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* To Account (transfer only) */}
        {txType === 'transfer' ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Ke Akun *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {accounts.filter((a) => a.id !== selectedAccount).map((acc) => (
                  <Pressable
                    key={acc.id}
                    style={[styles.accountChip, toAccount === acc.id && { borderColor: acc.color, backgroundColor: acc.color + '15' }]}
                    onPress={() => setToAccount(acc.id)}
                  >
                    <MaterialIcons name="account-balance-wallet" size={14} color={toAccount === acc.id ? acc.color : Colors.textMuted} />
                    <Text style={[styles.chipText, { color: toAccount === acc.id ? acc.color : Colors.textSecondary }]}>{acc.name}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        ) : null}

        {/* Notes */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Catatan (opsional)</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            placeholder="Tambahkan catatan..."
            placeholderTextColor={Colors.textDisabled}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            { backgroundColor: canSubmit ? typeColor : Colors.cardElevated },
            pressed && canSubmit && styles.pressed,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <MaterialIcons name={TYPE_CONFIG[txType].icon as any} size={20} color={canSubmit ? '#fff' : Colors.textDisabled} />
          <Text style={[styles.submitText, { color: canSubmit ? '#fff' : Colors.textDisabled }]}>
            {saving ? 'Menyimpan...' : `Simpan ${TYPE_CONFIG[txType].label}`}
          </Text>
        </Pressable>
        <View style={styles.bottomPad} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, gap: Spacing.xl, paddingBottom: Spacing.xxl },
  typeRow: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.md, padding: 3, borderWidth: 1, borderColor: Colors.border, gap: 3 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40, borderRadius: Radius.sm, gap: Spacing.xs, borderWidth: 1, borderColor: 'transparent' },
  typeBtnText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.medium },
  typeBtnTextActive: { color: '#fff' },
  amountCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1.5, gap: Spacing.sm },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  currency: { fontSize: Typography.xxl, fontWeight: Typography.bold },
  amountInput: { flex: 1, fontSize: Typography.xxxl, fontWeight: Typography.extrabold, padding: 0 },
  amountSpelled: { fontSize: Typography.xs, color: Colors.textMuted },
  fieldGroup: { gap: Spacing.sm },
  fieldLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  textInput: { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, fontSize: Typography.sm, color: Colors.text, height: 48 },
  notesInput: { height: 80, paddingTop: Spacing.md },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.card, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border, height: 36 },
  accountChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.card, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border, height: 36 },
  chipText: { fontSize: Typography.xs, fontWeight: Typography.medium },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 54, borderRadius: Radius.lg, marginTop: Spacing.md },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  submitText: { fontSize: Typography.md, fontWeight: Typography.bold },
  emptyText: { fontSize: Typography.sm, color: Colors.textMuted, fontStyle: 'italic' },
  bottomPad: { height: Spacing.xl },
});
