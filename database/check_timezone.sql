-- ============================================
-- Database Timezone Fix for Existing Data
-- ============================================
-- Run this SQL to check if there are timezone issues
-- This is safe to run, it only shows data stats

-- Show sample of transactions with their timestamps
SELECT 
    id,
    nomor_transaksi,
    tanggal,
    created_at,
    datetime(tanggal, 'localtime') as tanggal_local,
    datetime(created_at, 'localtime') as created_at_local
FROM transaksi
ORDER BY id DESC
LIMIT 10;

-- Show batch data with timestamps
SELECT 
    id,
    produk_id,
    tanggal_restok,
    tanggal_kadaluarsa,
    created_at,
    datetime(tanggal_restok, 'localtime') as restok_local,
    datetime(tanggal_kadaluarsa, 'localtime') as kadaluarsa_local
FROM batch
ORDER BY created_at DESC
LIMIT 10;

-- Count total records
SELECT 
    (SELECT COUNT(*) FROM transaksi) as total_transaksi,
    (SELECT COUNT(*) FROM batch) as total_batch,
    (SELECT COUNT(*) FROM produk) as total_produk;
