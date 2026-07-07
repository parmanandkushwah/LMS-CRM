import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Kanban, UserCheck, Building2, UserCog,
  CheckSquare, Bell, CalendarDays, BarChart3, FolderOpen, Settings,
  ChevronLeft, ChevronRight, LogOut, CreditCard, User, Zap, X
} from 'lucide-react'
import { cn } from '../utils'
import { useSidebar } from '../contexts/SidebarContext'
import { useAuth } from '../contexts/AuthContext'
import { Avatar } from '../components/ui'
import toast from 'react-hot-toast'

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/leads', label: 'Leads', icon: Users },
      { path: '/pipeline', label: 'Pipeline', icon: Kanban },
    ]
  },
  {
    label: 'Management',
    items: [
      { path: '/customers', label: 'Customers', icon: UserCheck },
      { path: '/companies', label: 'Companies', icon: Building2 },
      { path: '/employees', label: 'Employees', icon: UserCog },
    ]
  },
  {
    label: 'Productivity',
    items: [
      { path: '/tasks', label: 'Tasks', icon: CheckSquare },
      { path: '/followups', label: 'Follow Ups', icon: Bell },
      { path: '/calendar', label: 'Calendar', icon: CalendarDays },
    ]
  },
  {
    label: 'Insights',
    items: [
      { path: '/reports', label: 'Reports', icon: BarChart3 },
      { path: '/documents', label: 'Documents', icon: FolderOpen },
    ]
  },
]

const BOTTOM_ITEMS = [
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/subscription', label: 'Subscription', icon: CreditCard },
  { path: '/profile', label: 'Profile', icon: User },
]

function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) => cn(
        'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
        'hover:bg-white/8',
        isActive
          ? 'bg-primary-500/10 text-primary-500'
          : 'text-muted hover:text-heading'
      )}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="activeNav"
              className="absolute inset-0 bg-primary-500/10 rounded-xl border border-primary-500/20"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <item.icon className={cn('w-4.5 h-4.5 flex-shrink-0 relative z-10 transition-transform group-hover:scale-110', isActive ? 'text-primary-500' : '')} style={{ width: 18, height: 18 }} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden relative z-10"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
          {isActive && !collapsed && (
            <motion.div
              layoutId="activeDot"
              className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 relative z-10"
            />
          )}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const { collapsed, toggle, mobileOpen, closeMobile } = useSidebar()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-app', collapsed && 'justify-center px-3')}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-brand-blue flex items-center justify-center flex-shrink-0 shadow-glow">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <span className="text-base font-bold text-heading whitespace-nowrap">LeadFlow</span>
              <p className="text-xs text-muted whitespace-nowrap">CRM Platform</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-6">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-semibold text-muted uppercase tracking-wider px-3 mb-2"
                >
                  {section.label}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavItem key={item.path} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-app space-y-0.5">
        {BOTTOM_ITEMS.map(item => (
          <NavItem key={item.path} item={item} collapsed={collapsed} />
        ))}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
            'text-muted hover:text-red-400 hover:bg-red-500/8',
            collapsed && 'justify-center'
          )}
        >
          <LogOut style={{ width: 18, height: 18 }} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* User */}
      <div className={cn('px-3 py-3 border-t border-app', collapsed && 'flex justify-center')}>
        <div className={cn('flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/8 transition-colors cursor-pointer', collapsed && 'px-0')}>
          <Avatar name={user?.name} size="sm" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden min-w-0"
              >
                <p className="text-sm font-medium text-heading truncate whitespace-nowrap">{user?.name}</p>
                <p className="text-xs text-muted truncate whitespace-nowrap">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 240 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="hidden lg:flex flex-col glass-sidebar h-screen sticky top-0 flex-shrink-0 overflow-hidden"
      >
        {sidebarContent}
        {/* Collapse Toggle */}
        <button
          onClick={toggle}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full glass border border-app flex items-center justify-center text-muted hover:text-heading hover:border-primary-500/50 transition-all z-10 shadow-card"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="fixed left-0 top-0 h-full w-64 glass-sidebar z-50 lg:hidden"
            >
              <button onClick={closeMobile} className="absolute top-4 right-4 text-muted hover:text-heading">
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
