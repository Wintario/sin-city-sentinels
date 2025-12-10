# Nginx Configuration

Nginx configuration files for Sin City Sentinels (Свирепые Кролики).

## Files

### `rabbits.conf`

Main nginx server configuration with:
- Frontend React app serving from `/var/www/rabbits/dist`
- Avatar images from `/var/www/rabbits/public/avatars`
- News images from `/var/www/rabbits/public/news-images`
- API proxy to Node.js backend on `127.0.0.1:3000`

## Installation on VPS

### 1. Copy config to nginx sites-available

```bash
sudo cp deploy-scripts/nginx/rabbits.conf /etc/nginx/sites-available/rabbits
```

### 2. Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/rabbits /etc/nginx/sites-enabled/rabbits
```

### 3. Fix directory permissions

```bash
# Set owner to www-data user
sudo chown -R www-data:www-data /var/www/rabbits/public/avatars
sudo chown -R www-data:www-data /var/www/rabbits/public/news-images

# Set read permissions
sudo chmod 755 /var/www/rabbits/public/avatars
sudo chmod 755 /var/www/rabbits/public/news-images
```

### 4. Test nginx config

```bash
sudo nginx -t
```

### 5. Restart nginx

```bash
sudo systemctl restart nginx
```

## Verification

Test avatar loading:

```bash
curl -I http://127.0.0.1/avatars/El.gif
```

Expected response: `HTTP/1.1 200 OK`

## Issues Fixed

- ✅ Avatars returning 404 due to incorrect permissions
- ✅ Nginx working as `www-data` user couldn't read `/var/www/rabbits/public/avatars`
- ✅ Added proper caching headers for static assets
- ✅ Added news-images directory support

## Important Notes

1. Avatar alias path must be **lowercase**: `/var/www/rabbits/public/avatars` (not `Avatars`)
2. Ensure directories exist before nginx restart
3. Permissions must be at least `755` for nginx to read files
4. API backend must be running on port `3000` for proxy to work
