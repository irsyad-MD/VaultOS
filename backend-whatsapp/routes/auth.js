const express = require('express');
const router = express.Router();
const { sendMessage } = require('../services/baileys');
const supabase = require('../services/supabase');

function requireAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || auth !== `Bearer ${process.env.API_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// POST /auth/send-welcome-message
router.post('/send-welcome-message', requireAuth, async (req, res) => {
  const { userId, name, phone } = req.body;

  if (!userId || !name || !phone) {
    return res.status(400).json({ error: 'userId, name, dan phone wajib diisi' });
  }

  const welcomeMsg =
    `🎉 *Selamat Datang di VaultOS!*\n\n` +
    `Halo *${name}*,\n\nAkun kamu berhasil dibuat. Sekarang kamu dapat:\n\n` +
    `✅ Mencatat pemasukan & pengeluaran\n` +
    `✅ Mengelola habit harian\n` +
    `✅ Membuat target keuangan\n` +
    `✅ Mengelola tugas\n` +
    `✅ Mengatur reminder\n` +
    `✅ Menggunakan AI Assistant\n` +
    `✅ Menggunakan WhatsApp Bot ini\n\n` +
    `*Perintah yang tersedia:*\n` +
    `• saldo\n` +
    `• laporan bulan ini\n` +
    `• pengeluaran terbesar saya\n` +
    `• beli kopi 25000\n` +
    `• gaji 5000000\n` +
    `• olahraga selesai\n` +
    `• bantuan\n\n` +
    `Semoga produktif dan mencapai target finansial kamu! 🚀`;

  try {
    await sendMessage(phone, welcomeMsg);

    // Log ke whatsapp_messages
    await supabase.from('whatsapp_messages').insert({
      user_id: userId,
      direction: 'outbound',
      from_number: 'bot',
      to_number: phone,
      message: welcomeMsg,
      message_type: 'text',
      status: 'sent',
    });

    res.json({ success: true, message: 'Welcome message sent' });
  } catch (e) {
    console.error('[Auth] Welcome message error:', e.message);
    // Jangan gagalkan registrasi jika WA error
    res.json({ success: false, error: e.message });
  }
});

module.exports = router;
