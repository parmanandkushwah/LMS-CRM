import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, Plus, Phone, Mail, Building2, DollarSign, TrendingUp, X, User, ArrowRight } from 'lucide-react'
import { Avatar, StatCard } from '../../components/ui'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import api from '../../services/api'
import toast from 'react-hot-toast'

const formatINR = (amount) => `Rs ${new Intl.NumberFormat('en-IN').format(Number(amount) || 0)}`

// A "customer" is a won lead, so adding one creates a lead with status 'won'.
const customerSchema = z.object({
  contact_name: z.string().min(2, 'Name is required'),
  company_name: z.string().optional().or(z.literal('')),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  contact_phone: z.string().optional().or(z.literal('')),
  estimated_value: z.coerce.number({ invalid_type_error: 'Enter a valid amount' }).min(0, 'Must be 0 or more').optional(),
})

// Customers are derived from won leads (no separate customer model on the backend).
// Won leads are grouped by company (falling back to contact) so orders/spend are real.
function buildCustomers(leads) {
  const map = new Map()
  for (const l of leads) {
    const key = l.company_name || l.contact_name || `lead-${l.id}`
    const value = Number(l.estimated_value) || 0
    const closeDate = l.actual_close_date || l.updated_at || l.created_at
    const existing = map.get(key)
    if (existing) {
      existing.totalOrders += 1
      existing.totalSpent += value
      if (closeDate && (!existing.lastOrder || new Date(closeDate) > new Date(existing.lastOrder)))
        existing.lastOrder = closeDate
    } else {
      map.set(key, {
        id: l.id,
        name: l.contact_name || l.title,
        company: l.company_name || '',
        totalOrders: 1,
        totalSpent: value,
        lastOrder: closeDate,
        status: 'active',
      })
    }
  }
  return Array.from(map.values())
}

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
          <p className="text-sm font-bold text-primary-500">{formatINR(customer.totalSpent)}</p>
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

function AddCustomerModal({ onClose }) {
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: { contact_name: '', company_name: '', contact_email: '', contact_phone: '', estimated_value: '' },
  })

  const mutation = useMutation({
    mutationFn: (d) => api.post('/leads', {
      title: d.company_name || d.contact_name,
      contact_name: d.contact_name,
      company_name: d.company_name || undefined,
      contact_email: d.contact_email || undefined,
      contact_phone: d.contact_phone || undefined,
      estimated_value: d.estimated_value || 0,
      status: 'won',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-won-leads'] })
      toast.success('Customer added successfully!')
      onClose()
    },
    onError: (err) => toast.error(err.message),
  })

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative glass rounded-2xl p-6 w-full max-w-md border border-app shadow-card-dark"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-heading">Add Customer</h2>
            <p className="text-xs text-muted mt-0.5">Create a new customer record</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-heading transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <Input label="Full Name" icon={User} placeholder="Jane Doe" error={errors.contact_name?.message} {...register('contact_name')} />
          <Input label="Company" icon={Building2} placeholder="Acme Inc" error={errors.company_name?.message} {...register('company_name')} />
          <Input label="Email" icon={Mail} type="email" placeholder="jane@company.com" error={errors.contact_email?.message} {...register('contact_email')} />
          <Input label="Phone" icon={Phone} placeholder="+91 98765 43210" error={errors.contact_phone?.message} {...register('contact_phone')} />
          <Input label="Total Value (Rs)" icon={DollarSign} type="number" min="0" step="1" placeholder="0" error={errors.estimated_value?.message} {...register('estimated_value')} />

          <Button type="submit" size="lg" loading={isSubmitting || mutation.isPending} className="w-full mt-2">
            Add Customer <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </motion.div>
    </div>,
    document.body
  )
}

export default function Customers() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['customers-won-leads'],
    queryFn: () => api.get('/leads', { params: { status: 'won', limit: 1000 } }),
  })

  const customers = buildCustomers(data?.data || [])

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase())
  )

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0)
  const avgValue = customers.length ? totalRevenue / customers.length : 0

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { title: 'Total Customers', value: customers.length, icon: Building2, iconColor: 'text-brand-blue', iconBg: 'bg-brand-blue/10' },
          { title: 'Total Revenue', value: formatINR(totalRevenue), icon: DollarSign, iconColor: 'text-primary-500', iconBg: 'bg-primary-500/10' },
          { title: 'Active', value: customers.length, icon: TrendingUp, iconColor: 'text-primary-500', iconBg: 'bg-primary-500/10' },
          { title: 'Avg Value', value: formatINR(avgValue), icon: TrendingUp, iconColor: 'text-brand-purple', iconBg: 'bg-brand-purple/10' },
        ].map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <StatCard {...s} loading={isLoading} />
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
        <Button size="sm" onClick={() => setShowModal(true)}><Plus className="w-3.5 h-3.5" />Add Customer</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((customer, i) => (
          <motion.div key={customer.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <CustomerCard customer={customer} />
          </motion.div>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-16">
          <p className="text-muted text-sm">Loading customers…</p>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted text-sm">No customers found</p>
        </div>
      )}

      <AnimatePresence>
        {showModal && <AddCustomerModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  )
}
