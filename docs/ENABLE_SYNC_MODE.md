# Quick Start: Enable Offline-First Sync Mode

## 🚀 Setup dalam 5 Menit!

### Step 1: Update `.env` File

Buka file `.env` dan tambahkan konfigurasi berikut:

```env
# ========================================
# SYNC MODE CONFIGURATION
# ========================================
# Enable sync mode
SYNC_MODE=enabled

# Local SQLite database (fast, offline-capable)
SYNC_SQLITE_DSN=./data/ritel_local.db

# Remote PostgreSQL database (server/cloud)
SYNC_POSTGRES_DSN=host=localhost port=5432 user=ritel password=ritel123 dbname=ritel_db sslmode=disable
```

**⚠️ Important:**
- Ganti `host=localhost` dengan IP/domain server PostgreSQL Anda
- Ganti `password=ritel123` dengan password yang aman
- Gunakan `sslmode=require` untuk production

---

### Step 2: Setup PostgreSQL Server (Optional)

Jika belum punya PostgreSQL server:

#### **Option A: Local PostgreSQL (Development)**

```bash
# Install PostgreSQL (Windows)
# Download dari: https://www.postgresql.org/download/windows/

# Create database
createdb ritel_db

# Create user
createuser -P ritel  # Enter password when prompted
```

#### **Option B: Cloud PostgreSQL (Production)**

Gunakan salah satu provider:
- **Supabase** (Free tier available): https://supabase.com
- **Neon** (Free tier available): https://neon.tech
- **AWS RDS** (Paid)
- **Google Cloud SQL** (Paid)
- **DigitalOcean Managed DB** (Paid)

Setelah create database, copy connection string ke `.env`.

---

### Step 3: Run Aplikasi

```bash
# Build aplikasi
wails build

# Atau run development mode
wails dev
```

Aplikasi akan otomatis:
1. ✅ Create SQLite database di `./data/ritel_local.db`
2. ✅ Connect ke PostgreSQL (jika online)
3. ✅ Run migrations
4. ✅ Start sync engine
5. ✅ Show sync status di header

---

### Step 4: Verify Sync Mode Active

Cek di console/logs:

```
[SYNC] Initializing Sync Engine...
[SYNC] ✓ Sync Engine initialized (Status: 🟢 ONLINE)
```

Di aplikasi, lihat header:
- Jika online: **🟢 Online | 0 pending**
- Jika offline: **🔴 Offline | X pending**

---

## 🧪 Test Offline Mode

### Test 1: Transaksi Offline

1. **Disconnect internet** (matikan WiFi)
2. Buka menu **Transaksi**
3. Buat transaksi baru (scan produk, proses pembayaran)
4. ✅ Transaksi berhasil, tersimpan lokal
5. Lihat header: **🔴 Offline | 1 pending**
6. **Connect internet** kembali
7. Wait 2 detik, auto-sync dimulai
8. Header berubah: **🟢 Online | 0 pending**
9. ✅ Data sudah masuk ke PostgreSQL!

### Test 2: Update Stok Offline

1. Disconnect internet
2. **Produk > Update Stok**
3. Update stok beberapa produk
4. Lihat header pending bertambah
5. Connect internet
6. Auto-sync berjalan otomatis
7. Verify di PostgreSQL

### Test 3: Manual Sync

1. Disconnect internet
2. Buat beberapa transaksi/update
3. Connect internet
4. Klik tombol **🔄 Sync** di header
5. Manual sync dipaksa run immediately
6. Check pending = 0

---

## 🔧 Advanced Configuration

### Custom Sync Intervals

Edit `.env`:

```env
# Sync every 30 seconds (default: 10s)
SYNC_INTERVAL=30s

# Health check every 60 seconds (default: 30s)
HEALTH_CHECK_INTERVAL=60s
```

### Database Connection Pool

Edit `internal/sync/sync_engine.go` (line 73-76):

```go
postgresDB.SetMaxOpenConns(20)   // Default: 10
postgresDB.SetMaxIdleConns(10)   // Default: 5
postgresDB.SetConnMaxLifetime(2 * time.Hour)  // Default: 1 hour
```

### Enable Sync Logs

Edit `main.go` untuk increase log verbosity:

```go
log.SetFlags(log.LstdFlags | log.Lshortfile)
```

---

## 📊 Monitoring Sync Status

### Method 1: Via UI

1. Buka **Pengaturan > Sinkronisasi**
2. Lihat real-time stats:
   - Pending operations
   - Synced count
   - Failed count
3. View pending operation details
4. Manual sync button
5. Clear synced queue button

### Method 2: Via API

```bash
# Get sync status
curl http://localhost:8080/api/sync/status

# Get pending operations
curl http://localhost:8080/api/sync/pending

# Force sync
curl -X POST http://localhost:8080/api/sync/force

# Clear synced queue
curl -X POST http://localhost:8080/api/sync/clear
```

### Method 3: Check Database Directly

```bash
# Connect to SQLite
sqlite3 ./data/ritel_local.db

# Check sync queue
SELECT * FROM sync_queue WHERE status = 'pending';

# Count by status
SELECT status, COUNT(*) FROM sync_queue GROUP BY status;
```

---

## 🐛 Troubleshooting

### Problem: Sync not starting

**Check:**
```bash
# 1. Verify SYNC_MODE is enabled
cat .env | grep SYNC_MODE

# 2. Check logs
tail -f app.log | grep SYNC

# 3. Test PostgreSQL connection
psql -h localhost -U ritel -d ritel_db
```

**Solution:**
- Ensure `SYNC_MODE=enabled` in `.env`
- Verify PostgreSQL credentials
- Check firewall not blocking port 5432

---

### Problem: Auto-sync not working

**Check:**
```bash
# Check if engine is running
# Should see these in logs:
[SYNC] Sync worker started
[SYNC] Health check worker started
```

**Solution:**
- Restart aplikasi
- Check network connectivity
- Verify server is reachable

---

### Problem: Failed syncs accumulating

**Check:**
```sql
-- Check failed operations
SELECT * FROM sync_queue WHERE status = 'failed';

-- Check retry counts
SELECT retry_count, last_error FROM sync_queue WHERE status = 'failed';
```

**Solution:**
- Check `last_error` column for details
- Verify server schema matches local
- May need manual data fix on server

---

## 💡 Tips & Best Practices

### ✅ DO:

1. **Always backup** before enabling sync mode first time
   ```bash
   cp ritel.db ritel_backup_$(date +%Y%m%d).db
   ```

2. **Monitor sync queue** weekly
   ```sql
   SELECT COUNT(*) FROM sync_queue WHERE status = 'pending';
   ```

3. **Clear synced queue** monthly
   - Via UI: Pengaturan > Sinkronisasi > Clear Synced
   - Or auto-clears > 7 days

4. **Test sync** before going live
   - Simulate offline scenarios
   - Verify data integrity
   - Check server has all data

5. **Enable logging** in production
   ```env
   LOG_LEVEL=info
   LOG_FILE=./logs/app.log
   ```

### ❌ DON'T:

1. **Don't delete** `sync_queue` table
2. **Don't manually** edit synced records
3. **Don't change** SYNC_SQLITE_DSN after setup
4. **Don't ignore** failed sync warnings
5. **Don't run** multiple instances pointing to same SQLite

---

## 🎯 Production Checklist

Before deploying to production:

- [ ] PostgreSQL server setup and tested
- [ ] `.env` configured with correct credentials
- [ ] SSL/TLS enabled (`sslmode=require`)
- [ ] Firewall allows port 5432
- [ ] Backup strategy in place
- [ ] Sync mode tested offline scenarios
- [ ] Monitoring setup (check pending count)
- [ ] Logs configured and rotating
- [ ] Team trained on sync indicators
- [ ] Rollback plan documented

---

## 📞 Need Help?

1. Check `app.log` for errors
2. Review documentation: `docs/OFFLINE_FIRST_GUIDE.md`
3. Check sync_queue table for failed operations
4. Test connectivity to PostgreSQL
5. Contact support with logs

---

**Happy Syncing! 🚀**
