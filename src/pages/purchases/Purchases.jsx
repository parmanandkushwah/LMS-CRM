import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Truck, Trash2,
  Eye, IndianRupee, CheckCircle2, XCircle, Clock, FileText, X,
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
  received: { label: 'Received', variant: 'blue', icon: Truck },
  paid: { label: 'Paid', variant: 'green', icon: CheckCircle2 },
  partially_paid: { label: 'Partial', variant: 'yellow', icon: Clock },
  cancelled: { label: 'Cancelled', variant: 'red', icon: XCircle },
}

const PAYMENT_STATUS = {
  unpaid: { label: 'Unpaid', variant: 'red' },
  partial: { label: 'Partial', variant: 'yellow' },
  paid: { label: 'Paid', variant: 'green' },
}

export default function Purchases() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showView, setShowView] = useState(null)
  const [showPayment, setShowPayment] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/purchases', { params: { search, status: statusFilter, limit: 100 } })
      return res
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/purchases/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchases'] }); toast.success('Purchase deleted') },
    onError: () => toast.error('Failed to delete purchase'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => api.patch(`/purchases/${id}/cancel`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchases'] }); toast.success('Purchase cancelled') },
    onError: () => toast.error('Failed to cancel purchase'),
  })

  const purchases = data?.data || []
  const totalPurchases = purchases.reduce((s, p) => s + (Number(p.total) || 0), 0)
  const paidAmount = purchases.reduce((s, p) => s + (Number(p.paid_amount) || 0), 0)
  const pendingAmount = purchases.reduce((s, p) => s + (Number(p.balance_due) || 0), 0)
  const unpaidCount = purchases.filter(p => p.payment_status === 'unpaid').length

  const statCards = [
    { title: 'Total Purchases', value: money(totalPurchases), icon: Truck, iconColor: 'text-brand-blue', iconBg: 'bg-brand-blue/10' },
    { title: 'Paid', value: money(paidAmount), icon: CheckCircle2, iconColor: 'text-green-400', iconBg: 'bg-green-500/10' },
    { title: 'Pending', value: money(pendingAmount), icon: Clock, iconColor: 'text-yellow-400', iconBg: 'bg-yellow-500/10' },
    { title: 'Unpaid', value: unpaidCount, icon: XCircle, iconColor: 'text-red-400', iconBg: 'bg-red-500/10' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-heading">Purchases</h1>
          <p className="text-sm text-muted">Manage purchases from suppliers</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> New Purchase
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
              placeholder="Search by supplier or bill number..."
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
        ) : purchases.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted">
            <Truck className="w-10 h-10 mx-auto mb-3 text-muted/50" />
            <p>No purchases found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-app text-left text-muted">
                  <th className="px-4 py-3 font-medium">Bill</th>
                  <th className="px-4 py-3 font-medium">Supplier</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => {
                  const st = STATUS[p.status] || STATUS.draft
                  const ps = PAYMENT_STATUS[p.payment_status] || PAYMENT_STATUS.unpaid
                  return (
                    <tr key={p.id} className="border-b border-app/50 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-heading">{p.bill_number}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-body">{p.supplier_name}</div>
                        {p.supplier_gstin && <div className="text-xs text-muted">GSTIN: {p.supplier_gstin}</div>}
                      </td>
                      <td className="px-4 py-3 text-body">{formatDate(p.bill_date)}</td>
                      <td className="px-4 py-3 font-medium text-heading">{money(p.total, p.currency)}</td>
                      <td className="px-4 py-3 text-body">{money(p.paid_amount, p.currency)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ps.variant}>{ps.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <ActionsMenu items={[
                          { label: 'View', icon: <Eye className="w-3.5 h-3.5" />, onClick: () => setShowView(p.id) },
                          ...(['draft', 'received', 'partially_paid'].includes(p.status) && p.balance_due > 0 ? [{ label: 'Record Payment', icon: <IndianRupee className="w-3.5 h-3.5" />, onClick: () => setShowPayment(p) }] : []),
                          ...(!['paid', 'cancelled'].includes(p.status) ? [{ label: 'Cancel', icon: <XCircle className="w-3.5 h-3.5" />, onClick: () => cancelMutation.mutate(p.id) }] : []),
                          ...(user?.role === 'admin' ? [{ label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => { if (confirm('Delete this purchase?')) deleteMutation.mutate(p.id) } }] : []),
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

      {showView && <PurchaseViewModal purchaseId={showView} onClose={() => setShowView(null)} />}
      {showPayment && <PurchasePaymentModal purchase={showPayment} onClose={() => setShowPayment(null)} onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['purchases'] }); setShowPayment(null) }} />}
      {showForm && <PurchaseForm onClose={() => setShowForm(false)} onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['purchases'] }); setShowForm(false) }} />}
    </div>
  )
}

function PurchaseViewModal({ purchaseId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['purchase', purchaseId],
    queryFn: () => api.get(`/purchases/${purchaseId}`),
    enabled: !!purchaseId,
  })
  const purchase = data?.data
  if (isLoading || !purchase) {
    return (
      <Modal open={true} onClose={onClose} title="Loading..." size="lg">
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}</div>
      </Modal>
    )
  }
  const st = STATUS[purchase.status] || STATUS.draft
  const ps = PAYMENT_STATUS[purchase.payment_status] || PAYMENT_STATUS.unpaid
  const currency = purchase.currency || 'INR'
  return (
    <Modal open={true} onClose={onClose} title={purchase.bill_number} size="lg">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-heading">{purchase.supplier_name}</h3>
            {purchase.supplier_gstin && <p className="text-sm text-muted">GSTIN: {purchase.supplier_gstin}</p>}
            {purchase.supplier_address && <p className="text-sm text-muted">{purchase.supplier_address}</p>}
          </div>
          <Badge variant={st.variant}>{st.label}</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div><p className="text-xs text-muted">Bill Date</p><p className="text-body">{formatDate(purchase.bill_date)}</p></div>
          <div><p className="text-xs text-muted">Due Date</p><p className="text-body">{purchase.due_date ? formatDate(purchase.due_date) : '—'}</p></div>
          <div><p className="text-xs text-muted">Payment</p><p className="text-body"><Badge variant={ps.variant}>{ps.label}</Badge></p></div>
          <div><p className="text-xs text-muted">Created By</p><p className="text-body truncate">{purchase.creator?.name || '—'}</p></div>
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
              {(purchase.items || []).map(it => {
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
                      {it.hsn_code && <p className="text-xs text-muted">HSN: {it.hsn_code}</p>}
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
            <div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><span className="text-body">{money(purchase.subtotal, currency)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted">Tax</span><span className="text-body">{money(purchase.tax_amount, currency)}</span></div>
            <div className="flex justify-between pt-2 border-t border-app"><span className="font-semibold text-heading">Total</span><span className="font-bold text-primary-500">{money(purchase.total, currency)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted">Paid</span><span className="text-green-400">{money(purchase.paid_amount, currency)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted">Balance Due</span><span className="text-orange-400 font-medium">{money(purchase.balance_due, currency)}</span></div>
          </div>
        </div>

        {(purchase.notes) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {purchase.notes && <div className="rounded-xl bg-white/4 p-3"><p className="text-xs font-semibold text-muted uppercase mb-1">Notes</p><p className="text-sm text-body whitespace-pre-wrap">{purchase.notes}</p></div>}
          </div>
        )}
      </div>
    </Modal>
  )
}

function PurchasePaymentModal({ purchase, onClose, onSuccess }) {
  const [amount, setAmount] = useState(purchase.balance_due || 0)
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])

  const paymentMutation = useMutation({
    mutationFn: () => api.post(`/purchases/${purchase.id}/payment`, { amount: parseFloat(amount), payment_date: paymentDate }),
    onSuccess: () => { toast.success('Payment recorded'); onSuccess() },
    onError: () => toast.error('Failed to record payment'),
  })

  return (
    <Modal open={true} onClose={onClose} title="Record Payment" size="sm">
      <div className="space-y-4">
        <div className="text-sm text-muted">
          Balance due: <span className="text-heading font-medium">{money(purchase.balance_due, purchase.currency)}</span>
        </div>
        <Input label="Payment Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} min={0} max={purchase.balance_due} />
        <Input label="Payment Date" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={() => paymentMutation.mutate()} loading={paymentMutation.isPending}>Record Payment</Button>
        </div>
      </div>
    </Modal>
  )
}

function PurchaseForm({ onClose, onSuccess }) {
  const { data: purchaseItemsData } = useQuery({
    queryKey: ['purchase-items-all'],
    queryFn: async () => {
      const res = await api.get('/purchases/items')
      return res
    },
  })

  const purchaseItems = purchaseItemsData?.data || []
  const [supplierName, setSupplierName] = useState('')
  const [supplierGstin, setSupplierGstin] = useState('')
  const [supplierAddress, setSupplierAddress] = useState('')
  const [billNumber, setBillNumber] = useState('')
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ product_id: '', name: '', quantity: 1, unit_price: 0, tax_rate: 18, discount_value: 0 }])
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

  const selectPurchaseItem = (idx, pItem) => {
    const updated = [...items]
    updated[idx] = {
      ...updated[idx],
      product_id: pItem.product_id || '',
      name: pItem.name,
      unit_price: pItem.unit_price,
      tax_rate: pItem.tax_rate || 18,
      quantity: 1,
    }
    setItems(updated)
    setOpenDropdownIdx(null)
  }

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
    mutationFn: () => api.post('/purchases', {
      supplier_name: supplierName,
      supplier_gstin: supplierGstin,
      supplier_address: supplierAddress,
      bill_number: billNumber,
      bill_date: billDate,
      due_date: dueDate || undefined,
      notes,
      items: items.filter(i => i.name),
    }),
    onSuccess: () => { toast.success('Purchase created'); onSuccess() },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create purchase'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!supplierName || !billNumber) {
      toast.error('Supplier name and bill number are required')
      return
    }
    if (items.filter(i => i.name).length === 0) {
      toast.error('Add at least one item')
      return
    }
    createMutation.mutate()
  }

  return (
    <Modal open={true} onClose={onClose} title="New Purchase" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Supplier Name *" value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="Enter supplier name" required />
          <Input label="Supplier GSTIN" value={supplierGstin} onChange={e => setSupplierGstin(e.target.value)} placeholder="e.g. 27AABCT1234F1ZH" />
        </div>
        <Input label="Supplier Address" value={supplierAddress} onChange={e => setSupplierAddress(e.target.value)} placeholder="Enter supplier address" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Bill Number *" value={billNumber} onChange={e => setBillNumber(e.target.value)} placeholder="e.g. BILL-001" required />
          <Input label="Bill Date *" type="date" value={billDate} onChange={e => setBillDate(e.target.value)} required />
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
                                  purchaseItems.map((pItem, pi) => (
                                    <li key={pi}>
                                      <button
                                        type="button"
                                        onClick={() => selectPurchaseItem(idx, pItem)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-white/5 text-body hover:text-heading transition-colors"
                                      >
                                        <span className="truncate">{pItem.name}</span>
                                        <span className="text-xs text-muted ml-2">{money(pItem.unit_price)}</span>
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
          <Button type="submit" variant="primary" size="sm" loading={createMutation.isPending}>Create Purchase</Button>
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
