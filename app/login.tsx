import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring, Easing,
} from 'react-native-reanimated';
import { useAuth, useAlert, AuthRouter } from '@/template';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Image } from 'expo-image';

function LoginContent() {
  const { signUpWithPassword, signInWithPassword, sendOTP, verifyOTPAndLogin, operationLoading } = useAuth();
  const { showAlert } = useAlert();
  const [mode, setMode] = useState<'login' | 'register' | 'otp'>('login');

  // Animations
  const heroOpacity = useSharedValue(0);
  const heroScale = useSharedValue(1.06);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(32);
  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    heroScale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    formOpacity.value = withDelay(200, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    formTranslateY.value = withDelay(200, withSpring(0, { damping: 18, stiffness: 110 }));
  }, []);
  const heroAnim = useAnimatedStyle(() => ({ opacity: heroOpacity.value, transform: [{ scale: heroScale.value }] }));
  const formAnim = useAnimatedStyle(() => ({ opacity: formOpacity.value, transform: [{ translateY: formTranslateY.value }] }));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { showAlert('Lengkapi Data', 'Email dan password wajib diisi.'); return; }
    const { error } = await signInWithPassword(email, password);
    if (error) showAlert('Login Gagal', error);
  };

  const handleRegister = async () => {
    if (!email || !password) { showAlert('Lengkapi Data', 'Email dan password wajib diisi.'); return; }
    if (password !== confirmPassword) { showAlert('Password Tidak Sama', 'Konfirmasi password tidak cocok.'); return; }
    if (password.length < 6) { showAlert('Password Terlalu Pendek', 'Password minimal 6 karakter.'); return; }

    // Send OTP first
    const { error } = await sendOTP(email);
    if (error) { showAlert('Gagal', error); return; }
    setOtpSent(true);
    setMode('otp');
    showAlert('Kode OTP Dikirim', `Cek email ${email} untuk kode verifikasi.`);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 4) { showAlert('OTP Tidak Valid', 'Masukkan kode OTP dari email.'); return; }
    const { error } = await verifyOTPAndLogin(email, otp, { password });
    if (error) showAlert('Verifikasi Gagal', error);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Hero */}
        <Animated.View style={[styles.heroContainer, heroAnim]}>
          <Image source={require('@/assets/images/hero-onboarding.png')} style={styles.heroImage} contentFit="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroBranding}>
            <Text style={styles.heroTitle}>VaultOS</Text>
            <Text style={styles.heroSubtitle}>Personal Finance Operating System</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.form, formAnim]}>
          {/* Mode Selector */}
          <View style={styles.modeRow}>
            <Pressable style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]} onPress={() => setMode('login')}>
              <Text style={[styles.modeBtnText, mode === 'login' && styles.modeBtnTextActive]}>Masuk</Text>
            </Pressable>
            <Pressable style={[styles.modeBtn, (mode === 'register' || mode === 'otp') && styles.modeBtnActive]} onPress={() => setMode('register')}>
              <Text style={[styles.modeBtnText, (mode === 'register' || mode === 'otp') && styles.modeBtnTextActive]}>Daftar</Text>
            </Pressable>
          </View>

          {mode !== 'otp' ? (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="email" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="nama@email.com"
                    placeholderTextColor={Colors.textDisabled}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="lock" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Minimal 6 karakter"
                    placeholderTextColor={Colors.textDisabled}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              {mode === 'register' ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Konfirmasi Password</Text>
                  <View style={styles.inputWrap}>
                    <MaterialIcons name="lock-outline" size={18} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder="Ulangi password"
                      placeholderTextColor={Colors.textDisabled}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                    />
                  </View>
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.otpSection}>
              <View style={styles.otpInfo}>
                <MaterialIcons name="mark-email-read" size={32} color={Colors.primary} />
                <Text style={styles.otpTitle}>Verifikasi Email</Text>
                <Text style={styles.otpDesc}>Kode OTP dikirim ke {email}</Text>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Kode OTP (4 digit)</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="vpn-key" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="0000"
                    placeholderTextColor={Colors.textDisabled}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="numeric"
                    maxLength={4}
                    autoFocus
                  />
                </View>
              </View>
            </View>
          )}

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed, operationLoading && styles.submitDisabled]}
            onPress={mode === 'login' ? handleLogin : mode === 'otp' ? handleVerifyOTP : handleRegister}
            disabled={operationLoading}
          >
            {operationLoading ? (
              <Text style={styles.submitText}>Memproses...</Text>
            ) : (
              <>
                <MaterialIcons name={mode === 'login' ? 'login' : mode === 'otp' ? 'verified' : 'person-add'} size={20} color="#fff" />
                <Text style={styles.submitText}>
                  {mode === 'login' ? 'Masuk ke VaultOS' : mode === 'otp' ? 'Verifikasi & Buat Akun' : 'Daftar Sekarang'}
                </Text>
              </>
            )}
          </Pressable>

          {mode === 'otp' ? (
            <Pressable style={styles.backToRegister} onPress={() => setMode('register')}>
              <MaterialIcons name="arrow-back" size={16} color={Colors.textMuted} />
              <Text style={styles.backText}>Kembali ke pendaftaran</Text>
            </Pressable>
          ) : null}

          <Text style={styles.watermark}>by ImsyadDeveloper</Text>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function LoginScreen() {
  return <LoginContent />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1 },
  heroContainer: { height: 280, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(9,9,11,0.55)' },
  heroBranding: { position: 'absolute', bottom: 24, left: 24, right: 24 },
  heroTitle: { fontSize: Typography.display, fontWeight: Typography.extrabold, color: '#fff', letterSpacing: -1 },
  heroSubtitle: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  form: { flex: 1, padding: Spacing.xl, gap: Spacing.xl },
  modeRow: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.md, padding: 3, borderWidth: 1, borderColor: Colors.border },
  modeBtn: { flex: 1, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm },
  modeBtnActive: { backgroundColor: Colors.primary },
  modeBtnText: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: Typography.semibold },
  modeBtnTextActive: { color: '#fff' },
  fieldGroup: { gap: Spacing.sm },
  fieldLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.base, gap: Spacing.sm, height: 52 },
  input: { flex: 1, fontSize: Typography.base, color: Colors.text },
  otpSection: { gap: Spacing.xl },
  otpInfo: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  otpTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  otpDesc: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  otpInput: { fontSize: Typography.xl, fontWeight: Typography.bold, letterSpacing: 8, textAlign: 'center' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 56, borderRadius: Radius.lg, backgroundColor: Colors.primary },
  submitDisabled: { backgroundColor: Colors.cardElevated },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  submitText: { fontSize: Typography.md, fontWeight: Typography.bold, color: '#fff' },
  backToRegister: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
  backText: { fontSize: Typography.sm, color: Colors.textMuted },
  watermark: { fontSize: Typography.xs, color: Colors.textDisabled, textAlign: 'center', fontStyle: 'italic', marginTop: Spacing.sm },
  disclaimer: { fontSize: Typography.xs, color: Colors.textDisabled, textAlign: 'center' },
});
