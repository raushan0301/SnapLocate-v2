-- ============================================================
-- SnapLocate Native LMS — Complete Migration (Phase 1 of 6)
-- All tables use the lms_ prefix.
-- SAFE: Zero impact on existing Moodle sync tables/routes.
--   → Does NOT touch: courses, course_enrollments, course_materials,
--     course_announcements, assignments, student_sync_config
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- SECTION 1: Course Architecture
-- ──────────────────────────────────────────────────────────────

-- Main native courses table (separate from moodle-synced `courses`)
CREATE TABLE IF NOT EXISTS lms_courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id) ON DELETE SET NULL,
  code            TEXT NOT NULL,
  title           TEXT NOT NULL,
  academic_year   TEXT NOT NULL,           -- e.g. "2025-26"
  branch          TEXT NOT NULL,           -- e.g. "CSE", "ECE"
  semester        INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 12),
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_courses_org    ON lms_courses(org_id);
CREATE INDEX IF NOT EXISTS idx_lms_courses_year   ON lms_courses(academic_year);
CREATE INDEX IF NOT EXISTS idx_lms_courses_branch ON lms_courses(branch, semester);

-- Sections: one course can have multiple sections (A, B, C …)
CREATE TABLE IF NOT EXISTS lms_course_sections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,              -- "A", "B", "P1"
  faculty_id   UUID REFERENCES faculty_profiles(id) ON DELETE SET NULL,
  room         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_sections_course   ON lms_course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_sections_faculty  ON lms_course_sections(faculty_id);
COMMENT ON TABLE lms_course_sections IS 'One course → many sections; each section has its own faculty and attendance register.';

-- Enrollments: maps students to sections (not courses directly)
CREATE TABLE IF NOT EXISTS lms_enrollments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id     UUID NOT NULL REFERENCES lms_course_sections(id) ON DELETE CASCADE,
  student_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  roll_number    TEXT,                     -- Indian university roll number (primary identity)
  at_risk_status TEXT NOT NULL DEFAULT 'safe' CHECK (at_risk_status IN ('safe', 'warning', 'detained')),
  enrolled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (section_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_lms_enrollments_section ON lms_enrollments(section_id);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_student ON lms_enrollments(student_id);
COMMENT ON TABLE lms_enrollments IS 'Roll-number-aware enrollment; at_risk_status updated nightly by 75% cron job.';

-- Weekly timetable for each section
CREATE TABLE IF NOT EXISTS lms_timetable (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id   UUID NOT NULL REFERENCES lms_course_sections(id) ON DELETE CASCADE,
  day_of_week  TEXT NOT NULL CHECK (day_of_week IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  room         TEXT,
  week_type    TEXT DEFAULT 'all' CHECK (week_type IN ('all','odd','even'))  -- for alternating weeks
);

CREATE INDEX IF NOT EXISTS idx_lms_timetable_section ON lms_timetable(section_id);

-- 10-point grading scale configuration (Thapar-compliant defaults)
CREATE TABLE IF NOT EXISTS lms_grading_scale_config (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID REFERENCES organizations(id) ON DELETE CASCADE,
  grade_letter TEXT NOT NULL,
  min_marks    NUMERIC(5,2) NOT NULL,
  grade_points NUMERIC(4,2) NOT NULL,     -- O=10, A+=9, A=8, B+=7 … F=0
  UNIQUE (org_id, grade_letter)
);

-- Insert Thapar 10-point scale defaults (safe upsert, no-op on conflict)
INSERT INTO lms_grading_scale_config (org_id, grade_letter, min_marks, grade_points) VALUES
  ('00000000-0000-0000-0000-000000000001', 'O',  90, 10.0),
  ('00000000-0000-0000-0000-000000000001', 'A+', 80,  9.0),
  ('00000000-0000-0000-0000-000000000001', 'A',  70,  8.0),
  ('00000000-0000-0000-0000-000000000001', 'B+', 60,  7.0),
  ('00000000-0000-0000-0000-000000000001', 'B',  50,  6.0),
  ('00000000-0000-0000-0000-000000000001', 'C',  45,  5.0),
  ('00000000-0000-0000-0000-000000000001', 'P',  40,  4.0),
  ('00000000-0000-0000-0000-000000000001', 'F',   0,  0.0)
ON CONFLICT (org_id, grade_letter) DO NOTHING;


-- ──────────────────────────────────────────────────────────────
-- SECTION 2: Content / Materials / PYQs
-- ──────────────────────────────────────────────────────────────

-- Course modules (weeks / units)
CREATE TABLE IF NOT EXISTS lms_modules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  order_index  INTEGER NOT NULL DEFAULT 0,
  is_visible   BOOLEAN NOT NULL DEFAULT TRUE,
  release_date DATE,                        -- null = visible immediately
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_modules_course ON lms_modules(course_id, order_index);

-- Materials inside modules
CREATE TABLE IF NOT EXISTS lms_materials (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id    UUID NOT NULL REFERENCES lms_modules(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('pdf','link','video','docx','zip','other')),
  title        TEXT NOT NULL,
  file_url     TEXT,                        -- Cloudinary signed URL for uploaded files
  external_url TEXT,                        -- YouTube / Drive / Teams link
  order_index  INTEGER NOT NULL DEFAULT 0,
  uploaded_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_materials_module ON lms_materials(module_id, order_index);

-- Previous Year Question Papers
CREATE TABLE IF NOT EXISTS lms_pyq_resources (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID REFERENCES lms_courses(id) ON DELETE SET NULL,
  subject_code TEXT NOT NULL,              -- e.g. "UCS701" — allows cross-course PYQ search
  exam_year    INTEGER NOT NULL,           -- e.g. 2024
  exam_type    TEXT NOT NULL CHECK (exam_type IN ('mid','end','mst1','mst2')),
  file_url     TEXT NOT NULL,
  verified     BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_pyq_code ON lms_pyq_resources(subject_code, exam_year);

-- Download rate-limit log (to throttle signed-URL abuse)
CREATE TABLE IF NOT EXISTS lms_download_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  material_id   UUID REFERENCES lms_materials(id) ON DELETE SET NULL,
  file_url      TEXT,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_downloads_student ON lms_download_logs(student_id, downloaded_at);


-- ──────────────────────────────────────────────────────────────
-- SECTION 3: Discussion Forums
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lms_forum_threads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  is_pinned  BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_threads_course ON lms_forum_threads(course_id, is_pinned DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS lms_forum_replies (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id      UUID NOT NULL REFERENCES lms_forum_threads(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES lms_forum_replies(id) ON DELETE CASCADE,  -- nested replies
  author_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  upvotes_count  INTEGER NOT NULL DEFAULT 0,
  is_best_answer BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_replies_thread ON lms_forum_replies(thread_id, created_at);


-- ──────────────────────────────────────────────────────────────
-- SECTION 4: Notifications
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lms_notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id       UUID REFERENCES organizations(id) ON DELETE SET NULL,
  type         TEXT NOT NULL CHECK (type IN ('assignment','deadline','grade','attendance','announcement','forum')),
  reference_id UUID,                       -- FK to the triggering entity
  message      TEXT NOT NULL,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_notif_user ON lms_notifications(user_id, is_read, created_at DESC);


-- ──────────────────────────────────────────────────────────────
-- SECTION 5: Attendance
-- ──────────────────────────────────────────────────────────────

-- One row per class session (date + section)
CREATE TABLE IF NOT EXISTS lms_attendance_sessions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id              UUID NOT NULL REFERENCES lms_course_sections(id) ON DELETE CASCADE,
  conducted_by            UUID REFERENCES users(id) ON DELETE SET NULL,  -- faculty who took class
  date                    DATE NOT NULL,
  total_conducted_counter INTEGER NOT NULL DEFAULT 0,  -- cumulative count up to this session
  is_holiday              BOOLEAN NOT NULL DEFAULT FALSE,  -- blocks marking on holiday
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (section_id, date)
);

CREATE INDEX IF NOT EXISTS idx_lms_att_sessions_section ON lms_attendance_sessions(section_id, date DESC);

-- One row per student per session
CREATE TABLE IF NOT EXISTS lms_attendance_records (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES lms_attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL CHECK (status IN ('P','A','L')),   -- Present/Absent/Late
  marked_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  remark     TEXT,
  marked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_lms_att_records_session ON lms_attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_lms_att_records_student ON lms_attendance_records(student_id);
COMMENT ON TABLE lms_attendance_records IS '75% cron: reads this table per student per section to update lms_enrollments.at_risk_status nightly.';


-- ──────────────────────────────────────────────────────────────
-- SECTION 6: Gradebook
-- ──────────────────────────────────────────────────────────────

-- Grade components per course (MST1=15, MST2=15, End-Sem=60, etc.)
CREATE TABLE IF NOT EXISTS lms_grade_components (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        UUID NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,          -- "MST1", "MST2", "End Semester"
  max_marks        NUMERIC(6,2) NOT NULL,
  weightage_percent NUMERIC(5,2),          -- percentage contribution to final
  type             TEXT NOT NULL CHECK (type IN ('internal','external')),
  display_order    INTEGER NOT NULL DEFAULT 0,
  UNIQUE (course_id, name)
);

CREATE INDEX IF NOT EXISTS idx_lms_grade_components_course ON lms_grade_components(course_id, display_order);

-- Individual student marks per grade component
CREATE TABLE IF NOT EXISTS lms_gradebook_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id   UUID NOT NULL REFERENCES lms_grade_components(id) ON DELETE CASCADE,
  student_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  marks_obtained NUMERIC(6,2),
  graded_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  graded_at      TIMESTAMPTZ,
  remark         TEXT,
  UNIQUE (component_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_lms_gradebook_component ON lms_gradebook_entries(component_id);
CREATE INDEX IF NOT EXISTS idx_lms_gradebook_student   ON lms_gradebook_entries(student_id);

-- Gradebook lock (exam office submits to registry → locked)
CREATE TABLE IF NOT EXISTS lms_gradebook_config (
  course_id   UUID PRIMARY KEY REFERENCES lms_courses(id) ON DELETE CASCADE,
  is_locked   BOOLEAN NOT NULL DEFAULT FALSE,
  locked_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_at   TIMESTAMPTZ
);

COMMENT ON TABLE lms_gradebook_config IS 'When is_locked=TRUE, grade edits are rejected unless admin provides reason_text written to lms_audit_logs.';


-- ──────────────────────────────────────────────────────────────
-- SECTION 7: Audit Log (INSERT-ONLY — immutable)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lms_audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID REFERENCES organizations(id) ON DELETE SET NULL,
  actor_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type    TEXT NOT NULL,            -- e.g. 'grade_override', 'attendance_edit'
  target_table   TEXT NOT NULL,            -- e.g. 'lms_gradebook_entries'
  target_id      UUID,                     -- ID of the affected row
  old_value_json JSONB,
  new_value_json JSONB,
  reason_text    TEXT,                     -- mandatory for locked-gradebook edits
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_audit_org    ON lms_audit_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lms_audit_actor  ON lms_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_lms_audit_target ON lms_audit_logs(target_table, target_id);
COMMENT ON TABLE lms_audit_logs IS 'Immutable. Enforce INSERT-only via Supabase RLS: no UPDATE or DELETE policies.';


-- ──────────────────────────────────────────────────────────────
-- SECTION 8: Assignments & Submissions
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lms_assignments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id           UUID NOT NULL REFERENCES lms_course_sections(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  description          TEXT,
  due_date             TIMESTAMPTZ NOT NULL,
  max_marks            NUMERIC(6,2) NOT NULL DEFAULT 100,
  allow_resubmission   BOOLEAN NOT NULL DEFAULT FALSE,
  max_attempts         INTEGER NOT NULL DEFAULT 1,
  resubmission_deadline TIMESTAMPTZ,
  allow_late           BOOLEAN NOT NULL DEFAULT FALSE,
  late_penalty_percent NUMERIC(5,2) DEFAULT 0,
  created_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_assignments_section ON lms_assignments(section_id, due_date);

CREATE TABLE IF NOT EXISTS lms_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID NOT NULL REFERENCES lms_assignments(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_number  INTEGER NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','submitted','late','graded','returned')),
  file_url        TEXT,                    -- Cloudinary upload
  text_content    TEXT,                    -- rich-text submission
  submitted_at    TIMESTAMPTZ,
  graded_at       TIMESTAMPTZ,
  grader_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  feedback_text   TEXT,
  marks_obtained  NUMERIC(6,2),
  rubric_scores_json JSONB,               -- {criterion: score, ...}
  UNIQUE (assignment_id, student_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_lms_submissions_assignment ON lms_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_lms_submissions_student    ON lms_submissions(student_id);


-- ──────────────────────────────────────────────────────────────
-- SECTION 9: Quizzes & Question Bank
-- ──────────────────────────────────────────────────────────────

-- Question Bank: Global or course-private questions
CREATE TABLE IF NOT EXISTS lms_quiz_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- If course_id is NULL → question is globally shared across all courses
  course_id      UUID REFERENCES lms_courses(id) ON DELETE CASCADE,
  faculty_id     UUID REFERENCES faculty_profiles(id) ON DELETE SET NULL,
  topic_tag      TEXT,
  difficulty     TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  marks          NUMERIC(5,2) NOT NULL DEFAULT 1,
  is_global      BOOLEAN NOT NULL DEFAULT FALSE,   -- TRUE = all faculty can use
  -- question_json structure: {type, prompt, options:[{text,is_correct}], explanation}
  question_json  JSONB NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_questions_course   ON lms_quiz_questions(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_questions_faculty  ON lms_quiz_questions(faculty_id);
CREATE INDEX IF NOT EXISTS idx_lms_questions_global   ON lms_quiz_questions(is_global) WHERE is_global = TRUE;

-- Quiz header: settings + timing
CREATE TABLE IF NOT EXISTS lms_quizzes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id         UUID NOT NULL REFERENCES lms_course_sections(id) ON DELETE CASCADE,
  title              TEXT NOT NULL,
  description        TEXT,
  time_limit_mins    INTEGER,              -- NULL = no limit
  attempts_allowed   INTEGER NOT NULL DEFAULT 1,
  shuffle_questions  BOOLEAN NOT NULL DEFAULT TRUE,
  shuffle_options    BOOLEAN NOT NULL DEFAULT TRUE,
  prevent_backtrack  BOOLEAN NOT NULL DEFAULT FALSE,
  fullscreen_mode    BOOLEAN DEFAULT false,
  show_results_after BOOLEAN NOT NULL DEFAULT TRUE,
  start_at           TIMESTAMPTZ NOT NULL,
  end_at             TIMESTAMPTZ NOT NULL,
  question_ids       JSONB DEFAULT '[]'::jsonb,
  created_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_quizzes_section ON lms_quizzes(section_id);

-- Maps questions to quizzes (with order)
CREATE TABLE IF NOT EXISTS lms_quiz_question_map (
  quiz_id      UUID NOT NULL REFERENCES lms_quizzes(id) ON DELETE CASCADE,
  question_id  UUID NOT NULL REFERENCES lms_quiz_questions(id) ON DELETE CASCADE,
  order_index  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (quiz_id, question_id)
);

-- Student quiz attempts
CREATE TABLE IF NOT EXISTS lms_quiz_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id       UUID NOT NULL REFERENCES lms_quizzes(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at  TIMESTAMPTZ,
  score         NUMERIC(6,2),
  -- answers_json: {question_id: selected_option_index or text_answer}
  answers_json  JSONB NOT NULL DEFAULT '{}',
  is_timed_out  BOOLEAN NOT NULL DEFAULT FALSE,
  is_completed  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_lms_attempts_quiz    ON lms_quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_lms_attempts_student ON lms_quiz_attempts(student_id);


-- ──────────────────────────────────────────────────────────────
-- DONE — Verify with:
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_name LIKE 'lms_%'
--   ORDER BY table_name;
--
-- Expected: lms_assignments, lms_attendance_records, lms_attendance_sessions,
--   lms_audit_logs, lms_course_sections, lms_courses, lms_download_logs,
--   lms_enrollments, lms_forum_replies, lms_forum_threads, lms_gradebook_config,
--   lms_gradebook_entries, lms_grade_components, lms_grading_scale_config,
--   lms_materials, lms_modules, lms_notifications, lms_pyq_resources,
--   lms_quiz_attempts, lms_quiz_question_map, lms_quiz_questions, lms_quizzes,
--   lms_submissions, lms_timetable
-- ──────────────────────────────────────────────────────────────
