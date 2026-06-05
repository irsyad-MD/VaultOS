import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Animated, Easing,
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

// Flame streak animation
function FlameStreak({ streak }: { streak: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (streak === 0) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.25, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [streak]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <MaterialIcons name="local-fire-department" size={13} color={Colors.orange} />
    </Animated.View>
  );
}

// Checkmark spring burst when toggled
function CheckBurst({ isDone, color }: { isDone: boolean; color: string }) {
  const scale = useRef(new Animated.Value(isDone ? 1 : 0)).current;
  const prevDone = useRef(isDone);

  useEffect(() => {
    if (isDone && !prevDone.current) {
      scale.setValue(0);
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
    } else if (!isDone && prevDone.current) {
      Animated.timing(scale, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }
    prevDone.current = isDone;
  }, [isDone]);

  return (
    <View style={[styles.doneBtn, isDone && { backgroundColor: color }]}>
      {isDone ? (
        <Animated.View style={{ transform: [{ scale }] }}>
          <MaterialIcons name="check" size={18} color="#fff" />
        </Animated.View>
      ) : (
        <View style={[styles.doneBtnEmpty, { borderColor: color }]} />
      )}
    </View>
  );
}

// Animated habit card with slide-in
function HabitCard({
  habit, isDone, habitDates, today, last21, onToggle, onDelete, animDelay,
}: {
  habit: any; isDone: boolean; habitDates: string[]; today: string;
  last21: string[]; onToggle: () => void; onDelete: () => void; animDelay: number;
}) {
  const translateX = useRef(new Animated.Value(-30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, delay: animDelay, friction: 8, tension: 70, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 380, delay: animDelay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, delay: animDelay, friction: 8, tension: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(pressScale, { toValue: 0.96, friction: 8, tension: 200, useNativeDriver: true }),
      Animated.spring(pressScale, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }, { scale: cardScale }] }}>
      <Animated.View style={{ transform: [{ scale: pressScale }] }}>
        <Pressable style={styles.habitCard} onPress={handlePress}>
          <View style={styles.habitTop}>
            <View style={[styles.habitIcon, { backgroundColor: habit.color + '22' }]}>
              <MaterialIcons name={habit.icon as any} size={22} color={habit.color} />
            </View>
            <View style={styles.habitInfo}>
              <Text style={[styles.habitName, isDone && styles.habitNameDone]}>{habit.name}</Text>
              <View style={styles.habitMeta}>
                <FlameStreak streak={habit.streak} />
                <Text style={styles.habitMetaText}>{habit.streak} hari streak</Text>
                {habit.longest_streak > 0 ? (
                  <>
                    <Text style={styles.habitMetaDot}>·</Text>
                    <MaterialIcons name="emoji-events" size={11} color={Colors.gold} />
                    <Text style={styles.habitMetaText}>{habit.longest_streak} terbaik</Text>
                  </>
                ) : null}
                <Text style={styles.habitMetaDot}>·</Text>
                <Text style={styles.habitMetaText}>{habit.frequency === 'daily' ? 'Harian' : 'Mingguan'}</Text>
              </View>
            </View>
            <CheckBurst isDone={isDone} color={habit.color} />
          </View>

          {/* Heatmap */}
          <View style={styles.heatmap}>
            {last21.map((date, i) => {
              const isCompleted = habitDates.includes(date);
              const isToday = date === today;
              return (
                <View
                  key={i}
                  style={[
                    styles.heatCell,
                    { backgroundColor: isCompleted ? habit.color : Colors.cardElevated },
                    isToday && { borderWidth: 1.5, borderColor: habit.color },
                    !isCompleted && { opacity: 0.45 },
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.habitFooter}>
            <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
              <MaterialIcons name="delete-outline" size={16} color={Colors.textDisabled} />
            </Pressable>
            {isDone ? (
              <View style={[styles.doneBadge, { backgroundColor: habit.color + '22' }]}>
                <MaterialIcons name="check-circle" size={12} color={habit.color} />
                <Text style={[styles.doneBadgeText, { color: habit.color }]}>Selesai hari ini</Text>
              </View>
            ) : (
              <View style={styles.pendingBadge}>
                <MaterialIcons name="radio-button-unchecked" size={12} color={Colors.textMuted} />
                <Text style={styles.pendingText}>Ketuk untuk selesaikan</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

export default function HabitsScreen() {
  const { habits, habitCompletions, toggleHabit, removeHabit, loading } = useApp();
  const router = useRouter();
  const last21 = getLastNDates(21);

  const today = new Date().toISOString().split('T')[0];
  const completedToday = habitCompletions.filter((c) => c.completed_date === today).map((c) => c.habit_id);
  const completionRate = habits.length > 0 ? Math.round((completedToday.length / habits.length) * 100) : 0;

  const getHabitDates = useCallback((habitId: string) =>
    habitCompletions.filter((c) => c.habit_id === habitId).map((c) => c.completed_date),
    [habitCompletions]
  );

  // Summary card animation
  const summaryOpacity = useRef(new Animated.Value(0)).current;
  const summaryTranslateY = useRef(new Animated.Value(20)).current;
  const summaryScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(summaryOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(summaryTranslateY, { toValue: 0, friction: 8, tension: 70, useNativeDriver: true }),
      Animated.spring(summaryScale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  // Donut progress animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, { toValue: completionRate, duration: 900, delay: 300, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [completionRate]);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Summary Card */}
      <Animated.View style={[styles.summaryCard, { opacity: summaryOpacity, transform: [{ translateY: summaryTranslateY }, { scale: summaryScale }] }]}>
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
              <Text style={styles.summaryStatLabel}>Total Habit</Text>
            </View>
            {habits.length > 0 ? (
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryStatVal, { color: Colors.orange }]}>
                  {Math.max(...habits.map((h) => h.streak), 0)}
                </Text>
                <Text style={styles.summaryStatLabel}>🔥 Max Streak</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>

      {/* Section Header */}
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

      {habits.map((habit, index) => {
        const isDone = completedToday.includes(habit.id);
        const habitDates = getHabitDates(habit.id);
        return (
          <HabitCard
            key={habit.id}
            habit={habit}
            isDone={isDone}
            habitDates={habitDates}
            today={today}
            last21={last21}
            onToggle={() => toggleHabit(habit.id)}
            onDelete={() => removeHabit(habit.id)}
            animDelay={100 + index * 80}
          />
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
  summaryStat: { gap: 1 },
  summaryStatVal: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  summaryStatLabel: { fontSize: Typography.xs, color: Colors.textMuted },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.purple, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  addBtnText: { fontSize: Typography.sm, color: '#fff', fontWeight: Typography.semibold },
  habitCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
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
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.cardElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  pendingText: { fontSize: Typography.xs, color: Colors.textMuted },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textSecondary },
  emptyText: { fontSize: Typography.sm, color: Colors.textMuted },
  addHabitBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.purple + '20', borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.purple + '40' },
  addHabitBtnText: { fontSize: Typography.sm, color: Colors.purple, fontWeight: Typography.semibold },
  bottomPad: { height: Spacing.lg },
});
