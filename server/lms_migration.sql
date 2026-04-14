-- ============================================================
-- SnapLocate LMS v2 — Safe Migration (No organizations dependency)
-- Run this in: Supabase Dashboard → SQL Editor → Run
--
-- This is self-contained. It:
--   1. Creates the `organizations` table if it doesn't exist
--   2. Adds all LMS columns safely (IF NOT EXISTS)
--   3. Drops NOT NULL constraints that block Moodle sync
--   4. Creates student_sync_config table
-- ============================================================

-- ── STEP 1: Create organizations table (required FK target) ──────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE,
  domain      TEXT,
  logo_url    TEXT,
  plan        TEXT DEFAULT 'free',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Insert a default org if none exists (required so sync path can fall back to it)
INSERT INTO organizations (id, name, slug)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Thapar Institute of Engineering & Technology',
  'tiet'
)
ON CONFLICT (id) DO NOTHING;

-- ── STEP 2: Add moodle_course_id + progress to courses ──────────────────────
ALTER TABLE courses ADD COLUMN IF NOT EXISTS moodle_course_id BIGINT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS progress         INTEGER DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS synced_from      TEXT    DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS idx_courses_moodle_id
  ON courses(moodle_course_id)
  WHERE moodle_course_id IS NOT NULL;

-- ── STEP 3: Make course_enrollments.org_id nullable ─────────────────────────
-- Add the column first if it doesn't exist, then make it nullable
ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
-- Now safely drop NOT NULL (no-op if already nullable)
DO $$ BEGIN
  ALTER TABLE course_enrollments ALTER COLUMN org_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ── STEP 4: Fix assignments table for Moodle sync ───────────────────────────
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS moodle_id   BIGINT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS synced_from TEXT DEFAULT 'manual';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS org_id      UUID REFERENCES organizations(id);
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS faculty_id  UUID REFERENCES faculty_profiles(id);

-- Safely drop NOT NULL constraints (they may or may not exist)
DO $$ BEGIN
  ALTER TABLE assignments ALTER COLUMN faculty_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE assignments ALTER COLUMN org_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_assignments_moodle
  ON assignments(moodle_id)
  WHERE moodle_id IS NOT NULL;

-- ── STEP 5: Fix course_announcements for Moodle sync ────────────────────────
ALTER TABLE course_announcements ADD COLUMN IF NOT EXISTS moodle_id   BIGINT;
ALTER TABLE course_announcements ADD COLUMN IF NOT EXISTS synced_from TEXT DEFAULT 'manual';
ALTER TABLE course_announcements ADD COLUMN IF NOT EXISTS org_id      UUID REFERENCES organizations(id);
ALTER TABLE course_announcements ADD COLUMN IF NOT EXISTS faculty_id  UUID REFERENCES faculty_profiles(id);

-- Safely drop NOT NULL constraints
DO $$ BEGIN
  ALTER TABLE course_announcements ALTER COLUMN faculty_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE course_announcements ALTER COLUMN org_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_course_ann_moodle
  ON course_announcements(moodle_id)
  WHERE moodle_id IS NOT NULL;

-- Add posted_at: stores the REAL Moodle announcement timestamp (not sync time)
ALTER TABLE course_announcements ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;

-- ── STEP 6: Fix course_materials for Moodle sync ────────────────────────────
-- Create table if it doesn't exist at all
CREATE TABLE IF NOT EXISTS course_materials (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID REFERENCES organizations(id),
  course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  module_type  TEXT,
  file_url     TEXT,
  external_url TEXT,
  section_name TEXT,
  section_num  INTEGER DEFAULT 0,
  moodle_id    BIGINT,
  synced_from  TEXT DEFAULT 'manual',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- If table already exists, add missing columns safely
ALTER TABLE course_materials ADD COLUMN IF NOT EXISTS moodle_id   BIGINT;
ALTER TABLE course_materials ADD COLUMN IF NOT EXISTS synced_from TEXT DEFAULT 'manual';
ALTER TABLE course_materials ADD COLUMN IF NOT EXISTS org_id      UUID REFERENCES organizations(id);

-- Make org_id nullable if previously NOT NULL
DO $$ BEGIN
  ALTER TABLE course_materials ALTER COLUMN org_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_course_mat_moodle
  ON course_materials(moodle_id)
  WHERE moodle_id IS NOT NULL;

-- IMPORTANT: Change moodle_id to TEXT to support composite IDs for folder files
-- e.g. '12345_0', '12345_1' for files inside a folder module
DO $$ BEGIN
  ALTER TABLE course_materials ALTER COLUMN moodle_id TYPE TEXT USING moodle_id::TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_course_mat_course
  ON course_materials(course_id);

-- ── STEP 7: Create student_sync_config ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_sync_config (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id           UUID REFERENCES organizations(id),
  provider         TEXT NOT NULL DEFAULT 'moodle',
  base_url         TEXT NOT NULL,
  credentials_json JSONB NOT NULL DEFAULT '{}',
  last_synced_at   TIMESTAMPTZ,
  last_sync_status TEXT DEFAULT 'never',
  last_sync_log    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_sync_user ON student_sync_config(user_id);

-- ── STEP 8: Ensure courses.org_id column exists (schema.sql adds it via ALTER)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- ── DONE ─────────────────────────────────────────────────────────────────────
-- Verify with:
--   SELECT id, name FROM organizations;
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'courses' AND column_name IN ('moodle_course_id','progress');
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'student_sync_config';
