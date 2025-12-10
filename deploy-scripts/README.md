# Deployment Scripts

🐰 **Sin City Sentinels** - Production Deployment Guide

## Quick Start

### One-Command Deploy (Recommended)

On your VPS (Ubuntu 20.04+), run as root:

```bash
bash <(curl -s https://raw.githubusercontent.com/Wintario/sin-city-sentinels/main/deploy-scripts/rabbits-deploy-v2.sh)
```

Or if you cloned the repo:

```bash
bash deploy-scripts/rabbits-deploy-v2.sh
```

---

## What the Script Does

The `rabbits-deploy-v2.sh` script automates the entire deployment process:

### 1. **Cleanup** (Step 1)
- Stops all running Node/npm processes
- Removes old installation directory
- Clears PM2 daemon

### 2. **Dependencies** (Step 2)
- Installs Node.js 18.x (if needed)
- Installs PM2 globally (if needed)
- Verifies git is available

### 3. **GitHub Clone** (Step 3)
- Clones the latest code from `main` branch
- Verifies backend folder exists

### 4. **Frontend Build** (Step 4)
- Installs npm dependencies
- Builds React + Vite production bundle
- Verifies `dist/` folder created

### 5. **Backend Setup** (Step 5)
- Installs backend npm dependencies
- Creates `data/` directory for SQLite database
- Generates `.env` file with secure JWT secret
- Runs database migrations

### 6. **Fix Known Issues** (Step 6)
- Fixes `fdfort` typo in `server.js` (if present)
- Ensures `/api/health` endpoint exists

### 7. **Start Backend** (Step 7)
- Starts backend with PM2 process manager
- Saves PM2 daemon state

### 8. **Nginx Configuration** (Step 8)
- Installs Nginx (if needed)
- Creates reverse proxy configuration
- Routes `/` to React frontend
- Routes `/api` to Node.js backend (port 3000)
- Enables site and reloads Nginx

### 9. **Verification** (Step 9)
- Checks backend process status
- Tests `/api/health` endpoint
- Shows deployment summary

---

## System Requirements

✅ **OS:** Ubuntu 20.04 LTS or newer (tested on 24.04)
✅ **RAM:** 2GB minimum (4GB recommended)
✅ **Disk:** 5GB free space
✅ **Root access:** Required for system-wide setup
✅ **Internet:** Needed to clone GitHub repo

---

## Default Credentials

After deployment, log in at `/admin`:

```
Admin:  username: admin   password: admin
Author: username: author  password: author
```

⚠️ **IMPORTANT:** Change these passwords immediately after first login!

---

## Access Your Site

After successful deployment:

```
Frontend:  http://<YOUR_IP>
Health:    http://<YOUR_IP>/api/health
Admin:     http://<YOUR_IP>/admin
```

---

## Useful Commands

### View Backend Logs
```bash
pm2 logs rabbits-backend
pm2 logs rabbits-backend --lines 50  # Last 50 lines
```

### Control Backend Process
```bash
pm2 status                    # Show all processes
pm2 restart rabbits-backend   # Restart backend
pm2 stop rabbits-backend      # Stop backend
pm2 start rabbits-backend     # Start backend
pm2 save                       # Save PM2 state
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check Nginx Config
```bash
sudo nginx -t                  # Test config
sudo systemctl restart nginx   # Reload
```

### Database
```bash
sqlite3 /var/www/rabbits/backend/data/app.db
.tables                        # Show all tables
SELECT * FROM users;          # Query users
```

---

## Troubleshooting

### Backend won't start
```bash
pm2 logs rabbits-backend --nostream
```
Check for errors in logs. Common issues:
- Port 3000 already in use: `sudo lsof -i :3000`
- Database migration failed: Check `/var/www/rabbits/backend/data/app.db`
- Missing npm dependencies: `cd /var/www/rabbits/backend && npm install`

### /api/health returns 404
```bash
# Check if endpoint exists in server.js
grep -n "api/health" /var/www/rabbits/backend/server.js

# Restart backend if needed
pm2 restart rabbits-backend
```

### Frontend shows 502 Bad Gateway
```bash
# Check Nginx config
sudo nginx -t

# Check if backend is running
pm2 status

# Verify proxy settings
sudo cat /etc/nginx/sites-available/rabbits
```

### Can't access site
```bash
# Check if Nginx is running
sudo systemctl status nginx

# Check if port 80 is open
sudo ss -tlnp | grep ':80'

# Check your VPS firewall rules
```

---

## Directory Structure After Deploy

```
/var/www/rabbits/
├── dist/                      # React frontend (built)
├── backend/
│   ├── src/                   # Backend source code
│   ├── data/                  # SQLite database
│   │   └── app.db
│   ├── .env                   # Environment config (generated)
│   ├── server.js              # Express server
│   └── package.json
├── src/                       # React source code
├── package.json               # Frontend dependencies
└── ...

/etc/nginx/sites-available/
└── rabbits                    # Nginx config
```

---

## Advanced: Manual Setup

If you prefer to set up manually instead of running the script:

```bash
# 1. Cleanup
pm2 kill
sudo pkill -9 node npm
sudo rm -rf /var/www/rabbits

# 2. Clone
cd /var/www
git clone https://github.com/Wintario/sin-city-sentinels.git rabbits
cd rabbits

# 3. Frontend
npm install
npm run build

# 4. Backend
cd backend
npm install
mkdir -p data

# 5. Environment
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DB_PATH=./data/app.db
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d
CORS_ORIGIN=*
LOG_LEVEL=info
EOF

# 6. Database
npm run migrate

# 7. PM2
pm2 start server.js --name rabbits-backend
pm2 save

# 8. Nginx (see rabbits-deploy-v2.sh for full config)
```

---

## Support

For issues or questions:
1. Check logs: `pm2 logs rabbits-backend`
2. Review this README
3. Open an issue on [GitHub](https://github.com/Wintario/sin-city-sentinels/issues)

---

**Last Updated:** 2025-12-10
**Version:** 2.0
**Maintainer:** Wintario
