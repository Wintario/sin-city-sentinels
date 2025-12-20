-- Add updated_by field to news table
-- This tracks which user last edited the news item

ALTER TABLE news ADD COLUMN updated_by INTEGER REFERENCES users(id);

-- For existing news, set updated_by to author_id
UPDATE news SET updated_by = author_id WHERE updated_by IS NULL;
