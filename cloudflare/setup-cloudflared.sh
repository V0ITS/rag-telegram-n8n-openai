#!/bin/bash
# Cloudflare Tunnel Setup Script for Linux/Mac
# File: cloudflare/setup-cloudflared.sh
# 
# INSTRUKSI:
# 1. chmod +x cloudflare/setup-cloudflared.sh
# 2. ./cloudflare/setup-cloudflared.sh
# 3. Ikuti instruksi yang muncul

set -e

echo "========================================"
echo "Cloudflare Tunnel Setup Script"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if cloudflared is installed
echo -e "${YELLOW}[1/6] Checking cloudflared installation...${NC}"
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}cloudflared tidak ditemukan!${NC}"
    echo ""
    echo "Silakan install cloudflared terlebih dahulu:"
    echo "  Ubuntu/Debian: sudo apt install cloudflared"
    echo "  macOS: brew install cloudflared"
    echo "  Atau download dari: https://github.com/cloudflare/cloudflared/releases"
    echo ""
    read -p "Tekan Enter setelah cloudflared terinstall, atau 'q' untuk quit: " continue
    if [ "$continue" = "q" ]; then
        exit 1
    fi
    
    # Re-check
    if ! command -v cloudflared &> /dev/null; then
        echo -e "${RED}cloudflared masih tidak ditemukan. Exiting...${NC}"
        exit 1
    fi
fi

VERSION=$(cloudflared --version | awk '{print $NF}')
echo -e "${GREEN}✓ cloudflared ditemukan: $VERSION${NC}"
echo ""

# Step 2: Login to Cloudflare
echo -e "${YELLOW}[2/6] Cloudflare Authentication...${NC}"
echo "Silakan login ke Cloudflare di browser yang terbuka"
echo ""
read -p "Sudah login? (y/n): " login
if [ "$login" != "y" ]; then
    echo "Menjalankan: cloudflared tunnel login"
    cloudflared tunnel login
    echo ""
fi

# Step 3: Create tunnel
echo -e "${YELLOW}[3/6] Creating Cloudflare Tunnel...${NC}"
read -p "Masukkan nama tunnel (default: rag-n8n-tunnel): " tunnel_name
if [ -z "$tunnel_name" ]; then
    tunnel_name="rag-n8n-tunnel"
fi

echo "Menjalankan: cloudflared tunnel create $tunnel_name"
TUNNEL_OUTPUT=$(cloudflared tunnel create "$tunnel_name" 2>&1)
echo "$TUNNEL_OUTPUT"

# Extract tunnel ID from output
TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -oP 'Created tunnel .+ with id \K[^\s]+' || echo "")
if [ -z "$TUNNEL_ID" ]; then
    echo -e "${RED}Gagal mendapatkan Tunnel ID. Silakan copy manual dari output di atas.${NC}"
    read -p "Masukkan Tunnel ID manual: " TUNNEL_ID
fi

echo -e "${GREEN}✓ Tunnel ID: $TUNNEL_ID${NC}"
echo ""

# Step 4: Get domain
echo -e "${YELLOW}[4/6] Domain Configuration...${NC}"
read -p "Masukkan domain Anda (contoh: example.com): " domain
if [ -z "$domain" ]; then
    echo -e "${RED}Domain tidak boleh kosong!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Domain: $domain${NC}"
echo ""

# Step 5: Configure DNS
echo -e "${YELLOW}[5/6] Configuring DNS Records...${NC}"
echo "Menjalankan: cloudflared tunnel route dns $tunnel_name n8n.$domain"
cloudflared tunnel route dns "$tunnel_name" "n8n.$domain"

echo "Menjalankan: cloudflared tunnel route dns $tunnel_name webhook.$domain"
cloudflared tunnel route dns "$tunnel_name" "webhook.$domain"

echo -e "${GREEN}✓ DNS records dikonfigurasi${NC}"
echo ""
echo -e "${YELLOW}PENTING: Pastikan proxy enabled (orange cloud) di Cloudflare Dashboard!${NC}"
echo ""

# Step 6: Update tunnel config
echo -e "${YELLOW}[6/6] Updating tunnel-config.yaml...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_PATH="$SCRIPT_DIR/tunnel-config.yaml"
USERNAME=$(whoami)

if [ -f "$CONFIG_PATH" ]; then
    # Use sed to replace placeholders
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/<TUNNEL-UUID>/$TUNNEL_ID/g" "$CONFIG_PATH"
        sed -i '' "s/<DOMAIN>/$domain/g" "$CONFIG_PATH"
        sed -i '' "s/<USERNAME>/$USERNAME/g" "$CONFIG_PATH"
    else
        # Linux
        sed -i "s/<TUNNEL-UUID>/$TUNNEL_ID/g" "$CONFIG_PATH"
        sed -i "s/<DOMAIN>/$domain/g" "$CONFIG_PATH"
        sed -i "s/<USERNAME>/$USERNAME/g" "$CONFIG_PATH"
    fi
    echo -e "${GREEN}✓ tunnel-config.yaml telah diupdate${NC}"
else
    echo -e "${RED}File tunnel-config.yaml tidak ditemukan di $CONFIG_PATH${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}Setup Selesai!${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}Langkah selanjutnya:${NC}"
echo "1. Verifikasi DNS records di Cloudflare Dashboard"
echo "2. Pastikan proxy enabled (orange cloud)"
echo "3. Jalankan tunnel: cloudflared tunnel run --config ./cloudflare/tunnel-config.yaml $tunnel_name"
echo "4. Test akses: https://n8n.$domain"
echo "5. Update environment variables di docker-compose.yml dan Vercel"
echo ""

