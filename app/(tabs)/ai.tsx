import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/services/db';
import { getSupabaseClient, useAlert } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';

interface AnalysisResult {
  content: string;
  timestamp: Date;
}

// Parse markdown-ish content into sections
function parseContent(text: string): { heading: string; body: string }[] {
  const sections: { heading: string; body: string }[] = [];
  const lines = text.split('\n');
  let current: { heading: string; body: string } | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      if (current) sections.push(current);
      current = { heading: headingMatch[1].trim(), body: '' };
    } else if (current) {
      current.body += (current.body ? '\n' : '') + line;
    } else if (line.trim()) {
      sections.push({ heading: '', body: line.trim() });
    }
  }
  if (current) sections.push(current);
  return sections.filter((s) => s.heading || s.body.trim());
}

function getRatingColor(text: string): string {
  if (text.includes('Rating')) {
    if (text.includes('A')) return Colors.success;
    if (text.includes('B')) return Colors.primary;
    if (text.includes('C')) return Colors.warning;
    if (text.includes('D') || text.includes('F')) return Colors.danger;
  }
  return Colors.primary;
}

export default function AIScreen() {
  const { transactions, categories, goals, habits, habitCompletions } = useApp();
  const { showAlert } = useAlert();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const now = new Date();
  const currentMonthYear = now.toISOString().slice(0, 7);
  const thisMonthTxns = transactions.filter((t) => t.date.startsWith(currentMonthYear));
  const totalIncome = thisMonthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = thisMonthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;
  const transactionCount = thisMonthTxns.length;

  const topCategories = categories
    .map((cat) => {
      const val = thisMonthTxns
        .filter((t) => t.type === 'expense' && t.category_id === cat.id)
        .reduce((s, t) => s + t.amount, 0);
      return { name: cat.name, value: val, percentage: totalExpense > 0 ? Math.round((val / totalExpense) * 100) : 0 };
    })
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const today = now.toISOString().split('T')[0];
  const completedHabitsToday = habitCompletions.filter((c) => c.completed_date === today).length;

  const callAI = async (opts: { question?: string } = {}) => {
    const isChat = Boolean(opts.question);
    if (isChat) setChatLoading(true); else setLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke('sydz-agents', {
        body: {
          totalIncome,
          totalExpense,
          savingsRate,
          topCategories,
          goals: goals.map((g) => ({ name: g.name, current_amount: g.current_amount, target_amount: g.target_amount })),
          habits: habits.map((h) => ({ name: h.name, streak: h.streak })),
          completedHabitsToday,
          totalHabits: habits.length,
          transactionCount,
          question: opts.question ?? '',
        },
      });

      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const statusCode = error.context?.status ?? 500;
            const textContent = await error.context?.text();
            errorMessage = `[${statusCode}] ${textContent || error.message}`;
          } catch {
            errorMessage = error.message;
          }
        }
        showAlert('Gagal', errorMessage);
        return;
      }

      if (isChat) {
        setChatAnswer(data.content);
      } else {
        setAnalysis({ content: data.content, timestamp: new Date() });
      }
    } catch (e: any) {
      showAlert('Error', e.message ?? 'Tidak dapat terhubung ke Sydz Agents.');
    } finally {
      if (isChat) setChatLoading(false); else setLoading(false);
    }
  };

  const handleAskQuestion = () => {
    if (!question.trim()) {
      showAlert('Tulis Pertanyaan', 'Masukkan pertanyaan kamu terlebih dahulu.');
      return;
    }
    setChatAnswer(null);
    callAI({ question: question.trim() });
  };

  const sections = analysis ? parseContent(analysis.content) : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.agentBadge}>
              <MaterialIcons name="auto-awesome" size={20} color={Colors.primary} />
              <Text style={styles.agentName}>Sydz Agents</Text>
            </View>
            <Text style={styles.headerTitle}>AI Financial Advisor</Text>
            <Text style={styles.headerSub}>Analisis cerdas keuangan & produktivitas personal kamu</Text>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderColor: Colors.success + '40' }]}>
              <Text style={styles.statLabel}>Tabungan</Text>
              <Text style={[styles.statValue, { color: savingsRate >= 20 ? Colors.success : savingsRate >= 10 ? Colors.warning : Colors.danger }]}>
                {savingsRate}%
              </Text>
            </View>
            <View style={[styles.statCard, { borderColor: Colors.primary + '40' }]}>
              <Text style={styles.statLabel}>Transaksi</Text>
              <Text style={[styles.statValue, { color: Colors.primary }]}>{transactionCount}</Text>
            </View>
            <View style={[styles.statCard, { borderColor: Colors.purple + '40' }]}>
              <Text style={styles.statLabel}>Habit Hari Ini</Text>
              <Text style={[styles.statValue, { color: Colors.purple }]}>{completedHabitsToday}/{habits.length}</Text>
            </View>
          </View>

          {/* Analyze Button */}
          <Pressable
            style={({ pressed }) => [styles.analyzeBtn, loading && styles.analyzeBtnLoading, pressed && !loading && { opacity: 0.85 }]}
            onPress={() => callAI()}
            disabled={loading}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.analyzeBtnText}>Sedang Menganalisis...</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="psychology" size={22} color="#fff" />
                <View>
                  <Text style={styles.analyzeBtnText}>Analisis Keuangan Lengkap</Text>
                  <Text style={styles.analyzeBtnSub}>Rating tabungan · Tujuan · Kebiasaan · Rekomendasi</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.6)" style={{ marginLeft: 'auto' }} />
              </>
            )}
          </Pressable>

          {/* Analysis Result */}
          {analysis && sections.length > 0 ? (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <MaterialIcons name="auto-awesome" size={16} color={Colors.primary} />
                <Text style={styles.resultTitle}>Hasil Analisis Sydz Agents</Text>
                <Text style={styles.resultTime}>
                  {analysis.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              {sections.map((section, idx) => (
                <View key={idx} style={styles.section}>
                  {section.heading ? (
                    <Text style={[styles.sectionHeading, { color: getRatingColor(section.heading + section.body) }]}>
                      {section.heading}
                    </Text>
                  ) : null}
                  {section.body.split('\n').map((line, li) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;
                    const isBullet = trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*');
                    return (
                      <View key={li} style={isBullet ? styles.bulletRow : null}>
                        {isBullet ? <View style={styles.bulletDot} /> : null}
                        <Text style={[styles.sectionBody, isBullet && styles.bulletText]}>
                          {isBullet ? trimmed.replace(/^[-•*]\s*/, '') : trimmed}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          ) : null}

          {/* Chat / Q&A */}
          <View style={styles.chatCard}>
            <View style={styles.chatHeader}>
              <MaterialIcons name="chat" size={18} color={Colors.cyan} />
              <Text style={styles.chatTitle}>Tanya Sydz Agents</Text>
            </View>
            <Text style={styles.chatSub}>Tanya apa saja tentang keuangan dan produktivitas kamu</Text>

            <View style={styles.suggestRow}>
              {[
                'Gimana cara kurangi pengeluaran?',
                'Kapan target tujuan tercapai?',
                'Strategi menabung lebih efektif?',
              ].map((q) => (
                <Pressable key={q} style={styles.suggestChip} onPress={() => setQuestion(q)}>
                  <Text style={styles.suggestText}>{q}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Tulis pertanyaanmu..."
                placeholderTextColor={Colors.textDisabled}
                value={question}
                onChangeText={setQuestion}
                multiline
                maxLength={200}
              />
              <Pressable
                style={[styles.sendBtn, (!question.trim() || chatLoading) && styles.sendBtnDisabled]}
                onPress={handleAskQuestion}
                disabled={!question.trim() || chatLoading}
              >
                {chatLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="send" size={18} color="#fff" />
                )}
              </Pressable>
            </View>

            {chatAnswer ? (
              <View style={styles.chatAnswer}>
                <View style={styles.chatAnswerHeader}>
                  <View style={styles.agentAvatar}>
                    <MaterialIcons name="auto-awesome" size={14} color="#fff" />
                  </View>
                  <Text style={styles.chatAnswerLabel}>Sydz Agents</Text>
                </View>
                <Text style={styles.chatAnswerText}>{chatAnswer}</Text>
              </View>
            ) : null}
          </View>

          {/* Feature Highlights */}
          <View style={styles.featuresGrid}>
            {[
              { icon: 'star', color: Colors.gold, title: 'Rating Menabung', desc: 'A–F berdasarkan pola keuangan' },
              { icon: 'savings', color: Colors.success, title: 'Progress Tujuan', desc: 'Analisis tiap goal kamu' },
              { icon: 'loop', color: Colors.purple, title: 'Kebiasaan', desc: 'Evaluasi habit harian' },
              { icon: 'lightbulb', color: Colors.warning, title: 'Rekomendasi', desc: 'Solusi actionable & spesifik' },
            ].map((f) => (
              <View key={f.title} style={styles.featureCard}>
                <View style={[styles.featureIcon, { backgroundColor: f.color + '20' }]}>
                  <MaterialIcons name={f.icon as any} size={20} color={f.color} />
                </View>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { gap: Spacing.xl, paddingBottom: Spacing.xxl },
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base, gap: Spacing.sm },
  agentBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.primarySurface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.primary + '30' },
  agentName: { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.bold, textTransform: 'uppercase', letterSpacing: 0.8 },
  headerTitle: { fontSize: Typography.xxl, fontWeight: Typography.extrabold, color: Colors.text, letterSpacing: -0.5 },
  headerSub: { fontSize: Typography.sm, color: Colors.textMuted, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.base },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, alignItems: 'center', gap: 4 },
  statLabel: { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center' },
  statValue: { fontSize: Typography.lg, fontWeight: Typography.extrabold },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    paddingVertical: Spacing.lg,
  },
  analyzeBtnLoading: { backgroundColor: Colors.primaryDark },
  analyzeBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: '#fff' },
  analyzeBtnSub: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  resultCard: { marginHorizontal: Spacing.base, backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1, borderColor: Colors.primary + '30', gap: Spacing.lg },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  resultTitle: { flex: 1, fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  resultTime: { fontSize: Typography.xs, color: Colors.textMuted },
  section: { gap: Spacing.sm },
  sectionHeading: { fontSize: Typography.sm, fontWeight: Typography.bold, letterSpacing: -0.2 },
  sectionBody: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 8, flexShrink: 0 },
  bulletText: { flex: 1 },
  chatCard: { marginHorizontal: Spacing.base, backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  chatTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  chatSub: { fontSize: Typography.xs, color: Colors.textMuted },
  suggestRow: { gap: Spacing.sm },
  suggestChip: { backgroundColor: Colors.cardElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  suggestText: { fontSize: Typography.xs, color: Colors.textSecondary },
  inputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end' },
  chatInput: { flex: 1, backgroundColor: Colors.cardElevated, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: Typography.sm, color: Colors.text, maxHeight: 100, minHeight: 44 },
  sendBtn: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendBtnDisabled: { backgroundColor: Colors.cardElevated },
  chatAnswer: { backgroundColor: Colors.primarySurface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '30', gap: Spacing.sm },
  chatAnswerHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  agentAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  chatAnswerLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.primary },
  chatAnswerText: { fontSize: Typography.sm, color: Colors.text, lineHeight: 22 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.base, gap: Spacing.md },
  featureCard: { width: '47%', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  featureIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  featureDesc: { fontSize: Typography.xs, color: Colors.textMuted, lineHeight: 18 },
});
