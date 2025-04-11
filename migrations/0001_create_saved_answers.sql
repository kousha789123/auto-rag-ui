-- Migration number: 0001 	 2025-04-10_22:55:00.000
-- Please ensure this migration name matches the filename: 0001_create_saved_answers.sql

CREATE TABLE saved_answers (
  id TEXT PRIMARY KEY, -- Using TEXT for UUIDs as recommended by D1 docs
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')) -- Store as Unix timestamp
); 