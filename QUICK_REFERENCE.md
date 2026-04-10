# 🚀 Quick Reference: Cloudflare Pages + VPS Deployment

## TL;DR Command Cheat Sheet

### Setup Database di VPS (SSH ke VPS)
```bash
# Install PostgreSQL
sudo apt update && sudo apt install postgresql

# Create database & user
sudo -u postgres psql
CREATE DATABASE ads_stifin_db;
CREATE USER ads_user WITH PASSWORD 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE ads_stifin_db TO ads_user;
\q

# Allow remote connections
sudo nano /etc/postgresql/14/main/postgresql.conf
# Uncomment: listen_addresses = '*'
sudo systemctl restart postgresql

# Whitelist Cloudflare IPs
sudo ufw allow from 173.245.48.0/20 to any port 5432
sudo ufw allow from 103.21.244.0/22 to any port 5432
# (Add all Cloudflare IP ranges from https://www.cloudflare.com/ips/)
```

### Setup & Deploy (Local Machine)
```powershell
# Windows PowerShell
cd C:\Users\user\Documents\GitHub\ads-stifin

# 1. Setup environment
npm install
Copy-Item .env.example .env.production
# Edit .env.production dengan VPS connection string

# 2. Test database
psql -h YOUR_VPS_IP -U ads_user -d ads_stifin_db -c "SELECT 1"

# 3. Prepare database
$env:DATABASE_URL="postgresql://ads_user:PASSWORD@YOUR_VPS_IP:5432/ads_stifin_db"
npx prisma generate
npx prisma db push

# 4. Build & test
npm run build
npm run start  # Test lokal dulu!

# 5. Deploy to Cloudflare
npm install -g wrangler
wrangler login
wrangler pages deploy

# 6. Set environment variables di Cloudflare dashboard
# DATABASE_URL, JWT_SECRET, NODE_ENV=production
```

---

## Connection String Format

```
PostgreSQL:
postgresql://username:password@host:port/database?sslmode=require

Example untuk VPS:
postgresql://ads_user:MyPassword123!@192.168.1.50:5432/ads_stifin_db?sslmode=require

Untuk .env.production:
DATABASE_URL="postgresql://ads_user:MyPassword123!@192.168.1.50:5432/ads_stifin_db?sslmode=require"
```

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                   Your Visitors                              │
│            (dari berbagai negara/lokasi)                     │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│          Cloudflare Global Network (CDN)                     │
│  - Cepat di setiap lokasi                                   │
│  - Auto HTTPS/TLS encryption                                │
│  - DDoS Protection                                           │
└──────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌──────────────────────────────────────────────────────────────┐
│        Cloudflare Pages (Frontend + Serverless API)          │
│  - Next.js static files (HTML/CSS/JS)                       │
│  - API routes (Function handlers)                           │
│  - Edge caching                                             │
└──────────────────────────────────────────────────────────────┘
                   ↓ Database Query (HTTPS)
┌──────────────────────────────────────────────────────────────┐
│              Your VPS (Database Server)                      │
│  - PostgreSQL running on port 5432                          │
│  - Private, only accessible from Cloudflare IPs             │
│  - Regular backups stored locally                           │
└──────────────────────────────────────────────────────────────┘
```

---

## File Structure Penting

```
ads-stifin/
├── .env.production          ← Database connection string (jangan commit!)
├── wrangler.toml           ← Cloudflare config
├── next.config.ts          ← Next.js optimized untuk CF Pages
├── prisma/
│   └── schema.prisma       ← Database schema
├── src/
│   ├── app/
│   │   └── api/            ← Serverless functions
│   └── lib/
│       └── db.ts           ← Prisma client
├── DEPLOYMENT_GUIDE.md     ← Full setup guide
├── DEPLOYMENT_WINDOWS.md   ← Windows-specific setup
└── DEPLOYMENT_CHECKLIST.md ← Task tracking
```

---

## ⚙️ Configuration Files to Create/Update

### 1. .env.production
```env
# Database
DATABASE_URL="postgresql://ads_user:PASSWORD@VPS_IP:5432/ads_stifin_db?sslmode=require"

# Application
NODE_ENV="production"
NEXT_PUBLIC_API_URL="https://your-app.pages.dev"
JWT_SECRET="your_very_long_secret_key_min_32_chars_xyz123..."

# Optional
LOG_LEVEL="info"
DATABASE_POOL_SIZE="10"
```

### 2. wrangler.toml
```toml
name = "ads-stifin"
type = "javascript"
account_id = "YOUR_ACCOUNT_ID"
compatibility_date = "2024-12-16"

[build]
command = "npm run build"

[env.production]
route = "your-domain.pages.dev/*"
```

### 3. next.config.ts (update)
```typescript
const nextConfig: NextConfig = {
  output: "auto",  // Hybrid static + serverless
  serverExternalPackages: ["@prisma/client", "bcryptjs", "jsonwebtoken"],
};
```

---

## 🔐 Security Essentials

```
❌ TIDAK BOLEH di git:
- .env files dengan DATABASE_URL
- JWT_SECRET
- Private keys
- API keys
- Passwords

✅ HARUS di Cloudflare dashboard:
Settings → Environment Variables → Add
- DATABASE_URL
- JWT_SECRET
- NODE_ENV
```

---

## 📊 Monitoring Commands

```powershell
# Cloud Logs
wrangler pages deployment tail --format pretty

# Database status (from VPS via SSH)
ssh user@VPS_IP "psql -U ads_user -d ads_stifin_db -c 'SELECT version();'"

# Test endpoint
$headers = @{"Content-Type"="application/json"}
Invoke-WebRequest -Uri "https://your-app.pages.dev/api/auth/session" -Headers $headers | % Content
```

---

## ⏱️ Estimated Timeline

```
Phase 1: VPS Setup                    ~ 1-2 hours
Phase 2: Application Configuration   ~ 30 minutes
Phase 3: Database Migration          ~ 30 minutes
Phase 4: Deployment to Cloudflare    ~ 20 minutes
Phase 5: Testing & Verification      ~ 30 minutes
─────────────────────────────────────────────────
TOTAL                                 ~ 3-4 hours
```

---

## 🆘 Quick Troubleshooting

| Error | Fix |
|-------|-----|
| `connection refused` | Check firewall allows Cloudflare IPs to port 5432 |
| `FATAL: remaining connection slots` | Increase `max_connections` in PostgreSQL |
| `Cannot find module .prisma/client` | Run `npx prisma generate` |
| `500 Internal Server Error` | Check Cloudflare logs: `wrangler pages deployment tail` |
| `Slow queries` | Add database indexes, check connection pooling |
| `Cold starts` | Normal behavior - first request ~1-2 sec after inactivity |

---

## 📚 Important Links

- **Cloudflare Pages**: https://pages.cloudflare.com
- **Cloudflare IPs**: https://www.cloudflare.com/ips/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Prisma Guide**: https://www.prisma.io/docs/
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler/

---

## 📋 Step-by-Step (Ultra Simplified)

### 1. Di VPS (1 kali setup)
```bash
# SSH ke VPS
ssh your_vps_ip

# Setup PostgreSQL (20 menit)
sudo apt install postgresql
sudo -u postgres psql
CREATE DATABASE ads_stifin_db;
CREATE USER ads_user WITH PASSWORD 'securepassword';
GRANT ALL PRIVILEGES ON DATABASE ads_stifin_db TO ads_user;
```

### 2. Di Local (1 kali)
```powershell
# Get connection string
# postgresql://ads_user:securepassword@YOUR_VPS_IP:5432/ads_stifin_db

# Update .env.production dengan connection string di atas

# Build & deploy
npm run build
wrangler pages deploy
```

### 3. Di Cloudflare Dashboard
```
Pages → Settings → Environment Variables
Add: DATABASE_URL = your_connection_string_here
Save
```

### 4. Test
```powershell
curl https://your-app.pages.dev/api/auth/session
# Should return 200 with user or null
```

**Done! 🎉**

---

**Need help? Check full guides:**
- DEPLOYMENT_GUIDE.md (technical details)
- DEPLOYMENT_WINDOWS.md (Windows-specific)
- DEPLOYMENT_CHECKLIST.md (step by step tracking)
