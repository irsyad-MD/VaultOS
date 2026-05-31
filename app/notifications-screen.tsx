import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useAlert } from '@/template';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import {
  sendLocalNotification,
  scheduleRepeatingReminder,
  cancelRepeatingReminder,
  scheduleEventReminder,
} from '@/services/notificationService';

const INTERVAL_PRESETS = [
  { label: '1 mnt', seconds: 60 },
  { label: '5 mnt', seconds: 300 },
  { label: '15 mnt', seconds: 900 },
  { label: '30 mnt', seconds: 1800 },
  { label: '1 jam', seconds: 3600 },
];

interface ScheduledItem {
  id: string;
  title: string;
  body: string;
  isRepeating: boolean;
  triggerInfo: string;
}

const REPEATING_ID = 'vaultos-repeating-reminder';

export default function NotificationsScreen() {
  const { showAlert } = useAlert();
  const [scheduled, setScheduled] = useState<ScheduledItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeInterval, setActiveInterval] = useState<number | null>(null);
  const [customTitle, setCustomTitle] = useState('VaultOS Pengingat');
  const [customBody, setCustomBody] = useState('Jangan lupa cek keuangan kamu!');

  useEffect(() => {
    loadScheduled();
  }, []);

  const loadScheduled = async () => {
    setLoading(true);
    try {
      const all = await Notifications.getAllScheduledNotificationsAsync();
      const items: ScheduledItem[] = all.map((n) => {
        const trigger = n.trigger as any;
        let triggerInfo = 'Terjadwal';
        let isRepeating = false;

        if (trigger?.type === 'timeInterval' || trigger?.type === 'SECONDS_INTERVAL' || trigger?.seconds) {
          const secs = trigger.seconds ?? trigger.value;
          if (secs >= 3600) triggerInfo = `Setiap ${Math.round(secs / 3600)} jam`;
          else if (secs >= 60) triggerInfo = `Setiap ${Math.round(secs / 60)} menit`;
          else triggerInfo = `Setiap ${secs} detik`;
          isRepeating = trigger.repeats ?? true;
          if (n.identifier === REPEATING_ID) {
            setActiveInterval(secs);
          }
        } else if (trigger?.date || trigger?.value) {
          const d = new Date(trigger.date ?? trigger.value);
          triggerInfo = d.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        } else if (!trigger) {
          triggerInfo = 'Segera';
        }

        return {
          id: n.identifier,
          title: n.content.title ?? 'Notifikasi',
          body: n.content.body ?? '',
          isRepeating,
          triggerInfo,
        };
      });
      setScheduled(items);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNow = async () => {
    await sendLocalNotification(
      customTitle || 'VaultOS Test',
      customBody || 'Notifikasi berhasil!',
      { type: 'test' }
    );
    showAlert('Notifikasi Dikirim', 'Notifikasi langsung sudah terkirim. Cek notification bar.');
  };

  const handleSetRepeating = async (seconds: number) => {
    if (activeInterval === seconds) {
      // Cancel if same interval tapped again
      await cancelRepeatingReminder(REPEATING_ID);
      setActiveInterval(null);
      await loadScheduled();
      showAlert('Pengingat Dimatikan', 'Pengingat berulang telah dihentikan.');
      return;
    }
    const id = await scheduleRepeatingReminder(
      REPEATING_ID,
      customTitle || 'VaultOS Pengingat',
      customBody || 'Jangan lupa cek keuangan kamu!',
      seconds
    );
    if (id) {
      setActiveInterval(seconds);
      await loadScheduled();
      const label = seconds >= 3600 ? `${seconds / 3600} jam` : `${seconds / 60} menit`;
      showAlert('Pengingat Aktif', `Notifikasi akan muncul setiap ${label}.`);
    } else {
      showAlert('Gagal', 'Tidak dapat membuat pengingat. Pastikan izin notifikasi sudah diberikan.');
    }
  };

  const handleCancel = async (id: string) => {
    await Notifications.cancelScheduledNotificationAsync(id);
    if (id === REPEATING_ID) setActiveInterval(null);
    setScheduled((prev) => prev.filter((n) => n.id !== id));
  };

  const handleCancelAll = async () => {
    showAlert('Hapus Semua', 'Yakin ingin menghapus semua pengingat aktif?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive', onPress: async () => {
          await Notifications.cancelAllScheduledNotificationsAsync();
          setScheduled([]);
          setActiveInterval(null);
        }
      },
    ]);
  };

  const renderItem = ({ item }: { item: ScheduledItem }) => (
    <View style={styles.notifCard}>
      <View style={[styles.notifIconWrap, { backgroundColor: item.isRepeating ? Colors.orangeSurface : Colors.primaryMuted }]}>
        <MaterialIcons
          name={item.isRepeating ? 'replay' : 'notifications'}
          size={20}
          color={item.isRepeating ? Colors.orange : Colors.primary}
        />
      </View>
      <View style={styles.notifInfo}>
        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
        <View style={styles.notifMeta}>
          <MaterialIcons name="schedule" size={12} color={Colors.textMuted} />
          <Text style={styles.notifTrigger}>{item.triggerInfo}</Text>
          {item.isRepeating ? (
            <View style={styles.repeatBadge}>
              <Text style={styles.repeatBadgeText}>Berulang</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Pressable onPress={() => handleCancel(item.id)} hitSlop={8} style={styles.cancelBtn}>
        <MaterialIcons name="close" size={16} color={Colors.textMuted} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={scheduled}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadScheduled}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Notification content */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pesan Notifikasi</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Judul</Text>
                <TextInput
                  style={styles.textInput}
                  value={customTitle}
                  onChangeText={setCustomTitle}
                  placeholder="Judul notifikasi"
                  placeholderTextColor={Colors.textDisabled}
                  maxLength={60}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pesan</Text>
                <TextInput
                  style={styles.textInput}
                  value={customBody}
                  onChangeText={setCustomBody}
                  placeholder="Isi pesan notifikasi"
                  placeholderTextColor={Colors.textDisabled}
                  maxLength={120}
                />
              </View>
            </View>

            {/* Send now */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kirim Sekarang</Text>
              <Pressable
                style={({ pressed }) => [styles.testBtn, pressed && styles.pressed]}
                onPress={handleTestNow}
              >
                <MaterialIcons name="send" size={18} color="#fff" />
                <Text style={styles.testBtnText}>Kirim Notifikasi Test</Text>
              </Pressable>
            </View>

            {/* Repeating interval */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pengingat Berulang</Text>
              <Text style={styles.sectionSubtitle}>
                Pilih interval — notifikasi akan terus muncul meski aplikasi tertutup.{'\n'}
                Ketuk lagi untuk menonaktifkan.
              </Text>
              <View style={styles.intervalRow}>
                {INTERVAL_PRESETS.map((preset) => {
                  const isActive = activeInterval === preset.seconds;
                  return (
                    <Pressable
                      key={preset.seconds}
                      style={({ pressed }) => [
                        styles.intervalBtn,
                        isActive && styles.intervalBtnActive,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => handleSetRepeating(preset.seconds)}
                    >
                      {isActive ? <MaterialIcons name="check" size={12} color="#fff" style={{ marginRight: 2 }} /> : null}
                      <Text style={[styles.intervalBtnText, isActive && styles.intervalBtnTextActive]}>
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {activeInterval ? (
                <View style={styles.activeInfo}>
                  <MaterialIcons name="replay" size={14} color={Colors.orange} />
                  <Text style={styles.activeInfoText}>
                    Pengingat aktif setiap {activeInterval >= 3600 ? `${activeInterval / 3600} jam` : `${activeInterval / 60} menit`}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Scheduled list header */}
            {scheduled.length > 0 ? (
              <View style={styles.listHeader}>
                <Text style={styles.sectionTitle}>{scheduled.length} Pengingat Aktif</Text>
                <Pressable onPress={handleCancelAll} style={styles.clearBtn}>
                  <Text style={styles.clearText}>Hapus Semua</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <MaterialIcons name="notifications-none" size={64} color={Colors.textDisabled} />
              <Text style={styles.emptyTitle}>Belum ada pengingat terjadwal</Text>
              <Text style={styles.emptyText}>
                Atur pengingat berulang di atas, atau tambah jadwal dengan reminder di halaman Kalender.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { paddingBottom: Spacing.xxl },
  header: { gap: Spacing.xl, padding: Spacing.base },
  section: { gap: Spacing.md },
  sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  sectionSubtitle: { fontSize: Typography.xs, color: Colors.textMuted, lineHeight: 18 },
  inputGroup: { gap: Spacing.xs },
  inputLabel: { fontSize: Typography.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  textInput: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    height: 44,
    fontSize: Typography.sm,
    color: Colors.text,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
  },
  testBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: '#fff' },
  intervalRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  intervalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  intervalBtnActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  intervalBtnText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  intervalBtnTextActive: { color: '#fff' },
  activeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.orangeSurface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  activeInfoText: { fontSize: Typography.xs, color: Colors.orange, fontWeight: Typography.medium },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  clearBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.dangerSurface, borderRadius: Radius.md },
  clearText: { fontSize: Typography.xs, color: Colors.danger, fontWeight: Typography.semibold },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  notifIconWrap: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifInfo: { flex: 1, gap: 3 },
  notifTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  notifBody: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18 },
  notifMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  notifTrigger: { fontSize: Typography.xs, color: Colors.textMuted, flex: 1 },
  repeatBadge: { backgroundColor: Colors.orangeSurface, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 1 },
  repeatBadgeText: { fontSize: 10, color: Colors.orange, fontWeight: Typography.bold },
  cancelBtn: { padding: Spacing.xs },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textSecondary },
  emptyText: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  pressed: { opacity: 0.75 },
});
