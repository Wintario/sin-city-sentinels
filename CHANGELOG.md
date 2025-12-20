# Changelog

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

## Migration Guide

From v1.0.0 to v1.1.0:

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

# Done! Old news maintains default ordering by published_at
```

---

## Known Limitations

- Display order is specific to published news (draft order not customizable)
- Reordering requires admin role
- Display order resets to NULL for unpublished news

## Future Improvements

- [ ] Bulk actions (publish, delete multiple)
- [ ] Advanced search and filtering
- [ ] News categories/tags
- [ ] Comment system
- [ ] Analytics dashboard
