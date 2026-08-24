import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  IndianRupee, TrendingUp, Truck, Receipt,
  ArrowUpRight, ArrowDownRight, Calendar,
} from 'lucide-react'
import { Card, StatCard } from '../../components/ui'
import Button from '../../components/ui/Button'
import { cn, formatDate } from '../../utils'
import api from '../../services/api'

const money = (n) => `Rs ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(n) || 0)}`

export default function FinancialReports() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['financial-reports', from, to],
    queryFn: async () => {
      const res = await api.get('/financial-reports/summary', { params: { from, to } })
      return res
    },
  })

  const summary = data?.data || {
    sales: { total: 0, tax: 0, paid: 0, pending: 0, count: 0 },
    purchases: { total: 0, tax: 0, paid: 0, pending: 0, count: 0 },
    gst: { output: 0, input: 0, net: 0, payable: 0, credit: 0 },
    profit: { gross: 0, net: 0 },
    monthly: { sales: [], purchases: [] },
  }

  const kpis = [
    { title: 'Total Sales (Paid)', value: money(summary.sales.total), subtitle: `${summary.sales.count} paid invoices`, icon: TrendingUp, iconColor: 'text-green-400', iconBg: 'bg-green-500/10' },
    { title: 'Total Purchases', value: money(summary.purchases.total), subtitle: `${summary.purchases.count} bills`, icon: Truck, iconColor: 'text-blue-400', iconBg: 'bg-blue-500/10' },
    { title: 'Gross Profit', value: money(summary.profit.gross), subtitle: 'Sales - Purchases', icon: IndianRupee, iconColor: 'text-primary-500', iconBg: 'bg-primary-500/10' },
    { title: 'Net GST', value: money(Math.abs(summary.gst.net)), subtitle: summary.gst.net >= 0 ? 'Payable to govt' : 'Carry forward credit', icon: summary.gst.net >= 0 ? ArrowUpRight : ArrowDownRight, iconColor: summary.gst.net >= 0 ? 'text-red-400' : 'text-green-400', iconBg: summary.gst.net >= 0 ? 'bg-red-500/10' : 'bg-green-500/10' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-heading">Financial Reports</h1>
          <p className="text-sm text-muted">Tally-style purchase & sales register with GST</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted" />
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 px-2 rounded-lg border border-app bg-card text-heading text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
            <span className="text-muted text-sm">to</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-9 px-2 rounded-lg border border-app bg-card text-heading text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
          </div>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>Apply</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
        {kpis.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatCard {...stat} loading={isLoading} />
          </motion.div>
        ))}
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-heading mb-4">GST Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-green-500/10">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
            <span className="text-xs text-muted">Output GST (Paid Sales)</span>
        </div>
        <p className="text-xl font-bold text-green-400">{money(summary.gst.output)}</p>
        <p className="text-xs text-muted mt-1">GST collected from paid invoices</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <Truck className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs text-muted">Input GST (Purchases)</span>
            </div>
            <p className="text-xl font-bold text-blue-400">{money(summary.gst.input)}</p>
            <p className="text-xs text-muted mt-1">GST paid to suppliers (credit)</p>
          </div>
          <div className={cn('p-4 rounded-xl border', summary.gst.net >= 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20')}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('p-1.5 rounded-lg', summary.gst.net >= 0 ? 'bg-red-500/10' : 'bg-emerald-500/10')}>
                {summary.gst.net >= 0 ? <ArrowUpRight className="w-4 h-4 text-red-400" /> : <ArrowDownRight className="w-4 h-4 text-emerald-400" />}
              </div>
              <span className="text-xs text-muted">Net GST</span>
            </div>
            <p className={cn('text-xl font-bold', summary.gst.net >= 0 ? 'text-red-400' : 'text-emerald-400')}>
              {summary.gst.net >= 0 ? '+' : '-'}{money(Math.abs(summary.gst.net))}
            </p>
            <p className="text-xs text-muted mt-1">{summary.gst.net >= 0 ? 'Payable to government' : 'Carry forward credit'}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SalesRegister from={from} to={to} loading={isLoading} />
        <PurchaseRegister from={from} to={to} loading={isLoading} />
      </div>
    </div>
  )
}

function SalesRegister({ from, to, loading }) {
  const { data } = useQuery({
    queryKey: ['sales-register', from, to],
    queryFn: async () => {
      const res = await api.get('/financial-reports/sales-register', { params: { from, to } })
      return res
    },
  })

  const sales = data?.data || []

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-heading">Sales Register</h3>
          <p className="text-xs text-muted">Invoices issued to customers</p>
        </div>
        <Receipt className="w-4 h-4 text-muted" />
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 shimmer-bg rounded-lg" />)}
        </div>
      ) : sales.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted">No sales data for this period</div>
      ) : (
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-app text-muted text-left">
                <th className="px-3 py-2 font-medium">Invoice</th>
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium text-right">Amount</th>
                <th className="px-3 py-2 font-medium text-right">Tax</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id} className="border-b border-app/50 hover:bg-white/5">
                  <td className="px-3 py-2 font-medium text-heading">{s.invoice_number}</td>
                  <td className="px-3 py-2 text-body">{s.lead_name}</td>
                  <td className="px-3 py-2 text-body">{formatDate(s.date)}</td>
                  <td className="px-3 py-2 text-right text-heading font-medium">{money(s.total)}</td>
                  <td className="px-3 py-2 text-right text-body">{money(s.tax_amount)}</td>
                  <td className="px-3 py-2">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', s.status === 'paid' ? 'bg-green-500/10 text-green-400' : s.status === 'overdue' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400')}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function PurchaseRegister({ from, to, loading }) {
  const { data } = useQuery({
    queryKey: ['purchase-register', from, to],
    queryFn: async () => {
      const res = await api.get('/financial-reports/purchase-register', { params: { from, to } })
      return res
    },
  })

  const purchases = data?.data || []

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-heading">Purchase Register</h3>
          <p className="text-xs text-muted">Bills received from suppliers</p>
        </div>
        <Truck className="w-4 h-4 text-muted" />
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 shimmer-bg rounded-lg" />)}
        </div>
      ) : purchases.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted">No purchase data for this period</div>
      ) : (
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-app text-muted text-left">
                <th className="px-3 py-2 font-medium">Bill</th>
                <th className="px-3 py-2 font-medium">Supplier</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium text-right">Amount</th>
                <th className="px-3 py-2 font-medium text-right">Tax</th>
                <th className="px-3 py-2 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id} className="border-b border-app/50 hover:bg-white/5">
                  <td className="px-3 py-2 font-medium text-heading">{p.bill_number}</td>
                  <td className="px-3 py-2 text-body">{p.supplier}</td>
                  <td className="px-3 py-2 text-body">{formatDate(p.date)}</td>
                  <td className="px-3 py-2 text-right text-heading font-medium">{money(p.total)}</td>
                  <td className="px-3 py-2 text-right text-body">{money(p.tax_amount)}</td>
                  <td className="px-3 py-2">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', p.payment_status === 'paid' ? 'bg-green-500/10 text-green-400' : p.payment_status === 'partial' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400')}>
                      {p.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
