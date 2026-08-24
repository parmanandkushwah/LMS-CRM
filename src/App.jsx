import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useIsMutating } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import RoleGuard from './routes/RoleGuard'
import AppLayout from './layouts/AppLayout'

// Auth Pages
import Login from './pages/auth/Login'

// App Pages
import Dashboard from './pages/dashboard/Dashboard'
import Leads from './pages/leads/Leads'
import LeadDetails from './pages/leads/LeadDetails'
import Pipeline from './pages/pipeline/Pipeline'
import Customers from './pages/customers/Customers'
import Employees from './pages/employees/Employees'
import Tasks from './pages/tasks/Tasks'
import FollowUps from './pages/followups/FollowUps'
import Quotations from './pages/quotations/Quotations'
import Invoices from './pages/invoices/Invoices'
import Purchases from './pages/purchases/Purchases'
import Reports from './pages/reports/Reports'
import FinancialReports from './pages/reports/FinancialReports'
import Settings from './pages/settings/Settings'
import { Calendar, Companies, Documents, Profile, Subscription } from './pages/misc/MiscPages'
import { NotFound, Forbidden, ServerError } from './pages/errors/ErrorPages'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5 * 60 * 1000 } }
})

function GlobalActionLoader() {
  const isMutating = useIsMutating()

  if (!isMutating) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/35 backdrop-blur-[2px] pointer-events-none">
      <div className="flex items-center gap-3 rounded-full border border-primary-500/40 bg-app px-4 py-2 text-xs font-semibold text-primary-400 shadow-xl">
        <span className="animate-spin rounded-full border-2 border-current border-t-transparent w-4 h-4" />
        <span>Working…</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalActionLoader />
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
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
                <Route path="tasks" element={<Tasks />} />
                <Route path="followups" element={<FollowUps />} />
                <Route path="quotations" element={<Quotations />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="purchases" element={<Purchases />} />
                <Route path="financial-reports" element={
                  <RoleGuard roles={['admin', 'manager']}>
                    <FinancialReports />
                  </RoleGuard>
                } />
                <Route path="calendar" element={<Calendar />} />
                <Route path="documents" element={<Documents />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="subscription" element={<Subscription />} />
                <Route path="employees" element={
                  <RoleGuard roles={['admin', 'manager']}>
                    <Employees />
                  </RoleGuard>
                } />
                <Route path="reports" element={
                  <RoleGuard roles={['admin', 'manager']}>
                    <Reports />
                  </RoleGuard>
                } />
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
