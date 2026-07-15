import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Trophy, XCircle, DollarSign,
  Activity, UserPlus, Bell, CheckSquare, CalendarDays,
  ChevronDown
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { StatCard, Avatar, Card } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { cn, formatCurrency, formatRelativeTime, formatNumber } from '../../utils'

// ─── Period helpers ───────────────────────────────────────────────────────────
const PERIODS = [
  { key: 'weekly',  label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
  { key: 'yearly',  label: 'This Year' },
]

function getDateRange(period) {
  const now = new Date()
  const to = now.toISOString().split('T')[0]
  let from
  if (period === 'weekly') {
    const d = new Date(now)
    d.setDate(d.getDate() - 6)
    from = d.toISOString().split('T')[0]
  } else if (period === 'monthly') {
    from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  } else {
    from = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
  }
  return { from, to }
}

// ─── Period Selector ──────────────────────────────────────────────────────────
function PeriodSelector({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const current = PERIODS.find(p => p.key === value)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass border border-app text-sm text-heading hover:border-primary-500/40 transition-colors"
      >
        <span>{current.label}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-muted transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 z-20 glass border border-app rounded-xl overflow-hidden shadow-card-dark min-w-[130px]"
          >
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => { onChange(p.key); setOpen(false) }}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/8',
                  p.key === value ? 'text-primary-500 font-medium' : 'text-body'
                )}
              >
                {p.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl border border-app px-3 py-2.5 shadow-card-dark">
      <p className="text-xs font-semibold text-heading mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: {['revenue', 'paid', 'total'].includes(p.name) ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

const SOURCE_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#F59E0B', '#06B6D4', '#EC4899', '#64748B', '#EF4444']
const STATUS_CHART_COLORS = {
  new: '#3B82F6', contacted: '#8B5CF6', qualified: '#F59E0B',
  meeting: '#F97316', proposal: '#06B6D4', negotiation: '#EC4899',
  won: '#10B981', lost: '#EF4444', on_hold: '#64748B',
}

// ─── Revenue Chart ────────────────────────────────────────────────────────────
function RevenueChart({ data, loading, period }) {
  const chartData = (data || []).map(d => ({
    month: new Date(d.month).toLocaleString('default', { month: 'short', year: period === 'yearly' ? '2-digit' : undefined }),
    revenue: parseFloat(d.total) || 0,
    paid: parseFloat(d.paid) || 0,
  }))

  return (
    <Card className="col-span-2">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-heading">Revenue Overview</h3>
          <p className="text-xs text-muted mt-0.5">Invoiced vs collected</p>
        </div>
        <div className="flex gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary-500 inline-block" />Invoiced</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-blue inline-block" />Collected</span>
        </div>
      </div>
      {loading ? (
        <div className="h-[220px] shimmer-bg rounded-xl" />
      ) : chartData.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-sm text-muted">No revenue data for this period</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `$${v / 1000}k` : v} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#revGrad)" name="revenue" />
            <Area type="monotone" dataKey="paid" stroke="#3B82F6" strokeWidth={2} fill="url(#paidGrad)" name="paid" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

// ─── Lead Sources Chart ───────────────────────────────────────────────────────
function LeadSourcesChart({ data, loading }) {
  const chartData = (data || []).map((d, i) => ({
    name: d.source || 'Unknown',
    value: parseInt(d.count),
    color: SOURCE_COLORS[i % SOURCE_COLORS.length],
  }))
  const total = chartData.reduce((s, d) => s + d.value, 0)

  return (
    <Card>
      <h3 className="text-sm font-semibold text-heading mb-1">Lead Sources</h3>
      <p className="text-xs text-muted mb-4">Where your leads come from</p>
      {loading ? (
        <div className="h-[180px] shimmer-bg rounded-xl" />
      ) : chartData.length === 0 ? (
        <div className="h-[180px] flex items-center justify-center text-sm text-muted">No data for this period</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div className="glass rounded-xl border border-app px-3 py-2 shadow-card-dark">
                  <p className="text-xs font-semibold text-heading">{payload[0].name}</p>
                  <p className="text-xs text-primary-500">{payload[0].value} leads</p>
                </div>
              ) : null} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {chartData.map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-xs text-body">{s.name}</span>
                </div>
                <span className="text-xs font-semibold text-heading">
                  {total ? Math.round((s.value / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

// ─── Pipeline Funnel ──────────────────────────────────────────────────────────
function ConversionFunnel({ data, loading }) {
  const ORDER = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'on_hold']
  const chartData = ORDER.map(s => ({
    stage: s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    count: parseInt((data || []).find(d => d.status === s)?.count || 0),
    color: STATUS_CHART_COLORS[s],
  })).filter(d => d.count > 0)

  const max = chartData[0]?.count || 1

  return (
    <Card>
      <h3 className="text-sm font-semibold text-heading mb-1">Pipeline Funnel</h3>
      <p className="text-xs text-muted mb-4">Lead conversion stages</p>
      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-7 shimmer-bg rounded-lg" />)}</div>
      ) : chartData.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm text-muted">No leads for this period</div>
      ) : (
        <div className="space-y-2">
          {chartData.map((stage, i) => {
            const pct = Math.round((stage.count / max) * 100)
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
                    transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: stage.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ─── Lead Trend Chart ─────────────────────────────────────────────────────────
function LeadTrendChart({ data, loading, period }) {
  const chartData = (data || []).map(d => ({
    label: new Date(d.month).toLocaleString('default', {
      month: 'short',
      year: period === 'yearly' ? '2-digit' : undefined,
    }),
    leads: parseInt(d.count),
  }))

  return (
    <Card className="col-span-2">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-heading">Lead Trend</h3>
        <p className="text-xs text-muted mt-0.5">New leads over selected period</p>
      </div>
      {loading ? (
        <div className="h-[180px] shimmer-bg rounded-xl" />
      ) : chartData.length === 0 ? (
        <div className="h-[180px] flex items-center justify-center text-sm text-muted">No data for this period</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="leads" fill="#10B981" radius={[4, 4, 0, 0]} name="leads" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

// ─── Recent Activity ──────────────────────────────────────────────────────────
function ActivityFeed({ data, loading }) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-heading mb-4">Recent Activity</h3>
      {loading ? (
        <div className="space-y-4">{[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-7 h-7 shimmer-bg rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 shimmer-bg rounded w-3/4" />
              <div className="h-2.5 shimmer-bg rounded w-1/2" />
            </div>
          </div>
        ))}</div>
      ) : !data?.length ? (
        <div className="text-center py-8 text-sm text-muted">No recent activity</div>
      ) : (
        <div className="space-y-4">
          {data.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-3"
            >
              <div className="w-7 h-7 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Activity className="w-3.5 h-3.5 text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-heading leading-relaxed">
                  <span className="font-medium capitalize">{a.type?.replace(/_/g, ' ')}</span>
                  {a.lead && <span className="text-muted"> · {a.lead.title}</span>}
                </p>
                <p className="text-xs text-muted mt-0.5">{formatRelativeTime(a.createdAt || a.created_at)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Agent Performance ────────────────────────────────────────────────────────
function AgentPerformance({ data, loading }) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-heading mb-4">Agent Performance</h3>
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 shimmer-bg rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 shimmer-bg rounded w-1/2" />
              <div className="h-2 shimmer-bg rounded w-full" />
            </div>
          </div>
        ))}</div>
      ) : !data?.length ? (
        <div className="text-center py-8 text-sm text-muted">No agent data</div>
      ) : (
        <div className="space-y-3">
          {data.map((a, i) => (
            <motion.div key={a.agent.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
              className="flex items-center gap-3">
              <Avatar name={a.agent.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-heading truncate">{a.agent.name}</p>
                  <span className="text-xs text-primary-500 font-bold flex-shrink-0 ml-2">{a.winRate}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${a.winRate}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full rounded-full bg-primary-500"
                  />
                </div>
                <p className="text-xs text-muted mt-1">{a.total} leads · {a.won} won · {a.lost} lost</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const isAdminOrManager = ['admin', 'manager'].includes(user?.role)
  const [period, setPeriod] = useState('monthly')

  const { from, to } = useMemo(() => getDateRange(period), [period])

  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats'),
  })

  const { data: revenueRes, isLoading: revenueLoading } = useQuery({
    queryKey: ['dashboard-revenue', from, to],
    queryFn: () => api.get('/dashboard/reports/revenue', { params: { from, to } }),
    enabled: isAdminOrManager,
  })

  const { data: agentRes, isLoading: agentLoading } = useQuery({
    queryKey: ['dashboard-agents', from, to],
    queryFn: () => api.get('/dashboard/reports/agent-performance', { params: { from, to } }),
    enabled: isAdminOrManager,
  })

  const { data: upcomingRes, isLoading: upcomingLoading } = useQuery({
    queryKey: ['dashboard-upcoming'],
    queryFn: () => api.get('/tasks/upcoming'),
  })

  const stats = statsRes?.data
  const revenueMonthly = revenueRes?.data?.monthly || []
  const agentPerformance = agentRes?.data || []
  const upcoming = upcomingRes?.data || []

  // Filter stats client-side by period using the from date
  const fromDate = new Date(from)
  const filteredActivities = (stats?.recentActivities || []).filter(a => new Date(a.createdAt || a.created_at) >= fromDate)

  const filteredLeadsByStatus = useMemo(() => {
    // leadsByStatus from stats is all-time; we show it as-is since backend doesn't filter it
    return stats?.charts?.leadsByStatus || []
  }, [stats])

  const filteredLeadsBySource = useMemo(() => {
    return stats?.charts?.leadsBySource || []
  }, [stats])

  // Filter monthly leads chart by period
  const filteredMonthlyLeads = useMemo(() => {
    return (stats?.charts?.monthlyLeads || []).filter(d => new Date(d.month) >= fromDate)
  }, [stats, from])

  // Compute stat card values filtered by period from recentActivities dates
  const periodLeads = useMemo(() => {
    const all = stats?.leads || {}
    // We can't filter leads by period from stats endpoint — show all-time totals
    return all
  }, [stats])

  const followUpsCount = upcoming.filter(a => a.type === 'follow_up' || a.outcome === 'follow_up').length
  const tasksCount = upcoming.filter(a => a.type === 'task').length
  const meetingsCount = upcoming.filter(a => a.type === 'meeting').length

  const revenueGrowth = stats?.revenue?.growth
  const growthPositive = revenueGrowth === null || parseFloat(revenueGrowth) >= 0

  // Revenue for selected period from report data
  const periodRevenue = useMemo(() => {
    return revenueMonthly.reduce((sum, d) => sum + (parseFloat(d.paid) || 0), 0)
  }, [revenueMonthly])

  const statCards = [
    {
      title: 'Total Leads',
      value: statsLoading ? '—' : formatNumber(periodLeads?.total || 0),
      icon: Users, iconColor: 'text-brand-blue', iconBg: 'bg-brand-blue/10',
      loading: statsLoading,
    },
    {
      title: 'New Leads',
      value: statsLoading ? '—' : formatNumber(periodLeads?.new || 0),
      icon: UserPlus, iconColor: 'text-primary-500', iconBg: 'bg-primary-500/10',
      loading: statsLoading,
    },
    {
      title: 'Won Deals',
      value: statsLoading ? '—' : formatNumber(periodLeads?.won || 0),
      icon: Trophy, iconColor: 'text-yellow-400', iconBg: 'bg-yellow-500/10',
      loading: statsLoading,
    },
    {
      title: 'Lost Deals',
      value: statsLoading ? '—' : formatNumber(periodLeads?.lost || 0),
      icon: XCircle, iconColor: 'text-red-400', iconBg: 'bg-red-500/10',
      loading: statsLoading,
    },
    {
      title: 'Revenue',
      value: isAdminOrManager
        ? (revenueLoading ? '—' : formatCurrency(periodRevenue))
        : (statsLoading ? '—' : formatCurrency(stats?.revenue?.total || 0)),
      change: revenueGrowth !== null && revenueGrowth !== undefined ? Math.abs(parseFloat(revenueGrowth)) : undefined,
      changeType: growthPositive ? 'positive' : 'negative',
      icon: DollarSign, iconColor: 'text-primary-500', iconBg: 'bg-primary-500/10',
      loading: isAdminOrManager ? revenueLoading : statsLoading,
    },
    {
      title: 'Follow Ups',
      value: upcomingLoading ? '—' : formatNumber(followUpsCount),
      icon: Bell, iconColor: 'text-orange-400', iconBg: 'bg-orange-500/10',
      loading: upcomingLoading,
    },
    {
      title: 'Open Tasks',
      value: upcomingLoading ? '—' : formatNumber(tasksCount),
      icon: CheckSquare, iconColor: 'text-brand-purple', iconBg: 'bg-brand-purple/10',
      loading: upcomingLoading,
    },
    {
      title: 'Meetings',
      value: upcomingLoading ? '—' : formatNumber(meetingsCount),
      icon: CalendarDays, iconColor: 'text-cyan-400', iconBg: 'bg-cyan-500/10',
      loading: upcomingLoading,
    },
  ]

  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-heading">{greeting}, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="text-sm text-muted mt-1">Here's your sales overview for today.</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 — Revenue + Sources (admin/manager only) */}
      {isAdminOrManager && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RevenueChart data={revenueMonthly} loading={revenueLoading} period={period} />
          <LeadSourcesChart data={filteredLeadsBySource} loading={statsLoading} />
        </div>
      )}

      {/* Charts Row 2 — Lead Trend + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <LeadTrendChart data={filteredMonthlyLeads} loading={statsLoading} period={period} />
        <ConversionFunnel data={filteredLeadsByStatus} loading={statsLoading} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityFeed data={filteredActivities} loading={statsLoading} />
        {isAdminOrManager
          ? <AgentPerformance data={agentPerformance} loading={agentLoading} />
          : <LeadSourcesChart data={filteredLeadsBySource} loading={statsLoading} />
        }
      </div>
    </div>
  )
}
