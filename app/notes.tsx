import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Modal, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';

const NOTE_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#3b82f6','#a855f7','#ec4899','#14b8a6','#f97316'];

export default function NotesScreen() {
  const { notes, addNote, editNote, removeNote, loading } = useApp();
  const { showAlert } = useAlert();
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditId(null); setTitle(''); setContent(''); setSelectedColor('#6366f1');
    setModalVisible(true);
  };

  const openEdit = (note: typeof notes[0]) => {
    setEditId(note.id); setTitle(note.title); setContent(note.content); setSelectedColor(note.color);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { showAlert('Judul Wajib', 'Masukkan judul catatan.'); return; }
    setSaving(true);
    try {
      if (editId) {
        await editNote(editId, { title: title.trim(), content: content.trim(), color: selectedColor });
      } else {
        await addNote({ title: title.trim(), content: content.trim(), color: selectedColor, is_pinned: false, tags: [] });
      }
      setModalVisible(false);
    } catch (e: any) {
      showAlert('Gagal', e.message ?? 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, noteTitle: string) => {
    showAlert('Hapus Catatan?', `"${noteTitle}" akan dihapus.`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => removeNote(id) },
    ]);
  };

  const handleTogglePin = async (id: string, pinned: boolean) => {
    await editNote(id, { is_pinned: !pinned });
  };

  const pinned = notes.filter((n) => n.is_pinned);
  const unpinned = notes.filter((n) => !n.is_pinned);

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {notes.length === 0 && !loading ? (
          <View style={styles.empty}>
            <MaterialIcons name="note" size={64} color={Colors.textDisabled} />
            <Text style={styles.emptyTitle}>Belum ada catatan</Text>
            <Text style={styles.emptyText}>Tekan + untuk membuat catatan baru</Text>
          </View>
        ) : null}

        {pinned.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="push-pin" size={14} color={Colors.textMuted} />
              <Text style={styles.sectionTitle}>Disematkan</Text>
            </View>
            <View style={styles.grid}>
              {pinned.map((note) => (
                <NoteCard key={note.id} note={note} onEdit={openEdit} onDelete={handleDelete} onTogglePin={handleTogglePin} />
              ))}
            </View>
          </View>
        ) : null}

        {unpinned.length > 0 ? (
          <View style={styles.section}>
            {pinned.length > 0 ? (
              <View style={styles.sectionHeader}>
                <MaterialIcons name="notes" size={14} color={Colors.textMuted} />
                <Text style={styles.sectionTitle}>Catatan</Text>
              </View>
            ) : null}
            <View style={styles.grid}>
              {unpinned.map((note) => (
                <NoteCard key={note.id} note={note} onEdit={openEdit} onDelete={handleDelete} onTogglePin={handleTogglePin} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]} onPress={openAdd}>
        <MaterialIcons name="add" size={28} color="#fff" />
      </Pressable>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editId ? 'Edit Catatan' : 'Catatan Baru'}</Text>
              <Pressable onPress={() => setModalVisible(false)}><MaterialIcons name="close" size={22} color={Colors.textMuted} /></Pressable>
            </View>

            {/* Color row */}
            <View style={styles.colorRow}>
              {NOTE_COLORS.map((c) => (
                <Pressable key={c} style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotActive]} onPress={() => setSelectedColor(c)}>
                  {selectedColor === c ? <MaterialIcons name="check" size={12} color="#fff" /> : null}
                </Pressable>
              ))}
            </View>

            <TextInput
              style={[styles.titleInput, { borderColor: selectedColor + '60' }]}
              placeholder="Judul catatan..."
              placeholderTextColor={Colors.textDisabled}
              value={title}
              onChangeText={setTitle}
              maxLength={60}
              autoFocus
            />

            <TextInput
              style={styles.contentInput}
              placeholder="Tulis catatan di sini..."
              placeholderTextColor={Colors.textDisabled}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <Pressable
              style={[styles.saveBtn, { backgroundColor: selectedColor }, (!title.trim() || saving) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!title.trim() || saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Tambah Catatan'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function NoteCard({ note, onEdit, onDelete, onTogglePin }: {
  note: any;
  onEdit: (n: any) => void;
  onDelete: (id: string, title: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.noteCard, { borderColor: note.color + '40' }, pressed && styles.pressed]}
      onPress={() => onEdit(note)}
    >
      <View style={[styles.noteColorBar, { backgroundColor: note.color }]} />
      <View style={styles.noteBody}>
        <Text style={styles.noteTitle} numberOfLines={2}>{note.title}</Text>
        {note.content ? <Text style={styles.noteContent} numberOfLines={3}>{note.content}</Text> : null}
        <View style={styles.noteFooter}>
          <Text style={styles.noteDate}>{new Date(note.updated_at ?? note.created_at ?? '').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</Text>
          <View style={styles.noteActions}>
            <Pressable onPress={() => onTogglePin(note.id, note.is_pinned)} hitSlop={8}>
              <MaterialIcons name={note.is_pinned ? 'push-pin' : 'push-pin'} size={14} color={note.is_pinned ? note.color : Colors.textDisabled} />
            </Pressable>
            <Pressable onPress={() => onDelete(note.id, note.title)} hitSlop={8}>
              <MaterialIcons name="delete-outline" size={14} color={Colors.textDisabled} />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, gap: Spacing.xl, paddingBottom: 80 },
  empty: { alignItems: 'center', paddingVertical: 80, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textSecondary },
  emptyText: { fontSize: Typography.sm, color: Colors.textMuted },
  section: { gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  sectionTitle: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  noteCard: { width: '47%', backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
  pressed: { opacity: 0.75 },
  noteColorBar: { height: 4 },
  noteBody: { padding: Spacing.md, gap: Spacing.xs },
  noteTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  noteContent: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18 },
  noteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  noteDate: { fontSize: Typography.xs, color: Colors.textDisabled },
  noteActions: { flexDirection: 'row', gap: Spacing.sm },
  fab: { position: 'absolute', bottom: 24, right: Spacing.base, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  fabPressed: { transform: [{ scale: 0.93 }], opacity: 0.85 },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  modalCard: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 48 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  colorRow: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  colorDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  colorDotActive: { borderWidth: 3, borderColor: '#fff' },
  titleInput: { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1.5, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text, height: 52 },
  contentInput: { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, fontSize: Typography.sm, color: Colors.text, height: 120, textAlignVertical: 'top' },
  saveBtn: { height: 54, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { backgroundColor: Colors.cardElevated },
  saveBtnText: { fontSize: Typography.md, fontWeight: Typography.bold, color: '#fff' },
});
