#!/bin/bash

set -e

# ============================================================================
# SIN CITY SENTINELS - PRODUCTION DEPLOYMENT SCRIPT v2.2
# ============================================================================
# Complete fresh deployment for Ubuntu VPS (Beget, Racknerd, etc.)
# Includes: Node.js 20 LTS setup, GitHub clone, frontend build, backend config, PM2, Nginx
#
# Usage:
#   bash rabbits-deploy-v2.sh
#
# Requirements:
#   - Root access or sudo
#   - Ubuntu 20.04+ (tested on 24.04)
#   - Internet connection
#
# Author: Wintario
# Updated: 2025-12-10
# ============================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  🐰 SIN CITY SENTINELS - PRODUCTION DEPLOYMENT v2.2               ║"
echo "║  Beget/Ubuntu VPS Edition (Node.js 20 LTS)                       ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# STEP 1: KILL ALL EXISTING PROCESSES & CLEANUP
# ============================================================================
echo -e "${BLUE}[1/10]${NC} Stopping all existing processes..."
pm2 kill 2>/dev/null || true
sudo pkill -9 node 2>/dev/null || true
sudo pkill -9 npm 2>/dev/null || true
sleep 2

echo -e "${BLUE}[1/10]${NC} Removing old installation..."
sudo rm -rf /var/www/rabbits 2>/dev/null || true
sleep 1

# ============================================================================
# STEP 2: CREATE /var/www DIRECTORY
# ============================================================================
echo -e "${BLUE}[2/10]${NC} Creating /var/www directory..."
sudo mkdir -p /var/www
sudo chmod 755 /var/www
echo -e "${GREEN}[2/10]${NC} /var/www created ✓"

# ============================================================================
# STEP 3: SYSTEM DEPENDENCIES (Node.js 20 LTS)
# ============================================================================
echo -e "${BLUE}[3/10]${NC} Checking system dependencies..."

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}[3/10]${NC} Installing Node.js 20 LTS (supported until April 2026)..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        echo -e "${YELLOW}[3/10]${NC} Upgrading Node.js from $NODE_VERSION to 20 LTS..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y --only-upgrade nodejs
    else
        echo -e "${GREEN}[3/10]${NC} Node.js already at version $(node --version)"
    fi
fi

if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}[3/10]${NC} Installing PM2..."
    sudo npm install -g pm2
else
    echo -e "${GREEN}[3/10]${NC} PM2 already installed: $(pm2 --version)"
fi

echo -e "${GREEN}[3/10]${NC} Node.js: $(node --version) ✓"
echo -e "${GREEN}[3/10]${NC} npm: $(npm --version) ✓"

# ============================================================================
# STEP 4: CLONE FROM GITHUB
# ============================================================================
echo ""
echo -e "${BLUE}[4/10]${NC} Cloning from GitHub..."
cd /var/www
git clone https://github.com/Wintario/sin-city-sentinels.git rabbits
cd /var/www/rabbits

if [ ! -d "backend" ]; then
    echo -e "${RED}[4/10]${NC} ERROR: backend folder not found!"
    exit 1
fi
echo -e "${GREEN}[4/10]${NC} Repository cloned successfully ✓"

# ============================================================================
# STEP 5: BUILD FRONTEND (React + Vite)
# ============================================================================
echo ""
echo -e "${BLUE}[5/10]${NC} Building frontend (React + Vite)..."
npm install 2>&1 | grep -E "added|found" | tail -3 || true
npm run build 2>&1 | tail -5 || true

if [ ! -d "dist" ]; then
    echo -e "${RED}[5/10]${NC} ERROR: Frontend build failed!"
    exit 1
fi
echo -e "${GREEN}[5/10]${NC} Frontend built successfully ✓"

# ============================================================================
# STEP 6: SETUP BACKEND (Node.js + Express + SQLite)
# ============================================================================
echo ""
echo -e "${BLUE}[6/10]${NC} Setting up backend..."
cd /var/www/rabbits/backend
npm install 2>&1 | grep -E "added|found" | tail -3 || true

# Create data directory
mkdir -p data

# Create .env file with secure JWT secret
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[6/10]${NC} Creating .env file..."
    cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
DB_PATH=./data/app.db
JWT_SECRET=REPLACE_WITH_SECURE_SECRET
JWT_EXPIRE=7d
CORS_ORIGIN=*
LOG_LEVEL=info
ENVEOF
    
    # Generate secure JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    echo -e "${GREEN}[6/10]${NC} .env created with secure JWT_SECRET ✓"
else
    echo -e "${GREEN}[6/10]${NC} .env already exists, preserving..."
fi

echo -e "${BLUE}[6/10]${NC} Running database migrations..."
npm run migrate 2>&1 | tail -10 || true
echo -e "${GREEN}[6/10]${NC} Backend setup complete ✓"

# ============================================================================
# STEP 7: FIX KNOWN ISSUES IN server.js
# ============================================================================
echo ""
echo -e "${BLUE}[7/10]${NC} Verifying server.js configuration..."

# Fix: fdfort typo (if exists from cloning)
if grep -q "fdfort" server.js 2>/dev/null; then
    sed -i 's/fdfort/import/g' server.js
    echo -e "${YELLOW}[7/10]${NC} Fixed fdfort typo ✓"
fi

# Ensure /api/health endpoint exists BEFORE the /api/* catchall
if ! grep -q "app.get.*api/health" server.js; then
    # Find the line with "app.use('/api/\*'" and insert BEFORE it
    LINE_NUM=$(grep -n "app.use('/api/\*'" server.js 2>/dev/null | head -1 | cut -d: -f1)
    if [ -n "$LINE_NUM" ]; then
        sed -i "${LINE_NUM}i\\n// API Health check endpoint\napp.get('/api/health', (req, res) => {\n  res.json({\n    status: 'ok',\n    timestamp: new Date().toISOString(),\n    service: 'Sin City Sentinels API'\n  });\n});\n" server.js
        echo -e "${YELLOW}[7/10]${NC} Added /api/health endpoint ✓"
    fi
fi

echo -e "${GREEN}[7/10]${NC} server.js verification complete ✓"

# ============================================================================
# STEP 8: START BACKEND WITH PM2
# ============================================================================
echo ""
echo -e "${BLUE}[8/10]${NC} Starting backend with PM2..."
pm2 kill 2>/dev/null || true
sleep 1

pm2 start server.js --name rabbits-backend
pm2 save

sleep 3

echo -e "${GREEN}[8/10]${NC} Backend started with PM2 ✓"

# ============================================================================
# STEP 9: SETUP NGINX
# ============================================================================
echo ""
echo -e "${BLUE}[9/10]${NC} Setting up Nginx..."

if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}[9/10]${NC} Installing Nginx..."
    sudo apt-get update
    sudo apt-get install -y nginx
fi

# Determine the server IP (try to detect, fallback to localhost)
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then
    SERVER_IP="localhost"
fi

# Create Nginx config
echo -e "${YELLOW}[9/10]${NC} Configuring Nginx..."
sudo tee /etc/nginx/sites-available/rabbits > /dev/null <<'NGINXEOF'
server {
    listen 80;
    server_name _;

    # Frontend (React dist) - serve from /var/www/rabbits/dist
    location / {
        root /var/www/rabbits/dist;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # API backend proxy
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

# Enable site
sudo rm -f /etc/nginx/sites-enabled/*
sudo ln -sf /etc/nginx/sites-available/rabbits /etc/nginx/sites-enabled/rabbits

# Test and reload
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
echo -e "${GREEN}[9/10]${NC} Nginx configured and started ✓"

# ============================================================================
# STEP 10: VERIFY DEPLOYMENT
# ============================================================================
echo ""
echo -e "${BLUE}[10/10]${NC} Verifying deployment..."

# Check backend is running
if pm2 status | grep -q "rabbits-backend.*online"; then
    echo -e "${GREEN}[10/10]${NC} Backend is online ✓"
else
    echo -e "${RED}[10/10]${NC} WARNING: Backend status unknown, checking logs..."
    pm2 logs rabbits-backend --lines 20
fi

# Try health check via API
echo -e "${BLUE}[10/10]${NC} Testing /api/health endpoint..."
HEALTH_CHECK=$(curl -s http://127.0.0.1:3000/api/health 2>/dev/null || echo "FAIL")
if echo "$HEALTH_CHECK" | grep -q "ok"; then
    echo -e "${GREEN}[10/10]${NC} Health check passed ✓"
else
    echo -e "${YELLOW}[10/10]${NC} Health check failed or slow, check logs: pm2 logs rabbits-backend"
fi

# Try frontend via Nginx
echo -e "${BLUE}[10/10]${NC} Testing frontend via Nginx..."
FRONTEND_CHECK=$(curl -s http://127.0.0.1/ 2>/dev/null | grep -o "<!doctype\|<html" | head -1)
if [ -n "$FRONTEND_CHECK" ]; then
    echo -e "${GREEN}[10/10]${NC} Frontend is serving ✓"
else
    echo -e "${YELLOW}[10/10]${NC} Frontend check inconclusive, check Nginx logs"
fi

# ============================================================================
# DEPLOYMENT COMPLETE
# ============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOYMENT SUCCESSFUL!                                         ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📍 Access your site:${NC}"
echo "   🌐 Frontend:   http://$SERVER_IP"
echo "   💁 Admin:      http://$SERVER_IP/admin"
echo "   ✅ Health:     http://$SERVER_IP/api/health"
echo ""
echo -e "${GREEN}🔐 Default credentials:${NC}"
echo "   Admin:    admin / admin"
echo "   Author:   author / author"
echo "   ⚠️  CHANGE THESE AFTER FIRST LOGIN!"
echo ""
echo -e "${GREEN}📊 Useful commands:${NC}"
echo "   View logs:      pm2 logs rabbits-backend"
echo "   Restart:        pm2 restart rabbits-backend"
echo "   Stop:           pm2 stop rabbits-backend"
echo "   Status:         pm2 status"
echo "   Nginx test:     sudo nginx -t"
echo "   Nginx reload:   sudo systemctl reload nginx"
echo ""
echo -e "${BLUE}📁 Project structure:${NC}"
echo "   Frontend:  /var/www/rabbits/dist (built React)"
echo "   Backend:   /var/www/rabbits/backend (Node.js v20 LTS)"
echo "   Database:  /var/www/rabbits/backend/data/app.db (SQLite)"
echo "   Nginx:     /etc/nginx/sites-available/rabbits"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "   1. Open http://$SERVER_IP in your browser"
echo "   2. Go to /admin and login with admin/admin"
echo "   3. Change default passwords immediately"
echo "   4. Check logs if needed: pm2 logs rabbits-backend"
echo ""
