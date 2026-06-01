import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ScrollView, KeyboardAvoidingView, Platform, Switch, Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { scheduleEventReminder, sendLocalNotification, registerForPushNotificationsAsync } from '@/services/notificationService';

const EVENT_CATEGORIES = [
  { key: 'work', label: 'Pekerjaan', icon: 'work', color: '#6366f1' },
  { key: 'health', label: 'Kesehatan', icon: 'favorite', color: '#ef4444' },
  { key: 'finance', label: 'Keuangan', icon: 'account-balance-wallet', color: '#22c55e' },
  { key: 'personal', label: 'Personal', icon: 'person', color: '#f59e0b' },
  { key: 'education', label: 'Pendidikan', icon: 'school', color: '#06b6d4' },
  { key: 'social', label: 'Sosial', icon: 'people', color: '#ec4899' },
  { key: 'other', label: 'Lainnya', icon: 'label', color: '#71717a' },
];

const EVENT_COLORS = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6'];

const REMINDER_OPTIONS = [
  { value: 0, label: 'Tidak ada' },
  { value: 5, label: '5 menit' },
  { value: 15, label: '15 menit' },
  { value: 30, label: '30 menit' },
  { value: 60, label: '1 jam' },
  { value: 120, label: '2 jam' },
  { value: 1440, label: '1 hari' },
];

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function DatePickerModal({
  visible, value, onClose, onConfirm,
}: {
  visible: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (date: string) => void;
}) {
  const parsed = value && value.length === 10 ? new Date(value + 'T00:00:00') : new Date();
  const [year, setYear] = useState(parsed.getFullYear());
  const [month, setMonth] = useState(parsed.getMonth()); // 0-indexed
  const [day, setDay] = useState(parsed.getDate());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 2 + i);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const safeDay = Math.min(day, daysInMonth);

  const handleConfirm = () => {
    const d = new Date(year, month, safeDay);
    const isoDate = d.toISOString().split('T')[0];
    onConfirm(isoDate);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.handle} />
          <Text style={pickerStyles.title}>Pilih Tanggal</Text>

          {/* Year */}
          <Text style={pickerStyles.label}>Tahun</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pickerStyles.chipRow}>
            {years.map((y) => (
              <Pressable
                key={y}
                style={[pickerStyles.chip, year === y && pickerStyles.chipActive]}
                onPress={() => setYear(y)}
              >
                <Text style={[pickerStyles.chipText, year === y && pickerStyles.chipTextActive]}>{y}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Month */}
          <Text style={pickerStyles.label}>Bulan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pickerStyles.chipRow}>
            {MONTHS.map((m, i) => (
              <Pressable
                key={i}
                style={[pickerStyles.chip, month === i && pickerStyles.chipActive]}
                onPress={() => setMonth(i)}
              >
                <Text style={[pickerStyles.chipText, month === i && pickerStyles.chipTextActive]}>{m}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Day */}
          <Text style={pickerStyles.label}>Tanggal</Text>
          <View style={pickerStyles.dayGrid}>
            {days.map((d) => (
              <Pressable
                key={d}
                style={[pickerStyles.dayBtn, safeDay === d && pickerStyles.dayBtnActive]}
                onPress={() => setDay(d)}
              >
                <Text style={[pickerStyles.dayText, safeDay === d && pickerStyles.dayTextActive]}>{d}</Text>
              </Pressable>
            ))}
          </View>

          <View style={pickerStyles.preview}>
            <MaterialIcons name="event" size={16} color={Colors.primary} />
            <Text style={pickerStyles.previewText}>
              {safeDay} {MONTHS[month]} {year}
            </Text>
          </View>

          <View style={pickerStyles.btnRow}>
            <Pressable style={pickerStyles.cancelBtn} onPress={onClose}>
              <Text style={pickerStyles.cancelText}>Batal</Text>
            </Pressable>
            <Pressable style={pickerStyles.confirmBtn} onPress={handleConfirm}>
              <Text style={pickerStyles.confirmText}>Pilih Tanggal</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

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
  const [showDatePicker, setShowDatePicker] = useState(false);

  const displayDate = () => {
    if (!date || date.length < 10) return 'Pilih tanggal';
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const canSubmit = title.trim().length > 0 && date.length === 10 && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) {
      showAlert('Lengkapi Data', 'Masukkan judul dan tanggal jadwal.');
      return;
    }

    setSaving(true);
    try {
      // Ensure notification permission is granted
      await registerForPushNotificationsAsync();

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

      // Schedule local alarm notification at the specified time before the event
      if (reminderMinutes > 0) {
        const notifId = await scheduleEventReminder(
          `${title}-${Date.now()}`,
          title,
          eventDate,
          reminderMinutes
        );
        if (notifId) {
          await sendLocalNotification(
            'Jadwal Ditambahkan',
            `"${title}" — Alarm ${reminderMinutes >= 60 ? `${reminderMinutes / 60} jam` : `${reminderMinutes} menit`} sebelumnya sudah aktif.`
          );
        } else {
          showAlert(
            'Jadwal Tersimpan',
            'Jadwal disimpan, tapi pengingat tidak bisa dijadwalkan (mungkin waktu sudah lewat atau izin notifikasi belum diberikan).'
          );
          router.back();
          return;
        }
      }

      showAlert('Jadwal Ditambahkan', `"${title}" berhasil disimpan${reminderMinutes > 0 ? ' dengan pengingat' : ''}.`, [
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

        {/* Date Picker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Tanggal *</Text>
          <Pressable style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
            <MaterialIcons name="calendar-today" size={18} color={Colors.primary} />
            <Text style={[styles.datePickerText, !date && { color: Colors.textDisabled }]}>
              {displayDate()}
            </Text>
            <MaterialIcons name="edit-calendar" size={16} color={Colors.textMuted} />
          </Pressable>
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
          <Text style={styles.fieldLabel}>Alarm / Pengingat</Text>
          <Text style={styles.fieldHint}>Notifikasi akan berbunyi sesuai waktu yang dipilih sebelum jadwal</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {REMINDER_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[styles.remChip, reminderMinutes === opt.value && styles.remChipActive]}
                  onPress={() => setReminderMinutes(opt.value)}
                >
                  {reminderMinutes === opt.value && opt.value > 0 ? (
                    <MaterialIcons name="notifications-active" size={12} color="#fff" />
                  ) : null}
                  <Text style={[styles.chipText, reminderMinutes === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          {reminderMinutes > 0 ? (
            <View style={styles.reminderInfo}>
              <MaterialIcons name="alarm" size={14} color={Colors.warning} />
              <Text style={styles.reminderInfoText}>
                Alarm akan berbunyi {reminderMinutes >= 60 ? `${reminderMinutes / 60} jam` : `${reminderMinutes} menit`} sebelum jadwal
              </Text>
            </View>
          ) : null}
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
          <MaterialIcons name={reminderMinutes > 0 ? 'alarm' : 'event'} size={20} color={canSubmit ? '#fff' : Colors.textDisabled} />
          <Text style={[styles.submitText, !canSubmit && { color: Colors.textDisabled }]}>
            {saving ? 'Menyimpan...' : `Simpan${reminderMinutes > 0 ? ' & Aktifkan Alarm' : ' Jadwal'}`}
          </Text>
        </Pressable>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={date}
        onClose={() => setShowDatePicker(false)}
        onConfirm={(d) => setDate(d)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, gap: Spacing.xl, paddingBottom: Spacing.xxl },
  fieldGroup: { gap: Spacing.sm },
  fieldLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  fieldHint: { fontSize: Typography.xs, color: Colors.textDisabled, lineHeight: 16 },
  textInput: { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, fontSize: Typography.sm, color: Colors.text, height: 48 },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary + '60', paddingHorizontal: Spacing.base, height: 52 },
  datePickerText: { flex: 1, fontSize: Typography.sm, color: Colors.text, fontWeight: Typography.medium },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.card, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border, height: 36 },
  chipText: { fontSize: Typography.xs, fontWeight: Typography.medium },
  chipTextActive: { color: '#fff' },
  colorRow: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorDotActive: { borderWidth: 3, borderColor: '#fff' },
  remChip: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 36, paddingHorizontal: Spacing.md, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  remChipActive: { backgroundColor: Colors.warning, borderColor: Colors.warning },
  reminderInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.warningSurface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  reminderInfoText: { fontSize: Typography.xs, color: Colors.warning, fontWeight: Typography.medium },
  recurringRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  recurringLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  recurringDesc: { fontSize: Typography.xs, color: Colors.textMuted },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 54, borderRadius: Radius.lg, backgroundColor: Colors.primary, marginTop: Spacing.md },
  submitDisabled: { backgroundColor: Colors.cardElevated },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  submitText: { fontSize: Typography.md, fontWeight: Typography.bold, color: '#fff' },
});

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.sm },
  title: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm },
  label: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  chip: { paddingHorizontal: Spacing.md, height: 36, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  chipTextActive: { color: '#fff' },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  dayBtn: { width: 40, height: 40, borderRadius: Radius.sm, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  dayBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  dayTextActive: { color: '#fff' },
  preview: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primarySurface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '30' },
  previewText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold },
  btnRow: { flexDirection: 'row', gap: Spacing.md },
  cancelBtn: { flex: 1, height: 48, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: Typography.semibold },
  confirmBtn: { flex: 2, height: 48, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontSize: Typography.sm, color: '#fff', fontWeight: Typography.bold },
});
