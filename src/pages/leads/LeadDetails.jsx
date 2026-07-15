import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Phone, Mail, Building2, Calendar, DollarSign,
  Edit, Plus, User, Activity, MapPin, Globe, Tag,
  TrendingUp, Clock, CheckCircle, FileUp, MessageCircle, Filter, X, AlarmClock, Download
} from 'lucide-react'
import { Card, Avatar, Badge } from '../../components/ui'
import Button from '../../components/ui/Button'
import { cn, formatCurrency, formatDate, formatRelativeTime, formatTime, STATUS_COLORS, PRIORITY_COLORS } from '../../utils'
import api from '../../services/api'
import toast from 'react-hot-toast'
import AddLeadModal from './AddLeadModal'

const TABS = ['Overview', 'Timeline', 'Tasks', 'Notes', 'Files', 'Contacts']

const PIPELINE_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

const ACTIVITY_ICONS = {
  note: { icon: Edit, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  call: { icon: Phone, color: 'text-green-400', bg: 'bg-green-500/10' },
  email: { icon: Mail, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  meeting: { icon: Calendar, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  task: { icon: CheckCircle, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  status_change: { icon: TrendingUp, color: 'text-primary-500', bg: 'bg-primary-500/10' },
  whatsapp: { icon: MessageCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
  file_upload: { icon: FileUp, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
}

const TYPE_FILTERS = ['all', 'note', 'call', 'email', 'meeting', 'task', 'status_change', 'file_upload', 'whatsapp']

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, className }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-app last:border-0">
      <div className="w-7 h-7 rounded-lg bg-white/6 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className={cn('text-sm font-medium text-heading truncate', className)}>{value}</p>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function LeadSkeleton() {
  return (
    <div className="space-y-5 max-w-6xl animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 shimmer-bg rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-5 shimmer-bg rounded w-48" />
          <div className="h-3 shimmer-bg rounded w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 space-y-3">
            <div className="h-16 shimmer-bg rounded-xl" />
            {[...Array(6)].map((_, i) => <div key={i} className="h-10 shimmer-bg rounded-lg" />)}
          </div>
        </div>
        <div className="lg:col-span-2 glass rounded-2xl h-96 shimmer-bg" />
      </div>
    </div>
  )
}

// ─── Status Update Bar ────────────────────────────────────────────────────────
function StatusBar({ leadId, currentStatus, onUpdate }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (status) => api.patch(`/leads/${leadId}/status`, { status }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] })
      toast.success('Status updated')
      onUpdate?.(res.data)
    },
    onError: (err) => toast.error(err.message),
  })

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {PIPELINE_STAGES.map((stage, i) => {
        const currentIdx = PIPELINE_STAGES.indexOf(currentStatus)
        const stageIdx = PIPELINE_STAGES.indexOf(stage)
        const isActive = stageIdx <= currentIdx && currentStatus !== 'lost'
        const isCurrent = stage === currentStatus
        const isLost = currentStatus === 'lost'

        return (
          <div key={stage} className="flex items-center gap-1">
            <button
              onClick={() => !isCurrent && mutation.mutate(stage)}
              disabled={mutation.isPending}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all',
                isCurrent && isLost ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40' :
                isCurrent ? 'bg-primary-500/20 text-primary-500 ring-1 ring-primary-500/40' :
                isActive ? 'bg-primary-500/10 text-primary-400 hover:bg-primary-500/20' :
                'bg-white/5 text-muted hover:bg-white/10 hover:text-body'
              )}
            >
              {stage.replace('_', ' ')}
            </button>
            {i < PIPELINE_STAGES.length - 1 && (
              <div className={cn('w-3 h-px', isActive && stageIdx < currentIdx ? 'bg-primary-500/50' : 'bg-white/10')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ lead }) {
  const items = [
    { label: 'Status', value: <span className={cn('text-xs px-2 py-0.5 rounded-md border capitalize', STATUS_COLORS[lead.status])}>{lead.status?.replace('_', ' ')}</span> },
    { label: 'Priority', value: <span className={cn('text-xs px-2 py-0.5 rounded-md border capitalize', PRIORITY_COLORS[lead.priority])}>{lead.priority}</span> },
    { label: 'Source', value: <span className="text-sm font-medium text-heading capitalize">{lead.source?.replace('_', ' ')}</span> },
    { label: 'Est. Value', value: <span className="text-sm font-semibold text-primary-500">{lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}</span> },
    { label: 'Probability', value: <span className="text-sm font-medium text-heading">{lead.probability ?? 0}%</span> },
    { label: 'Expected Close', value: <span className="text-sm font-medium text-heading">{formatDate(lead.expected_close_date)}</span> },
    { label: 'Actual Close', value: <span className="text-sm font-medium text-heading">{formatDate(lead.actual_close_date)}</span> },
    { label: 'Created By', value: <span className="text-sm font-medium text-heading">{lead.creator?.name || '—'}</span> },
  ].filter(i => i.value)

  return (
    <div className="space-y-4">
      {/* Grid info */}
      <div className="grid grid-cols-2 gap-3">
        {items.map(item => (
          <div key={item.label} className="p-3 rounded-xl border border-app bg-white/3">
            <p className="text-xs text-muted mb-1.5">{item.label}</p>
            {item.value}
          </div>
        ))}
      </div>

      {/* Notes */}
      {lead.notes && (
        <div className="p-3 rounded-xl border border-app bg-white/3">
          <p className="text-xs text-muted mb-1.5">Notes</p>
          <p className="text-sm text-body leading-relaxed">{lead.notes}</p>
        </div>
      )}

      {/* Tags */}
      {lead.tags?.length > 0 && (
        <div className="p-3 rounded-xl border border-app bg-white/3">
          <p className="text-xs text-muted mb-2">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {lead.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-400 border border-primary-500/20">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline */}
      <div className="p-3 rounded-xl border border-app bg-white/3">
        <p className="text-xs text-muted mb-2.5">Pipeline Progress</p>
        <StatusBar leadId={lead.id} currentStatus={lead.status} />
      </div>
    </div>
  )
}

// ─── Timeline helpers ─────────────────────────────────────────────────────────
function getActivitySentence(activity) {
  const t = activity.title || ''
  switch (activity.type) {
    case 'status_change': return t || 'Status updated'
    case 'call':
      if (activity.outcome === 'completed') return `Call completed${t ? ` — ${t}` : ''}`
      if (activity.outcome === 'no_answer') return `Call attempt — no answer`
      return `Call logged${t ? ` — ${t}` : ''}`
    case 'email': return `Email sent${t ? ` — ${t}` : ''}`
    case 'meeting':
      if (activity.outcome === 'completed') return `Meeting completed${t ? ` — ${t}` : ''}`
      return `Meeting scheduled${t ? ` — ${t}` : ''}`
    case 'task':
      if (activity.outcome === 'completed') return `Task "${t}" completed`
      return `Task "${t}" created`
    case 'note': return `Note added${t ? ` — ${t}` : ''}`
    case 'file_upload': return `File uploaded${t ? ` — ${t}` : ''}`
    case 'whatsapp': return `WhatsApp message${t ? ` — ${t}` : ''}`
    default: return t || 'Activity logged'
  }
}

// ─── Timeline Tab ─────────────────────────────────────────────────────────────
function TimelineTab({ leadId }) {
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [allItems, setAllItems] = useState([])

  const { data, isFetching } = useQuery({
    queryKey: ['lead-activities', leadId, typeFilter, page],
    queryFn: () => api.get(`/leads/${leadId}/activities`, {
      params: { page, limit: 20, ...(typeFilter !== 'all' && { type: typeFilter }) }
    }),
    keepPreviousData: true,
  })

  const items = data?.data || []
  const total = data?.pagination?.total || 0
  const hasMore = allItems.length < total

  const prevPageRef = useRef(0)
  const prevFilterRef = useRef(typeFilter)

  useEffect(() => {
    if (!data) return
    if (prevFilterRef.current !== typeFilter) {
      prevFilterRef.current = typeFilter
      prevPageRef.current = page
      setAllItems(items)
    } else if (page !== prevPageRef.current) {
      prevPageRef.current = page
      setAllItems(prev => {
        const ids = new Set(prev.map(i => i.id))
        return [...prev, ...items.filter(i => !ids.has(i.id))]
      })
    }
  }, [data])

  const handleFilterChange = (f) => {
    setTypeFilter(f)
    setAllItems([])
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-muted flex-shrink-0" />
        {TYPE_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all',
              typeFilter === f
                ? 'bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/40'
                : 'bg-white/5 text-muted hover:bg-white/10 hover:text-body'
            )}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {allItems.length === 0 && !isFetching ? (
        <div className="py-12 text-center">
          <Activity className="w-7 h-7 text-muted mx-auto mb-2" />
          <p className="text-sm text-muted">No activities yet</p>
        </div>
      ) : (
        <div className="relative">
          {/* vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-white/8" />

          <div className="space-y-0">
            {allItems.map((activity) => {
              const cfg = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.note
              const Icon = cfg.icon
              return (
                <div key={activity.id} className="flex gap-4 group">
                  {/* dot */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center z-10 ring-2 ring-app', cfg.bg)}>
                      <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
                    </div>
                  </div>

                  {/* text */}
                  <div className="flex-1 pb-5 pt-1">
                    <p className="text-sm text-heading leading-snug">
                      {getActivitySentence(activity)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {activity.user && (
                        <>
                          <Avatar name={activity.user.name} size="xs" />
                          <span className="text-xs text-muted">{activity.user.name}</span>
                          <span className="text-xs text-white/20">·</span>
                        </>
                      )}
                      <span className="text-xs text-muted">{formatRelativeTime(activity.createdAt || activity.created_at)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {isFetching && allItems.length === 0 && (
            <div className="space-y-5 pl-12">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-4 shimmer-bg rounded w-3/4" />
                  <div className="h-3 shimmer-bg rounded w-1/3" />
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="pl-12 pt-1">
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={isFetching}
                className="text-xs text-primary-400 hover:text-primary-300 disabled:opacity-50"
              >
                {isFetching ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────
function TasksTab({ leadId }) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [description, setDescription] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['lead-tasks', leadId],
    queryFn: () => api.get(`/leads/${leadId}/activities`, { params: { type: 'task', limit: 100 } }),
  })

  const tasks = data?.data || []
  const pending = tasks.filter(t => t.outcome === 'pending')
  const completed = tasks.filter(t => t.outcome === 'completed')

  const addMutation = useMutation({
    mutationFn: (payload) => api.post(`/leads/${leadId}/activities`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-tasks', leadId] })
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] })
      toast.success('Task added')
      setTitle(''); setScheduledAt(''); setDescription(''); setShowForm(false)
    },
    onError: (err) => toast.error(err.message),
  })

  const completeMutation = useMutation({
    mutationFn: (id) => api.put(`/leads/activities/${id}`, { outcome: 'completed', completed_at: new Date() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-tasks', leadId] })
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] })
      toast.success('Task completed')
    },
    onError: (err) => toast.error(err.message),
  })

  const handleAdd = () => {
    if (!title.trim()) return toast.error('Title is required')
    addMutation.mutate({
      type: 'task',
      title: title.trim(),
      description: description.trim() || undefined,
      scheduled_at: scheduledAt || undefined,
      outcome: 'pending',
    })
  }

  const TaskRow = ({ task }) => (
    <div className="flex items-start gap-3 py-3 border-b border-app last:border-0">
      <button
        onClick={() => task.outcome === 'pending' && completeMutation.mutate(task.id)}
        disabled={completeMutation.isPending || task.outcome === 'completed'}
        className={cn(
          'mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all',
          task.outcome === 'completed'
            ? 'border-green-500 bg-green-500/20'
            : 'border-white/20 hover:border-primary-500'
        )}
      >
        {task.outcome === 'completed' && <CheckCircle className="w-3 h-3 text-green-400 m-auto" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm text-heading', task.outcome === 'completed' && 'line-through text-muted')}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-muted mt-0.5">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {task.scheduled_at && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <AlarmClock className="w-3 h-3" />
              {formatDate(task.scheduled_at)}
              <span className="text-white/20">·</span>
              {formatTime(task.scheduled_at)}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted">
            <Clock className="w-3 h-3" />
            {formatDate(task.createdAt || task.created_at)}
            <span className="text-white/20">·</span>
            {formatTime(task.createdAt || task.created_at)}
          </span>
          {task.user && (
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Avatar name={task.user.name} size="xs" />
              {task.user.name}
            </span>
          )}
        </div>
      </div>
      {task.outcome === 'pending' && (
        <button
          onClick={() => completeMutation.mutate(task.id)}
          disabled={completeMutation.isPending}
          className="text-xs text-primary-400 hover:text-primary-300 flex-shrink-0 mt-0.5"
        >
          Done
        </button>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-heading">Tasks</span>
          {pending.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400">{pending.length} pending</span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm(v => !v)}>
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : 'Add Task'}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="p-4 rounded-xl border border-app bg-white/3 space-y-3">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Task title"
            className="w-full bg-transparent text-sm text-heading placeholder:text-muted outline-none border-b border-app pb-2"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full bg-transparent text-xs text-body placeholder:text-muted outline-none resize-none"
          />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <AlarmClock className="w-3.5 h-3.5 text-muted" />
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="bg-transparent text-xs text-muted outline-none"
              />
            </div>
            <Button size="sm" onClick={handleAdd} disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Saving…' : 'Save Task'}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-12 shimmer-bg rounded-xl" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-12 text-center">
          <CheckCircle className="w-7 h-7 text-muted mx-auto mb-2" />
          <p className="text-sm text-muted">No tasks yet</p>
        </div>
      ) : (
        <div>
          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-1">Pending</p>
              {pending.map(t => <TaskRow key={t.id} task={t} />)}
            </div>
          )}
          {/* Completed */}
          {completed.length > 0 && (
            <div className={pending.length > 0 ? 'mt-4' : ''}>
              <p className="text-xs text-muted uppercase tracking-wide mb-1">Completed</p>
              {completed.map(t => <TaskRow key={t.id} task={t} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Notes Tab ────────────────────────────────────────────────────────────────
function NotesTab({ leadId }) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['lead-notes', leadId],
    queryFn: () => api.get(`/leads/${leadId}/activities`, { params: { type: 'note', limit: 100 } }),
  })

  const notes = data?.data || []

  const addMutation = useMutation({
    mutationFn: (payload) => api.post(`/leads/${leadId}/activities`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-notes', leadId] })
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] })
      toast.success('Note added')
      setContent(''); setShowForm(false)
    },
    onError: (err) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (noteId) => api.delete(`/leads/activities/${noteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-notes', leadId] })
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] })
      toast.success('Note deleted')
    },
    onError: (err) => toast.error(err.message),
  })

  const handleAdd = () => {
    if (!content.trim()) return toast.error('Note cannot be empty')
    addMutation.mutate({ type: 'note', title: content.trim() })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-heading">Notes</span>
          {notes.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary-500/10 text-primary-400">{notes.length}</span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm(v => !v)}>
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : 'Add Note'}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="p-4 rounded-xl border border-app bg-white/3 space-y-3">
          <textarea
            autoFocus
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd() }}
            placeholder="Write a note…"
            rows={3}
            className="w-full bg-transparent text-sm text-body placeholder:text-muted outline-none resize-none"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleAdd} disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Saving…' : 'Save Note'}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 shimmer-bg rounded-xl" />)}
        </div>
      ) : notes.length === 0 ? (
        <div className="py-12 text-center">
          <Edit className="w-7 h-7 text-muted mx-auto mb-2" />
          <p className="text-sm text-muted">No notes yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="group p-3.5 rounded-xl border border-app bg-white/3">
              <p className="text-sm text-body leading-relaxed whitespace-pre-wrap">{note.title}</p>
              <div className="flex items-center justify-between mt-2.5">
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  {note.user && <Avatar name={note.user.name} size="xs" />}
                  {note.user?.name && <span>{note.user.name}</span>}
                  <span className="text-white/20">·</span>
                  <span>{formatDate(note.createdAt || note.created_at)}</span>
                  <span className="text-white/20">·</span>
                  <span>{formatTime(note.createdAt || note.created_at)}</span>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(note.id)}
                  disabled={deleteMutation.isPending}
                  className="opacity-0 group-hover:opacity-100 text-xs text-muted hover:text-red-400 transition-opacity disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Files Tab ────────────────────────────────────────────────────────────────
function FilesTab({ leadId }) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  const { data, isLoading } = useQuery({
    queryKey: ['lead-files', leadId],
    queryFn: () => api.get(`/leads/${leadId}/files`),
  })

  const files = data?.data || []

  const uploadMutation = useMutation({
    mutationFn: (file) => {
      const form = new FormData()
      form.append('file', file)
      return api.post(`/leads/${leadId}/files`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-files', leadId] })
      toast.success('File uploaded')
    },
    onError: (err) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (fileId) => api.delete(`/leads/files/${fileId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-files', leadId] })
      toast.success('File deleted')
    },
    onError: (err) => toast.error(err.message),
  })

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) uploadMutation.mutate(file)
    e.target.value = ''
  }

  const handleDownload = async (file) => {
    try {
      const blob = await api.get(`/leads/files/${file.id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.original_name
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) { toast.error(err.message) }
  }

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-heading">Files</span>
          {files.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary-500/10 text-primary-400">{files.length}</span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
          <Plus className="w-3.5 h-3.5" /> Add File
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-14 shimmer-bg rounded-xl" />)}
        </div>
      ) : files.length === 0 ? (
        <div className="py-12 text-center">
          <FileUp className="w-7 h-7 text-muted mx-auto mb-2" />
          <p className="text-sm text-muted">No files yet</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {files.map(file => (
            <div key={file.id} className="group flex items-center gap-3 p-3 rounded-xl border border-app bg-white/3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <FileUp className="w-4 h-4 text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-heading truncate">{file.original_name}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5">
                  <span>{formatSize(file.file_size)}</span>
                  <span className="text-white/20">·</span>
                  <span>{formatDate(file.createdAt || file.created_at)}</span>
                  <span className="text-white/20">·</span>
                  <span>{formatTime(file.createdAt || file.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => handleDownload(file)}
                  className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 px-2 py-1"
                >
                  <Download className="w-3 h-3" /> Download
                </button>
                <button
                  onClick={() => deleteMutation.mutate(file.id)}
                  disabled={deleteMutation.isPending}
                  className="text-xs text-muted hover:text-red-400 px-2 py-1 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Contacts Tab ─────────────────────────────────────────────────────────────
function ContactsTab({ leadId }) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [designation, setDesignation] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['lead-contacts', leadId],
    queryFn: () => api.get(`/leads/${leadId}/contacts`),
  })
  const contacts = data?.data || []

  // Activity log used to derive each contact's last-contacted timestamp
  const { data: actData } = useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: () => api.get(`/leads/${leadId}/activities`, { params: { limit: 200 } }),
  })
  const contactLog = {}
  ;(actData?.data || [])
    .filter(a => (a.type === 'email' || a.type === 'call') && a.metadata?.contact_id)
    .forEach(a => {
      const cid = a.metadata.contact_id
      if (!contactLog[cid] || new Date(a.createdAt || a.created_at) > new Date(contactLog[cid].createdAt || contactLog[cid].created_at))
        contactLog[cid] = a
    })

  const addMutation = useMutation({
    mutationFn: (payload) => api.post(`/leads/${leadId}/contacts`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-contacts', leadId] })
      toast.success('Contact added')
      setName(''); setEmail(''); setPhone(''); setDesignation(''); setShowForm(false)
    },
    onError: (err) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/leads/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-contacts', leadId] })
      toast.success('Contact deleted')
    },
    onError: (err) => toast.error(err.message),
  })

  const contactMutation = useMutation({
    mutationFn: ({ contact, type }) => api.post(`/leads/${leadId}/activities`, {
      type,
      title: `Contacted ${contact.name} via ${type}`,
      metadata: { contact_id: contact.id, contact_name: contact.name },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] })
      toast.success('Contact logged')
    },
    onError: (err) => toast.error(err.message),
  })

  const handleAdd = () => {
    if (!name.trim()) return toast.error('Name is required')
    addMutation.mutate({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      designation: designation.trim() || undefined,
    })
  }

  const inputCls = 'w-full bg-transparent text-sm text-heading placeholder:text-muted outline-none border-b border-app pb-2'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-heading">Contacts</span>
          {contacts.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary-500/10 text-primary-400">{contacts.length}</span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm(v => !v)}>
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : 'Add Contact'}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="p-4 rounded-xl border border-app bg-white/3 space-y-3">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Full name *"
            className={inputCls}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              className={inputCls}
            />
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Mobile"
              className={inputCls}
            />
          </div>
          <input
            value={designation}
            onChange={e => setDesignation(e.target.value)}
            placeholder="Designation (optional)"
            className={inputCls}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleAdd} disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Saving…' : 'Save Contact'}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 shimmer-bg rounded-xl" />)}
        </div>
      ) : contacts.length === 0 ? (
        <div className="py-12 text-center">
          <User className="w-7 h-7 text-muted mx-auto mb-2" />
          <p className="text-sm text-muted">No contacts yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map(contact => {
            const log = contactLog[contact.id]
            return (
              <div key={contact.id} className="group p-4 rounded-xl border border-app bg-white/3">
                <div className="flex items-start gap-3">
                  <Avatar name={contact.name} size="md" className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-heading truncate">{contact.name}</p>
                      {contact.is_primary && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary-500/15 text-primary-400 border border-primary-500/20">
                          Primary
                        </span>
                      )}
                    </div>
                    {contact.designation && (
                      <p className="text-xs text-muted">{contact.designation}</p>
                    )}

                    <div className="flex flex-col gap-1 mt-2">
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-xs text-muted hover:text-primary-400 transition-colors">
                          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </a>
                      )}
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-xs text-muted hover:text-primary-400 transition-colors">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{contact.phone}</span>
                        </a>
                      )}
                    </div>

                    {/* Last contacted */}
                    {log && (
                      <div className="flex items-center gap-1.5 text-xs text-muted mt-2.5">
                        {log.type === 'email' ? <Mail className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                        <span className="capitalize">Contacted via {log.type}</span>
                        <span className="text-white/20">·</span>
                        <span>{formatDate(log.createdAt || log.created_at)} {formatTime(log.createdAt || log.created_at)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => contactMutation.mutate({ contact, type: 'email' })}
                        disabled={contactMutation.isPending}
                        className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 px-2 py-1"
                      >
                        <Mail className="w-3 h-3" /> Mail
                      </button>
                      <button
                        onClick={() => contactMutation.mutate({ contact, type: 'call' })}
                        disabled={contactMutation.isPending}
                        className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 px-2 py-1"
                      >
                        <Phone className="w-3 h-3" /> Call
                      </button>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(contact.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs text-muted hover:text-red-400 transition-opacity disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LeadDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Overview')
  const [showEdit, setShowEdit] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => api.get(`/leads/${id}`),
  })

  const lead = data?.data

  const updateMutation = useMutation({
    mutationFn: (payload) => api.put(`/leads/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Lead updated!')
      setShowEdit(false)
    },
    onError: (err) => toast.error(err.message),
  })

  // Quick stats derived from activities
  const activities = lead?.activities || []
  const callCount = activities.filter(a => a.type === 'call').length
  const emailCount = activities.filter(a => a.type === 'email').length
  const meetingCount = activities.filter(a => a.type === 'meeting').length
  const daysInPipeline = lead ? Math.floor((new Date() - new Date(lead.createdAt || lead.created_at)) / 86400000) : 0

  if (isLoading) return <LeadSkeleton />

  if (isError || !lead) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <p className="text-muted text-sm">Lead not found</p>
      <Button variant="outline" size="sm" onClick={() => navigate('/leads')}>
        <ArrowLeft className="w-4 h-4" /> Back to Leads
      </Button>
    </div>
  )

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/leads')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-heading truncate">{lead.title}</h2>
          <p className="text-sm text-muted">{lead.company_name || lead.contact_name}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {lead.contact_phone && (
            <Button variant="outline" size="sm" onClick={() => window.open(`tel:${lead.contact_phone}`)}>
              <Phone className="w-3.5 h-3.5" />Call
            </Button>
          )}
          {lead.contact_email && (
            <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${lead.contact_email}`)}>
              <Mail className="w-3.5 h-3.5" />Email
            </Button>
          )}
          <Button size="sm" onClick={() => setShowEdit(true)}>
            <Edit className="w-3.5 h-3.5" />Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left Panel ── */}
        <div className="space-y-4">
          {/* Contact Card */}
          <Card>
            <div className="flex flex-col items-center text-center pb-4 border-b border-app mb-4">
              <Avatar name={lead.contact_name} size="xl" className="mb-3" />
              <h3 className="text-base font-bold text-heading">{lead.contact_name}</h3>
              {lead.company_name && <p className="text-sm text-muted mt-0.5">{lead.company_name}</p>}
              <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                <span className={cn('text-xs px-2 py-0.5 rounded-md border capitalize', STATUS_COLORS[lead.status])}>
                  {lead.status?.replace('_', ' ')}
                </span>
                <span className={cn('text-xs px-2 py-0.5 rounded-md border capitalize', PRIORITY_COLORS[lead.priority])}>
                  {lead.priority}
                </span>
              </div>
            </div>

            <InfoRow icon={Mail} label="Email" value={lead.contact_email} />
            <InfoRow icon={Phone} label="Phone" value={lead.contact_phone} />
            <InfoRow icon={Building2} label="Company" value={lead.company_name} />
            <InfoRow icon={Globe} label="Website" value={lead.company_website} />
            <InfoRow icon={DollarSign} label="Est. Value" value={lead.estimated_value ? formatCurrency(lead.estimated_value) : null} />
            <InfoRow icon={User} label="Assigned To" value={lead.assignee?.name} />
            <InfoRow icon={Tag} label="Source" value={lead.source?.replace('_', ' ')} />
            <InfoRow icon={Calendar} label="Created" value={formatDate(lead.createdAt || lead.created_at)} />
            <InfoRow icon={Clock} label="Expected Close" value={formatDate(lead.expected_close_date)} />
            {(lead.city || lead.country) && (
              <InfoRow icon={MapPin} label="Location" value={[lead.city, lead.state, lead.country].filter(Boolean).join(', ')} />
            )}
          </Card>

          {/* Quick Stats */}
          <Card>
            <h4 className="text-sm font-semibold text-heading mb-3">Activity Stats</h4>
            {[
              { label: 'Calls Made', value: callCount },
              { label: 'Emails Sent', value: emailCount },
              { label: 'Meetings', value: meetingCount },
              { label: 'Total Activities', value: activities.length },
              { label: 'Days in Pipeline', value: daysInPipeline },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-app last:border-0">
                <span className="text-xs text-muted">{s.label}</span>
                <span className="text-sm font-semibold text-heading">{s.value}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* ── Right Panel: Tabs ── */}
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden">
            {/* Tab Bar */}
            <div className="flex overflow-x-auto scrollbar-thin border-b border-app px-4">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                    activeTab === tab
                      ? 'text-primary-500 border-primary-500'
                      : 'text-muted border-transparent hover:text-heading'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'Overview'   && <OverviewTab lead={lead} />}
                  {activeTab === 'Timeline'   && <TimelineTab leadId={id} />}
                  {activeTab === 'Tasks'      && <TasksTab leadId={id} />}
                  {activeTab === 'Notes'      && <NotesTab leadId={id} />}
                  {activeTab === 'Files'      && <FilesTab leadId={id} />}
                  {activeTab === 'Contacts'   && <ContactsTab leadId={id} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <AddLeadModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        editLead={lead}
        onAdd={(payload) => updateMutation.mutateAsync(payload)}
      />
    </div>
  )
}
