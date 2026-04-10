# Panduan Deploy ke Cloudflare Pages + Database VPS

## 📋 Ringkasan Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages (Global CDN)            │
│  - Frontend (Next.js static files)                          │
│  - API Routes (Serverless Functions)                        │
│  - Max execution: 30s (gratis), 600s (Paid)                 │
└─────────────────────────────────────────────────────────────┘
                            ↓ (HTTPS)
┌─────────────────────────────────────────────────────────────┐
│                    VPS Anda (Private)                       │
│  - Database (PostgreSQL / MySQL)                            │
│  - Optional: Cache Redis                                    │
│  - Optional: API Gateway / Proxy                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Rekomendasi Database

### **TERBAIK: PostgreSQL**
✅ Production-ready
✅ Advanced features (JSON, array, full-text search)
✅ Perfetto untuk aplikasi kompleks seperti ini
✅ Free & open-source

```bash
# Install di VPS (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Buat database untuk aplikasi
sudo -u postgres createdb ads_stifin_db
sudo -u postgres createuser ads_user
```

### Alternatif: MySQL
- Lebih lightweight
- Familiar untuk banyak developer
- Cocok jika resource terbatas

### ❌ Hindari: MongoDB untuk deployment cloud
- Lebih berat
- Memerlukan Atlas API (tambah cost)
- Overkill untuk use case ini

---

## 🚀 Langkah Setup (Step-by-Step)

### **Phase 1: Database Setup di VPS (1-2 jam)**

#### 1.1 Secure Koneksi Database
```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/14/main/postgresql.conf

# Uncomment & ubah:
listen_addresses = '*'  # Dengarkan dari IP publik

# Restart PostgreSQL
sudo systemctl restart postgresql

# Konfigurasi pg_hba.conf untuk remote access
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Tambahkan line:
host    ads_stifin_db    ads_user    0.0.0.0/0    md5  # Temporary
# Lebih aman: host ads_stifin_db ads_user CLOUDFLARE_IP/32 md5
```

#### 1.2 Setup Firewall
```bash
# Hanya izinkan akses dari Cloudflare IPs
# Dapatkan CF IP list dari: https://www.cloudflare.com/ips/

sudo ufw allow from 173.245.48.0/20 to any port 5432  # Contoh CF IP
sudo ufw allow from 103.21.244.0/22 to any port 5432
# (Lakukan untuk semua CF IP ranges)

# Verifikasi
sudo ufw status
```

#### 1.3 Setup User Database
```bash
sudo -u postgres psql

-- Buat password user yang STRONG
ALTER USER ads_user WITH PASSWORD 'PASSWORD_YANG_SANGAT_KUAT';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE ads_stifin_db TO ads_user;

-- Test koneksi dari local dulu
\connect ads_stifin_db
```

---

### **Phase 2: Konfigurasi Next.js untuk Cloudflare (30 menit)**

#### 2.1 Update `next.config.ts`
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: [
    "@prisma/client",
    "bcryptjs",
    "jsonwebtoken",
  ],
  
  // Optimasi untuk Cloudflare Pages
  output: "auto", // Hybrid: static + serverless
  
  // Minimalkan bundle size
  swcMinify: true,
};

export default nextConfig;
```

#### 2.2 Update `.env.production`
```env
# Database (pointing ke VPS)
DATABASE_URL="postgresql://ads_user:PASSWORD@your-vps-ip.com:5432/ads_stifin_db"

# Application
NEXT_PUBLIC_API_URL="https://your-domain.pages.dev"
NODE_ENV="production"
```

#### 2.3 Update `wrangler.toml` (buat file baru)
```toml
name = "ads-stifin"
type = "javascript"
account_id = "YOUR_ACCOUNT_ID"
workers_dev = true
route = ""
zone_id = ""

[build]
command = "npm run build"
cwd = "./package.json are in this directory"
watch_paths = ["src/**/*.ts", "src/**/*.tsx"]

[build.upload]
format = "service-worker"

[[triggers.crons]]
cron = "0 */6 * * *" # Health check setiap 6 jam

[env.production]
routes = [
  { pattern = "subdomain.example.com", custom_domain = true }
]
```

---

### **Phase 3: Database Migration ke VPS (30 menit)**

#### 3.1 Jika pakai Prisma (seperti app ini)
```bash
# Generate Prisma client untuk production
npx prisma generate

# Push schema ke VPS database
DATABASE_URL="postgresql://ads_user:PASS@VPS_IP:5432/ads_stifin_db" \
npx prisma db push --skip-generate

# Seed data (optional)
DATABASE_URL="postgresql://ads_user:PASS@VPS_IP:5432/ads_stifin_db" \
npx prisma db seed
```

#### 3.2 Backup Database Lokal (jika ada data penting)
```bash
# Export dari local database
pg_dump -U postgres original_db > backup.sql

# Import ke VPS
psql -h YOUR_VPS_IP -U ads_user -d ads_stifin_db < backup.sql
```

---

### **Phase 4: Deploy ke Cloudflare Pages (20 menit)**

#### 4.1 Install & Login Wrangler
```bash
npm install -g wrangler

# Login ke Cloudflare account
wrangler login
```

#### 4.2 Build & Test Lokal
```bash
npm run build

# Test build lokal sebelum deploy
npm run start
```

#### 4.3 Deploy
```bash
# Deploy ke Cloudflare Pages
wrangler pages deploy

# Atau via Git integration (lebih recommended)
# 1. Push ke GitHub
# 2. Connect GitHub repo di Cloudflare Pages dashboard
# 3. Auto-deploy pada setiap push
```

#### 4.4 Konfigurasi Environment Variables di CF
```
Dashboard Cloudflare Pages → Settings → Environment Variables

Tambahkan:
- DATABASE_URL = "postgresql://ads_user:PASS@VPS_IP:5432/ads_stifin_db"
- JWT_SECRET = xxxxxxx
- NEXT_PUBLIC_API_URL = https://your-app.pages.dev
```

---

## 🔒 Security Checklist

- [ ] Database user punya password STRONG (min 20 char, mix case + numbers + symbols)
- [ ] Firewall hanya izinkan Cloudflare IPs ke port database
- [ ] Gunakan SSL/TLS untuk koneksi database (`sslmode=require` di DATABASE_URL)
- [ ] Backup database regular (daily/weekly)
- [ ] Monitor query performance (slow queries)
- [ ] Setup WAF di Cloudflare Pages
- [ ] Enable DDoS protection di Cloudflare
- [ ] Rotate JWT_SECRET regularly
- [ ] Jangan commit `.env` ke git

---

## 📊 Testing Deployment

### Test Lokal Dulu
```bash
# Ganti DATABASE_URL dengan VPS
export DATABASE_URL="postgresql://ads_user:PASS@VPS_IP:5432/ads_stifin_db"

npm run dev

# Test endpoints:
curl http://localhost:3000/api/auth/session
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"roy@stifin.com","password":"password123"}'
```

### Monitoring Production
```bash
# Check Cloudflare Pages logs
wrangler pages deployment list

# Monitor database performance
psql -h VPS_IP -U ads_user -d ads_stifin_db
SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

---

## ⚠️ Potential Issues & Solutions

| Issue | Penyebab | Solusi |
|-------|---------|--------|
| Connection timeout | Firewall blocking | Whitelist CF IPs di firewall |
| `FATAL: remaining connection slots reserved for non-replication superuser connections` | Pool kehabisan | Tingkatkan `max_connections` di PostgreSQL |
| Slow queries | N+1 queries | Optimize Prisma queries, add indexes |
| Cold starts | Serverless nature | Normal, ~1-2 detik first request |

---

## 💡 Optimisasi Tambahan

### 1. Enable Connection Pooling
```bash
# Install pgBouncer di VPS
sudo apt install pgbouncer

# Config /etc/pgbouncer/pgbouncer.ini
[databases]
ads_stifin_db = host=localhost port=5432 dbname=ads_stifin_db

# Restart
sudo systemctl restart pgbouncer
```

### 2. Cache Layer (Redis)
```bash
# Install Redis di VPS
sudo apt install redis-server

# Di aplikasi, cache query results untuk 5 menit:
const cacheKey = `user_${userId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const user = await db.user.findUnique(...);
await redis.setex(cacheKey, 300, JSON.stringify(user));
return user;
```

### 3. CDN untuk Static Assets
- Sudah included di Cloudflare Pages
- Images otomatis optimize dengan Cloudflare Image Optimization

---

## 📞 Support & Troubleshooting

### Jika ada masalah:
1. Check Cloudflare Pages logs: `wrangler pages functions logs`
2. Check VPS database logs: `sudo tail -f /var/log/postgresql/postgresql.log`
3. Test connection: `psql -h VPS_IP -U ads_user -d ads_stifin_db -c "SELECT 1"`
4. Monitor resources: `htop` di VPS

---

## 🎯 Next Steps

1. ✅ Confirm OS & specs VPS Anda
2. ✅ Setup PostgreSQL di VPS (following Phase 1)
3. ✅ Test koneksi dari local ke VPS database
4. ✅ Update `.env` dengan VPS connection string
5. ✅ Deploy ke Cloudflare Pages (Phase 4)
6. ✅ Setup monitoring & backup strategy

**Butuh bantuan dengan step tertentu? Beri tahu specs VPS Anda!**
