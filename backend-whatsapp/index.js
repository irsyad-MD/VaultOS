require('dotenv').config();
const express = require('express');
const { connectWhatsApp } = require('./services/baileys');
const { handleIncomingMessage } = require('./services/messageHandler');
const { startCronJobs } = require('./cron/reminder');
const whatsappRoutes = require('./routes/whatsapp');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS (opsional jika diakses dari browser)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

// Routes
app.use('/whatsapp', whatsappRoutes);
app.use('/auth', authRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    app: 'VaultOS Backend WhatsApp',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log('========================================');
  console.log(`  VaultOS Backend WhatsApp`);
  console.log(`  Server: http://localhost:${PORT}`);
  console.log('========================================');
});

// Connect WhatsApp
console.log('[WA] Menghubungkan WhatsApp...');
connectWhatsApp(handleIncomingMessage).catch((err) => {
  console.error('[WA] Gagal connect:', err.message);
});

// Start cron jobs
startCronJobs();
