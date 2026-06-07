import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring, Easing,
} from 'react-native-reanimated';
import { useAuth, useAlert, getSupabaseClient } from '@/template';
import { useApp } from '@/contexts/AppContext';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { formatCurrency } from '@/services/db';

interface ProfileData {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  whatsapp_number: string | null;
  avatar_url: string | null;
}

function StatBox({ label, value, color = Colors.primary }: { label: string; value: string; color?: string }) {
  return (
    <View style={[styles.statBox, { borderColor: color + '30' }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const { transactions, habits, habitCompletions, goals, tasks } = useApp();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [saving, setSaving] = useState(false);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    translateY.value = withDelay(100, withSpring(0, { damping: 18, stiffness: 110 }));
  }, []);
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    const sb = getSupabaseClient();
    const { data } = await sb.from('user_profiles').select('*').eq('id', user.id).single();
    if (data) {
      setProfile(data as ProfileData);
      setEditUsername(data.username ?? '');
      setEditFullName(data.full_name ?? '');
      setEditWhatsapp(data.whatsapp_number ?? '');
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    if (editWhatsapp) {
      const waClean = editWhatsapp.replace(/\D/g, '');
      if (!/^628\d{8,12}$/.test(waClean)) {
        showAlert('Format Nomor Salah', 'Gunakan format: 6281234567890');
        return;
      }
    }
    setSaving(true);
    try {
      const sb = getSupabaseClient();
      await sb.from('user_profiles').update({
        username: editUsername || null,
        full_name: editFullName || null,
        whatsapp_number: editWhatsapp || null,
      }).eq('id', user.id);
      await loadProfile();
      setEditMode(false);
      showAlert('Berhasil', 'Profil berhasil diperbarui.');
    } catch {
      showAlert('Gagal', 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    showAlert('Keluar dari VaultOS?', 'Kamu akan keluar dari akun ini.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar', style: 'destructive', onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  // ── Statistics ─────────────────────────────────────────────────────────────
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const maxLongest = habits.reduce((max, h) => Math.max(max, h.longest_streak), 0);
  const totalHabitDone = habitCompletions.length;
  const tasksDone = tasks.filter((t) => t.status === 'done').length;

  const displayName = profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Animated.View style={anim}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
              <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Profil</Text>
            <Pressable onPress={() => setEditMode(!editMode)} style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}>
              <MaterialIcons name={editMode ? 'close' : 'edit'} size={20} color={Colors.primary} />
            </Pressable>
          </View>

          {/* Avatar & Name */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={styles.avatarOnline} />
            </View>
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.emailText}>{user?.email}</Text>
            {profile?.whatsapp_number ? (
              <View style={styles.waBadge}>
                <MaterialIcons name="whatsapp" size={14} color={Colors.success} />
                <Text style={styles.waBadgeText}>{profile.whatsapp_number}</Text>
              </View>
            ) : null}
          </View>

          {/* Edit Form */}
          {editMode ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Edit Profil</Text>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nama Lengkap</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="person" size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={editFullName}
                    onChangeText={setEditFullName}
                    placeholder="Nama lengkap"
                    placeholderTextColor={Colors.textDisabled}
                  />
                </View>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Username</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="alternate-email" size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={editUsername}
                    onChangeText={setEditUsername}
                    placeholder="username"
                    placeholderTextColor={Colors.textDisabled}
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nomor WhatsApp</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="whatsapp" size={16} color={Colors.success} />
                  <TextInput
                    style={styles.input}
                    value={editWhatsapp}
                    onChangeText={setEditWhatsapp}
                    placeholder="628xxxxxxxxxx"
                    placeholderTextColor={Colors.textDisabled}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="save" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : null}

          {/* Stats Grid */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Statistik Keuangan</Text>
            <View style={styles.statsGrid}>
              <StatBox label="Total Transaksi" value={String(transactions.length)} color={Colors.primary} />
              <StatBox label="Pemasukan" value={formatCurrency(totalIncome, true)} color={Colors.success} />
              <StatBox label="Pengeluaran" value={formatCurrency(totalExpense, true)} color={Colors.danger} />
              <StatBox label="Total Goal" value={String(goals.length)} color={Colors.gold} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Statistik Produktivitas</Text>
            <View style={styles.statsGrid}>
              <StatBox label="Habit Selesai" value={String(totalHabitDone)} color={Colors.purple} />
              <StatBox label="Current Streak" value={`${maxStreak} hari`} color={Colors.orange} />
              <StatBox label="Longest Streak" value={`${maxLongest} hari`} color={Colors.gold} />
              <StatBox label="Task Selesai" value={String(tasksDone)} color={Colors.cyan} />
            </View>
          </View>

          {/* Logout */}
          <Pressable
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={20} color={Colors.danger} />
            <Text style={styles.logoutText}>Keluar dari Akun</Text>
          </Pressable>

          <Text style={styles.watermark}>by ImsyadDeveloper</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { gap: Spacing.xl, paddingBottom: 40 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.base },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text, textAlign: 'center' },
  editBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  avatarSection: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    ...Shadows.primary,
  },
  avatarText: { fontSize: 36, fontWeight: Typography.bold, color: '#fff' },
  avatarOnline: {
    position: 'absolute', bottom: 4, right: 4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.success, borderWidth: 2, borderColor: Colors.background,
  },
  displayName: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text },
  emailText: { fontSize: Typography.sm, color: Colors.textMuted },
  waBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.successSurface, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: Colors.success + '30',
  },
  waBadgeText: { fontSize: Typography.xs, color: Colors.success, fontWeight: Typography.semibold },
  card: {
    marginHorizontal: Spacing.base, backgroundColor: Colors.card,
    borderRadius: Radius.xl, padding: Spacing.base, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.7 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statBox: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.cardElevated,
    borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', gap: 4,
    borderWidth: 1,
  },
  statValue: { fontSize: Typography.lg, fontWeight: Typography.bold },
  statLabel: { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center' },
  fieldGroup: { gap: Spacing.xs },
  fieldLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardElevated,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.base, gap: Spacing.sm, height: 48,
  },
  input: { flex: 1, fontSize: Typography.sm, color: Colors.text },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, height: 50, borderRadius: Radius.md, backgroundColor: Colors.primary, marginTop: Spacing.xs,
  },
  saveBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: '#fff' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, height: 52, borderRadius: Radius.md, marginHorizontal: Spacing.base,
    backgroundColor: Colors.dangerSurface, borderWidth: 1, borderColor: Colors.dangerMuted,
  },
  logoutText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.danger },
  watermark: { fontSize: Typography.xs, color: Colors.textDisabled, textAlign: 'center', fontStyle: 'italic', paddingBottom: Spacing.base },
});
