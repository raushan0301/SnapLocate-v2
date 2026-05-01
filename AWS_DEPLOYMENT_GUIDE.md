# 🚀 SnapLocate Campus OS — AWS Deployment Guide

This guide outlines the different ways to update your Frontend and Backend on AWS.

## 📌 Infrastructure Quick Reference
| Component | Resource Name / ID |
|-----------|--------------------|
| **Frontend S3 Bucket** | `snaplocate-frontend-prod` |
| **CloudFront Dist ID** | `E17ZW37K76S9SR` |
| **Backend EC2 IP** | `65.0.138.44` |
| **Frontend URL** | `https://d2oddc8yzycgfi.cloudfront.net` |

---

## 🛠 Method 1: Standard Deployment (Recommended)
Use this method for daily updates. It uses Git for the backend and the AWS CLI for the frontend.

### Step 1: Push Local Changes
```bash
git add .                  # Prepares all changed files for the update
git commit -m "Update"     # Saves the changes with a label
git push origin main       # Sends the . code to GitHub
```

### Step 2: Update Frontend (Local Mac Terminal)
```bash
cd snaplocate              # Enters the frontend folder
npm run build              # Compresses code for production (creates /dist folder)
aws s3 sync dist/ s3://snaplocate-frontend-prod --delete   # Uploads to AWS S3
aws cloudfront create-invalidation --distribution-id E17ZW37K76S9SR --paths "/*" # Clears cache so users see changes
```

### Step 3: Update Backend (AWS Console Terminal)
1. Go to **EC2 Console** > **Instances** > **Connect** > **EC2 Instance Connect**.
2. Run:
```bash
cd ~/server                # Enters the backend folder on the server
git pull origin main       # Downloads the latest code from GitHub
npm install                # Installs any new libraries/packages
pm2 restart snaplocate-api # Restarts the app to make changes live
```

---

## 🌐 Method 2: Website Console Only (No Local CLI)
Use this if you are on a different computer and don't have AWS CLI installed.

### Frontend
1. **Local**: Run `npm run build` to get the `dist` folder. Zip the **contents** of `dist`.
2. **AWS S3 Console**: Go to `snaplocate-frontend-prod` bucket.
3. **Upload**: Upload the zipped files and overwrite existing ones.
4. **CloudFront Console**: Go to `E17ZW37K76S9SR` > **Invalidations** > **Create Invalidation** > Path: `/*`.

### Backend
1. Use **EC2 Instance Connect** as shown in Method 1.

---

## 🔑 Method 3: Remote Terminal (SSH / rsync)
Use this if you have your `.pem` key file on your Mac.

```bash
# Sync files directly without using Git on the server
rsync -avz -e "ssh -i snaplocate-key.pem" \
  --exclude='node_modules' --exclude='.env' \
  server/ ubuntu@65.0.138.44:/home/ubuntu/server/

# Restart remotely
ssh -i snaplocate-key.pem ubuntu@65.0.138.44 "pm2 restart snaplocate-api"
```

---

## 🗄 Database Migrations
Always apply database changes **after** the backend code is updated but **before** testing features.
1. Open **Supabase Dashboard** > **SQL Editor**.
2. Copy the content of your local `.sql` migration file.
3. Paste and **Run**.

---

## 📋 Useful Troubleshooting Commands
| Task | Command (on EC2) | Description |
|------|------------------|-------------|
| **View Logs** | `pm2 logs snaplocate-api` | See real-time errors or console outputs |
| **Clear Logs** | `pm2 flush` | Deletes old logs to make it easier to read new ones |
| **Check Process**| `pm2 status` | Check if the app is Online or has crashed |
| **Edit Config** | `nano .env` | Edit your keys, secrets, and database URLs |
| **Check Port** | `sudo netstat -tulpn` | Verify if the server is listening on Port 3001 |
| **Clean Extra Folders** | `rm -rf snaplocate` | Removes unused frontend files from the server |

---
*Created: April 2026 | SnapLocate v2.0*
