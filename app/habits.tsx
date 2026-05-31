import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { DonutChart } from '@/components';
import { useRouter } from 'expo-router';

function getLastNDates(n: number): string[] {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export default function HabitsScreen() {
  const { habits, habitCompletions, toggleHabit, removeHabit, loading } = useApp();
  const router = useRouter();
  const last21 = getLastNDates(21);

  const today = new Date().toISOString().split('T')[0];
  const completedToday = habitCompletions.filter((c) => c.completed_date === today).map((c) => c.habit_id);
  const completionRate = habits.length > 0 ? Math.round((completedToday.length / habits.length) * 100) : 0;

  const getHabitDates = (habitId: string) =>
    habitCompletions.filter((c) => c.habit_id === habitId).map((c) => c.completed_date);

  const handleDelete = (id: string, name: string) => {
    // inline - just call remove
    removeHabit(id);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <View>
          <DonutChart progress={completionRate} color={Colors.purple} size={80} strokeWidth={10} />
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summaryRate}>{completionRate}%</Text>
          <Text style={styles.summaryLabel}>Selesai Hari Ini</Text>
          <Text style={styles.summaryDetail}>{completedToday.length} dari {habits.length} kebiasaan</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatVal}>{habits.length}</Text>
              <Text style={styles.summaryStatLabel}>Total</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Section title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Kebiasaan Harian</Text>
        <Pressable style={styles.addBtn} onPress={() => router.push('/add-habit')}>
          <MaterialIcons name="add" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Tambah</Text>
        </Pressable>
      </View>

      {habits.length === 0 && !loading ? (
        <View style={styles.empty}>
          <MaterialIcons name="loop" size={64} color={Colors.textDisabled} />
          <Text style={styles.emptyTitle}>Belum ada kebiasaan</Text>
          <Text style={styles.emptyText}>Mulai tracking kebiasaan positif kamu</Text>
          <Pressable style={styles.addHabitBtn} onPress={() => router.push('/add-habit')}>
            <MaterialIcons name="add-circle" size={18} color={Colors.purple} />
            <Text style={styles.addHabitBtnText}>Tambah Kebiasaan</Text>
          </Pressable>
        </View>
      ) : null}

      {habits.map((habit) => {
        const isDone = completedToday.includes(habit.id);
        const habitDates = getHabitDates(habit.id);
        return (
          <Pressable
            key={habit.id}
            style={({ pressed }) => [styles.habitCard, pressed && styles.pressed]}
            onPress={() => toggleHabit(habit.id)}
          >
            <View style={styles.habitTop}>
              <View style={[styles.habitIcon, { backgroundColor: habit.color + '20' }]}>
                <MaterialIcons name={habit.icon as any} size={22} color={habit.color} />
              </View>
              <View style={styles.habitInfo}>
                <Text style={[styles.habitName, isDone && styles.habitNameDone]}>{habit.name}</Text>
                <View style={styles.habitMeta}>
                  <MaterialIcons name="local-fire-department" size={13} color={Colors.orange} />
                  <Text style={styles.habitMetaText}>{habit.streak} hari streak</Text>
                  <Text style={styles.habitMetaDot}>·</Text>
                  <Text style={styles.habitMetaText}>{habit.frequency === 'daily' ? 'Harian' : 'Mingguan'}</Text>
                </View>
              </View>
              <View style={[styles.doneBtn, isDone && { backgroundColor: habit.color }]}>
                {isDone ? <MaterialIcons name="check" size={18} color="#fff" /> : (
                  <View style={[styles.doneBtnEmpty, { borderColor: habit.color }]} />
                )}
              </View>
            </View>

            {/* Heatmap */}
            <View style={styles.heatmap}>
              {last21.map((date, i) => {
                const isCompleted = habitDates.includes(date);
                const isToday = date === today;
                return (
                  <View key={i} style={[styles.heatCell, { backgroundColor: isCompleted ? habit.color : Colors.cardElevated, borderWidth: isToday ? 1.5 : 0, borderColor: isToday ? habit.color : 'transparent', opacity: isCompleted ? 0.85 : 0.5 }]} />
                );
              })}
            </View>

            <View style={styles.habitFooter}>
              <Pressable onPress={() => handleDelete(habit.id, habit.name)} hitSlop={8} style={styles.deleteBtn}>
                <MaterialIcons name="delete-outline" size={16} color={Colors.textDisabled} />
              </Pressable>
              {isDone ? (
                <View style={[styles.doneBadge, { backgroundColor: habit.color + '20' }]}>
                  <MaterialIcons name="check-circle" size={12} color={habit.color} />
                  <Text style={[styles.doneBadgeText, { color: habit.color }]}>Selesai</Text>
                </View>
              ) : (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>Ketuk untuk selesaikan</Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { gap: Spacing.xl, padding: Spacing.base, paddingBottom: Spacing.xxl },
  summaryCard: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border, gap: Spacing.xl, alignItems: 'center' },
  summaryRight: { flex: 1, gap: Spacing.xs },
  summaryRate: { fontSize: Typography.xxxl, fontWeight: Typography.bold, color: Colors.text },
  summaryLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  summaryDetail: { fontSize: Typography.xs, color: Colors.textMuted },
  summaryStats: { flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.xs },
  summaryStat: {},
  summaryStatVal: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  summaryStatLabel: { fontSize: Typography.xs, color: Colors.textMuted },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.purple, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  addBtnText: { fontSize: Typography.sm, color: '#fff', fontWeight: Typography.semibold },
  habitCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  pressed: { opacity: 0.75 },
  habitTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  habitIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  habitInfo: { flex: 1, gap: 2 },
  habitName: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  habitNameDone: { color: Colors.textMuted },
  habitMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  habitMetaText: { fontSize: Typography.xs, color: Colors.textMuted },
  habitMetaDot: { fontSize: Typography.xs, color: Colors.textDisabled },
  doneBtn: { width: 32, height: 32, borderRadius: Radius.full, backgroundColor: Colors.cardElevated, alignItems: 'center', justifyContent: 'center' },
  doneBtnEmpty: { width: 18, height: 18, borderRadius: Radius.full, borderWidth: 2 },
  heatmap: { flexDirection: 'row', gap: 3, flexWrap: 'wrap' },
  heatCell: { width: 12, height: 12, borderRadius: 2 },
  habitFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deleteBtn: { padding: Spacing.xs },
  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  doneBadgeText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  pendingBadge: { backgroundColor: Colors.cardElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  pendingText: { fontSize: Typography.xs, color: Colors.textMuted },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textSecondary },
  emptyText: { fontSize: Typography.sm, color: Colors.textMuted },
  addHabitBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.purple + '20', borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.purple + '40' },
  addHabitBtnText: { fontSize: Typography.sm, color: Colors.purple, fontWeight: Typography.semibold },
  bottomPad: { height: Spacing.lg },
});
