import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const PRIORITY_COLORS: Record<string, string> = { high: Colors.danger, medium: Colors.warning, low: Colors.success };
const STATUS_LABELS: Record<string, string> = { todo: 'Belum', in_progress: 'Proses', done: 'Selesai' };

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

export default function CalendarScreen() {
  const router = useRouter();
  const { events, tasks, updateTaskStatus, removeEvent, removeTask } = useApp();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'schedule' | 'tasks'>('schedule');
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const calDays = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const currentYear = today.getFullYear();
  const yearRange = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const getDateStr = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${viewYear}-${mm}-${dd}`;
  };

  const eventDates = useMemo(() => new Set(events.map((e) => new Date(e.date).toISOString().split('T')[0])), [events]);

  const filteredEvents = events.filter((e) => {
    const eDate = new Date(e.date).toISOString().split('T')[0];
    return eDate === selectedDate;
  });

  const allFutureEvents = events
    .filter((e) => new Date(e.date).toISOString().split('T')[0] >= selectedDate)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const displayEvents = filteredEvents.length > 0 ? filteredEvents : allFutureEvents.slice(0, 10);
  const isShowingAll = filteredEvents.length === 0;

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  const handleToggleTask = async (id: string, current: string) => {
    const next = current === 'done' ? 'todo' : current === 'todo' ? 'in_progress' : 'done';
    await updateTaskStatus(id, next as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Jadwal & Tugas</Text>
            <Text style={styles.subtitle}>{today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </View>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <Pressable style={styles.monthNavBtn} onPress={prevMonth}>
            <MaterialIcons name="chevron-left" size={22} color={Colors.text} />
          </Pressable>
          <Pressable style={styles.monthLabel} onPress={() => setShowMonthPicker(true)}>
            <Text style={styles.monthText}>{MONTHS_FULL[viewMonth]} {viewYear}</Text>
            <MaterialIcons name="arrow-drop-down" size={18} color={Colors.primary} />
          </Pressable>
          <Pressable style={styles.monthNavBtn} onPress={nextMonth}>
            <MaterialIcons name="chevron-right" size={22} color={Colors.text} />
          </Pressable>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarCard}>
          {/* Day names */}
          <View style={styles.dayNamesRow}>
            {DAYS.map((d) => (
              <Text key={d} style={styles.dayName}>{d}</Text>
            ))}
          </View>
          {/* Day cells */}
          <View style={styles.daysGrid}>
            {calDays.map((day, idx) => {
              if (!day) return <View key={`empty-${idx}`} style={styles.dayCell} />;
              const dateStr = getDateStr(day);
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === today.toISOString().split('T')[0];
              const hasEvent = eventDates.has(dateStr);
              return (
                <Pressable
                  key={dateStr}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                  onPress={() => setSelectedDate(dateStr)}
                >
                  <Text style={[
                    styles.dayCellText,
                    isSelected && styles.dayCellTextSelected,
                    isToday && !isSelected && styles.dayCellTextToday,
                  ]}>
                    {day}
                  </Text>
                  {hasEvent ? <View style={[styles.eventDot, isSelected && { backgroundColor: '#fff' }]} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Selected date info */}
        <View style={styles.selectedInfo}>
          <MaterialIcons name="event" size={14} color={Colors.primary} />
          <Text style={styles.selectedInfoText}>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          {filteredEvents.length > 0 ? (
            <View style={styles.eventCountBadge}>
              <Text style={styles.eventCountText}>{filteredEvents.length} jadwal</Text>
            </View>
          ) : null}
        </View>

        {/* Tab Toggle */}
        <View style={styles.tabRow}>
          <Pressable style={[styles.tabBtn, activeTab === 'schedule' && styles.tabActive]} onPress={() => setActiveTab('schedule')}>
            <MaterialIcons name="event" size={16} color={activeTab === 'schedule' ? '#fff' : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>
              Jadwal {filteredEvents.length > 0 ? `(${filteredEvents.length})` : ''}
            </Text>
          </Pressable>
          <Pressable style={[styles.tabBtn, activeTab === 'tasks' && styles.tabActive]} onPress={() => setActiveTab('tasks')}>
            <MaterialIcons name="check-box" size={16} color={activeTab === 'tasks' ? '#fff' : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'tasks' && styles.tabTextActive]}>
              Tugas ({tasks.filter((t) => t.status !== 'done').length})
            </Text>
          </Pressable>
        </View>

        {/* Add Buttons */}
        <View style={styles.addRow}>
          {activeTab === 'schedule' ? (
            <Pressable style={styles.addBtn} onPress={() => router.push('/add-event')}>
              <MaterialIcons name="add" size={16} color="#fff" />
              <Text style={styles.addBtnText}>Tambah Jadwal</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.addBtn, { backgroundColor: Colors.success }]} onPress={() => router.push('/add-task')}>
              <MaterialIcons name="add" size={16} color="#fff" />
              <Text style={styles.addBtnText}>Tambah Tugas</Text>
            </Pressable>
          )}
        </View>

        {activeTab === 'schedule' ? (
          <View style={styles.section}>
            {isShowingAll && allFutureEvents.length > 0 ? (
              <Text style={styles.sectionHint}>Tidak ada jadwal pada tanggal ini. Menampilkan jadwal mendatang:</Text>
            ) : null}
            {displayEvents.length === 0 ? (
              <View style={styles.empty}>
                <MaterialIcons name="event-available" size={48} color={Colors.textDisabled} />
                <Text style={styles.emptyTitle}>Tidak ada jadwal</Text>
                <Text style={styles.emptyText}>Tekan "Tambah Jadwal" untuk membuat jadwal baru</Text>
              </View>
            ) : (
              displayEvents.map((evt) => {
                const evtDate = new Date(evt.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                return (
                  <Pressable key={evt.id} style={({ pressed }) => [styles.eventCard, pressed && styles.pressed]}>
                    <View style={[styles.eventLine, { backgroundColor: evt.color }]} />
                    <View style={styles.eventBody}>
                      <View style={styles.eventTop}>
                        <Text style={styles.eventTitle} numberOfLines={1}>{evt.title}</Text>
                        <View style={styles.eventActions}>
                          {isShowingAll ? <Text style={styles.eventDateLabel}>{evtDate}</Text> : null}
                          {evt.is_recurring ? <MaterialIcons name="repeat" size={14} color={Colors.textMuted} /> : null}
                          <Pressable onPress={() => removeEvent(evt.id)} hitSlop={8}>
                            <MaterialIcons name="delete-outline" size={16} color={Colors.textDisabled} />
                          </Pressable>
                        </View>
                      </View>
                      {evt.description ? <Text style={styles.eventDesc} numberOfLines={1}>{evt.description}</Text> : null}
                      <View style={styles.eventMeta}>
                        <View style={styles.timeChip}>
                          <MaterialIcons name="schedule" size={12} color={Colors.textMuted} />
                          <Text style={styles.timeText}>{evt.start_time} – {evt.end_time}</Text>
                        </View>
                        <View style={[styles.categoryChip, { backgroundColor: evt.color + '20' }]}>
                          <Text style={[styles.categoryText, { color: evt.color }]}>{evt.category}</Text>
                        </View>
                        {evt.reminder_minutes > 0 ? (
                          <View style={styles.reminderChip}>
                            <MaterialIcons name="alarm" size={11} color={Colors.warning} />
                            <Text style={styles.reminderText}>
                              {evt.reminder_minutes >= 60 ? `${evt.reminder_minutes / 60}j` : `${evt.reminder_minutes}m`}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.taskStats}>
              <View style={[styles.taskStatItem, { backgroundColor: Colors.dangerSurface }]}>
                <Text style={[styles.taskStatNum, { color: Colors.danger }]}>{tasksByStatus.todo}</Text>
                <Text style={[styles.taskStatLabel, { color: Colors.danger }]}>Belum</Text>
              </View>
              <View style={[styles.taskStatItem, { backgroundColor: Colors.warningSurface }]}>
                <Text style={[styles.taskStatNum, { color: Colors.warning }]}>{tasksByStatus.in_progress}</Text>
                <Text style={[styles.taskStatLabel, { color: Colors.warning }]}>Proses</Text>
              </View>
              <View style={[styles.taskStatItem, { backgroundColor: Colors.successSurface }]}>
                <Text style={[styles.taskStatNum, { color: Colors.success }]}>{tasksByStatus.done}</Text>
                <Text style={[styles.taskStatLabel, { color: Colors.success }]}>Selesai</Text>
              </View>
            </View>

            {tasks.length === 0 ? (
              <View style={styles.empty}>
                <MaterialIcons name="check-box" size={48} color={Colors.textDisabled} />
                <Text style={styles.emptyTitle}>Tidak ada tugas</Text>
                <Text style={styles.emptyText}>Tekan "Tambah Tugas" untuk membuat tugas baru</Text>
              </View>
            ) : (
              tasks.map((task) => {
                const isDone = task.status === 'done';
                const priorityColor = PRIORITY_COLORS[task.priority];
                return (
                  <Pressable
                    key={task.id}
                    style={({ pressed }) => [styles.taskCard, isDone && styles.taskDone, pressed && styles.pressed]}
                    onPress={() => handleToggleTask(task.id, task.status)}
                  >
                    <View style={[styles.taskCheckbox, task.status === 'done' && styles.taskCheckboxDone, task.status === 'in_progress' && styles.taskCheckboxProgress]}>
                      {task.status === 'done' ? <MaterialIcons name="check" size={14} color="#fff" /> : task.status === 'in_progress' ? <MaterialIcons name="hourglass-empty" size={12} color="#fff" /> : null}
                    </View>
                    <View style={styles.taskBody}>
                      <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]} numberOfLines={1}>{task.title}</Text>
                      <View style={styles.taskMeta}>
                        <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                        <Text style={styles.taskMetaText}>{task.priority}</Text>
                        <Text style={styles.taskMetaDot}>·</Text>
                        <Text style={[styles.statusText, { color: isDone ? Colors.success : task.status === 'in_progress' ? Colors.warning : Colors.textMuted }]}>
                          {STATUS_LABELS[task.status]}
                        </Text>
                        {task.due_date ? (
                          <>
                            <Text style={styles.taskMetaDot}>·</Text>
                            <Text style={styles.taskMetaText}>{new Date(task.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</Text>
                          </>
                        ) : null}
                      </View>
                    </View>
                    <Pressable onPress={() => removeTask(task.id)} hitSlop={8}>
                      <MaterialIcons name="delete-outline" size={16} color={Colors.textDisabled} />
                    </Pressable>
                  </Pressable>
                );
              })
            )}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Month/Year Picker Modal */}
      <Modal visible={showMonthPicker} transparent animationType="slide" onRequestClose={() => setShowMonthPicker(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.handle} />
            <Text style={modalStyles.title}>Pilih Bulan & Tahun</Text>

            <Text style={modalStyles.label}>Tahun</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={modalStyles.chipRow}>
              {yearRange.map((y) => (
                <Pressable
                  key={y}
                  style={[modalStyles.chip, viewYear === y && modalStyles.chipActive]}
                  onPress={() => setViewYear(y)}
                >
                  <Text style={[modalStyles.chipText, viewYear === y && modalStyles.chipTextActive]}>{y}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={modalStyles.label}>Bulan</Text>
            <View style={modalStyles.monthGrid}>
              {MONTHS_FULL.map((m, i) => (
                <Pressable
                  key={i}
                  style={[modalStyles.monthBtn, viewMonth === i && modalStyles.monthBtnActive]}
                  onPress={() => { setViewMonth(i); setShowMonthPicker(false); }}
                >
                  <Text style={[modalStyles.monthBtnText, viewMonth === i && modalStyles.monthBtnTextActive]}>{MONTHS[i]}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={modalStyles.closeBtn} onPress={() => setShowMonthPicker(false)}>
              <Text style={modalStyles.closeBtnText}>Tutup</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { gap: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base },
  title: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.text },
  subtitle: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base },
  monthNavBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthText: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.text },
  calendarCard: { marginHorizontal: Spacing.base, backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  dayNamesRow: { flexDirection: 'row', justifyContent: 'space-around' },
  dayName: { width: 36, textAlign: 'center', fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm, gap: 2 },
  dayCellSelected: { backgroundColor: Colors.primary },
  dayCellToday: { backgroundColor: Colors.primarySurface, borderWidth: 1, borderColor: Colors.primary + '50' },
  dayCellText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  dayCellTextSelected: { color: '#fff', fontWeight: Typography.bold },
  dayCellTextToday: { color: Colors.primary, fontWeight: Typography.bold },
  eventDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.primary },
  selectedInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.base, backgroundColor: Colors.primarySurface, marginHorizontal: Spacing.base, borderRadius: Radius.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.primary + '30' },
  selectedInfoText: { flex: 1, fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.medium },
  eventCountBadge: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  eventCountText: { fontSize: Typography.xs, color: '#fff', fontWeight: Typography.bold },
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.base, backgroundColor: Colors.card, borderRadius: Radius.md, padding: 3, borderWidth: 1, borderColor: Colors.border, gap: 3 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 38, borderRadius: Radius.sm, gap: Spacing.xs },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: Typography.medium },
  tabTextActive: { color: '#fff' },
  addRow: { paddingHorizontal: Spacing.base },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: Colors.primary, borderRadius: Radius.md, height: 44 },
  addBtnText: { fontSize: Typography.sm, color: '#fff', fontWeight: Typography.semibold },
  section: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  sectionHint: { fontSize: Typography.xs, color: Colors.textMuted, fontStyle: 'italic' },
  eventCard: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  pressed: { opacity: 0.75 },
  eventLine: { width: 4 },
  eventBody: { flex: 1, padding: Spacing.base, gap: Spacing.sm },
  eventTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eventActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  eventTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text, flex: 1 },
  eventDateLabel: { fontSize: Typography.xs, color: Colors.textMuted },
  eventDesc: { fontSize: Typography.xs, color: Colors.textMuted },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.cardElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  timeText: { fontSize: Typography.xs, color: Colors.textMuted },
  categoryChip: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  categoryText: { fontSize: Typography.xs, fontWeight: Typography.semibold, textTransform: 'capitalize' },
  reminderChip: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.warningSurface, borderRadius: Radius.full, paddingHorizontal: Spacing.xs, paddingVertical: 2 },
  reminderText: { fontSize: Typography.xs, color: Colors.warning },
  taskStats: { flexDirection: 'row', gap: Spacing.md },
  taskStatItem: { flex: 1, alignItems: 'center', borderRadius: Radius.md, padding: Spacing.md },
  taskStatNum: { fontSize: Typography.xl, fontWeight: Typography.bold },
  taskStatLabel: { fontSize: Typography.xs, fontWeight: Typography.medium },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  taskDone: { opacity: 0.5 },
  taskCheckbox: { width: 24, height: 24, borderRadius: Radius.sm, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  taskCheckboxDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  taskCheckboxProgress: { backgroundColor: Colors.warning, borderColor: Colors.warning },
  taskBody: { flex: 1, gap: 4 },
  taskTitle: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.text },
  taskTitleDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  taskMetaText: { fontSize: Typography.xs, color: Colors.textMuted },
  taskMetaDot: { fontSize: Typography.xs, color: Colors.textDisabled },
  statusText: { fontSize: Typography.xs, fontWeight: Typography.medium },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textSecondary },
  emptyText: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  bottomPad: { height: Spacing.lg },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.sm },
  title: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text, textAlign: 'center' },
  label: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  chip: { paddingHorizontal: Spacing.md, height: 36, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  chipTextActive: { color: '#fff' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  monthBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, minWidth: 64, alignItems: 'center' },
  monthBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  monthBtnText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  monthBtnTextActive: { color: '#fff' },
  closeBtn: { height: 48, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  closeBtnText: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: Typography.semibold },
});
