# Cloudflare Firewall Rules

Dokumentasi ini menjelaskan aturan firewall minimal yang harus dikonfigurasi di Cloudflare untuk mengamankan endpoint n8n dan webhook.

## Prasyarat

1. Domain sudah terhubung ke Cloudflare
2. DNS records sudah dikonfigurasi dengan proxy enabled (orange cloud)
3. Cloudflare Tunnel sudah berjalan

## Aturan Firewall Minimal (2 Rules)

### Rule 1: Blokir HTTP Methods Selain GET dan POST

**Tujuan:** Mencegah penggunaan HTTP methods yang tidak diperlukan (PUT, DELETE, PATCH, dll) yang dapat menjadi vektor serangan.

**Konfigurasi di Cloudflare Dashboard:**

1. Masuk ke **Security** → **WAF** → **Custom Rules**
2. Klik **Create rule**
3. Isi konfigurasi:
   - **Rule name:** `Block Non-GET-POST Methods`
   - **Expression:**
     ```
     (http.request.method ne "GET" and http.request.method ne "POST")
     ```
   - **Action:** `Block`
   - **Deploy** rule

**Expression Breakdown:**
- `http.request.method ne "GET"` → Method bukan GET
- `and http.request.method ne "POST"` → DAN method bukan POST
- Hasil: Blokir semua method selain GET dan POST

**Testing:**
```bash
# Seharusnya diblokir (403 Forbidden)
curl -X PUT https://webhook.<DOMAIN>/webhook/test
curl -X DELETE https://webhook.<DOMAIN>/webhook/test
curl -X PATCH https://webhook.<DOMAIN>/webhook/test

# Seharusnya diizinkan
curl -X GET https://n8n.<DOMAIN>
curl -X POST https://webhook.<DOMAIN>/webhook/test
```

---

### Rule 2: Izinkan Request Hanya dari Vercel dan Telegram

**Tujuan:** Membatasi akses webhook hanya dari sumber yang terpercaya (Vercel untuk WebApp dan Telegram untuk bot).

**Konfigurasi di Cloudflare Dashboard:**

1. Masuk ke **Security** → **WAF** → **Custom Rules**
2. Klik **Create rule**
3. Isi konfigurasi:
   - **Rule name:** `Allow Only Vercel and Telegram`
   - **Expression:**
     ```
     (http.host eq "webhook.<DOMAIN>" and not (ip.geoip.asnum in {13335 62041} or ip.src in {<VERCEL_IP_RANGES>}))
     ```
   - **Action:** `Block`
   - **Deploy** rule

**Catatan:**
- ASN 13335 = Vercel (Cloudflare)
- ASN 62041 = Telegram
- Ganti `<VERCEL_IP_RANGES>` dengan IP ranges Vercel (opsional, lebih baik pakai ASN)

**Alternatif Expression (Lebih Sederhana):**

Jika ingin lebih spesifik untuk webhook endpoint saja:

```
(http.host eq "webhook.<DOMAIN>" and http.request.uri.path contains "/webhook/" and not ip.geoip.asnum in {13335 62041})
```

**Expression Breakdown:**
- `http.host eq "webhook.<DOMAIN>"` → Hanya untuk subdomain webhook
- `and not ip.geoip.asnum in {13335 62041}` → DAN bukan dari ASN Vercel/Telegram
- Hasil: Blokir semua request ke webhook yang bukan dari Vercel/Telegram

**Mendapatkan ASN Vercel dan Telegram:**

```bash
# Cek ASN dari IP
curl -s "https://ipapi.co/<IP_ADDRESS>/asn/"

# Vercel IP ranges (dari dokumentasi resmi)
# ASN: 13335 (Vercel menggunakan Cloudflare)
# Telegram ASN: 62041
```

**Testing:**
```bash
# Dari server Vercel/Telegram: Seharusnya diizinkan
# Dari IP lain: Seharusnya diblokir (403 Forbidden)
```

---

## Aturan Tambahan (Opsional)

### Rule 3: Rate Limiting untuk Webhook

**Tujuan:** Mencegah abuse dan DDoS pada endpoint webhook.

**Konfigurasi:**

1. Masuk ke **Security** → **WAF** → **Rate limiting rules**
2. Klik **Create rule**
3. Isi konfigurasi:
   - **Rule name:** `Rate Limit Webhook`
   - **Match:** `http.host eq "webhook.<DOMAIN>" and http.request.uri.path contains "/webhook/"`
   - **Rate:** `10 requests per minute`
   - **Action:** `Block` atau `Challenge`

### Rule 4: Challenge untuk n8n Interface

**Tujuan:** Melindungi akses ke n8n interface dengan challenge (CAPTCHA).

**Konfigurasi:**

1. Masuk ke **Security** → **WAF** → **Custom Rules**
2. Klik **Create rule**
3. Isi konfigurasi:
   - **Rule name:** `Challenge n8n Interface`
   - **Expression:**
     ```
     (http.host eq "n8n.<DOMAIN>" and not cf.verified_bot)
     ```
   - **Action:** `Challenge (Managed Challenge)`

---

## Verifikasi Firewall Rules

### Checklist Verifikasi:

- [ ] Rule 1 aktif dan memblokir PUT/DELETE/PATCH
- [ ] Rule 2 aktif dan memblokir request dari IP non-Vercel/Telegram
- [ ] GET dan POST masih berfungsi normal
- [ ] Webhook dari Vercel dapat mengakses endpoint
- [ ] Telegram webhook dapat mengakses endpoint
- [ ] Log firewall events muncul di Cloudflare Analytics

### Monitoring Firewall Events:

1. Masuk ke **Security** → **Events**
2. Filter berdasarkan:
   - **Action:** Blocked
   - **Rule ID:** ID dari rule yang dibuat
3. Review events untuk memastikan rules bekerja dengan benar

---

## Troubleshooting

### Problem: Webhook diblokir padahal dari Vercel

**Solusi:**
1. Cek ASN dari IP Vercel di Cloudflare Analytics
2. Pastikan ASN 13335 ada di whitelist
3. Atau gunakan IP-based whitelist jika ASN tidak akurat

### Problem: Telegram webhook diblokir

**Solusi:**
1. Telegram menggunakan multiple ASN/IP ranges
2. Tambahkan ASN 62041 ke whitelist
3. Atau gunakan IP ranges Telegram (dari dokumentasi resmi)

### Problem: Rule terlalu ketat, memblokir request valid

**Solusi:**
1. Review expression di Cloudflare Dashboard
2. Test dengan curl dari berbagai sumber
3. Adjust expression secara bertahap
4. Gunakan "Log" action terlebih dahulu sebelum "Block"

---

## Referensi

- [Cloudflare WAF Custom Rules](https://developers.cloudflare.com/waf/custom-rules/)
- [Cloudflare Firewall Rules Expressions](https://developers.cloudflare.com/ruleset-engine/rules-language/expressions/)
- [Vercel IP Ranges](https://vercel.com/docs/security/deployment-protection#ip-addresses)
- [Telegram Bot API](https://core.telegram.org/bots/api)
