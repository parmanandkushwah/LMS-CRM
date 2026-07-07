import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Phone, Mail, Building2, DollarSign, TrendingUp } from 'lucide-react'
import { Card, Avatar, Badge, StatCard } from '../../components/ui'
import Button from '../../components/ui/Button'
import { MOCK_LEADS } from '../../constants'
import { cn, formatCurrency, formatDate, STATUS_COLORS } from '../../utils'

const customers = MOCK_LEADS.filter(l => l.status === 'won').map(l => ({
  ...l,
  totalOrders: Math.floor(Math.random() * 10) + 1,
  totalSpent: l.budget * (Math.random() * 0.8 + 0.5),
  lastOrder: '2024-01-20',
  status: 'active',
}))

function CustomerCard({ customer }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="glass rounded-2xl p-5 border border-app hover:border-primary-500/20 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3 mb-4">
        <Avatar name={customer.name} size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-heading truncate">{customer.name}</h3>
          <p className="text-xs text-muted truncate">{customer.company}</p>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border mt-1 bg-green-500/10 text-green-400 border-green-500/20">
            Active
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2 rounded-xl bg-white/4 border border-app text-center">
          <p className="text-sm font-bold text-primary-500">{formatCurrency(customer.totalSpent)}</p>
          <p className="text-xs text-muted">Total Spent</p>
        </div>
        <div className="p-2 rounded-xl bg-white/4 border border-app text-center">
          <p className="text-sm font-bold text-brand-blue">{customer.totalOrders}</p>
          <p className="text-xs text-muted">Orders</p>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-app">
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

export default function Customers() {
  const [search, setSearch] = useState('')
  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase())
  )

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { title: 'Total Customers', value: customers.length, icon: Building2, iconColor: 'text-brand-blue', iconBg: 'bg-brand-blue/10' },
          { title: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, iconColor: 'text-primary-500', iconBg: 'bg-primary-500/10' },
          { title: 'Active', value: customers.length, icon: TrendingUp, iconColor: 'text-primary-500', iconBg: 'bg-primary-500/10' },
          { title: 'Avg Value', value: formatCurrency(totalRevenue / customers.length), icon: TrendingUp, iconColor: 'text-brand-purple', iconBg: 'bg-brand-purple/10' },
        ].map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-app bg-card text-heading placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
          />
        </div>
        <Button size="sm"><Plus className="w-3.5 h-3.5" />Add Customer</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((customer, i) => (
          <motion.div key={customer.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <CustomerCard customer={customer} />
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted text-sm">No customers found</p>
        </div>
      )}
    </div>
  )
}
