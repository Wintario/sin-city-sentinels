-- Migration: Add display_order field to news table for drag-and-drop reordering
-- Date: 2025-12-20

ALTER TABLE news ADD COLUMN display_order INTEGER DEFAULT NULL;

-- Create index for display_order
CREATE INDEX idx_news_display_order ON news(display_order);

-- Optional: Set initial display_order based on published_at (newest first)
-- UPDATE news SET display_order = (
--   SELECT COUNT(*) FROM news n2 
--   WHERE n2.published_at <= news.published_at AND n2.is_deleted = 0
-- ) WHERE is_deleted = 0;
