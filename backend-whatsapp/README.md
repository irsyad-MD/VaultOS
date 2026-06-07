# VaultOS — Backend WhatsApp

Backend Node.js terpisah untuk integrasi WhatsApp Bot VaultOS.
Menggunakan **Baileys**, **Express**, **Groq AI**, dan **node-cron**.

---

## Arsitektur

```
Expo App (React Native)
        │
        ▼
   Supabase DB  ◄──────────────────────────────┐
        │                                       │
        ▼                                       │
Backend WhatsApp (Node.js + Express)            │
        │                                       │
        ├── Baileys (WhatsApp Web protocol) ────┘
        ├── Groq AI (NLP parsing pesan)
        └── node-cron (scheduler reminder)
```

---

## Prasyarat

| Tool | Versi |
|------|-------|
| Node.js | >= 18.x |
| npm | >= 9.x |

---

## Instalasi

```bash
cd backend-whatsapp
npm install
```

---

## Konfigurasi `.env`

Buat file `.env` di folder `backend-whatsapp/`:

```env
# Server
PORT=3001

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Groq AI
GROQ_API_KEY=your-groq-api-key

# WhatsApp Session
SESSION_DIR=./sessions

# Security
API_SECRET=your-random-secret-key
```

> **PENTING**: Jangan commit file `.env` ke Git.

---

## Menjalankan Server

```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Saat pertama kali dijalankan:

1. QR Code muncul di terminal
2. Scan dengan WhatsApp (Settings → Linked Devices → Link a Device)
3. Session tersimpan di `./sessions/`
4. Server restart tidak perlu scan ulang

---

## QR Code Login

```
┌─────────────────────────────────────┐
│  Scan QR ini dengan WhatsApp kamu   │
│                                     │
│  ██████████████  ██  ██████████████ │
│  ██          ██  ██  ██          ██ │
│  ██  ██████  ██      ██  ██████  ██ │
│  ...                                │
└─────────────────────────────────────┘
```

Session disimpan di `backend-whatsapp/sessions/` menggunakan `useMultiFileAuthState()`.

---

## API Endpoints

### Status

```
GET /whatsapp/status
```

**Response:**
```json
{
  "connected": true,
  "phoneNumber": "6281234567890",
  "connectedAt": "2025-01-01T00:00:00Z"
}
```

---

### Kirim Pesan

```
POST /whatsapp/send
Authorization: Bearer {API_SECRET}
```

**Body:**
```json
{
  "phone": "6281234567890",
  "message": "Halo dari VaultOS!"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "xxx"
}
```

---

### Welcome Message (dipanggil otomatis saat registrasi)

```
POST /auth/send-welcome-message
Authorization: Bearer {API_SECRET}
```

**Body:**
```json
{
  "userId": "uuid",
  "name": "John Doe",
  "phone": "6281234567890"
}
```

---

### Disconnect

```
POST /whatsapp/disconnect
Authorization: Bearer {API_SECRET}
```

---

### Reconnect

```
POST /whatsapp/reconnect
Authorization: Bearer {API_SECRET}
```

---

## Perintah Bot WhatsApp

User dapat mengirim pesan ke nomor bot:

| Perintah | Aksi |
|----------|------|
| `saldo` | Tampilkan total saldo semua akun |
| `laporan bulan ini` | Ringkasan pemasukan & pengeluaran |
| `pengeluaran terbesar saya` | Analisis kategori pengeluaran terbesar |
| `beli kopi 25000` | Catat transaksi pengeluaran Rp 25.000 |
| `gaji 5000000` | Catat transaksi pemasukan Rp 5.000.000 |
| `olahraga selesai` | Tandai habit sebagai selesai hari ini |
| `buat target laptop 10000000` | Buat financial goal Rp 10.000.000 |
| `ingatkan bayar listrik tanggal 10` | Set reminder tagihan |
| `buat tugas laporan deadline besok` | Buat task baru |
| `bantuan` | Tampilkan semua perintah |

---

## Reminder Otomatis (Cron Jobs)

Backend menjalankan cron setiap menit untuk mengirim notifikasi WhatsApp otomatis:

| Trigger | Pesan |
|---------|-------|
| Task deadline hari ini | ⚠️ Deadline Hari Ini: {nama tugas} |
| Habit belum selesai jam 20:00 | 🔥 Streak Anda Terancam Putus! |
| Tagihan jatuh tempo | 💳 Tagihan Jatuh Tempo: {nama} |
| Goal progress < 50% sisa 7 hari | 🎯 Progress Target Kurang dari 50% |
| Pengeluaran hari ini > rata-rata | 📊 Pengeluaran Hari Ini Tinggi |
| Jadwal mulai 30 menit lagi | 📅 Jadwal Dimulai 30 Menit Lagi |

---

## Struktur Folder

```
backend-whatsapp/
├── index.js              # Entry point, setup Baileys + Express
├── routes/
│   ├── auth.js           # POST /auth/send-welcome-message
│   └── whatsapp.js       # GET|POST /whatsapp/*
├── services/
│   ├── baileys.js        # WhatsApp connection & send logic
│   ├── groq.js           # Groq AI NLP parsing
│   ├── supabase.js       # Supabase client (service role)
│   └── messageHandler.js # Parse & route incoming messages
├── cron/
│   └── reminder.js       # node-cron scheduler
├── sessions/             # Baileys session files (gitignored)
├── .env                  # Environment variables (gitignored)
├── .env.example          # Template environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## Keamanan

- Semua endpoint terproteksi dengan `Authorization: Bearer {API_SECRET}`
- `SUPABASE_SERVICE_ROLE_KEY` **tidak pernah** dikirim ke Expo App
- `GROQ_API_KEY` hanya ada di backend
- Session WhatsApp hanya ada di server (folder `sessions/`)
- Expo App hanya membaca status koneksi, tidak punya akses langsung ke WhatsApp

---

## Database Tables yang Digunakan

| Tabel | Kegunaan |
|-------|----------|
| `user_profiles` | Lookup user by whatsapp_number |
| `transactions` | Insert transaksi via bot |
| `habits` + `habit_completions` | Toggle habit via bot |
| `goals` | Buat/update financial goal |
| `tasks` | Buat task via bot |
| `reminders` | Set reminder via bot |
| `whatsapp_sessions` | Simpan status koneksi |
| `whatsapp_messages` | Log semua pesan masuk/keluar |
| `user_settings` | Cek apakah user aktifkan WhatsApp bot |

---

## Deploy ke VPS / Railway / Render

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login & deploy
railway login
railway init
railway up
```

### Render

1. Buat **Web Service** baru
2. Set **Build Command**: `npm install`
3. Set **Start Command**: `npm start`
4. Tambah semua environment variables dari `.env`

### VPS (Ubuntu)

```bash
# Install PM2
npm install -g pm2

# Start
pm2 start index.js --name vaultos-whatsapp

# Auto-start on reboot
pm2 startup
pm2 save
```

---

## Troubleshooting

**QR tidak muncul saat start:**
```bash
rm -rf sessions/
npm start
```

**Session expired / logout:**
```bash
rm -rf sessions/
npm start
# Scan ulang QR
```

**Koneksi terputus:**
Server otomatis reconnect. Jika gagal:
```bash
curl -X POST http://localhost:3001/whatsapp/reconnect \
  -H "Authorization: Bearer your-secret"
```

---

## Environment Variables Reference

| Variable | Wajib | Deskripsi |
|----------|-------|-----------|
| `PORT` | ❌ | Port server (default: 3001) |
| `SUPABASE_URL` | ✅ | URL project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (bukan anon key!) |
| `GROQ_API_KEY` | ✅ | API key dari console.groq.com |
| `SESSION_DIR` | ❌ | Folder session (default: ./sessions) |
| `API_SECRET` | ✅ | Secret key untuk proteksi endpoint |

---

## Mendapatkan Groq API Key

1. Buka [console.groq.com](https://console.groq.com)
2. Daftar / Login
3. Klik **API Keys** → **Create API Key**
4. Copy dan simpan ke `.env`

Model yang direkomendasikan: `llama3-8b-8192` (gratis, cepat)

---

*VaultOS Backend WhatsApp — by ImsyadDeveloper*
