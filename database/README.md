# Database Scripts & Schema

Koleksi script dan schema untuk database PostgreSQL di Ritel App.

## 📁 File Structure

```
database/
├── schema_postgres.sql    # Complete database schema
├── seed_data.sql          # Initial sample data
├── backup.sh              # Backup script (Linux/Mac)
├── backup.bat             # Backup script (Windows)
├── restore.sh             # Restore script (Linux/Mac)
├── restore.bat            # Restore script (Windows)
├── backups/               # Backup storage directory
└── README.md              # This file
```

## 🗄️ Schema File

### `schema_postgres.sql`

Complete database schema untuk PostgreSQL dengan:

**18 Tables:**
1. `migrations` - Migration tracking
2. `kategori` - Product categories
3. `produk` - Products and inventory
4. `keranjang` - Shopping cart (POS)
5. `pelanggan` - Customer data
6. `users` - Staff/admin accounts
7. `transaksi` - Transaction headers
8. `transaksi_item` - Transaction line items
9. `pembayaran` - Payment methods
10. `promo` - Promotions & discounts
11. `promo_produk` - Product-promo mapping
12. `returns` - Return transactions
13. `return_items` - Return line items
14. `print_settings` - Printer config
15. `stok_history` - Stock movement audit
16. `batch` - FIFO inventory batches
17. `poin_settings` - Loyalty points config

**30+ Indexes** untuk optimasi query

**9 Triggers** untuk auto-update `updated_at` columns

**Foreign Keys** untuk data integrity

### Usage

```bash
# Create schema
psql -U ritel -d ritel_db -f database/schema_postgres.sql
```

## 🌱 Seed Data File

### `seed_data.sql`

Sample data untuk testing dan development:

- **Admin User** (username: `admin`, password: `admin123`)
- **5 Kategori** (Sembako, Minuman, Snack, Peralatan, Kebersihan)
- **9 Sample Products** (4 curah, 5 satuan)
- **2 Sample Customers** (Umum & VIP)
- **2 Sample Promos** (diskon transaksi & diskon produk)
- **Print Settings** (default thermal printer config)
- **Poin Settings** (default loyalty points config)

### Usage

```bash
# Insert seed data
psql -U ritel -d ritel_db -f database/seed_data.sql
```

## 💾 Backup Scripts

### Linux/Mac: `backup.sh`

Automated backup script dengan features:
- Timestamped backup files
- Auto cleanup (keeps last 10 backups)
- Optional gzip compression
- Colored output

```bash
# Make executable
chmod +x database/backup.sh

# Run backup
./database/backup.sh
```

### Windows: `backup.bat`

Windows batch script untuk backup:
- Timestamped backup files
- Auto cleanup (keeps last 10 backups)

```cmd
database\backup.bat
```

**Backup location:** `database/backups/ritel_db_YYYYMMDD_HHMMSS.sql`

## 🔄 Restore Scripts

### Linux/Mac: `restore.sh`

Automated restore script dengan safety features:
- Pre-restore safety backup
- Automatic database recreation
- Post-restore verification
- Statistics display

```bash
# Make executable
chmod +x database/restore.sh

# Run restore
./database/restore.sh database/backups/ritel_db_20250101_120000.sql
```

### Windows: `restore.bat`

Windows batch script untuk restore:
- Pre-restore safety backup
- Automatic database recreation
- Post-restore verification

```cmd
database\restore.bat database\backups\ritel_db_20250101_120000.sql
```

⚠️ **WARNING:** Restore akan DROP database dan membuat ulang!

## 🚀 Quick Start

### 1. Setup Fresh Database

```bash
# Create database dan user
psql -U postgres -c "CREATE DATABASE ritel_db;"
psql -U postgres -c "CREATE USER ritel WITH PASSWORD 'ritel';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ritel_db TO ritel;"

# Grant permissions
psql -U postgres -d ritel_db -c "GRANT ALL ON SCHEMA public TO ritel;"
psql -U postgres -d ritel_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ritel;"
psql -U postgres -d ritel_db -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ritel;"

# Create schema
psql -U ritel -d ritel_db -f database/schema_postgres.sql

# (Optional) Insert sample data
psql -U ritel -d ritel_db -f database/seed_data.sql
```

### 2. Setup .env File

```bash
cp .env.postgres .env
```

Edit `.env`:
```env
DB_DRIVER=postgres
DB_DSN=host=localhost port=5432 user=ritel password=ritel dbname=ritel_db sslmode=disable
```

### 3. Run Application

```bash
./ritel-app
```

Aplikasi akan:
- ✅ Load configuration dari .env
- ✅ Connect ke PostgreSQL
- ✅ Auto-run migrations (jika ada)
- ✅ Ready to use!

## 🔧 Maintenance

### Regular Backup

Setup automated daily backup:

**Linux/Mac (cron):**
```bash
crontab -e
# Add:
0 2 * * * /path/to/database/backup.sh
```

**Windows (Task Scheduler):**
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 2:00 AM
4. Set action: Start program `database\backup.bat`

### Monitor Database Size

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('ritel_db'));

-- Check table sizes
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Vacuum Database

```sql
-- Analyze and optimize
VACUUM ANALYZE;

-- Full vacuum (requires exclusive lock)
VACUUM FULL;
```

## 📊 Database Schema Overview

```
┌────────────┐     ┌──────────┐     ┌───────────┐
│  kategori  │────▶│  produk  │◀────│   batch   │
└────────────┘     └──────────┘     └───────────┘
                        │
                        ├────────┐
                        │        │
                        ▼        ▼
                   ┌─────────┐  ┌──────────────┐
                   │  promo  │  │ stok_history │
                   └─────────┘  └──────────────┘
                        │
                        ▼
                ┌──────────────┐
                │ promo_produk │
                └──────────────┘

┌────────────┐     ┌────────────┐     ┌──────────────┐
│ pelanggan  │────▶│ transaksi  │────▶│pembayaran    │
└────────────┘     └────────────┘     └──────────────┘
                        │
                        ▼
                ┌──────────────────┐
                │ transaksi_item   │
                └──────────────────┘
                        │
                        ▼
                   ┌─────────┐
                   │ returns │
                   └─────────┘
                        │
                        ▼
                ┌──────────────┐
                │return_items  │
                └──────────────┘
```

## 🔗 Related Documentation

- [Quick Start PostgreSQL](../QUICK_START_POSTGRESQL.md)
- [Database Setup Guide](../DATABASE_SETUP.md)
- [Main README](../README.md)

## 📞 Support

Untuk masalah database:
1. Check logs: `tail -f /var/log/postgresql/postgresql-*.log`
2. Verify connection: `psql -U ritel -d ritel_db`
3. Check schema: `\dt` dan `\d table_name`

## 🔒 Security Notes

1. **Change default password!** Default admin password adalah `admin123`
2. **Secure .env file** - Jangan commit ke git
3. **Use SSL** untuk production: `sslmode=require`
4. **Regular backups** - Minimal daily backup
5. **Monitor access** - Check `pg_stat_activity` regularly
