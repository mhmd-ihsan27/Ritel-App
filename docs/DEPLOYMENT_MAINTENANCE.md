# 🔧 Production Maintenance & Monitoring Guide

Panduan lengkap untuk maintenance, monitoring, dan troubleshooting Ritel-App di production.

## 📋 Table of Contents

1. [Daily Operations](#daily-operations)
2. [Monitoring & Logging](#monitoring--logging)
3. [Backup & Recovery](#backup--recovery)
4. [Performance Optimization](#performance-optimization)
5. [Database Maintenance](#database-maintenance)
6. [Security Audits](#security-audits)
7. [Troubleshooting](#troubleshooting)
8. [Incident Response](#incident-response)

---

## 📅 Daily Operations

### Daily Checklist (5 minutes)

```bash
# 1. Check application status
sudo systemctl status ritel-app

# 2. Check disk space
df -h

# 3. Check memory usage
free -h

# 4. View recent errors
sudo journalctl -u ritel-app -p err --since "1 hour ago"

# 5. Check database connections
sudo -u postgres psql -d ritel_db -c "SELECT count(*) FROM pg_stat_activity;"

# 6. Verify backup completed
ls -lht /backups/ritel-app/ | head -5
```

### Weekly Checklist (15 minutes)

```bash
# 1. Review logs for patterns
sudo journalctl -u ritel-app --since "7 days ago" | grep -i error

# 2. Check database size growth
sudo -u postgres psql -d ritel_db -c "SELECT pg_size_pretty(pg_database_size('ritel_db'));"

# 3. Review nginx access logs
sudo tail -1000 /var/log/nginx/ritel-app-access.log | awk '{print $9}' | sort | uniq -c | sort -rn

# 4. Check SSL certificate expiry
sudo certbot certificates

# 5. Review failed login attempts
sudo fail2ban-client status sshd

# 6. Check system updates
sudo apt update && apt list --upgradable
```

### Monthly Checklist (30 minutes)

```bash
# 1. Database optimization
sudo -u postgres psql -d ritel_db -c "VACUUM ANALYZE;"

# 2. Review and rotate logs
sudo logrotate -f /etc/logrotate.conf

# 3. Security updates
sudo apt update && sudo apt upgrade -y

# 4. Test backup restore (on staging)
# See Backup & Recovery section

# 5. Review resource trends
# Check CPU, RAM, disk trends over the month

# 6. Update documentation
# Document any changes or issues
```

---

## 📊 Monitoring & Logging

### 1. Application Monitoring

**Check Application Health:**
```bash
# Health endpoint
curl http://localhost:8080/health
# Response: {"status":"ok"}

# Check response time
time curl -s http://localhost:8080/health > /dev/null

# Check if process is running
pgrep -f ritel-app

# Check port listening
sudo netstat -tlnp | grep 8080
```

**View Application Logs:**
```bash
# Real-time logs
sudo journalctl -u ritel-app -f

# Last 100 lines
sudo journalctl -u ritel-app -n 100

# Errors only
sudo journalctl -u ritel-app -p err

# Specific time range
sudo journalctl -u ritel-app --since "2025-01-15 10:00" --until "2025-01-15 11:00"

# Filter by keyword
sudo journalctl -u ritel-app | grep "database"

# Export to file
sudo journalctl -u ritel-app --since "1 day ago" > /tmp/app-logs.txt
```

### 2. System Monitoring

**CPU & Memory:**
```bash
# Real-time monitoring
htop

# Quick overview
top -bn1 | head -20

# Specific process
top -p $(pgrep ritel-app)

# Memory details
free -h
cat /proc/meminfo

# CPU details
lscpu
cat /proc/cpuinfo | grep "model name" | head -1
```

**Disk Usage:**
```bash
# Overall disk usage
df -h

# Directory sizes
du -sh /opt/ritel-app/*
du -sh /var/lib/postgresql/

# Largest files
find / -type f -size +100M 2>/dev/null | xargs ls -lh | sort -k5 -rh | head -10

# inode usage
df -i
```

**Network:**
```bash
# Active connections
netstat -an | grep ESTABLISHED | wc -l

# Listening ports
sudo netstat -tlnp

# Bandwidth usage
sudo nethogs

# Connection states
netstat -an | awk '{print $6}' | sort | uniq -c | sort -rn
```

### 3. Database Monitoring

**Connection Stats:**
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Connections by state
SELECT state, count(*)
FROM pg_stat_activity
GROUP BY state;

-- Long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;

-- Kill long-running query
SELECT pg_terminate_backend(pid);
```

**Database Performance:**
```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('ritel_db'));

-- Table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Cache hit ratio (should be > 99%)
SELECT
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit) as heap_hit,
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as hit_ratio
FROM pg_statio_user_tables;

-- Index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Unused indexes (candidate for removal)
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexrelname NOT LIKE 'pg_%';
```

### 4. Setup Automated Monitoring

**Create Monitoring Script (`/opt/ritel-app/monitor.sh`):**
```bash
#!/bin/bash
# Automated monitoring script

LOG_FILE="/var/log/ritel-monitor.log"
ALERT_EMAIL="admin@yourdomain.com"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

alert() {
    echo "$1" | mail -s "Ritel-App Alert: $2" $ALERT_EMAIL
    log "ALERT: $2 - $1"
}

# Check if application is running
if ! pgrep -f ritel-app > /dev/null; then
    alert "Ritel-App is not running! Attempting restart..." "App Down"
    sudo systemctl restart ritel-app
    sleep 5
    if pgrep -f ritel-app > /dev/null; then
        log "Application restarted successfully"
    else
        alert "Failed to restart application!" "Critical: App Down"
    fi
fi

# Check disk space (alert if > 80%)
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    alert "Disk usage is at ${DISK_USAGE}%!" "High Disk Usage"
fi

# Check memory usage (alert if > 90%)
MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
if [ $MEM_USAGE -gt 90 ]; then
    alert "Memory usage is at ${MEM_USAGE}%!" "High Memory Usage"
fi

# Check database connections (alert if > 80% of max)
DB_CONN=$(sudo -u postgres psql -t -d ritel_db -c "SELECT count(*) FROM pg_stat_activity;" | tr -d ' ')
MAX_CONN=100
CONN_PERCENT=$((DB_CONN * 100 / MAX_CONN))
if [ $CONN_PERCENT -gt 80 ]; then
    alert "Database connections at ${CONN_PERCENT}% (${DB_CONN}/${MAX_CONN})" "High DB Connections"
fi

# Check SSL certificate expiry (alert if < 30 days)
CERT_EXPIRY=$(sudo certbot certificates 2>/dev/null | grep "Expiry Date" | head -1 | awk '{print $3}')
if [ -n "$CERT_EXPIRY" ]; then
    DAYS_LEFT=$(( ($(date -d "$CERT_EXPIRY" +%s) - $(date +%s)) / 86400 ))
    if [ $DAYS_LEFT -lt 30 ]; then
        alert "SSL certificate expires in ${DAYS_LEFT} days!" "SSL Expiry Warning"
    fi
fi

# Check last backup (alert if > 25 hours old)
LAST_BACKUP=$(find /backups/ritel-app -name "*.gz" -type f -mmin -1500 | wc -l)
if [ $LAST_BACKUP -eq 0 ]; then
    alert "No backup found in last 25 hours!" "Backup Failed"
fi

log "Monitoring check completed successfully"
```

**Schedule Monitoring:**
```bash
# Make script executable
sudo chmod +x /opt/ritel-app/monitor.sh

# Run every 5 minutes
crontab -e

# Add:
*/5 * * * * /opt/ritel-app/monitor.sh
```

### 5. Web-Based Monitoring (Netdata)

**Install Netdata:**
```bash
# Install
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Access via browser
# http://YOUR_SERVER_IP:19999

# Secure with password
sudo apt install -y apache2-utils
sudo htpasswd -c /etc/netdata/httppasswd admin

# Edit netdata config
sudo nano /etc/netdata/netdata.conf

# Under [web]:
bind to = 127.0.0.1

# Setup nginx proxy
sudo nano /etc/nginx/sites-available/netdata

# Add:
server {
    listen 80;
    server_name monitor.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:19999;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        auth_basic "Restricted";
        auth_basic_user_file /etc/netdata/httppasswd;
    }
}

# Enable and restart
sudo ln -s /etc/nginx/sites-available/netdata /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

---

## 💾 Backup & Recovery

### 1. Automated Backup Strategy

**Full Backup Script (`/opt/ritel-app/backup-full.sh`):**
```bash
#!/bin/bash
# Full system backup script

BACKUP_DIR="/backups/ritel-app"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

echo "Starting full backup at $(date)"

# 1. Database backup
echo "Backing up database..."
sudo -u postgres pg_dump -Fc -d ritel_db > $BACKUP_DIR/db_$DATE.dump
gzip $BACKUP_DIR/db_$DATE.dump

# 2. Application files
echo "Backing up application files..."
tar czf $BACKUP_DIR/app_$DATE.tar.gz \
    -C /opt/ritel-app \
    --exclude='*.log' \
    --exclude='data/*.db' \
    .

# 3. Configuration files
echo "Backing up configuration..."
tar czf $BACKUP_DIR/config_$DATE.tar.gz \
    /opt/ritel-app/.env \
    /etc/nginx/sites-available/ritel-app \
    /etc/systemd/system/ritel-app.service

# 4. Nginx logs
echo "Backing up logs..."
tar czf $BACKUP_DIR/logs_$DATE.tar.gz \
    /var/log/nginx/ritel-*.log

# 5. Database backup verification
echo "Verifying backup..."
if [ -f "$BACKUP_DIR/db_$DATE.dump.gz" ]; then
    SIZE=$(du -h "$BACKUP_DIR/db_$DATE.dump.gz" | cut -f1)
    echo "Database backup completed: $SIZE"
else
    echo "ERROR: Database backup failed!" | mail -s "Backup Failed" admin@yourdomain.com
    exit 1
fi

# 6. Cleanup old backups
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

# 7. Upload to remote storage (optional)
# aws s3 sync $BACKUP_DIR s3://your-bucket/ritel-backups/
# rclone sync $BACKUP_DIR remote:ritel-backups/

echo "Backup completed successfully at $(date)"

# Send notification
echo "Backup completed: $(ls -lh $BACKUP_DIR/*$DATE* | wc -l) files created" | \
    mail -s "Ritel-App Backup Success" admin@yourdomain.com
```

**Schedule Backups:**
```bash
# Make executable
sudo chmod +x /opt/ritel-app/backup-full.sh

# Schedule daily at 2 AM
crontab -e

# Add:
0 2 * * * /opt/ritel-app/backup-full.sh >> /var/log/ritel-backup.log 2>&1

# Weekly full backup (Sunday 3 AM)
0 3 * * 0 /opt/ritel-app/backup-full.sh >> /var/log/ritel-backup.log 2>&1
```

### 2. Restore Procedures

**Restore Database:**
```bash
# 1. Stop application
sudo systemctl stop ritel-app

# 2. Backup current database (just in case)
sudo -u postgres pg_dump -d ritel_db > /tmp/pre-restore-backup.sql

# 3. Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE ritel_db;"
sudo -u postgres psql -c "CREATE DATABASE ritel_db OWNER ritel;"

# 4. Restore from backup
gunzip -c /backups/ritel-app/db_20250115_020000.dump.gz | \
    sudo -u postgres pg_restore -d ritel_db

# 5. Grant permissions
sudo -u postgres psql -d ritel_db -c "GRANT ALL ON SCHEMA public TO ritel;"
sudo -u postgres psql -d ritel_db -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO ritel;"
sudo -u postgres psql -d ritel_db -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ritel;"

# 6. Verify restore
sudo -u postgres psql -d ritel_db -c "\dt"
sudo -u postgres psql -d ritel_db -c "SELECT count(*) FROM users;"

# 7. Start application
sudo systemctl start ritel-app

# 8. Check logs
sudo journalctl -u ritel-app -f
```

**Restore Application Files:**
```bash
# Stop application
sudo systemctl stop ritel-app

# Backup current version
sudo mv /opt/ritel-app /opt/ritel-app.backup

# Create directory
sudo mkdir -p /opt/ritel-app

# Extract backup
sudo tar xzf /backups/ritel-app/app_20250115_020000.tar.gz -C /opt/ritel-app

# Restore permissions
sudo chown -R www-data:www-data /opt/ritel-app
sudo chmod +x /opt/ritel-app/ritel-app

# Start application
sudo systemctl start ritel-app
```

### 3. Disaster Recovery Plan

**Complete System Recovery:**
```bash
# 1. Provision new server with same OS
# 2. Install required software
sudo apt update
sudo apt install -y postgresql nginx certbot

# 3. Restore application
sudo mkdir -p /opt/ritel-app
sudo tar xzf app_backup.tar.gz -C /opt/ritel-app

# 4. Restore configuration
sudo tar xzf config_backup.tar.gz -C /

# 5. Restore database
sudo -u postgres createdb ritel_db
gunzip -c db_backup.dump.gz | sudo -u postgres pg_restore -d ritel_db

# 6. Setup services
sudo systemctl enable ritel-app
sudo systemctl enable nginx
sudo systemctl enable postgresql

# 7. Start services
sudo systemctl start postgresql
sudo systemctl start ritel-app
sudo systemctl start nginx

# 8. Restore SSL certificates (or get new ones)
sudo certbot --nginx -d yourdomain.com

# 9. Verify everything
curl https://yourdomain.com/health
```

---

## ⚡ Performance Optimization

### 1. Database Query Optimization

**Find Slow Queries:**
```sql
-- Enable query logging
ALTER DATABASE ritel_db SET log_min_duration_statement = 1000; -- log queries > 1 second

-- View slow queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- Explain query
EXPLAIN ANALYZE SELECT * FROM transaksi WHERE tanggal > NOW() - INTERVAL '30 days';
```

**Add Missing Indexes:**
```sql
-- Find missing indexes
SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
AND correlation < 0.1;

-- Create index
CREATE INDEX CONCURRENTLY idx_transaksi_tanggal_staff
ON transaksi(tanggal, staff_id)
WHERE deleted_at IS NULL;
```

### 2. Application Performance

**Enable Go Profiling:**
```go
import _ "net/http/pprof"

go func() {
    log.Println(http.ListenAndServe("localhost:6060", nil))
}()
```

**Profile CPU:**
```bash
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30
```

**Profile Memory:**
```bash
go tool pprof http://localhost:6060/debug/pprof/heap
```

### 3. Nginx Optimization

**Enable Caching:**
```nginx
# Add to nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 1m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;

    # ... rest of config
}
```

---

## 🗄️ Database Maintenance

### Regular Maintenance Tasks

**Daily:**
```sql
-- Quick vacuum (non-blocking)
VACUUM (VERBOSE, ANALYZE) transaksi;
VACUUM (VERBOSE, ANALYZE) produk;
```

**Weekly:**
```sql
-- Full vacuum analyze
VACUUM ANALYZE;

-- Update statistics
ANALYZE;

-- Check for bloat
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Monthly:**
```sql
-- Full vacuum (requires downtime)
VACUUM FULL;

-- Reindex
REINDEX DATABASE ritel_db;

-- Check for corruption
SELECT * FROM pg_stat_database WHERE datname = 'ritel_db';
```

---

## 🔒 Security Audits

### Monthly Security Check

```bash
# 1. Check for security updates
sudo apt update
sudo apt list --upgradable | grep -i security

# 2. Review user accounts
cat /etc/passwd | grep -v nologin

# 3. Check sudo access
grep -Po '^sudo.+:\K.*$' /etc/group

# 4. Review SSH access
sudo grep "Accepted" /var/log/auth.log | tail -20

# 5. Check failed login attempts
sudo grep "Failed password" /var/log/auth.log | tail -20

# 6. Review firewall rules
sudo ufw status verbose

# 7. Check listening ports
sudo netstat -tlnp

# 8. Scan for rootkits
sudo apt install -y rkhunter
sudo rkhunter --check
```

---

## 🆘 Troubleshooting

### Common Issues

**Issue 1: Application Won't Start**
```bash
# Check logs
sudo journalctl -u ritel-app -n 50

# Common causes:
# - Database connection failed
# - Port already in use
# - Missing .env file
# - Permission issues

# Fixes:
sudo systemctl status postgresql
sudo lsof -i :8080
ls -la /opt/ritel-app/.env
```

**Issue 2: High Memory Usage**
```bash
# Find memory hogs
ps aux --sort=-%mem | head -10

# Check for memory leaks in app
# View heap dump at http://localhost:6060/debug/pprof/heap

# Restart application
sudo systemctl restart ritel-app
```

**Issue 3: Database Connection Pool Exhausted**
```sql
-- Check connections
SELECT count(*) FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND state_change < NOW() - INTERVAL '1 hour';
```

---

## 🚨 Incident Response

### Emergency Procedures

**Application Down:**
```bash
1. Check if process running: pgrep -f ritel-app
2. Check logs: sudo journalctl -u ritel-app -n 100
3. Try restart: sudo systemctl restart ritel-app
4. If fails, restore from backup
5. Document incident
```

**Database Corruption:**
```bash
1. Stop application immediately
2. Backup current state
3. Run pg_dump on working data
4. Restore from last good backup
5. Document data loss
```

**Security Breach:**
```bash
1. Disconnect from internet
2. Preserve logs
3. Change all passwords
4. Review access logs
5. Restore from clean backup
6. Apply security patches
7. Document incident
```

---

**Regular maintenance keeps your Ritel-App running smoothly! 🚀**
