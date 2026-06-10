<div align="center">

# 📍 SnapLocate

### *Just ek click, sab kuch quick!*

**Your campus compass — find the right people, places, and paths to grow.**

[![Firebase](https://img.shields.io/badge/Firebase-Active_Backend-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Firestore](https://img.shields.io/badge/Firestore-Live_Database-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/products/firestore)
[![Amazon S3](https://img.shields.io/badge/Amazon_S3-Provisioned-FF9900?style=for-the-badge&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)
[![EC2](https://img.shields.io/badge/Amazon_EC2-Provisioned-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white)](https://aws.amazon.com/ec2/)
[![HTML5](https://img.shields.io/badge/HTML5-Structure-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-Styling-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-Logic-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

</div>

---

## 📖 Overview

**SnapLocate** is a fast, lightweight campus information portal built for university students. It aggregates everything a student needs — professors, classrooms, academic resources, societies, Wi-Fi hotspots, and campus support — into a single web app with a one-click experience.

> **Current Infrastructure State:**
> The app's **active backend is Firebase** (Firestore database, Firebase Auth, Firebase Analytics).
> AWS infrastructure (S3, EC2, CloudFront, CloudWatch, IAM) has been **provisioned** in `ap-south-1` (Mumbai) and is ready — but the codebase is **not yet migrated** to AWS.

---

## 🏗️ Infrastructure Status

| Layer | Current (Live) | Planned (AWS) |
|---|---|---|
| **Frontend Hosting** | Firebase Hosting | Amazon S3 + CloudFront |
| **Database** | Cloud Firestore | Amazon DynamoDB / EC2 |
| **Auth** | Firebase Auth | AWS Cognito / EC2 |
| **Analytics** | Firebase Analytics | Amazon CloudWatch |
| **Functions** | — | AWS Lambda |
| **Monitoring** | Firebase Performance | Amazon CloudWatch |

---

## ☁️ Current Architecture (Firebase — Active)

```
                    ┌─────────────────────────────────────┐
                    │          User's Browser             │
                    └───────────────┬─────────────────────┘
                                    │  HTTPS
                    ┌───────────────▼─────────────────────┐
                    │       Firebase Hosting (CDN)        │
                    │  Global edge · HTTPS · URL rewrites │
                    └───────────────┬─────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
  ┌────────▼────────┐    ┌──────────▼──────────┐   ┌────────▼──────────┐
  │  Cloud Firestore│    │   Firebase Auth     │   │ Firebase Analytics│
  │  professors     │    │  Admin UID gating   │   │  + Performance    │
  │  classrooms     │    │  Contact form valid │   │  Monitoring       │
  │  academic       │    └─────────────────────┘   └───────────────────┘
  │  societies      │
  │  messages       │
  └─────────────────┘
```

---

## 🟡 AWS Infrastructure (Provisioned — Not Yet Integrated)

The following AWS services are set up in `ap-south-1` (Asia Pacific, Mumbai) and ready for the upcoming migration:

| Service | Status | Details |
|---|---|---|
| **Amazon S3** | ✅ Provisioned | Bucket: `snaplocate-frontend-prod` · ap-south-1 |
| **Amazon CloudFront** | ✅ Provisioned | CDN distribution ready |
| **Amazon EC2** | ✅ Running | 1 instance · 1 key pair · 2 security groups · 1 volume |
| **Amazon CloudWatch** | ✅ Active | `EC2-CPU-Spike-Warning` alarm configured |
| **AWS IAM** | ✅ Configured | 1 user · 3 roles · MFA on root · no root access keys |
| **AWS Lambda** | 🔜 Planned | Not yet configured |
| **Amazon DynamoDB** | 🔜 Planned | Not yet configured |

AWS infrastructure has been configured and prepared for future integration.
While SnapLocate currently runs on Firebase, I have already configured and prepared AWS services including S3, CloudFront, EC2, CloudWatch, and IAM to support future scalability and migration requirements.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧑‍🏫 **Professor Finder** | Search professors by name, department, or specialization. View cabin info, email, and availability. |
| 🏫 **Classroom Locator** | Find any classroom by code and get step-by-step navigation instructions. |
| 📚 **Academic Resources** | Browse resources filtered by year and branch. Rate and view the most helpful materials. |
| 📅 **Academic Calendar** | View semester calendar, important dates, and exam schedules. |
| 📡 **Wi-Fi Hotspots** | Discover campus Wi-Fi hotspot locations and coverage zones. |
| 🤝 **Campus Support** | Access student support services, departments, and help desk contacts. |
| 🎭 **Societies** | Explore all registered campus clubs and societies with details and contact info. |
| 📬 **Contact / Help Desk** | Submit queries via a validated contact form (stored in Firestore). |
| ℹ️ **About** | Learn about the project and its creators. |
| 🔴 **404 Page** | Custom error page for unknown routes. |

---

## 🗂️ Project Structure

```
Snaplocate/
├── Public/                          # Static web root
│   ├── index.html                   # Landing page
│   ├── favicon.png                  # App icon
│   ├── image.webp                   # Hero/banner image
│   │
│   ├── pages/                       # Sub-pages (HTML)
│   │   ├── professor.html
│   │   ├── classroom.html
│   │   ├── academic.html
│   │   ├── academic-calendar.html
│   │   ├── hotspot.html
│   │   ├── campus-support.html
│   │   ├── societies.html
│   │   ├── contact.html
│   │   ├── about.html
│   │   └── 404.html
│   │
│   ├── css/                         # Stylesheets (per-page + shared)
│   │   ├── style.css                # Global styles, layout, navbar, footer
│   │   ├── sidebar.css
│   │   ├── professorPage.css
│   │   ├── classroompage.css
│   │   ├── academic.css
│   │   ├── societies.css
│   │   ├── campus-support.css
│   │   ├── contact.css
│   │   ├── about.css
│   │   ├── hotspot.css
│   │   └── safari-fix.css
│   │
│   ├── js/
│   │   ├── core/
│   │   │   ├── firebase-config.template.js  # ⚠️ Template — copy & fill with real keys
│   │   │   ├── script.js            # Professors & classrooms — Firestore queries
│   │   │   ├── analytics.js         # Firebase Analytics events
│   │   │   └── performance-monitor.js  # Firebase Performance Monitoring
│   │   │
│   │   ├── pages/
│   │   │   ├── academic.js          # Academic resources — Firestore
│   │   │   ├── societies.js         # Societies — Firestore
│   │   │   ├── campus-support.js    # Campus support — Firestore
│   │   │   ├── contact.js           # Contact form — Firestore write
│   │   │   └── hotspot.js
│   │   │
│   │   ├── components/
│   │   │   └── sidebar.js           # Firebase Auth state · sidebar toggle
│   │   │
│   │   └── workers/
│   │       ├── sw.js                # Service Worker offline cache
│   │       └── sw-register.js       # Service Worker registration
│   │
│   └── assets/
│       ├── images/                  # WebP optimised images
│       └── verification/            # 🔒 Site verification files — gitignored
│
│── firebase.json                    # Firebase Hosting config (rewrites, headers, cache)
│── firestore.rules                  # 🔒 Firestore security rules — gitignored
├── firestore.indexes.json           # 🔒 Firestore indexes — gitignored
├── .firebaserc                      # 🔒 Firebase project alias — gitignored
└── package.json                     # Node.js manifest
```

---

## 🔥 Firestore Collections (Live)

| Collection | Access Rules |
|---|---|
| `professors` | Public read · Admin write |
| `classrooms` | Public read · Admin write |
| `academic` | Public read · Admin write · Public rating/view update |
| `societies` | Public read · Admin write |
| `messages` | Public create (validated) · No public read/edit/delete |

> Admin access is gated by a specific Firebase Auth UID checked in `firestore.rules`.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Firebase CLI](https://firebase.google.com/docs/cli) — `npm install -g firebase-tools`
- A Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/SnapLocate.git
git checkout -b main
```

### 2. Configure Firebase

Copy the template config and fill in your Firebase credentials:

```bash
cp Public/js/core/firebase-config.template.js Public/js/core/firebase-config.js
```

Edit `Public/js/core/firebase-config.js` and replace all `YOUR_*` placeholders with your real Firebase project values from the [Firebase Console](https://console.firebase.google.com/) → Project Settings → Web App → Config.

> ⚠️ `firebase-config.js` is **gitignored**. Never commit it.

### 3. Firebase Login & Deploy

```bash
firebase login
firebase use --add                        # Select your project
firebase deploy --only firestore:rules    # Deploy Firestore rules
firebase deploy --only hosting            # Deploy frontend
```

### 4. Local Development

```bash
firebase serve --only hosting
# App available at http://localhost:5000
```

---

## 🌐 URL Routing

Firebase Hosting rewrites handle clean URL routing:

| URL | Page |
|---|---|
| `/` | `index.html` |
| `/professor` | `pages/professor.html` |
| `/classroom` | `pages/classroom.html` |
| `/academic` | `pages/academic.html` |
| `/academic-calendar` | `pages/academic-calendar.html` |
| `/hotspot` | `pages/hotspot.html` |
| `/campus-support` | `pages/campus-support.html` |
| `/society` | `pages/societies.html` |
| `/contact` | `pages/contact.html` |
| `/about` | `pages/about.html` |

---

## 🔒 Security & Best Practices

- **Firebase config** — gitignored; only the `.template` version is committed
- **Firestore rules** — enforce least-privilege per collection; admin UID gated
- **Contact messages** — validated on write via Firestore security rules
- **Firebase Auth** — admin UID check for write operations
- **AWS credentials** — stored in `~/.aws/` via CLI, never committed
- **EC2 key pair (`.pem`)** — stored locally only, gitignored
- **Security headers** via `firebase.json`: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`
- **Cache-Control** per asset type (images: 1 year, JS/CSS: 1 week, HTML: no-cache)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Copy and configure `firebase-config.js` from the template
4. Commit: `git commit -m "feat: add your feature"`
5. Push and open a Pull Request

> **Never commit:** `firebase-config.js`, `.firebaserc`, `firestore.rules`, `*.pem`, `.env`, `_dev_files/`, or `Public/assets/verification/`

---

## 📄 License

This project is licensed under the **ISC License**.

---

<div align="center">

Made with ❤️ for campus life · © 2025 SnapLocate

*"Your campus compass — find the right people, places, and paths to grow"*

</div>
