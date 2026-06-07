import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Switch,
  ActivityIndicator, TextInput, RefreshControl, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring, Easing,
} from 'react-native-reanimated';
import { useAuth, useAlert, getSupabaseClient } from '@/template';
import { useApp } from '@/contexts/AppContext';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { formatCurrency, formatShortDate } from '@/services/db';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface UserSettings {
  id?: string;
  user_id: string;
  dark_mode: boolean;
  notifications_enabled: boolean;
  habit_reminder_enabled: boolean;
  habit_reminder_time: string;
  task_deadline_reminder: boolean;
  task_reminder_hours: number;
  event_reminder_enabled: boolean;
  whatsapp_bot_enabled: boolean;
  whatsapp_number: string | null;
  ai_insights_enabled: boolean;
  currency: string;
  language: string;
}

const DEFAULT_SETTINGS = (userId: string): UserSettings => ({
  user_id: userId,
  dark_mode: true,
  notifications_enabled: true,
  habit_reminder_enabled: true,
  habit_reminder_time: '08:00',
  task_deadline_reminder: true,
  task_reminder_hours: 24,
  event_reminder_enabled: true,
  whatsapp_bot_enabled: false,
  whatsapp_number: null,
  ai_insights_enabled: true,
  currency: 'IDR',
  language: 'id',
});

function ToggleRow({
  icon, label, desc, value, onToggle, color = Colors.primary,
}: { icon: string; label: string; desc?: string; value: boolean; onToggle: (v: boolean) => void; color?: string }) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon as any} size={18} color={color} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {desc ? <Text style={styles.settingDesc}>{desc}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.border, true: color + '60' }}
        thumbColor={value ? color : Colors.textMuted}
      />
    </View>
  );
}

function ActionRow({ icon, label, desc, color = Colors.text, onPress }: {
  icon: string; label: string; desc?: string; color?: string; onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.7 }]} onPress={onPress}>
      <View style={[styles.settingIcon, { backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon as any} size={18} color={color} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color }]}>{label}</Text>
        {desc ? <Text style={styles.settingDesc}>{desc}</Text> : null}
      </View>
      <MaterialIcons name="chevron-right" size={18} color={Colors.textMuted} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const { transactions, habits, habitCompletions, goals, tasks, notes, accounts, categories } = useApp();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    translateY.value = withDelay(80, withSpring(0, { damping: 18, stiffness: 120 }));
  }, []);
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));

  const loadSettings = useCallback(async () => {
    if (!user?.id) return;
    const sb = getSupabaseClient();
    const { data } = await sb.from('user_settings').select('*').eq('user_id', user.id).single();
    if (data) {
      setSettings(data as UserSettings);
    } else {
      // Create default settings if not exist
      const defaults = DEFAULT_SETTINGS(user.id);
      const { data: created } = await sb.from('user_settings').insert(defaults).select().single();
      setSettings((created ?? defaults) as UserSettings);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSettings();
    setRefreshing(false);
  };

  const updateSetting = async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (!settings || !user?.id) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    setSaving(true);
    try {
      const sb = getSupabaseClient();
      await sb.from('user_settings').upsert({ ...updated, user_id: user.id });
    } catch {
      showAlert('Gagal', 'Gagal menyimpan pengaturan.');
      setSettings(settings); // rollback
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const rows = [
        ['Tanggal', 'Jenis', 'Jumlah', 'Deskripsi', 'Kategori'],
        ...transactions.map((t) => {
          const cat = categories.find((c) => c.id === t.category_id);
          return [
            new Date(t.date).toLocaleDateString('id-ID'),
            t.type,
            t.amount.toString(),
            t.description,
            cat?.name ?? '-',
          ];
        }),
      ];
      const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
      const uri = FileSystem.documentDirectory + `vaultos_export_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export Data VaultOS' });
      } else {
        showAlert('Tersimpan', `File CSV tersimpan di: ${uri}`);
      }
    } catch (e: any) {
      showAlert('Gagal', 'Gagal mengekspor data.');
    }
  };

  const handleDeleteAccount = () => {
    showAlert('Hapus Akun?', 'Tindakan ini tidak dapat dibatalkan. Semua data akan dihapus permanen.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Konfirmasi', style: 'destructive', onPress: () => {
          showAlert('Konfirmasi Terakhir', 'Ketik DELETE untuk mengonfirmasi penghapusan akun.', [
            { text: 'Batal', style: 'cancel' },
            {
              text: 'Hapus Akun', style: 'destructive', onPress: async () => {
                try {
                  const sb = getSupabaseClient();
                  await sb.from('user_profiles').delete().eq('id', user?.id ?? '');
                  await logout();
                  router.replace('/login');
                } catch {
                  showAlert('Gagal', 'Gagal menghapus akun. Hubungi support.');
                }
              },
            },
          ]);
        },
      },
    ]);
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

  if (loading || !settings) {
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
            <Text style={styles.headerTitle}>Pengaturan</Text>
            {saving ? <ActivityIndicator size="small" color={Colors.primary} style={styles.savingIndicator} /> : <View style={{ width: 40 }} />}
          </View>

          {/* Appearance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tampilan</Text>
            <View style={styles.card}>
              <ToggleRow
                icon="dark-mode"
                label="Mode Gelap"
                desc="Tampilan gelap untuk kenyamanan mata"
                value={settings.dark_mode}
                onToggle={(v) => updateSetting('dark_mode', v)}
                color={Colors.primary}
              />
            </View>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifikasi</Text>
            <View style={styles.card}>
              <ToggleRow
                icon="notifications"
                label="Notifikasi"
                desc="Aktifkan semua notifikasi push"
                value={settings.notifications_enabled}
                onToggle={(v) => updateSetting('notifications_enabled', v)}
                color={Colors.orange}
              />
              <View style={styles.divider} />
              <ToggleRow
                icon="loop"
                label="Reminder Habit"
                desc={`Ingatkan habit setiap hari jam ${settings.habit_reminder_time}`}
                value={settings.habit_reminder_enabled}
                onToggle={(v) => updateSetting('habit_reminder_enabled', v)}
                color={Colors.purple}
              />
              <View style={styles.divider} />
              <ToggleRow
                icon="task-alt"
                label="Deadline Task"
                desc={`Ingatkan ${settings.task_reminder_hours} jam sebelum deadline`}
                value={settings.task_deadline_reminder}
                onToggle={(v) => updateSetting('task_deadline_reminder', v)}
                color={Colors.cyan}
              />
              <View style={styles.divider} />
              <ToggleRow
                icon="event"
                label="Reminder Jadwal"
                desc="Ingatkan sebelum jadwal dimulai"
                value={settings.event_reminder_enabled}
                onToggle={(v) => updateSetting('event_reminder_enabled', v)}
                color={Colors.gold}
              />
            </View>
          </View>

          {/* WhatsApp */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WhatsApp Bot</Text>
            <View style={styles.card}>
              <ToggleRow
                icon="whatsapp"
                label="WhatsApp Bot"
                desc="Terima notifikasi & kelola via WhatsApp"
                value={settings.whatsapp_bot_enabled}
                onToggle={(v) => updateSetting('whatsapp_bot_enabled', v)}
                color={Colors.success}
              />
              {settings.whatsapp_bot_enabled ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.settingRow}>
                    <View style={[styles.settingIcon, { backgroundColor: Colors.success + '20' }]}>
                      <MaterialIcons name="phone" size={18} color={Colors.success} />
                    </View>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingLabel}>Nomor WhatsApp Bot</Text>
                      <TextInput
                        style={styles.inlineInput}
                        value={settings.whatsapp_number ?? ''}
                        onChangeText={(v) => setSettings({ ...settings, whatsapp_number: v })}
                        onBlur={() => updateSetting('whatsapp_number', settings.whatsapp_number)}
                        placeholder="628xxxxxxxxxx"
                        placeholderTextColor={Colors.textDisabled}
                        keyboardType="phone-pad"
                        maxLength={15}
                      />
                    </View>
                  </View>
                </>
              ) : null}
            </View>
          </View>

          {/* AI */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI & Analitik</Text>
            <View style={styles.card}>
              <ToggleRow
                icon="auto-awesome"
                label="AI Insights"
                desc="Analisis keuangan cerdas dari Sydz AI"
                value={settings.ai_insights_enabled}
                onToggle={(v) => updateSetting('ai_insights_enabled', v)}
                color={Colors.primary}
              />
            </View>
          </View>

          {/* Data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data & Privasi</Text>
            <View style={styles.card}>
              <ActionRow
                icon="file-download"
                label="Export Data CSV"
                desc={`${transactions.length} transaksi siap diexport`}
                color={Colors.success}
                onPress={handleExportCSV}
              />
            </View>
          </View>

          {/* Account */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Akun</Text>
            <View style={styles.card}>
              <ActionRow
                icon="logout"
                label="Keluar"
                desc="Logout dari sesi aktif"
                color={Colors.warning}
                onPress={handleLogout}
              />
              <View style={styles.divider} />
              <ActionRow
                icon="delete-forever"
                label="Hapus Akun"
                desc="Hapus akun dan semua data permanen"
                color={Colors.danger}
                onPress={handleDeleteAccount}
              />
            </View>
          </View>

          <Text style={styles.watermark}>VaultOS — by ImsyadDeveloper</Text>
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
  savingIndicator: { width: 40 },
  section: { paddingHorizontal: Spacing.base, gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.8 },
  card: { backgroundColor: Colors.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.md },
  settingIcon: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.text },
  settingDesc: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.borderSubtle, marginLeft: 68 },
  inlineInput: {
    fontSize: Typography.sm, color: Colors.text, marginTop: 4,
    borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: 2,
  },
  watermark: { fontSize: Typography.xs, color: Colors.textDisabled, textAlign: 'center', fontStyle: 'italic', paddingBottom: Spacing.base },
});
