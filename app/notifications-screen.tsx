import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

interface NotifItem {
  id: string;
  title: string;
  body: string;
  date: Date;
  isScheduled: boolean;
  data?: any;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const items: NotifItem[] = scheduled.map((n) => ({
        id: n.identifier,
        title: n.content.title ?? 'Notifikasi',
        body: n.content.body ?? '',
        date: n.trigger && 'value' in n.trigger ? new Date((n.trigger as any).value) : new Date(),
        isScheduled: true,
        data: n.content.data,
      }));
      setNotifications(items);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    await Notifications.cancelScheduledNotificationAsync(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleCancelAll = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setNotifications([]);
  };

  const renderItem = ({ item }: { item: NotifItem }) => (
    <View style={styles.notifCard}>
      <View style={styles.notifIcon}>
        <MaterialIcons name="notifications" size={20} color={Colors.primary} />
      </View>
      <View style={styles.notifInfo}>
        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.notifDate}>
          {item.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Pressable onPress={() => handleCancel(item.id)} hitSlop={8} style={styles.cancelBtn}>
        <MaterialIcons name="close" size={16} color={Colors.textMuted} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.root}>
      {notifications.length > 0 ? (
        <View style={styles.header}>
          <Text style={styles.headerCount}>{notifications.length} pengingat aktif</Text>
          <Pressable onPress={handleCancelAll} style={styles.clearBtn}>
            <Text style={styles.clearText}>Hapus Semua</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={loadNotifications}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <MaterialIcons name="notifications-none" size={64} color={Colors.textDisabled} />
              <Text style={styles.emptyTitle}>Tidak ada pengingat</Text>
              <Text style={styles.emptyText}>Tambah jadwal dengan pengingat untuk melihat notifikasi di sini</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerCount: { fontSize: Typography.sm, color: Colors.textMuted },
  clearBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.dangerSurface, borderRadius: Radius.md },
  clearText: { fontSize: Typography.sm, color: Colors.danger, fontWeight: Typography.semibold },
  list: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing.xxl },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  notifIcon: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifInfo: { flex: 1, gap: 3 },
  notifTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  notifBody: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18 },
  notifDate: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  cancelBtn: { padding: Spacing.xs },
  empty: { alignItems: 'center', paddingVertical: 80, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textSecondary },
  emptyText: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
