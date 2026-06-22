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
import MarketplacePage         from './pages/student/Marketplace'
import MarketplaceListingDetail from './pages/student/MarketplaceListingDetail'
import MarketplaceCreate        from './pages/student/MarketplaceCreate'
import MarketplaceEdit          from './pages/student/MarketplaceEdit'
import MarketplaceDashboard     from './pages/student/MarketplaceDashboard'
import MarketplaceChat          from './pages/student/MarketplaceChat'
import LostFoundPage     from './pages/student/LostFound'
import StudentRequests   from './pages/student/Requests'

// Faculty Pages
import FacultyDashboard  from './pages/faculty/Dashboard'
import FacultyProfile    from './pages/faculty/Profile'
import FacultyRequests   from './pages/faculty/Requests'
import FacultySettings   from './pages/faculty/Settings'
import FacultyOfficeHours from './pages/faculty/OfficeHours'
import FacultyStudents   from './pages/faculty/Students'
import FacultyResources  from './pages/faculty/Resources'

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
import NativeAttendance     from './pages/student/NativeAttendance'
import NativeAssignments    from './pages/student/NativeAssignments'
import NativeGradebook      from './pages/student/NativeGradebook'
import NativeQuizAttempt    from './pages/student/NativeQuizAttempt'
import NativePYQ            from './pages/student/NativePYQ'

// Faculty LMS + Native Attendance Pages
import LMSCourseManagement    from './pages/faculty/LMSCourseManagement'
import LMSCourseDetail        from './pages/faculty/LMSCourseDetail'
import LMSAssignmentGrading   from './pages/faculty/LMSAssignmentGrading'
import AttendanceMarking       from './pages/faculty/AttendanceMarking'
import FacultyNativeAttendance from './pages/faculty/NativeAttendance'
import FacultyNativeAssignments from './pages/faculty/NativeAssignments'
import FacultyNativeQuizzes     from './pages/faculty/NativeQuizzes'

// Admin LMS Pages
import ManageCourses  from './pages/admin/ManageCourses'
import LMSStructure   from './pages/admin/LMSStructure'
import LMSBulkUpload  from './pages/admin/LMSBulkUpload'

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
        <Route path="/dashboard"      element={<ProtectedRoute allowedRole={['student', 'guest']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/requests"       element={<ProtectedRoute allowedRole={['student', 'guest']}><StudentRequests /></ProtectedRoute>} />
        <Route path="/professors"     element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin', 'guest']}><ProfessorsPage /></ProtectedRoute>} />
        <Route path="/professors/:id" element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin', 'guest']}><ProfessorProfile /></ProtectedRoute>} />
        <Route path="/classroom"      element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin', 'guest']}><ClassroomPage /></ProtectedRoute>} />
        <Route path="/workspace"      element={<ProtectedRoute allowedRole={['student', 'guest']}><Workspace role="student" /></ProtectedRoute>} />
        <Route path="/calendar"       element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin', 'guest']}><CalendarPage /></ProtectedRoute>} />
        <Route path="/wifi"           element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin', 'guest']}><WiFiPage /></ProtectedRoute>} />
        <Route path="/society"        element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin', 'guest']}><SocietyPage /></ProtectedRoute>} />
        <Route path="/shops"          element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin', 'guest']}><ShopsPage /></ProtectedRoute>} />
        <Route path="/campus-support" element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin', 'guest']}><CampusSupportPage /></ProtectedRoute>} />
        <Route path="/settings"       element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin', 'guest']}><SettingsPage /></ProtectedRoute>} />
        <Route path="/support"        element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin', 'guest']}><SupportPage /></ProtectedRoute>} />
        <Route path="/resources"      element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin', 'guest']}><ResourcesPage /></ProtectedRoute>} />
        <Route path="/marketplace"              element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin', 'guest']}><MarketplacePage /></ProtectedRoute>} />
        <Route path="/marketplace/listing/:id"  element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin', 'guest']}><MarketplaceListingDetail /></ProtectedRoute>} />
        <Route path="/marketplace/create"       element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin', 'guest']}><MarketplaceCreate /></ProtectedRoute>} />
        <Route path="/marketplace/edit/:id"     element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin', 'guest']}><MarketplaceEdit /></ProtectedRoute>} />
        <Route path="/marketplace/dashboard"    element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin', 'guest']}><MarketplaceDashboard /></ProtectedRoute>} />
        <Route path="/marketplace/chat"         element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin', 'guest']}><MarketplaceChat /></ProtectedRoute>} />
        <Route path="/lost-found"     element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin', 'guest']}><LostFoundPage /></ProtectedRoute>} />

        {/* Faculty Routes */}
        <Route path="/faculty/dashboard"    element={<ProtectedRoute allowedRole="faculty"><FacultyDashboard /></ProtectedRoute>} />
        <Route path="/faculty/profile"      element={<ProtectedRoute allowedRole="faculty"><FacultyProfile /></ProtectedRoute>} />
        <Route path="/faculty/workspace"    element={<ProtectedRoute allowedRole="faculty"><Workspace role="faculty" /></ProtectedRoute>} />
        <Route path="/faculty/requests"     element={<ProtectedRoute allowedRole="faculty"><FacultyRequests /></ProtectedRoute>} />
        <Route path="/faculty/calendar"     element={<ProtectedRoute allowedRole="faculty"><CalendarPage /></ProtectedRoute>} />
        <Route path="/faculty/settings"     element={<ProtectedRoute allowedRole="faculty"><FacultySettings /></ProtectedRoute>} />
        <Route path="/faculty/office-hours" element={<ProtectedRoute allowedRole="faculty"><FacultyOfficeHours /></ProtectedRoute>} />
        <Route path="/faculty/students"     element={<ProtectedRoute allowedRole="faculty"><FacultyStudents /></ProtectedRoute>} />
        <Route path="/faculty/lms"                         element={<ProtectedRoute allowedRole="faculty"><LMSCourseManagement /></ProtectedRoute>} />
        <Route path="/faculty/lms/courses/:id"             element={<ProtectedRoute allowedRole="faculty"><LMSCourseDetail /></ProtectedRoute>} />
        <Route path="/faculty/lms/assignments/:id/grade"   element={<ProtectedRoute allowedRole="faculty"><LMSAssignmentGrading /></ProtectedRoute>} />
        <Route path="/faculty/attendance"                  element={<ProtectedRoute allowedRole="faculty"><AttendanceMarking /></ProtectedRoute>} />
        <Route path="/faculty/lms/native/attendance"       element={<ProtectedRoute allowedRole="faculty"><FacultyNativeAttendance /></ProtectedRoute>} />
        <Route path="/faculty/lms/native/assignments"      element={<ProtectedRoute allowedRole="faculty"><FacultyNativeAssignments /></ProtectedRoute>} />
        <Route path="/faculty/lms/native/quizzes"          element={<ProtectedRoute allowedRole="faculty"><FacultyNativeQuizzes /></ProtectedRoute>} />
        <Route path="/faculty/resources"                   element={<ProtectedRoute allowedRole="faculty"><FacultyResources /></ProtectedRoute>} />

        {/* Student LMS Routes */}
        <Route path="/lms"                    element={<ProtectedRoute allowedRole="student"><LMSDashboard /></ProtectedRoute>} />
        <Route path="/lms/courses/:id"        element={<ProtectedRoute allowedRole="student"><LMSCourse /></ProtectedRoute>} />
        <Route path="/lms/assignments"        element={<ProtectedRoute allowedRole="student"><LMSAssignments /></ProtectedRoute>} />
        <Route path="/lms/assignments/:id"    element={<ProtectedRoute allowedRole="student"><LMSAssignmentDetail /></ProtectedRoute>} />
        <Route path="/lms/grades"             element={<ProtectedRoute allowedRole="student"><LMSGrades /></ProtectedRoute>} />
        <Route path="/lms/native/attendance"  element={<ProtectedRoute allowedRole="student"><NativeAttendance /></ProtectedRoute>} />
        <Route path="/lms/native/assignments" element={<ProtectedRoute allowedRole="student"><NativeAssignments /></ProtectedRoute>} />
        <Route path="/lms/native/grades"      element={<ProtectedRoute allowedRole="student"><NativeGradebook /></ProtectedRoute>} />
        <Route path="/lms/native/quiz/:id"    element={<ProtectedRoute allowedRole="student"><NativeQuizAttempt /></ProtectedRoute>} />
        <Route path="/lms/native/pyq"         element={<ProtectedRoute allowedRole={['student', 'faculty', 'admin']}><NativePYQ /></ProtectedRoute>} />

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
        <Route path="/admin/lms/courses"   element={<ProtectedRoute allowedRole="admin"><ManageCourses /></ProtectedRoute>} />
        <Route path="/admin/lms/structure" element={<ProtectedRoute allowedRole="admin"><LMSStructure /></ProtectedRoute>} />
        <Route path="/admin/lms/bulk"      element={<ProtectedRoute allowedRole="admin"><LMSBulkUpload /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </Router>
  )
}
