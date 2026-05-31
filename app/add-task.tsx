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

const PRIORITIES = [
  { key: 'high', label: 'Tinggi', color: Colors.danger, icon: 'keyboard-double-arrow-up' },
  { key: 'medium', label: 'Sedang', color: Colors.warning, icon: 'keyboard-arrow-up' },
  { key: 'low', label: 'Rendah', color: Colors.success, icon: 'keyboard-arrow-down' },
] as const;

const TASK_CATS = ['personal','work','finance','health','education','social','other'];

export default function AddTaskScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { addTask } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low'|'medium'|'high'>('medium');
  const [category, setCategory] = useState('personal');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const canSubmit = title.trim().length > 0 && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) { showAlert('Judul Wajib Diisi', 'Masukkan judul tugas.'); return; }
    setSaving(true);
    try {
      await addTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        status: 'todo',
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        category,
        tags: [],
      });
      showAlert('Tugas Ditambahkan', `"${title}" berhasil disimpan.`, [
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
          <Text style={styles.fieldLabel}>Judul Tugas *</Text>
          <TextInput style={styles.textInput} placeholder="Apa yang perlu dilakukan?" placeholderTextColor={Colors.textDisabled} value={title} onChangeText={setTitle} autoFocus maxLength={100} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Deskripsi</Text>
          <TextInput style={[styles.textInput, { height: 80, paddingTop: Spacing.md }]} placeholder="Detail tugas..." placeholderTextColor={Colors.textDisabled} value={description} onChangeText={setDescription} multiline numberOfLines={3} textAlignVertical="top" />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Prioritas</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <Pressable key={p.key} style={[styles.priorityBtn, priority === p.key && { backgroundColor: p.color, borderColor: p.color }]} onPress={() => setPriority(p.key)}>
                <MaterialIcons name={p.icon as any} size={16} color={priority === p.key ? '#fff' : p.color} />
                <Text style={[styles.priorityText, priority === p.key && styles.priorityTextActive]}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Kategori</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {TASK_CATS.map((cat) => (
                <Pressable key={cat} style={[styles.catChip, category === cat && styles.catChipActive]} onPress={() => setCategory(cat)}>
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Batas Waktu (opsional)</Text>
          <TextInput style={styles.textInput} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textDisabled} value={dueDate} onChangeText={setDueDate} keyboardType="numbers-and-punctuation" maxLength={10} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.submitBtn, !canSubmit && styles.submitDisabled, pressed && canSubmit && styles.pressed]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <MaterialIcons name="check-box" size={20} color={canSubmit ? '#fff' : Colors.textDisabled} />
          <Text style={[styles.submitText, !canSubmit && { color: Colors.textDisabled }]}>{saving ? 'Menyimpan...' : 'Simpan Tugas'}</Text>
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
  priorityRow: { flexDirection: 'row', gap: Spacing.md },
  priorityBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, height: 44, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  priorityText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  priorityTextActive: { color: '#fff' },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  catChip: { height: 34, paddingHorizontal: Spacing.md, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.medium },
  chipTextActive: { color: '#fff' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 54, borderRadius: Radius.lg, backgroundColor: Colors.primary, marginTop: Spacing.md },
  submitDisabled: { backgroundColor: Colors.cardElevated },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  submitText: { fontSize: Typography.md, fontWeight: Typography.bold, color: '#fff' },
});
