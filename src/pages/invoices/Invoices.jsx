import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, FileText, Send, Trash2, X,
  Eye, IndianRupee, CheckCircle2, XCircle, Clock, Receipt,
  MoreVertical, ChevronDown,
} from 'lucide-react'
import { Card, Badge, StatCard } from '../../components/ui'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { formatDate } from '../../utils'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

const CURRENCY_SYMBOLS = { INR: 'Rs', USD: '$', EUR: '\u20AC', GBP: '\u00A3' }
const sym = (currency) => CURRENCY_SYMBOLS[currency] || currency || 'Rs'
const money = (n, currency = 'INR') =>
  `${sym(currency)} ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0)}`

const STATUS = {
  draft: { label: 'Draft', variant: 'default', icon: FileText },
  sent: { label: 'Sent', variant: 'blue', icon: Send },
  viewed: { label: 'Viewed', variant: 'purple', icon: Eye },
  paid: { label: 'Paid', variant: 'green', icon: CheckCircle2 },
  partial: { label: 'Partial', variant: 'yellow', icon: Clock },
  overdue: { label: 'Overdue', variant: 'red', icon: XCircle },
  cancelled: { label: 'Cancelled', variant: 'red', icon: XCircle },
}

export default function Invoices() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showView, setShowView] = useState(null)
  const [showPayment, setShowPayment] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/invoices', { params: { search, status: statusFilter, limit: 100 } })
      return res
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/invoices/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Invoice deleted') },
    onError: () => toast.error('Failed to delete invoice'),
  })

  const sendMutation = useMutation({
    mutationFn: (id) => api.post(`/invoices/${id}/send`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Invoice sent') },
    onError: () => toast.error('Failed to send invoice'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => api.patch(`/invoices/${id}/cancel`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Invoice cancelled') },
    onError: () => toast.error('Failed to cancel invoice'),
  })

  const invoices = data?.data || []
  const totalRevenue = invoices.reduce((s, i) => s + (Number(i.total) || 0), 0)
  const paidAmount = invoices.reduce((s, i) => s + (Number(i.paid_amount) || 0), 0)
  const pendingAmount = invoices.reduce((s, i) => s + (Number(i.balance_due) || 0), 0)
  const overdueCount = invoices.filter(i => i.status === 'overdue').length

  const statCards = [
    { title: 'Total Invoiced', value: money(totalRevenue), icon: FileText, iconColor: 'text-brand-blue', iconBg: 'bg-brand-blue/10' },
    { title: 'Paid', value: money(paidAmount), icon: CheckCircle2, iconColor: 'text-green-400', iconBg: 'bg-green-500/10' },
    { title: 'Pending', value: money(pendingAmount), icon: Clock, iconColor: 'text-yellow-400', iconBg: 'bg-yellow-500/10' },
    { title: 'Overdue', value: overdueCount, icon: XCircle, iconColor: 'text-red-400', iconBg: 'bg-red-500/10' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-heading">Invoices</h1>
          <p className="text-sm text-muted">Manage and track your invoices</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> New Invoice
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatCard {...stat} loading={isLoading} />
          </motion.div>
        ))}
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by number, title, or lead..."
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-app bg-card text-heading placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-app bg-card text-heading text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            <option value="">All Status</option>
            {Object.entries(STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 shimmer-bg rounded-xl" />)}
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted">
            <Receipt className="w-10 h-10 mx-auto mb-3 text-muted/50" />
            <p>No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-app text-left text-muted">
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const st = STATUS[inv.status] || STATUS.draft
                  return (
                    <tr key={inv.id} className="border-b border-app/50 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-heading">{inv.invoice_number}</div>
                        <div className="text-xs text-muted truncate max-w-[150px]">{inv.title}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-body">{inv.lead?.contact_name || '—'}</div>
                        <div className="text-xs text-muted">{inv.lead?.company_name || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-body">{formatDate(inv.issue_date)}</td>
                      <td className="px-4 py-3 font-medium text-heading">{money(inv.total, inv.currency)}</td>
                      <td className="px-4 py-3 text-body">{money(inv.paid_amount, inv.currency)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <ActionsMenu items={[
                          { label: 'View', icon: <Eye className="w-3.5 h-3.5" />, onClick: () => setShowView(inv.id) },
                          ...(inv.status === 'draft' ? [{ label: 'Send', icon: <Send className="w-3.5 h-3.5" />, onClick: () => sendMutation.mutate(inv.id) }] : []),
                          ...(['draft', 'sent', 'viewed', 'partial'].includes(inv.status) && inv.balance_due > 0 ? [{ label: 'Record Payment', icon: <IndianRupee className="w-3.5 h-3.5" />, onClick: () => setShowPayment(inv) }] : []),
                          ...(!['paid', 'cancelled'].includes(inv.status) ? [{ label: 'Cancel', icon: <XCircle className="w-3.5 h-3.5" />, onClick: () => cancelMutation.mutate(inv.id) }] : []),
                          ...(user?.role === 'admin' ? [{ label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => { if (confirm('Delete this invoice?')) deleteMutation.mutate(inv.id) } }] : []),
                        ]} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showView && <InvoiceViewModal invoiceId={showView} onClose={() => setShowView(null)} />}
      {showPayment && <PaymentModal invoice={showPayment} onClose={() => setShowPayment(null)} onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setShowPayment(null) }} />}
      {showForm && <InvoiceForm onClose={() => setShowForm(false)} onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setShowForm(false) }} />}
    </div>
  )
}

function InvoiceViewModal({ invoiceId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => api.get(`/invoices/${invoiceId}`),
    enabled: !!invoiceId,
  })
  const invoice = data?.data
  if (isLoading || !invoice) {
    return (
      <Modal open={true} onClose={onClose} title="Loading..." size="lg">
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}</div>
      </Modal>
    )
  }
  const st = STATUS[invoice.status] || STATUS.draft
  const currency = invoice.currency || 'INR'
  return (
    <Modal open={true} onClose={onClose} title={invoice.invoice_number} size="lg">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-heading">{invoice.title}</h3>
            <p className="text-sm text-muted">{invoice.lead?.contact_name} — {invoice.lead?.company_name || '—'}</p>
          </div>
          <Badge variant={st.variant}>{st.label}</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div><p className="text-xs text-muted">Issue Date</p><p className="text-body">{formatDate(invoice.issue_date)}</p></div>
          <div><p className="text-xs text-muted">Due Date</p><p className="text-body">{invoice.due_date ? formatDate(invoice.due_date) : '—'}</p></div>
          <div><p className="text-xs text-muted">Contact</p><p className="text-body truncate">{invoice.lead?.contact_name || '—'}</p></div>
          <div><p className="text-xs text-muted">Created By</p><p className="text-body truncate">{invoice.creator?.name || '—'}</p></div>
        </div>

        <div className="rounded-xl border border-app overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-muted text-xs uppercase tracking-wide">
                <th className="text-left px-3 py-2 font-semibold">Item</th>
                <th className="text-right px-3 py-2 font-semibold">Qty</th>
                <th className="text-right px-3 py-2 font-semibold">Price</th>
                <th className="text-right px-3 py-2 font-semibold">Tax</th>
                <th className="text-right px-3 py-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map(it => {
                const qty = parseFloat(it.quantity) || 0
                const price = parseFloat(it.unit_price) || 0
                const taxRate = parseFloat(it.tax_rate) || 0
                const discount = parseFloat(it.discount_value) || 0
                const base = qty * price - discount
                const taxAmount = (base * taxRate) / 100
                const total = base + taxAmount
                return (
                  <tr key={it.id} className="border-t border-app">
                    <td className="px-3 py-2">
                      <p className="text-heading font-medium">{it.name}</p>
                      {it.product && <p className="text-xs text-muted">Product: {it.product.name} {it.product.code ? `(${it.product.code})` : ''}</p>}
                      {it.description && <p className="text-xs text-muted">{it.description}</p>}
                    </td>
                    <td className="px-3 py-2 text-right text-body">{Number(it.quantity)} {it.unit}</td>
                    <td className="px-3 py-2 text-right text-body">{money(it.unit_price, currency)}</td>
                    <td className="px-3 py-2 text-right text-body">{Number(it.tax_rate) || 0}%</td>
                    <td className="px-3 py-2 text-right text-heading font-medium">{money(total, currency)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-full sm:w-72 space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><span className="text-body">{money(invoice.subtotal, currency)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted">Tax</span><span className="text-body">{money(invoice.tax_amount, currency)}</span></div>
            <div className="flex justify-between pt-2 border-t border-app"><span className="font-semibold text-heading">Total</span><span className="font-bold text-primary-500">{money(invoice.total, currency)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted">Paid</span><span className="text-green-400">{money(invoice.paid_amount, currency)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted">Balance Due</span><span className="text-orange-400 font-medium">{money(invoice.balance_due, currency)}</span></div>
          </div>
        </div>

        {(invoice.notes || invoice.terms) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {invoice.notes && <div className="rounded-xl bg-white/4 p-3"><p className="text-xs font-semibold text-muted uppercase mb-1">Notes</p><p className="text-sm text-body whitespace-pre-wrap">{invoice.notes}</p></div>}
            {invoice.terms && <div className="rounded-xl bg-white/4 p-3"><p className="text-xs font-semibold text-muted uppercase mb-1">Terms</p><p className="text-sm text-body whitespace-pre-wrap">{invoice.terms}</p></div>}
          </div>
        )}
      </div>
    </Modal>
  )
}

function PaymentModal({ invoice, onClose, onSuccess }) {
  const [amount, setAmount] = useState(invoice.balance_due || 0)
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])

  const paymentMutation = useMutation({
    mutationFn: () => api.post(`/invoices/${invoice.id}/payment`, { amount: parseFloat(amount), payment_date: paymentDate }),
    onSuccess: () => { toast.success('Payment recorded'); onSuccess() },
    onError: () => toast.error('Failed to record payment'),
  })

  return (
    <Modal open={true} onClose={onClose} title="Record Payment" size="sm">
      <div className="space-y-4">
        <div className="text-sm text-muted">
          Balance due: <span className="text-heading font-medium">{money(invoice.balance_due, invoice.currency)}</span>
        </div>
        <Input label="Payment Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} min={0} max={invoice.balance_due} />
        <Input label="Payment Date" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={() => paymentMutation.mutate()} loading={paymentMutation.isPending}>Record Payment</Button>
        </div>
      </div>
    </Modal>
  )
}

function InvoiceForm({ onClose, onSuccess }) {
  const { data: leadsData } = useQuery({
    queryKey: ['leads-all'],
    queryFn: async () => {
      const res = await api.get('/leads', { params: { limit: 100 } })
      return res
    },
  })
  const { data: purchaseItemsData } = useQuery({
    queryKey: ['purchase-items-all'],
    queryFn: async () => {
      const res = await api.get('/purchases/items')
      return res
    },
  })

  const leads = leadsData?.data || []
  const purchaseItems = purchaseItemsData?.data || []
  const [leadId, setLeadId] = useState('')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ product_id: '', name: '', quantity: 1, unit_price: 0, tax_rate: 18, discount_value: 0 }])
  const [openLeadDropdown, setOpenLeadDropdown] = useState(false)
  const [openDropdownIdx, setOpenDropdownIdx] = useState(null)

  const addItem = () => {
    setItems([...items, { product_id: '', name: '', quantity: 1, unit_price: 0, tax_rate: 18, discount_value: 0 }])
  }

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx))
  }

  const updateItem = (idx, field, value) => {
    const updated = [...items]
    updated[idx] = { ...updated[idx], [field]: value }
    setItems(updated)
  }

  const selectLead = (lead) => {
    setLeadId(lead.id)
    setTitle(lead.title || '')
    setOpenLeadDropdown(false)
  }

  const selectInvoiceItem = (idx, item) => {
    const updated = [...items]
    updated[idx] = {
      ...updated[idx],
      product_id: item.product_id || '',
      name: item.name,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate || 18,
      quantity: 1,
    }
    setItems(updated)
    setOpenDropdownIdx(null)
  }

  const selectedLead = leads.find(l => l.id === parseInt(leadId))

  const computed = items.map(it => {
    const qty = parseFloat(it.quantity) || 0
    const price = parseFloat(it.unit_price) || 0
    const taxRate = parseFloat(it.tax_rate) || 0
    const discount = parseFloat(it.discount_value) || 0
    const base = qty * price - discount
    const taxAmount = (base * taxRate) / 100
    return { base, taxAmount, total: base + taxAmount }
  })

  const subtotal = computed.reduce((s, c) => s + c.base, 0)
  const taxAmount = computed.reduce((s, c) => s + c.taxAmount, 0)
  const total = subtotal + taxAmount

  const createMutation = useMutation({
    mutationFn: () => api.post('/invoices', {
      lead_id: parseInt(leadId),
      title,
      due_date: dueDate || undefined,
      notes,
      items: items.filter(i => i.name),
    }),
    onSuccess: () => { toast.success('Invoice created'); onSuccess() },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create invoice'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!leadId || !title) {
      toast.error('Lead and title are required')
      return
    }
    if (items.filter(i => i.name).length === 0) {
      toast.error('Add at least one item')
      return
    }
    createMutation.mutate()
  }

  return (
    <Modal open={true} onClose={onClose} title="New Invoice" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="text-sm font-medium text-heading mb-1 block">Lead *</label>
            <button
              type="button"
              onClick={() => setOpenLeadDropdown(!openLeadDropdown)}
              className="w-full h-9 px-3 rounded-xl border border-app bg-card text-heading text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 flex items-center justify-between hover:border-primary-500/50 transition-colors"
            >
              <span className="truncate">{selectedLead ? `${selectedLead.contact_name} — ${selectedLead.company_name || selectedLead.title}` : 'Select lead'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${openLeadDropdown ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openLeadDropdown && (
                <motion.ul
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-1 z-40 max-h-48 overflow-y-auto rounded-xl bg-sidebar border border-app shadow-card-dark py-1"
                >
                  {leads.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-muted">No leads found</li>
                  ) : (
                    leads.map((l) => (
                      <li key={l.id}>
                        <button
                          type="button"
                          onClick={() => selectLead(l)}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-white/5 text-body hover:text-heading transition-colors"
                        >
                          <span className="truncate">{l.contact_name}</span>
                          <span className="text-xs text-muted ml-2">{l.company_name || l.title}</span>
                        </button>
                      </li>
                    ))
                  )}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          <Input label="Title *" value={title} onChange={e => setTitle(e.target.value)} placeholder="Invoice title" required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Due Date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-heading">Line Items</label>
            <Button type="button" variant="secondary" size="xs" onClick={addItem}>
              <Plus className="w-3 h-3" /> Add Item
            </Button>
          </div>
          <div className="border border-app rounded-xl overflow-x-auto overflow-y-visible">
            <table className="w-full text-sm" style={{ overflow: 'visible' }}>
              <thead>
                <tr className="border-b border-app text-muted">
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-right w-20">Qty</th>
                  <th className="px-3 py-2 text-right w-24">Price</th>
                  <th className="px-3 py-2 text-right w-20">Tax %</th>
                  <th className="px-3 py-2 text-right w-28">Total</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const c = computed[idx] || { total: 0 }
                  return (
                    <tr key={idx} className="border-b border-app/50">
                      <td className="px-3 py-2">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenDropdownIdx(openDropdownIdx === idx ? null : idx)}
                            className="w-full h-8 px-2 rounded-lg border border-app bg-card text-heading text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/30 flex items-center justify-between hover:border-primary-500/50 transition-colors"
                          >
                            <span className="truncate">{it.name || 'Select item'}</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${openDropdownIdx === idx ? 'rotate-180' : ''}`} />
                          </button>
                              <AnimatePresence>
                                {openDropdownIdx === idx && (
                                  <motion.ul
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 right-0 top-full mt-1 z-[100] max-h-48 overflow-y-auto rounded-xl bg-sidebar border border-app shadow-card-dark py-1"
                                  >
                                    {purchaseItems.length === 0 ? (
                                      <li className="px-3 py-2 text-sm text-muted">No items found</li>
                                    ) : (
                                      purchaseItems.map((item, ii) => (
                                        <li key={ii}>
                                          <button
                                            type="button"
                                            onClick={() => selectInvoiceItem(idx, item)}
                                            className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-white/5 text-body hover:text-heading transition-colors"
                                          >
                                            <span className="truncate">{item.name}</span>
                                            <span className="text-xs text-muted ml-2">{money(item.unit_price)}</span>
                                          </button>
                                        </li>
                                      ))
                                    )}
                                  </motion.ul>
                                )}
                              </AnimatePresence>
                        </div>
                        {!it.product_id && (
                          <input
                            value={it.name}
                            onChange={e => updateItem(idx, 'name', e.target.value)}
                            onFocus={() => setOpenDropdownIdx(null)}
                            placeholder="Or type item name"
                            className="w-full h-8 mt-1 px-2 rounded-lg border border-app bg-card text-heading text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/30"
                          />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={it.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} min={0} className="w-full h-8 px-2 rounded-lg border border-app bg-card text-heading text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-500/30" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={it.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} min={0} step="0.01" className="w-full h-8 px-2 rounded-lg border border-app bg-card text-heading text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-500/30" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={it.tax_rate} onChange={e => updateItem(idx, 'tax_rate', e.target.value)} min={0} className="w-full h-8 px-2 rounded-lg border border-app bg-card text-heading text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-500/30" />
                      </td>
                      <td className="px-3 py-2 text-right text-heading font-medium">{money(c.total)}</td>
                      <td className="px-3 py-2">
                        {items.length > 1 && (
                          <button type="button" onClick={() => removeItem(idx)} className="p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between text-muted"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between text-muted"><span>Tax</span><span>{money(taxAmount)}</span></div>
            <div className="flex justify-between text-heading font-bold text-base border-t border-app pt-1"><span>Total</span><span>{money(total)}</span></div>
          </div>
        </div>

        <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes" />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" loading={createMutation.isPending}>Create Invoice</Button>
        </div>
      </form>
    </Modal>
  )
}

function ActionsMenu({ items, up = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }} className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-heading transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ opacity: 0, y: up ? 6 : -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: up ? 6 : -6 }} transition={{ duration: 0.15 }}
            className={`absolute right-0 z-30 w-48 rounded-xl bg-sidebar border border-app shadow-card-dark py-1 ${up ? 'bottom-full mb-1' : 'mt-1'}`}>
            {items.map((it, i) => (
              <li key={i}>
                <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(false); it.onClick() }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-white/5 ${it.danger ? 'text-red-400' : 'text-body hover:text-heading'}`}>
                  {it.icon}{it.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
