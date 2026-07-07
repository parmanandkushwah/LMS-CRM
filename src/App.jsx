import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import AppLayout from './layouts/AppLayout'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// App Pages
import Dashboard from './pages/dashboard/Dashboard'
import Leads from './pages/leads/Leads'
import LeadDetails from './pages/leads/LeadDetails'
import Pipeline from './pages/pipeline/Pipeline'
import Customers from './pages/customers/Customers'
import Employees from './pages/employees/Employees'
import Tasks from './pages/tasks/Tasks'
import FollowUps from './pages/followups/FollowUps'
import Reports from './pages/reports/Reports'
import Settings from './pages/settings/Settings'
import { Calendar, Companies, Documents, Profile, Subscription } from './pages/misc/MiscPages'
import { NotFound, Forbidden, ServerError } from './pages/errors/ErrorPages'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5 * 60 * 1000 } }
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/403" element={<Forbidden />} />
              <Route path="/500" element={<ServerError />} />

              {/* Protected */}
              <Route path="/" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="leads" element={<Leads />} />
                <Route path="leads/:id" element={<LeadDetails />} />
                <Route path="pipeline" element={<Pipeline />} />
                <Route path="customers" element={<Customers />} />
                <Route path="companies" element={<Companies />} />
                <Route path="employees" element={<Employees />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="followups" element={<FollowUps />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="reports" element={<Reports />} />
                <Route path="documents" element={<Documents />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="subscription" element={<Subscription />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--sidebar)',
                color: 'var(--heading)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
              },
              success: { iconTheme: { primary: '#10B981', secondary: 'white' } },
              error: { iconTheme: { primary: '#EF4444', secondary: 'white' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
