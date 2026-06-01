# VaultOS Web — Vercel Hosting

## Deploy
1. Push folder `website/` ke GitHub repo baru
2. Buka [vercel.com](https://vercel.com) → New Project → Import repo
3. **Root Directory**: set ke `website`
4. Deploy → salin URL (misal: `https://vaultos.vercel.app`)

## Konfigurasi Supabase
1. Buka `website/auth/confirm.html` → ganti `GANTI_DENGAN_ANON_KEY_KAMU` dengan nilai `EXPO_PUBLIC_SUPABASE_ANON_KEY` dari file `.env`
2. OnSpace Cloud Dashboard → **Users** → **Auth Settings**:
   - **Site URL**: `https://vaultos.vercel.app`
   - **Redirect URLs**: tambahkan `https://vaultos.vercel.app/auth/confirm`
