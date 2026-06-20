# Setup Google OAuth untuk Login

Panduan lengkap untuk mengkonfigurasi Google OAuth di aplikasi ini.

## Langkah-langkah Setup

### 1. Buat Project di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik dropdown project di bagian atas
3. Klik **New Project**
4. Masukkan nama project (contoh: "RAG WebApp")
5. Klik **Create**

### 2. Enable Google Identity Services API

1. Di Google Cloud Console, buka **APIs & Services** > **Library**
2. Cari "Google Identity Services API" atau "Google+ API"
3. Klik dan pilih **Enable**

### 3. Buat OAuth 2.0 Client ID

1. Buka **APIs & Services** > **Credentials**
2. Klik **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Jika diminta, konfigurasi OAuth consent screen terlebih dahulu:
   - User Type: **External** (untuk testing) atau **Internal** (untuk G Suite)
   - App name: Nama aplikasi Anda
   - User support email: Email Anda
   - Developer contact: Email Anda
   - Klik **Save and Continue**
   - Scope: Pilih minimal **email**, **profile**, **openid**
   - Test users: Tambahkan email Anda untuk testing
   - Klik **Save and Continue** sampai selesai

4. Kembali ke **Credentials** > **+ CREATE CREDENTIALS** > **OAuth client ID**
5. Application type: Pilih **Web application**
6. Name: Beri nama (contoh: "RAG WebApp Client")
7. **Authorized JavaScript origins**:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
8. **Authorized redirect URIs**:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
9. Klik **Create**
10. **Copy Client ID** (bukan Client Secret)

### 4. Konfigurasi di Aplikasi

1. Buat file `.env.local` di folder `webapp` (jika belum ada)
2. Tambahkan:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
```
3. Ganti `your_client_id_here` dengan Client ID yang sudah dicopy
4. Restart development server:
```bash
npm run dev
```

## Testing

1. Buka aplikasi di `http://localhost:3000`
2. Klik **Login**
3. Klik tombol **Login dengan Google**
4. Pilih akun Google
5. Setujui permintaan akses
6. Anda akan diarahkan kembali ke aplikasi dan sudah login

## Troubleshooting

### Error: "Google Sign-In belum dikonfigurasi"
- Pastikan `NEXT_PUBLIC_GOOGLE_CLIENT_ID` sudah diisi di `.env.local`
- Pastikan file `.env.local` ada di folder `webapp`
- Restart development server setelah menambahkan environment variable

### Error: "redirect_uri_mismatch"
- Pastikan URI di Google Cloud Console sama persis dengan URL aplikasi
- Untuk development: `http://localhost:3000`
- Pastikan tidak ada trailing slash atau perbedaan protokol (http vs https)

### Error: "access_denied"
- Pastikan Anda sudah menambahkan email sebagai test user di OAuth consent screen
- Jika menggunakan External user type, pastikan sudah menambahkan test users

### Tombol Google tidak muncul
- Pastikan `NEXT_PUBLIC_GOOGLE_CLIENT_ID` sudah dikonfigurasi
- Cek console browser untuk error
- Pastikan script Google Identity Services sudah dimuat

## Production Setup

Untuk production:

1. Update **Authorized JavaScript origins** di Google Cloud Console:
   - Tambahkan domain production Anda: `https://yourdomain.com`

2. Update **Authorized redirect URIs**:
   - Tambahkan: `https://yourdomain.com`

3. Update `.env.local` atau environment variables di hosting:
   - Pastikan `NEXT_PUBLIC_GOOGLE_CLIENT_ID` sudah diisi

4. OAuth consent screen:
   - Lengkapi semua informasi yang diperlukan
   - Submit untuk review (jika menggunakan External user type)

## Catatan Keamanan

- **JANGAN** commit file `.env.local` ke Git
- Client ID aman untuk diekspos di frontend (itulah kenapa menggunakan `NEXT_PUBLIC_`)
- Jangan gunakan Client Secret di frontend
- Untuk production, pertimbangkan menggunakan environment variables di platform hosting

