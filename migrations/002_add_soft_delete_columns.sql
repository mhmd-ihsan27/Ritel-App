-- Migration: Add soft delete support to main tables
-- Created: 2025-12-19
-- Purpose: Change from hard delete to soft delete for data safety

-- ==========================================
-- 1. Add deleted_at column to pelanggan
-- ==========================================
ALTER TABLE pelanggan ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
CREATE INDEX IF NOT EXISTS idx_pelanggan_deleted_at ON pelanggan(deleted_at);

-- ==========================================
-- 2. Add deleted_at column to produk
-- ==========================================
ALTER TABLE produk ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
CREATE INDEX IF NOT EXISTS idx_produk_deleted_at ON produk(deleted_at);

-- ==========================================
-- 3. Add deleted_at column to promo
-- ==========================================
ALTER TABLE promo ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
CREATE INDEX IF NOT EXISTS idx_promo_deleted_at ON promo(deleted_at);

-- ==========================================
-- 4. Add deleted_at column to kategori
-- ==========================================
ALTER TABLE kategori ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
CREATE INDEX IF NOT EXISTS idx_kategori_deleted_at ON kategori(deleted_at);

-- ==========================================
-- Note: users and batch already have soft delete
-- ==========================================
-- users.deleted_at - already exists
-- batch uses status='expired' approach - already implemented

-- ==========================================
-- Indexes for better query performance
-- ==========================================
-- These indexes speed up queries with WHERE deleted_at IS NULL
