const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const path = require('path');
const supabase = require('./supabase');

let sock = null;
let isConnected = false;
let connectedPhone = null;

const SESSION_DIR = path.resolve(process.env.SESSION_DIR || './sessions');

async function connectWhatsApp(onMessage) {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['VaultOS Bot', 'Chrome', '1.0.0'],
  });

  // QR Code
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n========================================');
      console.log('  SCAN QR INI DENGAN WHATSAPP KAMU');
      console.log('  Settings > Linked Devices > Link a Device');
      console.log('========================================\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      isConnected = false;
      connectedPhone = null;
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log('[WA] Koneksi terputus, mencoba reconnect...');
        setTimeout(() => connectWhatsApp(onMessage), 3000);
      } else {
        console.log('[WA] Logged out. Hapus folder sessions/ lalu restart.');
      }

      // Update status di Supabase
      await supabase.from('whatsapp_sessions').upsert({
        session_id: 'main',
        status: 'disconnected',
        phone_number: null,
      });
    }

    if (connection === 'open') {
      isConnected = true;
      connectedPhone = sock.user?.id?.split(':')[0] ?? null;
      console.log(`[WA] Terhubung sebagai: ${connectedPhone}`);

      // Update status di Supabase
      await supabase.from('whatsapp_sessions').upsert({
        session_id: 'main',
        status: 'connected',
        phone_number: connectedPhone,
        connected_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      });
    }
  });

  // Save credentials
  sock.ev.on('creds.update', saveCreds);

  // Incoming messages
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      const from = msg.key.remoteJid;
      if (!from || from.endsWith('@g.us')) continue; // skip grup

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        '';

      if (text && onMessage) {
        await onMessage(from, text, msg);
      }

      // Update last_seen
      await supabase.from('whatsapp_sessions').upsert({
        session_id: 'main',
        last_seen: new Date().toISOString(),
      });
    }
  });
}

async function sendMessage(phone, text) {
  if (!sock || !isConnected) {
    throw new Error('WhatsApp tidak terhubung');
  }
  const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
  await sock.sendMessage(jid, { text });
  return true;
}

async function disconnect() {
  if (sock) {
    await sock.logout();
    sock = null;
    isConnected = false;
    connectedPhone = null;
  }
}

async function reconnect(onMessage) {
  if (sock) {
    try { sock.end(); } catch (e) {}
    sock = null;
  }
  isConnected = false;
  await connectWhatsApp(onMessage);
}

function getStatus() {
  return {
    connected: isConnected,
    phoneNumber: connectedPhone,
    connectedAt: isConnected ? new Date().toISOString() : null,
  };
}

module.exports = { connectWhatsApp, sendMessage, disconnect, reconnect, getStatus };
