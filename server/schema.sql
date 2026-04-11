-- ============================================================
-- SnapLocate Campus OS — Supabase PostgreSQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
  avatar_url      TEXT,
  is_verified     BOOLEAN DEFAULT FALSE,
  otp             TEXT,
  otp_expires_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FACULTY PROFILES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS faculty_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  designation         TEXT,
  dept                TEXT,
  teacher_code        TEXT,
  phone               TEXT,
  dept_website        TEXT,
  linkedin            TEXT,
  bio                 TEXT,
  cabin_room          TEXT,
  cabin_building      TEXT,
  cabin_floor         TEXT,
  campus_section      TEXT,
  research_interests  TEXT[],
  lab_name            TEXT,
  lab_website         TEXT,
  academic_links      JSONB DEFAULT '[]'::jsonb,
  accepting_students  BOOLEAN DEFAULT TRUE,
  citations           INTEGER DEFAULT 0,
  publications_count  INTEGER DEFAULT 0,
  conferences         INTEGER DEFAULT 0,
  teaching_exp_years  INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ACADEMIC QUALIFICATIONS ────────────────────────────────
CREATE TABLE IF NOT EXISTS qualifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id  UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  degree      TEXT NOT NULL,
  institution TEXT NOT NULL,
  year        INTEGER,
  division    TEXT,
  cgpa        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── JOURNAL PUBLICATIONS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS publications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id  UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  journal     TEXT,
  year        INTEGER,
  doi         TEXT,
  file_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AWARDS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS awards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id  UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  org         TEXT,
  year        INTEGER,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TIMETABLE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timetable (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id  UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  day         TEXT NOT NULL,
  time_slot   TEXT NOT NULL,
  course      TEXT,
  location    TEXT,
  type        TEXT DEFAULT 'lecture'
);

-- ─── OFFICE HOURS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS office_hours (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id  UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  day         TEXT NOT NULL,
  slot        TEXT NOT NULL,
  mode        TEXT DEFAULT 'in-person',
  room_or_link TEXT
);

-- ─── COURSES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id      UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,
  name            TEXT NOT NULL,
  dept            TEXT,
  semester        TEXT,
  year            INTEGER,
  enrolled_count  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STUDENT REQUESTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  faculty_id  UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  detail      TEXT,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RESOURCES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID REFERENCES courses(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('note', 'lab', 'paper', 'doc', 'syllabus', 'pyq')),
  file_url    TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SOCIETIES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS societies (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  description  TEXT,
  cover_url    TEXT,
  category     TEXT,
  member_count INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MARKETPLACE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  price       NUMERIC NOT NULL,
  description TEXT,
  image_url   TEXT,
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'removed')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LOST & FOUND ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lost_found (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  status      TEXT DEFAULT 'lost' CHECK (status IN ('lost', 'found', 'resolved')),
  location    TEXT,
  date        DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SHOPS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shops (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  category    TEXT,
  description TEXT,
  image_url   TEXT,
  hours       TEXT,
  location    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CLASSROOMS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classrooms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  subtitle    TEXT,
  type        TEXT, -- 'LAB', 'LEC', 'GENERAL'
  status      TEXT DEFAULT 'AVAILABLE NOW',
  status_bg   TEXT DEFAULT '#22c55e',
  status_c    TEXT DEFAULT '#ffffff',
  block       TEXT,
  floor       TEXT,
  capacity    TEXT,
  indicator_bg TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (name)
);

-- ─── CLASSROOM TIMETABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS classroom_timetable (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id  UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  sub           TEXT,
  time_slot     TEXT NOT NULL,
  is_active     BOOLEAN DEFAULT FALSE,
  is_ongoing    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (classroom_id, time_slot)
);

-- ─── INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email            ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role             ON users(role);
CREATE INDEX IF NOT EXISTS idx_faculty_profiles_dept  ON faculty_profiles(dept);
CREATE INDEX IF NOT EXISTS idx_requests_student       ON requests(student_id);
CREATE INDEX IF NOT EXISTS idx_requests_faculty       ON requests(faculty_id);
CREATE INDEX IF NOT EXISTS idx_requests_status        ON requests(status);
CREATE INDEX IF NOT EXISTS idx_resources_type         ON resources(type);
CREATE INDEX IF NOT EXISTS idx_marketplace_status     ON marketplace(status);
CREATE INDEX IF NOT EXISTS idx_lost_found_status      ON lost_found(status);
CREATE INDEX IF NOT EXISTS idx_classrooms_name        ON classrooms(name);
CREATE INDEX IF NOT EXISTS idx_classroom_timetable_cid ON classroom_timetable(classroom_id);
