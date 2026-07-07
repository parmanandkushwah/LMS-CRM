import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import { SidebarProvider } from '../contexts/SidebarContext'

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Welcome back! Here\'s what\'s happening.' },
  '/leads': { title: 'Leads', subtitle: 'Manage and track your leads' },
  '/pipeline': { title: 'Pipeline', subtitle: 'Visual sales pipeline' },
  '/customers': { title: 'Customers', subtitle: 'Manage your customers' },
  '/companies': { title: 'Companies', subtitle: 'Company accounts' },
  '/employees': { title: 'Employees', subtitle: 'Team management' },
  '/tasks': { title: 'Tasks', subtitle: 'Track your tasks' },
  '/followups': { title: 'Follow Ups', subtitle: 'Scheduled follow-ups' },
  '/calendar': { title: 'Calendar', subtitle: 'Schedule and events' },
  '/reports': { title: 'Reports', subtitle: 'Analytics and insights' },
  '/documents': { title: 'Documents', subtitle: 'File management' },
  '/settings': { title: 'Settings', subtitle: 'Configure your workspace' },
  '/profile': { title: 'Profile', subtitle: 'Your account details' },
  '/subscription': { title: 'Subscription', subtitle: 'Manage your plan' },
}

export default function AppLayout() {
  const location = useLocation()
  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'LeadFlow', subtitle: '' }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-app overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header title={pageInfo.title} subtitle={pageInfo.subtitle} />
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="p-4 lg:p-6 min-h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
