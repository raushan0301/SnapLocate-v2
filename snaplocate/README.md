# 🎓 SnapLocate — Campus OS

> A unified digital campus platform for students and faculty, designed to make university life smarter, faster, and more connected.

---

## 📖 What is SnapLocate?

**SnapLocate** is a full-featured **Campus Operating System** — a web application that serves as the single digital hub for an entire university campus. It provides two dedicated portals:

| Portal | Who it's for |
|---|---|
| 🎓 **Student OS** | Students navigating campus life |
| 🧑‍🏫 **Faculty OS** | Professors managing their academic presence |

The platform brings together everything that happens on a campus — schedules, classrooms, resources, professors, societies, and support — into one clean, modern interface. Think of it as the **app a university would have if it cared about design**.

---

## 🧭 Feature Overview

### 🎓 Student OS

| Page | What it does |
|---|---|
| **Dashboard** | Personalized overview — today's classes, announcements, quick links, and activity feed |
| **Classroom** | View enrolled courses, assignments, lecture notes, and class progress |
| **Professors** | Browse the faculty directory; view each professor's full profile — qualifications, research, timetable, office hours, publications |
| **Resources** | Access notes, lab materials, past papers, and course resources by subject/tab |
| **Calendar** | Visual weekly/monthly calendar showing classes, exams, and campus events |
| **Work-Space** | Personal workspace — notes, to-do lists, saved links, and study tools |
| **Market-Place** | Campus marketplace for buying/selling textbooks and items |
| **Lost & Found** | Report or search for lost items on campus |
| **Society** | Browse and join student clubs and societies |
| **Shops** | Discover campus canteens, bookstores, and shops with details |
| **Wi-Fi** | View campus Wi-Fi zones, passwords, and network coverage |
| **Campus-Support** | Access campus helpdesk, administrative services, and support contacts |
| **Settings** | Manage account preferences, notifications, and appearance |
| **Support** | Get help with the platform via FAQs and contact options |

---

### 🧑‍🏫 Faculty OS

| Page | What it does |
|---|---|
| **Dashboard** | At-a-glance teaching schedule, pending grades, student requests, and resource shortcuts |
| **Manage Profile** | Rich editable faculty profile with bio, qualifications, publications, awards, timetable, cabin location, office hours, research openings, and academic links |
| **Work-Space** | Faculty workspace — personal notes, file links, teaching schedule, and to-do lists |
| **Requests** | View and manage student requests (office hours, waivers, etc.) with approve/reject actions |

---

## 🏗️ Architecture

SnapLocate is a **Single Page Application (SPA)** built with modern frontend technologies:

```
snaplocate/
├── src/
│   ├── pages/
│   │   ├── student/          # All Student OS pages
│   │   ├── faculty/          # All Faculty OS pages
│   │   └── shared/           # Shared views (e.g. ProfessorProfile)
│   ├── components/           # Reusable layout components
│   │   ├── Sidebar.jsx       # Student sidebar navigation
│   │   ├── FacultySidebar.jsx
│   │   ├── Header.jsx
│   │   ├── FacultyHeader.jsx
│   │   ├── PageLayout.jsx
│   │   └── FacultyLayout.jsx
│   ├── Routes.jsx            # All app routing
│   ├── App.jsx
│   └── main.jsx
└── index.html
```

---

## 🛠️ Tech Stack

| Technology | Role |
|---|---|
| **React 19** | UI framework |
| **React Router DOM v7** | Client-side routing & navigation |
| **Vite 8** | Build tool & dev server |
| **Plus Jakarta Sans** | Primary typeface (Google Fonts) |
| **Inline CSS / Vanilla CSS** | Styling (no Tailwind utility classes in JSX) |
| **Lucide React** | Icon library (available, selectively used) |
| **Inline SVGs** | Custom branded icons throughout the UI |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
# Clone the repo
git clone <your-repo-url>
cd snaplocate

# Install dependencies
npm install

# Start the dev server
npm run dev

# Or on a specific port
npm run dev -- --port 5174
```

The app will be available at **http://localhost:5173** (or the port you specify).

### Build for Production

```bash
npm run build
```

Output is placed in the `dist/` folder.

---

## 🗺️ Navigation / Routes

| Route | Page |
|---|---|
| `/dashboard` | Student Dashboard |
| `/professors` | Faculty Directory |
| `/professors/:id` | Individual Professor Profile |
| `/classroom` | Classroom & Courses |
| `/resources` | Learning Resources |
| `/calendar` | Campus Calendar |
| `/workspace` | Student Workspace |
| `/marketplace` | Marketplace |
| `/lost-found` | Lost & Found |
| `/society` | Societies |
| `/shops` | Campus Shops |
| `/wifi` | Wi-Fi Info |
| `/campus-support` | Campus Support |
| `/settings` | Settings |
| `/support` | Help & Support |
| `/faculty/dashboard` | Faculty Dashboard |
| `/faculty/profile` | Faculty Profile Editor |
| `/faculty/workspace` | Faculty Workspace |
| `/faculty/requests` | Student Requests |

---

## 🎨 Design System

SnapLocate uses a consistent design language throughout:

- **Primary color:** `#4f46e5` (Indigo-600)
- **Background:** `#f4f6fb` (light blue-grey canvas)
- **Cards:** White `#ffffff` with `border: 1px solid #f1f5f9` and soft shadow
- **Border radius:** 18–20px for cards, 40px for pill inputs, 12–16px for inner elements
- **Font:** `'Plus Jakarta Sans', sans-serif` at weights 400 / 500 / 600 / 700 / 800
- **Status colors:** Green `#16a34a` · Amber `#d97706` · Red `#ef4444` · Slate `#64748b`

---

## 👤 User Roles

### Student
- Accesses the Student OS (routes under `/`)
- Can browse professors, view resources, manage their workspace
- Can browse campus services (shops, societies, Wi-Fi, support)

### Faculty / Professor
- Accesses the Faculty OS (routes under `/faculty/`)
- Can edit a rich public profile visible to students
- Can view and respond to student requests
- Can manage their workspace and teaching schedule

---

## 📌 Key Design Principles

1. **One portal per role** — Students and faculty each have a tailored experience
2. **Everything editable for faculty** — All profile sections (qualifications, publications, awards, timetable, office hours) are inline-editable
3. **No duplicate data** — Each piece of information lives in exactly one place
4. **Premium aesthetics** — Every page follows a consistent, modern visual language
5. **Zero dependencies on external UI kits** — All components are handcrafted in React with inline styles

---

## 📄 License

This project is proprietary to **SnapLocate**. All rights reserved.

---

<div align="center">

Built with ❤️ for smarter campuses · **SnapLocate** · Campus OS

</div>
