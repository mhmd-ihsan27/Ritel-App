-- Migration: Make produk_id nullable in transaksi_item to preserve transaction history
-- when products are deleted

-- Step 1: Rename existing table to backup
ALTER TABLE transaksi_item RENAME TO transaksi_item_backup;

-- Step 2: Create new table with nullable produk_id and ON DELETE SET NULL
CREATE TABLE transaksi_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaksi_id INTEGER NOT NULL,
    produk_id INTEGER,
    produk_sku TEXT NOT NULL,
    produk_nama TEXT NOT NULL,
    produk_kategori TEXT,
    harga_satuan INTEGER NOT NULL,
    jumlah INTEGER NOT NULL,
    subtotal INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE RESTRICT,
    FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE SET NULL
);

-- Step 3: Copy data from backup to new table
INSERT INTO transaksi_item (
    id, transaksi_id, produk_id, produk_sku, produk_nama,
    produk_kategori, harga_satuan, jumlah, subtotal, created_at
)
SELECT
    id, transaksi_id, produk_id, produk_sku, produk_nama,
    produk_kategori, harga_satuan, jumlah, subtotal, created_at
FROM transaksi_item_backup;

-- Step 4: Drop backup table
DROP TABLE transaksi_item_backup;
