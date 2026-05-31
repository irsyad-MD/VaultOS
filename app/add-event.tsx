import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ScrollView, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { scheduleEventReminder, sendLocalNotification } from '@/services/notificationService';

const EVENT_CATEGORIES = [
  { key: 'work', label: 'Pekerjaan', icon: 'work', color: '#6366f1' },
  { key: 'health', label: 'Kesehatan', icon: 'favorite', color: '#ef4444' },
  { key: 'finance', label: 'Keuangan', icon: 'account-balance-wallet', color: '#22c55e' },
  { key: 'personal', label: 'Personal', icon: 'person', color: '#f59e0b' },
  { key: 'education', label: 'Pendidikan', icon: 'school', color: '#06b6d4' },
  { key: 'social', label: 'Sosial', icon: 'people', color: '#ec4899' },
  { key: 'other', label: 'Lainnya', icon: 'label', color: '#71717a' },
];

const EVENT_COLORS = ['#6366f1','#22c55e','#ef4444','#f59e0b','#3b82f6','#a855f7','#ec4899','#14b8a6'];

const REMINDER_OPTIONS = [
  { value: 0, label: 'Tidak ada' },
  { value: 5, label: '5 menit' },
  { value: 15, label: '15 menit' },
  { value: 30, label: '30 menit' },
  { value: 60, label: '1 jam' },
  { value: 1440, label: '1 hari' },
];

export default function AddEventScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { addEvent } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [selectedCategory, setSelectedCategory] = useState('personal');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [isRecurring, setIsRecurring] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSubmit = title.trim().length > 0 && date.length === 10 && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) {
      showAlert('Lengkapi Data', 'Masukkan judul dan tanggal jadwal.');
      return;
    }

    setSaving(true);
    try {
      const eventDate = new Date(`${date}T${startTime}:00`);
      await addEvent({
        title: title.trim(),
        description: description.trim(),
        date: eventDate.toISOString(),
        start_time: startTime,
        end_time: endTime,
        color: selectedColor,
        category: selectedCategory,
        reminder_minutes: reminderMinutes,
        is_recurring: isRecurring,
      });

      // Schedule local notification reminder
      if (reminderMinutes > 0) {
        await scheduleEventReminder(title, title, eventDate, reminderMinutes);
        await sendLocalNotification(
          'Jadwal Ditambahkan',
          `"${title}" — Pengingat ${reminderMinutes} menit sebelumnya sudah diatur.`
        );
      }

      showAlert('Jadwal Ditambahkan', `"${title}" berhasil disimpan.`, [
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

        {/* Title */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Judul Jadwal *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Contoh: Meeting tim, Dokter gigi..."
            placeholderTextColor={Colors.textDisabled}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
            autoFocus
          />
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Deskripsi</Text>
          <TextInput
            style={[styles.textInput, { height: 80, paddingTop: Spacing.md }]}
            placeholder="Detail jadwal..."
            placeholderTextColor={Colors.textDisabled}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Date */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Tanggal *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="YYYY-MM-DD (contoh: 2026-06-15)"
            placeholderTextColor={Colors.textDisabled}
            value={date}
            onChangeText={setDate}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
        </View>

        {/* Time Row */}
        <View style={styles.timeRow}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Mulai</Text>
            <TextInput
              style={styles.textInput}
              placeholder="09:00"
              placeholderTextColor={Colors.textDisabled}
              value={startTime}
              onChangeText={setStartTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
          <MaterialIcons name="arrow-forward" size={20} color={Colors.textMuted} style={{ marginTop: 28 }} />
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Selesai</Text>
            <TextInput
              style={styles.textInput}
              placeholder="10:00"
              placeholderTextColor={Colors.textDisabled}
              value={endTime}
              onChangeText={setEndTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Kategori</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {EVENT_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.key}
                  style={[styles.catChip, selectedCategory === cat.key && { backgroundColor: cat.color, borderColor: cat.color }]}
                  onPress={() => { setSelectedCategory(cat.key); setSelectedColor(cat.color); }}
                >
                  <MaterialIcons name={cat.icon as any} size={14} color={selectedCategory === cat.key ? '#fff' : cat.color} />
                  <Text style={[styles.chipText, { color: selectedCategory === cat.key ? '#fff' : Colors.textSecondary }]}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Color */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Warna</Text>
          <View style={styles.colorRow}>
            {EVENT_COLORS.map((c) => (
              <Pressable key={c} style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotActive]} onPress={() => setSelectedColor(c)}>
                {selectedColor === c ? <MaterialIcons name="check" size={14} color="#fff" /> : null}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Reminder */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Pengingat</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {REMINDER_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[styles.remChip, reminderMinutes === opt.value && styles.remChipActive]}
                  onPress={() => setReminderMinutes(opt.value)}
                >
                  <Text style={[styles.chipText, reminderMinutes === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Recurring */}
        <View style={styles.recurringRow}>
          <View>
            <Text style={styles.recurringLabel}>Jadwal Berulang</Text>
            <Text style={styles.recurringDesc}>Tandai sebagai acara rutin</Text>
          </View>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [styles.submitBtn, !canSubmit && styles.submitDisabled, pressed && canSubmit && styles.pressed]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <MaterialIcons name="event" size={20} color={canSubmit ? '#fff' : Colors.textDisabled} />
          <Text style={[styles.submitText, !canSubmit && { color: Colors.textDisabled }]}>
            {saving ? 'Menyimpan...' : 'Simpan Jadwal'}
          </Text>
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
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.card, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border, height: 36 },
  chipText: { fontSize: Typography.xs, fontWeight: Typography.medium },
  chipTextActive: { color: '#fff' },
  colorRow: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorDotActive: { borderWidth: 3, borderColor: '#fff' },
  remChip: { height: 34, paddingHorizontal: Spacing.md, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  remChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  recurringRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  recurringLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  recurringDesc: { fontSize: Typography.xs, color: Colors.textMuted },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 54, borderRadius: Radius.lg, backgroundColor: Colors.primary, marginTop: Spacing.md },
  submitDisabled: { backgroundColor: Colors.cardElevated },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  submitText: { fontSize: Typography.md, fontWeight: Typography.bold, color: '#fff' },
});
