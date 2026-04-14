# SnapLocate Campus OS — AWS Migration Roadmap
> **Prepared for:** Raushan Raj (Founder, SnapLocate)
> **Date:** April 2026 | Stack Version: SnapLocate v1.0 → v2
> **Current Stage:** Thapar Pilot → Multi-University SaaS

---

## 📌 Executive Summary

SnapLocate currently uses a **hybrid stack** mixing multiple third-party SaaS services. This roadmap outlines how to **consolidate onto AWS** for better control, lower cost at scale, enterprise compliance (important for Indian university IT heads), and a single billing dashboard.

| What | Current | AWS Equivalent | Free Tier? |
|------|---------|----------------|------------|
| Database | Supabase (PostgreSQL) | AWS RDS (Aurora Serverless v2) | ✅ RDS Free Tier |
| Auth OTP Email | AWS SES ✅ Already | AWS SES | ✅ 3,000 free/mo |
| File Storage (Images/PDFs) | Cloudinary | AWS S3 + CloudFront | ✅ S3 5GB free |
| File Storage (Large >10MB) | Cloudflare R2 | AWS S3 | ✅ S3 5GB free |
| Backend API (Node/Express) | Local / Unhosted | AWS EC2 or App Runner | ✅ EC2 t2.micro free |
| Frontend (React SPA) | Local / Unhosted | AWS S3 + CloudFront | ✅ CloudFront 1TB free |
| Image Transforms | Cloudinary | AWS Lambda + Sharp | ✅ Lambda 1M free calls |
| Push Notifications | Not built yet (FCM planned) | AWS SNS | ✅ 1M free pushes |
| Secrets Management | .env files | AWS Secrets Manager | ❌ $0.40/secret/mo |
| Monitoring | None | AWS CloudWatch | ✅ Free basic tier |
| DNS / Domain | Unknown | AWS Route 53 | ❌ $0.50/hosted zone |

---

## 🏗️ Current Architecture Map

```
[User Browser]
      │
      ├── React SPA (Vite) — Currently LOCAL/unhosted
      │
      ▼
[Express API — Node.js] — Currently LOCAL on port 3001
      │
      ├── Supabase ————————── PostgreSQL (26+ tables, org_id multi-tenant)
      ├── AWS SES ——————────── OTP Emails (ap-south-1) ✅ ALREADY AWS
      ├── Cloudinary ———————── Images, PDFs
      ├── Cloudflare R2 ————── Large files >10MB
      └── JWT Auth —————————── 7-day tokens, localStorage
```

---

## 🎯 Target AWS Architecture

```
                    ┌─────────────────────────────────────┐
                    │        Route 53 (DNS)                │
                    │   snaplocate.app / api.snaplocate.app │
                    └──────────────┬──────────────────────┘
                                   │
              ┌────────────────────┼─────────────────────┐
              ▼                    ▼                      ▼
    ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │  CloudFront CDN  │  │  CloudFront CDN  │  │   AWS WAF        │
    │  (React SPA)     │  │  (Media/Files)   │  │   (Security)     │
    └────────┬─────────┘  └────────┬─────────┘  └──────────────────┘
             │                     │
    ┌────────▼─────────┐  ┌────────▼─────────┐
    │   S3 Bucket       │  │   S3 Bucket       │
    │   (Frontend SPA)  │  │   (Media/Files)   │
    └───────────────────┘  └───────────────────┘
                                                      
    ┌─────────────────────────────────────────────────────┐
    │              Application Load Balancer               │
    └──────────────────────┬──────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
    ┌──────────────┐ ┌──────────────┐  ┌──────────────┐
    │  EC2 / ECS   │ │  EC2 / ECS   │  │  EC2 / ECS   │
    │  (Express)   │ │  (Express)   │  │  (Express)   │
    └──────┬───────┘ └──────┬───────┘  └──────┬───────┘
           │                │                  │
           └────────────────┼──────────────────┘
                            │
            ┌───────────────┴─────────────────────┐
            │                                     │
   ┌────────▼──────┐                   ┌──────────▼──────────┐
   │  RDS Aurora    │                   │   ElastiCache Redis  │
   │  PostgreSQL    │                   │   (Sessions/Cache)   │
   └────────────────┘                   └─────────────────────┘
   
            ┌──────────────────────────────────────┐
            │      Supporting AWS Services         │
            ├──────────┬──────────┬────────────────┤
            │  SES     │   SNS    │  Secrets Mgr   │
            │ (Email)  │ (Push)   │  (Env Vars)    │
            └──────────┴──────────┴────────────────┘
```

---

## 📋 Phase-by-Phase Migration Plan

---

## ✅ PHASE 0 — Prerequisites (Week 1)
> **Cost: $0** | Everything done in AWS Free Tier or free tools

### Step 1: AWS Account Setup

```bash
# 1. Create AWS account at aws.amazon.com
# 2. Enable MFA on root account immediately
# 3. Create IAM user for deployment (NEVER use root):

# In AWS Console → IAM → Users → Create User
# Username: snaplocate-deploy
# Attach policies:
#   - AmazonS3FullAccess
#   - AmazonSESFullAccess
#   - AmazonEC2FullAccess
#   - AmazonRDSFullAccess
#   - CloudFrontFullAccess

# 4. Download Access Key ID + Secret Access Key
# 5. Set billing alert at $10/month (safety net)
```

### Step 2: Install AWS CLI

```bash
# Mac
brew install awscli

# Configure
aws configure
# AWS Access Key ID: [your-key]
# AWS Secret Access Key: [your-secret]
# Default region: ap-south-1   ← Mumbai (closest to Indian universities)
# Default output format: json

# Verify
aws sts get-caller-identity
```

### Step 3: Register Your Domain in Route 53

```bash
# In AWS Console → Route 53 → Registered Domains
# Search: snaplocate.app or snaplocate.in
# Cost: ~$12/year for .app | ~$15/year for .in

# Create Hosted Zone
aws route53 create-hosted-zone \
  --name snaplocate.app \
  --caller-reference $(date +%s)
```

---

## 🚀 PHASE 1 — Deploy Frontend (React SPA) to S3 + CloudFront
> **Cost: $0** (Within AWS Free Tier) | **Timeline: Day 1-2**

This is the **easiest first win** — your React build is just static files.

### Why This First?
- Zero risk (frontend has no database)
- Users get HTTPS, global CDN, 99.99% uptime immediately
- Free tier covers this completely for months

### Step 1: Build Your React App

```bash
cd /Users/raushanraj/Downloads/Figma\ snaplocate\ /snaplocate

# Update .env for production
echo "VITE_API_URL=https://api.snaplocate.app" > .env.production

# Build
npm run build
# Output: dist/ folder
```

### Step 2: Create S3 Bucket for Frontend

```bash
# Create bucket (name must be globally unique)
aws s3 mb s3://snaplocate-frontend-prod --region ap-south-1

# Enable static website hosting
aws s3 website s3://snaplocate-frontend-prod \
  --index-document index.html \
  --error-document index.html

# Set bucket policy (allow public read)
cat > /tmp/bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::snaplocate-frontend-prod/*"
  }]
}
EOF

aws s3api put-bucket-policy \
  --bucket snaplocate-frontend-prod \
  --policy file:///tmp/bucket-policy.json

# Upload dist folder
aws s3 sync dist/ s3://snaplocate-frontend-prod --delete
```

### Step 3: Create CloudFront Distribution

```bash
# In AWS Console → CloudFront → Create Distribution
# Origin: snaplocate-frontend-prod.s3-website.ap-south-1.amazonaws.com
# Default root object: index.html
# Custom error page: /index.html (for React Router to work)
# Price class: Use only India + Asia (cheaper)
# SSL Certificate: Request free AWS Certificate Manager (ACM) cert for snaplocate.app
```

### Step 4: Point Domain to CloudFront

```bash
# In Route 53, create A record:
# Name: snaplocate.app (or www.snaplocate.app)
# Type: A — Alias
# Alias target: Your CloudFront distribution URL (d1xxxx.cloudfront.net)
```

### Deploy Script (save as deploy-frontend.sh)

```bash
#!/bin/bash
cd snaplocate
npm run build
aws s3 sync dist/ s3://snaplocate-frontend-prod --delete
aws cloudfront create-invalidation \
  --distribution-id YOUR_CF_DIST_ID \
  --paths "/*"
echo "✅ Frontend deployed to https://snaplocate.app"
```

---

## 🗄️ PHASE 2 — Migrate Database: Supabase → AWS RDS (Aurora Serverless)
> **Cost: $0 → $3-15/mo** | **Timeline: Week 1-2** | **HIGHEST RISK — Plan carefully**

> [!WARNING]
> This is the most complex migration. Supabase has its own Auth system, Real-time, and Storage tied in. Since you're using Supabase only as a PostgreSQL host (your own JWT auth + your own file storage), migration is very feasible.

### Why Migrate from Supabase?

| Concern | Supabase | AWS RDS Aurora |
|---------|----------|----------------|
| Price (at scale) | $25/mo Pro always-on | Pay per use (serverless) |
| Data control | Hosted by Supabase Inc | Your data, your VPC |
| Enterprise compliance | Limited | SOC2, ISO 27001 certified |
| Supabase lock-in | High | None (pure PostgreSQL) |
| Free tier | 500MB, 2 projects | RDS Free: 750 hrs t3.micro |

> [!NOTE]
> **Free Tier:** AWS RDS offers **750 hours/month of db.t3.micro for 12 months** — enough for your pilot phase at zero cost!

### Step 1: Export Supabase Schema + Data

```bash
# In Supabase Dashboard → Settings → Database
# Get your connection string (Direct connection, port 5432)

# Export schema
pg_dump \
  --schema-only \
  --no-owner \
  --no-acl \
  "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres" \
  > snaplocate_schema.sql

# Export data (all tables)
pg_dump \
  --data-only \
  --no-owner \
  "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres" \
  > snaplocate_data.sql
```

### Step 2: Create RDS Aurora Serverless v2

```bash
# In AWS Console → RDS → Create Database
# Engine: Aurora PostgreSQL (compatible with Supabase's PostgreSQL)
# Edition: Aurora Serverless v2
# Version: PostgreSQL 15.x (match Supabase version)
# Instance class: serverless
# Min ACUs: 0.5 (scales to zero when idle = very cheap)
# Max ACUs: 4 (enough for 1,000 concurrent students)
# 
# DB name: snaplocate
# Master username: snaplocate_admin
# Region: ap-south-1 (Mumbai)
# 
# Connectivity: VPC (create new), public access: YES (for now, secure later)
# Security group: allow port 5432 from your EC2 instances

# Get endpoint after creation:
# snaplocate.cluster-xxxxx.ap-south-1.rds.amazonaws.com
```

### Step 3: Import Schema + Data

```bash
# Connect to new RDS instance  
psql -h snaplocate.cluster-xxxxx.ap-south-1.rds.amazonaws.com \
     -U snaplocate_admin -d snaplocate

# Import schema first
psql -h [RDS_ENDPOINT] -U snaplocate_admin -d snaplocate \
     -f snaplocate_schema.sql

# Import data
psql -h [RDS_ENDPOINT] -U snaplocate_admin -d snaplocate \
     -f snaplocate_data.sql
```

### Step 4: Update Backend Connection

```bash
# In your server/.env (or AWS Secrets Manager — recommended)
DATABASE_URL=postgresql://snaplocate_admin:[password]@snaplocate.cluster-xxxxx.ap-south-1.rds.amazonaws.com:5432/snaplocate

# In server/lib/supabase.js — REPLACE with pg (node-postgres)
# npm install pg
```

```javascript
// server/lib/db.js (NEW FILE — replaces supabase.js for DB queries)
import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for RDS
  max: 20,           // Max pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export const query = (text, params) => pool.query(text, params)
export default pool
```

> [!IMPORTANT]
> After migrating from Supabase SDK to raw `pg`, you need to rewrite all `supabase.from('table').select()` calls to plain SQL queries. This takes ~1-2 days of work but makes you fully portable.

---

## ☁️ PHASE 3 — Deploy Backend (Express API) to AWS EC2
> **Cost: $0 for 12 months** (t2.micro Free Tier) | **Timeline: Day 3-4**

### Step 1: Launch EC2 Instance

```bash
# In AWS Console → EC2 → Launch Instance
# Name: snaplocate-api
# AMI: Ubuntu Server 24.04 LTS (Free tier eligible)
# Instance type: t2.micro (FREE for 12 months)
# Key pair: Create new → snaplocate-key.pem
# Security group rules:
#   - SSH: port 22 (your IP only)
#   - HTTP: port 80 (0.0.0.0/0)
#   - HTTPS: port 443 (0.0.0.0/0)
#   - Custom TCP: port 3001 (your IP for testing)

# Save snaplocate-key.pem and chmod
chmod 400 snaplocate-key.pem
```

### Step 2: Connect and Setup Server

```bash
# SSH into instance
ssh -i snaplocate-key.pem ubuntu@ec2-XX-XX-XX-XX.ap-south-1.compute.amazonaws.com

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager — keeps your app running 24/7)
sudo npm install pm2 -g

# Install nginx (reverse proxy — handles HTTPS)
sudo apt-get install -y nginx
```

### Step 3: Deploy Your Express App

```bash
# On your LOCAL machine — copy server files to EC2
rsync -avz \
  -e "ssh -i snaplocate-key.pem" \
  --exclude='node_modules' \
  --exclude='.env' \
  /Users/raushanraj/Downloads/Figma\ snaplocate\ /server/ \
  ubuntu@[EC2_IP]:/home/ubuntu/snaplocate-server/

# On EC2 — install dependencies
cd /home/ubuntu/snaplocate-server
npm install

# Create .env file on EC2 (or use Secrets Manager — see Phase 5)
nano .env
# Paste all your production environment variables

# Start with PM2
pm2 start index.js --name snaplocate-api
pm2 startup    # Ensure it restarts on reboot
pm2 save
```

### Step 4: Configure Nginx + HTTPS

```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/snaplocate

# Paste this config:
server {
    listen 80;
    server_name api.snaplocate.app;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/snaplocate /etc/nginx/sites-enabled/
sudo nginx -t   # Test config
sudo systemctl restart nginx

# Install Certbot for free SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.snaplocate.app
# → Your API is now live at https://api.snaplocate.app 🎉
```

### Step 5: Set Up Deployment Script

```bash
# deploy-backend.sh (run from local machine)
#!/bin/bash
rsync -avz -e "ssh -i snaplocate-key.pem" \
  --exclude='node_modules' --exclude='.env' \
  server/ ubuntu@[EC2_IP]:/home/ubuntu/snaplocate-server/

ssh -i snaplocate-key.pem ubuntu@[EC2_IP] \
  "cd /home/ubuntu/snaplocate-server && npm install && pm2 restart snaplocate-api"
  
echo "✅ Backend deployed to https://api.snaplocate.app"
```

---

## 🗂️ PHASE 4 — Migrate File Storage: Cloudinary + R2 → AWS S3
> **Cost: $0** (5GB free) → $0.023/GB after | **Timeline: Week 2**

### Why Consolidate to S3?

| | Cloudinary | Cloudflare R2 | AWS S3 |
|-|-----------|--------------|--------|
| Free tier | 25 credits/mo | 10GB free | 5GB free (12 mo) |
| At scale cost | $99+/mo | $0.015/GB | $0.023/GB |
| Transforms | Built-in | None | Lambda (DIY) |
| Integration with EC2 | External API | External API | IAM roles (seamless) |
| Egress cost | Free | **$0** | $0.09/GB |

> [!TIP]
> **Keep Cloudflare R2** for large files (>10MB) — its $0 egress fee saves money vs S3's $0.09/GB egress. Only migrate images/PDFs (Cloudinary workload) to S3.

### Step 1: Create S3 Media Bucket

```bash
# Create bucket for media (images/PDFs)
aws s3 mb s3://snaplocate-media-prod --region ap-south-1

# Block all public access EXCEPT through CloudFront
aws s3api put-public-access-block \
  --bucket snaplocate-media-prod \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Create CloudFront OAC (Origin Access Control) to serve files privately
# In Console → CloudFront → Create Distribution
# Origin: snaplocate-media-prod.s3.ap-south-1.amazonaws.com
# OAC: Create new OAC
# → Your media files available at: https://media.snaplocate.app/filename.jpg
```

### Step 2: Update Upload Route

```javascript
// server/lib/s3.js (NEW — replaces cloudinary.js for images)
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

export const uploadToS3 = async (file, folder = 'uploads') => {
  const key = `${folder}/${Date.now()}-${file.originalname}`
  
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_MEDIA_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // No ACL needed — CloudFront handles access
  }))
  
  return `https://media.snaplocate.app/${key}` // CloudFront URL
}

// For image transformations (replaces Cloudinary transforms)
// Option 1: Use AWS Lambda@Edge (complex, powerful)
// Option 2: Use imgix.com ($10/mo) with S3 source (simple)
// Option 3: Use sharp locally on EC2 before upload (free, simple)
```

### Step 3: Migrate Existing Files

```bash
# Install rclone
brew install rclone

# Configure rclone for Cloudinary (pull existing files)
# Then sync to S3
rclone sync cloudinary:snaplocate s3:snaplocate-media-prod/migrated/

# Or use Cloudinary's Bulk Export API:
# https://cloudinary.com/documentation/migration
```

---

## 📧 PHASE 5 — Secrets Manager (Optional but Recommended)
> **Cost: $0.40/secret/month (~$4/mo for 10 secrets)** | **Timeline: Day 1 with EC2**

Your current `.env` files are risk-prone. AWS Secrets Manager solves this.

```javascript
// server/lib/secrets.js
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

const client = new SecretsManagerClient({ region: 'ap-south-1' })

export const getSecret = async (secretName) => {
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  )
  return JSON.parse(response.SecretString)
}

// In your index.js startup:
// const secrets = await getSecret('snaplocate/production')
// process.env.JWT_SECRET = secrets.JWT_SECRET
// process.env.DATABASE_URL = secrets.DATABASE_URL
// etc.
```

```bash
# Create secrets in AWS
aws secretsmanager create-secret \
  --name "snaplocate/production" \
  --secret-string '{
    "JWT_SECRET": "your-secret",
    "DATABASE_URL": "postgresql://...",
    "CLOUDINARY_API_KEY": "..."
  }' \
  --region ap-south-1
```

---

## 📱 PHASE 6 — Push Notifications via AWS SNS (Planned Feature)
> **Cost: $0 for first 1M pushes/month** | **Timeline: Phase 2 feature**

Since FCM push notifications are planned but not built, AWS SNS is the right choice.

```javascript
// server/lib/sns.js
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'

const sns = new SNSClient({ region: 'ap-south-1' })

export const sendPushNotification = async (deviceToken, message) => {
  // Create Platform Application Endpoint for FCM/APNs
  await sns.send(new PublishCommand({
    TargetArn: deviceToken, // SNS endpoint ARN
    Message: JSON.stringify({
      GCM: JSON.stringify({ // For Android (FCM)
        notification: { title: 'SnapLocate', body: message }
      })
    }),
    MessageStructure: 'json'
  }))
}
```

**Free tier:** 1 million SNS notifications/month — covers you until 83,000 daily active users.

---

## 📊 PHASE 7 — Monitoring with CloudWatch
> **Cost: $0** (Free tier is very generous) | **Timeline: Alongside EC2 setup**

```bash
# Install CloudWatch agent on EC2
sudo apt install amazon-cloudwatch-agent -y

# What to monitor:
# - API response times (P50, P95, P99)
# - EC2 CPU + Memory
# - RDS DB connections
# - S3 request count
# - SES bounce rates

# Create alarms (free tier allows 10 alarms)
aws cloudwatch put-metric-alarm \
  --alarm-name "SnapLocate-High-CPU" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:ap-south-1:[account]:snaplocate-alerts
```

---

## 💰 AWS Cost Breakdown by Scale Stage

### 🟢 Stage 1: MVP / Pilot (0-500 students, 1 university)
> **All within AWS Free Tier for 12 months**

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| EC2 t2.micro | 750 hrs (always-on) | **$0** (Free Tier) |
| RDS db.t3.micro | 750 hrs (always-on) | **$0** (Free Tier) |
| S3 Storage | < 5GB | **$0** (Free Tier) |
| CloudFront | < 1TB transfer | **$0** (Free Tier) |
| SES Emails | < 3,000/mo | **$0** (Free Tier) |
| Route 53 | 1 hosted zone | **$0.50** |
| SNS Notifications | < 1M | **$0** (Free Tier) |
| **Total** | | **~$0.50/month** |

---

### 🟡 Stage 2: Growth (500-3,000 students, 3-5 universities)
> **After free tier expires (~Month 13)**

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| EC2 t3.small | 1 instance | **$15** |
| RDS Aurora Serverless | ~2 ACUs avg | **$8** |
| S3 Storage | ~50GB media | **$1.15** |
| CloudFront | ~100GB transfer | **$8.50** |
| SES Emails | ~50,000 OTPs | **$5** |
| Secrets Manager | 10 secrets | **$4** |
| Route 53 | DNS queries | **$1** |
| CloudWatch | Logs | **$0** |
| **Total** | | **~$43/month** |

*Note: At ₹100/student/year × 3,000 students = **₹3L ARR (~$3,600/year)** vs **$516/year** AWS cost = 85% margin* ✅

---

### 🔴 Stage 3: Scale (5,000-20,000 students, 20+ universities)
> **Production-grade, highly available setup**

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| EC2 t3.medium × 2 | Auto-scaled | **$66** |
| Application Load Balancer | 1 ALB | **$22** |
| RDS Aurora Serverless v2 | 4-8 ACUs | **$50** |
| ElastiCache Redis (t3.micro) | Session cache | **$12** |
| S3 Storage | ~500GB | **$11.50** |
| CloudFront | ~1TB transfer | **$85** |
| SES Emails | ~500K/mo | **$50** |
| WAF (Security) | Web rules | **$20** |
| Secrets Manager | 15 secrets | **$6** |
| Route 53 | 3 hosted zones | **$5** |
| CloudWatch + Logs | Production monitoring | **$15** |
| **Total** | | **~$343/month** |

*At ₹100/student × 20,000 = **₹20L ARR (~$24,000/year)** vs **$4,116/year** AWS cost = 83% margin* ✅

---

## 🆓 Complete Free Tier Summary

| AWS Service | Free Tier Offer | Expires |
|-------------|----------------|---------|
| EC2 t2.micro | 750 hrs/month | 12 months |
| RDS db.t3.micro | 750 hrs/month, 20GB storage | 12 months |
| S3 | 5GB storage, 20K GET, 2K PUT | 12 months |
| CloudFront | 1TB data transfer, 10M requests | 12 months |
| Lambda | 1M requests, 400K GB-seconds | **Forever** |
| SES | 3,000 msgs/month (from EC2) | **Forever** |
| SNS | 1M notifications | **Forever** |
| CloudWatch | 10 alarms, basic metrics | **Forever** |
| Secrets Manager | 30-day trial | 30 days only |
| Route 53 | ❌ Not free | Pay per use |

---

## ⚡ Migration Priority Matrix

| Feature | Priority | Effort | Risk | Do First? |
|---------|---------|--------|------|-----------|
| Frontend → S3+CloudFront | 🔴 HIGH | Low | Low | ✅ YES — Week 1 |
| Backend → EC2 | 🔴 HIGH | Medium | Medium | ✅ YES — Week 1 |
| SES Email | Already on AWS | None | None | ✅ DONE |
| Large Files → Keep R2 | — | None | None | Keep R2 for now |
| Images → S3 (from Cloudinary) | 🟡 MEDIUM | Medium | Low | Month 2 |
| Database → RDS (from Supabase) | 🟡 MEDIUM | High | HIGH | Month 2-3 |
| Secrets Manager | 🟢 LOW | Low | Low | Week 1 alongside EC2 |
| SNS Notifications | 🟢 LOW | Medium | Low | When building FCM |
| WAF Security | 🟢 LOW | Low | Low | Before public launch |
| CloudWatch Monitoring | 🟡 MEDIUM | Low | None | With EC2 |

---

## 📐 Step-by-Step Quick Start (This Week)

### Day 1 (2 hours)
- [ ] Create AWS account + IAM user
- [ ] Set billing alert at $10/month
- [ ] Install AWS CLI + configure (ap-south-1)
- [ ] Request SSL cert in ACM for snaplocate.app

### Day 2 (3 hours)
- [ ] Build React app: `npm run build`
- [ ] Create S3 bucket + enable static hosting
- [ ] Upload dist/ to S3
- [ ] Create CloudFront distribution pointing to S3
- [ ] Point domain DNS to CloudFront

### Day 3 (4 hours)
- [ ] Launch EC2 t2.micro (Ubuntu)
- [ ] Install Node.js 20, PM2, Nginx
- [ ] rsync server/ files to EC2
- [ ] Configure .env on EC2
- [ ] Start app with PM2

### Day 4 (2 hours)
- [ ] Configure Nginx reverse proxy
- [ ] Run Certbot for HTTPS on api.snaplocate.app
- [ ] Update React .env.production with new API URL
- [ ] Rebuild + redeploy frontend
- [ ] Smoke test all API endpoints

### Day 5 (1 hour)
- [ ] Set up CloudWatch basic monitoring
- [ ] Set CPU/memory alarms
- [ ] Document deployment process

---

## 🔒 Security Checklist (Before Going Live)

- [ ] EC2 Security Group: port 22 restricted to your IP only
- [ ] RDS: NOT publicly accessible, only from EC2's Security Group
- [ ] S3: No public ACLs, only accessible via CloudFront OAC
- [ ] JWT_SECRET: Long, random, stored in Secrets Manager (not .env)
- [ ] Enable AWS CloudTrail (free, logs all API calls)
- [ ] Enable S3 versioning on media bucket
- [ ] Enable RDS automated backups (7-day retention, free)
- [ ] Rate limiting: Already in your code ✅
- [ ] Helmet.js: Already in your code ✅
- [ ] CORS: Update CLIENT_URL to snaplocate.app (not localhost)

---

## 🗺️ Architecture Decision: What to Keep vs Migrate

| Service | Decision | Reason |
|---------|----------|--------|
| **Supabase → RDS** | Migrate (Month 2-3) | Lock-in risk, compliance, cost at scale |
| **Cloudinary → S3** | Migrate (Month 2) | Consolidation, cost |
| **Cloudflare R2** | **KEEP** | Zero egress cost beats S3 for large files |
| **AWS SES** | Already AWS ✅ | No change |
| **JWT Auth** | Keep pattern | No change — your custom JWT is fine |
| **Express.js** | Keep (run on EC2) | No need for Lambda/serverless at this scale |

---

## 📞 Indian University Compliance Notes

When pitching to Indian university IT heads, emphasize:

- **AWS India Region (ap-south-1 Mumbai):** Data stays in India — addresses data localization concerns
- **ISO 27001 certified:** AWS has all major Indian compliance certs
- **UGC / AICTE guidelines:** AWS India has a compliance page for education
- **DPDP Act 2023 compliance:** AWS helps with India's Digital Personal Data Protection Act
- **Uptime SLA:** AWS EC2 SLA = 99.99% — better than any Supabase or self-hosted option

---

## 🎯 Summary: Recommended Migration Order

```
Week 1:  Frontend → S3 + CloudFront  ($0, zero risk, immediate win)
Week 1:  Backend → EC2 t2.micro      ($0 free tier, 12 months)
Week 2:  Monitoring → CloudWatch     ($0, basic is free)
Month 2: Images → S3                 (replace Cloudinary, save $99+/mo at scale)
Month 3: Database → RDS Aurora       (replace Supabase, full AWS stack)
Month 4: Secrets → Secrets Manager   ($4/mo, much more secure)
Phase 2: Notifications → SNS         (when building FCM feature)
Phase 3: WAF + Multi-AZ              (before enterprise sales)
```

**Total to run SnapLocate on AWS:**
- **Month 1-12:** ~$0.50/month (free tier)
- **Month 13+:** ~$43/month (3 universities scale)
- **Mature scale:** ~$343/month (20+ universities)

At SnapLocate's pricing model (₹100/student), **you break even on AWS costs at just 100 students** and achieve **85%+ gross margin** thereafter. ✅

---

*SnapLocate v1.0 | AWS Migration Roadmap | April 2026*
*Raushan Raj — Student Founder, Thapar University*
