# CLAUDE.md — SnapLocate Campus OS
> This file gives Claude Code full context about SnapLocate.
> Place in the ROOT of the project. Claude reads this automatically on every prompt.
> Last updated: April 2026 | SnapLocate v1.0 → v2 transition

---

## 1. What is SnapLocate

SnapLocate is a **unified Campus Operating System** for Indian universities.
It replaces 8–14 disconnected tools (WebKiosk, Moodle, Oracle ERP, WhatsApp groups,
paper noticeboards) with ONE platform, ONE login, ONE experience.

**It is not an LMS. It is not an ERP. It is the layer on top of all of them.**

- Built by: Raushan Raj (student founder, Thapar University)
- Stage: Live v1.0 prototype → Improving + adding features (current phase)
- Goal: Multi-university SaaS product (₹100/student/year pricing model)
- Target market: Indian universities (1,000+ potential customers)

---

## 2. Tech Stack — Exact Versions

| Layer | Technology | Version / Notes |
|-------|------------|-----------------|
| Frontend | React | v19 |
| Routing | React Router | v7 |
| Build Tool | Vite | v8 |
| Styling | Tailwind CSS | v4 |
| Backend | Node.js + Express | Express v4 |
| Database | Supabase | PostgreSQL under the hood |
| Auth | JWT | 7-day expiry + OTP via AWS SES |
| File Storage | Cloudinary | Images and PDFs |
| File Storage (large) | Cloudflare R2 | Large files |
| Validation | Zod | Server-side only |
| Security | Helmet, CORS, bcryptjs, rate limiting | All active |

---

## 3. Project Folder Structure

```
SnapLocateV2/
├── CLAUDE.md                  ← YOU ARE HERE
├── snaplocate/                # React SPA (~11,386 LOC, 31 pages)
│   ├── pages/
│   │   ├── student/           # All student-facing pages
│   │   ├── faculty/           # All faculty-facing pages
│   │   ├── admin/             # All admin-facing pages
│   │   └── auth/              # Login, Register, OTP Verify
│   ├── components/
│   │   ├── Layout.jsx         # Main layout wrapper
│   │   ├── Sidebar.jsx        # Role-aware sidebar
│   │   ├── Header.jsx         # Top navigation
│   │   └── ProtectedRoute.jsx # Auth + role guard component
│   ├── context/
│   │   └── AuthContext.jsx    # Global auth state (user, role, token)
│   ├── hooks/
│   │   ├── useApi.js          # GET data fetching hook
│   │   └── useMutation.js     # POST/PUT/DELETE hook
│   └── lib/
│       ├── api.js             # Central fetch wrapper (adds JWT header)
│       └── supabase.js        # Supabase client (frontend)
│
└── server/                    # Express API (~2,782 LOC)
    ├── routes/                # 20+ route files
    │   ├── auth.js            # Register, OTP, Login, Refresh
    │   ├── faculty.js         # Faculty profile CRUD
    │   ├── students.js        # Student profile CRUD
    │   └── [18+ more...]      # marketplace, tickets, classroom, etc.
    ├── middleware/
    │   ├── auth.js            # JWT verify + role injection
    │   ├── rateLimiter.js     # Express rate limiting
    │   ├── errorHandler.js    # Global error handler
    │   └── multer.js          # File upload middleware
    └── lib/
        ├── supabase.js        # Supabase admin client (service role)
        ├── cloudinary.js      # Cloudinary upload helper
        ├── r2.js              # Cloudflare R2 upload helper
        └── ses.js             # AWS SES email sender
```

---

## 4. Auth System — Understand Before Touching Anything

```
Register (student / faculty / admin)
        ↓
OTP sent via AWS SES (ses.js)
        ↓
Verify OTP → JWT issued (7-day expiry)
        ↓
JWT stored in localStorage
        ↓
Every request → Authorization: Bearer <token>
        ↓
server/middleware/auth.js verifies JWT → injects req.user
        ↓
Role middleware guards routes:
  requireStudent  → only role === 'student'
  requireFaculty  → only role === 'faculty'
  requireAdmin    → only role === 'admin'
```

**Rules:**
- NEVER skip auth middleware on any protected route
- NEVER trust role from the frontend — always verify from JWT on server
- NEVER expose the Supabase service role key to the frontend
- JWT is stored in localStorage — keep this consistent, do not change to cookies without full audit

---

## 5. Three OS Architecture — Core Concept

SnapLocate is THREE distinct operating systems sharing ONE backend:

```
┌──────────────────────────────────────────────────┐
│               SnapLocate Campus OS               │
├────────────────┬──────────────────┬──────────────┤
│   Student OS   │   Faculty OS     │   Admin OS   │
├────────────────┴──────────────────┴──────────────┤
│          Express API + Supabase Backend          │
│     (Auth · Upload · Notifications · Routes)     │
└──────────────────────────────────────────────────┘
```

Each OS has completely different pages/UI, sidebar items, API routes, and data access.
They share the same JWT auth, Supabase database, file storage, and AuthContext.

---

## 6. User Roles & Permissions

| Role | Can Access | Cannot Access |
|------|------------|---------------|
| `student` | Student OS pages, own profile, marketplace, workspace | Faculty OS, Admin OS |
| `faculty` | Faculty OS pages, own profile, office hours, requests | Student OS internals, Admin OS |
| `admin` | Admin OS, all users, all stats, verification controls | (Full access within org) |
| `super_admin` | Everything across all organizations | — (founder only) |

When writing any new feature, always ask: which role uses this? Then add the correct middleware and scope DB queries to that user's org_id.

---

## 7. Database Rules — Non-Negotiable

### Multi-Tenancy (org_id)
- Every table MUST have `org_id UUID` column
- Every query MUST filter by `org_id` from `req.user.org_id`
- Never return data across organizations
- The `organizations` table is the master tenant registry

### Standard Response Format — Always Use These
```js
// Success
res.json({ success: true, data: { ... } })

// Error
res.status(4xx).json({ success: false, error: "Human readable message" })

// List with pagination
res.json({ success: true, data: [...], total: 100, page: 1 })
```

### Always async/await — Never callbacks or .then()
```js
// CORRECT
const { data, error } = await supabase.from('table').select('*').eq('org_id', req.user.org_id)

// WRONG
supabase.from('table').select('*').then(res => { ... })
```

---

## 8. All Features — Currently Built

### Student OS
| Feature | Description |
|---------|-------------|
| Dashboard | Live greeting, today's schedule, pending requests, quick access |
| Classroom Finder | Search by room/block/capacity, live timetable per room |
| Professor Directory | Faculty profiles, verified badges, research, office hours, appointment booking |
| Workspace | Weekly timetable grid, notes (tags+colors), tasks+subtasks, file uploads, quick links |
| Campus Marketplace | Peer-to-peer buy/sell, image listings, category filter, verified users only |
| Lost & Found | Post and search lost items on campus |
| Societies | Campus club/society directory |
| Wi-Fi Info | Campus Wi-Fi credentials and help |
| Support Tickets | Raise tickets, track status, get resolution |

### Faculty OS
| Feature | Description |
|---------|-------------|
| Faculty Profile | Publications, awards, qualifications, bio, research interests |
| Office Hours | Set in-person/online hours, manage availability |
| Request Management | View and respond to student appointment requests |
| Faculty Workspace | Notes, tasks, personal productivity |

### Admin OS
| Feature | Description |
|---------|-------------|
| User Management | View all students and faculty, manage accounts |
| Stats Dashboard | Real-time platform analytics |
| Faculty Verification | Grant/revoke verified badge |
| Campus Resource Management | Manage classrooms, announcements |

---

## 9. Coding Standards — Follow Always

### React Frontend
```jsx
// Functional components only — no class components
// useApi() for GET requests — never raw fetch inside components
// useMutation() for POST/PUT/DELETE
// AuthContext for user/role — never pass as props down the tree
// Tailwind CSS v4 classes only — no inline styles, no CSS modules
// React Router v7 patterns for all navigation
```

### Express Backend
```js
// Every route structure:
router.get('/endpoint', verifyToken, requireStudent, async (req, res) => {
  try {
    // req.user = { id, role, org_id, email }
    const { data, error } = await supabase
      .from('table')
      .select('*')
      .eq('org_id', req.user.org_id)  // ALWAYS scope to org_id

    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})
```

### Validation — Always Zod on Server
```js
const schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
})
const parsed = schema.safeParse(req.body)
if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })
```

---

## 10. What Claude Should ALWAYS Do

1. Add `org_id` filter to every Supabase query — no exceptions
2. Add auth middleware to every new route — no unprotected routes
3. Use `useApi` / `useMutation` hooks in frontend — never raw fetch
4. Use Zod validation for every new POST/PUT route body
5. Use Tailwind CSS v4 for all styling
6. Match existing response format: `{ success: true/false, data/error }`
7. Use async/await everywhere
8. Flag when a new table needs RLS policy written
9. Ask which role a feature is for before writing any code
10. Scope everything to `req.user.org_id` — multi-tenancy is always on

---

## 11. What Claude Should NEVER Do

- Skip or bypass auth middleware on any route
- Skip org_id scoping on any database query
- Use callbacks or .then() — async/await only
- Expose SUPABASE_SERVICE_ROLE_KEY in any frontend file
- Introduce new state management libraries (no Redux, Zustand, etc.)
- Rewrite working features from scratch — improve incrementally
- Change JWT-in-localStorage pattern without explicit instruction
- Use Cloudinary for large files — those go to Cloudflare R2
- Create new UI components without checking /components folder first
- Suggest removing multi-tenant org_id support from any table

---

## 12. Upcoming Features (Prioritized Roadmap)

### Immediate — Improvement Phase
- [ ] Mobile responsiveness / PWA across all 31 pages
- [ ] Push notifications via FCM
- [ ] org_id across all remaining tables (multi-tenant completion)
- [ ] Analytics integration (PostHog free tier)
- [ ] Performance optimization on existing features

### Phase 2 — New Modules
- [ ] Attendance Tracking (faculty marks, student sees live — replaces WebKiosk)
- [ ] Hostel Management (room allotment, maintenance, warden comms)
- [ ] Placement Cell Hub (company visits, applications, resume builder)
- [ ] Library Integration (book availability, reservation, overdue alerts)
- [ ] Exam Scheduler (date sheet, hall ticket download)
- [ ] Alumni Network (verified mentorship marketplace)
- [ ] AI Study Assistant (inside Workspace — summarize notes, generate flashcards)

### Phase 3 — Platform Scale
- [ ] Native mobile app (React Native — iOS + Android)
- [ ] Subdomain routing (thapar.snaplocate.in, bits.snaplocate.in)
- [ ] White-label themes per university (colors, logos)
- [ ] Super admin dashboard (cross-university visibility for founder)

---

## 13. Multi-Tenancy Schema — Reference

```sql
-- Master tenant table
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,          -- 'thapar', 'bits-pilani'
  logo_url TEXT,
  primary_color TEXT DEFAULT '#4f46e5',
  active_modules JSONB DEFAULT '{"marketplace": true, "lost_found": true}',
  max_students INT DEFAULT 5000,
  subscription_tier TEXT DEFAULT 'starter',  -- starter | campus | enterprise
  billing_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Every new table must include this column:
org_id UUID NOT NULL REFERENCES organizations(id)

-- Admin hierarchy:
-- super_admin (founder) → campus_admin (IT Head) → faculty → student
```

---

## 14. Infrastructure & Services

| Service | Purpose | Notes |
|---------|---------|-------|
| AWS SES | OTP emails | Active — ses.js |
| Cloudinary | Images and PDFs | Active — cloudinary.js |
| Cloudflare R2 | Large files (>10MB) | Active — r2.js |
| Supabase | PostgreSQL database | Service key = server only |
| FCM | Push notifications | Planned — not yet built |

---

## 15. Business Context

- **Pricing:** ₹100/student/year | Starter ₹2,499/mo | Campus ₹7,999/mo | Enterprise ₹19,999/mo
- **TAM:** 1,000+ Indian universities × ₹5L avg = ₹500 Crore market
- **True competition:** WebKiosk, WhatsApp groups, paper noticeboards — NOT Blackboard or Canvas
- **Key moat:** Verified trust network + campus data flywheel + high switching cost
- **Current milestone:** Pilot at Thapar → 3 more universities → ₹15L ARR by Month 12
- **Primary user:** Students — always optimize for mobile-first, fast loads, zero friction

---

*SnapLocate v1.0 | Thapar University | Raushan Raj | April 2026*
*Update this file whenever major architecture or stack decisions are made.*
