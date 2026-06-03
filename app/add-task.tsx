import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ScrollView, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import {
  scheduleTaskDeadline,
  registerForPushNotificationsAsync,
  buildLocalDate,
  isFutureDate,
  sendLocalNotification,
} from '@/services/notificationService';

const PRIORITIES = [
  { key: 'high', label: 'Tinggi', color: Colors.danger, icon: 'keyboard-double-arrow-up' },
  { key: 'medium', label: 'Sedang', color: Colors.warning, icon: 'keyboard-arrow-up' },
  { key: 'low', label: 'Rendah', color: Colors.success, icon: 'keyboard-arrow-down' },
] as const;

const TASK_CATS = ['personal','work','finance','health','education','social','other'];

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// Remind X minutes before deadline
const DEADLINE_REMINDER_OPTIONS = [
  { value: 0, label: 'Tidak ada' },
  { value: 30, label: '30 mnt' },
  { value: 60, label: '1 jam' },
  { value: 180, label: '3 jam' },
  { value: 720, label: '12 jam' },
  { value: 1440, label: '1 hari' },
];

function DatePickerModal({
  visible, value, onClose, onConfirm,
}: { visible: boolean; value: string; onClose: () => void; onConfirm: (date: string) => void }) {
  const now = new Date();
  const parsed = value && value.length === 10 ? new Date(value + 'T00:00:00') : now;
  const [year, setYear] = useState(parsed.getFullYear());
  const [month, setMonth] = useState(parsed.getMonth());
  const [day, setDay] = useState(parsed.getDate());

  const currentYear = now.getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 1 + i);
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
          <Text style={pickerStyles.title}>Pilih Batas Waktu</Text>

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
            <MaterialIcons name="event" size={16} color={Colors.danger} />
            <Text style={[pickerStyles.previewText, { color: Colors.danger }]}>{safeDay} {MONTHS[month]} {year}</Text>
          </View>

          <View style={pickerStyles.btnRow}>
            <Pressable style={pickerStyles.cancelBtn} onPress={onClose}>
              <Text style={pickerStyles.cancelText}>Batal</Text>
            </Pressable>
            <Pressable style={[pickerStyles.confirmBtn, { backgroundColor: Colors.danger }]} onPress={handleConfirm}>
              <Text style={pickerStyles.confirmText}>Set Deadline</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TimePickerModal({
  visible, value, onClose, onConfirm,
}: { visible: boolean; value: string; onClose: () => void; onConfirm: (t: string) => void }) {
  const [h, m] = value ? value.split(':').map(Number) : [23, 59];
  const [hour, setHour] = useState(isNaN(h) ? 23 : h);
  const [minute, setMinute] = useState(isNaN(m) ? 59 : m);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.handle} />
          <Text style={pickerStyles.title}>Jam Deadline</Text>

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
            <MaterialIcons name="access-time" size={16} color={Colors.danger} />
            <Text style={[pickerStyles.previewText, { color: Colors.danger }]}>{String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}</Text>
          </View>

          <View style={pickerStyles.btnRow}>
            <Pressable style={pickerStyles.cancelBtn} onPress={onClose}>
              <Text style={pickerStyles.cancelText}>Batal</Text>
            </Pressable>
            <Pressable style={[pickerStyles.confirmBtn, { backgroundColor: Colors.danger }]} onPress={() => {
              onConfirm(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
              onClose();
            }}>
              <Text style={pickerStyles.confirmText}>Pilih Jam</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function AddTaskScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { addTask } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low'|'medium'|'high'>('medium');
  const [category, setCategory] = useState('personal');
  const [dueDate, setDueDate] = useState('');         // "YYYY-MM-DD"
  const [dueTime, setDueTime] = useState('23:59');    // "HH:MM"
  const [reminderMins, setReminderMins] = useState(60);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const canSubmit = title.trim().length > 0 && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) { showAlert('Judul Wajib Diisi', 'Masukkan judul tugas.'); return; }
    setSaving(true);
    try {
      let deadlineIso: string | undefined;
      let deadlineLocalDate: Date | undefined;

      if (dueDate) {
        deadlineLocalDate = buildLocalDate(dueDate, dueTime || '23:59');
        deadlineIso = deadlineLocalDate.toISOString();
      }

      await addTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        status: 'todo',
        due_date: deadlineIso,
        category,
        tags: [],
      });

      // Schedule deadline notification
      if (deadlineLocalDate && reminderMins > 0) {
        await registerForPushNotificationsAsync();
        const notifId = await scheduleTaskDeadline(
          `${title.trim()}-${Date.now()}`,
          title.trim(),
          deadlineLocalDate,
          reminderMins
        );
        if (notifId) {
          const triggerTime = new Date(deadlineLocalDate.getTime() - reminderMins * 60 * 1000);
          if (isFutureDate(triggerTime)) {
            await sendLocalNotification(
              'Tugas Ditambahkan',
              `"${title.trim()}" — Pengingat deadline aktif pada ${triggerTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
            );
          }
        }
      }

      const deadlineDisplay = dueDate
        ? ` — Deadline: ${new Date(dueDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
        : '';

      showAlert('Tugas Ditambahkan', `"${title.trim()}" berhasil disimpan${deadlineDisplay}.`, [
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

        {/* Deadline Section */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Batas Waktu (Deadline)</Text>
          <Pressable style={[styles.pickerBtn, dueDate ? styles.pickerBtnDanger : undefined]} onPress={() => setShowDatePicker(true)}>
            <MaterialIcons name="event" size={18} color={dueDate ? Colors.danger : Colors.textMuted} />
            <Text style={[styles.pickerBtnText, dueDate && { color: Colors.danger }]}>
              {dueDate
                ? new Date(dueDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                : 'Pilih tanggal deadline (opsional)'}
            </Text>
            {dueDate ? (
              <Pressable onPress={() => setDueDate('')} hitSlop={8}>
                <MaterialIcons name="close" size={16} color={Colors.danger} />
              </Pressable>
            ) : null}
          </Pressable>

          {dueDate ? (
            <Pressable style={[styles.pickerBtn, styles.pickerBtnDanger]} onPress={() => setShowTimePicker(true)}>
              <MaterialIcons name="access-time" size={18} color={Colors.danger} />
              <Text style={[styles.pickerBtnText, { color: Colors.danger }]}>{dueTime}</Text>
              <MaterialIcons name="edit" size={14} color={Colors.danger} />
            </Pressable>
          ) : null}
        </View>

        {/* Deadline Reminder */}
        {dueDate ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Ingatkan Sebelum Deadline</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {DEADLINE_REMINDER_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[styles.remChip, reminderMins === opt.value && styles.remChipActiveDanger]}
                    onPress={() => setReminderMins(opt.value)}
                  >
                    {reminderMins === opt.value && opt.value > 0 ? (
                      <MaterialIcons name="alarm" size={12} color="#fff" />
                    ) : null}
                    <Text style={[styles.chipText, reminderMins === opt.value && opt.value > 0 && styles.chipTextActive]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {reminderMins > 0 ? (
              <View style={styles.deadlineInfo}>
                <MaterialIcons name="alarm" size={14} color={Colors.danger} />
                <Text style={styles.deadlineInfoText}>
                  Pop-up notifikasi {reminderMins >= 60 ? `${reminderMins / 60} jam` : `${reminderMins} menit`} sebelum deadline {dueTime}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.submitBtn, !canSubmit && styles.submitDisabled, pressed && canSubmit && styles.pressed]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <MaterialIcons name="check-box" size={20} color={canSubmit ? '#fff' : Colors.textDisabled} />
          <Text style={[styles.submitText, !canSubmit && { color: Colors.textDisabled }]}>
            {saving ? 'Menyimpan...' : dueDate && reminderMins > 0 ? 'Simpan & Aktifkan Alarm' : 'Simpan Tugas'}
          </Text>
        </Pressable>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={dueDate}
        onClose={() => setShowDatePicker(false)}
        onConfirm={(d) => setDueDate(d)}
      />
      <TimePickerModal
        visible={showTimePicker}
        value={dueTime}
        onClose={() => setShowTimePicker(false)}
        onConfirm={(t) => setDueTime(t)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, gap: Spacing.xl, paddingBottom: Spacing.xxl },
  fieldGroup: { gap: Spacing.sm },
  fieldLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  textInput: { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, fontSize: Typography.sm, color: Colors.text, height: 48 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.base, height: 52 },
  pickerBtnDanger: { borderColor: Colors.danger + '60', backgroundColor: Colors.dangerSurface },
  pickerBtnText: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  priorityRow: { flexDirection: 'row', gap: Spacing.md },
  priorityBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, height: 44, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  priorityText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  priorityTextActive: { color: '#fff' },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  catChip: { height: 34, paddingHorizontal: Spacing.md, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.medium },
  chipTextActive: { color: '#fff' },
  remChip: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 36, paddingHorizontal: Spacing.md, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  remChipActiveDanger: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  deadlineInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.dangerSurface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  deadlineInfoText: { fontSize: Typography.xs, color: Colors.danger, fontWeight: Typography.medium },
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
