import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users, UserPlus, Mail, Phone, Shield, ToggleLeft, ToggleRight,
  X, User, Lock, ArrowRight, Search, ChevronDown, Check, Pencil, KeyRound
} from 'lucide-react'
import { Card, Avatar, StatCard } from '../../components/ui'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { cn, formatNumber } from '../../utils'

// ─── Schema ──────────────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(7, 'Invalid phone').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'manager', 'agent']),
})

const editSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(7, 'Invalid phone').optional().or(z.literal('')),
  role: z.enum(['admin', 'manager', 'agent']),
})

const resetSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const ROLE_COLORS = {
  admin: 'bg-red-500/15 text-red-400 border-red-500/20',
  manager: 'bg-brand-blue/15 text-brand-blue border-brand-blue/20',
  agent: 'bg-primary-500/15 text-primary-500 border-primary-500/20',
}

const ROLE_OPTIONS = [
  { value: 'agent', label: 'Agent', dot: ROLE_COLORS.agent.split(' ')[0] },
  { value: 'manager', label: 'Manager', dot: ROLE_COLORS.manager.split(' ')[0] },
  { value: 'admin', label: 'Admin', dot: ROLE_COLORS.admin.split(' ')[0] },
]

// ─── Generic Dropdown ─────────────────────────────────────────────────────────
function Dropdown({ options, value, onChange, placeholder = 'Select', error, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white/5 border text-sm text-heading focus:outline-none transition-colors',
          error ? 'border-red-500/50' : open ? 'border-primary-500/50' : 'border-app'
        )}
      >
        <span className={cn(!selected && 'text-muted')}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={cn('w-4 h-4 text-muted transition-transform flex-shrink-0', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-xl bg-sidebar border border-app shadow-card-dark py-1"
          >
            {options.map(opt => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-white/5',
                    opt.value === value ? 'text-heading' : 'text-muted'
                  )}
                >
                  <span className="flex items-center gap-2">
                    {opt.dot && <span className={cn('w-1.5 h-1.5 rounded-full', opt.dot)} />}
                    {opt.label}
                  </span>
                  {opt.value === value && <Check className="w-4 h-4 text-primary-500" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Add User Modal ───────────────────────────────────────────────────────────
function AddUserModal({ onClose }) {
  const queryClient = useQueryClient()

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'agent' },
  })

  const mutation = useMutation({
    mutationFn: (data) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User created successfully!')
      onClose()
    },
    onError: (err) => toast.error(err.message),
  })

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative glass rounded-2xl p-6 w-full max-w-md border border-app shadow-card-dark"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-heading">Add New User</h2>
            <p className="text-xs text-muted mt-0.5">Create a new team member account</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-heading transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <Input label="Full Name" icon={User} placeholder="John Doe" error={errors.name?.message} {...register('name')} />
          <Input label="Email" icon={Mail} type="email" placeholder="john@company.com" error={errors.email?.message} {...register('email')} />
          <Input label="Phone" icon={Phone} placeholder="+1 555-0100" error={errors.phone?.message} {...register('phone')} />
          <Input label="Password" icon={Lock} type="password" placeholder="Minimum 6 characters" error={errors.password?.message} {...register('password')} />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">Role</label>
            <Dropdown
              options={ROLE_OPTIONS}
              value={watch('role')}
              onChange={(v) => setValue('role', v, { shouldValidate: true })}
              error={errors.role?.message}
            />
            {errors.role && <p className="text-xs text-red-400">{errors.role.message}</p>}
          </div>

          <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-2">
            Create User <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </motion.div>
    </div>,
    document.body
  )
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────
function EditUserModal({ user, onClose }) {
  const queryClient = useQueryClient()

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: { name: user.name, email: user.email, phone: user.phone || '', role: user.role },
  })

  const mutation = useMutation({
    // Preserve is_active so the update controller doesn't clear it.
    mutationFn: (d) => api.put(`/users/${user.id}`, { ...d, is_active: user.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User updated successfully!')
      onClose()
    },
    onError: (err) => toast.error(err.message),
  })

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative glass rounded-2xl p-6 w-full max-w-md border border-app shadow-card-dark"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-heading">Edit User</h2>
            <p className="text-xs text-muted mt-0.5">Update {user.name}'s details</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-heading transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <Input label="Full Name" icon={User} placeholder="John Doe" error={errors.name?.message} {...register('name')} />
          <Input label="Email" icon={Mail} type="email" placeholder="john@company.com" error={errors.email?.message} {...register('email')} />
          <Input label="Phone" icon={Phone} placeholder="+1 555-0100" error={errors.phone?.message} {...register('phone')} />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">Role</label>
            <Dropdown
              options={ROLE_OPTIONS}
              value={watch('role')}
              onChange={(v) => setValue('role', v, { shouldValidate: true })}
              error={errors.role?.message}
            />
            {errors.role && <p className="text-xs text-red-400">{errors.role.message}</p>}
          </div>

          <Button type="submit" size="lg" loading={isSubmitting || mutation.isPending} className="w-full mt-2">
            Save Changes <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </motion.div>
    </div>,
    document.body
  )
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ user, onClose }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetSchema),
  })

  const mutation = useMutation({
    mutationFn: (d) => api.patch(`/users/${user.id}/reset-password`, { password: d.password }),
    onSuccess: () => {
      toast.success('Password reset successfully!')
      onClose()
    },
    onError: (err) => toast.error(err.message),
  })

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative glass rounded-2xl p-6 w-full max-w-md border border-app shadow-card-dark"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-heading">Reset Password</h2>
            <p className="text-xs text-muted mt-0.5">Set a new password for {user.name}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-heading transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <Input label="New Password" icon={Lock} type="password" placeholder="Minimum 6 characters" error={errors.password?.message} {...register('password')} />

          <Button type="submit" size="lg" loading={isSubmitting || mutation.isPending} className="w-full mt-2">
            Reset Password <KeyRound className="w-4 h-4" />
          </Button>
        </form>
      </motion.div>
    </div>,
    document.body
  )
}

// ─── User Card ────────────────────────────────────────────────────────────────
function UserCard({ user: u, canManage, metrics, onEdit, onResetPassword }) {
  const queryClient = useQueryClient()
  const m = metrics || { leads: 0, won: 0, revenue: 0 }

  const toggleMutation = useMutation({
    mutationFn: () => api.patch(`/users/${u.id}/toggle-status`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(`User ${u.is_active ? 'deactivated' : 'activated'}`)
    },
    onError: (err) => toast.error(err.message),
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 border border-app hover:border-primary-500/20 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar name={u.name} size="lg" src={u.avatar} />
            <div className={cn(
              'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-app',
              u.is_active ? 'bg-primary-500' : 'bg-gray-500'
            )} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-heading">{u.name}</h3>
            <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium capitalize', ROLE_COLORS[u.role])}>
              {u.role}
            </span>
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onEdit(u)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-heading hover:bg-white/8 transition-colors"
              title="Edit user"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onResetPassword(u)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-heading hover:bg-white/8 transition-colors"
              title="Reset password"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleMutation.mutate()}
              disabled={toggleMutation.isPending}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-heading hover:bg-white/8 transition-colors"
              title={u.is_active ? 'Deactivate' : 'Activate'}
            >
              {u.is_active
                ? <ToggleRight className="w-5 h-5 text-primary-500" />
                : <ToggleLeft className="w-5 h-5" />
              }
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{u.email}</span>
        </div>
        {u.phone && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{u.phone}</span>
          </div>
        )}
        {u.last_login && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Shield className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Last login: {new Date(u.last_login).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Performance metrics (from leads API) */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-app">
        {[
          { label: 'Leads', value: m.leads },
          { label: 'Won', value: m.won },
          { label: 'Revenue', value: `Rs ${formatNumber(m.revenue)}` },
        ].map(s => (
          <div key={s.label} className="text-center p-2 rounded-lg bg-white/4">
            <p className="text-xs font-bold text-heading">{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Employees() {
  const { user: currentUser } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [resetUser, setResetUser] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const canManage = ['admin', 'manager'].includes(currentUser?.role)

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, roleFilter],
    queryFn: () => api.get('/users', { params: { search: search || undefined, role: roleFilter || undefined } }),
  })

  const { data: metricsData } = useQuery({
    queryKey: ['employee-metrics'],
    queryFn: () => api.get('/dashboard/reports/employee-metrics'),
  })

  const metricsByUser = useMemo(() => metricsData?.data || {}, [metricsData])

  const users = data?.data || []
  const total = data?.pagination?.total || users.length

  const stats = [
    { title: 'Total Users', value: total, icon: Users, iconColor: 'text-brand-blue', iconBg: 'bg-brand-blue/10' },
    { title: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: Shield, iconColor: 'text-red-400', iconBg: 'bg-red-500/10' },
    { title: 'Managers', value: users.filter(u => u.role === 'manager').length, icon: UserPlus, iconColor: 'text-brand-blue', iconBg: 'bg-brand-blue/10' },
    { title: 'Agents', value: users.filter(u => u.role === 'agent').length, icon: User, iconColor: 'text-primary-500', iconBg: 'bg-primary-500/10' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-heading">Team Members</h1>
          <p className="text-sm text-muted mt-0.5">{total} users in your organization</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowModal(true)}>
            <UserPlus className="w-4 h-4" /> Add User
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="relative z-20">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-app text-sm text-heading placeholder:text-muted focus:outline-none focus:border-primary-500/50 transition-colors"
            />
          </div>
          <Dropdown
            className="sm:w-44"
            options={[
              { value: '', label: 'All Roles' },
              { value: 'admin', label: 'Admin', dot: ROLE_COLORS.admin.split(' ')[0] },
              { value: 'manager', label: 'Manager', dot: ROLE_COLORS.manager.split(' ')[0] },
              { value: 'agent', label: 'Agent', dot: ROLE_COLORS.agent.split(' ')[0] },
            ]}
            value={roleFilter}
            onChange={setRoleFilter}
            placeholder="All Roles"
          />
        </div>
      </Card>

      {/* Users Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 border border-app animate-pulse h-40" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-sm text-muted">No users found</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <UserCard
                user={u}
                canManage={canManage}
                metrics={metricsByUser[u.id]}
                onEdit={setEditUser}
                onResetPassword={setResetUser}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showModal && <AddUserModal onClose={() => setShowModal(false)} />}
        {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} />}
        {resetUser && <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} />}
      </AnimatePresence>
    </div>
  )
}
