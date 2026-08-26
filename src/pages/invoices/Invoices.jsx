import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, FileText, Send, Trash2, X,
  Eye, IndianRupee, CheckCircle2, XCircle, Clock, Receipt,
  MoreVertical, ChevronDown, Download,
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
  const [activeTab, setActiveTab] = useState('invoices')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showView, setShowView] = useState(null)
  const [showPayment, setShowPayment] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showNonGst, setShowNonGst] = useState(false)

  const openNonGstBill = () => setShowNonGst(true)

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/invoices', { params: { search, status: statusFilter, limit: 100 } })
      return res
    },
    enabled: activeTab === 'invoices',
  })

  const { data: nonGstData, isLoading: nonGstLoading } = useQuery({
    queryKey: ['non-gst-bills', search],
    queryFn: async () => {
      const res = await api.get('/non-gst-bills', { params: { search, limit: 100 } })
      return res
    },
    enabled: activeTab === 'non-gst',
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/invoices/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Invoice deleted') },
    onError: () => toast.error('Failed to delete invoice'),
  })

  const deleteNonGstMutation = useMutation({
    mutationFn: (id) => api.delete(`/non-gst-bills/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['non-gst-bills'] }); toast.success('Bill deleted') },
    onError: () => toast.error('Failed to delete bill'),
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
  const nonGstBills = nonGstData?.data || []
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

  const TABS = [
    { id: 'invoices', label: 'Invoices' },
    { id: 'non-gst', label: 'Non-GST Bills' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-heading">Invoices</h1>
          <p className="text-sm text-muted">Manage and track your invoices</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'non-gst' && (
            <Button variant="primary" size="sm" onClick={openNonGstBill}>
              <Plus className="w-4 h-4" /> New Bill
            </Button>
          )}
          {activeTab === 'invoices' && (
            <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" /> New Invoice
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-card rounded-xl border border-app w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearch('') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-primary-500 text-white' : 'text-muted hover:text-heading'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'invoices' && (
        <>
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
                              { label: 'Download PDF', icon: <Download className="w-3.5 h-3.5" />, onClick: () => downloadInvoicePDF(inv) },
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
        </>
      )}

      {activeTab === 'non-gst' && (
        <Card>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by bill number, customer name, or mobile..."
                className="w-full h-9 pl-9 pr-4 rounded-xl border border-app bg-card text-heading placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
          </div>

          {nonGstLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 shimmer-bg rounded-xl" />)}
            </div>
          ) : nonGstBills.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted">
              <FileText className="w-10 h-10 mx-auto mb-3 text-muted/50" />
              <p>No non-GST bills found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-app text-left text-muted">
                    <th className="px-4 py-3 font-medium">Bill #</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Mobile</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {nonGstBills.map(bill => (
                    <tr key={bill.id} className="border-b border-app/50 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-heading">{bill.bill_number}</td>
                      <td className="px-4 py-3">
                        <div className="text-body">{bill.customer_name}</div>
                        {bill.customer_address && <div className="text-xs text-muted truncate max-w-[150px]">{bill.customer_address}</div>}
                      </td>
                      <td className="px-4 py-3 text-body">{bill.customer_mobile || '—'}</td>
                      <td className="px-4 py-3 text-body">{formatDate(bill.bill_date)}</td>
                      <td className="px-4 py-3 font-medium text-heading">{money(bill.total_amount)}</td>
                      <td className="px-4 py-3">
                        <ActionsMenu items={[
                          { label: 'View & Print', icon: <Eye className="w-3.5 h-3.5" />, onClick: () => downloadNonGstBillPDF(bill) },
                          ...(user?.role === 'admin' ? [{ label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => { if (confirm('Delete this bill?')) deleteNonGstMutation.mutate(bill.id) } }] : []),
                        ]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {showView && <InvoiceViewModal invoiceId={showView} onClose={() => setShowView(null)} />}
      {showPayment && <PaymentModal invoice={showPayment} onClose={() => setShowPayment(null)} onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setShowPayment(null) }} />}
      {showForm && <InvoiceForm onClose={() => setShowForm(false)} onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setShowForm(false) }} />}
      {showNonGst && <NonGstBillModal onClose={() => setShowNonGst(false)} onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['non-gst-bills'] }); setShowNonGst(false) }} />}
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="xs" onClick={() => downloadInvoicePDF(invoice)}>
              <Download className="w-3.5 h-3.5" /> Download
            </Button>
            <Badge variant={st.variant}>{st.label}</Badge>
          </div>
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

function NonGstBillModal({ onClose, onSuccess }) {
  const queryClient = useQueryClient()
  const fmt = (n) => `Rs ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(Number(n) || 0)}`
  const { data: settingsData } = useQuery({
    queryKey: ['settings', 'non-gst'],
    queryFn: () => api.get('/settings/non-gst'),
  })
  const company = settingsData?.data || {}

  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerMobile, setCustomerMobile] = useState('')
  const [items, setItems] = useState([{ name: '', quantity: 1, rate: 0, amount: 0 }])
  const [savedBill, setSavedBill] = useState(null)

  const addItem = () => setItems([...items, { name: '', quantity: 1, rate: 0, amount: 0 }])
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx))

  const updateItem = (idx, field, value) => {
    const updated = [...items]
    updated[idx] = { ...updated[idx], [field]: value }
    const qty = parseFloat(updated[idx].quantity) || 0
    const rate = parseFloat(updated[idx].rate) || 0
    updated[idx].amount = qty * rate
    setItems(updated)
  }

  const totalAmount = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/non-gst-bills', data)
      return res.data || res
    },
    onSuccess: (data) => {
      setSavedBill(data.data)
      toast.success('Bill saved!')
    },
    onError: (err) => toast.error(err.message || 'Failed to save bill'),
  })

  const handleSave = () => {
    if (!customerName) { toast.error('Please enter customer name'); return }
    if (items.filter(i => i.name).length === 0) { toast.error('Please add at least one item'); return }
    saveMutation.mutate({
      customer_name: customerName,
      customer_address: customerAddress,
      customer_mobile: customerMobile,
      items: items.filter(i => i.name),
      total_amount: totalAmount,
    })
  }

  const handleSaveAndGenerate = async () => {
    if (!customerName) { toast.error('Please enter customer name'); return }
    if (items.filter(i => i.name).length === 0) { toast.error('Please add at least one item'); return }
    try {
      const res = await api.post('/non-gst-bills', {
        customer_name: customerName,
        customer_address: customerAddress,
        customer_mobile: customerMobile,
        items: items.filter(i => i.name),
        total_amount: totalAmount,
      })
      const bill = res.data?.data || res.data
      setSavedBill(bill)
      toast.success('Bill saved!')
      generatePDF(bill)
      if (onSuccess) onSuccess()
      queryClient.invalidateQueries({ queryKey: ['non-gst-bills'] })
    } catch (err) {
      toast.error(err.message || 'Failed to save bill')
    }
  }

  const generatePDF = (bill = savedBill) => {
    const billNumber = bill?.bill_number || `BILL-${Date.now().toString().slice(-6)}`
    const billDate = bill?.bill_date ? new Date(bill.bill_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' } ) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

    const rows = items.filter(i => i.name).map((it, i) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0">${i + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0"><strong>${it.name}</strong></td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${it.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${fmt(it.rate)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">${fmt(it.amount)}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bill</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;padding:40px;font-size:14px;background:#fff}
      .header{text-align:center;border-bottom:3px solid #0ea5e9;padding-bottom:20px;margin-bottom:28px}
      .header h1{font-size:28px;font-weight:800;color:#0ea5e9;margin-bottom:4px}
      .header p{font-size:13px;color:#64748b;margin:2px 0}
      .customer{display:flex;justify-content:space-between;margin-bottom:28px;padding:16px;background:#f8fafc;border-radius:12px}
      .customer div{max-width:48%}
      .customer h4{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:6px}
      .customer p{font-size:13px;margin:2px 0}
      .customer .name{font-weight:700;color:#0f172a;font-size:15px}
      table{width:100%;border-collapse:collapse;margin-bottom:24px}
      th{background:#f1f5f9;text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#475569;font-weight:600}
      th.r{text-align:right}th.c{text-align:center}
      .total-row{display:flex;justify-content:flex-end;margin-top:16px}
      .total-box{background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#fff;padding:16px 24px;border-radius:12px;min-width:200px;text-align:right}
      .total-box p{font-size:12px;opacity:.9}
      .total-box h2{font-size:24px;font-weight:800;margin-top:4px}
      .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:12px}
      @media print{body{padding:20px}}
    </style></head><body>
    <div class="header">
      <h1>${company.name || 'My Business'}</h1>
      ${company.address ? `<p>${company.address}</p>` : ''}
      ${company.phone ? `<p>Phone: ${company.phone}${company.mobile ? ` | Mobile: ${company.mobile}` : ''}</p>` : ''}
      ${company.email ? `<p>${company.email}</p>` : ''}
    </div>
    <div class="customer">
      <div>
        <h4>Bill To</h4>
        <p class="name">${customerName}</p>
        ${customerMobile ? `<p>Mobile: ${customerMobile}</p>` : ''}
        ${customerAddress ? `<p>${customerAddress}</p>` : ''}
      </div>
      <div style="text-align:right">
        <h4>Bill Details</h4>
        <p>Date: ${billDate}</p>
        <p>Bill #: ${billNumber}</p>
      </div>
    </div>
    <table>
      <thead><tr>
        <th>#</th><th>Item</th><th class="c">Qty</th><th class="r">Rate</th><th class="r">Amount</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="total-row">
      <div class="total-box">
        <p>Total Amount</p>
        <h2>${fmt(totalAmount)}</h2>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for your business!</p>
      <p><strong>${company.name || 'My Business'}</strong></p>
    </div>
    </body></html>`

    const w = window.open('', '_blank', 'width=900,height=1000')
    if (!w) { toast.error('Please allow pop-ups to download'); return }
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => { try { w.print() } catch {} }, 500)
  }

  return (
    <Modal open={true} onClose={onClose} title="Non-GST Bill" size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="p-4 rounded-xl bg-white/3 border border-app">
          <h4 className="text-sm font-semibold text-heading mb-3">Customer Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Customer Name *" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter customer name" />
            <Input label="Mobile No" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} placeholder="Mobile number" />
            <div className="sm:col-span-2"><Input label="Address" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Customer address" /></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-heading">Items</label>
            <Button type="button" variant="secondary" size="xs" onClick={addItem}>
              <Plus className="w-3 h-3" /> Add Item
            </Button>
          </div>
          <div className="border border-app rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-app text-muted">
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-center w-20">Qty</th>
                  <th className="px-3 py-2 text-right w-24">Rate</th>
                  <th className="px-3 py-2 text-right w-28">Amount</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} className="border-b border-app/50">
                    <td className="px-3 py-2">
                      <input value={it.name} onChange={e => updateItem(idx, 'name', e.target.value)} placeholder="Item name" className="w-full h-8 px-2 rounded-lg border border-app bg-card text-heading text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/30" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={it.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} min={0} className="w-full h-8 px-2 rounded-lg border border-app bg-card text-heading text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary-500/30" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={it.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} min={0} step="0.01" className="w-full h-8 px-2 rounded-lg border border-app bg-card text-heading text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-500/30" />
                    </td>
                    <td className="px-3 py-2 text-right text-heading font-medium">{fmt(it.amount)}</td>
                    <td className="px-3 py-2">
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
          <span className="text-sm font-medium text-heading">Total Amount</span>
          <span className="text-xl font-bold text-primary-500">{fmt(totalAmount)}</span>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : 'Save'}</Button>
          <Button variant="primary" size="sm" onClick={handleSaveAndGenerate}>Save & Generate</Button>
        </div>
      </div>
    </Modal>
  )
}

function downloadNonGstBillPDF(bill) {
  const fmt = (n) => `Rs ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(Number(n) || 0)}`
  const billDate = bill.bill_date ? new Date(bill.bill_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  const rows = (bill.items || []).map((it, i) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0">${i + 1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0"><strong>${it.name}</strong></td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${it.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${fmt(it.rate)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">${fmt(it.amount)}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bill</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;padding:40px;font-size:14px;background:#fff}
    .header{text-align:center;border-bottom:3px solid #0ea5e9;padding-bottom:20px;margin-bottom:28px}
    .header h1{font-size:28px;font-weight:800;color:#0ea5e9;margin-bottom:4px}
    .header p{font-size:13px;color:#64748b;margin:2px 0}
    .customer{display:flex;justify-content:space-between;margin-bottom:28px;padding:16px;background:#f8fafc;border-radius:12px}
    .customer div{max-width:48%}
    .customer h4{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:6px}
    .customer p{font-size:13px;margin:2px 0}
    .customer .name{font-weight:700;color:#0f172a;font-size:15px}
    table{width:100%;border-collapse:collapse;margin-bottom:24px}
    th{background:#f1f5f9;text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#475569;font-weight:600}
    th.r{text-align:right}th.c{text-align:center}
    .total-row{display:flex;justify-content:flex-end;margin-top:16px}
    .total-box{background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#fff;padding:16px 24px;border-radius:12px;min-width:200px;text-align:right}
    .total-box p{font-size:12px;opacity:.9}
    .total-box h2{font-size:24px;font-weight:800;margin-top:4px}
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:12px}
    @media print{body{padding:20px}}
  </style></head><body>
  <div class="header">
    <h1>Tax Invoice</h1>
    <p>Bill #: ${bill.bill_number}</p>
    <p>Date: ${billDate}</p>
  </div>
  <div class="customer">
    <div>
      <h4>Bill To</h4>
      <p class="name">${bill.customer_name}</p>
      ${bill.customer_mobile ? `<p>Mobile: ${bill.customer_mobile}</p>` : ''}
      ${bill.customer_address ? `<p>${bill.customer_address}</p>` : ''}
    </div>
  </div>
  <table>
    <thead><tr>
      <th>#</th><th>Item</th><th class="c">Qty</th><th class="r">Rate</th><th class="r">Amount</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="total-row">
    <div class="total-box">
      <p>Total Amount</p>
      <h2>${fmt(bill.total_amount)}</h2>
    </div>
  </div>
  <div class="footer">
    <p>Thank you for your business!</p>
  </div>
  </body></html>`

  const w = window.open('', '_blank', 'width=900,height=1000')
  if (!w) { toast.error('Please allow pop-ups to download'); return }
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => { try { w.print() } catch {} }, 500)
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

async function downloadInvoicePDF(inv) {
  try {
    const [settingsRes, invoiceRes] = await Promise.all([
      api.get('/settings/company'),
      api.get(`/invoices/${inv.id}`),
    ])
    const company = settingsRes?.data || {}
    const invoice = invoiceRes?.data || inv
    const currency = invoice.currency || 'INR'
    const sym = currency === 'INR' ? 'Rs' : currency === 'USD' ? '$' : currency === 'EUR' ? '\u20AC' : currency || 'Rs'
    const fmt = (n) => `${sym} ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(Number(n) || 0)}`
    const items = invoice.items || []
    const rows = items.map((it, i) => {
      const qty = parseFloat(it.quantity) || 0
      const price = parseFloat(it.unit_price) || 0
      const taxRate = parseFloat(it.tax_rate) || 0
      const discount = parseFloat(it.discount_value) || 0
      const base = qty * price - discount
      const cgstRate = taxRate / 2
      const sgstRate = taxRate / 2
      const cgstAmount = (base * cgstRate) / 100
      const sgstAmount = (base * sgstRate) / 100
      const total = base + cgstAmount + sgstAmount
       return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;white-space:nowrap">${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;white-space:nowrap"><strong>${it.name}</strong></td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;white-space:nowrap">${qty} ${it.unit || ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;white-space:nowrap">${fmt(price)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;white-space:nowrap">${fmt(cgstAmount)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;white-space:nowrap">${fmt(sgstAmount)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;white-space:nowrap">${fmt(total)}</td>
      </tr>`
    }).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${invoice.invoice_number}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;padding:40px;font-size:13px;background:#fff}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0ea5e9;padding-bottom:24px;margin-bottom:28px}
      .company{display:flex;align-items:center;gap:16px}
      .logo{width:64px;height:64px;border-radius:12px;background:linear-gradient(135deg,#0ea5e9,#6366f1);display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;font-weight:800;overflow:hidden}
      .logo img{width:100%;height:100%;object-fit:cover}
      .company-info h2{font-size:20px;font-weight:800;color:#0f172a}
      .company-info p{font-size:12px;color:#64748b;margin-top:2px}
      .doc-title{font-size:32px;font-weight:800;letter-spacing:1px;color:#0ea5e9;text-align:right}
      .doc-meta{text-align:right;margin-top:6px}
      .doc-meta p{font-size:12px;color:#64748b}
      .parties{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:28px}
      .parties h4{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:8px}
      .parties p{font-size:13px;margin:2px 0}
      .parties .name{font-weight:700;color:#0f172a;font-size:14px}
      table{width:100%;border-collapse:collapse;margin-bottom:24px}
      th{background:#f1f5f9;text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#475569;font-weight:600}
      th.r{text-align:right}
      .totals{width:320px;margin-left:auto}
      .totals tr td{border:none;padding:6px 12px}
      .totals .grand td{border-top:2px solid #0ea5e9;font-weight:800;font-size:16px;color:#0f172a}
      .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:11px}
      @media print{body{padding:20px}}
    </style></head><body>
    <div class="header">
      <div class="company">
        <div class="logo">${company.logo ? `<img src="${company.logo}" alt="logo"/>` : (company.name?.charAt(0) || 'L')}</div>
        <div class="company-info">
          <h2>${company.name || 'Your Company'}</h2>
          ${company.address ? `<p>${company.address}</p>` : ''}
          ${company.phone ? `<p>Phone: ${company.phone}</p>` : ''}
          ${company.gstin ? `<p>GSTIN: ${company.gstin}</p>` : ''}
          ${company.website ? `<p>${company.website}</p>` : ''}
        </div>
      </div>
      <div>
        <div class="doc-title">TAX INVOICE</div>
        <div class="doc-meta">
          <p><strong>${invoice.invoice_number}</strong></p>
          <p>Date: ${formatDate(invoice.issue_date)}</p>
        </div>
      </div>
    </div>
    <div class="parties">
      <div>
        <h4>Bill To</h4>
        <p class="name">${invoice.lead?.contact_name || '—'}</p>
        ${invoice.lead?.company_name ? `<p>${invoice.lead.company_name}</p>` : ''}
        ${invoice.lead?.contact_email ? `<p>${invoice.lead.contact_email}</p>` : ''}
      </div>
      <div>
        <h4>Ship To</h4>
        <p class="name">${invoice.lead?.company_name || invoice.lead?.contact_name || '—'}</p>
        ${invoice.lead?.address ? `<p>${invoice.lead.address}</p>` : ''}
        ${invoice.lead?.city ? `<p>${invoice.lead.city || ''} ${invoice.lead.pincode || ''}</p>` : ''}
      </div>
    </div>
    <table>
      <thead><tr>
        <th>#</th><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">CGST (9%)</th><th class="r">SGST (9%)</th><th class="r">Amount</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="7" style="text-align:center;padding:20px;color:#94a3b8">No items</td></tr>'}</tbody>
    </table>
    <table class="totals">
      <tr><td>Subtotal</td><td style="text-align:right">${fmt(invoice.subtotal)}</td></tr>
      <tr><td>CGST (9%)</td><td style="text-align:right">${fmt(invoice.tax_amount / 2)}</td></tr>
      <tr><td>SGST (9%)</td><td style="text-align:right">${fmt(invoice.tax_amount / 2)}</td></tr>
      <tr class="grand"><td>Total</td><td style="text-align:right">${fmt(invoice.total)}</td></tr>
    </table>
    <div class="footer">
      <p><strong>${company.name || 'Your Company'}</strong></p>
      ${company.gstin ? `<p>GSTIN: ${company.gstin}</p>` : ''}
      <p>This is a computer-generated invoice.</p>
    </div>
    </body></html>`

    const w = window.open('', '_blank', 'width=900,height=1000')
    if (!w) { toast.error('Please allow pop-ups to download'); return }
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => { try { w.print() } catch { /* ignore */ } }, 500)
  } catch (err) {
    toast.error('Failed to generate PDF')
  }
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
