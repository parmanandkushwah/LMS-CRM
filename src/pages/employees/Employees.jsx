import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Users, DollarSign, Star, Phone, Mail } from 'lucide-react'
import { Card, Avatar, StatCard } from '../../components/ui'
import { MOCK_EMPLOYEES } from '../../constants'
import { cn, formatCurrency } from '../../utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function PerformanceBar({ value, max = 100 }) {
  return (
    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={cn('h-full rounded-full', value >= 85 ? 'bg-primary-500' : value >= 70 ? 'bg-yellow-400' : 'bg-orange-400')}
      />
    </div>
  )
}

function EmployeeCard({ employee, rank }) {
  const rankColors = { 1: 'text-yellow-400', 2: 'text-gray-300', 3: 'text-orange-400' }
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3 }}
      className="glass rounded-2xl p-5 border border-app hover:border-primary-500/20 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar name={employee.name} size="lg" />
            {rank <= 3 && (
              <div className={cn('absolute -top-1 -right-1 w-5 h-5 rounded-full bg-dark-sidebar border border-app flex items-center justify-center text-xs font-bold', rankColors[rank])}>
                {rank}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-heading">{employee.name}</h3>
            <p className="text-xs text-muted">{employee.role}</p>
          </div>
        </div>
        {rank === 1 && <Trophy className="w-5 h-5 text-yellow-400" />}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Leads', value: employee.leads, icon: Users, color: 'text-brand-blue' },
          { label: 'Deals', value: employee.deals, icon: TrendingUp, color: 'text-primary-500' },
          { label: 'Revenue', value: formatCurrency(employee.revenue), icon: DollarSign, color: 'text-yellow-400' },
          { label: 'Score', value: `${employee.performance}%`, icon: Star, color: 'text-brand-purple' },
        ].map(s => (
          <div key={s.label} className="p-2.5 rounded-xl bg-white/4 border border-app">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className={cn('w-3 h-3', s.color)} />
              <span className="text-xs text-muted">{s.label}</span>
            </div>
            <p className={cn('text-sm font-bold', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">Performance</span>
          <span className="text-xs font-semibold text-heading">{employee.performance}%</span>
        </div>
        <PerformanceBar value={employee.performance} />
      </div>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-app">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs text-muted hover:text-heading hover:bg-white/8 transition-colors">
          <Phone className="w-3 h-3" />Call
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs text-muted hover:text-heading hover:bg-white/8 transition-colors">
          <Mail className="w-3 h-3" />Email
        </button>
      </div>
    </motion.div>
  )
}

function Leaderboard() {
  const sorted = [...MOCK_EMPLOYEES].sort((a, b) => b.revenue - a.revenue)
  return (
    <Card>
      <h3 className="text-sm font-semibold text-heading mb-4">Revenue Leaderboard</h3>
      <div className="space-y-3">
        {sorted.map((emp, i) => (
          <motion.div key={emp.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3">
            <span className={cn('text-sm font-bold w-5 text-center', i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-muted')}>
              {i + 1}
            </span>
            <Avatar name={emp.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-heading truncate">{emp.name}</p>
              <div className="mt-1">
                <PerformanceBar value={emp.revenue} max={Math.max(...MOCK_EMPLOYEES.map(e => e.revenue))} />
              </div>
            </div>
            <span className="text-xs font-bold text-primary-500 flex-shrink-0">{formatCurrency(emp.revenue)}</span>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}

export default function Employees() {
  const sorted = [...MOCK_EMPLOYEES].sort((a, b) => b.performance - a.performance)
  const totalRevenue = MOCK_EMPLOYEES.reduce((s, e) => s + e.revenue, 0)
  const totalLeads = MOCK_EMPLOYEES.reduce((s, e) => s + e.leads, 0)
  const avgPerformance = Math.round(MOCK_EMPLOYEES.reduce((s, e) => s + e.performance, 0) / MOCK_EMPLOYEES.length)

  const chartData = MOCK_EMPLOYEES.map(e => ({ name: e.name.split(' ')[0], revenue: e.revenue, leads: e.leads }))

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { title: 'Team Members', value: MOCK_EMPLOYEES.length, icon: Users, iconColor: 'text-brand-blue', iconBg: 'bg-brand-blue/10' },
          { title: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, iconColor: 'text-primary-500', iconBg: 'bg-primary-500/10' },
          { title: 'Total Leads', value: totalLeads, icon: TrendingUp, iconColor: 'text-brand-purple', iconBg: 'bg-brand-purple/10' },
          { title: 'Avg Performance', value: `${avgPerformance}%`, icon: Star, iconColor: 'text-yellow-400', iconBg: 'bg-yellow-500/10' },
        ].map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Employee Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sorted.map((emp, i) => (
            <EmployeeCard key={emp.id} employee={emp} rank={i + 1} />
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Leaderboard />
          <Card>
            <h3 className="text-sm font-semibold text-heading mb-4">Team Performance</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  )
}
