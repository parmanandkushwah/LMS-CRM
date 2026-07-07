import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Phone, Mail, Building2, Calendar, DollarSign,
  Edit, MoreHorizontal, CheckCircle, Clock, FileText, MessageSquare,
  Plus, User, Activity, Paperclip
} from 'lucide-react'
import { Card, Avatar, Badge } from '../../components/ui'
import Button from '../../components/ui/Button'
import { MOCK_LEADS, MOCK_TASKS, MOCK_ACTIVITIES } from '../../constants'
import { cn, formatCurrency, formatDate, STATUS_COLORS, PRIORITY_COLORS } from '../../utils'

const TABS = ['Overview', 'Timeline', 'Tasks', 'Notes', 'Documents', 'Emails']

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-app last:border-0">
      <div className="w-7 h-7 rounded-lg bg-white/6 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium text-heading truncate">{value}</p>
      </div>
    </div>
  )
}

function Timeline() {
  return (
    <div className="space-y-4">
      {MOCK_ACTIVITIES.map((a, i) => (
        <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
          className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
              <Activity className="w-3.5 h-3.5 text-primary-500" />
            </div>
            {i < MOCK_ACTIVITIES.length - 1 && <div className="w-px flex-1 bg-border-app mt-2 min-h-[24px]" style={{ background: 'var(--border)' }} />}
          </div>
          <div className="flex-1 pb-4">
            <p className="text-sm text-heading font-medium">{a.message}</p>
            <p className="text-xs text-muted mt-1">{a.user} · {a.time}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function TasksTab({ leadId }) {
  const tasks = MOCK_TASKS.filter(t => t.leadId === leadId)
  const statusColors = { todo: 'text-muted', in_progress: 'text-brand-blue', completed: 'text-primary-500', overdue: 'text-red-400' }
  return (
    <div className="space-y-2">
      <div className="flex justify-end mb-3">
        <Button size="sm"><Plus className="w-3.5 h-3.5" />Add Task</Button>
      </div>
      {tasks.length === 0 ? (
        <p className="text-center text-muted text-sm py-8">No tasks for this lead</p>
      ) : tasks.map((task, i) => (
        <motion.div key={task.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
          className="flex items-start gap-3 p-3 rounded-xl border border-app hover:bg-white/4 transition-colors">
          <CheckCircle className={cn('w-4 h-4 mt-0.5 flex-shrink-0', statusColors[task.status])} />
          <div className="flex-1">
            <p className="text-sm font-medium text-heading">{task.title}</p>
            <p className="text-xs text-muted mt-0.5">{task.description}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-muted flex items-center gap-1"><Clock className="w-3 h-3" />{task.dueDate}</span>
              <span className={cn('text-xs px-1.5 py-0.5 rounded-md border capitalize', PRIORITY_COLORS[task.priority])}>{task.priority}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function NotesTab() {
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState([
    { id: 1, text: 'Client is very interested in the enterprise plan. Follow up next week.', author: 'Alex Chen', time: '2 days ago' },
    { id: 2, text: 'Had a great call. They want a custom demo for their team of 50.', author: 'Maria Lopez', time: '5 days ago' },
  ])
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note..."
          rows={3}
          className="flex-1 rounded-xl border border-app bg-card text-heading placeholder:text-muted px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 transition-all"
        />
      </div>
      <Button size="sm" disabled={!note.trim()} onClick={() => {
        setNotes(prev => [{ id: Date.now(), text: note, author: 'You', time: 'just now' }, ...prev])
        setNote('')
      }}>
        <Plus className="w-3.5 h-3.5" />Add Note
      </Button>
      <div className="space-y-3">
        {notes.map((n, i) => (
          <motion.div key={n.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="p-3 rounded-xl border border-app bg-white/3">
            <p className="text-sm text-heading">{n.text}</p>
            <p className="text-xs text-muted mt-2">{n.author} · {n.time}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function LeadDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Overview')
  const lead = MOCK_LEADS.find(l => l.id === id) || MOCK_LEADS[0]

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/leads')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-heading">{lead.name}</h2>
          <p className="text-sm text-muted">{lead.company}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Phone className="w-3.5 h-3.5" />Call</Button>
          <Button variant="outline" size="sm"><Mail className="w-3.5 h-3.5" />Email</Button>
          <Button size="sm"><Edit className="w-3.5 h-3.5" />Edit</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Info */}
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col items-center text-center pb-4 border-b border-app mb-4">
              <Avatar name={lead.name} size="xl" className="mb-3" />
              <h3 className="text-base font-bold text-heading">{lead.name}</h3>
              <p className="text-sm text-muted">{lead.company}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className={cn('text-xs px-2 py-0.5 rounded-md border capitalize', STATUS_COLORS[lead.status])}>{lead.status}</span>
                <span className={cn('text-xs px-2 py-0.5 rounded-md border capitalize', PRIORITY_COLORS[lead.priority])}>{lead.priority}</span>
              </div>
            </div>
            <InfoRow icon={Mail} label="Email" value={lead.email} />
            <InfoRow icon={Phone} label="Phone" value={lead.phone} />
            <InfoRow icon={Building2} label="Company" value={lead.company} />
            <InfoRow icon={DollarSign} label="Budget" value={formatCurrency(lead.budget)} />
            <InfoRow icon={User} label="Assigned To" value={lead.assignedTo} />
            <InfoRow icon={Calendar} label="Created" value={formatDate(lead.createdAt)} />
            <InfoRow icon={Activity} label="Source" value={lead.source} />
          </Card>

          {/* Quick Stats */}
          <Card>
            <h4 className="text-sm font-semibold text-heading mb-3">Quick Stats</h4>
            {[
              { label: 'Emails Sent', value: '12' },
              { label: 'Calls Made', value: '5' },
              { label: 'Meetings', value: '2' },
              { label: 'Days in Pipeline', value: '18' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-app last:border-0">
                <span className="text-xs text-muted">{s.label}</span>
                <span className="text-sm font-semibold text-heading">{s.value}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden">
            {/* Tabs */}
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
                  {activeTab === 'Overview' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Status', value: lead.status, colored: true },
                          { label: 'Priority', value: lead.priority, colored: true },
                          { label: 'Source', value: lead.source },
                          { label: 'Budget', value: formatCurrency(lead.budget) },
                        ].map(item => (
                          <div key={item.label} className="p-3 rounded-xl border border-app bg-white/3">
                            <p className="text-xs text-muted mb-1">{item.label}</p>
                            {item.colored ? (
                              <span className={cn('text-xs px-2 py-0.5 rounded-md border capitalize', STATUS_COLORS[item.value] || PRIORITY_COLORS[item.value])}>{item.value}</span>
                            ) : (
                              <p className="text-sm font-semibold text-heading">{item.value}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="p-3 rounded-xl border border-app bg-white/3">
                        <p className="text-xs text-muted mb-2">Pipeline Progress</p>
                        <div className="flex items-center gap-1 flex-wrap">
                          {['new', 'contacted', 'interested', 'meeting', 'proposal', 'negotiation', 'won'].map((stage, i) => {
                            const stages = ['new', 'contacted', 'interested', 'meeting', 'proposal', 'negotiation', 'won']
                            const currentIdx = stages.indexOf(lead.status)
                            const stageIdx = stages.indexOf(stage)
                            return (
                              <div key={stage} className="flex items-center gap-1">
                                <div className={cn('px-2 py-1 rounded-md text-xs font-medium capitalize transition-all',
                                  stageIdx <= currentIdx ? 'bg-primary-500/20 text-primary-500' : 'bg-white/6 text-muted'
                                )}>{stage}</div>
                                {i < stages.length - 1 && <div className={cn('w-3 h-px', stageIdx < currentIdx ? 'bg-primary-500' : 'bg-white/10')} />}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'Timeline' && <Timeline />}
                  {activeTab === 'Tasks' && <TasksTab leadId={lead.id} />}
                  {activeTab === 'Notes' && <NotesTab />}
                  {(activeTab === 'Documents' || activeTab === 'Emails') && (
                    <div className="py-12 text-center">
                      <p className="text-muted text-sm">No {activeTab.toLowerCase()} yet</p>
                      <Button size="sm" className="mt-4"><Plus className="w-3.5 h-3.5" />Add {activeTab.slice(0, -1)}</Button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
