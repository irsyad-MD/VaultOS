import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    const body = await req.json();
    const {
      totalIncome = 0,
      totalExpense = 0,
      savingsRate = 0,
      topCategories = [],
      goals = [],
      habits = [],
      completedHabitsToday = 0,
      totalHabits = 0,
      transactionCount = 0,
      question = '',
    } = body;

    const goalsSummary = goals.slice(0, 3).map((g: any) =>
      `- ${g.name}: Rp ${g.current_amount.toLocaleString()} / Rp ${g.target_amount.toLocaleString()} (${Math.round((g.current_amount / g.target_amount) * 100)}%)`
    ).join('\n');

    const habitsSummary = habits.slice(0, 5).map((h: any) =>
      `- ${h.name}: ${h.streak} hari streak`
    ).join('\n');

    const catSummary = topCategories.slice(0, 5).map((c: any) =>
      `- ${c.name}: Rp ${c.value.toLocaleString()} (${c.percentage}%)`
    ).join('\n');

    const systemPrompt = `Kamu adalah Sydz Agents, asisten keuangan pribadi dan produktivitas cerdas dalam aplikasi VaultOS. 
Kamu berbicara dalam Bahasa Indonesia yang ramah, profesional, dan to-the-point.
Berikan insight yang actionable, spesifik, dan personal berdasarkan data pengguna.
Gunakan format yang mudah dibaca dengan poin-poin jelas. Tidak perlu salam pembuka panjang.`;

    let userPrompt = '';

    if (question) {
      // Custom question mode
      userPrompt = `Data keuangan bulan ini:
- Total Pemasukan: Rp ${totalIncome.toLocaleString()}
- Total Pengeluaran: Rp ${totalExpense.toLocaleString()}
- Tingkat Tabungan: ${savingsRate}%
- Jumlah Transaksi: ${transactionCount}
${catSummary ? `\nTop Pengeluaran:\n${catSummary}` : ''}
${goalsSummary ? `\nTujuan Keuangan:\n${goalsSummary}` : ''}
${habitsSummary ? `\nKebiasaan Aktif:\n${habitsSummary}` : ''}
${`\nHabit Selesai Hari Ini: ${completedHabitsToday}/${totalHabits}`}

Pertanyaan pengguna: ${question}

Jawab pertanyaan ini dengan spesifik berdasarkan data di atas.`;
    } else {
      // Full analysis mode
      userPrompt = `Analisis lengkap keuangan & produktivitas pengguna:

DATA KEUANGAN:
- Total Pemasukan: Rp ${totalIncome.toLocaleString()}
- Total Pengeluaran: Rp ${totalExpense.toLocaleString()}
- Tingkat Tabungan: ${savingsRate}%
- Jumlah Transaksi: ${transactionCount}
${catSummary ? `Top Pengeluaran:\n${catSummary}` : 'Belum ada data pengeluaran.'}

TUJUAN KEUANGAN:
${goalsSummary || 'Belum ada tujuan keuangan.'}

KEBIASAAN:
${habitsSummary || 'Belum ada kebiasaan.'}
Selesai hari ini: ${completedHabitsToday}/${totalHabits}

Berikan analisis dalam format berikut:

## 🎯 Rating Menabung
[Berikan rating A/B/C/D/F dengan penjelasan singkat berdasarkan savingsRate dan pola pengeluaran]

## 💰 Analisis Keuangan  
[3-4 poin insight tentang pemasukan/pengeluaran, identifikasi area boros, bandingkan dengan standar sehat]

## 🏆 Progress Tujuan
[Komentar singkat tentang progress goal, mana yang on-track dan mana yang perlu didorong]

## 💪 Analisis Kebiasaan
[Evaluasi habit completion rate hari ini, habit mana yang kuat/lemah]

## 🚀 Rekomendasi Prioritas
[3 rekomendasi spesifik dan actionable yang bisa dilakukan minggu ini]`;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Error: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? 'Tidak ada respons dari AI.';

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('Sydz Agents error:', e);
    return new Response(JSON.stringify({ error: e.message ?? 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
