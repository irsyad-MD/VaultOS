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
import {
  scheduleEventReminder,
  sendLocalNotification,
  registerForPushNotificationsAsync,
  buildLocalDate,
  isFutureDate,
} from '@/services/notificationService';

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

// ── Validate HH:MM format ─────────────────────────────────────────────────────
function isValidTime(t: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(t)) return false;
  const [h, m] = t.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

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
  const [month, setMonth] = useState(parsed.getMonth());
  const [day, setDay] = useState(parsed.getDate());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 2 + i);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const safeDay = Math.min(day, daysInMonth);

  const handleConfirm = () => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(safeDay).padStart(2, '0');
    onConfirm(`${year}-${mm}-${dd}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.handle} />
          <Text style={pickerStyles.title}>Pilih Tanggal</Text>

          <Text style={pickerStyles.label}>Tahun</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pickerStyles.chipRow}>
            {years.map((y) => (
              <Pressable key={y} style={[pickerStyles.chip, year === y && pickerStyles.chipActive]} onPress={() => setYear(y)}>
                <Text style={[pickerStyles.chipText, year === y && pickerStyles.chipTextActive]}>{y}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={pickerStyles.label}>Bulan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pickerStyles.chipRow}>
            {MONTHS.map((m, i) => (
              <Pressable key={i} style={[pickerStyles.chip, month === i && pickerStyles.chipActive]} onPress={() => setMonth(i)}>
                <Text style={[pickerStyles.chipText, month === i && pickerStyles.chipTextActive]}>{m}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={pickerStyles.label}>Tanggal</Text>
          <View style={pickerStyles.dayGrid}>
            {days.map((d) => (
              <Pressable key={d} style={[pickerStyles.dayBtn, safeDay === d && pickerStyles.dayBtnActive]} onPress={() => setDay(d)}>
                <Text style={[pickerStyles.dayText, safeDay === d && pickerStyles.dayTextActive]}>{d}</Text>
              </Pressable>
            ))}
          </View>

          <View style={pickerStyles.preview}>
            <MaterialIcons name="event" size={16} color={Colors.primary} />
            <Text style={pickerStyles.previewText}>{safeDay} {MONTHS[month]} {year}</Text>
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

// ── Time Picker Modal ──────────────────────────────────────────────────────────
function TimePickerModal({
  visible, value, label, onClose, onConfirm,
}: {
  visible: boolean;
  value: string;
  label: string;
  onClose: () => void;
  onConfirm: (time: string) => void;
}) {
  const [h, m] = value.split(':').map(Number);
  const [hour, setHour] = useState(isNaN(h) ? 9 : h);
  const [minute, setMinute] = useState(isNaN(m) ? 0 : m);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const handleConfirm = () => {
    const hh = String(hour).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    onConfirm(`${hh}:${mm}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.handle} />
          <Text style={pickerStyles.title}>{label}</Text>

          <Text style={pickerStyles.label}>Jam</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pickerStyles.chipRow}>
            {hours.map((hv) => (
              <Pressable key={hv} style={[pickerStyles.chip, pickerStyles.timeChip, hour === hv && pickerStyles.chipActive]} onPress={() => setHour(hv)}>
                <Text style={[pickerStyles.chipText, hour === hv && pickerStyles.chipTextActive]}>{String(hv).padStart(2, '0')}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={pickerStyles.label}>Menit</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pickerStyles.chipRow}>
            {minutes.map((mv) => (
              <Pressable key={mv} style={[pickerStyles.chip, pickerStyles.timeChip, minute === mv && pickerStyles.chipActive]} onPress={() => setMinute(mv)}>
                <Text style={[pickerStyles.chipText, minute === mv && pickerStyles.chipTextActive]}>{String(mv).padStart(2, '0')}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={pickerStyles.preview}>
            <MaterialIcons name="access-time" size={16} color={Colors.primary} />
            <Text style={pickerStyles.previewText}>{String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}</Text>
          </View>

          <View style={pickerStyles.btnRow}>
            <Pressable style={pickerStyles.cancelBtn} onPress={onClose}>
              <Text style={pickerStyles.cancelText}>Batal</Text>
            </Pressable>
            <Pressable style={pickerStyles.confirmBtn} onPress={handleConfirm}>
              <Text style={pickerStyles.confirmText}>Pilih Waktu</Text>
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
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

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

    // Validate time format
    if (!isValidTime(startTime)) {
      showAlert('Waktu Tidak Valid', 'Format waktu mulai harus HH:MM (contoh: 09:30)');
      return;
    }
    if (!isValidTime(endTime)) {
      showAlert('Waktu Tidak Valid', 'Format waktu selesai harus HH:MM (contoh: 10:00)');
      return;
    }

    // Build local timezone dates (NO UTC shift)
    const eventLocalDate = buildLocalDate(date, startTime);

    // Check if event is in the past
    if (!isFutureDate(eventLocalDate)) {
      showAlert(
        'Jadwal Sudah Lewat',
        `Jadwal "${title}" pada ${eventLocalDate.toLocaleString('id-ID')} sudah lewat. Apakah tetap ingin menyimpan tanpa alarm?`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Simpan Tanpa Alarm', onPress: () => doSave(eventLocalDate, false) },
        ]
      );
      return;
    }

    await doSave(eventLocalDate, true);
  };

  const doSave = async (eventLocalDate: Date, withReminder: boolean) => {
    setSaving(true);
    try {
      await registerForPushNotificationsAsync();

      await addEvent({
        title: title.trim(),
        description: description.trim(),
        date: eventLocalDate.toISOString(),
        start_time: startTime,
        end_time: endTime,
        color: selectedColor,
        category: selectedCategory,
        reminder_minutes: reminderMinutes,
        is_recurring: isRecurring,
      });

      let alarmScheduled = false;
      if (withReminder && reminderMinutes > 0) {
        const notifId = await scheduleEventReminder(
          `${title.trim()}-${Date.now()}`,
          title.trim(),
          eventLocalDate,
          reminderMinutes
        );
        alarmScheduled = !!notifId;

        if (alarmScheduled) {
          const triggerTime = new Date(eventLocalDate.getTime() - reminderMinutes * 60 * 1000);
          await sendLocalNotification(
            'Jadwal Ditambahkan',
            `"${title.trim()}" — Alarm aktif pada ${triggerTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
          );
        }
      }

      const msg = alarmScheduled
        ? `"${title.trim()}" tersimpan dengan alarm ${reminderMinutes >= 60 ? `${reminderMinutes / 60} jam` : `${reminderMinutes} menit`} sebelumnya.`
        : `"${title.trim()}" berhasil disimpan.`;

      showAlert('Jadwal Ditambahkan', msg, [
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
          <Pressable style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
            <MaterialIcons name="calendar-today" size={18} color={Colors.primary} />
            <Text style={styles.pickerBtnText}>{displayDate()}</Text>
            <MaterialIcons name="edit-calendar" size={16} color={Colors.textMuted} />
          </Pressable>
        </View>

        {/* Time Row — tap to open pickers */}
        <View style={styles.timeRow}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Mulai</Text>
            <Pressable style={styles.pickerBtn} onPress={() => setShowStartTimePicker(true)}>
              <MaterialIcons name="access-time" size={18} color={Colors.primary} />
              <Text style={styles.pickerBtnText}>{startTime}</Text>
            </Pressable>
          </View>
          <MaterialIcons name="arrow-forward" size={20} color={Colors.textMuted} style={{ marginTop: 28 }} />
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Selesai</Text>
            <Pressable style={styles.pickerBtn} onPress={() => setShowEndTimePicker(true)}>
              <MaterialIcons name="access-time" size={18} color={Colors.primary} />
              <Text style={styles.pickerBtnText}>{endTime}</Text>
            </Pressable>
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
          <Text style={styles.fieldHint}>Notifikasi berbunyi sesuai waktu dipilih sebelum jadwal (menggunakan timezone lokal perangkat)</Text>
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
                Alarm berbunyi {reminderMinutes >= 60 ? `${reminderMinutes / 60} jam` : `${reminderMinutes} menit`} sebelum {startTime}
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
      <TimePickerModal
        visible={showStartTimePicker}
        value={startTime}
        label="Waktu Mulai"
        onClose={() => setShowStartTimePicker(false)}
        onConfirm={(t) => setStartTime(t)}
      />
      <TimePickerModal
        visible={showEndTimePicker}
        value={endTime}
        label="Waktu Selesai"
        onClose={() => setShowEndTimePicker(false)}
        onConfirm={(t) => setEndTime(t)}
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
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary + '60', paddingHorizontal: Spacing.base, height: 52 },
  pickerBtnText: { flex: 1, fontSize: Typography.sm, color: Colors.text, fontWeight: Typography.medium },
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
  timeChip: { minWidth: 52 },
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
