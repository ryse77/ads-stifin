#!/bin/bash
# Deploy helper script untuk Cloudflare Pages + VPS Database

set -e

echo "🚀 ADS-STIFIN Deployment Helper"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Validate environment
echo -e "${BLUE}Step 1: Validating environment...${NC}"
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production not found${NC}"
    echo "Create .env.production with DATABASE_URL pointing to VPS"
    exit 1
fi

if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}⚠️  Wrangler not installed. Installing...${NC}"
    npm install -g wrangler
fi

echo -e "${GREEN}✅ Environment valid${NC}"
echo ""

# Step 2: Verify database connection
echo -e "${BLUE}Step 2: Testing database connection...${NC}"
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f 2)

if [[ ! $DATABASE_URL =~ ^postgresql:// ]]; then
    echo -e "${RED}❌ DATABASE_URL must be PostgreSQL${NC}"
    exit 1
fi

echo "Database: $DATABASE_URL"
echo -e "${YELLOW}⚠️  Make sure database is accessible from this machine${NC}"
echo ""

# Step 3: Build
echo -e "${BLUE}Step 3: Building Next.js...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Step 4: Run Prisma migrations
echo -e "${BLUE}Step 4: Running database migrations...${NC}"
npx prisma db push --skip-generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database migrations applied${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi
echo ""

# Step 5: Deploy to Cloudflare
echo -e "${BLUE}Step 5: Deploying to Cloudflare Pages...${NC}"
echo -e "${YELLOW}This will publish your application to Cloudflare${NC}"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler pages deploy .next/standalone/.next/static
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Deployment successful!${NC}"
        echo ""
        echo -e "${BLUE}Next steps:${NC}"
        echo "1. Set DATABASE_URL environment variable in Cloudflare dashboard"
        echo "2. Test endpoints: curl https://your-app.pages.dev/api/auth/session"
        echo "3. Monitor logs: wrangler pages deployment list"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Deployment cancelled${NC}"
fi

echo ""
echo -e "${GREEN}Done!${NC}"
