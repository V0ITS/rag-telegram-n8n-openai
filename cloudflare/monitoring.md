# Cloudflare Monitoring & Analytics

Dokumentasi untuk monitoring dan analitik Cloudflare setelah integrasi.

## Overview

Cloudflare menyediakan berbagai tools untuk monitoring:
- **Analytics** - Traffic, bandwidth, performance metrics
- **Security Events** - Firewall events, blocked requests, threats
- **Logs** - Request logs, error logs
- **Tunnel Status** - Connection status, health checks

---

## 1. Cloudflare Analytics

### 1.1 Akses Analytics

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Pilih domain Anda
3. Navigate ke **Analytics & Logs** → **Analytics**

### 1.2 Metrics yang Dimonitor

#### Traffic Metrics

**Total Requests**
- Total jumlah request ke domain
- Breakdown per subdomain (n8n, webhook)
- Time range: Last 24 hours, 7 days, 30 days

**Bandwidth**
- Total bandwidth usage
- Inbound vs Outbound
- Breakdown per subdomain

**Requests per Minute**
- Peak requests per minute
- Average requests per minute
- Identify traffic spikes

#### Geographic Distribution

- Requests per country
- Top countries by traffic
- Useful untuk identify legitimate vs suspicious traffic

#### HTTP Status Codes

- 200 OK - Successful requests
- 403 Forbidden - Blocked by firewall
- 404 Not Found - Invalid endpoints
- 500+ - Server errors

### 1.3 Performance Metrics

**Response Time**
- Average response time
- P50, P95, P99 percentiles
- Identify slow endpoints

**Cache Hit Ratio**
- Static assets cache hit rate
- Dynamic content (usually 0% for webhooks)

**Uptime**
- Service availability
- Downtime incidents

---

## 2. Security Events & Firewall

### 2.1 Akses Security Events

1. Navigate ke **Security** → **Events**
2. Filter berdasarkan:
   - **Action** (Block, Allow, Challenge)
   - **Rule ID** (Custom firewall rules)
   - **IP Address**
   - **Country**
   - **Time Range**

### 2.2 Firewall Events Dashboard

**Blocked Requests**
- Total blocked requests
- Breakdown by rule
- Top blocked IPs
- Top blocked countries

**Threat Intelligence**
- Known malicious IPs
- Bot traffic
- DDoS attempts

**Rate Limiting Events**
- Rate limit triggers
- Top rate-limited IPs

### 2.3 Monitoring Firewall Rules

**Rule 1: Block Non-GET-POST Methods**
- Monitor blocked PUT/DELETE/PATCH requests
- Verify legitimate requests tidak terblokir
- Review false positives

**Rule 2: Allow Only Vercel and Telegram**
- Monitor blocked requests dari non-whitelisted sources
- Verify Vercel dan Telegram requests allowed
- Review blocked legitimate sources (jika ada)

### 2.4 Alerting (Opsional)

Setup email/Slack notifications untuk:
- High number of blocked requests
- DDoS attacks detected
- Unusual traffic patterns
- Tunnel connection failures

---

## 3. Tunnel Status Monitoring

### 3.1 Check Tunnel Status via CLI

```bash
# List all tunnels
cloudflared tunnel list

# Get tunnel info
cloudflared tunnel info <TUNNEL-NAME>

# Check tunnel health
cloudflared tunnel healthcheck <TUNNEL-NAME>
```

### 3.2 Monitor Tunnel Logs

**Windows:**
```powershell
# View tunnel logs
Get-Content C:\Users\<USERNAME>\cloudflared\tunnel.log -Tail 50
```

**Linux/Mac:**
```bash
# View tunnel logs
tail -f /var/log/cloudflared/tunnel.log
```

**Log Levels:**
- `info` - General information
- `warn` - Warnings
- `error` - Errors
- `debug` - Detailed debugging (use sparingly)

### 3.3 Tunnel Health Indicators

**Healthy:**
- Connection status: Connected
- No errors in logs
- DNS records resolving correctly
- Endpoints accessible

**Unhealthy:**
- Connection status: Disconnected
- Errors in logs
- DNS not resolving
- Endpoints not accessible

---

## 4. Monitoring Checklist

### Daily Monitoring

- [ ] Check Cloudflare Analytics for unusual traffic
- [ ] Review Security Events for blocked requests
- [ ] Verify tunnel status (connected)
- [ ] Check for errors in tunnel logs

### Weekly Monitoring

- [ ] Review traffic trends
- [ ] Analyze firewall rule effectiveness
- [ ] Check performance metrics
- [ ] Review geographic distribution

### Monthly Monitoring

- [ ] Review bandwidth usage trends
- [ ] Analyze security events patterns
- [ ] Optimize firewall rules if needed
- [ ] Review and update documentation

---

## 5. Key Metrics to Track

### 5.1 Traffic Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Total Requests/Day | Normal baseline | 2x baseline |
| Requests/Minute (Peak) | < 10 | > 50 |
| Bandwidth/Day | Normal baseline | 2x baseline |

### 5.2 Security Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Blocked Requests/Day | < 100 | > 1000 |
| False Positives | 0 | > 10 |
| DDoS Attacks | 0 | Any detected |

### 5.3 Performance Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Average Response Time | < 200ms | > 1000ms |
| P95 Response Time | < 500ms | > 2000ms |
| Uptime | > 99.9% | < 99% |

### 5.4 Tunnel Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Connection Uptime | > 99.9% | < 99% |
| Reconnection Count/Day | < 5 | > 20 |
| Error Rate | < 1% | > 5% |

---

## 6. Troubleshooting dengan Monitoring

### Problem: High Response Time

**Investigation:**
1. Check Cloudflare Analytics → Performance
2. Review response time breakdown
3. Check tunnel logs for connection issues
4. Verify n8n container performance

**Solutions:**
- Optimize n8n workflows
- Check network connectivity
- Review Cloudflare cache settings
- Consider upgrading Cloudflare plan

### Problem: High Blocked Requests

**Investigation:**
1. Check Security Events → Filter by Blocked
2. Review top blocked IPs
3. Analyze blocked request patterns
4. Check for false positives

**Solutions:**
- Adjust firewall rules if too strict
- Whitelist legitimate sources
- Review and update ASN/IP whitelists

### Problem: Tunnel Disconnections

**Investigation:**
1. Check tunnel logs for errors
2. Review connection history
3. Check system resources (CPU, memory)
4. Verify network connectivity

**Solutions:**
- Restart tunnel service
- Check system resources
- Review tunnel configuration
- Consider systemd service for auto-restart

---

## 7. Reporting

### Weekly Report Template

```
Cloudflare Monitoring Report - Week [DATE]

Traffic:
- Total Requests: [NUMBER]
- Peak Requests/Min: [NUMBER]
- Bandwidth: [SIZE]

Security:
- Blocked Requests: [NUMBER]
- Top Blocked IPs: [LIST]
- Firewall Rule Effectiveness: [ANALYSIS]

Performance:
- Average Response Time: [TIME]
- Uptime: [PERCENTAGE]
- Tunnel Status: [STATUS]

Issues:
- [LIST OF ISSUES]

Actions Taken:
- [LIST OF ACTIONS]
```

---

## 8. Tools & Resources

### Cloudflare Dashboard
- [Analytics](https://dash.cloudflare.com/analytics)
- [Security Events](https://dash.cloudflare.com/security/events)
- [Logs](https://dash.cloudflare.com/logs)

### External Tools
- **nslookup** - DNS resolution testing
- **curl** - Endpoint testing
- **cloudflared CLI** - Tunnel management

### Documentation
- [Cloudflare Analytics](https://developers.cloudflare.com/analytics/)
- [Cloudflare Logs](https://developers.cloudflare.com/logs/)
- [Cloudflare Tunnel Monitoring](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/monitor-tunnels/)

---

## 9. Best Practices

1. **Regular Monitoring**
   - Check metrics daily
   - Review security events weekly
   - Analyze trends monthly

2. **Alerting**
   - Setup alerts for critical metrics
   - Monitor tunnel health
   - Track security events

3. **Documentation**
   - Document baseline metrics
   - Record incidents and resolutions
   - Update monitoring procedures

4. **Optimization**
   - Review and optimize firewall rules
   - Adjust rate limits as needed
   - Optimize tunnel configuration

---

**Last Updated:** [Date]  
**Version:** 1.0

