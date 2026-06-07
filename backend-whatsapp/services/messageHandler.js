const supabase = require('./supabase');
const { parseMessage } = require('./groq');
const { sendMessage } = require('./baileys');

// Format IDR
function formatRp(amount) {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

// Cari user berdasarkan nomor WA
async function findUserByPhone(phone) {
  const cleanPhone = phone.replace('@s.whatsapp.net', '').replace(/\D/g, '');
  const { data } = await supabase
    .from('user_profiles')
    .select('id, username, full_name, whatsapp_number')
    .eq('whatsapp_number', cleanPhone)
    .single();
  return data;
}

// Log pesan ke database
async function logMessage(userId, from, to, message, direction = 'inbound') {
  await supabase.from('whatsapp_messages').insert({
    user_id: userId,
    direction,
    from_number: from,
    to_number: to,
    message,
    message_type: 'text',
    status: 'delivered',
  });
}

async function handleIncomingMessage(from, text, msg) {
  const cleanPhone = from.replace('@s.whatsapp.net', '');

  // Cari user
  const user = await findUserByPhone(from);
  if (!user) {
    await sendMessage(cleanPhone, '❌ Nomor kamu belum terdaftar di VaultOS.\nDaftar terlebih dahulu di aplikasi VaultOS.');
    return;
  }

  // Log pesan masuk
  await logMessage(user.id, cleanPhone, 'bot', text, 'inbound');

  // Cek apakah user aktifkan WA bot
  const { data: settings } = await supabase
    .from('user_settings')
    .select('whatsapp_bot_enabled')
    .eq('user_id', user.id)
    .single();

  if (settings && !settings.whatsapp_bot_enabled) {
    await sendMessage(cleanPhone, '⚠️ WhatsApp Bot kamu dinonaktifkan.\nAktifkan di Pengaturan > WhatsApp Bot dalam aplikasi VaultOS.');
    return;
  }

  const displayName = user.full_name || user.username || 'kamu';
  let replyText = '';

  // Parse intent dengan Groq AI
  const parsed = await parseMessage(text.toLowerCase().trim());

  try {
    switch (parsed.action) {
      // ── Tambah Transaksi ─────────────────────────────────────────────────────
      case 'add_transaction': {
        const { type, amount, description } = parsed.data;

        // Cari akun default user
        const { data: accounts } = await supabase
          .from('accounts')
          .select('id, name, balance')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .limit(1);

        const account = accounts?.[0] ?? null;

        // Cari kategori default
        const catType = type === 'income' ? 'income' : 'expense';
        const { data: cats } = await supabase
          .from('categories')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('type', catType)
          .limit(1);

        const catId = cats?.[0]?.id ?? null;

        await supabase.from('transactions').insert({
          user_id: user.id,
          type,
          amount,
          description,
          category_id: catId,
          account_id: account?.id ?? null,
          date: new Date().toISOString(),
          tags: ['whatsapp'],
          notes: 'Dicatat via WhatsApp Bot',
        });

        // Update saldo akun
        if (account) {
          const newBalance = type === 'income'
            ? account.balance + amount
            : account.balance - amount;
          await supabase.from('accounts').update({ balance: newBalance }).eq('id', account.id);
        }

        const emoji = type === 'income' ? '💰' : '💸';
        const label = type === 'income' ? 'Pemasukan' : 'Pengeluaran';
        replyText = `${emoji} *${label} Dicatat!*\n\n📝 ${description}\n💵 ${formatRp(amount)}\n${account ? `🏦 Akun: ${account.name}` : ''}\n\n_Dicatat via WhatsApp Bot_`;
        break;
      }

      // ── Selesaikan Habit ─────────────────────────────────────────────────────
      case 'complete_habit': {
        const { name } = parsed.data;
        const { data: habits } = await supabase
          .from('habits')
          .select('id, name, streak')
          .eq('user_id', user.id)
          .ilike('name', `%${name}%`)
          .limit(1);

        const habit = habits?.[0];
        if (!habit) {
          replyText = `❌ Habit "${name}" tidak ditemukan.\nCek nama habit di aplikasi VaultOS.`;
          break;
        }

        const today = new Date().toLocaleDateString('sv'); // YYYY-MM-DD
        const { data: existing } = await supabase
          .from('habit_completions')
          .select('id')
          .eq('habit_id', habit.id)
          .eq('completed_date', today)
          .single();

        if (existing) {
          replyText = `✅ Habit *${habit.name}* sudah selesai hari ini!\n🔥 Streak: ${habit.streak} hari`;
          break;
        }

        await supabase.from('habit_completions').insert({
          habit_id: habit.id,
          user_id: user.id,
          completed_date: today,
        });

        const newStreak = habit.streak + 1;
        await supabase.from('habits').update({ streak: newStreak }).eq('id', habit.id);

        replyText = `✅ *${habit.name}* selesai hari ini!\n🔥 Streak: *${newStreak} hari*\n\nLanjutkan terus, ${displayName}!`;
        break;
      }

      // ── Tambah Goal ──────────────────────────────────────────────────────────
      case 'add_goal': {
        const { name, target_amount } = parsed.data;
        await supabase.from('goals').insert({
          user_id: user.id,
          name,
          target_amount,
          current_amount: 0,
          icon: 'savings',
          color: '#22c55e',
          category: 'savings',
        });
        replyText = `🎯 *Target Baru Dibuat!*\n\n📌 ${name}\n💵 Target: ${formatRp(target_amount)}\n\nSemangat menabung, ${displayName}!`;
        break;
      }

      // ── Tambah Task ──────────────────────────────────────────────────────────
      case 'add_task': {
        const { title, deadline } = parsed.data;
        await supabase.from('tasks').insert({
          user_id: user.id,
          title,
          description: 'Dibuat via WhatsApp Bot',
          priority: 'medium',
          status: 'todo',
          due_date: deadline ? new Date(deadline).toISOString() : null,
          category: 'personal',
          tags: ['whatsapp'],
        });
        replyText = `📋 *Tugas Ditambahkan!*\n\n✏️ ${title}${deadline ? `\n📅 Deadline: ${deadline}` : ''}\n\n_Cek di aplikasi VaultOS_`;
        break;
      }

      // ── Tambah Reminder ──────────────────────────────────────────────────────
      case 'add_reminder': {
        const { title, remind_at } = parsed.data;
        await supabase.from('reminders').insert({
          user_id: user.id,
          title,
          message: title,
          remind_at: remind_at ? new Date(remind_at).toISOString() : new Date(Date.now() + 3600000).toISOString(),
          channel: 'whatsapp',
          repeat_type: 'none',
          is_sent: false,
        });
        replyText = `⏰ *Reminder Dibuat!*\n\n📌 ${title}\n\n_Kamu akan diingatkan via WhatsApp_`;
        break;
      }

      // ── Cek Saldo ────────────────────────────────────────────────────────────
      case 'get_balance': {
        const { data: accounts } = await supabase
          .from('accounts')
          .select('name, balance, type')
          .eq('user_id', user.id)
          .eq('is_hidden', false)
          .order('balance', { ascending: false });

        if (!accounts || accounts.length === 0) {
          replyText = '💳 Belum ada akun yang terdaftar.\nBuat akun di aplikasi VaultOS.';
          break;
        }

        const total = accounts.reduce((s, a) => s + a.balance, 0);
        const lines = accounts.map((a) => `• ${a.name}: ${formatRp(a.balance)}`).join('\n');
        replyText = `💰 *Saldo Kamu, ${displayName}*\n\n${lines}\n\n*Total: ${formatRp(total)}*`;
        break;
      }

      // ── Laporan ──────────────────────────────────────────────────────────────
      case 'get_report': {
        const now = new Date();
        let startDate;
        const period = parsed.data?.period ?? 'month';

        if (period === 'today') {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        } else if (period === 'week') {
          startDate = new Date(now.getTime() - 7 * 86400000).toISOString();
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        }

        const { data: txns } = await supabase
          .from('transactions')
          .select('type, amount')
          .eq('user_id', user.id)
          .gte('date', startDate);

        const income = (txns ?? []).filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = (txns ?? []).filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const net = income - expense;
        const periodLabel = period === 'today' ? 'Hari Ini' : period === 'week' ? '7 Hari Terakhir' : 'Bulan Ini';

        replyText = `📊 *Laporan ${periodLabel}*\n\n💰 Pemasukan: ${formatRp(income)}\n💸 Pengeluaran: ${formatRp(expense)}\n${net >= 0 ? '📈' : '📉'} Selisih: ${net >= 0 ? '+' : ''}${formatRp(net)}\n\n_${(txns ?? []).length} transaksi tercatat_`;
        break;
      }

      // ── Analisis Pengeluaran ─────────────────────────────────────────────────
      case 'get_expense_analysis': {
        const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const { data: txns } = await supabase
          .from('transactions')
          .select('amount, category_id, categories(name)')
          .eq('user_id', user.id)
          .eq('type', 'expense')
          .gte('date', startDate);

        const catMap = {};
        (txns ?? []).forEach((t) => {
          const catName = t.categories?.name ?? 'Lainnya';
          catMap[catName] = (catMap[catName] ?? 0) + t.amount;
        });

        const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
        if (sorted.length === 0) {
          replyText = '📊 Belum ada pengeluaran bulan ini.';
          break;
        }
        const total = sorted.reduce((s, [, v]) => s + v, 0);
        const lines = sorted.map(([cat, amt], i) => `${i + 1}. ${cat}: ${formatRp(amt)} (${Math.round((amt / total) * 100)}%)`).join('\n');
        replyText = `📊 *Pengeluaran Terbesar Bulan Ini*\n\n${lines}\n\n*Total: ${formatRp(total)}*`;
        break;
      }

      // ── Bantuan / Unknown ────────────────────────────────────────────────────
      default: {
        replyText = `🤖 *VaultOS Bot - Perintah Tersedia:*\n\n💰 *Transaksi:*\n• beli kopi 25000\n• gaji 5000000\n\n✅ *Habit:*\n• olahraga selesai\n\n🎯 *Target:*\n• buat target laptop 10000000\n\n📋 *Tugas:*\n• buat tugas laporan deadline besok\n\n⏰ *Reminder:*\n• ingatkan bayar listrik tanggal 10\n\n📊 *Laporan:*\n• saldo\n• laporan bulan ini\n• pengeluaran terbesar saya\n\nKetik *bantuan* untuk melihat pesan ini lagi.`;
        break;
      }
    }
  } catch (err) {
    console.error('[Handler] Error:', err.message);
    replyText = '❌ Terjadi kesalahan. Coba lagi atau buka aplikasi VaultOS.';
  }

  if (replyText) {
    await sendMessage(cleanPhone, replyText);
    await logMessage(user.id, 'bot', cleanPhone, replyText, 'outbound');
  }
}

module.exports = { handleIncomingMessage, findUserByPhone };
