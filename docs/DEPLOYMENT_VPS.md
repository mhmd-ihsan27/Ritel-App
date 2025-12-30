# 🌐 VPS Deployment Guide

Deploy Ritel-App ke VPS (Virtual Private Server) seperti DigitalOcean, Vultr, Linode, AWS EC2, atau provider lainnya.

## 📋 Table of Contents

1. [Choosing VPS Provider](#choosing-vps-provider)
2. [Server Requirements](#server-requirements)
3. [Initial Server Setup](#initial-server-setup)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Domain & SSL Setup](#domain--ssl-setup)
6. [Database Optimization](#database-optimization)
7. [Security Hardening](#security-hardening)
8. [Performance Tuning](#performance-tuning)
9. [Cost Estimation](#cost-estimation)

---

## 🏢 Choosing VPS Provider

### Recommended Providers

| Provider | Starting Price | Pros | Best For |
|----------|---------------|------|----------|
| **DigitalOcean** | $6/month | Easy to use, good documentation | Beginners |
| **Vultr** | $6/month | Fast deployment, global locations | Performance |
| **Linode** | $5/month | Excellent support, SSD storage | Reliability |
| **AWS EC2** | ~$10/month | Scalable, enterprise-grade | Large business |
| **Hetzner** | €4.5/month | Very cheap, EU locations | Budget |
| **Contabo** | €5/month | Best value, high specs | Budget |

### Comparison Matrix

```
Feature          | DigitalOcean | Vultr | Linode | AWS EC2
-----------------|--------------|-------|--------|--------
Ease of Use      | ★★★★★       | ★★★★☆ | ★★★★★  | ★★☆☆☆
Price/Value      | ★★★★☆       | ★★★★☆ | ★★★★★  | ★★★☆☆
Performance      | ★★★★☆       | ★★★★★ | ★★★★☆  | ★★★★★
Documentation    | ★★★★★       | ★★★★☆ | ★★★★★  | ★★★★★
Support          | ★★★★☆       | ★★★☆☆ | ★★★★★  | ★★★★☆
Free Tier        | $200 credit | $100  | $100   | Limited
```

**Recommendation:**
- **Beginners**: DigitalOcean or Linode
- **Budget**: Hetzner or Contabo
- **Enterprise**: AWS EC2 or DigitalOcean Business

---

## ⚙️ Server Requirements

### Minimum Specifications

**Small Store (1-5 users):**
```
CPU:     1 vCPU
RAM:     2GB
Storage: 25GB SSD
OS:      Ubuntu 22.04 LTS
```
💰 Cost: ~$10-15/month

**Medium Store (5-20 users):**
```
CPU:     2 vCPU
RAM:     4GB
Storage: 50GB SSD
OS:      Ubuntu 22.04 LTS
```
💰 Cost: ~$20-30/month

**Large Store / Multi-branch (20+ users):**
```
CPU:     4 vCPU
RAM:     8GB
Storage: 100GB SSD
OS:      Ubuntu 22.04 LTS
```
💰 Cost: ~$40-60/month

### Recommended OS
- ✅ **Ubuntu 22.04 LTS** (Recommended)
- ✅ Ubuntu 20.04 LTS
- ✅ Debian 11
- ⚠️ CentOS 8 (EOL, not recommended)

---

## 🚀 Initial Server Setup

### 1. Create VPS Instance

**DigitalOcean Example:**
```bash
# Via Web Interface:
1. Go to https://cloud.digitalocean.com
2. Click "Create" → "Droplets"
3. Choose:
   - Ubuntu 22.04 LTS
   - Basic plan ($12/month - 2GB RAM)
   - Datacenter region (nearest to you)
   - Add SSH key or use password
4. Click "Create Droplet"
5. Note down the IP address
```

**Via CLI (doctl):**
```bash
# Install doctl
snap install doctl

# Authenticate
doctl auth init

# Create droplet
doctl compute droplet create ritel-app \
  --size s-2vcpu-2gb \
  --image ubuntu-22-04-x64 \
  --region sgp1 \
  --ssh-keys YOUR_SSH_KEY_ID

# Get IP
doctl compute droplet list
```

### 2. Initial Server Access

```bash
# SSH to server
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Set timezone
timedatectl set-timezone Asia/Jakarta

# Check timezone
timedatectl
```

### 3. Create Non-Root User

```bash
# Create user
adduser ritel

# Add to sudo group
usermod -aG sudo ritel

# Switch to new user
su - ritel

# Test sudo access
sudo ls -la /root
```

### 4. Setup SSH Key Authentication

```bash
# On your local machine, generate SSH key (if not exists)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key to server
ssh-copy-id ritel@YOUR_SERVER_IP

# Test login without password
ssh ritel@YOUR_SERVER_IP

# Disable password authentication (on server)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
# Set: PermitRootLogin no

# Restart SSH
sudo systemctl restart sshd
```

### 5. Setup Firewall (UFW)

```bash
# Enable UFW
sudo ufw --force enable

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp

# Allow HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow custom app port (if needed)
sudo ufw allow 8080/tcp

# Check status
sudo ufw status verbose

# Enable logging
sudo ufw logging on
```

---

## 🔧 Step-by-Step Deployment

### Method 1: Automated Deployment Script

```bash
# 1. SSH to server
ssh ritel@YOUR_SERVER_IP

# 2. Install Git
sudo apt install -y git

# 3. Clone repository
git clone https://github.com/yourusername/ritel-app.git
cd ritel-app

# 4. Run deployment script
chmod +x deploy-production.sh
sudo ./deploy-production.sh

# Follow prompts:
# - Enter domain: pos.yourdomain.com
# - Enter DB password: SecurePassword123!
# - Wait for installation (~5-10 minutes)

# 5. Done! Access your app at https://pos.yourdomain.com
```

### Method 2: Manual Deployment

**Step 1: Install Dependencies**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install Certbot (for SSL)
sudo apt install -y certbot python3-certbot-nginx

# Install Go (for building from source)
wget https://go.dev/dl/go1.23.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.23.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
go version
```

**Step 2: Setup PostgreSQL**
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE ritel_db;
CREATE USER ritel WITH PASSWORD 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE ritel_db TO ritel;

# Connect to database
\c ritel_db

# Grant permissions
GRANT ALL ON SCHEMA public TO ritel;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ritel;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ritel;

# Exit
\q

# Import schema
psql -U ritel -d ritel_db -f database/schema_postgres.sql
psql -U ritel -d ritel_db -f database/seed_data.sql
```

**Step 3: Build Application**
```bash
# Option A: Upload pre-built binary
# On local machine:
GOOS=linux GOARCH=amd64 go build -o ritel-app .
scp ritel-app ritel@YOUR_SERVER_IP:/opt/ritel-app/

# Option B: Build on server
cd /opt/ritel-app
go build -ldflags="-s -w" -o ritel-app .
```

**Step 4: Configure Application**
```bash
# Create .env file
sudo nano /opt/ritel-app/.env

# Add configuration:
DB_DRIVER=postgres
DB_DSN=host=localhost port=5432 user=ritel password=YourSecurePassword123! dbname=ritel_db sslmode=disable
WEB_ENABLED=true
WEB_PORT=8080
WEB_HOST=127.0.0.1
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRY_HOURS=8
CORS_ALLOWED_ORIGINS=https://yourdomain.com
CORS_ALLOW_CREDENTIALS=true

# Secure the file
sudo chmod 600 /opt/ritel-app/.env
sudo chown www-data:www-data /opt/ritel-app/.env
```

**Step 5: Create Systemd Service**
```bash
sudo nano /etc/systemd/system/ritel-app.service

# Add:
[Unit]
Description=Ritel-App POS System
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ritel-app
ExecStart=/opt/ritel-app/ritel-app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable ritel-app
sudo systemctl start ritel-app

# Check status
sudo systemctl status ritel-app
```

**Step 6: Configure Nginx**
```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/ritel-app

# Add configuration (see PRODUCTION_DEPLOYMENT.md for full config)

# Enable site
sudo ln -s /etc/nginx/sites-available/ritel-app /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

**Step 7: Setup SSL Certificate**
```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 🌍 Domain & SSL Setup

### 1. Point Domain to VPS

**DNS Configuration:**
```
Type    Name    Value               TTL
A       @       YOUR_SERVER_IP      3600
A       www     YOUR_SERVER_IP      3600
CNAME   pos     yourdomain.com      3600
```

**Wait for DNS Propagation:**
```bash
# Check DNS propagation
dig yourdomain.com +short
nslookup yourdomain.com

# Wait 5-10 minutes for global propagation
```

### 2. Get Free SSL Certificate

**Using Certbot:**
```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate (interactive)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Or non-interactive
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com \
  --non-interactive --agree-tos --email your@email.com

# Test renewal
sudo certbot renew --dry-run

# Auto-renewal is set up automatically via cron/systemd timer
```

**Manual SSL Setup:**
```bash
# Generate Let's Encrypt certificate manually
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Update nginx config with certificate paths
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

# Restart nginx
sudo systemctl restart nginx
```

---

## 🗄️ Database Optimization

### PostgreSQL Performance Tuning

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# Optimize based on your RAM (example: 4GB RAM)
shared_buffers = 1GB              # 25% of RAM
effective_cache_size = 3GB        # 75% of RAM
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1            # For SSD
effective_io_concurrency = 200    # For SSD
work_mem = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 4
max_parallel_workers_per_gather = 2
max_parallel_workers = 4

# Restart PostgreSQL
sudo systemctl restart postgresql

# Verify settings
sudo -u postgres psql -c "SHOW shared_buffers;"
```

### Database Maintenance Scripts

**Create `/opt/ritel-app/db-maintenance.sh`:**
```bash
#!/bin/bash
# Database maintenance script

echo "Running database maintenance..."

# Vacuum and analyze
sudo -u postgres psql -d ritel_db -c "VACUUM ANALYZE;"

# Reindex
sudo -u postgres psql -d ritel_db -c "REINDEX DATABASE ritel_db;"

# Update statistics
sudo -u postgres psql -d ritel_db -c "ANALYZE;"

# Check database size
sudo -u postgres psql -d ritel_db -c "SELECT pg_size_pretty(pg_database_size('ritel_db'));"

echo "Maintenance completed!"
```

**Schedule monthly:**
```bash
# Edit crontab
crontab -e

# Run on first day of month at 3 AM
0 3 1 * * /opt/ritel-app/db-maintenance.sh >> /var/log/db-maintenance.log 2>&1
```

---

## 🔒 Security Hardening

### 1. Fail2Ban (Brute Force Protection)

```bash
# Install fail2ban
sudo apt install -y fail2ban

# Create jail for SSH
sudo nano /etc/fail2ban/jail.local

# Add:
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

# Create jail for nginx
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 5
bantime = 600

# Restart fail2ban
sudo systemctl restart fail2ban

# Check status
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

### 2. Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt install -y unattended-upgrades

# Configure
sudo dpkg-reconfigure -plow unattended-upgrades

# Enable auto-updates
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades

# Uncomment:
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "03:00";
```

### 3. SSH Key Only (Disable Password)

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Set these values:
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

### 4. Setup ModSecurity WAF

```bash
# Install ModSecurity for nginx
sudo apt install -y libnginx-mod-http-modsecurity

# Enable ModSecurity
sudo nano /etc/nginx/modsec/modsecurity.conf
# Set: SecRuleEngine On

# Download OWASP rules
cd /etc/nginx/modsec
sudo git clone https://github.com/coreruleset/coreruleset.git
sudo mv coreruleset/crs-setup.conf.example crs-setup.conf

# Include in nginx config
# Add to server block:
modsecurity on;
modsecurity_rules_file /etc/nginx/modsec/modsecurity.conf;

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## ⚡ Performance Tuning

### 1. Enable HTTP/2

**Already configured in nginx if using SSL:**
```nginx
listen 443 ssl http2;
```

### 2. Enable Gzip Compression

```nginx
# In /etc/nginx/nginx.conf
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript
           application/json application/javascript application/xml+rss;
```

### 3. Setup Redis Cache (Optional)

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis

# Test
redis-cli ping
# Response: PONG
```

### 4. Enable Connection Pooling

**PostgreSQL (already configured in app):**
```go
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(10)
db.SetConnMaxLifetime(30 * time.Minute)
```

### 5. Monitor Server Resources

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Check CPU and RAM
htop

# Check disk I/O
iotop

# Check network usage
nethogs

# Check disk space
df -h

# Check system load
uptime
```

---

## 💰 Cost Estimation

### Monthly Costs Breakdown

**Small Setup (1-5 users):**
```
VPS (2GB RAM):           $10-12/month
Domain (.com):           $1/month
SSL Certificate:         FREE (Let's Encrypt)
Bandwidth (1TB):         Included
Backups (optional):      $2/month
-----------------------------------------
Total:                   ~$13-15/month
```

**Medium Setup (5-20 users):**
```
VPS (4GB RAM):           $20-24/month
Domain (.com):           $1/month
SSL Certificate:         FREE
Bandwidth (2TB):         Included
Backups:                 $4/month
Monitoring (optional):   $5/month
-----------------------------------------
Total:                   ~$30-35/month
```

**Large Setup (20+ users, high traffic):**
```
VPS (8GB RAM):           $40-48/month
Domain (.com):           $1/month
SSL Certificate:         FREE
CDN (Cloudflare):        FREE or $20/month
Load Balancer:           $10/month
Managed DB (optional):   $15/month
Backups:                 $8/month
Monitoring:              $10/month
-----------------------------------------
Total:                   ~$84-112/month
```

### Cost Optimization Tips

```
✅ Use yearly billing (save 10-20%)
✅ Start small, scale as needed
✅ Use Cloudflare for free CDN & DDoS protection
✅ Enable compression to reduce bandwidth
✅ Use snapshot backups instead of managed backups
✅ Monitor and optimize database queries
✅ Consider cheaper providers for non-critical environments
```

---

## 📊 Monitoring & Alerts

### Setup Basic Monitoring

```bash
# Install Netdata (real-time monitoring)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Access: http://YOUR_SERVER_IP:19999

# Or install Glances
sudo apt install -y glances
glances
```

### Setup Email Alerts

```bash
# Install mailutils
sudo apt install -y mailutils

# Test email
echo "Test email from Ritel-App server" | mail -s "Test" your@email.com

# Setup disk space alert
crontab -e

# Add:
0 */6 * * * df -h | grep -E '^/dev/' | awk '{if(+$5 > 80) print}' | mail -s "Disk Space Alert" your@email.com
```

---

## 🔄 Update Procedures

### Update Application

```bash
# 1. Backup database
sudo -u postgres pg_dump -d ritel_db > backup_$(date +%Y%m%d).sql

# 2. Stop application
sudo systemctl stop ritel-app

# 3. Update code
cd /opt/ritel-app
git pull origin main

# 4. Rebuild
go build -ldflags="-s -w" -o ritel-app .

# 5. Restart
sudo systemctl start ritel-app

# 6. Check logs
sudo journalctl -u ritel-app -f
```

### Update System

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Auto-remove unused packages
sudo apt autoremove -y

# Reboot if kernel updated
sudo reboot
```

---

## 📚 Resources

- [DigitalOcean Tutorials](https://www.digitalocean.com/community/tutorials)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**Your Ritel-App is now live on VPS! 🎉**

Access: https://yourdomain.com
Admin: admin / admin123 (Change immediately!)
