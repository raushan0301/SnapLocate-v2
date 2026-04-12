import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Auth Pages
import Login     from './pages/auth/Login'
import Register  from './pages/auth/Register'
import VerifyOTP from './pages/auth/VerifyOTP'

// Route Guards
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute'

// Student Pages
import StudentDashboard  from './pages/student/Dashboard'
import ProfessorsPage    from './pages/student/Professors'
import ClassroomPage     from './pages/student/Classroom'
import CalendarPage      from './pages/student/Calendar'
import WiFiPage          from './pages/student/WiFi'
import SocietyPage       from './pages/student/Society'
import ShopsPage         from './pages/student/Shops'
import CampusSupportPage from './pages/student/CampusSupport'
import SettingsPage      from './pages/student/Settings'
import SupportPage       from './pages/student/Support'
import ResourcesPage     from './pages/student/Resources'
import MarketplacePage   from './pages/student/Marketplace'
import LostFoundPage     from './pages/student/LostFound'
import StudentRequests   from './pages/student/Requests'

// Faculty Pages
import FacultyDashboard  from './pages/faculty/Dashboard'
import FacultyProfile    from './pages/faculty/Profile'
import FacultyRequests   from './pages/faculty/Requests'
import FacultySettings   from './pages/faculty/Settings'
import FacultyOfficeHours from './pages/faculty/OfficeHours'
import FacultyStudents   from './pages/faculty/Students'

// Admin Pages
import AdminDashboard   from './pages/admin/Dashboard'
import ManageFaculty    from './pages/admin/ManageFaculty'
import AdminClassrooms  from './pages/admin/Classrooms'
import AdminShops       from './pages/admin/Shops'
import AdminSocieties   from './pages/admin/Societies'
import AdminSupport     from './pages/admin/SupportContacts'
import ManageCalendar   from './pages/admin/ManageCalendar'
import AdminWiFi       from './pages/admin/WiFi'
import SupportTicketsHub from './pages/admin/SupportTicketsHub'
import ManageStudents    from './pages/admin/ManageStudents'
import ManageMarketplace from './pages/admin/ManageMarketplace'
import ManageLostFound   from './pages/admin/ManageLostFound'
import ManageRequests    from './pages/admin/ManageRequests'
import ManageResources   from './pages/admin/ManageResources'
import Broadcast         from './pages/admin/Broadcast'
import AdminSettings     from './pages/admin/AdminSettings'
import AuditLog         from './pages/admin/AuditLog'

// LMS Student Pages
import LMSDashboard         from './pages/student/LMSDashboard'
import LMSCourse            from './pages/student/LMSCourse'
import LMSAssignments       from './pages/student/LMSAssignments'
import LMSAssignmentDetail  from './pages/student/LMSAssignmentDetail'
import LMSGrades            from './pages/student/LMSGrades'

// WebKiosk Student Pages
import WebKioskDashboard    from './pages/student/WebKioskDashboard'
import AttendanceView       from './pages/student/AttendanceView'
import ExamScheduleView     from './pages/student/ExamScheduleView'
import FeesView             from './pages/student/FeesView'
import StudentProfileView   from './pages/student/StudentProfileView'

// Faculty LMS + Attendance Pages
import LMSCourseManagement     from './pages/faculty/LMSCourseManagement'
import LMSCourseDetail         from './pages/faculty/LMSCourseDetail'
import LMSAssignmentGrading    from './pages/faculty/LMSAssignmentGrading'
import AttendanceMarking        from './pages/faculty/AttendanceMarking'

// Admin LMS + WebKiosk Pages
import ManageCourses        from './pages/admin/ManageCourses'
import ManageExamSchedule   from './pages/admin/ManageExamSchedule'
import ManageFees           from './pages/admin/ManageFees'
import SyncConfig           from './pages/admin/SyncConfig'

// Shared Pages
import ProfessorProfile from './pages/shared/ProfessorProfile'
import Workspace        from './pages/shared/Workspace'

export default function AppRoutes() {
  return (
    <Router>
      <Routes>

        {/* Default */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Auth Routes */}
        <Route path="/login"      element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register"   element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/verify-otp" element={<VerifyOTP />} />

        {/* Student Routes */}
        <Route path="/dashboard"      element={<ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/requests"       element={<ProtectedRoute allowedRole="student"><StudentRequests /></ProtectedRoute>} />
        <Route path="/professors"     element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin']}><ProfessorsPage /></ProtectedRoute>} />
        <Route path="/professors/:id" element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin']}><ProfessorProfile /></ProtectedRoute>} />
        <Route path="/classroom"      element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin']}><ClassroomPage /></ProtectedRoute>} />
        <Route path="/workspace"      element={<ProtectedRoute allowedRole="student"><Workspace role="student" /></ProtectedRoute>} />
        <Route path="/calendar"       element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin']}><CalendarPage /></ProtectedRoute>} />
        <Route path="/wifi"           element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin']}><WiFiPage /></ProtectedRoute>} />
        <Route path="/society"        element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin']}><SocietyPage /></ProtectedRoute>} />
        <Route path="/shops"          element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin']}><ShopsPage /></ProtectedRoute>} />
        <Route path="/campus-support" element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin']}><CampusSupportPage /></ProtectedRoute>} />
        <Route path="/settings"       element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin']}><SettingsPage /></ProtectedRoute>} />
        <Route path="/support"        element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin']}><SupportPage /></ProtectedRoute>} />
        <Route path="/resources"      element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin']}><ResourcesPage /></ProtectedRoute>} />
        <Route path="/marketplace"    element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin']}><MarketplacePage /></ProtectedRoute>} />
        <Route path="/lost-found"     element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin']}><LostFoundPage /></ProtectedRoute>} />

        {/* Faculty Routes */}
        <Route path="/faculty/dashboard"    element={<ProtectedRoute allowedRole="faculty"><FacultyDashboard /></ProtectedRoute>} />
        <Route path="/faculty/profile"      element={<ProtectedRoute allowedRole="faculty"><FacultyProfile /></ProtectedRoute>} />
        <Route path="/faculty/workspace"    element={<ProtectedRoute allowedRole="faculty"><Workspace role="faculty" /></ProtectedRoute>} />
        <Route path="/faculty/requests"     element={<ProtectedRoute allowedRole="faculty"><FacultyRequests /></ProtectedRoute>} />
        <Route path="/faculty/calendar"     element={<ProtectedRoute allowedRole="faculty"><CalendarPage /></ProtectedRoute>} />
        <Route path="/faculty/settings"     element={<ProtectedRoute allowedRole="faculty"><FacultySettings /></ProtectedRoute>} />
        <Route path="/faculty/office-hours" element={<ProtectedRoute allowedRole="faculty"><FacultyOfficeHours /></ProtectedRoute>} />
        <Route path="/faculty/students"     element={<ProtectedRoute allowedRole="faculty"><FacultyStudents /></ProtectedRoute>} />
        <Route path="/faculty/lms"                          element={<ProtectedRoute allowedRole="faculty"><LMSCourseManagement /></ProtectedRoute>} />
        <Route path="/faculty/lms/courses/:id"              element={<ProtectedRoute allowedRole="faculty"><LMSCourseDetail /></ProtectedRoute>} />
        <Route path="/faculty/lms/assignments/:id/grade"    element={<ProtectedRoute allowedRole="faculty"><LMSAssignmentGrading /></ProtectedRoute>} />
        <Route path="/faculty/attendance"                   element={<ProtectedRoute allowedRole="faculty"><AttendanceMarking /></ProtectedRoute>} />

        {/* Student LMS Routes */}
        <Route path="/lms"                  element={<ProtectedRoute allowedRole="student"><LMSDashboard /></ProtectedRoute>} />
        <Route path="/lms/courses/:id"      element={<ProtectedRoute allowedRole="student"><LMSCourse /></ProtectedRoute>} />
        <Route path="/lms/assignments"      element={<ProtectedRoute allowedRole="student"><LMSAssignments /></ProtectedRoute>} />
        <Route path="/lms/assignments/:id"  element={<ProtectedRoute allowedRole="student"><LMSAssignmentDetail /></ProtectedRoute>} />
        <Route path="/lms/grades"           element={<ProtectedRoute allowedRole="student"><LMSGrades /></ProtectedRoute>} />

        {/* Student WebKiosk Routes */}
        <Route path="/webkiosk"             element={<ProtectedRoute allowedRole="student"><WebKioskDashboard /></ProtectedRoute>} />
        <Route path="/webkiosk/attendance"  element={<ProtectedRoute allowedRole="student"><AttendanceView /></ProtectedRoute>} />
        <Route path="/webkiosk/exams"       element={<ProtectedRoute allowedRole="student"><ExamScheduleView /></ProtectedRoute>} />
        <Route path="/webkiosk/fees"        element={<ProtectedRoute allowedRole="student"><FeesView /></ProtectedRoute>} />
        <Route path="/webkiosk/profile"     element={<ProtectedRoute allowedRole="student"><StudentProfileView /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard"   element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/faculty"     element={<ProtectedRoute allowedRole="admin"><ManageFaculty /></ProtectedRoute>} />
        <Route path="/admin/classrooms"  element={<ProtectedRoute allowedRole="admin"><AdminClassrooms /></ProtectedRoute>} />
        <Route path="/admin/shops"       element={<ProtectedRoute allowedRole="admin"><AdminShops /></ProtectedRoute>} />
        <Route path="/admin/societies"   element={<ProtectedRoute allowedRole="admin"><AdminSocieties /></ProtectedRoute>} />
        <Route path="/admin/support"     element={<ProtectedRoute allowedRole="admin"><SupportTicketsHub /></ProtectedRoute>} />
        <Route path="/admin/support-contacts" element={<ProtectedRoute allowedRole="admin"><AdminSupport /></ProtectedRoute>} />
        <Route path="/admin/calendar"    element={<ProtectedRoute allowedRole="admin"><ManageCalendar /></ProtectedRoute>} />
        <Route path="/admin/wifi"        element={<ProtectedRoute allowedRole="admin"><AdminWiFi /></ProtectedRoute>} />
        <Route path="/admin/students"    element={<ProtectedRoute allowedRole="admin"><ManageStudents /></ProtectedRoute>} />
        <Route path="/admin/marketplace" element={<ProtectedRoute allowedRole="admin"><ManageMarketplace /></ProtectedRoute>} />
        <Route path="/admin/lost-found"  element={<ProtectedRoute allowedRole="admin"><ManageLostFound /></ProtectedRoute>} />
        <Route path="/admin/requests"    element={<ProtectedRoute allowedRole="admin"><ManageRequests /></ProtectedRoute>} />
        <Route path="/admin/resources"   element={<ProtectedRoute allowedRole="admin"><ManageResources /></ProtectedRoute>} />
        <Route path="/admin/broadcast"   element={<ProtectedRoute allowedRole="admin"><Broadcast /></ProtectedRoute>} />
        <Route path="/admin/settings"    element={<ProtectedRoute allowedRole="admin"><AdminSettings /></ProtectedRoute>} />
        <Route path="/admin/audit-log"      element={<ProtectedRoute allowedRole="admin"><AuditLog /></ProtectedRoute>} />
        <Route path="/admin/lms/courses"     element={<ProtectedRoute allowedRole="admin"><ManageCourses /></ProtectedRoute>} />
        <Route path="/admin/exam-schedule"  element={<ProtectedRoute allowedRole="admin"><ManageExamSchedule /></ProtectedRoute>} />
        <Route path="/admin/fees"           element={<ProtectedRoute allowedRole="admin"><ManageFees /></ProtectedRoute>} />
        <Route path="/admin/sync"           element={<ProtectedRoute allowedRole="admin"><SyncConfig /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </Router>
  )
}
