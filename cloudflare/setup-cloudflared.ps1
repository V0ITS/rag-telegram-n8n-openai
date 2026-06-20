# Cloudflare Tunnel Setup Script for Windows
# File: cloudflare/setup-cloudflared.ps1
# 
# INSTRUKSI:
# 1. Buka PowerShell sebagai Administrator
# 2. Jalankan: .\cloudflare\setup-cloudflared.ps1
# 3. Ikuti instruksi yang muncul

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cloudflare Tunnel Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "WARNING: Script tidak berjalan sebagai Administrator" -ForegroundColor Yellow
    Write-Host "Beberapa operasi mungkin memerlukan hak admin" -ForegroundColor Yellow
    Write-Host ""
}

# Step 1: Check if cloudflared is installed
Write-Host "[1/6] Checking cloudflared installation..." -ForegroundColor Yellow
$cloudflaredPath = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflaredPath) {
    Write-Host "cloudflared tidak ditemukan!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Silakan install cloudflared terlebih dahulu:" -ForegroundColor Yellow
    Write-Host "1. Download dari: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor White
    Write-Host "2. Extract dan tambahkan ke PATH" -ForegroundColor White
    Write-Host "3. Atau install via Chocolatey: choco install cloudflared" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Tekan Enter setelah cloudflared terinstall, atau 'q' untuk quit"
    if ($continue -eq 'q') { exit }
    
    # Re-check
    $cloudflaredPath = Get-Command cloudflared -ErrorAction SilentlyContinue
    if (-not $cloudflaredPath) {
        Write-Host "cloudflared masih tidak ditemukan. Exiting..." -ForegroundColor Red
        exit 1
    }
}

$version = (cloudflared --version) -split " " | Select-Object -Last 1
Write-Host "✓ cloudflared ditemukan: $version" -ForegroundColor Green
Write-Host ""

# Step 2: Login to Cloudflare
Write-Host "[2/6] Cloudflare Authentication..." -ForegroundColor Yellow
Write-Host "Silakan login ke Cloudflare di browser yang terbuka" -ForegroundColor White
Write-Host ""
$login = Read-Host "Sudah login? (y/n)"
if ($login -ne 'y') {
    Write-Host "Menjalankan: cloudflared tunnel login" -ForegroundColor White
    cloudflared tunnel login
    Write-Host ""
}

# Step 3: Create tunnel
Write-Host "[3/6] Creating Cloudflare Tunnel..." -ForegroundColor Yellow
$tunnelName = Read-Host "Masukkan nama tunnel (default: rag-n8n-tunnel)"
if ([string]::IsNullOrWhiteSpace($tunnelName)) {
    $tunnelName = "rag-n8n-tunnel"
}

Write-Host "Menjalankan: cloudflared tunnel create $tunnelName" -ForegroundColor White
$tunnelOutput = cloudflared tunnel create $tunnelName 2>&1
Write-Host $tunnelOutput

# Extract tunnel ID from output
$tunnelId = ($tunnelOutput | Select-String -Pattern 'Created tunnel (.+) with id') -replace '.*Created tunnel .+ with id (.+).*', '$1'
if ([string]::IsNullOrWhiteSpace($tunnelId)) {
    Write-Host "Gagal mendapatkan Tunnel ID. Silakan copy manual dari output di atas." -ForegroundColor Red
    $tunnelId = Read-Host "Masukkan Tunnel ID manual"
}

Write-Host "✓ Tunnel ID: $tunnelId" -ForegroundColor Green
Write-Host ""

# Step 4: Get domain
Write-Host "[4/6] Domain Configuration..." -ForegroundColor Yellow
$domain = Read-Host "Masukkan domain Anda (contoh: example.com)"
if ([string]::IsNullOrWhiteSpace($domain)) {
    Write-Host "Domain tidak boleh kosong!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Domain: $domain" -ForegroundColor Green
Write-Host ""

# Step 5: Configure DNS
Write-Host "[5/6] Configuring DNS Records..." -ForegroundColor Yellow
Write-Host "Menjalankan: cloudflared tunnel route dns $tunnelName n8n.$domain" -ForegroundColor White
cloudflared tunnel route dns $tunnelName n8n.$domain

Write-Host "Menjalankan: cloudflared tunnel route dns $tunnelName webhook.$domain" -ForegroundColor White
cloudflared tunnel route dns $tunnelName webhook.$domain

Write-Host "✓ DNS records dikonfigurasi" -ForegroundColor Green
Write-Host ""
Write-Host "PENTING: Pastikan proxy enabled (orange cloud) di Cloudflare Dashboard!" -ForegroundColor Yellow
Write-Host ""

# Step 6: Update tunnel config
Write-Host "[6/6] Updating tunnel-config.yaml..." -ForegroundColor Yellow
$configPath = Join-Path $PSScriptRoot "tunnel-config.yaml"
$username = $env:USERNAME

if (Test-Path $configPath) {
    $configContent = Get-Content $configPath -Raw
    $configContent = $configContent -replace '<TUNNEL-UUID>', $tunnelId
    $configContent = $configContent -replace '<DOMAIN>', $domain
    $configContent = $configContent -replace '<USERNAME>', $username
    
    Set-Content -Path $configPath -Value $configContent
    Write-Host "✓ tunnel-config.yaml telah diupdate" -ForegroundColor Green
} else {
    Write-Host "File tunnel-config.yaml tidak ditemukan di $configPath" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Selesai!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Langkah selanjutnya:" -ForegroundColor Yellow
Write-Host "1. Verifikasi DNS records di Cloudflare Dashboard" -ForegroundColor White
Write-Host "2. Pastikan proxy enabled (orange cloud)" -ForegroundColor White
Write-Host "3. Jalankan tunnel: cloudflared tunnel run --config .\cloudflare\tunnel-config.yaml $tunnelName" -ForegroundColor White
Write-Host "4. Test akses: https://n8n.$domain" -ForegroundColor White
Write-Host "5. Update environment variables di docker-compose.yml dan Vercel" -ForegroundColor White
Write-Host ""

