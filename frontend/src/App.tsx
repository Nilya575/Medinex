import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { Sidebar } from './components/layout/Sidebar'
import { PageLoader } from './components/ui/Spinner'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import PendingVerification from './pages/PendingVerification'

// Patient pages
import PatientDashboard from './pages/patient/Dashboard'
import PatientDocuments from './pages/patient/Documents'
import PatientPrescriptions from './pages/patient/Prescriptions'
import PatientDoctors from './pages/patient/Doctors'
import PatientProfile from './pages/patient/Profile'

// Doctor pages
import DoctorDashboard from './pages/doctor/Dashboard'
import DoctorPatients from './pages/doctor/Patients'
import DoctorRequests from './pages/doctor/Requests'
import DoctorProfile from './pages/doctor/Profile'

// Protected layout wrapper
function ProtectedLayout({ children, role }: { children: React.ReactNode; role?: 'patient' | 'doctor' }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!user || !profile) return <Navigate to="/login" replace />
  if (role && profile.role !== role) {
    return <Navigate to={profile.role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard'} replace />
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0f1e' }}>
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        {children}
      </div>
    </div>
  )
}

// Doctor verification guard
function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { doctorProfile, loading } = useAuth()

  if (loading) return <PageLoader />

  return (
    <ProtectedLayout role="doctor">
      {children}
    </ProtectedLayout>
  )
}

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) return <PageLoader />

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={
        user && profile
          ? <Navigate to={profile.role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard'} replace />
          : <Login />
      } />
      <Route path="/register" element={<Register />} />
      <Route path="/pending-verification" element={<PendingVerification />} />

      {/* Patient routes */}
      <Route path="/patient/dashboard" element={
        <ProtectedLayout role="patient"><PatientDashboard /></ProtectedLayout>
      } />
      <Route path="/patient/documents" element={
        <ProtectedLayout role="patient"><PatientDocuments /></ProtectedLayout>
      } />
      <Route path="/patient/prescriptions" element={
        <ProtectedLayout role="patient"><PatientPrescriptions /></ProtectedLayout>
      } />
      <Route path="/patient/doctors" element={
        <ProtectedLayout role="patient"><PatientDoctors /></ProtectedLayout>
      } />
      <Route path="/patient/profile" element={
        <ProtectedLayout role="patient"><PatientProfile /></ProtectedLayout>
      } />

      {/* Doctor routes */}
      <Route path="/doctor/dashboard" element={
        <DoctorLayout><DoctorDashboard /></DoctorLayout>
      } />
      <Route path="/doctor/patients" element={
        <DoctorLayout><DoctorPatients /></DoctorLayout>
      } />
      <Route path="/doctor/requests" element={
        <DoctorLayout><DoctorRequests /></DoctorLayout>
      } />
      <Route path="/doctor/profile" element={
        <DoctorLayout><DoctorProfile /></DoctorLayout>
      } />

      {/* Fallback */}
      <Route path="*" element={
        user && profile
          ? <Navigate to={profile.role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard'} replace />
          : <Navigate to="/" replace />
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0d1526',
              color: '#f1f5f9',
              border: '1px solid rgba(6,182,212,0.2)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#0d1526' },
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: '#0d1526' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
