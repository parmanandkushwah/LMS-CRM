import { motion } from 'framer-motion'
import { Download, TrendingUp, DollarSign, Users, Target } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Card, StatCard } from '../../components/ui'
import Button from '../../components/ui/Button'
import { MONTHLY_REVENUE, LEAD_SOURCES_DATA, CONVERSION_DATA, MOCK_EMPLOYEES } from '../../constants'
import { formatCurrency } from '../../utils'
import toast from 'react-hot-toast'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl border border-app px-3 py-2.5 shadow-card-dark">
      <p className="text-xs font-semibold text-heading mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

const employeePerf = MOCK_EMPLOYEES.map(e => ({
  name: e.name.split(' ')[0],
  leads: e.leads,
  deals: e.deals,
  revenue: e.revenue / 1000,
}))

export default function Reports() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-heading">Analytics & Reports</h2>
          <p className="text-sm text-muted">Insights for the last 12 months</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.success('Report exported!')}>
          <Download className="w-3.5 h-3.5" />Export Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { title: 'Total Revenue', value: '$1.06M', change: 24, icon: DollarSign, iconColor: 'text-primary-500', iconBg: 'bg-primary-500/10' },
          { title: 'Total Leads', value: '513', change: 18, icon: Users, iconColor: 'text-brand-blue', iconBg: 'bg-brand-blue/10' },
          { title: 'Deals Closed', value: '185', change: 12, icon: Target, iconColor: 'text-brand-purple', iconBg: 'bg-brand-purple/10' },
          { title: 'Conversion Rate', value: '36%', change: 5, icon: TrendingUp, iconColor: 'text-yellow-400', iconBg: 'bg-yellow-500/10' },
        ].map((s, i) => (
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
          <AreaChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `$${v/1000}k` : v} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#64748B' }} />
            <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#rGrad)" name="Revenue" />
            <Area type="monotone" dataKey="deals" stroke="#3B82F6" strokeWidth={2} fill="url(#dGrad)" name="Deals" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lead Sources */}
        <Card>
          <h3 className="text-sm font-semibold text-heading mb-4">Lead Sources</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={LEAD_SOURCES_DATA} cx="50%" cy="50%" outerRadius={75} paddingAngle={3} dataKey="value">
                {LEAD_SOURCES_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {LEAD_SOURCES_DATA.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="text-xs text-body truncate">{s.name}</span>
                <span className="text-xs font-semibold text-heading ml-auto">{s.value}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <h3 className="text-sm font-semibold text-heading mb-4">Conversion Funnel</h3>
          <div className="space-y-2.5">
            {CONVERSION_DATA.map((stage, i) => {
              const pct = Math.round((stage.count / CONVERSION_DATA[0].count) * 100)
              const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#F97316', '#06B6D4', '#10B981']
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-body">{stage.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">{pct}%</span>
                      <span className="text-xs font-semibold text-heading">{stage.count}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: colors[i] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Employee Performance */}
        <Card>
          <h3 className="text-sm font-semibold text-heading mb-4">Employee Performance</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={employeePerf} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="leads" fill="#3B82F6" radius={[3, 3, 0, 0]} name="Leads" />
              <Bar dataKey="deals" fill="#10B981" radius={[3, 3, 0, 0]} name="Deals" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Monthly Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-heading">Monthly Breakdown</h3>
          <Button variant="outline" size="xs" onClick={() => toast.success('Table exported!')}>
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
              {MONTHLY_REVENUE.map((row, i) => {
                const prev = MONTHLY_REVENUE[i - 1]
                const growth = prev ? Math.round(((row.revenue - prev.revenue) / prev.revenue) * 100) : 0
                return (
                  <motion.tr key={row.month} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-app last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-heading">{row.month}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-primary-500">{formatCurrency(row.revenue)}</td>
                    <td className="px-4 py-3 text-sm text-body">{row.leads}</td>
                    <td className="px-4 py-3 text-sm text-body">{row.deals}</td>
                    <td className="px-4 py-3 text-sm text-body">{formatCurrency(Math.round(row.revenue / row.deals))}</td>
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
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
