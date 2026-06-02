import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring, Easing,
} from 'react-native-reanimated';
import { useAuth, useAlert, AuthRouter } from '@/template';
import { getSupabaseClient } from '@/template';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Image } from 'expo-image';

type Mode = 'login' | 'register' | 'otp' | 'forgot' | 'forgot_otp' | 'reset_password';

function LoginContent() {
  const {
    signUpWithPassword, signInWithPassword,
    sendOTP, verifyOTPAndLogin, operationLoading,
  } = useAuth();
  const { showAlert } = useAlert();
  const [mode, setMode] = useState<Mode>('login');

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
  const heroAnim = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ scale: heroScale.value }],
  }));
  const formAnim = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { showAlert('Lengkapi Data', 'Email dan password wajib diisi.'); return; }
    const { error } = await signInWithPassword(email, password);
    if (error) showAlert('Login Gagal', error);
  };

  const handleRegister = async () => {
    if (!email || !password) { showAlert('Lengkapi Data', 'Email dan password wajib diisi.'); return; }
    if (password !== confirmPassword) { showAlert('Password Tidak Sama', 'Konfirmasi password tidak cocok.'); return; }
    if (password.length < 6) { showAlert('Password Terlalu Pendek', 'Password minimal 6 karakter.'); return; }
    const { error } = await sendOTP(email);
    if (error) { showAlert('Gagal', error); return; }
    setMode('otp');
    showAlert('Kode OTP Dikirim', `Cek email ${email} untuk kode verifikasi 8 digit.`);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) { showAlert('OTP Tidak Valid', 'Masukkan kode OTP dari email.'); return; }
    const { error } = await verifyOTPAndLogin(email, otp, { password });
    if (error) showAlert('Verifikasi Gagal', error);
  };

  // ── Forgot password flow ──────────────────────────────────────────────────────
  const handleSendForgotOTP = async () => {
    if (!email || !email.includes('@')) { showAlert('Email Tidak Valid', 'Masukkan alamat email yang terdaftar.'); return; }
    setSubmitting(true);
    try {
      const { error } = await sendOTP(email);
      if (error) { showAlert('Gagal', error); return; }
      setOtp('');
      setMode('forgot_otp');
      showAlert('Kode Dikirim', `Kode OTP 8 digit dikirim ke ${email}.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyForgotOTP = async () => {
    if (!otp || otp.length < 6) { showAlert('OTP Tidak Valid', 'Masukkan kode OTP dari email.'); return; }
    setSubmitting(true);
    try {
      // Verify OTP — this logs the user in temporarily so we can update password
      const { error } = await verifyOTPAndLogin(email, otp);
      if (error) { showAlert('Verifikasi Gagal', error); return; }
      setMode('reset_password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { showAlert('Password Terlalu Pendek', 'Password baru minimal 6 karakter.'); return; }
    if (newPassword !== confirmNewPassword) { showAlert('Password Tidak Sama', 'Konfirmasi password tidak cocok.'); return; }
    setSubmitting(true);
    try {
      const sb = getSupabaseClient();
      const { error } = await sb.auth.updateUser({ password: newPassword });
      if (error) { showAlert('Gagal Reset Password', error.message); return; }
      showAlert('Berhasil!', 'Password berhasil diubah. Silakan login kembali.');
      setMode('login');
      setPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setOtp('');
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = operationLoading || submitting;

  const renderFields = () => {
    // ── Reset password ────────────────────────────────────────────────────────
    if (mode === 'reset_password') {
      return (
        <View style={styles.otpSection}>
          <View style={styles.otpInfo}>
            <MaterialIcons name="lock-reset" size={32} color={Colors.success} />
            <Text style={styles.otpTitle}>Buat Password Baru</Text>
            <Text style={styles.otpDesc}>Masukkan password baru untuk akun {email}</Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password Baru</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="lock" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Minimal 6 karakter"
                placeholderTextColor={Colors.textDisabled}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoFocus
              />
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Konfirmasi Password Baru</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="lock-outline" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Ulangi password baru"
                placeholderTextColor={Colors.textDisabled}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry
              />
            </View>
          </View>
        </View>
      );
    }

    // ── Forgot OTP verify ────────────────────────────────────────────────────
    if (mode === 'forgot_otp') {
      return (
        <View style={styles.otpSection}>
          <View style={styles.otpInfo}>
            <MaterialIcons name="mark-email-read" size={32} color={Colors.warning} />
            <Text style={styles.otpTitle}>Kode Verifikasi</Text>
            <Text style={styles.otpDesc}>Masukkan kode 8 digit yang dikirim ke{'\n'}{email}</Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Kode OTP (8 digit)</Text>
            <View style={[styles.inputWrap, { borderColor: Colors.warning + '60' }]}>
              <MaterialIcons name="vpn-key" size={18} color={Colors.warning} />
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="00000000"
                placeholderTextColor={Colors.textDisabled}
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={8}
                autoFocus
              />
            </View>
          </View>
          <Pressable style={styles.resendLink} onPress={handleSendForgotOTP} disabled={isLoading}>
            <MaterialIcons name="refresh" size={14} color={Colors.primary} />
            <Text style={styles.resendText}>Kirim ulang kode</Text>
          </Pressable>
        </View>
      );
    }

    // ── Forgot password (email input) ─────────────────────────────────────────
    if (mode === 'forgot') {
      return (
        <View style={styles.otpSection}>
          <View style={styles.otpInfo}>
            <MaterialIcons name="lock-open" size={32} color={Colors.warning} />
            <Text style={styles.otpTitle}>Lupa Password?</Text>
            <Text style={styles.otpDesc}>Masukkan email kamu, kami akan kirimkan kode OTP untuk reset password.</Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email Terdaftar</Text>
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
                autoFocus
              />
            </View>
          </View>
        </View>
      );
    }

    // ── Registration OTP ──────────────────────────────────────────────────────
    if (mode === 'otp') {
      return (
        <View style={styles.otpSection}>
          <View style={styles.otpInfo}>
            <MaterialIcons name="mark-email-read" size={32} color={Colors.primary} />
            <Text style={styles.otpTitle}>Verifikasi Email</Text>
            <Text style={styles.otpDesc}>Kode OTP 8 digit dikirim ke{'\n'}{email}</Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Kode OTP (8 digit)</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="vpn-key" size={18} color={Colors.textMuted} />
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="00000000"
                placeholderTextColor={Colors.textDisabled}
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={8}
                autoFocus
              />
            </View>
          </View>
          <Pressable style={styles.resendLink} onPress={handleRegister} disabled={isLoading}>
            <MaterialIcons name="refresh" size={14} color={Colors.primary} />
            <Text style={styles.resendText}>Kirim ulang kode</Text>
          </Pressable>
        </View>
      );
    }

    // ── Login / Register forms ────────────────────────────────────────────────
    return (
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

        {mode === 'login' ? (
          <Pressable style={styles.forgotLink} onPress={() => { setOtp(''); setMode('forgot'); }}>
            <Text style={styles.forgotText}>Lupa password?</Text>
          </Pressable>
        ) : null}
      </>
    );
  };

  const getSubmitLabel = () => {
    if (isLoading) return 'Memproses...';
    if (mode === 'login') return 'Masuk ke VaultOS';
    if (mode === 'register') return 'Daftar Sekarang';
    if (mode === 'otp') return 'Verifikasi & Buat Akun';
    if (mode === 'forgot') return 'Kirim Kode OTP';
    if (mode === 'forgot_otp') return 'Verifikasi Kode';
    if (mode === 'reset_password') return 'Simpan Password Baru';
    return '';
  };

  const getSubmitIcon = (): any => {
    if (mode === 'login') return 'login';
    if (mode === 'register') return 'person-add';
    if (mode === 'otp' || mode === 'forgot_otp') return 'verified';
    if (mode === 'forgot') return 'send';
    if (mode === 'reset_password') return 'lock-reset';
    return 'chevron-right';
  };

  const handleSubmit = () => {
    if (mode === 'login') return handleLogin();
    if (mode === 'register') return handleRegister();
    if (mode === 'otp') return handleVerifyOTP();
    if (mode === 'forgot') return handleSendForgotOTP();
    if (mode === 'forgot_otp') return handleVerifyForgotOTP();
    if (mode === 'reset_password') return handleResetPassword();
  };

  const getBackMode = (): Mode | null => {
    if (mode === 'otp') return 'register';
    if (mode === 'forgot' || mode === 'forgot_otp' || mode === 'reset_password') return 'login';
    return null;
  };

  const isForgotFlow = mode === 'forgot' || mode === 'forgot_otp' || mode === 'reset_password';
  const submitBtnColor = mode === 'forgot' || mode === 'forgot_otp'
    ? Colors.warning
    : mode === 'reset_password'
    ? Colors.success
    : Colors.primary;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <Animated.View style={[styles.heroContainer, heroAnim]}>
          <Image
            source={require('@/assets/images/splash-bg.png')}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroBranding}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.heroIcon}
              contentFit="contain"
            />
            <Text style={styles.heroTitle}>VaultOS</Text>
            <Text style={styles.heroSubtitle}>Personal Finance Operating System</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.form, formAnim]}>
          {/* Mode Selector (only for login/register) */}
          {!isForgotFlow && mode !== 'otp' ? (
            <View style={styles.modeRow}>
              <Pressable
                style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
                onPress={() => setMode('login')}
              >
                <Text style={[styles.modeBtnText, mode === 'login' && styles.modeBtnTextActive]}>Masuk</Text>
              </Pressable>
              <Pressable
                style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]}
                onPress={() => setMode('register')}
              >
                <Text style={[styles.modeBtnText, mode === 'register' && styles.modeBtnTextActive]}>Daftar</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Forgot flow title badge */}
          {isForgotFlow ? (
            <View style={styles.forgotBadge}>
              <MaterialIcons name="lock-open" size={16} color={Colors.warning} />
              <Text style={styles.forgotBadgeText}>Reset Password</Text>
            </View>
          ) : null}

          {renderFields()}

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: submitBtnColor },
              pressed && styles.pressed,
              isLoading && styles.submitDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.submitText}>{getSubmitLabel()}</Text>
            ) : (
              <>
                <MaterialIcons name={getSubmitIcon()} size={20} color="#fff" />
                <Text style={styles.submitText}>{getSubmitLabel()}</Text>
              </>
            )}
          </Pressable>

          {/* Back link */}
          {getBackMode() ? (
            <Pressable
              style={styles.backToRegister}
              onPress={() => { setMode(getBackMode()!); setOtp(''); }}
            >
              <MaterialIcons name="arrow-back" size={16} color={Colors.textMuted} />
              <Text style={styles.backText}>
                {mode === 'otp' ? 'Kembali ke pendaftaran' : 'Kembali ke halaman masuk'}
              </Text>
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
  heroOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(9,9,11,0.55)',
  },
  heroBranding: { position: 'absolute', bottom: 24, left: 24, right: 24, flexDirection: 'column', gap: 4 },
  heroIcon: { width: 48, height: 48, borderRadius: 12, marginBottom: 4 },
  heroTitle: { fontSize: Typography.display, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  heroSubtitle: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.7)' },
  form: { flex: 1, padding: Spacing.xl, gap: Spacing.xl },
  modeRow: {
    flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: 3, borderWidth: 1, borderColor: Colors.border,
  },
  modeBtn: { flex: 1, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm },
  modeBtnActive: { backgroundColor: Colors.primary },
  modeBtnText: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: '600' },
  modeBtnTextActive: { color: '#fff' },
  forgotBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.warningSurface, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.warning + '40',
  },
  forgotBadgeText: { fontSize: Typography.xs, color: Colors.warning, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  fieldGroup: { gap: Spacing.sm },
  fieldLabel: {
    fontSize: Typography.xs, color: Colors.textMuted,
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.base, gap: Spacing.sm, height: 52,
  },
  input: { flex: 1, fontSize: Typography.base, color: Colors.text },
  otpSection: { gap: Spacing.xl },
  otpInfo: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  otpTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  otpDesc: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  otpInput: {
    fontSize: Typography.xl, fontWeight: '700',
    letterSpacing: 10, textAlign: 'center',
  },
  resendLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.xs,
  },
  resendText: { fontSize: Typography.sm, color: Colors.primary },
  forgotLink: { alignSelf: 'flex-end' },
  forgotText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: '500' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, height: 56, borderRadius: Radius.lg, backgroundColor: Colors.primary,
  },
  submitDisabled: { opacity: 0.6 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  submitText: { fontSize: Typography.md, fontWeight: '700', color: '#fff' },
  backToRegister: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.xs,
  },
  backText: { fontSize: Typography.sm, color: Colors.textMuted },
  watermark: {
    fontSize: Typography.xs, color: Colors.textDisabled,
    textAlign: 'center', fontStyle: 'italic', marginTop: Spacing.sm,
  },
});
