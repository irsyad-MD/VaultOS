const cron = require('node-cron');
const supabase = require('../services/supabase');
const { sendMessage } = require('../services/baileys');
const { findUserByPhone } = require('../services/messageHandler');

function formatRp(amount) {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

// Kirim notifikasi ke user jika WA bot aktif
async function sendToUser(userId, message) {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('whatsapp_number')
      .eq('id', userId)
      .single();

    const { data: settings } = await supabase
      .from('user_settings')
      .select('whatsapp_bot_enabled')
      .eq('user_id', userId)
      .single();

    if (!profile?.whatsapp_number || !settings?.whatsapp_bot_enabled) return;

    await sendMessage(profile.whatsapp_number, message);
  } catch (e) {
    console.error('[Cron] sendToUser error:', e.message);
  }
}

function startCronJobs() {
  console.log('[Cron] Scheduler started');

  // ── Setiap menit: cek reminders ─────────────────────────────────────────────
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const nowIso = now.toISOString();
      const oneMinLater = new Date(now.getTime() + 60000).toISOString();

      const { data: reminders } = await supabase
        .from('reminders')
        .select('*')
        .eq('is_sent', false)
        .lte('remind_at', oneMinLater)
        .gte('remind_at', new Date(now.getTime() - 60000).toISOString());

      for (const reminder of reminders ?? []) {
        const msg = `⏰ *Pengingat VaultOS*\n\n📌 ${reminder.title}${reminder.message && reminder.message !== reminder.title ? `\n💬 ${reminder.message}` : ''}`;
        await sendToUser(reminder.user_id, msg);
        await supabase.from('reminders').update({ is_sent: true }).eq('id', reminder.id);
      }
    } catch (e) {
      console.error('[Cron] Reminders error:', e.message);
    }
  });

  // ── Setiap jam: cek task deadline hari ini ───────────────────────────────────
  cron.schedule('0 * * * *', async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: tasks } = await supabase
        .from('tasks')
        .select('user_id, title, due_date')
        .neq('status', 'done')
        .gte('due_date', todayStart.toISOString())
        .lte('due_date', todayEnd.toISOString());

      for (const task of tasks ?? []) {
        const msg = `⚠️ *Deadline Hari Ini!*\n\n📋 ${task.title}\n⏰ Due: ${new Date(task.due_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n\nSelesaikan segera di aplikasi VaultOS!`;
        await sendToUser(task.user_id, msg);
      }
    } catch (e) {
      console.error('[Cron] Task deadline error:', e.message);
    }
  });

  // ── 20:00 setiap hari: cek habit yang belum selesai ─────────────────────────
  cron.schedule('0 20 * * *', async () => {
    try {
      const today = new Date().toLocaleDateString('sv'); // YYYY-MM-DD

      const { data: habits } = await supabase
        .from('habits')
        .select('id, user_id, name, streak');

      for (const habit of habits ?? []) {
        const { data: completion } = await supabase
          .from('habit_completions')
          .select('id')
          .eq('habit_id', habit.id)
          .eq('completed_date', today)
          .single();

        if (!completion) {
          const msg = `🔥 *Streak Terancam Putus!*\n\n😰 Habit *${habit.name}* belum selesai hari ini!\nStreak saat ini: *${habit.streak} hari*\n\nJangan sampai streak putus! Selesaikan sekarang.`;
          await sendToUser(habit.user_id, msg);
        }
      }
    } catch (e) {
      console.error('[Cron] Habit reminder error:', e.message);
    }
  });

  // ── 09:00 setiap hari: cek jadwal hari ini ───────────────────────────────────
  cron.schedule('0 9 * * *', async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: events } = await supabase
        .from('events')
        .select('user_id, title, start_time, date')
        .gte('date', todayStart.toISOString())
        .lte('date', todayEnd.toISOString());

      for (const event of events ?? []) {
        const msg = `📅 *Jadwal Hari Ini*\n\n🗓️ ${event.title}\n⏰ ${event.start_time}\n\nSiapkan dirimu!`;
        await sendToUser(event.user_id, msg);
      }
    } catch (e) {
      console.error('[Cron] Events reminder error:', e.message);
    }
  });

  // ── Setiap menit: cek event 30 menit lagi ────────────────────────────────────
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const in30 = new Date(now.getTime() + 30 * 60000);
      const window = new Date(now.getTime() + 31 * 60000);

      const { data: events } = await supabase
        .from('events')
        .select('user_id, title, start_time, date')
        .gte('date', in30.toISOString())
        .lte('date', window.toISOString());

      for (const event of events ?? []) {
        const msg = `📅 *Jadwal Dimulai 30 Menit Lagi!*\n\n🗓️ ${event.title}\n⏰ ${event.start_time}\n\nPersiapkan dirimu!`;
        await sendToUser(event.user_id, msg);
      }
    } catch (e) {
      console.error('[Cron] Event 30min error:', e.message);
    }
  });

  // ── Setiap hari jam 10:00: cek goal progress ─────────────────────────────────
  cron.schedule('0 10 * * *', async () => {
    try {
      const { data: goals } = await supabase
        .from('goals')
        .select('user_id, name, target_amount, current_amount, deadline');

      for (const goal of goals ?? []) {
        if (!goal.deadline) continue;
        const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000);
        const progress = Math.round((goal.current_amount / goal.target_amount) * 100);

        if (daysLeft <= 7 && progress < 50) {
          const msg = `🎯 *Progress Target Kurang dari 50%!*\n\n📌 ${goal.name}\n💰 ${formatRp(goal.current_amount)} / ${formatRp(goal.target_amount)} (${progress}%)\n⏳ Sisa: ${daysLeft} hari\n\nYuk tambahkan tabungan sekarang!`;
          await sendToUser(goal.user_id, msg);
        }
      }
    } catch (e) {
      console.error('[Cron] Goal progress error:', e.message);
    }
  });

  // ── 22:00 setiap hari: analisis pengeluaran ──────────────────────────────────
  cron.schedule('0 22 * * *', async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Hitung rata-rata 30 hari terakhir
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data: allTxns } = await supabase
        .from('transactions')
        .select('user_id, amount, type, date')
        .eq('type', 'expense')
        .gte('date', thirtyDaysAgo);

      // Group by user
      const userExpenses = {};
      for (const t of allTxns ?? []) {
        if (!userExpenses[t.user_id]) userExpenses[t.user_id] = { today: 0, history: [] };
        const txDate = new Date(t.date);
        if (txDate >= todayStart) {
          userExpenses[t.user_id].today += t.amount;
        } else {
          userExpenses[t.user_id].history.push(t.amount);
        }
      }

      for (const [userId, data] of Object.entries(userExpenses)) {
        if (data.history.length === 0) continue;
        const avg = data.history.reduce((s, v) => s + v, 0) / data.history.length;
        if (data.today > avg * 1.5) {
          const msg = `📊 *Pengeluaran Hari Ini Tinggi!*\n\n💸 Pengeluaran hari ini: ${formatRp(data.today)}\n📉 Rata-rata harian: ${formatRp(Math.round(avg))}\n\nPertimbangkan untuk mengurangi pengeluaran besok.`;
          await sendToUser(userId, msg);
        }
      }
    } catch (e) {
      console.error('[Cron] Expense analysis error:', e.message);
    }
  });
}

module.exports = { startCronJobs };
