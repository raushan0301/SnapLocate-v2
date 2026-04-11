-- ─── STUDENT WORKSPACE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_timetable (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  day         TEXT NOT NULL,
  time_slot   TEXT NOT NULL,
  course      TEXT,
  location    TEXT,
  type        TEXT,
  color_preset TEXT DEFAULT 'indigo',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT,
  tag         TEXT,
  tag_color_preset TEXT DEFAULT 'indigo',
  is_pinned   BOOLEAN DEFAULT false,
  is_starred  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  sub         TEXT,
  is_done     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_links (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  url         TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_files (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  size_bytes  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_student_timetable_student ON student_timetable(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_student     ON student_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_tasks_student     ON student_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_student_links_student     ON student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_student_files_student     ON student_files(student_id);
