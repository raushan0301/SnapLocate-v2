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
  org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
  course_id   UUID REFERENCES courses(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('note', 'lab', 'paper', 'doc', 'syllabus', 'pyq')),
  description TEXT,
  file_url    TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for existing rows (run once if upgrading from v1):
-- ALTER TABLE resources ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
-- ALTER TABLE resources ADD COLUMN IF NOT EXISTS description TEXT;

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
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id       UUID,
  reporter_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  image_url    TEXT,
  status       TEXT DEFAULT 'lost' CHECK (status IN ('lost', 'found', 'resolved')),
  category     TEXT DEFAULT 'other'
    CHECK (category IN ('electronics','keys','id_card','clothing','books','bag','wallet','jewellery','sports','other')),
  location     TEXT,
  contact_info TEXT,
  date         DATE,
  resolved_at  TIMESTAMPTZ,
  resolved_by  UUID REFERENCES users(id),
  expires_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '60 days'),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for existing rows (run once if upgrading from v1):
-- Note: org_id is a plain UUID (no FK) since organizations table is not yet created
-- ALTER TABLE lost_found ADD COLUMN IF NOT EXISTS org_id UUID;
-- ALTER TABLE lost_found ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';
-- ALTER TABLE lost_found ADD COLUMN IF NOT EXISTS contact_info TEXT;
-- ALTER TABLE lost_found ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
-- ALTER TABLE lost_found ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES users(id);
-- ALTER TABLE lost_found ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '60 days');

-- ─── LOST & FOUND CLAIMS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS lost_found_claims (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id     UUID NOT NULL REFERENCES lost_found(id) ON DELETE CASCADE,
  claimer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  proof_url   TEXT,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, claimer_id)
);

-- ─── LOST & FOUND CHAT ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS lf_conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id         UUID NOT NULL REFERENCES lost_found(id) ON DELETE CASCADE,
  participant_a   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- reporter
  participant_b   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- other party
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, participant_a, participant_b)
);

CREATE TABLE IF NOT EXISTS lf_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES lf_conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL CHECK (char_length(content) <= 1000),
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lf_conv_item  ON lf_conversations(item_id);
CREATE INDEX IF NOT EXISTS idx_lf_conv_pa    ON lf_conversations(participant_a);
CREATE INDEX IF NOT EXISTS idx_lf_conv_pb    ON lf_conversations(participant_b);
CREATE INDEX IF NOT EXISTS idx_lf_msg_conv   ON lf_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_lf_msg_sender ON lf_messages(sender_id);

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

-- ─── ANNOUNCEMENTS ───────────────────────────────────────────
-- Run this in your Supabase SQL editor to enable the Broadcast feature
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'urgent')),
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- ─── AUDIT LOG ───────────────────────────────────────────────
-- Run this in your Supabase SQL editor to enable the Audit Log feature
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name  TEXT NOT NULL DEFAULT 'System',
  action      TEXT NOT NULL,   -- e.g. 'CREATE_USER', 'DELETE_USER', 'REMOVE_LISTING'
  target_type TEXT,            -- 'user', 'listing', 'post', 'resource', 'announcement'
  target_id   UUID,
  target_name TEXT,            -- human-readable label of what was acted on
  meta        JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created    ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor      ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action     ON audit_log(action);

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  link       TEXT,                        -- optional frontend route to navigate to
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ── Student Faculty Advisors ──────────────────────────────────────────────────
-- Admin assigns one faculty advisor per student (one-to-one per student)
CREATE TABLE IF NOT EXISTS student_advisors (
  student_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  faculty_profile_id UUID NOT NULL REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  subject            TEXT,            -- optional: e.g. "Class Advisor - CSE-4A"
  assigned_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_advisors_faculty ON student_advisors(faculty_profile_id);

-- ============================================================
-- SnapLocate v2 — LMS + WebKiosk Extension Tables
-- Run this block after the base schema above
-- ============================================================

-- ─── ORG_ID MIGRATION FOR EXISTING TABLES ───────────────────
-- courses table is missing org_id — add it before LMS tables reference it
ALTER TABLE courses ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_courses_org ON courses(org_id);

-- ─── STUDENT PROFILES ───────────────────────────────────────
-- Extends users table with academic registration info (WebKiosk replacement)
CREATE TABLE IF NOT EXISTS student_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  enrollment_no   TEXT,
  roll_no         TEXT,
  branch          TEXT,
  dept            TEXT,
  semester        INTEGER,
  section         TEXT,
  batch_year      INTEGER,
  current_cgpa    NUMERIC(4,2),
  synced_from     TEXT DEFAULT 'manual',
  last_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_user   ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_org    ON student_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_enroll ON student_profiles(enrollment_no);

-- ─── COURSE ENROLLMENTS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_enrollments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  UNIQUE (course_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_org     ON course_enrollments(org_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course  ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);

-- ─── ASSIGNMENTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id        UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  faculty_id       UUID NOT NULL REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  due_date         TIMESTAMPTZ NOT NULL,
  max_marks        NUMERIC(6,2) DEFAULT 100,
  file_url         TEXT,
  attachment_type  TEXT DEFAULT 'none' CHECK (attachment_type IN ('pdf', 'image', 'doc', 'link', 'none')),
  is_published     BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_org    ON assignments(org_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due    ON assignments(due_date);

-- ─── ASSIGNMENT SUBMISSIONS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_url      TEXT,
  text_content  TEXT,
  submitted_at  TIMESTAMPTZ DEFAULT NOW(),
  marks         NUMERIC(6,2),
  feedback      TEXT,
  status        TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'late', 'graded', 'returned')),
  graded_by     UUID REFERENCES users(id),
  graded_at     TIMESTAMPTZ,
  UNIQUE (assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_org        ON assignment_submissions(org_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student    ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status     ON assignment_submissions(status);

-- ─── GRADES (EXAM MARKS) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS grades (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  exam_type   TEXT NOT NULL CHECK (exam_type IN ('mid', 'end', 'internal', 'quiz', 'practical')),
  marks       NUMERIC(6,2) NOT NULL,
  max_marks   NUMERIC(6,2) NOT NULL DEFAULT 100,
  remarks     TEXT,
  entered_by  UUID REFERENCES users(id),
  synced_from TEXT DEFAULT 'manual',
  last_synced_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, course_id, exam_type)
);

CREATE INDEX IF NOT EXISTS idx_grades_org     ON grades(org_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_course  ON grades(course_id);

-- ─── COURSE ANNOUNCEMENTS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS course_announcements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  faculty_id  UUID NOT NULL REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_pinned   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_ann_org    ON course_announcements(org_id);
CREATE INDEX IF NOT EXISTS idx_course_ann_course ON course_announcements(course_id);

-- ─── ATTENDANCE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by   UUID REFERENCES users(id),
  synced_from TEXT DEFAULT 'manual',
  last_synced_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (course_id, student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_org     ON attendance(org_id);
CREATE INDEX IF NOT EXISTS idx_attendance_course  ON attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date    ON attendance(date);

-- ─── EXAM SCHEDULE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exam_schedule (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id        UUID REFERENCES courses(id) ON DELETE SET NULL,
  course_code      TEXT,
  course_name      TEXT,
  exam_type        TEXT NOT NULL CHECK (exam_type IN ('mid', 'end', 'internal', 'quiz', 'practical', 'supplementary')),
  exam_date        DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME,
  venue            TEXT,
  duration_mins    INTEGER,
  seating_plan_url TEXT,
  synced_from      TEXT DEFAULT 'manual',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_schedule_org    ON exam_schedule(org_id);
CREATE INDEX IF NOT EXISTS idx_exam_schedule_date   ON exam_schedule(exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_schedule_course ON exam_schedule(course_id);

-- ─── FEE RECORDS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  semester        INTEGER NOT NULL,
  fee_type        TEXT DEFAULT 'tuition' CHECK (fee_type IN ('tuition', 'hostel', 'transport', 'misc', 'total')),
  amount_due      NUMERIC(12,2) NOT NULL,
  amount_paid     NUMERIC(12,2) DEFAULT 0,
  due_date        DATE,
  paid_at         TIMESTAMPTZ,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'waived')),
  receipt_url     TEXT,
  transaction_ref TEXT,
  synced_from     TEXT DEFAULT 'manual',
  last_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_records_org     ON fee_records(org_id);
CREATE INDEX IF NOT EXISTS idx_fee_records_student ON fee_records(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_records_status  ON fee_records(status);

-- ─── EXTERNAL SYNC CONFIG ───────────────────────────────────
CREATE TABLE IF NOT EXISTS external_sync_config (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL CHECK (provider IN ('webkiosk', 'moodle', 'oracle_erp')),
  base_url         TEXT NOT NULL,
  credentials_json JSONB NOT NULL DEFAULT '{}',
  sync_modules     JSONB DEFAULT '{"attendance": true, "grades": true, "fees": true, "exam_schedule": true}',
  is_active        BOOLEAN DEFAULT TRUE,
  last_synced_at   TIMESTAMPTZ,
  last_sync_status TEXT DEFAULT 'never',
  last_sync_log    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (org_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_sync_config_org ON external_sync_config(org_id);
