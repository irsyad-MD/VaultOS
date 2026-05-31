import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { sendLocalNotification } from '@/services/notificationService';

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const PRIORITY_COLORS: Record<string, string> = { high: Colors.danger, medium: Colors.warning, low: Colors.success };
const STATUS_LABELS: Record<string, string> = { todo: 'Belum', in_progress: 'Proses', done: 'Selesai' };

function generateWeekDays(selectedDate: string) {
  const today = new Date();
  const days = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d.toISOString().split('T')[0],
      day: DAYS[d.getDay()],
      num: d.getDate(),
      isToday: i === 0,
    });
  }
  return days;
}

export default function CalendarScreen() {
  const router = useRouter();
  const { events, tasks, updateTaskStatus, removeEvent, removeTask, loading } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'schedule' | 'tasks'>('schedule');

  const weekDays = generateWeekDays(selectedDate);

  const filteredEvents = events.filter((e) => {
    const eDate = new Date(e.date).toISOString().split('T')[0];
    return eDate >= selectedDate;
  });

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  const handleToggleTask = async (id: string, current: string) => {
    const next = current === 'done' ? 'todo' : current === 'todo' ? 'in_progress' : 'done';
    await updateTaskStatus(id, next as any);
  };

  const handleDeleteEvent = async (id: string) => {
    await removeEvent(id);
    await sendLocalNotification('Jadwal Dihapus', 'Jadwal dan pengingatnya telah dibatalkan.');
  };

  const handleDeleteTask = async (id: string) => {
    await removeTask(id);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Jadwal & Tugas</Text>
            <Text style={styles.subtitle}>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </View>
        </View>

        {/* Week Strip */}
        <View style={styles.weekStrip}>
          {weekDays.map((d) => {
            const isSelected = d.date === selectedDate;
            const hasEvent = events.some((e) => new Date(e.date).toISOString().split('T')[0] === d.date);
            return (
              <Pressable key={d.date} style={[styles.dayBtn, isSelected && styles.dayBtnActive, d.isToday && !isSelected && styles.dayBtnToday]} onPress={() => setSelectedDate(d.date)}>
                <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>{d.day}</Text>
                <Text style={[styles.dayNum, isSelected && styles.dayNumActive, d.isToday && !isSelected && styles.dayNumToday]}>{d.num}</Text>
                {hasEvent ? <View style={[styles.eventIndicator, isSelected && styles.eventIndicatorActive]} /> : null}
              </Pressable>
            );
          })}
        </View>

        {/* Tab Toggle */}
        <View style={styles.tabRow}>
          <Pressable style={[styles.tabBtn, activeTab === 'schedule' && styles.tabActive]} onPress={() => setActiveTab('schedule')}>
            <MaterialIcons name="event" size={16} color={activeTab === 'schedule' ? '#fff' : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>Jadwal ({filteredEvents.length})</Text>
          </Pressable>
          <Pressable style={[styles.tabBtn, activeTab === 'tasks' && styles.tabActive]} onPress={() => setActiveTab('tasks')}>
            <MaterialIcons name="check-box" size={16} color={activeTab === 'tasks' ? '#fff' : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'tasks' && styles.tabTextActive]}>Tugas ({tasks.filter((t) => t.status !== 'done').length})</Text>
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
            {filteredEvents.length === 0 ? (
              <View style={styles.empty}>
                <MaterialIcons name="event-available" size={48} color={Colors.textDisabled} />
                <Text style={styles.emptyTitle}>Tidak ada jadwal</Text>
                <Text style={styles.emptyText}>Tekan "Tambah Jadwal" untuk membuat jadwal baru</Text>
              </View>
            ) : (
              filteredEvents.map((evt) => (
                <Pressable key={evt.id} style={({ pressed }) => [styles.eventCard, pressed && styles.pressed]}>
                  <View style={[styles.eventLine, { backgroundColor: evt.color }]} />
                  <View style={styles.eventBody}>
                    <View style={styles.eventTop}>
                      <Text style={styles.eventTitle} numberOfLines={1}>{evt.title}</Text>
                      <View style={styles.eventActions}>
                        {evt.is_recurring ? <MaterialIcons name="repeat" size={14} color={Colors.textMuted} /> : null}
                        <Pressable onPress={() => handleDeleteEvent(evt.id)} hitSlop={8}>
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
                          <MaterialIcons name="notifications" size={11} color={Colors.primary} />
                          <Text style={styles.reminderText}>{evt.reminder_minutes}m</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              ))
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
                  <Pressable key={task.id} style={({ pressed }) => [styles.taskCard, isDone && styles.taskDone, pressed && styles.pressed]} onPress={() => handleToggleTask(task.id, task.status)}>
                    <View style={[styles.taskCheckbox, task.status === 'done' && styles.taskCheckboxDone, task.status === 'in_progress' && styles.taskCheckboxProgress]}>
                      {task.status === 'done' ? <MaterialIcons name="check" size={14} color="#fff" /> : task.status === 'in_progress' ? <MaterialIcons name="hourglass-empty" size={12} color="#fff" /> : null}
                    </View>
                    <View style={styles.taskBody}>
                      <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]} numberOfLines={1}>{task.title}</Text>
                      <View style={styles.taskMeta}>
                        <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                        <Text style={styles.taskMetaText}>{task.priority}</Text>
                        <Text style={styles.taskMetaDot}>·</Text>
                        <Text style={[styles.statusText, { color: isDone ? Colors.success : task.status === 'in_progress' ? Colors.warning : Colors.textMuted }]}>{STATUS_LABELS[task.status]}</Text>
                        {task.due_date ? (
                          <>
                            <Text style={styles.taskMetaDot}>·</Text>
                            <Text style={styles.taskMetaText}>{new Date(task.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</Text>
                          </>
                        ) : null}
                      </View>
                    </View>
                    <Pressable onPress={() => handleDeleteTask(task.id)} hitSlop={8}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { gap: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing.base, paddingTop: Spacing.base },
  title: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.text },
  subtitle: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  weekStrip: { flexDirection: 'row', paddingHorizontal: Spacing.sm, gap: Spacing.xs },
  dayBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: Radius.md, gap: 4 },
  dayBtnActive: { backgroundColor: Colors.primary },
  dayBtnToday: { backgroundColor: Colors.cardElevated },
  dayName: { fontSize: Typography.xs, color: Colors.textMuted },
  dayNameActive: { color: 'rgba(255,255,255,0.7)' },
  dayNum: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.text },
  dayNumActive: { color: '#fff' },
  dayNumToday: { color: Colors.primary },
  eventIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary },
  eventIndicatorActive: { backgroundColor: '#fff' },
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.base, backgroundColor: Colors.card, borderRadius: Radius.md, padding: 3, borderWidth: 1, borderColor: Colors.border, gap: 3 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 38, borderRadius: Radius.sm, gap: Spacing.xs },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: Typography.medium },
  tabTextActive: { color: '#fff' },
  addRow: { paddingHorizontal: Spacing.base },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: Colors.primary, borderRadius: Radius.md, height: 44 },
  addBtnText: { fontSize: Typography.sm, color: '#fff', fontWeight: Typography.semibold },
  section: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  eventCard: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  pressed: { opacity: 0.75 },
  eventLine: { width: 4 },
  eventBody: { flex: 1, padding: Spacing.base, gap: Spacing.sm },
  eventTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eventActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  eventTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text, flex: 1 },
  eventDesc: { fontSize: Typography.xs, color: Colors.textMuted },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.cardElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  timeText: { fontSize: Typography.xs, color: Colors.textMuted },
  categoryChip: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  categoryText: { fontSize: Typography.xs, fontWeight: Typography.semibold, textTransform: 'capitalize' },
  reminderChip: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.primaryMuted, borderRadius: Radius.full, paddingHorizontal: Spacing.xs, paddingVertical: 2 },
  reminderText: { fontSize: Typography.xs, color: Colors.primary },
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
