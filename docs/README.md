# 📚 Ritel-App Documentation Index

Dokumentasi lengkap untuk deployment, konfigurasi, dan maintenance Ritel-App.

---

## 🚀 Quick Start

Baru mulai? Pilih panduan sesuai kebutuhan Anda:

| Skenario | Waktu Setup | Panduan | Kompleksitas |
|----------|-------------|---------|--------------|
| **Toko Tunggal (Desktop)** | 5 menit | [Quick Start →](../DEPLOYMENT_QUICKSTART.md#option-a-single-pos-desktop) | ⭐ Mudah |
| **Multi-User (Web Server)** | 15 menit | [VPS Deployment →](DEPLOYMENT_VPS.md) | ⭐⭐ Sedang |
| **Container (Docker)** | 10 menit | [Docker Guide →](DEPLOYMENT_DOCKER.md) | ⭐⭐ Sedang |

---

## 📖 Deployment Guides

### 1. [Deployment Quick Start](../DEPLOYMENT_QUICKSTART.md)
Panduan cepat untuk memulai dalam 10 menit.
- ✅ 3 skenario deployment
- ✅ Quick setup scripts
- ✅ Testing procedures
- ✅ Troubleshooting tips

**Best for:** First-time deployment, quick evaluation

---

### 2. [Production Deployment](../PRODUCTION_DEPLOYMENT.md)
Panduan lengkap dan detail untuk production environment.
- ✅ Multi-scenario deployment (Desktop, Web, Hybrid)
- ✅ PostgreSQL setup & optimization
- ✅ Nginx reverse proxy
- ✅ SSL/TLS configuration
- ✅ Security hardening
- ✅ Backup & recovery
- ✅ Monitoring & maintenance

**Best for:** Production deployment, complete setup

---

### 3. [VPS Deployment](DEPLOYMENT_VPS.md)
Deploy ke Virtual Private Server (DigitalOcean, Vultr, Linode, AWS EC2).
- ✅ VPS provider comparison
- ✅ Server sizing & cost estimation
- ✅ Step-by-step VPS setup
- ✅ Automated deployment script
- ✅ Domain & SSL configuration
- ✅ Performance tuning
- ✅ Security best practices

**Best for:** Cloud deployment, remote access

---

### 4. [Docker Deployment](DEPLOYMENT_DOCKER.md)
Deploy menggunakan Docker & Docker Compose.
- ✅ Dockerfile multi-stage build
- ✅ Docker Compose orchestration
- ✅ PostgreSQL + Redis + Nginx
- ✅ SSL with Certbot
- ✅ Horizontal scaling
- ✅ Monitoring with Prometheus & Grafana
- ✅ Backup & restore procedures

**Best for:** Containerized deployment, scalability

---

### 5. [Maintenance & Monitoring](DEPLOYMENT_MAINTENANCE.md)
Panduan lengkap untuk operational excellence.
- ✅ Daily/weekly/monthly checklists
- ✅ Application & system monitoring
- ✅ Database optimization
- ✅ Automated backup strategies
- ✅ Performance tuning
- ✅ Security audits
- ✅ Incident response procedures

**Best for:** Production operations, ongoing maintenance

---

## ⚙️ Database Configuration

### [Quick Start PostgreSQL](../QUICK_START_POSTGRESQL.md)
Setup PostgreSQL dalam 5 menit.
- ✅ Database creation
- ✅ Schema & seed data
- ✅ Connection configuration
- ✅ Backup & restore
- ✅ Troubleshooting

---

## 🛠️ Deployment Scripts

### Automated Deployment Scripts

**Linux/Ubuntu Server:**
```bash
# One-command deployment
sudo ./deploy-production.sh
```
📄 [deploy-production.sh](../deploy-production.sh)

**Windows Desktop:**
```batch
# Double-click to install
deploy-windows.bat
```
📄 [deploy-windows.bat](../deploy-windows.bat)

**Docker:**
```bash
# Build and run with Docker Compose
docker-compose up -d
```
📄 [docker-compose.yml](../docker-compose.yml)

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT TIER                        │
├─────────────────────────────────────────────────────────┤
│  Desktop App (Wails)  │  Web Browser  │  Mobile/Tablet  │
└─────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                    │
├─────────────────────────────────────────────────────────┤
│         Nginx (Reverse Proxy, SSL, Load Balancer)       │
└─────────────────────────────────────────────────────────┘
                            ↓ HTTP
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION TIER                     │
├─────────────────────────────────────────────────────────┤
│              Ritel-App Backend (Go/Gin)                 │
│  ┌──────────────┬────────────────┬─────────────────┐   │
│  │  REST API    │  Authentication│  Business Logic │   │
│  │  (50+ endpoints) │ (JWT)      │  (Services)     │   │
│  └──────────────┴────────────────┴─────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      DATA TIER                          │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL (Primary)  │  SQLite (Backup/Local)         │
│  Redis (Cache)         │  File Storage                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Checklist

### Pre-Production Security

- [ ] Change default admin password
- [ ] Generate strong JWT secret
- [ ] Setup SSL/TLS certificate
- [ ] Configure firewall (UFW/iptables)
- [ ] Enable fail2ban
- [ ] Disable root SSH login
- [ ] Setup SSH key authentication only
- [ ] Change database passwords
- [ ] Configure CORS properly
- [ ] Enable automatic security updates
- [ ] Setup backup encryption
- [ ] Review file permissions

### Post-Deployment Security

- [ ] Monitor failed login attempts
- [ ] Review access logs weekly
- [ ] Update software monthly
- [ ] Test backup restore quarterly
- [ ] Security audit annually
- [ ] Review user access rights
- [ ] Check SSL certificate expiry
- [ ] Scan for vulnerabilities

---

## 💾 Backup Strategy

### Recommended Backup Schedule

| Frequency | What to Backup | Retention | Method |
|-----------|---------------|-----------|---------|
| **Hourly** | Database (incremental) | 24 hours | WAL archiving |
| **Daily** | Full database + app files | 30 days | Automated script |
| **Weekly** | Complete system snapshot | 8 weeks | VPS snapshot |
| **Monthly** | Off-site backup | 12 months | Cloud storage |

### Backup Locations

```
Primary:   /backups/ritel-app/          (On-server)
Secondary: S3/Cloud Storage             (Off-site)
Tertiary:  External HDD                 (Physical backup)
```

---

## 📈 Monitoring Metrics

### Key Performance Indicators (KPIs)

**Application Health:**
- ✅ Response time < 200ms
- ✅ Uptime > 99.9%
- ✅ Error rate < 0.1%
- ✅ CPU usage < 70%
- ✅ Memory usage < 80%

**Database Performance:**
- ✅ Connection pool < 80% utilized
- ✅ Cache hit ratio > 99%
- ✅ Query time < 100ms (p95)
- ✅ Database size growth < 10GB/month

**Business Metrics:**
- ✅ Transactions per day
- ✅ Average transaction value
- ✅ Daily active users
- ✅ API request count
- ✅ Error logs count

---

## 🆘 Support & Resources

### Getting Help

**Documentation:**
- [Full Documentation Index](#-deployment-guides)
- [Troubleshooting Guide](DEPLOYMENT_MAINTENANCE.md#troubleshooting)
- [FAQ](#faq)

**Community:**
- GitHub Issues: [Report Issue](https://github.com/yourusername/ritel-app/issues)
- Email Support: support@yourdomain.com
- Documentation: This repository

**Emergency Contacts:**
- Critical Issues: +62-xxx-xxxx-xxxx
- Email: emergency@yourdomain.com

---

## ❓ FAQ

### Deployment Questions

**Q: Mana yang lebih baik: SQLite atau PostgreSQL?**
```
A:
- SQLite: Untuk toko tunggal, 1-5 kasir, standalone desktop
- PostgreSQL: Untuk multi-user, web access, >5 kasir
- Dual Mode: Best of both worlds, automatic backup
```

**Q: Berapa biaya deployment ke production?**
```
A: Tergantung skenario:
- Desktop (SQLite): Rp 0 (one-time PC cost)
- VPS Basic: Rp 150.000-200.000/bulan (~$10-15)
- VPS Medium: Rp 300.000-400.000/bulan (~$20-30)
- VPS Large: Rp 600.000-800.000/bulan (~$40-60)
```

**Q: Apakah bisa deploy tanpa domain?**
```
A: Ya, bisa:
- Desktop mode: Tidak perlu domain
- Web mode: Akses via IP (http://192.168.1.100:8080)
- Untuk SSL, domain diperlukan (Let's Encrypt)
```

**Q: Berapa lama waktu deployment?**
```
A:
- Desktop (Windows): 5 menit
- VPS (Automated script): 10-15 menit
- VPS (Manual): 30-45 menit
- Docker: 10 menit
```

### Technical Questions

**Q: Bagaimana cara backup otomatis?**
```
A: Sudah termasuk dalam deployment script:
- Cron job untuk daily backup (2 AM)
- Retention 30 hari
- Email notification
Lihat: DEPLOYMENT_MAINTENANCE.md#backup--recovery
```

**Q: Bagaimana cara scaling untuk traffic tinggi?**
```
A:
1. Horizontal scaling dengan Docker Swarm/Kubernetes
2. Load balancer (Nginx)
3. Database replication (PostgreSQL)
4. Redis cache
5. CDN untuk static files
Lihat: DEPLOYMENT_DOCKER.md#scaling--load-balancing
```

**Q: Bagaimana monitoring production?**
```
A:
- Application logs: journalctl -u ritel-app -f
- System monitoring: Netdata (http://server:19999)
- Database monitoring: pgAdmin
- Alerting: Email notifications
Lihat: DEPLOYMENT_MAINTENANCE.md#monitoring--logging
```

---

## 📝 Version History

### Latest Version
- **v1.0.0** (2025-12-19)
  - Initial production release
  - Complete deployment documentation
  - Automated deployment scripts
  - Docker support
  - Monitoring & maintenance guides

---

## 🗺️ Deployment Roadmap

### Completed ✅
- [x] Desktop deployment (Windows)
- [x] VPS deployment (Ubuntu/Debian)
- [x] Docker deployment
- [x] PostgreSQL setup
- [x] SSL/TLS configuration
- [x] Automated backups
- [x] Monitoring & logging
- [x] Security hardening

### In Progress 🔄
- [ ] Kubernetes deployment
- [ ] AWS/GCP/Azure guides
- [ ] High availability setup
- [ ] Multi-region deployment

### Planned 📅
- [ ] Mobile app deployment
- [ ] Serverless deployment (AWS Lambda)
- [ ] Edge deployment (Cloudflare Workers)
- [ ] GitOps automation (ArgoCD)

---

## 📞 Contact & Contribution

### Maintainers
- **Developer:** Your Name
- **Email:** developer@yourdomain.com
- **GitHub:** [@yourusername](https://github.com/yourusername)

### Contributing
Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Ready to deploy? Choose your deployment guide and get started! 🚀**

**Quick Links:**
- [5-Minute Desktop Setup](../DEPLOYMENT_QUICKSTART.md#option-a-single-pos-desktop)
- [15-Minute VPS Setup](DEPLOYMENT_VPS.md#step-by-step-deployment)
- [10-Minute Docker Setup](DEPLOYMENT_DOCKER.md#quick-start)

---

*Last Updated: 2025-12-19*
*Documentation Version: 1.0.0*
