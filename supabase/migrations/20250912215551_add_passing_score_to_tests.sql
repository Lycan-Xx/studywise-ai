-- Add passing_score column to tests table
ALTER TABLE tests ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 70;