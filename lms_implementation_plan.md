Native Learning Management System (LMS) Implementation Plan vFinal
This document outlines the architecture for a fully native, in-house LMS built entirely within SnapLocate. This replaces all external syncing (Moodle/WebKiosk) and provides dedicated interfaces natively on the platform.

Crucially, this architecture is designed exclusively for the realities of Indian University operations, respecting strict hierarchies (Branch > Semester > Section), internal vs. external marks breakdowns, and hard attendance detainment rules.

This finalized plan actively incorporates constraints targeting Thapar University compliance (10-point scale, specific registry formats, etc).

1. Core Feature Capabilities Needed
👨‍💻 Student OS (The Learner View)
Course & Content Access: Enrolled courses dashboard with progress bars. Downloadable materials for offline access (throttle-protected via signed temporary URLs).
Timetable / Class Schedule: Integrated directly into the existing SnapLocate Timetable module to prevent duplication while feeding from LMS schedules.
Study Resources (PYQs): Dedicated section for Previous Year Question Papers (PYQs) accurately indexed by subject code, exam year, and exam type.
Attendance Tracker: Status indicator (Green/Yellow/Red) showing current percentage against the university's 75% mandate. Detainment warning system and an interactive calculator (Formula: floor(total_conducted * 0.25) - already_absent).
Assignment Inbox: Submission portal supporting files (Max 25MB). Includes deadline timers, late indicators, and support for multi-attempt resubmissions.
Quizzes & Tests: Native timed online testing with forced full-screen modes, strict anti-backtracking, and randomized question/option combinations.
Gradebook: Visual breakdown of marks (Sessional/Internal vs. External component). Estimated SGPA/CGPA calculations driven by a strict 10-point (SGPA/CGPA) Indian grading scale.
Discussion Forums: Stack-overflow style QA layout with upvotes, nested threads, and "best answer" pins.
👩‍🏫 Faculty OS (The Instructor View)
Course & Section Routing: Faculty can manage assignments and attendance across multiple unique distinct sections tied to the same course.
Attendance Register: Mark daily attendance quickly. Auto-blocked on days marked as official University holidays in the academic calendar.
Assignment & SpeedGrader: Create assignments with strict late and resubmission policies. SpeedGrader UI provides side-by-side submission previews, keyboard shortcuts (next/prev student), and bulk mark releases.
Content Uploader: Give faculties both options: upload native video mp4s directly via Cloudinary, or paste Drive/YouTube external links.
Quiz Engine: Pull questions from an indexed Question Bank. Supports both Global (all faculty can access) and Private (tied to a single faculty) questions.
Gradebook Manager: Configure internal component weightages via strict validation rules. Manual override capabilities and final lock mechanisms.
🛡 Admin OS (The Management View)
Academic Structure Setup: Deep hierarchy definitions (Departments > Branches > Semesters > Sections). Academic calendar configuration.
Enrollment Engine: Secure bulk-import of students integrating with the existing SnapLocate auth login, but mapping via Roll Number parameters internally.
Examination Office Export (Thapar Format): Generation of the consolidated Master Marks Sheet explicitly mapping internal and external elements formatted perfectly to Thapar University's registry export templates.
Audit Logging: Completely immutable log structure recording every grade overwrite, attendance alteration, and administrative assignment creation.
2. Infrastructure & Supabase Database Schema Expansions
To execute this, we will write a migration introducing the following deeply normalized table structures:

Course & Architecture
lms_courses (id, org_id, code, title, academic_year, branch, semester)
lms_course_sections (id, course_id, section_name, faculty_id)
lms_enrollments (id, section_id, student_id [UUID FK], at_risk_status [Enum: safe, warning, detained])
lms_timetable (id, section_id, day_of_week, start_time, end_time, room, week_type)
lms_grading_scale_config (id, org_id, grade_letter, min_marks, grade_points [Defaults designed for 10-pt scale])
Materials & Discussions
lms_modules (id, course_id, title, order_index)
lms_materials (id, module_id, type [PDF, Link, Video], file_url)
lms_pyq_resources (id, course_id, subject_code, exam_year, exam_type [Mid/End], file_url, verified)
lms_download_logs (id, student_id, file_url, timestamp - for rate limiting)
lms_forum_threads (id, course_id, author_id, title, is_pinned, is_locked)
lms_forum_replies (id, thread_id, parent_reply_id, author_id, content, upvotes_count, is_best_answer)
lms_notifications (id, user_id, org_id, type [assignment, deadline, grade, attendance], reference_id, message, is_read, created_at)
Attendance & Grades
lms_attendance_sessions (id, section_id, date, total_conducted_counter)
lms_attendance_records (id, session_id, student_id, status: P/A/L)
lms_grade_components (id, course_id, name, max_marks, weightage_percent, type: internal/external, display_order)
lms_gradebook_config (course_id, is_locked, locked_by, locked_at)
lms_audit_logs (id, org_id, actor_id, action_type, target_table, target_id, old_value_json, new_value_json, reason_text) (strictly insert-only/immutable)
Assignments & Quizzes
lms_assignments (id, section_id, title, due_date, allow_resubmission, max_attempts, resubmission_deadline)
lms_submissions (id, assignment_id, student_id, submission_status [draft/submitted/late/graded], submitted_at, graded_at, grader_id, feedback_text, rubric_scores_json)
lms_quiz_questions (id, topic_tag, difficulty [easy/medium/hard], marks, course_id [Nullable globally vs Non-Nullable tracking for private], question_json)
lms_quizzes (id, section_id, shuffle_questions, shuffle_options, prevent_backtrack, fullscreen_mode)
lms_quiz_attempts (attempt_id, quiz_id, student_id, started_at, submitted_at, score, answers_json, is_timed_out)
3. Workflows & Backend Logic Definitions
75% Detention Cron Logic: Triggers nightly. Reads total_conducted_counter vs sum of Present records per student_id. If threshold drops below bounds, updates at_risk_status in lms_enrollments and inserts a warning record into lms_notifications.
Grade Lock Mechanics: Exam office clicks "Submit to Registry". Sets is_locked=True in lms_gradebook_config. Any subsequent updates to lms_submissions.marks or lms_quiz_attempts.score will immediately reject via backend middleware unless explicitly overwritten by an Admin providing an immutable reason_text to the lms_audit_logs.
Thapar Export Format: Generating registry sheets aligning specifically down to the MST1/MST2 decimal points per component definition.
4. Phase Order Execution Strategy
To build this massive project iteratively without blocking functional deployments, the rollout phases will follow this order:

Phase 1: DB & Architecture. Write the 18+ table schemas and logic triggers in Supabase.
Phase 2: Administrative Control. Building Admin OS course creation, academic year mapping, and Roll Number CSV bulk imports so the foundation is seeded.
Phase 3: Core Faculty Workflows. Attendance Engine (register + cron alerts) and Module/Material Builder.
Phase 4: Assessments Engine. Deep-dive into building the Assignment dropbox, Quizzes, and the SpeedGrader UI for faculty evaluating those student submissions.
Phase 5: Student Learner Module. Connecting the mobile-responsive view for students to engage with everything built above.
Phase 6: The Gradebook Export. Tying everything together for Thapar registry reporting.
