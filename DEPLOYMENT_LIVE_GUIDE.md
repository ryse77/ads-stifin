# 🚀 LIVE DEPLOYMENT GUIDE - STEP BY STEP

> Follow this guide while in Cloudflare Pages dashboard

---

## ✅ STEP 1: Fill Build Settings (5 minutes)

### In Cloudflare Pages Dashboard:

**Framework preset:**
```
→ Select: None
```

**Build command:**
```
→ Clear any text
→ Type: npm run build
→ ✓ Save
```

**Build output directory:**
```
→ Clear any text  
→ Type: .next
→ ✓ Save
```

**Status after Step 1:**
- ✅ Framework preset: None
- ✅ Build command: npm run build
- ✅ Build output directory: .next

---

## ✅ STEP 2: Add Environment Variables (3 minutes)

### In Cloudflare Pages Dashboard:

**Click:** "Environment variables (advanced)"

**Add Variable 1:**
```
Variable name: DATABASE_URL
Value: postgresql://ads_user:YOUR_PASSWORD@YOUR_VPS_IP:5432/ads_stifin_db?sslmode=require

Example:
postgresql://ads_user:MySecurePass123@192.168.1.50:5432/ads_stifin_db?sslmode=require
```

**Add Variable 2:**
```
Variable name: JWT_SECRET
Value: (copy-paste this - min 32 chars)
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Add Variable 3:**
```
Variable name: NODE_ENV
Value: production
```

**Status after Step 2:**
- ✅ DATABASE_URL set
- ✅ JWT_SECRET set  
- ✅ NODE_ENV set to production

---

## ✅ STEP 3: Deploy (2 minutes)

### In Cloudflare Pages Dashboard:

**Click: "Save and Deploy"**

**Wait for:**
```
Building...  (yellow spinner) ~ 1-2 min
Success! ✓  (green checkmark) ~ total 2-3 min
```

**What you should see:**
```
Deployment Status: SUCCESS ✓
Live URL: https://your-app-name.pages.dev
```

---

## ✅ STEP 4: First Deploy Test (2 minutes)

### In Terminal (PowerShell):

```powershell
# Test 1: Check if site is live
$url = "https://your-app-name.pages.dev"
Invoke-WebRequest $url | % StatusCode
# Expected: 200 ✓

# Test 2: Check API endpoint
$response = Invoke-WebRequest "$url/api/auth/session"
$response.Content
# Expected: {"user":null} ✓

# Test 3: Test login
$body = @{
    email = "roy@stifin.com"
    password = "password123"
} | ConvertTo-Json

$login = Invoke-WebRequest `
  -Uri "$url/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body

$login.Content
# Expected: {"success":true,"user":{...}} ✓
```

---

## ✅ STEP 5: Verify in Browser (2 minutes)

### Open browser:

```
URL: https://your-app-name.pages.dev
```

**You should see:**
- ✅ Login page loads
- ✅ No 500 errors
- ✅ Demo accounts visible
- ✅ Can click login (even if network error, that's OK for now)

---

## 🎉 CONGRATULATIONS!

**If you see all ✅ above, deployment is SUCCESSFUL!**

Your app is now:
- ✨ Live on Cloudflare Pages
- 🌍 Deployed to global CDN
- 🔄 Auto-updating on git push
- 🗄️ Connected to VPS database

---

## 🔄 Auto-Deploy Setup (Going Forward)

From now on, every time you:
```bash
git push origin main
```

Cloudflare automatically:
1. Detects the push
2. Starts build (npm run build)
3. Deploys to edge
4. Live in 2-3 minutes

**No manual deployment needed anymore!** 🚀

---

## 🆘 If Something Goes Wrong

### Deployment failed?

**Check build logs:**
1. Cloudflare Pages Dashboard
2. Deployments section
3. Click the failed build
4. See error message

**Common errors:**
```
"Cannot find module .prisma/client"
→ Solution: Run: npx prisma generate

"DATABASE_URL is not set"
→ Solution: Add DATABASE_URL to environment variables

"Connection refused"
→ Solution: Check VPS firewall allows Cloudflare IPs
```

### Site is live but showing error?

**Check Cloudflare logs:**
```powershell
wrangler pages deployment tail --format pretty
```

**Check VPS database:**
```powershell
psql -h YOUR_VPS_IP -U ads_user -d ads_stifin_db -c "SELECT 1"
# Should output: 1 ✓
```

---

## 📊 Summary Checklist

After following all steps, verify:

- [ ] Build settings filled correctly
- [ ] 3 environment variables set (DATABASE_URL, JWT_SECRET, NODE_ENV)
- [ ] Deployment status shows SUCCESS
- [ ] curl commands return 200 status
- [ ] Browser can access https://your-app-name.pages.dev
- [ ] Login page visible (no 500 errors)

---

## 🎯 Next: Auto-Deploy on Git Push

```bash
# Make a change
git add .
git commit -m "test deploy"
git push origin main

# Watch Cloudflare auto-deploy:
# 1. Detect push → 2. Build → 3. Deploy → Live! ✨
```

---

**All set? Your app is ready!** 🚀

Questions? Check: [PAGES_QUICK_START.md](./PAGES_QUICK_START.md) for detailed guide
