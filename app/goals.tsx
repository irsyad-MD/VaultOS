import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, getProgressPercent, formatShortDate } from '@/services/db';
import { ProgressBar, DonutChart } from '@/components';
import { useRouter } from 'expo-router';

function getMonthsRemaining(deadline?: string): number {
  if (!deadline) return 0;
  const now = new Date();
  const end = new Date(deadline);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (30 * 86400 * 1000)));
}

function formatInput(raw: string): string {
  const num = raw.replace(/\D/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('id-ID').format(Number(num));
}

function parseInput(formatted: string): number {
  return Number(formatted.replace(/\D/g, ''));
}

export default function GoalsScreen() {
  const { goals, topUpGoal, removeGoal, loading } = useApp();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [topUpGoalId, setTopUpGoalId] = useState<string | null>(null);
  const [topUpRaw, setTopUpRaw] = useState('');
  const [saving, setSaving] = useState(false);

  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
  const overallProgress = getProgressPercent(totalSaved, totalTarget);

  const handleTopUp = async () => {
    const amount = parseInput(topUpRaw);
    if (!topUpGoalId || amount <= 0) { showAlert('Nominal Tidak Valid', 'Masukkan nominal top up yang valid.'); return; }
    setSaving(true);
    try {
      await topUpGoal(topUpGoalId, amount);
      setTopUpGoalId(null);
      setTopUpRaw('');
      showAlert('Top Up Berhasil', `${formatCurrency(amount)} berhasil ditambahkan ke tujuan.`);
    } catch (e: any) {
      showAlert('Gagal', e.message ?? 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    showAlert('Hapus Tujuan?', `"${name}" akan dihapus permanen.`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => removeGoal(id) },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="savings" size={40} color={Colors.textDisabled} />
        <Text style={styles.loadingText}>Memuat...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Overview */}
        {goals.length > 0 ? (
          <View style={styles.overviewCard}>
            <View style={styles.overviewLeft}>
              <DonutChart progress={overallProgress} color={Colors.success} size={90} strokeWidth={11} />
              <View style={styles.overviewCenter}>
                <Text style={styles.overviewPercent}>{overallProgress}%</Text>
              </View>
            </View>
            <View style={styles.overviewRight}>
              <Text style={styles.overviewTitle}>Progres Tabungan</Text>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatLabel}>Terkumpul</Text>
                <Text style={[styles.overviewStatVal, { color: Colors.success }]}>{formatCurrency(totalSaved, true)}</Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatLabel}>Target Total</Text>
                <Text style={styles.overviewStatVal}>{formatCurrency(totalTarget, true)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Goals List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tujuan ({goals.length})</Text>

          {goals.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="savings" size={64} color={Colors.textDisabled} />
              <Text style={styles.emptyTitle}>Belum ada tujuan</Text>
              <Text style={styles.emptyText}>Buat tujuan keuangan pertama kamu</Text>
            </View>
          ) : (
            goals.map((goal) => {
              const progress = getProgressPercent(goal.current_amount, goal.target_amount);
              const monthsLeft = getMonthsRemaining(goal.deadline);
              const remaining = goal.target_amount - goal.current_amount;
              const isOnTrack = goal.monthly_contribution > 0 && goal.monthly_contribution * monthsLeft >= remaining;

              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={[styles.goalIcon, { backgroundColor: goal.color + '20' }]}>
                      <MaterialIcons name={goal.icon as any} size={24} color={goal.color} />
                    </View>
                    <View style={styles.goalHeaderInfo}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      {goal.deadline ? (
                        <View style={styles.goalMeta}>
                          <MaterialIcons name="event" size={12} color={Colors.textMuted} />
                          <Text style={styles.goalMetaText}>{formatShortDate(goal.deadline)} · {monthsLeft} bln</Text>
                        </View>
                      ) : null}
                    </View>
                    {monthsLeft > 0 ? (
                      <View style={[styles.trackBadge, isOnTrack ? styles.trackGood : styles.trackBehind]}>
                        <MaterialIcons name={isOnTrack ? 'trending-up' : 'trending-down'} size={12} color={isOnTrack ? Colors.success : Colors.warning} />
                        <Text style={[styles.trackText, { color: isOnTrack ? Colors.success : Colors.warning }]}>{isOnTrack ? 'On Track' : 'Top Up'}</Text>
                      </View>
                    ) : null}
                    <Pressable onPress={() => handleDelete(goal.id, goal.name)} hitSlop={8}>
                      <MaterialIcons name="delete-outline" size={18} color={Colors.textDisabled} />
                    </Pressable>
                  </View>

                  <View style={styles.amountRow}>
                    <View>
                      <Text style={styles.amountLabel}>Terkumpul</Text>
                      <Text style={[styles.amountValue, { color: goal.color }]}>{formatCurrency(goal.current_amount, true)}</Text>
                    </View>
                    <View style={styles.amountCenter}>
                      <Text style={styles.progressNum}>{progress}%</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.amountLabel}>Target</Text>
                      <Text style={styles.amountTarget}>{formatCurrency(goal.target_amount, true)}</Text>
                    </View>
                  </View>

                  <ProgressBar progress={progress} color={goal.color} height={8} />

                  <View style={styles.goalFooter}>
                    <View style={styles.goalStat}>
                      <Text style={styles.goalStatLabel}>Sisa</Text>
                      <Text style={styles.goalStatVal}>{formatCurrency(Math.max(0, remaining), true)}</Text>
                    </View>
                    {goal.monthly_contribution > 0 ? (
                      <View style={styles.goalStat}>
                        <Text style={styles.goalStatLabel}>Target/Bln</Text>
                        <Text style={[styles.goalStatVal, { color: goal.color }]}>{formatCurrency(goal.monthly_contribution, true)}</Text>
                      </View>
                    ) : null}
                    <Pressable style={[styles.addFundsBtn, { borderColor: goal.color + '60' }]} onPress={() => { setTopUpGoalId(goal.id); setTopUpRaw(''); }}>
                      <MaterialIcons name="add" size={14} color={goal.color} />
                      <Text style={[styles.addFundsText, { color: goal.color }]}>Top Up</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <Pressable style={({ pressed }) => [styles.addGoal, pressed && { opacity: 0.7 }]} onPress={() => router.push('/add-goal')}>
          <MaterialIcons name="add-circle" size={22} color={Colors.primary} />
          <Text style={styles.addGoalText}>Tambah Tujuan Baru</Text>
        </Pressable>

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Top Up Modal */}
      <Modal visible={topUpGoalId !== null} transparent animationType="slide" onRequestClose={() => setTopUpGoalId(null)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Top Up Tujuan</Text>
              <Pressable onPress={() => setTopUpGoalId(null)}><MaterialIcons name="close" size={22} color={Colors.textMuted} /></Pressable>
            </View>
            <Text style={styles.modalLabel}>Nominal Top Up</Text>
            <View style={styles.currencyRow}>
              <Text style={styles.currencySymbol}>Rp</Text>
              <TextInput
                style={styles.currencyInput}
                placeholder="0"
                placeholderTextColor={Colors.textDisabled}
                value={topUpRaw}
                onChangeText={(v) => setTopUpRaw(formatInput(v))}
                keyboardType="numeric"
                autoFocus
              />
            </View>
            <Pressable
              style={[styles.topUpBtn, parseInput(topUpRaw) <= 0 && styles.topUpDisabled]}
              onPress={handleTopUp}
              disabled={parseInput(topUpRaw) <= 0 || saving}
            >
              <Text style={styles.topUpText}>{saving ? 'Menyimpan...' : `Top Up ${topUpRaw ? formatCurrency(parseInput(topUpRaw), true) : ''}`}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { gap: Spacing.xl, padding: Spacing.base, paddingBottom: Spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, gap: Spacing.md },
  loadingText: { fontSize: Typography.sm, color: Colors.textMuted },
  overviewCard: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border, gap: Spacing.xl, alignItems: 'center' },
  overviewLeft: { position: 'relative' },
  overviewCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  overviewPercent: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  overviewRight: { flex: 1, gap: Spacing.sm },
  overviewTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text, marginBottom: Spacing.xs },
  overviewStat: { flexDirection: 'row', justifyContent: 'space-between' },
  overviewStatLabel: { fontSize: Typography.sm, color: Colors.textMuted },
  overviewStatVal: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.text },
  section: { gap: Spacing.md },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  goalCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  goalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  goalIcon: { width: 48, height: 48, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  goalHeaderInfo: { flex: 1, gap: 4 },
  goalName: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  goalMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  goalMetaText: { fontSize: Typography.xs, color: Colors.textMuted },
  trackBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  trackGood: { backgroundColor: Colors.successSurface },
  trackBehind: { backgroundColor: Colors.warningSurface },
  trackText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: Spacing.xs },
  amountLabel: { fontSize: Typography.xs, color: Colors.textMuted, marginBottom: 2 },
  amountValue: { fontSize: Typography.sm, fontWeight: Typography.bold },
  amountCenter: { alignItems: 'center' },
  progressNum: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  amountTarget: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textSecondary },
  goalFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  goalStat: { flex: 1 },
  goalStatLabel: { fontSize: Typography.xs, color: Colors.textMuted },
  goalStatVal: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  addFundsBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  addFundsText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  addGoal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primaryMuted, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.primary + '40', borderStyle: 'dashed' },
  addGoalText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textSecondary },
  emptyText: { fontSize: Typography.sm, color: Colors.textMuted },
  bottomPad: { height: Spacing.lg },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  modalCard: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 48 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  modalLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  currencyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.base, height: 56 },
  currencySymbol: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textMuted, marginRight: Spacing.sm },
  currencyInput: { flex: 1, fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text },
  topUpBtn: { height: 54, borderRadius: Radius.lg, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  topUpDisabled: { backgroundColor: Colors.cardElevated },
  topUpText: { fontSize: Typography.md, fontWeight: Typography.bold, color: '#fff' },
});
