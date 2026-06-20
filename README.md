# RAG Telegram Bot using n8n + OpenAI

Proyek ini dibuat untuk membangun sistem RAG (Retrieval-Augmented Generation) 
yang terintegrasi dengan Telegram Bot melalui n8n dan OpenAI API.

## Struktur Proyek
- /n8n-workflows → Workflow n8n (Telegram → OpenAI → Telegram)
- /rag-data → Dataset RAG (pdf/txt)
- /docs → Dokumentasi setup & diagram arsitektur
- /webapp → Next.js Web Application dengan autentikasi
- /cloudflare → Konfigurasi Cloudflare (Tunnel, Firewall, Dokumentasi)
- docker-compose.yml → Infrastruktur n8n lokal
- README.md → Dokumentasi awal proyek

## Tools yang Digunakan
- Docker & Docker Compose
- Node.js
- n8n (local, via Docker)
- Git + GitHub
- Cloudflare (DNS + Tunnel + WAF) — see `/cloudflare` for setup and config
- VSCode
- Next.js 14
- Google OAuth 2.0
- Vercel (WebApp hosting)

## WebApp Setup

### Instalasi

1. Masuk ke folder webapp:
```bash
cd webapp
npm install
```

2. Buat file `.env.local` di folder `webapp`:
```env
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here

# n8n Webhook URL
NEXT_PUBLIC_N8N_WEBHOOK_URL=your_n8n_webhook_url_here
```

### Setup Google OAuth

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang sudah ada
3. Enable **Google+ API** atau **Google Identity Services**
4. Buat **OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Name: Nama aplikasi Anda
   - Authorized JavaScript origins: `http://localhost:3000` (untuk development)
   - Authorized redirect URIs: `http://localhost:3000` (untuk development)
5. Copy **Client ID** dan paste ke `.env.local`

### Menjalankan Aplikasi

```bash
cd webapp
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

### Fitur Autentikasi

- **Registrasi**: Buat akun baru dengan username, email, dan password
- **Login**: Login dengan username/password atau Google OAuth
- **Google OAuth**: Login menggunakan akun Google (jika dikonfigurasi)
- **Proteksi Halaman**: Halaman utama hanya bisa diakses setelah login
- **Logout**: Tombol logout tersedia di pojok kanan atas

### Catatan

- Data user disimpan di `localStorage` (untuk development)
- Untuk production, disarankan menggunakan database dan enkripsi password
- Google OAuth bersifat opsional - aplikasi tetap berfungsi tanpa konfigurasi Google

---

## Cloudflare Setup (Progress 6)

Proyek ini menggunakan Cloudflare untuk DNS management, secure tunneling, dan security features.

### Prasyarat

1. Domain terdaftar (bisa domain gratis atau berbayar)
2. Akun Cloudflare (Free plan sudah cukup)
3. cloudflared terinstall di host machine

### Quick Setup

#### 1. Install cloudflared

**Windows:**
- Download dari [GitHub Releases](https://github.com/cloudflare/cloudflared/releases)
- Atau via Chocolatey: `choco install cloudflared`

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install cloudflared

# Atau download dari GitHub Releases
```

**macOS:**
```bash
brew install cloudflared
```

#### 2. Setup Cloudflare Tunnel

**Windows (PowerShell):**
```powershell
# Jalankan script setup
.\cloudflare\setup-cloudflared.ps1
```

**Linux/Mac:**
```bash
# Berikan permission execute
chmod +x cloudflare/setup-cloudflared.sh

# Jalankan script setup
./cloudflare/setup-cloudflared.sh
```

**Manual Setup:**
1. Login ke Cloudflare: `cloudflared tunnel login`
2. Buat tunnel: `cloudflared tunnel create rag-n8n-tunnel`
3. Copy Tunnel ID yang dihasilkan
4. Edit `cloudflare/tunnel-config.yaml`:
   - Ganti `<TUNNEL-UUID>` dengan Tunnel ID
   - Ganti `<DOMAIN>` dengan domain Anda
   - Ganti `<USERNAME>` dengan username Anda
5. Setup DNS: 
   ```bash
   cloudflared tunnel route dns rag-n8n-tunnel n8n.<DOMAIN>
   cloudflared tunnel route dns rag-n8n-tunnel webhook.<DOMAIN>
   ```
6. Pastikan proxy enabled (orange cloud) di Cloudflare Dashboard

#### 3. Jalankan Tunnel

```bash
# Windows
cloudflared tunnel run --config .\cloudflare\tunnel-config.yaml rag-n8n-tunnel

# Linux/Mac
cloudflared tunnel run --config ./cloudflare/tunnel-config.yaml rag-n8n-tunnel
```

#### 4. Update Environment Variables

**docker-compose.yml:**
```yaml
environment:
  - WEBHOOK_URL=https://webhook.<DOMAIN>
  - N8N_CLOUDFLARE_URL=https://webhook.<DOMAIN>
  - N8N_HOST=n8n.<DOMAIN>
```

**Vercel (WebApp):**
```env
N8N_WEBHOOK_URL=https://webhook.<DOMAIN>/webhook/<WEBAPP_WEBHOOK_ID>
N8N_CLOUDFLARE_URL=https://webhook.<DOMAIN>
```

#### 5. Setup Firewall Rules

1. Masuk ke Cloudflare Dashboard → Security → WAF → Custom Rules
2. Buat 2 rules minimal (lihat `cloudflare/firewall-rules.md`):
   - **Rule 1:** Block non-GET-POST methods
   - **Rule 2:** Allow only Vercel and Telegram

#### 6. Update Workflows

**Workflow 1 (Telegram):**
- Update Telegram webhook URL ke: `https://webhook.<DOMAIN>/webhook/<TELEGRAM_WEBHOOK_ID>`

**Workflow 2 (WebApp):**
- Webhook URL sudah otomatis menggunakan Cloudflare jika environment variables sudah diupdate

### Dokumentasi Lengkap

Lihat folder `/cloudflare` untuk dokumentasi lengkap:
- `tunnel-config.yaml` - Konfigurasi Cloudflare Tunnel
- `firewall-rules.md` - Dokumentasi firewall rules
- `architecture.md` - Arsitektur sistem lengkap
- `integration-report.md` - Laporan integrasi
- `monitoring.md` - Panduan monitoring dan analytics
- `setup-cloudflared.ps1` - Setup script untuk Windows
- `setup-cloudflared.sh` - Setup script untuk Linux/Mac

### URLs Setelah Setup

- **n8n Interface:** `https://n8n.<DOMAIN>`
- **Webhook Endpoint:** `https://webhook.<DOMAIN>/webhook/<WEBHOOK_ID>`
- **WebApp (Vercel):** `https://<VERCEL_DOMAIN>`

### Troubleshooting

Lihat `cloudflare/monitoring.md` untuk panduan troubleshooting dan monitoring.

---

## Catatan Penting

- **Ngrok telah digantikan** dengan Cloudflare Tunnel
- Pastikan cloudflared tunnel berjalan sebelum menggunakan sistem
- Firewall rules harus dikonfigurasi untuk keamanan
- Monitor Cloudflare Analytics secara berkala
