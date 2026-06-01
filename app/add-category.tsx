import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ScrollView, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';

const CATEGORY_ICONS = [
  'restaurant', 'directions-car', 'shopping-bag', 'receipt', 'favorite', 'movie',
  'school', 'trending-up', 'account-balance-wallet', 'work', 'business', 'wifi',
  'bolt', 'flight', 'people', 'label', 'home', 'sports-esports', 'local-cafe',
  'fitness-center', 'music-note', 'book', 'child-care', 'pets', 'local-hospital',
  'savings', 'attach-money', 'card-giftcard', 'store', 'commute',
];

const CATEGORY_COLORS = [
  '#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6',
  '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
  '#84cc16', '#e11d48', '#0ea5e9', '#d946ef', '#10b981',
];

const TYPE_OPTIONS = [
  { key: 'expense', label: 'Pengeluaran', color: Colors.danger },
  { key: 'income', label: 'Pemasukan', color: Colors.success },
  { key: 'both', label: 'Keduanya', color: Colors.primary },
];

export default function AddCategoryScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { categories, refreshAll } = useApp();
  const { addCategory } = useApp() as any;

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('label');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [selectedType, setSelectedType] = useState<'expense' | 'income' | 'both'>('expense');
  const [saving, setSaving] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const canSubmit = name.trim().length > 0 && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) {
      showAlert('Nama Kosong', 'Masukkan nama kategori.');
      return;
    }
    const exists = categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      showAlert('Sudah Ada', `Kategori "${name.trim()}" sudah ada.`);
      return;
    }
    setSaving(true);
    try {
      // Use the db service directly
      const { createCategory } = await import('@/services/db');
      const { getSupabaseClient } = await import('@/template');
      const { data: { user } } = await getSupabaseClient().auth.getUser();
      if (!user) { showAlert('Error', 'Tidak ada sesi login.'); return; }
      await createCategory({
        user_id: user.id,
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
        type: selectedType,
        is_default: false,
      });
      await refreshAll();
      showAlert('Berhasil', `Kategori "${name.trim()}" berhasil ditambahkan.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      showAlert('Gagal', e.message ?? 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Preview */}
        <View style={styles.previewCard}>
          <View style={[styles.previewIcon, { backgroundColor: selectedColor + '20' }]}>
            <MaterialIcons name={selectedIcon as any} size={32} color={selectedColor} />
          </View>
          <View>
            <Text style={styles.previewName}>{name || 'Nama Kategori'}</Text>
            <Text style={[styles.previewType, { color: selectedColor }]}>
              {TYPE_OPTIONS.find((t) => t.key === selectedType)?.label}
            </Text>
          </View>
        </View>

        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Nama Kategori *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Contoh: Kopi, Olahraga, Sewa..."
            placeholderTextColor={Colors.textDisabled}
            value={name}
            onChangeText={setName}
            maxLength={30}
            autoFocus
          />
        </View>

        {/* Type */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Tipe</Text>
          <View style={styles.typeRow}>
            {TYPE_OPTIONS.map((t) => (
              <Pressable
                key={t.key}
                style={[styles.typeBtn, selectedType === t.key && { backgroundColor: t.color, borderColor: t.color }]}
                onPress={() => setSelectedType(t.key as any)}
              >
                <Text style={[styles.typeBtnText, selectedType === t.key && { color: '#fff' }]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Icon */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Ikon</Text>
          <Pressable
            style={styles.iconPickerBtn}
            onPress={() => setShowIconPicker(true)}
          >
            <View style={[styles.selectedIconPreview, { backgroundColor: selectedColor + '20' }]}>
              <MaterialIcons name={selectedIcon as any} size={24} color={selectedColor} />
            </View>
            <Text style={styles.iconPickerLabel}>Pilih ikon</Text>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </Pressable>
        </View>

        {/* Color */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Warna</Text>
          <View style={styles.colorGrid}>
            {CATEGORY_COLORS.map((c) => (
              <Pressable
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotActive]}
                onPress={() => setSelectedColor(c)}
              >
                {selectedColor === c ? <MaterialIcons name="check" size={14} color="#fff" /> : null}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [styles.submitBtn, !canSubmit && styles.submitDisabled, pressed && canSubmit && styles.pressed]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <MaterialIcons name="add-circle" size={20} color={canSubmit ? '#fff' : Colors.textDisabled} />
          <Text style={[styles.submitText, !canSubmit && { color: Colors.textDisabled }]}>
            {saving ? 'Menyimpan...' : 'Simpan Kategori'}
          </Text>
        </Pressable>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Icon Picker Modal */}
      <Modal
        visible={showIconPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowIconPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Ikon</Text>
              <Pressable onPress={() => setShowIconPicker(false)}>
                <MaterialIcons name="close" size={22} color={Colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.iconGrid} showsVerticalScrollIndicator={false}>
              {CATEGORY_ICONS.map((icon) => (
                <Pressable
                  key={icon}
                  style={[styles.iconOption, selectedIcon === icon && { backgroundColor: selectedColor, borderColor: selectedColor }]}
                  onPress={() => { setSelectedIcon(icon); setShowIconPicker(false); }}
                >
                  <MaterialIcons name={icon as any} size={24} color={selectedIcon === icon ? '#fff' : Colors.textSecondary} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, gap: Spacing.xl, paddingBottom: Spacing.xxl },
  previewCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border },
  previewIcon: { width: 64, height: 64, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  previewName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  previewType: { fontSize: Typography.sm, fontWeight: Typography.medium, marginTop: 2 },
  fieldGroup: { gap: Spacing.sm },
  fieldLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  textInput: { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.base, height: 48, fontSize: Typography.sm, color: Colors.text },
  typeRow: { flexDirection: 'row', gap: Spacing.md },
  typeBtn: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  typeBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textMuted },
  iconPickerBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  selectedIconPreview: { width: 44, height: 44, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  iconPickerLabel: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  colorDot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  colorDotActive: { borderWidth: 3, borderColor: '#fff' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 54, borderRadius: Radius.lg, backgroundColor: Colors.primary, marginTop: Spacing.md },
  submitDisabled: { backgroundColor: Colors.cardElevated },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  submitText: { fontSize: Typography.md, fontWeight: Typography.bold, color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.text },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, paddingBottom: Spacing.xxl },
  iconOption: { width: 56, height: 56, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
});
