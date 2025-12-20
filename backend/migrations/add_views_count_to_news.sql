-- Add views_count column to news table
ALTER TABLE news ADD COLUMN views_count INTEGER DEFAULT 0;

-- Create index for faster queries
CREATE INDEX idx_news_views_count ON news(views_count DESC);
