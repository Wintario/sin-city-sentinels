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

### 2. **Dependencies** (Step 2-3)
- Creates `/var/www` directory
- Installs Node.js 20 LTS (if needed)
- Installs PM2 globally
- Verifies git is available

### 3. **GitHub Clone** (Step 4)
- Clones the latest code from `main` branch
- Verifies backend folder exists

### 4. **Frontend Build** (Step 5)
- Installs npm dependencies
- Builds React + Vite production bundle
- Verifies `dist/` folder created

### 5. **Backend Setup** (Step 6)
- Installs backend npm dependencies
- Creates `data/` directory for SQLite database
- Generates `.env` file with secure JWT secret
- Runs database migrations

### 6. **Fix Known Issues** (Step 7)
- Fixes `fdfort` typo in `server.js` (if present)
- Removes stray syntax errors (broken 'n' character)
- Ensures `/api/health` endpoint exists BEFORE the 404 handler
- Prevents endpoint conflicts

### 7. **Avatars Directory** (Step 8)
- Creates `/var/www/rabbits/public/avatars` for member avatars
- Sets correct file permissions (755)

### 8. **Start Backend** (Step 9)
- Starts backend with PM2 process manager
- Saves PM2 daemon state

### 9. **Nginx Configuration** (Step 10)
- Installs Nginx (if needed)
- Creates reverse proxy configuration with **avatars support**
- Routes `/` to React frontend
- Routes `/api` to Node.js backend (port 3000)
- Routes `/avatars` to static avatar files
- Enables site and reloads Nginx

### 10. **Verification** (Step 11)
- Checks backend process status
- Tests `/api/health` endpoint
- Tests frontend serving
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
Members:   http://<YOUR_IP>/members
Avatars:   http://<YOUR_IP>/avatars/filename.gif
```

---

## Avatars Setup

Member avatars are served from: `/var/www/rabbits/public/avatars/`

**To upload avatars:**

```bash
# Via SCP/SFTP:
scp your_avatar.gif username@217.114.14.184:/var/www/rabbits/public/avatars/

# Via direct file upload:
# 1. SSH into the server
# 2. Place files in /var/www/rabbits/public/avatars/
# 3. Ensure filename matches what's in the database
```

**Naming convention:**
```
/avatars/203123435_!Леголас!.gif
/avatars/200459424_muzikant2.gif
/avatars/El.gif
```

Avatars are cached for 30 days. To update immediately in browser:
- Use **Ctrl+F5** (hard refresh) or
- Clear browser cache (**Ctrl+Shift+Del**)

---

## Useful Commands

### View Backend Logs
```bash
pm2 logs rabbits-backend
pm2 logs rabbits-backend --lines 50  # Last 50 lines
pm2 logs rabbits-backend --nostream   # Don't follow new lines
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
sudo systemctl reload nginx    # Reload (no downtime)
sudo systemctl restart nginx   # Restart (brief downtime)
```

### Database
```bash
sqlite3 /var/www/rabbits/backend/data/app.db
.tables                        # Show all tables
SELECT * FROM users;          # Query users
SELECT * FROM members;        # Query members
```

### Rebuild Frontend (after code changes)
```bash
cd /var/www/rabbits
npm run build
sudo systemctl reload nginx
```

---

## Troubleshooting

### Backend won't start
```bash
pm2 logs rabbits-backend --nostream
```
Common issues:
- Port 3000 already in use: `sudo lsof -i :3000`
- Database migration failed: Check `/var/www/rabbits/backend/data/app.db`
- Missing npm dependencies: `cd /var/www/rabbits/backend && npm install`
- Syntax errors in server.js: Check for stray characters like `n//`

### /api/health returns 404
```bash
# Check if endpoint exists in server.js
grep -n "app.get.*api/health" /var/www/rabbits/backend/server.js

# Make sure it's BEFORE the 404 handler: app.use('/api/*'
grep -n "app.use.*api" /var/www/rabbits/backend/server.js

# If missing, add it manually then restart
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

### Avatars not displaying
```bash
# Check avatars directory
ls -la /var/www/rabbits/public/avatars/

# Check file permissions
sudo chmod 755 /var/www/rabbits/public/avatars/
sudo chmod 644 /var/www/rabbits/public/avatars/*

# Verify filename matches database
# Frontend expects: /avatars/FILENAME.gif
# Database should have: /avatars/FILENAME.gif path

# Clear browser cache (Ctrl+F5 or Ctrl+Shift+Del)
# Don't just Ctrl+R - that uses cached files
```

### Can't access site (404 on root)
```bash
# Check if Nginx is running
sudo systemctl status nginx

# Check if port 80 is open
sudo ss -tlnp | grep ':80'

# Check your VPS firewall rules
# Make sure port 80 (HTTP) is allowed
```

### Members page shows but no avatars
```bash
# 1. Verify avatars folder exists and has files
ls -la /var/www/rabbits/public/avatars/ | head -5

# 2. Check file permissions
sudo chmod 755 /var/www/rabbits/public/avatars/
sudo chmod 644 /var/www/rabbits/public/avatars/*

# 3. Check Nginx is serving them
curl http://YOUR_IP/avatars/filename.gif

# 4. Check database has correct paths
sqlite3 /var/www/rabbits/backend/data/app.db
SELECT filename FROM members LIMIT 5;

# 5. Clear browser cache - avatar filenames are case-sensitive
# On Linux: /avatars/file.gif ≠ /avatars/File.gif
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
├── public/
│   ├── avatars/               # Member avatars (static)
│   ├── favicon.ico
│   └── ...
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
sudo mkdir -p /var/www
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

## Version History

### v2.3 (2025-12-10)
- ✅ Fixed `/api/health` endpoint placement (before 404 handler)
- ✅ Added avatars Nginx configuration with alias directive
- ✅ Fixed server.js syntax errors (stray 'n' character)
- ✅ Created `/var/www/rabbits/public/avatars` directory
- ✅ Improved documentation for avatar troubleshooting
- ✅ Added 11 verification steps

### v2.2 (2025-12-10)
- Fixed Nginx root path for React SPA
- Corrected API health endpoint placement

### v2.1 (2025-12-10)
- Created `/var/www` directory before cloning
- Upgraded to Node.js 20 LTS
- Improved version detection

### v2.0 (2025-12-10)
- Initial production deployment script
- Full automation of deployment process

---

## Support

For issues or questions:
1. Check logs: `pm2 logs rabbits-backend`
2. Review this README (Troubleshooting section)
3. Open an issue on [GitHub](https://github.com/Wintario/sin-city-sentinels/issues)
4. Check Nginx config: `sudo cat /etc/nginx/sites-available/rabbits`

---

**Last Updated:** 2025-12-10
**Version:** 2.3
**Maintainer:** Wintario
**Tested On:** Ubuntu 24.04, Node.js 20.19.6, Nginx 1.24.0
