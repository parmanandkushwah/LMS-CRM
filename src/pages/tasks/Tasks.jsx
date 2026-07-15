import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckCircle, Circle, Clock, List, LayoutGrid, ChevronDown, Check, Play, Pause } from 'lucide-react'
import { Avatar } from '../../components/ui'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import EmptyState from '../../components/ui/EmptyState'
import { cn, PRIORITY_COLORS, formatDate } from '../../utils'
import api from '../../services/api'
import toast from 'react-hot-toast'

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', completed: 'Completed', overdue: 'Overdue' }
const STATUS_COLORS_MAP = {
  todo: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', dot: 'bg-gray-400' },
  { value: 'medium', label: 'Medium', dot: 'bg-yellow-400' },
  { value: 'high', label: 'High', dot: 'bg-orange-400' },
  { value: 'urgent', label: 'Urgent', dot: 'bg-red-400' },
]

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

// A task is a LeadActivity of type 'task'. Derive the board status from
// outcome + scheduled_at, and read priority from metadata.
function mapTask(a) {
  const now = Date.now()
  let status
  if (a.outcome === 'completed') status = 'completed'
  else if (a.outcome === 'follow_up') status = 'in_progress'
  else if (a.scheduled_at && new Date(a.scheduled_at).getTime() < now) status = 'overdue'
  else status = 'todo'

  return {
    id: a.id,
    title: a.title || 'Untitled task',
    description: a.description || '',
    priority: a.metadata?.priority || 'medium',
    status,
    outcome: a.outcome,
    dueDate: a.scheduled_at ? formatDate(a.scheduled_at) : 'No due date',
    assignedTo: a.user?.name || '',
    leadName: a.lead?.title || a.lead?.contact_name || '',
  }
}

function TaskCard({ task, onToggle, onToggleProgress }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -1 }}
      className={cn('glass rounded-xl p-4 border border-app hover:border-primary-500/20 transition-all', task.status === 'completed' && 'opacity-60')}
    >
      <div className="flex items-start gap-3">
        <button onClick={() => onToggle(task)} className="mt-0.5 flex-shrink-0" title={task.status === 'completed' ? 'Reopen task' : 'Mark complete'}>
          {task.status === 'completed'
            ? <CheckCircle className="text-primary-500" style={{ width: 18, height: 18 }} />
            : <Circle className="text-muted hover:text-primary-500 transition-colors" style={{ width: 18, height: 18 }} />
          }
        </button>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium text-heading', task.status === 'completed' && 'line-through text-muted')}>{task.title}</p>
          {task.description && <p className="text-xs text-muted mt-0.5 truncate">{task.description}</p>}
          {task.leadName && <p className="text-xs text-primary-500/80 mt-0.5 truncate">{task.leadName}</p>}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <span className={cn('text-xs px-1.5 py-0.5 rounded-md border capitalize', PRIORITY_COLORS[task.priority])}>{task.priority}</span>
            <span className={cn('text-xs px-1.5 py-0.5 rounded-md border', STATUS_COLORS_MAP[task.status])}>{STATUS_LABELS[task.status]}</span>
            <span className="text-xs text-muted flex items-center gap-1"><Clock className="w-3 h-3" />{task.dueDate}</span>
            {task.status !== 'completed' && (
              <button
                onClick={() => onToggleProgress(task)}
                title={task.status === 'in_progress' ? 'Move back to To Do' : 'Mark as In Progress'}
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-md border transition-colors inline-flex items-center gap-1',
                  task.status === 'in_progress'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                    : 'text-muted border-app hover:text-heading hover:bg-white/8'
                )}
              >
                {task.status === 'in_progress'
                  ? <><Pause className="w-3 h-3" />Pause</>
                  : <><Play className="w-3 h-3" />Start</>
                }
              </button>
            )}
          </div>
        </div>
        {task.assignedTo && <Avatar name={task.assignedTo} size="xs" />}
      </div>
    </motion.div>
  )
}

function BoardView({ tasks, onToggle, onToggleProgress }) {
  const columns = ['todo', 'in_progress', 'completed', 'overdue']
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map(col => (
        <div key={col} className="space-y-2">
          <div className="flex items-center justify-between px-1 mb-3">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">{STATUS_LABELS[col]}</span>
            <span className="text-xs bg-white/10 text-muted px-1.5 py-0.5 rounded-md">{tasks.filter(t => t.status === col).length}</span>
          </div>
          <AnimatePresence>
            {tasks.filter(t => t.status === col).map(task => (
              <TaskCard key={task.id} task={task} onToggle={onToggle} onToggleProgress={onToggleProgress} />
            ))}
          </AnimatePresence>
          {tasks.filter(t => t.status === col).length === 0 && (
            <div className="h-24 rounded-xl border-2 border-dashed border-app flex items-center justify-center">
              <p className="text-xs text-muted">No tasks</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Tasks() {
  const queryClient = useQueryClient()
  const [view, setView] = useState('list')
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', dueDate: '', leadId: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks'),
  })

  const { data: leadsData } = useQuery({
    queryKey: ['tasks-lead-options'],
    queryFn: () => api.get('/leads', { params: { limit: 1000 } }),
  })

  const tasks = (data?.data || []).map(mapTask)
  const leadOptions = (leadsData?.data || []).map(l => ({
    value: String(l.id),
    label: l.title || l.contact_name || `Lead #${l.id}`,
  }))

  const filtered = tasks.filter(t => filter === 'all' || t.status === filter)

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }) => api.put(`/leads/activities/${id}`, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: (err) => toast.error(err.message),
  })

  // Checkbox toggles completion; overdue is derived automatically from the due date.
  const handleToggleComplete = (task) => updateMutation.mutate({
    id: task.id,
    patch: task.status === 'completed'
      ? { outcome: 'pending', completed_at: null }
      : { outcome: 'completed', completed_at: new Date() },
  })

  // Start/Pause moves a task between To Do (pending) and In Progress (follow_up).
  const handleToggleProgress = (task) => updateMutation.mutate({
    id: task.id,
    patch: task.outcome === 'follow_up'
      ? { outcome: 'pending' }
      : { outcome: 'follow_up' },
  })

  const addMutation = useMutation({
    mutationFn: (payload) => api.post(`/leads/${payload.leadId}/activities`, {
      type: 'task',
      title: payload.title,
      scheduled_at: payload.dueDate || undefined,
      outcome: 'pending',
      metadata: { priority: payload.priority },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setNewTask({ title: '', priority: 'medium', dueDate: '', leadId: '' })
      setShowAdd(false)
      toast.success('Task added!')
    },
    onError: (err) => toast.error(err.message),
  })

  const handleAdd = () => {
    if (!newTask.title.trim()) return toast.error('Task title is required')
    if (!newTask.leadId) return toast.error('Please select a lead')
    addMutation.mutate(newTask)
  }

  const stats = [
    { label: 'Total', value: tasks.length, color: 'text-body' },
    { label: 'To Do', value: tasks.filter(t => t.status === 'todo').length, color: 'text-muted' },
    { label: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: 'text-brand-blue' },
    { label: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: 'text-primary-500' },
    { label: 'Overdue', value: tasks.filter(t => t.status === 'overdue').length, color: 'text-red-400' },
  ]

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="flex items-center gap-4 overflow-x-auto pb-1">
        {stats.map(s => (
          <div key={s.label} className="flex items-center gap-2 flex-shrink-0">
            <span className={cn('text-lg font-bold', s.color)}>{s.value}</span>
            <span className="text-xs text-muted">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['all', 'todo', 'in_progress', 'completed', 'overdue'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                filter === f ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20' : 'text-muted hover:text-heading hover:bg-white/8'
              )}
            >
              {f === 'all' ? 'All' : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl border border-app bg-card">
            <button onClick={() => setView('list')} className={cn('p-1.5 rounded-lg transition-colors', view === 'list' ? 'bg-primary-500/10 text-primary-500' : 'text-muted hover:text-heading')}>
              <List className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setView('board')} className={cn('p-1.5 rounded-lg transition-colors', view === 'board' ? 'bg-primary-500/10 text-primary-500' : 'text-muted hover:text-heading')}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-3.5 h-3.5" />Add Task
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 border border-app animate-pulse h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No tasks found" description="Create your first task to get started." action={() => setShowAdd(true)} actionLabel="Add Task" type="tasks" />
      ) : view === 'list' ? (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map(task => <TaskCard key={task.id} task={task} onToggle={handleToggleComplete} onToggleProgress={handleToggleProgress} />)}
          </AnimatePresence>
        </div>
      ) : (
        <BoardView tasks={filtered} onToggle={handleToggleComplete} onToggleProgress={handleToggleProgress} />
      )}

      {/* Add Task Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Task" size="sm" className="overflow-visible"
        footer={<><Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={handleAdd} loading={addMutation.isPending}>Add Task</Button></>}>
        <div className="space-y-4">
          <Input label="Task Title" placeholder="Enter task title..." value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">Lead</label>
            <Dropdown options={leadOptions} value={newTask.leadId} onChange={(v) => setNewTask(p => ({ ...p, leadId: v }))} placeholder="Select a lead" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">Priority</label>
            <Dropdown options={PRIORITY_OPTIONS} value={newTask.priority} onChange={(v) => setNewTask(p => ({ ...p, priority: v }))} />
          </div>
          <Input label="Due Date" type="date" value={newTask.dueDate} onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}
