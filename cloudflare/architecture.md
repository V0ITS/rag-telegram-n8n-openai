# Arsitektur Cloudflare Integration

Dokumentasi arsitektur lengkap untuk integrasi Cloudflare (DNS + Tunnel + Security) dengan n8n dan WebApp.

## Overview

Sistem ini menggunakan Cloudflare untuk:
- **DNS Management** - Mengelola DNS records untuk domain
- **Cloudflare Tunnel** - Menghubungkan localhost ke internet tanpa port forwarding
- **WAF & Firewall** - Melindungi endpoint dari serangan
- **Analytics** - Monitoring traffic dan security events

## Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (TLS terminated at Cloudflare)
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE EDGE                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   DNS Zone   │  │  WAF Rules   │  │  Analytics   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Cloudflare Tunnel (cloudflared)              │  │
│  │  - n8n.<DOMAIN> → localhost:5678                         │  │
│  │  - webhook.<DOMAIN> → localhost:5678                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (internal, not exposed)
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      LOCAL HOST                                 │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Docker Container: n8n                                   │  │
│  │  - Port: 5678                                           │  │
│  │  - Workflow 1: Telegram Bot                             │  │
│  │  - Workflow 2: WebApp Webhook                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js WebApp (Vercel)                                │  │
│  │  - Calls: webhook.<DOMAIN>/webhook/<ID>                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Komponen Sistem

### 1. Cloudflare DNS

**Fungsi:**
- Mengelola DNS records untuk domain
- Proxy traffic melalui Cloudflare (orange cloud)

**DNS Records yang Dibutuhkan:**

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| CNAME | n8n | <TUNNEL-UUID>.cfargotunnel.com | ✅ Proxied | Auto |
| CNAME | webhook | <TUNNEL-UUID>.cfargotunnel.com | ✅ Proxied | Auto |

**Catatan:**
- Proxy harus **enabled** (orange cloud) untuk menggunakan Cloudflare Tunnel
- TTL otomatis saat proxy enabled

### 2. Cloudflare Tunnel (cloudflared)

**Fungsi:**
- Membuat secure connection dari Cloudflare ke localhost
- Tidak memerlukan port forwarding di router
- TLS termination di Cloudflare edge

**Konfigurasi:**
- File: `cloudflare/tunnel-config.yaml`
- Service: `cloudflared tunnel run`
- Routing:
  - `n8n.<DOMAIN>` → `http://localhost:5678`
  - `webhook.<DOMAIN>` → `http://localhost:5678`

**Keuntungan vs Ngrok:**
- ✅ Tidak ada batasan waktu (Ngrok free plan terbatas)
- ✅ Domain custom (tidak perlu URL random)
- ✅ Lebih stabil dan reliable
- ✅ Gratis untuk penggunaan dasar
- ✅ Integrasi dengan Cloudflare security features

### 3. Cloudflare WAF & Firewall

**Fungsi:**
- Melindungi endpoint dari serangan
- Rate limiting
- IP/ASN filtering

**Rules yang Dikonfigurasi:**
1. **Block Non-GET-POST Methods** - Blokir HTTP methods selain GET/POST
2. **Allow Only Vercel and Telegram** - Izinkan hanya dari ASN Vercel dan Telegram

**Detail:** Lihat `firewall-rules.md`

### 4. n8n Workflows

#### Workflow 1: Telegram Bot
- **Trigger:** Telegram Webhook
- **Webhook URL:** `https://webhook.<DOMAIN>/webhook/<TELEGRAM_WEBHOOK_ID>`
- **Flow:** Telegram → OpenAI → Telegram Response

#### Workflow 2: WebApp Webhook
- **Trigger:** HTTP Webhook
- **Webhook URL:** `https://webhook.<DOMAIN>/webhook/<WEBAPP_WEBHOOK_ID>`
- **Flow:** WebApp Request → OpenAI → JSON Response

### 5. Next.js WebApp (Vercel)

**Fungsi:**
- Frontend untuk chat interface
- Memanggil n8n webhook via Cloudflare

**Endpoint:**
- **API Route:** `/api/ask`
- **Calls:** `https://webhook.<DOMAIN>/webhook/<WEBAPP_WEBHOOK_ID>`

**Environment Variables:**
```env
N8N_WEBHOOK_URL=https://webhook.<DOMAIN>/webhook/<WEBAPP_WEBHOOK_ID>
N8N_CLOUDFLARE_URL=https://webhook.<DOMAIN>
```

## Alur Data

### 1. Telegram Bot Flow

```
User (Telegram) 
  → Telegram API
  → Cloudflare (webhook.<DOMAIN>)
  → Cloudflare Tunnel
  → n8n (localhost:5678)
  → OpenAI API
  → n8n Response
  → Cloudflare Tunnel
  → Cloudflare
  → Telegram API
  → User (Telegram)
```

### 2. WebApp Flow

```
User (Browser)
  → Vercel (WebApp)
  → API Route (/api/ask)
  → Cloudflare (webhook.<DOMAIN>)
  → Cloudflare Tunnel
  → n8n (localhost:5678)
  → OpenAI API
  → n8n Response
  → Cloudflare Tunnel
  → Cloudflare
  → Vercel (WebApp)
  → User (Browser)
```

## Security Layers

### Layer 1: Cloudflare Edge
- TLS/SSL termination
- DDoS protection
- Bot management

### Layer 2: Cloudflare WAF
- Custom firewall rules
- Rate limiting
- IP/ASN filtering

### Layer 3: Cloudflare Tunnel
- Secure connection (mTLS)
- No exposed ports
- Encrypted traffic

### Layer 4: Application Level
- n8n authentication
- Webhook validation
- API key protection

## Monitoring & Analytics

### Cloudflare Analytics

**Metrics yang Dimonitor:**
1. **Traffic**
   - Requests per minute/hour/day
   - Bandwidth usage
   - Geographic distribution

2. **Firewall Events**
   - Blocked requests
   - Rule matches
   - Threat scores

3. **Performance**
   - Response time
   - Cache hit ratio
   - Latency

**Akses:**
- Dashboard → Analytics → Overview
- Dashboard → Security → Events

### n8n Monitoring

- Workflow execution logs
- Error tracking
- Performance metrics

## Deployment Checklist

### Pre-Deployment
- [ ] Domain terdaftar dan terhubung ke Cloudflare
- [ ] Cloudflare Tunnel dibuat dan dikonfigurasi
- [ ] DNS records dikonfigurasi dengan proxy enabled
- [ ] Firewall rules dikonfigurasi dan diuji

### Deployment
- [ ] cloudflared tunnel berjalan
- [ ] n8n container berjalan (port 5678)
- [ ] Environment variables dikonfigurasi
- [ ] Telegram webhook URL diupdate
- [ ] Vercel environment variables diupdate

### Post-Deployment
- [ ] Test Telegram bot
- [ ] Test WebApp webhook
- [ ] Verify firewall rules bekerja
- [ ] Monitor Cloudflare Analytics
- [ ] Review security events

## Troubleshooting

### Problem: Tunnel tidak connect

**Solusi:**
1. Cek cloudflared tunnel status: `cloudflared tunnel info <TUNNEL-NAME>`
2. Verify credentials file exists
3. Check tunnel config syntax
4. Review cloudflared logs

### Problem: DNS tidak resolve

**Solusi:**
1. Verify DNS records di Cloudflare Dashboard
2. Pastikan proxy enabled (orange cloud)
3. Wait for DNS propagation (bisa sampai 24 jam)
4. Test dengan `nslookup n8n.<DOMAIN>`

### Problem: 403 Forbidden dari firewall

**Solusi:**
1. Check Cloudflare Security → Events
2. Review firewall rules expression
3. Verify IP/ASN whitelist
4. Test dengan curl dari berbagai sumber

## Referensi

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare WAF](https://developers.cloudflare.com/waf/)
- [n8n Documentation](https://docs.n8n.io/)
- [Vercel Documentation](https://vercel.com/docs)
