import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, getProgressPercent } from '@/services/db';
import { ProgressBar, DonutChart } from '@/components';

const MENU_SECTIONS = [
  {
    title: 'Keuangan',
    items: [
      { id: 'accounts', icon: 'account-balance-wallet', label: 'Akun & Dompet', color: Colors.gold, route: '/accounts' },
      { id: 'goals', icon: 'savings', label: 'Tujuan Keuangan', color: Colors.success, route: '/goals' },
      { id: 'analytics', icon: 'analytics', label: 'Laporan Analitik', color: Colors.primary, route: '/analytics' },
    ],
  },
  {
    title: 'Produktivitas',
    items: [
      { id: 'habits', icon: 'loop', label: 'Habit Tracker', color: Colors.purple, route: '/habits' },
      { id: 'notes', icon: 'note', label: 'Catatan', color: Colors.cyan, route: '/notes' },
    ],
  },
  {
    title: 'Lainnya',
    items: [
      { id: 'notifications', icon: 'notifications', label: 'Notifikasi & Pengingat', color: Colors.orange, route: '/notifications-screen' },
    ],
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const { habits, habitCompletions, toggleHabit, goals, loading } = useApp();

  const today = new Date().toISOString().split('T')[0];
  const completedToday = habitCompletions.filter((c) => c.completed_date === today).map((c) => c.habit_id);
  const completionRate = habits.length > 0 ? Math.round((completedToday.length / habits.length) * 100) : 0;

  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Lainnya</Text>
        </View>

        {/* Today Habits Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kebiasaan Hari Ini</Text>
            <Pressable onPress={() => router.push('/habits')}><Text style={styles.seeAll}>Lihat semua</Text></Pressable>
          </View>
          <View style={styles.habitsCard}>
            <View style={styles.habitsSummary}>
              <DonutChart progress={completionRate} color={Colors.purple} size={64} strokeWidth={8} />
              <View style={styles.habitsSummaryText}>
                <Text style={styles.habitRate}>{completionRate}%</Text>
                <Text style={styles.habitRateLabel}>{completedToday.length}/{habits.length} selesai hari ini</Text>
              </View>
            </View>

            {habits.length === 0 ? (
              <Pressable style={styles.addHabitHint} onPress={() => router.push('/add-habit')}>
                <MaterialIcons name="add-circle-outline" size={18} color={Colors.purple} />
                <Text style={styles.addHabitHintText}>Tambah kebiasaan pertama kamu</Text>
              </Pressable>
            ) : (
              habits.slice(0, 4).map((habit) => {
                const isDone = completedToday.includes(habit.id);
                return (
                  <Pressable
                    key={habit.id}
                    style={({ pressed }) => [styles.habitRow, pressed && styles.pressed]}
                    onPress={() => toggleHabit(habit.id)}
                  >
                    <View style={[styles.habitCheck, { borderColor: habit.color }, isDone && { backgroundColor: habit.color }]}>
                      {isDone ? <MaterialIcons name="check" size={12} color="#fff" /> : null}
                    </View>
                    <View style={[styles.habitIconWrap, { backgroundColor: habit.color + '20' }]}>
                      <MaterialIcons name={habit.icon as any} size={16} color={habit.color} />
                    </View>
                    <View style={styles.habitInfo}>
                      <Text style={[styles.habitName, isDone && styles.habitNameDone]} numberOfLines={1}>{habit.name}</Text>
                      <Text style={styles.habitStreak}>{habit.streak} hari streak</Text>
                    </View>
                    <View style={[styles.streakBadge, { backgroundColor: habit.color + '20' }]}>
                      <Text style={[styles.streakNum, { color: habit.color }]}>{habit.streak}</Text>
                      <MaterialIcons name="local-fire-department" size={12} color={habit.color} />
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

        {/* Goals Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tujuan Keuangan</Text>
            <Pressable onPress={() => router.push('/goals')}><Text style={styles.seeAll}>Lihat semua</Text></Pressable>
          </View>

          {goals.length === 0 ? (
            <Pressable style={styles.addGoalHint} onPress={() => router.push('/add-goal')}>
              <MaterialIcons name="savings" size={32} color={Colors.textDisabled} />
              <Text style={styles.addGoalText}>Belum ada tujuan. Buat tujuan pertama kamu!</Text>
              <View style={styles.addGoalBtn}>
                <MaterialIcons name="add" size={16} color={Colors.success} />
                <Text style={[styles.addGoalBtnText, { color: Colors.success }]}>Tambah Tujuan</Text>
              </View>
            </Pressable>
          ) : (
            <>
              <View style={styles.goalsOverview}>
                <View>
                  <Text style={styles.goalsTotalLabel}>Total Tersimpan</Text>
                  <Text style={styles.goalsTotalValue}>{formatCurrency(totalSaved, true)}</Text>
                </View>
                <View>
                  <Text style={styles.goalsTotalLabel}>Target Total</Text>
                  <Text style={styles.goalsTotalTarget}>{formatCurrency(totalTarget, true)}</Text>
                </View>
                <DonutChart progress={getProgressPercent(totalSaved, totalTarget)} color={Colors.success} size={60} />
              </View>

              {goals.slice(0, 3).map((goal) => {
                const progress = getProgressPercent(goal.current_amount, goal.target_amount);
                return (
                  <Pressable key={goal.id} style={({ pressed }) => [styles.goalCard, pressed && styles.pressed]} onPress={() => router.push('/goals')}>
                    <View style={[styles.goalIcon, { backgroundColor: goal.color + '20' }]}>
                      <MaterialIcons name={goal.icon as any} size={20} color={goal.color} />
                    </View>
                    <View style={styles.goalInfo}>
                      <View style={styles.goalTitleRow}>
                        <Text style={styles.goalName} numberOfLines={1}>{goal.name}</Text>
                        <Text style={styles.goalProgress}>{progress}%</Text>
                      </View>
                      <ProgressBar progress={progress} color={goal.color} height={5} />
                      <View style={styles.goalAmounts}>
                        <Text style={styles.goalCurrent}>{formatCurrency(goal.current_amount, true)}</Text>
                        <Text style={styles.goalTarget}>/ {formatCurrency(goal.target_amount, true)}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </>
          )}
        </View>

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <Pressable
                    style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
                    onPress={() => { if (item.route) router.push(item.route as any); }}
                  >
                    <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                      <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <MaterialIcons name="chevron-right" size={18} color={Colors.textMuted} />
                  </Pressable>
                  {idx < section.items.length - 1 ? <View style={styles.menuDivider} /> : null}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.appInfo}>
          <Text style={styles.appName}>VaultOS</Text>
          <Text style={styles.appVersion}>v2.0.0 — Real Data Edition</Text>
          <Text style={styles.appTagline}>Manage your life, one vault at a time.</Text>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { gap: Spacing.xl, paddingBottom: Spacing.xxl },
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base },
  title: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.text },
  section: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  seeAll: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.medium },
  habitsCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  habitsSummary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  habitsSummaryText: { flex: 1 },
  habitRate: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.text },
  habitRateLabel: { fontSize: Typography.xs, color: Colors.textMuted },
  addHabitHint: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  addHabitHintText: { fontSize: Typography.sm, color: Colors.purple },
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  pressed: { opacity: 0.7 },
  habitCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  habitIconWrap: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  habitInfo: { flex: 1 },
  habitName: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.text },
  habitNameDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  habitStreak: { fontSize: Typography.xs, color: Colors.textMuted },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  streakNum: { fontSize: Typography.xs, fontWeight: Typography.bold },
  addGoalHint: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  addGoalText: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  addGoalBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.successSurface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  addGoalBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  goalsOverview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  goalsTotalLabel: { fontSize: Typography.xs, color: Colors.textMuted, marginBottom: 2 },
  goalsTotalValue: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.success },
  goalsTotalTarget: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textSecondary },
  goalCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  goalIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  goalInfo: { flex: 1, gap: Spacing.xs },
  goalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalName: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text, flex: 1 },
  goalProgress: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.bold },
  goalAmounts: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  goalCurrent: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.text },
  goalTarget: { fontSize: Typography.xs, color: Colors.textMuted },
  menuSectionTitle: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.8 },
  menuCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.md },
  menuIcon: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.text },
  menuDivider: { height: 1, backgroundColor: Colors.borderSubtle, marginLeft: 70 },
  appInfo: { alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.lg },
  appName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.primary },
  appVersion: { fontSize: Typography.xs, color: Colors.textMuted },
  appTagline: { fontSize: Typography.xs, color: Colors.textDisabled, fontStyle: 'italic' },
  bottomPad: { height: Spacing.lg },
});
