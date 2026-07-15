import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, Plus, CheckCircle, AlertCircle, User, ChevronDown, Check,
  Search, MoreVertical, Pencil, Trash2, CalendarClock, RotateCcw, Phone, Mail, Repeat
} from 'lucide-react'
import { Card, Avatar } from '../../components/ui'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { cn, formatDate, formatTime } from '../../utils'
import api from '../../services/api'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  overdue: { label: 'Overdue', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertCircle },
  today: { label: 'Today', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Clock },
  upcoming: { label: 'Upcoming', color: 'text-primary-500', bg: 'bg-primary-500/10', border: 'border-primary-500/20', icon: Calendar },
}

const TYPE_LABELS = { call: 'Call', email: 'Email', meeting: 'Meeting', whatsapp: 'WhatsApp', task: 'Task' }
const TYPE_COLORS = {
  Call: 'bg-brand-blue/10 text-brand-blue',
  Email: 'bg-brand-purple/10 text-brand-purple',
  Meeting: 'bg-primary-500/10 text-primary-500',
  WhatsApp: 'bg-green-500/10 text-green-400',
  Task: 'bg-orange-500/10 text-orange-400',
}

const TYPE_OPTIONS = [
  { value: 'call', label: 'Call', dot: 'bg-brand-blue' },
  { value: 'email', label: 'Email', dot: 'bg-brand-purple' },
  { value: 'meeting', label: 'Meeting', dot: 'bg-primary-500' },
  { value: 'whatsapp', label: 'WhatsApp', dot: 'bg-green-400' },
  { value: 'task', label: 'Task', dot: 'bg-orange-400' },
]

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
]
const RECURRENCE_LABELS = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly' }

function startOfDay(d) {
  const x = new Date(d)
  return new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
}

// Snooze relative to today (avoids piling up more overdue), keeping the original time-of-day.
function snoozeDate(base, days) {
  const src = base ? new Date(base) : new Date()
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  d.setDate(d.getDate() + days)
  d.setHours(src.getHours() || 9, src.getMinutes() || 0, 0, 0)
  return d
}

function toLocalInput(date) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Next occurrence for a recurring follow-up, based on its scheduled date.
function nextRecurrenceDate(base, recurrence) {
  const d = base ? new Date(base) : new Date()
  switch (recurrence) {
    case 'daily': d.setDate(d.getDate() + 1); break
    case 'weekly': d.setDate(d.getDate() + 7); break
    case 'biweekly': d.setDate(d.getDate() + 14); break
    case 'monthly': d.setMonth(d.getMonth() + 1); break
    default: return null
  }
  return d
}

function mapFollowUp(a) {
  const target = startOfDay(a.scheduled_at)
  const today = startOfDay(new Date())
  let status
  if (target < today) status = 'overdue'
  else if (target === today) status = 'today'
  else status = 'upcoming'

  return {
    id: a.id,
    leadId: a.lead?.id,
    leadName: a.lead?.contact_name || a.lead?.title || 'Lead',
    company: a.lead?.company_name || '',
    email: a.lead?.contact_email || '',
    phone: a.lead?.contact_phone || '',
    assigneeId: a.user?.id,
    assignedTo: a.user?.name || '',
    typeKey: a.type,
    type: TYPE_LABELS[a.type] || a.type,
    date: a.scheduled_at,
    scheduledAtRaw: a.scheduled_at,
    time: formatTime(a.scheduled_at),
    status,
    outcome: a.outcome,
    completedAt: a.completed_at,
    recurrence: a.metadata?.recurrence || 'none',
    metadataRaw: a.metadata || {},
    notes: a.description || a.title || '',
  }
}

function applyFilters(list, { search, type, assignee }) {
  const q = search.trim().toLowerCase()
  return list.filter(f => {
    if (type && f.typeKey !== type) return false
    if (assignee && String(f.assigneeId) !== assignee) return false
    if (q && !(
      f.leadName.toLowerCase().includes(q) ||
      f.company.toLowerCase().includes(q) ||
      f.notes.toLowerCase().includes(q)
    )) return false
    return true
  })
}

// ─── Per-card actions menu ────────────────────────────────────────────────────
function ActionsMenu({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-heading hover:bg-white/8 transition-colors"
        title="More actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-20 mt-1.5 w-44 overflow-hidden rounded-xl bg-sidebar border border-app shadow-card-dark py-1"
          >
            {items.map((it, i) => (
              <li key={i}>
                <button
                  onClick={() => { setOpen(false); it.onClick() }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-white/5',
                    it.danger ? 'text-red-400' : 'text-body'
                  )}
                >
                  {it.icon}{it.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Generic ul/li Dropdown ───────────────────────────────────────────────────
function Dropdown({ options, value, onChange, placeholder = 'Select', className = '' }) {
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
          open ? 'border-primary-500/50' : 'border-app'
        )}
      >
        <span className={cn('flex items-center gap-2 min-w-0', !selected && 'text-muted')}>
          {selected?.dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', selected.dot)} />}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown className={cn('w-4 h-4 text-muted transition-transform flex-shrink-0', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 mt-1.5 w-full max-h-56 overflow-y-auto scrollbar-thin rounded-xl bg-sidebar border border-app shadow-card-dark py-1"
          >
            {options.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted">No options</li>
            )}
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
                  <span className="flex items-center gap-2 min-w-0">
                    {opt.dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', opt.dot)} />}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {opt.value === value && <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

function FollowUpCard({ followup, onDone, onCompleteNext, onReopen, onSnooze, onEdit, onDelete, busy }) {
  const config = STATUS_CONFIG[followup.status]
  const StatusIcon = config.icon
  const isCompleted = followup.outcome === 'completed'
  const isRecurring = followup.recurrence && followup.recurrence !== 'none'

  const menuItems = isCompleted
    ? [
        { label: 'Reopen', icon: <RotateCcw className="w-3.5 h-3.5" />, onClick: () => onReopen(followup) },
        { label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => onDelete(followup) },
      ]
    : [
        { label: 'Complete & schedule next', icon: <CheckCircle className="w-3.5 h-3.5" />, onClick: () => onCompleteNext(followup) },
        { label: 'Snooze to tomorrow', icon: <CalendarClock className="w-3.5 h-3.5" />, onClick: () => onSnooze(followup, 1) },
        { label: 'Snooze 3 days', icon: <CalendarClock className="w-3.5 h-3.5" />, onClick: () => onSnooze(followup, 3) },
        { label: 'Snooze next week', icon: <CalendarClock className="w-3.5 h-3.5" />, onClick: () => onSnooze(followup, 7) },
        { label: 'Edit', icon: <Pencil className="w-3.5 h-3.5" />, onClick: () => onEdit(followup) },
        { label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => onDelete(followup) },
      ]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -1 }}
      className={cn('glass rounded-2xl p-4 border transition-all hover:shadow-card-dark', isCompleted ? 'border-app opacity-75' : config.border)}
    >
      <div className="flex items-start justify-between mb-3">
        <Link to={followup.leadId ? `/leads/${followup.leadId}` : '#'} className="flex items-center gap-3 min-w-0 group">
          <Avatar name={followup.leadName} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-heading truncate group-hover:text-primary-500 transition-colors">{followup.leadName}</p>
            {followup.company && <p className="text-xs text-muted truncate">{followup.company}</p>}
          </div>
        </Link>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isRecurring && (
            <span title={`Repeats: ${RECURRENCE_LABELS[followup.recurrence] || followup.recurrence}`} className="w-5 h-5 rounded-md bg-white/8 flex items-center justify-center text-muted">
              <Repeat className="w-3 h-3" />
            </span>
          )}
          <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium', TYPE_COLORS[followup.type] || 'bg-white/10 text-muted')}>{followup.type}</span>
          <ActionsMenu items={menuItems} />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(followup.date)}
        </div>
        {followup.time && (
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Clock className="w-3.5 h-3.5" />
            {followup.time}
          </div>
        )}
        <div className="flex items-center gap-1 ml-auto">
          {followup.phone && (
            <a href={`tel:${followup.phone}`} onClick={e => e.stopPropagation()} title="Call" className="w-6 h-6 rounded-lg flex items-center justify-center text-muted hover:text-heading hover:bg-white/8 transition-colors">
              <Phone className="w-3 h-3" />
            </a>
          )}
          {followup.email && (
            <a href={`mailto:${followup.email}`} onClick={e => e.stopPropagation()} title="Email" className="w-6 h-6 rounded-lg flex items-center justify-center text-muted hover:text-heading hover:bg-white/8 transition-colors">
              <Mail className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {followup.notes && <p className="text-xs text-muted mb-3 line-clamp-2">{followup.notes}</p>}

      <div className="flex items-center justify-between pt-3 border-t border-app">
        {isCompleted ? (
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-medium text-green-400">Completed{followup.completedAt ? ` · ${formatDate(followup.completedAt)}` : ''}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <StatusIcon className={cn('w-3.5 h-3.5', config.color)} />
            <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {followup.assignedTo && (
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-muted" />
              <span className="text-xs text-muted">{followup.assignedTo.split(' ')[0]}</span>
            </div>
          )}
          {!isCompleted && (
            <Button variant="primary" size="xs" onClick={() => onDone(followup)} disabled={busy}>
              <CheckCircle className="w-3 h-3" />Done
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function FollowUpModal({ open, onClose, followup, prefill }) {
  const queryClient = useQueryClient()
  const isEdit = !!followup
  const [form, setForm] = useState({ leadId: '', type: 'call', scheduledAt: '', notes: '', recurrence: 'none' })

  useEffect(() => {
    if (!open) return
    if (followup) {
      setForm({
        leadId: followup.leadId ? String(followup.leadId) : '',
        type: followup.typeKey || 'call',
        scheduledAt: toLocalInput(followup.scheduledAtRaw),
        notes: followup.notes || '',
        recurrence: followup.recurrence || 'none',
      })
    } else if (prefill) {
      setForm({
        leadId: prefill.leadId ? String(prefill.leadId) : '',
        type: prefill.type || 'call',
        scheduledAt: prefill.scheduledAt || '',
        notes: prefill.notes || '',
        recurrence: prefill.recurrence || 'none',
      })
    } else {
      setForm({ leadId: '', type: 'call', scheduledAt: '', notes: '', recurrence: 'none' })
    }
  }, [open, followup, prefill])

  const { data: leadsData } = useQuery({
    queryKey: ['followups-lead-options'],
    queryFn: () => api.get('/leads', { params: { limit: 1000 } }),
    enabled: open && !isEdit,
  })

  const leadOptions = (leadsData?.data || []).map(l => ({
    value: String(l.id),
    label: l.title || l.contact_name || `Lead #${l.id}`,
  }))

  const mutation = useMutation({
    mutationFn: (payload) => isEdit
      ? api.put(`/leads/activities/${followup.id}`, {
          type: payload.type,
          description: payload.notes || null,
          scheduled_at: payload.scheduledAt,
          metadata: { ...(followup.metadataRaw || {}), recurrence: payload.recurrence },
        })
      : api.post(`/leads/${payload.leadId}/activities`, {
          type: payload.type,
          title: `${TYPE_LABELS[payload.type]} follow-up`,
          description: payload.notes || undefined,
          scheduled_at: payload.scheduledAt,
          outcome: 'pending',
          metadata: { recurrence: payload.recurrence },
        }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] })
      onClose()
      toast.success(isEdit ? 'Follow-up updated!' : 'Follow-up scheduled!')
    },
    onError: (err) => toast.error(err.message),
  })

  const handleSubmit = () => {
    if (!isEdit && !form.leadId) return toast.error('Please select a lead')
    if (!form.scheduledAt) return toast.error('Please pick a date & time')
    mutation.mutate(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Follow-up' : 'Schedule Follow-up'} size="sm" className="overflow-visible"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit} loading={mutation.isPending}>{isEdit ? 'Save' : 'Schedule'}</Button></>}>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted uppercase tracking-wide">Lead</label>
          {isEdit ? (
            <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-app text-sm text-muted">{followup.leadName}{followup.company ? ` · ${followup.company}` : ''}</div>
          ) : (
            <Dropdown options={leadOptions} value={form.leadId} onChange={(v) => setForm(p => ({ ...p, leadId: v }))} placeholder="Select a lead" />
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted uppercase tracking-wide">Type</label>
          <Dropdown options={TYPE_OPTIONS} value={form.type} onChange={(v) => setForm(p => ({ ...p, type: v }))} />
        </div>
        <Input label="Date & Time" type="datetime-local" value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))} />
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted uppercase tracking-wide">Repeat</label>
          <Dropdown options={RECURRENCE_OPTIONS} value={form.recurrence} onChange={(v) => setForm(p => ({ ...p, recurrence: v }))} />
        </div>
        <Input label="Notes" placeholder="Add a note (optional)" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
      </div>
    </Modal>
  )
}

const STATUS_GROUP_TITLES = { overdue: 'Overdue', today: 'Today', upcoming: 'Upcoming' }

export default function FollowUps() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [modal, setModal] = useState({ open: false, followup: null, prefill: null })

  const isCompletedView = filter === 'completed'

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['followups', 'pending'],
    queryFn: () => api.get('/followups'),
  })

  const { data: completedData, isLoading: completedLoading } = useQuery({
    queryKey: ['followups', 'completed'],
    queryFn: () => api.get('/followups', { params: { outcome: 'completed' } }),
    enabled: isCompletedView,
  })

  const pending = (pendingData?.data || []).map(mapFollowUp)
  const completed = (completedData?.data || []).map(mapFollowUp)

  const counts = {
    all: pending.length,
    overdue: pending.filter(f => f.status === 'overdue').length,
    today: pending.filter(f => f.status === 'today').length,
    upcoming: pending.filter(f => f.status === 'upcoming').length,
    completed: completed.length,
  }

  // Assignee filter options (built from loaded data) — shown when >1 assignee exists.
  const assigneeMap = new Map()
  ;[...pending, ...completed].forEach(f => { if (f.assigneeId) assigneeMap.set(String(f.assigneeId), f.assignedTo) })
  const assigneeOptions = [{ value: '', label: 'All assignees' }, ...Array.from(assigneeMap, ([value, label]) => ({ value, label }))]
  const showAssignee = assigneeMap.size > 1

  const typeOptions = [{ value: '', label: 'All types' }, ...TYPE_OPTIONS]

  const filters = { search, type: typeFilter, assignee: assigneeFilter }
  const source = isCompletedView ? completed : pending
  let visible = applyFilters(source, filters)
  if (!isCompletedView && ['overdue', 'today', 'upcoming'].includes(filter)) {
    visible = visible.filter(f => f.status === filter)
  }

  const isLoading = isCompletedView ? completedLoading : pendingLoading

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['followups'] })

  // Creates the next occurrence of a recurring follow-up.
  const createNextMutation = useMutation({
    mutationFn: (f) => api.post(`/leads/${f.leadId}/activities`, {
      type: f.typeKey,
      title: `${TYPE_LABELS[f.typeKey] || 'Follow-up'} follow-up`,
      description: f.notes || undefined,
      scheduled_at: nextRecurrenceDate(f.scheduledAtRaw, f.recurrence),
      outcome: 'pending',
      metadata: { ...(f.metadataRaw || {}), recurrence: f.recurrence },
    }),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(err.message),
  })

  const completeMutation = useMutation({
    mutationFn: ({ f }) => api.put(`/leads/activities/${f.id}`, { outcome: 'completed', completed_at: new Date() }),
    onSuccess: (_d, { f, autoNext }) => {
      invalidate()
      if (autoNext && f.recurrence && f.recurrence !== 'none' && f.leadId) {
        createNextMutation.mutate(f)
        toast.success('Completed — next occurrence scheduled')
      } else {
        toast.success('Follow-up completed!')
      }
    },
    onError: (err) => toast.error(err.message),
  })
  const reopenMutation = useMutation({
    mutationFn: (f) => api.put(`/leads/activities/${f.id}`, { outcome: 'pending', completed_at: null }),
    onSuccess: () => { invalidate(); toast.success('Follow-up reopened') },
    onError: (err) => toast.error(err.message),
  })
  const snoozeMutation = useMutation({
    mutationFn: ({ f, days }) => api.put(`/leads/activities/${f.id}`, { scheduled_at: snoozeDate(f.scheduledAtRaw, days) }),
    onSuccess: () => { invalidate(); toast.success('Follow-up rescheduled') },
    onError: (err) => toast.error(err.message),
  })
  const deleteMutation = useMutation({
    mutationFn: (f) => api.delete(`/leads/activities/${f.id}`),
    onSuccess: () => { invalidate(); toast.success('Follow-up deleted') },
    onError: (err) => toast.error(err.message),
  })

  const busy = completeMutation.isPending || reopenMutation.isPending || snoozeMutation.isPending || deleteMutation.isPending

  // Complete now, then open the modal prefilled to schedule the next one.
  const handleCompleteNext = (f) => {
    completeMutation.mutate({ f, autoNext: false })
    setModal({
      open: true,
      followup: null,
      prefill: {
        leadId: f.leadId,
        type: f.typeKey,
        notes: f.notes,
        recurrence: f.recurrence,
        scheduledAt: toLocalInput(nextRecurrenceDate(f.scheduledAtRaw, 'weekly')),
      },
    })
  }

  const cardHandlers = {
    onDone: (f) => completeMutation.mutate({ f, autoNext: true }),
    onCompleteNext: handleCompleteNext,
    onReopen: reopenMutation.mutate,
    onSnooze: (f, days) => snoozeMutation.mutate({ f, days }),
    onEdit: (f) => setModal({ open: true, followup: f, prefill: null }),
    onDelete: (f) => { if (window.confirm('Delete this follow-up?')) deleteMutation.mutate(f) },
    busy,
  }

  const renderGrid = (items) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {items.map((f, i) => (
          <motion.div key={f.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
            <FollowUpCard followup={f} {...cardHandlers} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )

  const statCards = [
    { key: 'overdue', label: 'Overdue', value: counts.overdue, color: 'text-red-400' },
    { key: 'today', label: "Today's", value: counts.today, color: 'text-yellow-400' },
    { key: 'upcoming', label: 'Upcoming', value: counts.upcoming, color: 'text-primary-500' },
    { key: 'all', label: 'Total Pending', value: counts.all, color: 'text-heading' },
  ]

  const tabs = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'overdue', label: `Overdue (${counts.overdue})` },
    { key: 'today', label: `Today (${counts.today})` },
    { key: 'upcoming', label: `Upcoming (${counts.upcoming})` },
    { key: 'completed', label: isCompletedView ? `Completed (${counts.completed})` : 'Completed' },
  ]

  return (
    <div className="space-y-5">
      {/* Overdue notification */}
      {!isCompletedView && counts.overdue > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-red-300">
              {counts.overdue} overdue follow-up{counts.overdue > 1 ? 's' : ''} need your attention
            </p>
            {counts.today > 0 && (
              <p className="text-xs text-muted">{counts.today} more due today</p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="ml-auto flex-shrink-0" onClick={() => setFilter('overdue')}>
            Review
          </Button>
        </motion.div>
      )}
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <motion.button
            key={s.key}
            onClick={() => setFilter(s.key)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className={cn('text-center py-4 transition-all hover:border-primary-500/30', filter === s.key && 'border-primary-500/40')}>
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-muted mt-1">{s.label}</p>
            </Card>
          </motion.button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search lead, company or notes..."
              className="w-full h-9 pl-9 pr-4 rounded-xl bg-white/5 border border-app text-sm text-heading placeholder:text-muted focus:outline-none focus:border-primary-500/50 transition-colors"
            />
          </div>
          <Dropdown className="sm:w-40" options={typeOptions} value={typeFilter} onChange={setTypeFilter} placeholder="All types" />
          {showAssignee && (
            <Dropdown className="sm:w-44" options={assigneeOptions} value={assigneeFilter} onChange={setAssigneeFilter} placeholder="All assignees" />
          )}
          <Button size="sm" onClick={() => setModal({ open: true, followup: null, prefill: null })}><Plus className="w-3.5 h-3.5" />Schedule</Button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                filter === t.key ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20' : 'text-muted hover:text-heading hover:bg-white/8'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-4 border border-app animate-pulse h-44" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted text-sm">{isCompletedView ? 'No completed follow-ups' : "You're all caught up — no follow-ups here"}</p>
        </div>
      ) : filter === 'all' ? (
        <div className="space-y-6">
          {['overdue', 'today', 'upcoming'].map(group => {
            const items = visible.filter(f => f.status === group)
            if (items.length === 0) return null
            return (
              <div key={group} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-semibold uppercase tracking-wider', STATUS_CONFIG[group].color)}>{STATUS_GROUP_TITLES[group]}</span>
                  <span className="text-xs bg-white/10 text-muted px-1.5 py-0.5 rounded-md">{items.length}</span>
                </div>
                {renderGrid(items)}
              </div>
            )
          })}
        </div>
      ) : (
        renderGrid(visible)
      )}

      <FollowUpModal open={modal.open} onClose={() => setModal({ open: false, followup: null, prefill: null })} followup={modal.followup} prefill={modal.prefill} />
    </div>
  )
}
