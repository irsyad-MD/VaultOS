import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import { Colors, Typography, Spacing, Radius, BankColors } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';

const ACCOUNT_TYPES = [
  { key: 'bank', label: 'Bank', icon: 'account-balance' },
  { key: 'ewallet', label: 'E-Wallet', icon: 'account-balance-wallet' },
  { key: 'cash', label: 'Tunai', icon: 'payments' },
  { key: 'investment', label: 'Investasi', icon: 'trending-up' },
] as const;

const BANK_OPTIONS = [
  { key: 'bca', label: 'BCA', color: '#0066AE' },
  { key: 'bni', label: 'BNI', color: '#F77F00' },
  { key: 'bri', label: 'BRI', color: '#003D82' },
  { key: 'mandiri', label: 'Mandiri', color: '#003D82' },
  { key: 'cimb', label: 'CIMB Niaga', color: '#7B0000' },
  { key: 'permata', label: 'Permata', color: '#C41E3A' },
  { key: 'jago', label: 'Bank Jago', color: '#00B86E' },
  { key: 'seabank', label: 'SeaBank', color: '#2C5BE5' },
  { key: 'blu', label: 'blu by BCA', color: '#004B93' },
  { key: 'ocbc', label: 'OCBC', color: '#C7002B' },
  { key: 'neo', label: 'NeoBank', color: '#0BC4B6' },
];

const EWALLET_OPTIONS = [
  { key: 'gopay', label: 'GoPay', color: '#00AED6' },
  { key: 'ovo', label: 'OVO', color: '#4C3494' },
  { key: 'dana', label: 'DANA', color: '#118EEA' },
  { key: 'shopeepay', label: 'ShopeePay', color: '#EE4D2D' },
  { key: 'linkaja', label: 'LinkAja', color: '#ED1C24' },
  { key: 'paypal', label: 'PayPal', color: '#003087' },
];

function formatInput(raw: string): string {
  const num = raw.replace(/\D/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('id-ID').format(Number(num));
}

function parseInput(formatted: string): number {
  return Number(formatted.replace(/\D/g, ''));
}

export default function AddAccountScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { addAccount } = useApp();

  const [accountType, setAccountType] = useState<'bank'|'ewallet'|'cash'|'investment'>('bank');
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [balanceRaw, setBalanceRaw] = useState('');
  const [selectedBank, setSelectedBank] = useState('bca');
  const [saving, setSaving] = useState(false);

  const balance = parseInput(balanceRaw);
  const canSubmit = name.trim().length > 0 && !saving;

  const getColor = () => {
    if (accountType === 'bank') return BANK_OPTIONS.find((b) => b.key === selectedBank)?.color ?? Colors.primary;
    if (accountType === 'ewallet') return EWALLET_OPTIONS.find((e) => e.key === selectedBank)?.color ?? Colors.cyan;
    if (accountType === 'cash') return Colors.success;
    return Colors.teal;
  };

  const bankKey = accountType === 'cash' ? 'cash' : selectedBank;

  const handleSubmit = async () => {
    if (!canSubmit) { showAlert('Nama Wajib', 'Masukkan nama akun.'); return; }
    setSaving(true);
    try {
      await addAccount({
        name: name.trim(),
        type: accountType,
        bank_key: bankKey,
        balance,
        account_number: accountNumber.trim() || '-',
        color: getColor(),
        is_default: false,
        is_hidden: false,
      });
      showAlert('Akun Ditambahkan', `"${name}" berhasil dibuat.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      showAlert('Gagal', e.message ?? 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  const options = accountType === 'bank' ? BANK_OPTIONS : accountType === 'ewallet' ? EWALLET_OPTIONS : [];

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Type */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Tipe Akun</Text>
          <View style={styles.typeRow}>
            {ACCOUNT_TYPES.map((t) => (
              <Pressable key={t.key} style={[styles.typeBtn, accountType === t.key && styles.typeBtnActive]} onPress={() => { setAccountType(t.key); setSelectedBank(t.key === 'bank' ? 'bca' : t.key === 'ewallet' ? 'gopay' : 'cash'); }}>
                <MaterialIcons name={t.icon as any} size={18} color={accountType === t.key ? '#fff' : Colors.textSecondary} />
                <Text style={[styles.typeText, accountType === t.key && styles.typeTextActive]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Bank / E-wallet selector */}
        {options.length > 0 ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{accountType === 'bank' ? 'Pilih Bank' : 'Pilih E-Wallet'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {options.map((opt) => (
                  <Pressable key={opt.key} style={[styles.bankChip, selectedBank === opt.key && { backgroundColor: opt.color, borderColor: opt.color }]} onPress={() => { setSelectedBank(opt.key); if (!name) setName(opt.label); }}>
                    <Text style={[styles.bankChipText, selectedBank === opt.key && styles.bankChipTextActive]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Nama Akun *</Text>
          <TextInput style={styles.textInput} placeholder="Contoh: BCA Tahapan, GoPay Utama..." placeholderTextColor={Colors.textDisabled} value={name} onChangeText={setName} maxLength={40} />
        </View>

        {accountType !== 'cash' ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nomor Akun / Nomor HP</Text>
            <TextInput style={styles.textInput} placeholder="Contoh: ****4321 atau 0812****567" placeholderTextColor={Colors.textDisabled} value={accountNumber} onChangeText={setAccountNumber} maxLength={20} />
          </View>
        ) : null}

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Saldo Awal</Text>
          <View style={styles.currencyRow}>
            <Text style={styles.currencySymbol}>Rp</Text>
            <TextInput style={styles.currencyInput} placeholder="0" placeholderTextColor={Colors.textDisabled} value={balanceRaw} onChangeText={(v) => setBalanceRaw(formatInput(v))} keyboardType="numeric" />
          </View>
        </View>

        {/* Preview */}
        <View style={[styles.preview, { borderColor: getColor() + '40' }]}>
          <View style={[styles.previewIcon, { backgroundColor: getColor() + '20' }]}>
            <MaterialIcons name={ACCOUNT_TYPES.find((t) => t.key === accountType)?.icon as any} size={28} color={getColor()} />
          </View>
          <View style={styles.previewInfo}>
            <Text style={[styles.previewName, { color: getColor() }]}>{name || 'Nama Akun'}</Text>
            <Text style={styles.previewType}>{ACCOUNT_TYPES.find((t) => t.key === accountType)?.label} · {accountNumber || '-'}</Text>
          </View>
          <Text style={[styles.previewBalance, { color: getColor() }]}>Rp {new Intl.NumberFormat('id-ID').format(parseInput(balanceRaw))}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.submitBtn, { backgroundColor: canSubmit ? getColor() : Colors.cardElevated }, pressed && canSubmit && styles.pressed]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <MaterialIcons name="add" size={20} color={canSubmit ? '#fff' : Colors.textDisabled} />
          <Text style={[styles.submitText, !canSubmit && { color: Colors.textDisabled }]}>{saving ? 'Menyimpan...' : 'Tambah Akun'}</Text>
        </Pressable>
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, gap: Spacing.xl, paddingBottom: Spacing.xxl },
  fieldGroup: { gap: Spacing.sm },
  fieldLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  textInput: { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, fontSize: Typography.sm, color: Colors.text, height: 48 },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  typeBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, height: 42, backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  typeTextActive: { color: '#fff' },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  bankChip: { height: 34, paddingHorizontal: Spacing.md, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  bankChipText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.medium },
  bankChipTextActive: { color: '#fff' },
  currencyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.base, height: 48 },
  currencySymbol: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textMuted, marginRight: Spacing.sm },
  currencyInput: { flex: 1, fontSize: Typography.sm, color: Colors.text },
  preview: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, gap: Spacing.md },
  previewIcon: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  previewInfo: { flex: 1 },
  previewName: { fontSize: Typography.sm, fontWeight: Typography.bold },
  previewType: { fontSize: Typography.xs, color: Colors.textMuted },
  previewBalance: { fontSize: Typography.sm, fontWeight: Typography.bold },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 54, borderRadius: Radius.lg, marginTop: Spacing.md },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  submitText: { fontSize: Typography.md, fontWeight: Typography.bold, color: '#fff' },
});
