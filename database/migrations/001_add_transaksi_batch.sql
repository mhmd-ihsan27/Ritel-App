-- Migration: Add transaksi_batch table for batch tracking
-- Created: 2026-01-09
-- Description: Tracks which batches were used in each transaction for accurate restoration on returns

-- Create transaksi_batch table for SQLite
CREATE TABLE IF NOT EXISTS transaksi_batch (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaksi_id INTEGER NOT NULL,
    batch_id TEXT NOT NULL,
    produk_id INTEGER NOT NULL,
    qty_diambil REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batch(id) ON DELETE RESTRICT,
    FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE RESTRICT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transaksi_batch_transaksi ON transaksi_batch(transaksi_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_batch_batch ON transaksi_batch(batch_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_batch_produk ON transaksi_batch(produk_id);
