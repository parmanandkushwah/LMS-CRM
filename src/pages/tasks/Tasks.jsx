import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckCircle, Circle, Clock, List, LayoutGrid, Filter } from 'lucide-react'
import { Card, Avatar, Badge } from '../../components/ui'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { Select } from '../../components/ui/FormElements'
import EmptyState from '../../components/ui/EmptyState'
import { MOCK_TASKS, MOCK_EMPLOYEES } from '../../constants'
import { cn, PRIORITY_COLORS } from '../../utils'
import toast from 'react-hot-toast'

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', completed: 'Completed', overdue: 'Overdue' }
const STATUS_COLORS_MAP = {
  todo: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
}
const PRIORITY_DOT = { low: 'bg-gray-400', medium: 'bg-yellow-400', high: 'bg-orange-400', urgent: 'bg-red-400' }

function TaskCard({ task, onToggle }) {
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
        <button onClick={() => onToggle(task.id)} className="mt-0.5 flex-shrink-0">
          {task.status === 'completed'
            ? <CheckCircle className="w-4.5 h-4.5 text-primary-500" style={{ width: 18, height: 18 }} />
            : <Circle className="w-4.5 h-4.5 text-muted hover:text-primary-500 transition-colors" style={{ width: 18, height: 18 }} />
          }
        </button>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium text-heading', task.status === 'completed' && 'line-through text-muted')}>{task.title}</p>
          <p className="text-xs text-muted mt-0.5 truncate">{task.description}</p>
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <span className={cn('text-xs px-1.5 py-0.5 rounded-md border capitalize', PRIORITY_COLORS[task.priority])}>{task.priority}</span>
            <span className={cn('text-xs px-1.5 py-0.5 rounded-md border', STATUS_COLORS_MAP[task.status])}>{STATUS_LABELS[task.status]}</span>
            <span className="text-xs text-muted flex items-center gap-1"><Clock className="w-3 h-3" />{task.dueDate}</span>
          </div>
        </div>
        <Avatar name={task.assignedTo} size="xs" />
      </div>
    </motion.div>
  )
}

function BoardView({ tasks, onToggle }) {
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
              <TaskCard key={task.id} task={task} onToggle={onToggle} />
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
  const [tasks, setTasks] = useState(MOCK_TASKS)
  const [view, setView] = useState('list')
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', dueDate: '', assignedTo: '' })

  const filtered = tasks.filter(t => filter === 'all' || t.status === filter || t.priority === filter)

  const handleToggle = (id) => {
    setTasks(prev => prev.map(t => t.id === id
      ? { ...t, status: t.status === 'completed' ? 'todo' : 'completed' }
      : t
    ))
  }

  const handleAdd = () => {
    if (!newTask.title) return
    setTasks(prev => [...prev, { ...newTask, id: String(Date.now()), status: 'todo', description: '', leadId: null, leadName: null }])
    setNewTask({ title: '', priority: 'medium', dueDate: '', assignedTo: '' })
    setShowAdd(false)
    toast.success('Task added!')
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
      {filtered.length === 0 ? (
        <EmptyState title="No tasks found" description="Create your first task to get started." action={() => setShowAdd(true)} actionLabel="Add Task" type="tasks" />
      ) : view === 'list' ? (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map(task => <TaskCard key={task.id} task={task} onToggle={handleToggle} />)}
          </AnimatePresence>
        </div>
      ) : (
        <BoardView tasks={filtered} onToggle={handleToggle} />
      )}

      {/* Add Task Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Task" size="sm"
        footer={<><Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={handleAdd}>Add Task</Button></>}>
        <div className="space-y-4">
          <Input label="Task Title" placeholder="Enter task title..." value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} />
          <Select label="Priority" value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))}
            options={['low', 'medium', 'high', 'urgent'].map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))} />
          <Input label="Due Date" type="date" value={newTask.dueDate} onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))} />
          <Select label="Assign To" placeholder="Select employee" value={newTask.assignedTo} onChange={e => setNewTask(p => ({ ...p, assignedTo: e.target.value }))}
            options={MOCK_EMPLOYEES.map(e => ({ value: e.name, label: e.name }))} />
        </div>
      </Modal>
    </div>
  )
}
