import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, TrendingUp, DollarSign, Users, Target, AlertCircle } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Card, StatCard } from '../../components/ui'
import Button from '../../components/ui/Button'
import { formatNumber } from '../../utils'
import { exportReportsToExcel, exportSheetToExcel } from '../../utils/exportReport'
import api from '../../services/api'
import toast from 'react-hot-toast'

const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#F97316', '#06B6D4', '#10B981', '#EC4899', '#6366F1']
const FUNNEL_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#F97316', '#06B6D4', '#10B981', '#EC4899']

const money = (n) => `Rs ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(n) || 0)}`
const ym = (d) => { const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}` }
const monthLabel = (d) => new Date(d).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
const STATUS_ORDER = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl border border-app px-3 py-2.5 shadow-card-dark">
      <p className="text-xs font-semibold text-heading mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value >= 1000 ? money(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Reports() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const [rev, ld, ag] = await Promise.all([
        api.get('/dashboard/reports/revenue'),
        api.get('/dashboard/reports/leads'),
        api.get('/dashboard/reports/agent-performance'),
      ])
      return {
        revenue: rev.data || { invoices: [], byStatus: [], monthly: [] },
        leads: ld.data || [],
        agents: ag.data || [],
      }
    },
  })

  const view = useMemo(() => {
    if (!data) return null
    const invoices = data.revenue.invoices || []
    const leads = data.leads || []
    const agents = data.agents || []

    const totalRevenue = invoices.reduce((s, i) => s + (Number(i.total) || 0), 0)
    const totalLeads = leads.length
    const dealsClosed = invoices.length
    const wonLeads = leads.filter(l => l.status === 'won').length
    const conversionRate = totalLeads ? Math.round((wonLeads / totalLeads) * 100) : 0

    const monthlyRev = (data.revenue.monthly || []).map(m => ({
      month: monthLabel(m.month),
      revenue: Number(m.total) || 0,
      paid: Number(m.paid) || 0,
    }))

    const leadsByMonth = {}
    leads.forEach(l => { const k = ym(l.createdAt || l.created_at); leadsByMonth[k] = (leadsByMonth[k] || 0) + 1 })
    const dealsByMonth = {}
    invoices.forEach(inv => { const k = ym(inv.issue_date); dealsByMonth[k] = (dealsByMonth[k] || 0) + 1 })

    const table = (data.revenue.monthly || []).map(m => {
      const k = ym(m.month)
      const rev = Number(m.total) || 0
      const d = dealsByMonth[k] || 0
      return { month: monthLabel(m.month), revenue: rev, leads: leadsByMonth[k] || 0, deals: d, avg: d ? rev / d : 0 }
    })

    const sourceCounts = {}
    leads.forEach(l => { const s = l.source || 'Other'; sourceCounts[s] = (sourceCounts[s] || 0) + 1 })
    const srcTotal = Object.values(sourceCounts).reduce((a, b) => a + b, 0) || 1
    const leadSources = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({ name: capitalize(name), value: Math.round((count / srcTotal) * 100), raw: count, color: PIE_COLORS[i % PIE_COLORS.length] }))

    const statusCounts = {}
    leads.forEach(l => { const s = l.status || 'unknown'; statusCounts[s] = (statusCounts[s] || 0) + 1 })
    const present = STATUS_ORDER.filter(s => statusCounts[s] != null)
    Object.keys(statusCounts).forEach(s => { if (!present.includes(s)) present.push(s) })
    const funnelTop = present.length ? statusCounts[present[0]] : 0
    const conversion = present.map((s, i) => ({
      stage: capitalize(s),
      count: statusCounts[s],
      pct: funnelTop ? Math.round((statusCounts[s] / funnelTop) * 100) : 0,
      color: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
    }))

    const empPerf = agents.map(a => ({ name: a.agent.name.split(' ')[0], leads: a.total, deals: a.won }))

    const revGrowth = monthlyRev.length >= 2
      ? Math.round(((monthlyRev[monthlyRev.length - 1].revenue - monthlyRev[monthlyRev.length - 2].revenue) / (monthlyRev[monthlyRev.length - 2].revenue || 1)) * 100)
      : null

    return {
      kpis: [
        { title: 'Total Revenue', value: money(totalRevenue), change: revGrowth ?? undefined, changeType: revGrowth >= 0 ? 'positive' : 'negative', icon: DollarSign, iconColor: 'text-primary-500', iconBg: 'bg-primary-500/10' },
        { title: 'Total Leads', value: formatNumber(totalLeads), icon: Users, iconColor: 'text-brand-blue', iconBg: 'bg-brand-blue/10' },
        { title: 'Deals Closed', value: formatNumber(dealsClosed), icon: Target, iconColor: 'text-brand-purple', iconBg: 'bg-brand-purple/10' },
        { title: 'Conversion Rate', value: `${conversionRate}%`, icon: TrendingUp, iconColor: 'text-yellow-400', iconBg: 'bg-yellow-500/10' },
      ],
      monthlyRev, table, leadSources, conversion, empPerf,
      hasData: totalLeads > 0 || invoices.length > 0,
    }
  }, [data])

  const handleExportReport = () => {
    if (!view || !data) {
      toast.error('Report data is not ready yet.')
      return
    }
    try {
      exportReportsToExcel(view, data)
      toast.success('Report exported!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to export report.')
    }
  }

  const handleExportMonthlyTable = () => {
    if (!view) {
      toast.error('Report data is not ready yet.')
      return
    }
    try {
      const rows = view.table.map((row, i) => {
        const prev = view.table[i - 1]
        const growth = prev && prev.revenue ? Math.round(((row.revenue - prev.revenue) / prev.revenue) * 100) : 0
        return [row.month, Number(row.revenue) || 0, Number(row.leads) || 0, Number(row.deals) || 0, Number(row.avg) || 0, `${growth}%`]
      })
      exportSheetToExcel(
        'Monthly Breakdown',
        ['Month', 'Revenue', 'Leads', 'Deals', 'Avg Deal Size', 'Growth'],
        rows,
        { filename: `LMS_Monthly_Breakdown_${new Date().toISOString().slice(0, 10)}.xlsx` }
      )
      toast.success('Monthly breakdown exported!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to export table.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="shimmer-bg h-6 w-40 rounded-lg mb-2" />
            <div className="shimmer-bg h-4 w-32 rounded-lg" />
          </div>
          <div className="shimmer-bg h-8 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 space-y-3">
              <div className="shimmer-bg h-4 w-24 rounded-lg" />
              <div className="shimmer-bg h-8 w-32 rounded-lg" />
              <div className="shimmer-bg h-3 w-20 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="shimmer-bg h-5 w-40 rounded-lg mb-2" />
              <div className="shimmer-bg h-3 w-48 rounded-lg" />
            </div>
            <div className="shimmer-bg h-8 w-8 rounded-lg" />
          </div>
          <div className="h-[280px] shimmer-bg rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 space-y-4">
              <div className="shimmer-bg h-5 w-32 rounded-lg" />
              <div className="h-[200px] shimmer-bg rounded-xl" />
            </div>
          ))}
        </div>
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="shimmer-bg h-5 w-40 rounded-lg" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="shimmer-bg h-10 rounded-lg" />)}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
        <p className="text-sm text-heading font-medium">Unable to load reports</p>
        <p className="text-xs text-muted mt-1">You may not have permission to view analytics, or something went wrong.</p>
      </div>
    )
  }

  if (!view || !view.hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-heading">Analytics & Reports</h2>
          <p className="text-sm text-muted">Performance overview</p>
        </div>
        <Card className="py-16">
          <div className="text-center">
            <TrendingUp className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-muted text-sm">No data yet. Reports will appear once you add leads and invoices.</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-heading">Analytics & Reports</h2>
          <p className="text-sm text-muted">Performance overview</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportReport} disabled={!view}>
          <Download className="w-3.5 h-3.5" />Export Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {view.kpis.map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-heading">Revenue & Deals Trend</h3>
            <p className="text-xs text-muted mt-0.5">Monthly performance overview</p>
          </div>
          <Button variant="outline" size="xs" onClick={() => toast.success('Chart exported!')}>
            <Download className="w-3 h-3" />
          </Button>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={view.monthlyRev} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `Rs ${formatNumber(v)}` : v} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#64748B' }} />
            <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#rGrad)" name="Revenue" />
            <Area type="monotone" dataKey="paid" stroke="#6366F1" strokeWidth={2} fill="url(#pGrad)" name="Paid" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lead Sources */}
        <Card>
          <h3 className="text-sm font-semibold text-heading mb-4">Lead Sources</h3>
          {view.leadSources.length ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={view.leadSources} cx="50%" cy="50%" outerRadius={75} paddingAngle={3} dataKey="raw">
                    {view.leadSources.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {view.leadSources.map(s => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-xs text-body truncate">{s.name}</span>
                    <span className="text-xs font-semibold text-heading ml-auto">{s.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-xs text-muted">No lead data.</p>}
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <h3 className="text-sm font-semibold text-heading mb-4">Conversion Funnel</h3>
          <div className="space-y-2.5">
            {view.conversion.map((stage, i) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-body">{stage.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">{stage.pct}%</span>
                    <span className="text-xs font-semibold text-heading">{stage.count}</span>
                  </div>
                </div>
                <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full rounded-full"
                    style={{ background: stage.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Employee Performance */}
        <Card>
          <h3 className="text-sm font-semibold text-heading mb-4">Employee Performance</h3>
          {view.empPerf.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={view.empPerf} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="leads" fill="#3B82F6" radius={[3, 3, 0, 0]} name="Leads" />
                <Bar dataKey="deals" fill="#10B981" radius={[3, 3, 0, 0]} name="Deals" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted">No agent data.</p>}
        </Card>
      </div>

      {/* Monthly Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-heading">Monthly Breakdown</h3>
          <Button variant="outline" size="xs" onClick={handleExportMonthlyTable}>
            <Download className="w-3 h-3" />Export
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-app">
                {['Month', 'Revenue', 'Leads', 'Deals', 'Avg Deal Size', 'Growth'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {view.table.map((row, i) => {
                  const prev = view.table[i - 1]
                  const growth = prev ? Math.round(((row.revenue - prev.revenue) / (prev.revenue || 1)) * 100) : 0
                  return (
                    <motion.tr key={row.month} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-app last:border-0 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-heading">{row.month}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-primary-500">{money(row.revenue)}</td>
                      <td className="px-4 py-3 text-sm text-body">{row.leads}</td>
                      <td className="px-4 py-3 text-sm text-body">{row.deals}</td>
                      <td className="px-4 py-3 text-sm text-body">{row.deals ? money(row.avg) : '—'}</td>
                      <td className="px-4 py-3">
                        {i > 0 && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${growth >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {growth >= 0 ? '↑' : '↓'} {Math.abs(growth)}%
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
