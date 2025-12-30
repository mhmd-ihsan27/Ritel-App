-- Migration: Add paper_width, dash_line_char, double_line_char to print_settings table
-- Run this migration if you get error "gagal menyimpan pengaturan"

-- For SQLite
ALTER TABLE print_settings ADD COLUMN paper_width INTEGER DEFAULT 48;
ALTER TABLE print_settings ADD COLUMN dash_line_char TEXT DEFAULT '-';
ALTER TABLE print_settings ADD COLUMN double_line_char TEXT DEFAULT '=';

-- For PostgreSQL (use these if you're using PostgreSQL)
-- ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS paper_width INTEGER DEFAULT 48;
-- ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS dash_line_char VARCHAR(10) DEFAULT '-';
-- ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS double_line_char VARCHAR(10) DEFAULT '=';
