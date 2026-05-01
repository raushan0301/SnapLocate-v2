-- =========================================================
-- SnapLocate Native LMS — DUMMY SEED DATA (v2 - schema corrected)
-- Run this in Supabase SQL Editor
-- =========================================================

DO $$
DECLARE
  v_faculty_id    UUID;
  v_student_id    UUID;
  v_faculty_prof  UUID;
  v_course_id     UUID;
  v_section_id    UUID;
  v_session_id    UUID;
  v_comp_mst1     UUID;
  v_comp_mst2     UUID;
  v_comp_end      UUID;
  v_assignment1   UUID;
  v_assignment2   UUID;
BEGIN

  -- ── 1. Fetch user IDs by email ────────────────────────────────
  SELECT id INTO v_faculty_id FROM users WHERE email = 'faculty@snaplocate.test' LIMIT 1;
  SELECT id INTO v_student_id FROM users WHERE email = 'raushan@snaplocate.test'  LIMIT 1;

  IF v_faculty_id IS NULL THEN
    RAISE EXCEPTION 'Faculty user not found: faculty@snaplocate.test';
  END IF;
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Student user not found: raushan@snaplocate.test';
  END IF;

  -- ── 2. Get or create faculty_profile ─────────────────────────
  SELECT id INTO v_faculty_prof FROM faculty_profiles WHERE user_id = v_faculty_id LIMIT 1;
  IF v_faculty_prof IS NULL THEN
    INSERT INTO faculty_profiles (user_id, department, designation)
    VALUES (v_faculty_id, 'Computer Science & Engineering', 'Assistant Professor')
    RETURNING id INTO v_faculty_prof;
  END IF;

  -- ── 3. Create course (no faculty_id on lms_courses) ──────────
  INSERT INTO lms_courses (code, title, academic_year, branch, semester, is_published)
  VALUES ('UCS101', 'Introduction to Computer Science', '2025-26', 'CSE', 3, true)
  RETURNING id INTO v_course_id;

  -- ── 4. Create section (faculty_id goes here) ─────────────────
  INSERT INTO lms_course_sections (course_id, section_name, faculty_id, room)
  VALUES (v_course_id, 'A', v_faculty_prof, 'LT-4')
  RETURNING id INTO v_section_id;

  -- ── 5. Enroll student ─────────────────────────────────────────
  INSERT INTO lms_enrollments (section_id, student_id, roll_number, at_risk_status)
  VALUES (v_section_id, v_student_id, 'BE22CSE001', 'safe')
  ON CONFLICT (section_id, student_id) DO NOTHING;

  -- ── 6. Attendance sessions (3P + 1A = 75%) ───────────────────
  INSERT INTO lms_attendance_sessions (section_id, conducted_by, date, total_conducted_counter, is_holiday)
  VALUES (v_section_id, v_faculty_id, CURRENT_DATE - 10, 1, false)
  RETURNING id INTO v_session_id;
  INSERT INTO lms_attendance_records (session_id, student_id, status, marked_by)
  VALUES (v_session_id, v_student_id, 'P', v_faculty_id);

  INSERT INTO lms_attendance_sessions (section_id, conducted_by, date, total_conducted_counter, is_holiday)
  VALUES (v_section_id, v_faculty_id, CURRENT_DATE - 8, 2, false)
  RETURNING id INTO v_session_id;
  INSERT INTO lms_attendance_records (session_id, student_id, status, marked_by)
  VALUES (v_session_id, v_student_id, 'P', v_faculty_id);

  INSERT INTO lms_attendance_sessions (section_id, conducted_by, date, total_conducted_counter, is_holiday)
  VALUES (v_section_id, v_faculty_id, CURRENT_DATE - 5, 3, false)
  RETURNING id INTO v_session_id;
  INSERT INTO lms_attendance_records (session_id, student_id, status, marked_by)
  VALUES (v_session_id, v_student_id, 'A', v_faculty_id);

  INSERT INTO lms_attendance_sessions (section_id, conducted_by, date, total_conducted_counter, is_holiday)
  VALUES (v_section_id, v_faculty_id, CURRENT_DATE - 3, 4, false)
  RETURNING id INTO v_session_id;
  INSERT INTO lms_attendance_records (session_id, student_id, status, marked_by)
  VALUES (v_session_id, v_student_id, 'P', v_faculty_id);

  -- ── 7. Grade components ───────────────────────────────────────
  INSERT INTO lms_grade_components (course_id, name, max_marks, weightage_percent, type, display_order)
  VALUES
    (v_course_id, 'MST-1',       30,  25, 'internal', 1),
    (v_course_id, 'MST-2',       30,  25, 'internal', 2),
    (v_course_id, 'End Semester',100, 50, 'external', 3);

  SELECT id INTO v_comp_mst1 FROM lms_grade_components WHERE course_id = v_course_id AND name = 'MST-1' LIMIT 1;
  SELECT id INTO v_comp_mst2 FROM lms_grade_components WHERE course_id = v_course_id AND name = 'MST-2' LIMIT 1;
  SELECT id INTO v_comp_end  FROM lms_grade_components WHERE course_id = v_course_id AND name = 'End Semester' LIMIT 1;

  -- ── 8. Gradebook entries ──────────────────────────────────────
  INSERT INTO lms_gradebook_entries (component_id, student_id, marks_obtained, graded_by)
  VALUES
    (v_comp_mst1, v_student_id, 24,  v_faculty_id),
    (v_comp_mst2, v_student_id, 26,  v_faculty_id),
    (v_comp_end,  v_student_id, 78, v_faculty_id)
  ON CONFLICT DO NOTHING;

  -- ── 9. Assignments ────────────────────────────────────────────
  -- Assignment 1: upcoming (3 days from now)
  INSERT INTO lms_assignments (
    section_id, title, description, due_date, max_marks,
    allow_resubmission, max_attempts, allow_late, late_penalty_percent, created_by
  ) VALUES (
    v_section_id,
    'Lab Report 1 — Sorting Algorithms',
    'Implement Bubble Sort, Merge Sort, and Quick Sort. Analyse time complexity with charts. Submit as PDF.',
    NOW() + INTERVAL '3 days',
    100, true, 2, true, 10, v_faculty_id
  )
  RETURNING id INTO v_assignment1;

  -- Assignment 2: overdue, already graded
  INSERT INTO lms_assignments (
    section_id, title, description, due_date, max_marks,
    allow_resubmission, max_attempts, allow_late, late_penalty_percent, created_by
  ) VALUES (
    v_section_id,
    'MST-1 Preparation Sheet',
    'Complete the 20-question practice sheet on Unit 1 topics. Show all working.',
    NOW() - INTERVAL '2 days',
    50, false, 1, false, 0, v_faculty_id
  )
  RETURNING id INTO v_assignment2;

  -- Graded submission for Assignment 2
  INSERT INTO lms_submissions (
    assignment_id, student_id, status, text_content,
    submitted_at, marks_obtained, graded_at, grader_id, feedback_text
  ) VALUES (
    v_assignment2, v_student_id, 'graded',
    'Completed all 20 questions. Used brute force for Q15-18.',
    NOW() - INTERVAL '3 days',
    43,
    NOW() - INTERVAL '1 day',
    v_faculty_id,
    'Good attempt! Be more concise in Q17 explanation.'
  )
  ON CONFLICT DO NOTHING;

  -- ── 10. Quiz questions ────────────────────────────────────────
  INSERT INTO lms_quiz_questions (course_id, faculty_id, topic_tag, difficulty, marks, question_json, is_global)
  VALUES
  (
    v_course_id, v_faculty_prof, 'Sorting Algorithms', 'medium', 2,
    '{"text":"What is the worst-case time complexity of Quick Sort?","options":["O(n log n)","O(n^2)","O(n)","O(log n)"],"correct_index":1}'::jsonb,
    false
  ),
  (
    v_course_id, v_faculty_prof, 'Data Structures', 'easy', 1,
    '{"text":"Which data structure follows LIFO order?","options":["Queue","Tree","Stack","Graph"],"correct_index":2}'::jsonb,
    false
  ),
  (
    v_course_id, v_faculty_prof, 'Complexity', 'hard', 3,
    '{"text":"Binary search runs in which time complexity?","options":["O(n)","O(n^2)","O(n log n)","O(log n)"],"correct_index":3}'::jsonb,
    false
  )
  ON CONFLICT DO NOTHING;

  -- ── 11. Quiz ──────────────────────────────────────────────────
  INSERT INTO lms_quizzes (
    section_id, title, description,
    time_limit_mins, shuffle_questions, shuffle_options,
    prevent_backtrack, fullscreen_mode, show_results_after,
    start_at, end_at, question_ids, created_by
  ) VALUES (
    v_section_id,
    'Unit 1 Quiz — Algorithms & Complexity',
    'Covers sorting algorithms, data structures, and time complexity. 3 questions, 20 mins.',
    20, true, true, false, true, true,
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '6 hours',
    (SELECT COALESCE(jsonb_agg(id), '[]') FROM lms_quiz_questions WHERE course_id = v_course_id),
    v_faculty_id
  )
  ON CONFLICT DO NOTHING;

  -- ── 12. PYQ Resources ─────────────────────────────────────────
  INSERT INTO lms_pyq_resources (course_id, subject_code, exam_year, exam_type, file_url, verified)
  VALUES
    (v_course_id, 'UCS101', 2024, 'mid', 'https://drive.google.com/file/d/sample-mst-2024/view', true),
    (v_course_id, 'UCS101', 2024, 'end', 'https://drive.google.com/file/d/sample-est-2024/view', true),
    (v_course_id, 'UCS101', 2023, 'mid', 'https://drive.google.com/file/d/sample-mst-2023/view', true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Seed complete!';
  RAISE NOTICE '   Faculty ID   : %', v_faculty_id;
  RAISE NOTICE '   Student ID   : %', v_student_id;
  RAISE NOTICE '   Course       : UCS101 — Introduction to Computer Science';
  RAISE NOTICE '   Section      : A  (ID: %)', v_section_id;
  RAISE NOTICE '   Attendance   : 4 sessions, 3P + 1A = 75%%';
  RAISE NOTICE '   Grades       : MST1=24/30 · MST2=26/30 · EndSem=78/100';
  RAISE NOTICE '   Assignments  : 2 (1 upcoming, 1 graded)';
  RAISE NOTICE '   Quiz         : 3 questions, 1 published quiz';
  RAISE NOTICE '   PYQ Papers   : 3 uploaded';

END $$;
