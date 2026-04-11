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
import FacultyDashboard from './pages/faculty/Dashboard'
import FacultyProfile   from './pages/faculty/Profile'
import FacultyRequests  from './pages/faculty/Requests'

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
        <Route path="/faculty/dashboard" element={<ProtectedRoute allowedRole="faculty"><FacultyDashboard /></ProtectedRoute>} />
        <Route path="/faculty/profile"   element={<ProtectedRoute allowedRole="faculty"><FacultyProfile /></ProtectedRoute>} />
        <Route path="/faculty/workspace" element={<ProtectedRoute allowedRole="faculty"><Workspace role="faculty" /></ProtectedRoute>} />
        <Route path="/faculty/requests"  element={<ProtectedRoute allowedRole="faculty"><FacultyRequests /></ProtectedRoute>} />
        <Route path="/faculty/calendar"  element={<ProtectedRoute allowedRole="faculty"><CalendarPage /></ProtectedRoute>} />

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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </Router>
  )
}
