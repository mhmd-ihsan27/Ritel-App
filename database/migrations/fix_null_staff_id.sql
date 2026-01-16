-- Migration: Fix NULL staff_id in existing transactions
-- This script will update existing transactions with NULL staff_id
-- by matching the kasir field with user names

-- First, let's see what we have
SELECT 
    COUNT(*) as total_transactions,
    SUM(CASE WHEN staff_id IS NULL THEN 1 ELSE 0 END) as null_staff_id,
    SUM(CASE WHEN staff_id IS NOT NULL THEN 1 ELSE 0 END) as has_staff_id
FROM transaksi;

-- Show sample of NULL staff_id transactions
SELECT id, nomor_transaksi, tanggal, kasir, staff_id, staff_nama
FROM transaksi 
WHERE staff_id IS NULL 
LIMIT 10;

-- Show users (potential staff)
SELECT id, nama_lengkap, username, role 
FROM users 
WHERE role IN ('admin', 'staff');

-- UPDATE QUERY: Match kasir name with user nama_lengkap
-- IMPORTANT: Review this query before running!
UPDATE transaksi 
SET 
    staff_id = (
        SELECT id 
        FROM users 
        WHERE LOWER(nama_lengkap) = LOWER(transaksi.kasir)
          AND role IN ('admin', 'staff')
        LIMIT 1
    ),
    staff_nama = (
        SELECT nama_lengkap 
        FROM users 
        WHERE LOWER(nama_lengkap) = LOWER(transaksi.kasir)
          AND role IN ('admin', 'staff')
        LIMIT 1
    )
WHERE staff_id IS NULL 
  AND kasir IS NOT NULL 
  AND kasir != ''
  AND EXISTS (
      SELECT 1 FROM users 
      WHERE LOWER(nama_lengkap) = LOWER(transaksi.kasir)
        AND role IN ('admin', 'staff')
  );

-- Verify the update
SELECT 
    COUNT(*) as total_transactions,
    SUM(CASE WHEN staff_id IS NULL THEN 1 ELSE 0 END) as null_staff_id,
    SUM(CASE WHEN staff_id IS NOT NULL THEN 1 ELSE 0 END) as has_staff_id
FROM transaksi;

-- Show updated transactions
SELECT id, nomor_transaksi, tanggal, kasir, staff_id, staff_nama
FROM transaksi 
WHERE staff_nama IS NOT NULL
ORDER BY tanggal DESC
LIMIT 10;
