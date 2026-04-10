# ✅ Deployment Checklist: Cloudflare Pages + VPS Database

## 📋 Pre-Deployment Phase

### VPS Preparation
- [ ] VPS sudah berjalan (OS: _______, Provider: _________)
- [ ] SSH access ke VPS sudah tersedia
- [ ] PostgreSQL installed di VPS: `psql --version` ✓
- [ ] Create database: `ads_stifin_db`
- [ ] Create user: `ads_user` dengan password STRONG
- [ ] Test local connection: `psql -h VPS_IP -U ads_user -d ads_stifin_db`
- [ ] Firewall configured:
  - [ ] Allow port 5432 from Cloudflare IPs
  - [ ] Block port 5432 dari public (except Cloudflare)
- [ ] PostgreSQL backup strategy planned
- [ ] SSL/TLS untuk DB connection: `sslmode=require` 

### Application Setup
- [ ] Clone repository: ✓
- [ ] `npm install` selesai
- [ ] Prisma schema reviewed
- [ ] `.env.production` created dengan VPS connection string
- [ ] Database migrations planned
- [ ] JWT_SECRET generated (min 32 chars)
- [ ] Build test lokal: `npm run build` ✓
- [ ] All dependencies installed correctly

### Cloudflare & Git Setup
- [ ] Cloudflare account created & verified
- [ ] GitHub repository connected ke Cloudflare Pages
- [ ] Wrangler CLI installed: `wrangler --version` ✓
- [ ] Wrangler authenticated: `wrangler login` ✓
- [ ] Account ID noted: _______________
- [ ] Domain/Pages URL planned: _______________

---

## 🔧 Deployment Phase

### Database Migration
- [ ] Backup existing database (if any): `pg_dump -Fc db > backup.dump`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] Schema pushed to VPS: `DATABASE_URL=... npx prisma db push`
- [ ] Seed data applied (if needed): `DATABASE_URL=... npx prisma db seed`
- [ ] Database tables verified in VPS:
  ```sql
  SELECT * FROM information_schema.tables WHERE table_schema='public';
  ```

### Build & Test
- [ ] Clean build: `rm -r .next && npm run build` ✓
- [ ] Build output verified: `.next/standalone` exists
- [ ] Next.js version compatible dengan Cloudflare ✓
- [ ] Static files bundled correctly
- [ ] API routes compiled ✓

### Environment Variables
- [ ] DATABASE_URL set in Cloudflare dashboard
- [ ] NODE_ENV = "production"
- [ ] JWT_SECRET set (not in code!)
- [ ] NEXT_PUBLIC_API_URL = "https://your-app.pages.dev"
- [ ] Any other secrets set in Cloudflare (not in code)

### Deployment
- [ ] `.gitignore` includes `.env*` files ✓
- [ ] No secrets committed to git ✓
- [ ] Git branch up-to-date: `git pull origin main`
- [ ] Commit build changes: `git add src/ && git commit`
- [ ] Push to GitHub: `git push origin main`
- [ ] Cloudflare Pages detect changes in GitHub
- [ ] Auto-deployment triggered
- [ ] Deployment status: **SUCCESS** ✓ / PENDING / FAILED

---

## ✔️ Post-Deployment Phase

### Verification Tests
- [ ] Domain accessible: `https://your-app.pages.dev` ✓
- [ ] Home page loads without errors ✓
- [ ] Check browser console - no 500 errors ✓
- [ ] Test `/api/auth/session` endpoint:
  ```bash
  curl https://your-app.pages.dev/api/auth/session
  ```
- [ ] Test login endpoint with demo account:
  ```bash
  curl -X POST https://your-app.pages.dev/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"roy@stifin.com","password":"password123"}'
  ```
- [ ] Verify database query works (data loads from VPS)
- [ ] Test all main features:
  - [ ] Authentication works
  - [ ] Dashboard loads
  - [ ] API endpoints respond
  - [ ] Database queries successful

### Monitoring Setup
- [ ] Cloudflare Analytics enabled ✓
- [ ] Monitor real-time requests: `wrangler pages deployment tail`
- [ ] Set up error alerts (optional)
- [ ] Database performance monitoring:
  ```sql
  SELECT * FROM pg_stat_statements;
  ```
- [ ] Server logs accessible & readable
- [ ] Backup strategy verified

### Security Verification
- [ ] HTTPS enforced (Cloudflare automatic) ✓
- [ ] WAF rules configured (optional but recommended)
- [ ] DDoS protection enabled ✓
- [ ] Database user has limited privileges (not superuser)
- [ ] Firewall only allows necessary ports
- [ ] Regular backups scheduled
- [ ] No secrets in logs or error messages
- [ ] CORS settings appropriate
- [ ] Rate limiting configured (if needed)

### Performance Checks
- [ ] Page load time < 3 seconds ✓
- [ ] API response time < 1 second ✓
- [ ] Database query time < 500ms ✓
- [ ] Cold start time noted: _______ ms
- [ ] Memory usage reasonable
- [ ] No slow queries in database

---

## 🎯 Rollback Plan (If Issues)

- [ ] Previous version tags created in git
- [ ] Ability to revert: `git revert <commit-hash>`
- [ ] Database backup available
- [ ] Rollback procedure tested
- [ ] Support contact info documented

---

## 📊 Deployment Summary

| Item | Value |
|------|-------|
| **VPS Provider** | _____________ |
| **App Domain** | _____________ |
| **Database Host** | _____________ |
| **Deployment Date** | _____________ |
| **Status** | ✅ SUCCESS / ⚠️ ISSUES / ❌ FAILED |
| **Deployed By** | _____________ |
| **Notes** | _____________ |

---

## 🔔 Post-Launch Maintenance

- [ ] Monitor uptime for first 24 hours
- [ ] Check error logs daily for first week
- [ ] User testing feedback collected
- [ ] Performance baseline recorded
- [ ] Schedule weekly backups
- [ ] Plan database maintenance window
- [ ] Document deployment procedure for next time
- [ ] Share access with team members if needed

---

## ❓ Troubleshooting Reference

**Connection refused?**
- [ ] Check VPS firewall allows Cloudflare IPs
- [ ] Verify PostgreSQL listening on correct port
- [ ] Check DATABASE_URL format

**Slow queries?**
- [ ] Run EXPLAIN ANALYZE on slow queries
- [ ] Add database indexes
- [ ] Check connection pool settings

**404 on pages?**
- [ ] Verify routes in API configuration
- [ ] Check Cloudflare Pages build settings
- [ ] Review Next.js routing structure

**Secrets exposed?**
- [ ] Rotate all exposed credentials immediately
- [ ] Check git history for secrets
- [ ] Update Cloudflare environment variables

---

**Last Updated:** _______________
**Next Review Date:** _______________
