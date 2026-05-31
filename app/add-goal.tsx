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

const GOAL_ICONS = ['savings','flight','laptop','home','directions-car','school','favorite','trending-up','shopping-bag','star','shield','emoji-events'];
const GOAL_COLORS = ['#22c55e','#6366f1','#f59e0b','#ef4444','#3b82f6','#a855f7','#ec4899','#14b8a6','#f97316','#06b6d4'];
const GOAL_CATEGORIES = ['savings','travel','gadget','property','vehicle','education','health','investment','other'];

function formatInput(raw: string): string {
  const num = raw.replace(/\D/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('id-ID').format(Number(num));
}

function parseInput(formatted: string): number {
  return Number(formatted.replace(/\D/g, ''));
}

export default function AddGoalScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { addGoal } = useApp();

  const [name, setName] = useState('');
  const [targetRaw, setTargetRaw] = useState('');
  const [monthlyRaw, setMonthlyRaw] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('savings');
  const [selectedColor, setSelectedColor] = useState('#22c55e');
  const [selectedCategory, setSelectedCategory] = useState('savings');
  const [saving, setSaving] = useState(false);

  const target = parseInput(targetRaw);
  const monthly = parseInput(monthlyRaw);
  const canSubmit = name.trim().length > 0 && target > 0 && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) { showAlert('Lengkapi Data', 'Masukkan nama dan target tujuan.'); return; }
    setSaving(true);
    try {
      await addGoal({
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
        target_amount: target,
        current_amount: 0,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        category: selectedCategory,
        monthly_contribution: monthly,
      });
      showAlert('Tujuan Dibuat', `"${name}" berhasil ditambahkan.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      showAlert('Gagal', e.message ?? 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Nama Tujuan *</Text>
          <TextInput style={styles.textInput} placeholder="Contoh: Dana darurat, Liburan Jepang..." placeholderTextColor={Colors.textDisabled} value={name} onChangeText={setName} autoFocus maxLength={60} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Target Jumlah *</Text>
          <View style={styles.currencyRow}>
            <Text style={styles.currencySymbol}>Rp</Text>
            <TextInput style={styles.currencyInput} placeholder="0" placeholderTextColor={Colors.textDisabled} value={targetRaw} onChangeText={(v) => setTargetRaw(formatInput(v))} keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Kontribusi per Bulan</Text>
          <View style={styles.currencyRow}>
            <Text style={styles.currencySymbol}>Rp</Text>
            <TextInput style={styles.currencyInput} placeholder="0" placeholderTextColor={Colors.textDisabled} value={monthlyRaw} onChangeText={(v) => setMonthlyRaw(formatInput(v))} keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Target Tanggal (opsional)</Text>
          <TextInput style={styles.textInput} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textDisabled} value={deadline} onChangeText={setDeadline} keyboardType="numbers-and-punctuation" maxLength={10} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Ikon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.iconRow}>
              {GOAL_ICONS.map((ic) => (
                <Pressable key={ic} style={[styles.iconBtn, { backgroundColor: selectedIcon === ic ? selectedColor : Colors.card, borderColor: selectedIcon === ic ? selectedColor : Colors.border }]} onPress={() => setSelectedIcon(ic)}>
                  <MaterialIcons name={ic as any} size={20} color={selectedIcon === ic ? '#fff' : Colors.textSecondary} />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Warna</Text>
          <View style={styles.colorRow}>
            {GOAL_COLORS.map((c) => (
              <Pressable key={c} style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotActive]} onPress={() => setSelectedColor(c)}>
                {selectedColor === c ? <MaterialIcons name="check" size={14} color="#fff" /> : null}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Kategori</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {GOAL_CATEGORIES.map((cat) => (
                <Pressable key={cat} style={[styles.catChip, selectedCategory === cat && { backgroundColor: selectedColor, borderColor: selectedColor }]} onPress={() => setSelectedCategory(cat)}>
                  <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <Pressable
          style={({ pressed }) => [styles.submitBtn, { backgroundColor: canSubmit ? selectedColor : Colors.cardElevated }, pressed && canSubmit && styles.pressed]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <MaterialIcons name="savings" size={20} color={canSubmit ? '#fff' : Colors.textDisabled} />
          <Text style={[styles.submitText, !canSubmit && { color: Colors.textDisabled }]}>{saving ? 'Menyimpan...' : 'Buat Tujuan'}</Text>
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
  currencyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.base, height: 48 },
  currencySymbol: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textMuted, marginRight: Spacing.sm },
  currencyInput: { flex: 1, fontSize: Typography.sm, color: Colors.text },
  iconRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  iconBtn: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  colorRow: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorDotActive: { borderWidth: 3, borderColor: '#fff' },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  catChip: { height: 34, paddingHorizontal: Spacing.md, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.medium },
  chipTextActive: { color: '#fff' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 54, borderRadius: Radius.lg, marginTop: Spacing.md },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  submitText: { fontSize: Typography.md, fontWeight: Typography.bold, color: '#fff' },
});
