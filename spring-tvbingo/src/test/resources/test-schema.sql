-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS tvbingo_schema;

-- Drop table if it exists (for clean state)
DROP TABLE IF EXISTS tvbingo_schema.shows CASCADE;

-- Create shows table
CREATE TABLE tvbingo_schema.shows (
    id BIGSERIAL PRIMARY KEY,
    show_title VARCHAR(255) NOT NULL,
    game_title VARCHAR(255),
    center_square VARCHAR(255),
    phrases TEXT[]
);

-- Create unique constraint on show_title
ALTER TABLE tvbingo_schema.shows ADD CONSTRAINT uk_shows_show_title UNIQUE (show_title);

-- Create index on show_title
CREATE INDEX IF NOT EXISTS idx_shows_show_title ON tvbingo_schema.shows (show_title);