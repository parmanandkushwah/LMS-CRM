import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Users, TrendingUp, Trophy, XCircle, DollarSign,
  Bell, CheckSquare, Calendar, ArrowRight, UserPlus,
  Mail, FileText, Activity
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList
} from 'recharts'
import { StatCard, Avatar, Badge } from '../../components/ui'
import { Card } from '../../components/ui'
import Button from '../../components/ui/Button'
import {
  MOCK_LEADS, MOCK_ACTIVITIES, MONTHLY_REVENUE,
  LEAD_SOURCES_DATA, CONVERSION_DATA, MOCK_TASKS
} from '../../constants'
import { cn, formatCurrency, formatRelativeTime, STATUS_COLORS } from '../../utils'
import { useAuth } from '../../contexts/AuthContext'

const STATS = [
  { title: 'Total Leads', value: '248', change: 12, icon: Users, iconColor: 'text-brand-blue', iconBg: 'bg-brand-blue/10' },
  { title: "Today's Leads", value: '14', change: 8, icon: UserPlus, iconColor: 'text-primary-500', iconBg: 'bg-primary-500/10' },
  { title: 'Won Deals', value: '32', change: 18, icon: Trophy, iconColor: 'text-yellow-400', iconBg: 'bg-yellow-500/10' },
  { title: 'Lost Deals', value: '11', change: -5, changeType: 'negative', icon: XCircle, iconColor: 'text-red-400', iconBg: 'bg-red-500/10' },
  { title: 'Revenue', value: '$1.2M', change: 24, icon: DollarSign, iconColor: 'text-primary-500', iconBg: 'bg-primary-500/10' },
  { title: 'Follow Ups', value: '18', change: 3, icon: Bell, iconColor: 'text-orange-400', iconBg: 'bg-orange-500/10' },
  { title: 'Open Tasks', value: '34', change: -2, changeType: 'negative', icon: CheckSquare, iconColor: 'text-brand-purple', iconBg: 'bg-brand-purple/10' },
  { title: 'Meetings', value: '7', change: 14, icon: Calendar, iconColor: 'text-cyan-400', iconBg: 'bg-cyan-500/10' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl border border-app px-3 py-2.5 shadow-card-dark">
      <p className="text-xs font-semibold text-heading mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: {p.name === 'revenue' ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

function RevenueChart() {
  return (
    <Card className="col-span-2">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-heading">Revenue Overview</h3>
          <p className="text-xs text-muted mt-0.5">Monthly revenue & deals closed</p>
        </div>
        <div className="flex gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary-500 inline-block" />Revenue</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-blue inline-block" />Deals</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="dealGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `$${v/1000}k` : v} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#revGrad)" name="revenue" />
          <Area type="monotone" dataKey="deals" stroke="#3B82F6" strokeWidth={2} fill="url(#dealGrad)" name="deals" />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

function LeadSourcesChart() {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-heading mb-1">Lead Sources</h3>
      <p className="text-xs text-muted mb-4">Where your leads come from</p>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={LEAD_SOURCES_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
            {LEAD_SOURCES_DATA.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={({ active, payload }) => active && payload?.length ? (
            <div className="glass rounded-xl border border-app px-3 py-2 shadow-card-dark">
              <p className="text-xs font-semibold text-heading">{payload[0].name}</p>
              <p className="text-xs text-primary-500">{payload[0].value}%</p>
            </div>
          ) : null} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2 mt-2">
        {LEAD_SOURCES_DATA.map(s => (
          <div key={s.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span className="text-xs text-body">{s.name}</span>
            </div>
            <span className="text-xs font-semibold text-heading">{s.value}%</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ConversionFunnel() {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-heading mb-1">Pipeline Funnel</h3>
      <p className="text-xs text-muted mb-4">Lead conversion stages</p>
      <div className="space-y-2">
        {CONVERSION_DATA.map((stage, i) => {
          const pct = Math.round((stage.count / CONVERSION_DATA[0].count) * 100)
          const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#F97316', '#06B6D4', '#10B981']
          return (
            <div key={stage.stage}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-body">{stage.stage}</span>
                <span className="text-xs font-semibold text-heading">{stage.count}</span>
              </div>
              <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: colors[i] }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function RecentLeads() {
  const navigate = useNavigate()
  return (
    <Card className="col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-heading">Recent Leads</h3>
        <Button variant="ghost" size="sm" onClick={() => navigate('/leads')} className="gap-1 text-xs">
          View all <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
      <div className="space-y-1">
        {MOCK_LEADS.slice(0, 5).map((lead, i) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/4 transition-colors cursor-pointer group"
            onClick={() => navigate(`/leads/${lead.id}`)}
          >
            <Avatar name={lead.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-heading truncate">{lead.name}</p>
              <p className="text-xs text-muted truncate">{lead.company}</p>
            </div>
            <span className={cn('text-xs px-2 py-0.5 rounded-md border capitalize hidden sm:inline-flex', STATUS_COLORS[lead.status])}>
              {lead.status}
            </span>
            <span className="text-xs font-semibold text-heading hidden md:block">{formatCurrency(lead.budget)}</span>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}

function ActivityFeed() {
  const iconMap = { UserPlus, Trophy, CheckSquare, Calendar, FileText, Mail, Activity }
  return (
    <Card>
      <h3 className="text-sm font-semibold text-heading mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {MOCK_ACTIVITIES.map((a, i) => {
          const Icon = iconMap[a.icon] || Activity
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-3"
            >
              <div className="w-7 h-7 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-heading leading-relaxed">{a.message}</p>
                <p className="text-xs text-muted mt-0.5">{a.user} · {a.time}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}

function UpcomingTasks() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-heading">Upcoming Tasks</h3>
        <Badge variant="blue">{MOCK_TASKS.filter(t => t.status !== 'completed').length} pending</Badge>
      </div>
      <div className="space-y-2">
        {MOCK_TASKS.filter(t => t.status !== 'completed').slice(0, 4).map((task, i) => {
          const priorityColors = { low: 'bg-gray-500', medium: 'bg-yellow-500', high: 'bg-orange-500', urgent: 'bg-red-500' }
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/4 transition-colors"
            >
              <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', priorityColors[task.priority])} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-heading truncate">{task.title}</p>
                <p className="text-xs text-muted mt-0.5">Due {task.dueDate}</p>
              </div>
              <Avatar name={task.assignedTo} size="xs" />
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-heading">Good morning, {user?.name?.split(' ')[0]} 👋</h2>
        <p className="text-sm text-muted mt-1">Here's your sales overview for today.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
        {STATS.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RevenueChart />
        <LeadSourcesChart />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RecentLeads />
        <ConversionFunnel />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityFeed />
        <UpcomingTasks />
      </div>
    </div>
  )
}
