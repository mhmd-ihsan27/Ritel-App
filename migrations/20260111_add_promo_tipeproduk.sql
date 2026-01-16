-- Migration: Add tipe_produk and min_gramasi to promo table
-- Date: 2026-01-11
-- Purpose: Support new product type selection for discount promos

-- 1. Add new columns
ALTER TABLE promo ADD COLUMN tipe_produk VARCHAR(20);
ALTER TABLE promo ADD COLUMN min_gramasi INT DEFAULT 0;

-- 2. Migrate existing diskon_produk promos
-- Detect tipe_produk from first product in promo_produk
UPDATE promo p
SET tipe_produk = (
    SELECT CASE 
        WHEN prod.satuan = 'kg' THEN 'curah' 
        ELSE 'satuan' 
    END
    FROM promo_produk pp
    INNER JOIN produk prod ON pp.produk_id = prod.id
    WHERE pp.promo_id = p.id
    LIMIT 1
)
WHERE tipe_promo = 'diskon_produk'
  AND EXISTS (SELECT 1 FROM promo_produk WHERE promo_id = p.id);

-- Promos without specific products: default to 'satuan'
UPDATE promo
SET tipe_produk = 'satuan'
WHERE tipe_promo = 'diskon_produk'
  AND tipe_produk IS NULL;

-- 3. Set default min_gramasi/min_quantity for migrated promos
UPDATE promo
SET min_gramasi = 100
WHERE tipe_promo = 'diskon_produk'
  AND tipe_produk = 'curah'
  AND min_gramasi = 0;

UPDATE promo
SET min_quantity = 1
WHERE tipe_promo = 'diskon_produk'
  AND tipe_produk = 'satuan'
  AND min_quantity = 0;

-- 4. Drop old column (make sure to backup first!)
ALTER TABLE promo DROP COLUMN tipe_produk_berlaku;
