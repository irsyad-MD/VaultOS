const express = require('express');
const router = express.Router();
const { sendMessage, getStatus, disconnect, reconnect } = require('../services/baileys');
const { handleIncomingMessage } = require('../services/messageHandler');

// Middleware auth
function requireAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || auth !== `Bearer ${process.env.API_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// GET /whatsapp/status
router.get('/status', (req, res) => {
  res.json(getStatus());
});

// POST /whatsapp/send
router.post('/send', requireAuth, async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: 'phone dan message wajib diisi' });
  }
  try {
    await sendMessage(phone, message);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /whatsapp/disconnect
router.post('/disconnect', requireAuth, async (req, res) => {
  try {
    await disconnect();
    res.json({ success: true, message: 'Disconnected' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /whatsapp/reconnect
router.post('/reconnect', requireAuth, async (req, res) => {
  try {
    await reconnect(handleIncomingMessage);
    res.json({ success: true, message: 'Reconnecting...' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
