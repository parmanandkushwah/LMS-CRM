import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Search, Bell, Sun, Moon, Monitor, Plus, Menu,
  ChevronDown, Settings, User, LogOut, Command, X,
  Users, CheckSquare, Building2, UserCheck
} from 'lucide-react'
import { cn, formatRelativeTime } from '../utils'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import { Avatar } from '../components/ui'
import Button from '../components/ui/Button'
import { MOCK_ACTIVITIES } from '../constants'
import toast from 'react-hot-toast'

const SEARCH_RESULTS = [
  { type: 'lead', label: 'Sarah Johnson', sub: 'TechCorp Inc', icon: Users, path: '/leads' },
  { type: 'lead', label: 'Michael Brown', sub: 'Innovate.io', icon: Users, path: '/leads' },
  { type: 'customer', label: 'Lisa Martinez', sub: 'GlobalTech', icon: UserCheck, path: '/customers' },
  { type: 'task', label: 'Follow up with Sarah', sub: 'Due tomorrow', icon: CheckSquare, path: '/tasks' },
  { type: 'company', label: 'TechCorp Inc', sub: '5 leads', icon: Building2, path: '/companies' },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]
  const current = options.find(o => o.value === theme) || options[1]

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(p => !p)}>
        <current.icon className="w-4 h-4" />
      </Button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-11 w-36 glass rounded-xl border border-app shadow-card-dark z-20 p-1"
            >
              {options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setTheme(opt.value); setOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                    theme === opt.value ? 'text-primary-500 bg-primary-500/10' : 'text-body hover:text-heading hover:bg-white/8'
                  )}
                >
                  <opt.icon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const unread = 3

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(p => !p)} className="relative">
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-dark-bg" />
        )}
      </Button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-11 w-80 glass rounded-2xl border border-app shadow-card-dark z-20 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-app">
                <h4 className="text-sm font-semibold text-heading">Notifications</h4>
                <span className="text-xs bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded-full">{unread} new</span>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {MOCK_ACTIVITIES.map((a, i) => (
                  <div key={a.id} className={cn('flex gap-3 px-4 py-3 hover:bg-white/4 transition-colors cursor-pointer border-b border-app last:border-0', i < unread && 'bg-primary-500/4')}>
                    <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-3.5 h-3.5 text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-heading font-medium leading-relaxed">{a.message}</p>
                      <p className="text-xs text-muted mt-0.5">{a.time}</p>
                    </div>
                    {i < unread && <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />}
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-app">
                <button className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors">Mark all as read</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProfileMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(p => !p)} className="flex items-center gap-2 hover:bg-white/8 rounded-xl px-2 py-1.5 transition-colors">
        <Avatar name={user?.name} size="sm" />
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-heading leading-tight">{user?.name}</p>
          <p className="text-xs text-muted leading-tight">{user?.role}</p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-muted hidden sm:block" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-48 glass rounded-xl border border-app shadow-card-dark z-20 p-1"
            >
              <div className="px-3 py-2 border-b border-app mb-1">
                <p className="text-xs font-semibold text-heading">{user?.name}</p>
                <p className="text-xs text-muted">{user?.email}</p>
              </div>
              {[
                { label: 'Profile', icon: User, path: '/profile' },
                { label: 'Settings', icon: Settings, path: '/settings' },
              ].map(item => (
                <button key={item.path} onClick={() => { navigate(item.path); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-body hover:text-heading hover:bg-white/8 transition-colors">
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              ))}
              <div className="border-t border-app mt-1 pt-1">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/8 transition-colors">
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const filtered = query ? SEARCH_RESULTS.filter(r =>
    r.label.toLowerCase().includes(query.toLowerCase()) ||
    r.sub.toLowerCase().includes(query.toLowerCase())
  ) : SEARCH_RESULTS

  return (
    <>
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
        className="hidden md:flex items-center gap-2 h-9 px-3 rounded-xl border border-app bg-card text-muted text-sm hover:border-primary-500/30 transition-all w-56"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-xs bg-white/8 px-1.5 py-0.5 rounded-md font-mono">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -16 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-xl glass rounded-2xl border border-app shadow-card-dark overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-app">
                <Search className="w-4 h-4 text-muted flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search leads, customers, tasks..."
                  className="flex-1 bg-transparent text-heading placeholder:text-muted text-sm focus:outline-none"
                />
                {query && <button onClick={() => setQuery('')}><X className="w-4 h-4 text-muted hover:text-heading" /></button>}
                <kbd className="text-xs bg-white/8 px-1.5 py-0.5 rounded-md font-mono text-muted">ESC</kbd>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin p-2">
                {filtered.length === 0 ? (
                  <p className="text-center text-muted text-sm py-8">No results found</p>
                ) : (
                  filtered.map((r, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => { navigate(r.path); setOpen(false); setQuery('') }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                        <r.icon className="w-4 h-4 text-primary-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-heading">{r.label}</p>
                        <p className="text-xs text-muted">{r.sub}</p>
                      </div>
                      <span className="ml-auto text-xs text-muted capitalize bg-white/6 px-2 py-0.5 rounded-md">{r.type}</span>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default function Header({ title, subtitle }) {
  const { toggleMobile } = useSidebar()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 glass border-b border-app px-4 lg:px-6 h-14 flex items-center gap-4">
      <button onClick={toggleMobile} className="lg:hidden text-muted hover:text-heading transition-colors">
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0">
        {title && (
          <div>
            <h1 className="text-sm font-semibold text-heading truncate">{title}</h1>
            {subtitle && <p className="text-xs text-muted hidden sm:block">{subtitle}</p>}
          </div>
        )}
      </div>

      <GlobalSearch />

      <div className="flex items-center gap-1">
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/leads')}
          className="hidden sm:flex gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Lead</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate('/leads')} className="sm:hidden">
          <Plus className="w-4 h-4" />
        </Button>
        <ThemeToggle />
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  )
}
