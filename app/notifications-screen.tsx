import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useAlert } from '@/template';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { sendLocalNotification } from '@/services/notificationService';
import { useApp } from '@/contexts/AppContext';

interface ScheduledItem {
  id: string;
  title: string;
  body: string;
  type: 'event' | 'task' | 'other';
  triggerInfo: string;
  triggerDate?: Date;
}

export default function NotificationsScreen() {
  const { showAlert } = useAlert();
  const { events, tasks } = useApp();
  const [scheduled, setScheduled] = useState<ScheduledItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customTitle, setCustomTitle] = useState('VaultOS Pengingat');
  const [customBody, setCustomBody] = useState('Jangan lupa cek keuangan kamu!');

  useEffect(() => {
    loadScheduled();
  }, []);

  const loadScheduled = async () => {
    setLoading(true);
    try {
      const all = await Notifications.getAllScheduledNotificationsAsync();
      const items: ScheduledItem[] = all
        .filter((n) => {
          // Only show event and task notifications (not repeating general ones)
          return n.identifier.startsWith('event-') || n.identifier.startsWith('task-');
        })
        .map((n) => {
          const trigger = n.trigger as any;
          let triggerDate: Date | undefined;
          let triggerInfo = 'Terjadwal';

          if (trigger?.date) {
            triggerDate = new Date(trigger.date);
            triggerInfo = triggerDate.toLocaleString('id-ID', {
              weekday: 'short', day: 'numeric', month: 'short',
              hour: '2-digit', minute: '2-digit',
            });
          } else if (trigger?.value) {
            triggerDate = new Date(trigger.value);
            triggerInfo = triggerDate.toLocaleString('id-ID', {
              weekday: 'short', day: 'numeric', month: 'short',
              hour: '2-digit', minute: '2-digit',
            });
          }

          const isTask = n.identifier.startsWith('task-');
          const type: 'event' | 'task' | 'other' = isTask ? 'task' : 'event';

          return {
            id: n.identifier,
            title: n.content.title ?? 'Notifikasi',
            body: n.content.body ?? '',
            type,
            triggerInfo,
            triggerDate,
          };
        })
        .sort((a, b) => {
          if (a.triggerDate && b.triggerDate) return a.triggerDate.getTime() - b.triggerDate.getTime();
          return 0;
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
    showAlert('Notifikasi Dikirim', 'Notifikasi test langsung terkirim. Cek notification bar.');
  };

  const handleCancel = async (id: string) => {
    await Notifications.cancelScheduledNotificationAsync(id);
    setScheduled((prev) => prev.filter((n) => n.id !== id));
  };

  const handleCancelAll = async () => {
    showAlert('Hapus Semua', 'Yakin ingin menghapus semua pengingat jadwal dan tugas?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive', onPress: async () => {
          // Only cancel event and task notifications
          for (const item of scheduled) {
            await Notifications.cancelScheduledNotificationAsync(item.id);
          }
          setScheduled([]);
        }
      },
    ]);
  };

  // Count upcoming events/tasks with reminders
  const upcomingEventsWithReminder = events.filter((e) => e.reminder_minutes > 0 && new Date(e.date).getTime() > Date.now());
  const upcomingTasksWithDeadline = tasks.filter((t) => t.due_date && t.status !== 'done' && new Date(t.due_date).getTime() > Date.now());

  const renderItem = ({ item }: { item: ScheduledItem }) => {
    const isTask = item.type === 'task';
    const iconColor = isTask ? Colors.danger : Colors.primary;
    const iconBg = isTask ? Colors.dangerSurface : Colors.primaryMuted;
    const iconName = isTask ? 'assignment-late' : 'event';

    return (
      <View style={styles.notifCard}>
        <View style={[styles.notifIconWrap, { backgroundColor: iconBg }]}>
          <MaterialIcons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={styles.notifInfo}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
          <View style={styles.notifMeta}>
            <MaterialIcons name="alarm" size={12} color={Colors.textMuted} />
            <Text style={styles.notifTrigger}>{item.triggerInfo}</Text>
            <View style={[styles.typeBadge, { backgroundColor: isTask ? Colors.dangerSurface : Colors.primaryMuted }]}>
              <Text style={[styles.typeBadgeText, { color: isTask ? Colors.danger : Colors.primary }]}>
                {isTask ? 'Tugas' : 'Jadwal'}
              </Text>
            </View>
          </View>
        </View>
        <Pressable onPress={() => handleCancel(item.id)} hitSlop={8} style={styles.cancelBtn}>
          <MaterialIcons name="close" size={16} color={Colors.textMuted} />
        </Pressable>
      </View>
    );
  };

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
            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: Colors.primarySurface, borderColor: Colors.primary + '30' }]}>
                <MaterialIcons name="event" size={20} color={Colors.primary} />
                <Text style={[styles.statNum, { color: Colors.primary }]}>{upcomingEventsWithReminder.length}</Text>
                <Text style={[styles.statLabel, { color: Colors.primary }]}>Jadwal aktif</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: Colors.dangerSurface, borderColor: Colors.danger + '30' }]}>
                <MaterialIcons name="assignment-late" size={20} color={Colors.danger} />
                <Text style={[styles.statNum, { color: Colors.danger }]}>{upcomingTasksWithDeadline.length}</Text>
                <Text style={[styles.statLabel, { color: Colors.danger }]}>Deadline aktif</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: Colors.warningSurface, borderColor: Colors.warning + '30' }]}>
                <MaterialIcons name="notifications-active" size={20} color={Colors.warning} />
                <Text style={[styles.statNum, { color: Colors.warning }]}>{scheduled.length}</Text>
                <Text style={[styles.statLabel, { color: Colors.warning }]}>Alarm terjadwal</Text>
              </View>
            </View>

            {/* Test notification */}
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

            {/* Info section */}
            <View style={styles.infoBox}>
              <MaterialIcons name="info-outline" size={16} color={Colors.primary} />
              <Text style={styles.infoText}>
                Pengingat otomatis dari Jadwal dan Tugas tersimpan di sini. Tambah jadwal dengan alarm di halaman Jadwal, atau set deadline tugas di halaman Tugas.
              </Text>
            </View>

            {/* List header */}
            {scheduled.length > 0 ? (
              <View style={styles.listHeader}>
                <Text style={styles.sectionTitle}>{scheduled.length} Alarm Aktif</Text>
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
                Tambah jadwal dengan reminder di halaman Jadwal, atau set deadline tugas untuk mendapatkan notifikasi otomatis.
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
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  statCard: { flex: 1, alignItems: 'center', gap: 4, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1 },
  statNum: { fontSize: Typography.xxl, fontWeight: Typography.bold },
  statLabel: { fontSize: 10, fontWeight: Typography.semibold, textAlign: 'center' },
  section: { gap: Spacing.md },
  sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  inputGroup: { gap: Spacing.xs },
  inputLabel: { fontSize: Typography.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  textInput: { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.base, height: 44, fontSize: Typography.sm, color: Colors.text },
  testBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 48, backgroundColor: Colors.primary, borderRadius: Radius.md },
  testBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: '#fff' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.primarySurface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '30' },
  infoText: { flex: 1, fontSize: Typography.xs, color: Colors.primary, lineHeight: 18 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clearBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.dangerSurface, borderRadius: Radius.md },
  clearText: { fontSize: Typography.xs, color: Colors.danger, fontWeight: Typography.semibold },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, marginHorizontal: Spacing.base, marginBottom: Spacing.md },
  notifIconWrap: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifInfo: { flex: 1, gap: 3 },
  notifTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  notifBody: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18 },
  notifMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  notifTrigger: { fontSize: Typography.xs, color: Colors.textMuted, flex: 1 },
  typeBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 1 },
  typeBadgeText: { fontSize: 10, fontWeight: Typography.bold },
  cancelBtn: { padding: Spacing.xs },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textSecondary },
  emptyText: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  pressed: { opacity: 0.75 },
});
