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

const HABIT_ICONS = ['fitness-center','menu-book','self-improvement','water-drop','no-meals','bedtime','code','brush','music-note','directions-run','local-cafe','emoji-nature','psychology','savings','language'];
const HABIT_COLORS = ['#22c55e','#6366f1','#a855f7','#ef4444','#3b82f6','#f59e0b','#ec4899','#14b8a6','#f97316','#06b6d4'];

export default function AddHabitScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { addHabit } = useApp();

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('fitness-center');
  const [selectedColor, setSelectedColor] = useState('#22c55e');
  const [frequency, setFrequency] = useState<'daily'|'weekly'>('daily');
  const [saving, setSaving] = useState(false);

  const canSubmit = name.trim().length > 0 && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) { showAlert('Nama Wajib', 'Masukkan nama kebiasaan.'); return; }
    setSaving(true);
    try {
      await addHabit({
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
        frequency,
        target_count: 1,
      });
      showAlert('Kebiasaan Ditambahkan', `"${name}" berhasil disimpan.`, [
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

        {/* Preview */}
        <View style={[styles.preview, { borderColor: selectedColor + '40' }]}>
          <View style={[styles.previewIcon, { backgroundColor: selectedColor + '20' }]}>
            <MaterialIcons name={selectedIcon as any} size={36} color={selectedColor} />
          </View>
          <Text style={[styles.previewName, { color: selectedColor }]}>{name || 'Nama Kebiasaan'}</Text>
          <Text style={styles.previewFreq}>{frequency === 'daily' ? 'Setiap Hari' : 'Setiap Minggu'}</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Nama Kebiasaan *</Text>
          <TextInput style={styles.textInput} placeholder="Contoh: Olahraga 30 menit..." placeholderTextColor={Colors.textDisabled} value={name} onChangeText={setName} autoFocus maxLength={60} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Frekuensi</Text>
          <View style={styles.freqRow}>
            {(['daily','weekly'] as const).map((f) => (
              <Pressable key={f} style={[styles.freqBtn, frequency === f && { backgroundColor: selectedColor, borderColor: selectedColor }]} onPress={() => setFrequency(f)}>
                <MaterialIcons name={f === 'daily' ? 'today' : 'date-range'} size={16} color={frequency === f ? '#fff' : Colors.textSecondary} />
                <Text style={[styles.freqText, frequency === f && styles.freqTextActive]}>{f === 'daily' ? 'Harian' : 'Mingguan'}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Ikon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.iconRow}>
              {HABIT_ICONS.map((ic) => (
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
            {HABIT_COLORS.map((c) => (
              <Pressable key={c} style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotActive]} onPress={() => setSelectedColor(c)}>
                {selectedColor === c ? <MaterialIcons name="check" size={14} color="#fff" /> : null}
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.submitBtn, { backgroundColor: canSubmit ? selectedColor : Colors.cardElevated }, pressed && canSubmit && styles.pressed]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <MaterialIcons name="add-circle" size={20} color={canSubmit ? '#fff' : Colors.textDisabled} />
          <Text style={[styles.submitText, !canSubmit && { color: Colors.textDisabled }]}>{saving ? 'Menyimpan...' : 'Tambah Kebiasaan'}</Text>
        </Pressable>
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, gap: Spacing.xl, paddingBottom: Spacing.xxl },
  preview: { alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xxl, borderWidth: 1, gap: Spacing.md },
  previewIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  previewName: { fontSize: Typography.lg, fontWeight: Typography.bold },
  previewFreq: { fontSize: Typography.sm, color: Colors.textMuted },
  fieldGroup: { gap: Spacing.sm },
  fieldLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  textInput: { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, fontSize: Typography.sm, color: Colors.text, height: 48 },
  freqRow: { flexDirection: 'row', gap: Spacing.md },
  freqBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, height: 44, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  freqText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  freqTextActive: { color: '#fff' },
  iconRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  iconBtn: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  colorRow: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorDotActive: { borderWidth: 3, borderColor: '#fff' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 54, borderRadius: Radius.lg, marginTop: Spacing.md },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  submitText: { fontSize: Typography.md, fontWeight: Typography.bold, color: '#fff' },
});
