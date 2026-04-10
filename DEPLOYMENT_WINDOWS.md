# 🪟 Windows Setup Guide untuk Deploy Cloudflare + VPS

## ✅ Prerequisites

- **Wrangler CLI**: `npm install -g wrangler`
- **Git**: Untuk push ke repository
- **Cloudflare Account**: https://dash.cloudflare.com
- **VPS dengan PostgreSQL**: Sudah ter-setup dengan database

---

## 🔧 Step-by-Step Setup (Windows PowerShell)

### 1️⃣ Clone & Setup Lokal

```powershell
# Navigate ke project directory
cd C:\Users\user\Documents\GitHub\ads-stifin

# Install dependencies
npm install

# Copy environment file
Copy-Item .env.example .env.production

# Edit .env.production dengan informasi VPS Anda
notepad .env.production

# Contoh .env.production:
# DATABASE_URL="postgresql://ads_user:PASSWORD@YOUR_VPS_IP:5432/ads_stifin_db"
# NODE_ENV="production"
# JWT_SECRET="your-super-secret-key-min-32-chars"
```

### 2️⃣ Test Database Connection

```powershell
# Install PostgreSQL client (jika belum punya)
# Download dari: https://www.postgresql.org/download/windows/

# Test koneksi ke VPS database
psql -h YOUR_VPS_IP -U ads_user -d ads_stifin_db -c "SELECT 1"

# Output: Harusnya "1" jika berhasil
```

### 3️⃣ Setup Prisma

```powershell
# Generate Prisma client
npx prisma generate

# Backup database lokal (jika ada)
pg_dump -U postgres ads_stifin > backup.sql

# Import ke VPS (dari VPS atau lokal)
psql -h YOUR_VPS_IP -U ads_user -d ads_stifin_db < backup.sql

# Atau push schema Prisma langsung ke VPS
$env:DATABASE_URL="postgresql://ads_user:PASSWORD@YOUR_VPS_IP:5432/ads_stifin_db"
npx prisma db push --skip-generate
```

### 4️⃣ Test Build Lokal

```powershell
# Build Next.js
npm run build

# Check output
dir .next\standalone

# Test run lokal (dengan VPS database)
$env:DATABASE_URL="postgresql://ads_user:PASSWORD@YOUR_VPS_IP:5432/ads_stifin_db"
npm run start

# Buka browser: http://localhost:3000
# Coba login dengan demo account
```

### 5️⃣ Setup Cloudflare Pages

#### Option A: Via CLI (Recommended)

```powershell
# Login ke Cloudflare
wrangler login

# Create wrangler.toml
$wranglerConfig = @"
name = "ads-stifin"
main = "src/index.ts"
compatibility_date = "2024-12-16"
account_id = "YOUR_ACCOUNT_ID"  # Dapatkan dari https://dash.cloudflare.com/profile

[env.production]
{"routes":[{"pattern":"your-domain.pages.dev","custom_domain":true}]}
"@

$wranglerConfig | Out-File wrangler.toml -Encoding utf8

# Deploy
wrangler pages deploy
```

#### Option B: Via Web Dashboard

1. Buka https://dash.cloudflare.com
2. Go to **Pages** → **Connect to Git**
3. Select `ryse77/ads-stifin` repository
4. Build settings:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
5. Set environment variables:
   - `DATABASE_URL` = `postgresql://ads_user:PASSWORD@YOUR_VPS_IP:5432/ads_stifin_db`
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `your-secret-key`
6. Deploy!

### 6️⃣ Verify Deployment

```powershell
# Check deployment status
wrangler pages deployment list

# Test endpoints dari PowerShell
$headers = @{"Content-Type"="application/json"}

# Test session
Invoke-WebRequest -Uri "https://your-app.pages.dev/api/auth/session" `
  -Headers $headers

# Test login
$body = @{
    email = "roy@stifin.com"
    password = "password123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://your-app.pages.dev/api/auth/login" `
  -Method POST `
  -Headers $headers `
  -Body $body
```

---

## 🔐 Security Checklist (Windows)

### Database Security

```powershell
# 1️⃣ Cek firewall di VPS
# SSH ke VPS dan jalankan:
# sudo ufw status
# sudo ufw allow from 173.245.48.0/20  # Cloudflare IPs

# 2️⃣ Test koneksi dengan SSL
$sslConnection = "postgresql://ads_user:PASSWORD@YOUR_VPS_IP:5432/ads_stifin_db?sslmode=require"
psql $sslConnection -c "SELECT 1"

# 3️⃣ Rotate JWT_SECRET regularly (jangan hardcode!)
# Generate strong secret:
[System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()
```

### Environment Variables

```powershell
# ❌ JANGAN - Jangan commit ke git
DATABASE_URL="postgresql://ads_user:PASSWORD@..."

# ✅ DO - Simpan di Cloudflare dashboard saja
# Settings → Environment Variables
```

---

## 📊 Monitoring & Troubleshooting

### Check Logs

```powershell
# Cloudflare Pages logs
wrangler pages deployment tail --format pretty

# Database logs (dari VPS via SSH)
# ssh user@VPS_IP
# sudo tail -f /var/log/postgresql/postgresql.log
```

### Common Issues

**Issue: Connection refused di VPS**
```powershell
# Solution: Verify firewall
# 1. Check VPS firewall membolehkan Cloudflare IPs
# 2. Check PostgreSQL listening di 0.0.0.0:5432
# 3. Verify port forwarding (jika ada router)
```

**Issue: Slow queries**
```powershell
# Solution: Check database performance
# Di VPS: psql -U ads_user -d ads_stifin_db
# SELECT query, calls, mean_time FROM pg_stat_statements 
# ORDER BY mean_time DESC LIMIT 10;
```

**Issue: Cold starts/slow deployment**
```powershell
# Normal behavior untuk serverless - up to 30 detik first request
# Solution: Add health check untuk keep warm
# curl https://your-app.pages.dev/api/auth/session setiap 5 menit
```

---

## 🔄 CI/CD Pipeline Setup (Optional)

Gunakan GitHub Actions untuk auto-deploy:

```powershell
# Create .github/workflows/deploy.yml
mkdir -p .github\workflows

# Content akan di-push otomatis ke Cloudflare saat push ke main
```

---

## 📞 VPS Info yang Perlu Diketahui

Sebelum mulai, kumpulkan info berikut dari VPS Anda:

```
VPS Provider: _________________ (AWS, DigitalOcean, Linode, etc)
OS: _________________ (Ubuntu 20.04, etc)
RAM: _________________ (4GB, 8GB, etc)
CPU: _________________ (2 core, 4 core, etc)
Public IP: _________________ (xxx.xxx.xxx.xxx)
PostgreSQL Version: _________________ (pg_config --version)
Database Name: _________________ (ads_stifin_db)
Database User: _________________ (ads_user)
Port: _________________ (default 5432)
```

---

## 🎯 Next Steps

1. ✅ Gather VPS info
2. ✅ Test database connection from Windows
3. ✅ Setup .env.production
4. ✅ Build & test locally
5. ✅ Deploy ke Cloudflare Pages
6. ✅ Setup monitoring

**Questions? Tanyakan dengan share info VPS Anda!**
