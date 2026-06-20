# Cloudflare Integration Documentation

Folder ini berisi semua dokumentasi dan konfigurasi untuk integrasi Cloudflare (Progress 6).

## File Structure

### Konfigurasi
- **`tunnel-config.yaml`** - Konfigurasi Cloudflare Tunnel
  - Routing rules untuk n8n dan webhook subdomains
  - Ganti `<TUNNEL-UUID>`, `<DOMAIN>`, dan `<USERNAME>` sebelum digunakan

### Setup Scripts
- **`setup-cloudflared.ps1`** - Setup script untuk Windows (PowerShell)
- **`setup-cloudflared.sh`** - Setup script untuk Linux/Mac (Bash)

### Dokumentasi
- **`architecture.md`** - Arsitektur lengkap sistem dengan Cloudflare
  - Diagram arsitektur
  - Komponen sistem
  - Alur data
  - Security layers

- **`firewall-rules.md`** - Dokumentasi firewall rules
  - Rule 1: Block non-GET-POST methods
  - Rule 2: Allow only Vercel and Telegram
  - Testing procedures
  - Troubleshooting

- **`integration-report.md`** - Laporan integrasi lengkap
  - Setup Cloudflare
  - Tunnel configuration
  - Workflow integration
  - Firewall implementation
  - Monitoring results

- **`monitoring.md`** - Panduan monitoring dan analytics
  - Cloudflare Analytics
  - Security Events
  - Tunnel status
  - Key metrics
  - Troubleshooting

## Quick Start

### 1. Install cloudflared

**Windows:**
```powershell
# Via Chocolatey
choco install cloudflared

# Atau download dari GitHub
# https://github.com/cloudflare/cloudflared/releases
```

**Linux:**
```bash
sudo apt install cloudflared
```

**macOS:**
```bash
brew install cloudflared
```

### 2. Run Setup Script

**Windows:**
```powershell
.\cloudflare\setup-cloudflared.ps1
```

**Linux/Mac:**
```bash
chmod +x cloudflare/setup-cloudflared.sh
./cloudflare/setup-cloudflared.sh
```

### 3. Manual Setup (Jika Script Tidak Digunakan)

1. Login: `cloudflared tunnel login`
2. Create tunnel: `cloudflared tunnel create rag-n8n-tunnel`
3. Edit `tunnel-config.yaml` dengan Tunnel ID dan domain
4. Setup DNS: 
   ```bash
   cloudflared tunnel route dns rag-n8n-tunnel n8n.<DOMAIN>
   cloudflared tunnel route dns rag-n8n-tunnel webhook.<DOMAIN>
   ```
5. Run tunnel: `cloudflared tunnel run --config ./cloudflare/tunnel-config.yaml rag-n8n-tunnel`

### 4. Configure Firewall Rules

Lihat `firewall-rules.md` untuk instruksi lengkap.

Minimal 2 rules:
1. Block non-GET-POST methods
2. Allow only Vercel and Telegram

### 5. Update Environment Variables

**docker-compose.yml:**
```yaml
environment:
  - WEBHOOK_URL=https://webhook.<DOMAIN>
  - N8N_CLOUDFLARE_URL=https://webhook.<DOMAIN>
```

**Vercel:**
```env
N8N_WEBHOOK_URL=https://webhook.<DOMAIN>/webhook/<WEBHOOK_ID>
N8N_CLOUDFLARE_URL=https://webhook.<DOMAIN>
```

## URLs Setelah Setup

- **n8n Interface:** `https://n8n.<DOMAIN>`
- **Webhook Endpoint:** `https://webhook.<DOMAIN>/webhook/<WEBHOOK_ID>`

## Troubleshooting

### Tunnel Tidak Connect
- Cek credentials file: `~/.cloudflared/<TUNNEL-UUID>.json`
- Verify tunnel config syntax
- Check cloudflared logs

### DNS Tidak Resolve
- Verify DNS records di Cloudflare Dashboard
- Pastikan proxy enabled (orange cloud)
- Wait for DNS propagation (5-10 menit)

### 403 Forbidden
- Check Cloudflare Security → Events
- Review firewall rules
- Verify IP/ASN whitelist

Lihat `monitoring.md` untuk troubleshooting lengkap.

## Referensi

- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare WAF](https://developers.cloudflare.com/waf/)
- [Cloudflare Analytics](https://developers.cloudflare.com/analytics/)

## Checklist Implementasi

- [ ] Cloudflare account dan domain setup
- [ ] cloudflared installed
- [ ] Tunnel created dan configured
- [ ] DNS records configured dengan proxy enabled
- [ ] Tunnel running dan connected
- [ ] Firewall rules configured (minimal 2 rules)
- [ ] Environment variables updated
- [ ] Workflows updated dengan Cloudflare URLs
- [ ] Ngrok removed/stopped
- [ ] Testing completed
- [ ] Monitoring setup
- [ ] Documentation reviewed

---

**Last Updated:** [Date]  
**Version:** 1.0

