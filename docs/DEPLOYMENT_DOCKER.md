# 🐳 Docker Deployment Guide

Deploy Ritel-App menggunakan Docker dan Docker Compose untuk portability dan scalability maksimal.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Docker Configuration](#docker-configuration)
4. [Docker Compose Setup](#docker-compose-setup)
5. [Environment Variables](#environment-variables)
6. [Production Deployment](#production-deployment)
7. [Scaling & Load Balancing](#scaling--load-balancing)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

### Required Software
- Docker 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose 2.0+ ([Install Docker Compose](https://docs.docker.com/compose/install/))
- 2GB RAM minimum
- 10GB disk space

### Verify Installation
```bash
docker --version
# Docker version 24.0.0 or higher

docker-compose --version
# Docker Compose version 2.20.0 or higher
```

---

## 🚀 Quick Start

### 1. Create Docker Files

**Create `Dockerfile`:**
```dockerfile
# Build stage
FROM golang:1.23-alpine AS builder

# Install dependencies
RUN apk add --no-cache git gcc musl-dev

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build application
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -ldflags="-s -w" -o ritel-app .

# Runtime stage
FROM alpine:latest

# Install runtime dependencies
RUN apk --no-cache add ca-certificates tzdata

# Set timezone
ENV TZ=Asia/Jakarta
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create app user
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

# Set working directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/ritel-app .
COPY --from=builder /app/.env.example .env.example

# Create data directory
RUN mkdir -p /app/data && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run application
CMD ["./ritel-app"]
```

**Create `docker-compose.yml`:**
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: ritel-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ritel_db
      POSTGRES_USER: ritel
      POSTGRES_PASSWORD: ${DB_PASSWORD:-ritel123}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema_postgres.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./database/seed_data.sql:/docker-entrypoint-initdb.d/02-seed.sql
    ports:
      - "5432:5432"
    networks:
      - ritel-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ritel -d ritel_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Ritel-App Backend
  ritel-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ritel-app
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DB_DRIVER: postgres
      DB_DSN: "host=postgres port=5432 user=ritel password=${DB_PASSWORD:-ritel123} dbname=ritel_db sslmode=disable"
      WEB_ENABLED: "true"
      WEB_PORT: "8080"
      WEB_HOST: "0.0.0.0"
      JWT_SECRET: ${JWT_SECRET:-change-this-in-production}
      JWT_EXPIRY_HOURS: "24"
      CORS_ALLOWED_ORIGINS: ${CORS_ORIGINS:-http://localhost:3000,http://localhost:5173}
      CORS_ALLOW_CREDENTIALS: "true"
    ports:
      - "8080:8080"
    volumes:
      - app_data:/app/data
      - app_logs:/app/logs
    networks:
      - ritel-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: ritel-nginx
    restart: unless-stopped
    depends_on:
      - ritel-app
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
      - nginx_logs:/var/log/nginx
      - certbot_data:/etc/letsencrypt
      - certbot_www:/var/www/certbot
    networks:
      - ritel-network
    command: "/bin/sh -c 'while :; do sleep 6h & wait $${!}; nginx -s reload; done & nginx -g \"daemon off;\"'"

  # Certbot for SSL
  certbot:
    image: certbot/certbot
    container_name: ritel-certbot
    restart: unless-stopped
    volumes:
      - certbot_data:/etc/letsencrypt
      - certbot_www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

  # Redis (Optional - for caching)
  redis:
    image: redis:7-alpine
    container_name: ritel-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - ritel-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  # pgAdmin (Optional - for database management)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: ritel-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@ritel.com
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin123}
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - ritel-network
    depends_on:
      - postgres

volumes:
  postgres_data:
    driver: local
  app_data:
    driver: local
  app_logs:
    driver: local
  redis_data:
    driver: local
  nginx_logs:
    driver: local
  certbot_data:
    driver: local
  certbot_www:
    driver: local
  pgadmin_data:
    driver: local

networks:
  ritel-network:
    driver: bridge
```

**Create `.env` for Docker:**
```env
# Database
DB_PASSWORD=YourSecurePassword123!

# JWT
JWT_SECRET=YourRandomSecretKey123!@#$%

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# pgAdmin
PGADMIN_PASSWORD=SecureAdminPassword123!

# Domain (for SSL)
DOMAIN=yourdomain.com
```

### 2. Create Nginx Configuration

**Create `nginx/nginx.conf`:**
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    include /etc/nginx/conf.d/*.conf;
}
```

**Create `nginx/conf.d/ritel-app.conf`:**
```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# Upstream backend
upstream ritel_backend {
    server ritel-app:8080;
    keepalive 32;
}

# HTTP Server (redirect to HTTPS)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Certbot validation
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Max upload size
    client_max_body_size 10M;

    # API Endpoints
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://ritel_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Login endpoint (with stricter rate limit)
    location /api/auth/login {
        limit_req zone=login_limit burst=5 nodelay;

        proxy_pass http://ritel_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health Check
    location /health {
        access_log off;
        proxy_pass http://ritel_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Frontend Static Files
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # HTML files - no cache
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
        }
    }

    # Logging
    access_log /var/log/nginx/ritel-access.log;
    error_log /var/log/nginx/ritel-error.log;
}
```

### 3. Build and Run

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Stop services
docker-compose down

# Stop and remove volumes (⚠️ deletes data!)
docker-compose down -v
```

---

## 🔧 Docker Configuration

### Dockerfile Multi-Stage Build

Benefits:
- ✅ Smaller image size (~20MB vs 500MB)
- ✅ Faster builds with caching
- ✅ Better security (minimal attack surface)
- ✅ Production-ready

### Image Optimization
```dockerfile
# Use Alpine Linux (smallest base)
FROM alpine:latest

# Install only runtime dependencies
RUN apk --no-cache add ca-certificates tzdata

# Non-root user for security
USER appuser

# Health check for monitoring
HEALTHCHECK CMD wget --spider http://localhost:8080/health
```

---

## 🎛️ Environment Variables

### Required Variables
```env
# Database
DB_DRIVER=postgres
DB_DSN=host=postgres port=5432 user=ritel password=xxx dbname=ritel_db sslmode=disable

# Web Server
WEB_ENABLED=true
WEB_PORT=8080
WEB_HOST=0.0.0.0

# Security
JWT_SECRET=xxx
JWT_EXPIRY_HOURS=8

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com
CORS_ALLOW_CREDENTIALS=true
```

### Optional Variables
```env
# Redis (if using cache)
REDIS_HOST=redis
REDIS_PORT=6379

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Features
ENABLE_METRICS=true
ENABLE_TRACING=false
```

---

## 🏭 Production Deployment

### 1. Pre-deployment Checklist

```bash
✅ Build and test locally first
✅ Set strong passwords in .env
✅ Generate secure JWT secret
✅ Configure domain name
✅ Setup SSL certificate
✅ Test backup/restore
✅ Configure monitoring
```

### 2. Deploy to Production Server

```bash
# 1. SSH to server
ssh user@your-server

# 2. Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Clone or upload application
git clone https://github.com/yourusername/ritel-app.git
cd ritel-app

# Or upload via SCP
scp -r ./ritel-app user@server:/opt/

# 4. Create .env file
cp .env.example .env
nano .env  # Edit with production values

# 5. Build frontend
cd frontend
npm install
npm run build
cd ..

# 6. Start services
docker-compose up -d

# 7. Check logs
docker-compose logs -f

# 8. Get SSL certificate
docker-compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d yourdomain.com -d www.yourdomain.com \
  --email your@email.com \
  --agree-tos \
  --no-eff-email

# 9. Restart nginx to apply SSL
docker-compose restart nginx
```

### 3. Verify Deployment

```bash
# Check all services running
docker-compose ps
# All should show "Up" status

# Test health endpoint
curl https://yourdomain.com/health
# Response: {"status":"ok"}

# Check database
docker-compose exec postgres psql -U ritel -d ritel_db -c "\dt"
# Should list all tables

# Check logs for errors
docker-compose logs --tail=50 ritel-app
```

---

## ⚖️ Scaling & Load Balancing

### Horizontal Scaling

**Update `docker-compose.yml`:**
```yaml
services:
  ritel-app:
    build: .
    deploy:
      replicas: 3  # Run 3 instances
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Load Balancer Configuration

**Update `nginx/conf.d/ritel-app.conf`:**
```nginx
upstream ritel_backend {
    least_conn;  # Load balancing method
    server ritel-app-1:8080 weight=1 max_fails=3 fail_timeout=30s;
    server ritel-app-2:8080 weight=1 max_fails=3 fail_timeout=30s;
    server ritel-app-3:8080 weight=1 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

### Auto-scaling with Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml ritel

# Scale service
docker service scale ritel_ritel-app=5

# Check replicas
docker service ls
```

---

## 📊 Monitoring

### Container Monitoring

**Create `docker-compose.monitoring.yml`:**
```yaml
version: '3.8'

services:
  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: ritel-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - ritel-network

  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: ritel-grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/dashboards:/etc/grafana/provisioning/dashboards
    networks:
      - ritel-network
    depends_on:
      - prometheus

volumes:
  prometheus_data:
  grafana_data:
```

**Start monitoring:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

**Access:**
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)

---

## 💾 Backup & Restore

### Automated Backup Script

**Create `backup-docker.sh`:**
```bash
#!/bin/bash
# Docker backup script

BACKUP_DIR="/backups/ritel-docker"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker-compose exec -T postgres pg_dump -U ritel -d ritel_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup volumes
docker run --rm -v ritel-app_app_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/app_data_$DATE.tar.gz -C /data .

# Cleanup old backups (30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR"
```

### Restore Procedure

```bash
# Stop application
docker-compose stop ritel-app

# Restore database
gunzip -c db_backup.sql.gz | docker-compose exec -T postgres psql -U ritel -d ritel_db

# Restore volumes
docker run --rm -v ritel-app_app_data:/data -v /backups:/backup alpine tar xzf /backup/app_data_backup.tar.gz -C /data

# Restart application
docker-compose start ritel-app
```

---

## 🆘 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs ritel-app

# Inspect container
docker inspect ritel-app

# Check health
docker-compose ps
```

### Database Connection Issues

```bash
# Check postgres is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres pg_isready -U ritel -d ritel_db

# Check logs
docker-compose logs postgres
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Check container resources
docker-compose exec ritel-app top

# Check database performance
docker-compose exec postgres psql -U ritel -d ritel_db -c "SELECT * FROM pg_stat_activity;"
```

### Rebuild Everything

```bash
# Stop and remove everything
docker-compose down -v

# Remove images
docker rmi $(docker images -q ritel-app*)

# Rebuild and start
docker-compose up -d --build
```

---

## 📝 Useful Commands

```bash
# View logs
docker-compose logs -f [service]

# Execute command in container
docker-compose exec [service] [command]

# Restart service
docker-compose restart [service]

# Update images
docker-compose pull
docker-compose up -d

# Clean up
docker system prune -a --volumes

# Export/Import images
docker save ritel-app:latest | gzip > ritel-app.tar.gz
docker load < ritel-app.tar.gz
```

---

## 🔗 Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)

---

**Ready to deploy with Docker? Run `docker-compose up -d` and you're live! 🚀**
