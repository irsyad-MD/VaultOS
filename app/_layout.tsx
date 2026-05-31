import { AlertProvider, AuthProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { AppProvider } from '@/contexts/AppContext';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, savePushToken } from '@/services/notificationService';
import { getSupabaseClient } from '@/template';

function NotificationSetup() {
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // Register push token
    registerForPushNotificationsAsync().then(async (token) => {
      if (token) {
        const { data: { user } } = await getSupabaseClient().auth.getUser();
        if (user) await savePushToken(user.id, token);
      }
    });

    // Listen for notifications in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification.request.content.title);
    });

    // Listen for user tapping notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response.notification.request.content.data);
    });

    return () => {
      if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <AppProvider>
            <View style={styles.root}>
              <StatusBar style="light" />
              <NotificationSetup />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: Colors.background },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen
                  name="habits"
                  options={{
                    headerShown: true,
                    headerTitle: 'Habit Tracker',
                    headerStyle: { backgroundColor: Colors.surface },
                    headerTintColor: Colors.text,
                    headerShadowVisible: false,
                  }}
                />
                <Stack.Screen
                  name="goals"
                  options={{
                    headerShown: true,
                    headerTitle: 'Tujuan Keuangan',
                    headerStyle: { backgroundColor: Colors.surface },
                    headerTintColor: Colors.text,
                    headerShadowVisible: false,
                  }}
                />
                <Stack.Screen
                  name="accounts"
                  options={{
                    headerShown: true,
                    headerTitle: 'Akun & Dompet',
                    headerStyle: { backgroundColor: Colors.surface },
                    headerTintColor: Colors.text,
                    headerShadowVisible: false,
                  }}
                />
                <Stack.Screen
                  name="add-transaction"
                  options={{
                    headerShown: true,
                    headerTitle: 'Tambah Transaksi',
                    headerStyle: { backgroundColor: Colors.surface },
                    headerTintColor: Colors.text,
                    headerShadowVisible: false,
                    presentation: 'modal',
                  }}
                />
                <Stack.Screen
                  name="add-event"
                  options={{
                    headerShown: true,
                    headerTitle: 'Tambah Jadwal',
                    headerStyle: { backgroundColor: Colors.surface },
                    headerTintColor: Colors.text,
                    headerShadowVisible: false,
                    presentation: 'modal',
                  }}
                />
                <Stack.Screen
                  name="add-task"
                  options={{
                    headerShown: true,
                    headerTitle: 'Tambah Tugas',
                    headerStyle: { backgroundColor: Colors.surface },
                    headerTintColor: Colors.text,
                    headerShadowVisible: false,
                    presentation: 'modal',
                  }}
                />
                <Stack.Screen
                  name="add-goal"
                  options={{
                    headerShown: true,
                    headerTitle: 'Tujuan Baru',
                    headerStyle: { backgroundColor: Colors.surface },
                    headerTintColor: Colors.text,
                    headerShadowVisible: false,
                    presentation: 'modal',
                  }}
                />
                <Stack.Screen
                  name="add-habit"
                  options={{
                    headerShown: true,
                    headerTitle: 'Kebiasaan Baru',
                    headerStyle: { backgroundColor: Colors.surface },
                    headerTintColor: Colors.text,
                    headerShadowVisible: false,
                    presentation: 'modal',
                  }}
                />
                <Stack.Screen
                  name="add-account"
                  options={{
                    headerShown: true,
                    headerTitle: 'Tambah Akun',
                    headerStyle: { backgroundColor: Colors.surface },
                    headerTintColor: Colors.text,
                    headerShadowVisible: false,
                    presentation: 'modal',
                  }}
                />
                <Stack.Screen
                  name="notes"
                  options={{
                    headerShown: true,
                    headerTitle: 'Catatan',
                    headerStyle: { backgroundColor: Colors.surface },
                    headerTintColor: Colors.text,
                    headerShadowVisible: false,
                  }}
                />
                <Stack.Screen
                  name="analytics"
                  options={{
                    headerShown: true,
                    headerTitle: 'Laporan Analitik',
                    headerStyle: { backgroundColor: Colors.surface },
                    headerTintColor: Colors.text,
                    headerShadowVisible: false,
                  }}
                />
                <Stack.Screen
                  name="notifications-screen"
                  options={{
                    headerShown: true,
                    headerTitle: 'Notifikasi',
                    headerStyle: { backgroundColor: Colors.surface },
                    headerTintColor: Colors.text,
                    headerShadowVisible: false,
                  }}
                />
              </Stack>
            </View>
          </AppProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
});
