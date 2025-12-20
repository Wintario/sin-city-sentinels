# Changelog

## [v1.1.1] - 2025-12-20

### 🔒 Security
- **HttpOnly Cookies** - Session tokens now stored in secure HttpOnly cookies (not accessible via JavaScript)
- **CSRF Protection** - Cookies use SameSite=strict to prevent cross-site request forgery
- **Automatic Session Restoration** - Users stay logged in when navigating between pages/refreshing
- **7-Day Session Expiry** - Sessions automatically expire after 7 days for security
- **Secure API Calls** - All API requests automatically include cookies via `credentials: 'include'`

### 📈 Backend Changes
- Added cookie-setting in `POST /api/auth/login` endpoint
- Added `POST /api/auth/logout` endpoint to clear cookies
- Updated `POST /api/auth/verify` endpoint for session restoration
- Improved logging for authentication events
- Added proper error handling for expired tokens

### 🎨 Frontend Changes
- Added `authAPI.verify()` call in App.tsx on mount
- Improved logout flow with async handling
- Added loading state during logout
- Better session restoration on page reload
- Cookies now work across admin <-> homepage navigation

### 📄 Documentation
- Added comprehensive `SECURITY.md` with cookie security details
- Documented CORS, rate limiting, and best practices
- Added incident response guide

### ❌ Breaking Changes
- None - fully backward compatible

---

## [v1.1.0] - 2025-12-20

### ✨ Features
- **Drag-and-drop news reordering** - Admin can now drag news items to change their order on the main page
- **Display order tracking** - Added `display_order` field to news table for custom sorting
- **Edit tracking** - Added `updated_by` field to track who last edited each news item
- **Immutable publication date** - `published_at` no longer changes when editing news

### 🔧 Backend Changes
- Added `display_order` column to news table (nullable integer with index)
- Added `reorderNews()` function in news model for bulk reordering
- Added `POST /api/news/admin/reorder` endpoint for drag-drop reordering
- Updated `getPublishedNews()` to sort by `display_order` first, then `published_at`
- Updated `getAllNewsAdmin()` to sort by `display_order` for admin panel
- Improved error logging in reorder endpoint

### 🎨 Frontend Changes
- Added drag-and-drop UI in NewsAdmin component
- Drag handle icon (☰ menu) appears on published news items
- Visual feedback for dragging (opacity, cursor changes)
- Integrated `newsAPI.reorder()` for proper authentication
- Removed tip banner from admin panel

### 🔒 Security & Stability
- Database files now properly ignored via `.gitignore`
- Fixed authentication token handling in API calls
- Removed `writeLimiter` from reorder endpoint to prevent rate-limit proxy errors
- Preserved all previously working features

### 📁 Database Schema
```sql
-- Added column:
ALTER TABLE news ADD COLUMN display_order INTEGER DEFAULT NULL;
CREATE INDEX idx_news_display_order ON news(display_order);

-- Migration file: backend/migrations/add_display_order_to_news.sql
```

### 🚀 Deployment
1. Pull latest code from GitHub
2. Run `npm run build` (frontend)
3. Run `pm2 restart rabbits-backend`
4. Database migration handled automatically on first use

---

## [v1.0.0] - 2025-12-15

### ✨ Initial Release
- News management system with publish/draft functionality
- Admin panel with news CRUD operations
- Member roster with avatars
- User authentication (admin/author roles)
- News search and filtering
- SQLite database backend
- React + Vite frontend

### 🔧 Key Features
- Responsive design for mobile and desktop
- SEO-friendly URLs with slugs
- Social media preview (OG tags)
- Image support for news items
- Member profile links

---

## Migration Guides

### From v1.0.0 to v1.1.1

```bash
# 1. Pull latest code
git pull origin main

# 2. Add display_order column (auto-migrates on first run)
# OR manually:
sqlite3 backend/data/app.db "ALTER TABLE news ADD COLUMN display_order INTEGER DEFAULT NULL;"
sqlite3 backend/data/app.db "CREATE INDEX idx_news_display_order ON news(display_order);"

# 3. Rebuild and restart
npm run build
pm2 restart rabbits-backend

# 4. Test session restoration
# - Login to admin
# - Navigate to homepage
# - You should stay logged in (no re-login needed)
```

---

## Known Limitations

- Display order is specific to published news (draft order not customizable)
- Reordering requires admin role
- Display order resets to NULL for unpublished news
- Sessions expire after 7 days (need to re-login)
- Cookies only work on the same domain

## Future Improvements

- [ ] Implement refresh token rotation
- [ ] Add 2FA (two-factor authentication)
- [ ] Bulk actions (publish, delete multiple)
- [ ] Advanced search and filtering
- [ ] News categories/tags
- [ ] Comment system
- [ ] Analytics dashboard
- [ ] Remember me option (14-day sessions)
