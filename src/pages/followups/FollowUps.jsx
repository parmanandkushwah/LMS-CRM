import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Calendar, Clock, Plus, CheckCircle, AlertCircle, User } from 'lucide-react'
import { Card, Avatar, Badge } from '../../components/ui'
import Button from '../../components/ui/Button'
import { MOCK_LEADS } from '../../constants'
import { cn, formatDate } from '../../utils'

const followups = MOCK_LEADS.map((lead, i) => ({
  id: lead.id,
  leadName: lead.name,
  company: lead.company,
  assignedTo: lead.assignedTo,
  type: ['Call', 'Email', 'Meeting', 'Demo'][i % 4],
  date: `2024-02-${String(i + 8).padStart(2, '0')}`,
  time: `${9 + i}:00 AM`,
  status: i < 2 ? 'overdue' : i < 4 ? 'today' : 'upcoming',
  notes: 'Follow up on the proposal sent last week.',
  priority: lead.priority,
}))

const STATUS_CONFIG = {
  overdue: { label: 'Overdue', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertCircle },
  today: { label: 'Today', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Clock },
  upcoming: { label: 'Upcoming', color: 'text-primary-500', bg: 'bg-primary-500/10', border: 'border-primary-500/20', icon: Calendar },
}

function FollowUpCard({ followup }) {
  const config = STATUS_CONFIG[followup.status]
  const StatusIcon = config.icon
  const typeColors = { Call: 'bg-brand-blue/10 text-brand-blue', Email: 'bg-brand-purple/10 text-brand-purple', Meeting: 'bg-primary-500/10 text-primary-500', Demo: 'bg-orange-500/10 text-orange-400' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      className={cn('glass rounded-2xl p-4 border transition-all', config.border, 'hover:shadow-card-dark')}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar name={followup.leadName} size="sm" />
          <div>
            <p className="text-sm font-semibold text-heading">{followup.leadName}</p>
            <p className="text-xs text-muted">{followup.company}</p>
          </div>
        </div>
        <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium', typeColors[followup.type])}>{followup.type}</span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(followup.date)}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Clock className="w-3.5 h-3.5" />
          {followup.time}
        </div>
      </div>

      <p className="text-xs text-muted mb-3 line-clamp-2">{followup.notes}</p>

      <div className="flex items-center justify-between pt-3 border-t border-app">
        <div className="flex items-center gap-1.5">
          <StatusIcon className={cn('w-3.5 h-3.5', config.color)} />
          <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-muted" />
            <span className="text-xs text-muted">{followup.assignedTo.split(' ')[0]}</span>
          </div>
          <Button variant="primary" size="xs">
            <CheckCircle className="w-3 h-3" />Done
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default function FollowUps() {
  const [filter, setFilter] = useState('all')
  const filtered = followups.filter(f => filter === 'all' || f.status === filter)

  const counts = {
    all: followups.length,
    overdue: followups.filter(f => f.status === 'overdue').length,
    today: followups.filter(f => f.status === 'today').length,
    upcoming: followups.filter(f => f.status === 'upcoming').length,
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Overdue', value: counts.overdue, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: "Today's", value: counts.today, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Upcoming', value: counts.upcoming, color: 'text-primary-500', bg: 'bg-primary-500/10' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className="text-center py-4">
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-muted mt-1">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['all', 'overdue', 'today', 'upcoming'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                filter === f ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20' : 'text-muted hover:text-heading hover:bg-white/8'
              )}
            >
              {f === 'all' ? `All (${counts.all})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f]})`}
            </button>
          ))}
        </div>
        <Button size="sm"><Plus className="w-3.5 h-3.5" />Schedule</Button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((followup, i) => (
          <motion.div key={followup.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <FollowUpCard followup={followup} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
