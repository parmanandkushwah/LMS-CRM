import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, FileText, Download, Send, Pencil, Trash2, MoreVertical,
  ChevronDown, Check, Eye, Receipt, IndianRupee, CheckCircle2,
} from 'lucide-react'
import { Card, Badge, StatCard } from '../../components/ui'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { cn, formatDate } from '../../utils'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

// ─── Money / status helpers ────────────────────────────────────────────────────
const CURRENCY_SYMBOLS = { INR: 'Rs', USD: '$', EUR: '\u20AC', GBP: '\u00A3' }
const sym = (currency) => CURRENCY_SYMBOLS[currency] || currency || 'Rs'
const money = (n, currency = 'INR') =>
  `${sym(currency)} ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0)}`

const STATUS = {
  draft: { label: 'Draft', variant: 'default' },
  sent: { label: 'Sent', variant: 'blue' },
  viewed: { label: 'Viewed', variant: 'purple' },
  accepted: { label: 'Accepted', variant: 'green' },
  rejected: { label: 'Rejected', variant: 'red' },
  expired: { label: 'Expired', variant: 'orange' },
  revised: { label: 'Revised', variant: 'yellow' },
}
const STATUS_KEYS = Object.keys(STATUS)

// Mirror backend buildItems + calcTotals so the live preview matches stored values.
function computeItem(it) {
  const qty = parseFloat(it.quantity) || 0
  const price = parseFloat(it.unit_price) || 0
  const taxRate = parseFloat(it.tax_rate) || 0
  const discount = parseFloat(it.discount_value) || 0
  const base = qty * price - discount
  const taxAmount = (base * taxRate) / 100
  return { base, taxAmount, total: base + taxAmount }
}
function computeTotals(items, discountType, discountValue) {
  const computed = items.map(computeItem)
  // Subtotal is pre-tax (sum of line base); tax is added once at the end.
  const subtotal = computed.reduce((s, c) => s + c.base, 0)
  const discountAmount = discountType === 'percentage'
    ? (subtotal * (parseFloat(discountValue) || 0)) / 100
    : (parseFloat(discountValue) || 0)
  const taxAmount = computed.reduce((s, c) => s + c.taxAmount, 0)
  const total = subtotal - discountAmount + taxAmount
  return { subtotal, discountAmount, taxAmount, total, computed }
}

// ─── PDF (styled print window → Save as PDF) ────────────────────────────────────
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

function buildQuotationHTML(q, user) {
  const currency = q.currency || 'INR'
  const items = q.items || []
  const totals = computeTotals(items, q.discount_type, q.discount_value)
  const lead = q.lead || {}
  const company = user?.company || 'Your Company'
  const rows = items.map((it, i) => {
    const c = computeItem(it)
    return `<tr>
      <td class="c">${i + 1}</td>
      <td><strong>${esc(it.name)}</strong>${it.description ? `<div class="muted">${esc(it.description)}</div>` : ''}</td>
      <td class="r">${Number(it.quantity) || 0} ${esc(it.unit || '')}</td>
      <td class="r">${money(it.unit_price, currency)}</td>
      <td class="r">${Number(it.tax_rate) || 0}%</td>
      <td class="r">${money(c.total, currency)}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(q.quotation_number)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; font-size: 13px; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 22px; font-weight: 800; color: #6366f1; }
    .doc-title { font-size: 28px; font-weight: 800; letter-spacing: 1px; color: #0f172a; text-align: right; }
    .muted { color: #64748b; font-size: 11px; }
    .meta { text-align: right; margin-top: 6px; }
    .parties { display: flex; justify-content: space-between; gap: 40px; margin-bottom: 24px; }
    .parties h4 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; }
    .parties p { margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #475569; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    td.r, th.r { text-align: right; }
    td.c, th.c { text-align: center; width: 32px; }
    .totals { width: 300px; margin-left: auto; }
    .totals tr td { border: none; padding: 6px 10px; }
    .totals .grand td { border-top: 2px solid #6366f1; font-weight: 800; font-size: 15px; color: #0f172a; }
    .note { margin-top: 24px; padding: 14px; background: #f8fafc; border-radius: 8px; }
    .note h4 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; background: #eef2ff; color: #6366f1; font-weight: 700; font-size: 11px; text-transform: uppercase; }
    .foot { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    @media print { body { padding: 20px; } }
  </style></head><body>
    <div class="head">
      <div>
        <div class="brand">${esc(company)}</div>
        <div class="muted">${esc(user?.email || '')}</div>
      </div>
      <div>
        <div class="doc-title">QUOTATION</div>
        <div class="meta"><strong>${esc(q.quotation_number)}</strong></div>
        <div class="meta muted">Date: ${formatDate(q.createdAt || q.created_at)}</div>
        ${q.valid_until ? `<div class="meta muted">Valid until: ${formatDate(q.valid_until)}</div>` : ''}
        <div class="meta" style="margin-top:6px"><span class="badge">${esc((STATUS[q.status] || {}).label || q.status)}</span></div>
      </div>
    </div>

    <div class="parties">
      <div>
        <h4>Billed To</h4>
        <p><strong>${esc(lead.company_name || lead.contact_name || '\u2014')}</strong></p>
        ${lead.contact_name ? `<p>${esc(lead.contact_name)}</p>` : ''}
        ${lead.contact_email ? `<p class="muted">${esc(lead.contact_email)}</p>` : ''}
      </div>
      <div style="text-align:right">
        <h4>Subject</h4>
        <p><strong>${esc(q.title)}</strong></p>
      </div>
    </div>

    <table>
      <thead><tr>
        <th class="c">#</th><th>Item</th><th class="r">Qty</th>
        <th class="r">Unit Price</th><th class="r">Tax</th><th class="r">Amount</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="6" class="muted">No items</td></tr>'}</tbody>
    </table>

    <table class="totals">
      <tr><td>Subtotal</td><td class="r">${money(totals.subtotal, currency)}</td></tr>
      ${totals.discountAmount ? `<tr><td>Discount${q.discount_type === 'percentage' ? ` (${Number(q.discount_value) || 0}%)` : ''}</td><td class="r">- ${money(totals.discountAmount, currency)}</td></tr>` : ''}
      <tr><td>Tax</td><td class="r">${money(totals.taxAmount, currency)}</td></tr>
      <tr class="grand"><td>Total</td><td class="r">${money(totals.total, currency)}</td></tr>
    </table>

    ${q.notes ? `<div class="note"><h4>Notes</h4><div>${esc(q.notes)}</div></div>` : ''}
    ${q.terms ? `<div class="note"><h4>Terms &amp; Conditions</h4><div>${esc(q.terms)}</div></div>` : ''}

    <div class="foot">This is a computer-generated quotation. ${esc(company)}</div>
  </body></html>`
}

function downloadQuotationPDF(q, user) {
  const w = window.open('', '_blank', 'width=900,height=1000')
  if (!w) { toast.error('Please allow pop-ups to download the PDF'); return }
  w.document.write(buildQuotationHTML(q, user))
  w.document.close()
  w.focus()
  setTimeout(() => { try { w.print() } catch { /* ignore */ } }, 500)
}

function buildInvoiceHTML(inv, lead, user) {
  const currency = inv.currency || 'INR'
  const items = inv.items || []
  const totals = computeTotals(items, inv.discount_type, inv.discount_value)
  const l = lead || {}
  const company = user?.company || 'Your Company'
  const paid = Number(inv.paid_amount) || 0
  const balance = inv.balance_due != null ? Number(inv.balance_due) : (totals.total - paid)
  const rows = items.map((it, i) => {
    const c = computeItem(it)
    return `<tr>
      <td class="c">${i + 1}</td>
      <td><strong>${esc(it.name)}</strong>${it.description ? `<div class="muted">${esc(it.description)}</div>` : ''}</td>
      <td class="r">${Number(it.quantity) || 0} ${esc(it.unit || '')}</td>
      <td class="r">${money(it.unit_price, currency)}</td>
      <td class="r">${Number(it.tax_rate) || 0}%</td>
      <td class="r">${money(c.total, currency)}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(inv.invoice_number)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; font-size: 13px; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 22px; font-weight: 800; color: #0ea5e9; }
    .doc-title { font-size: 28px; font-weight: 800; letter-spacing: 1px; color: #0f172a; text-align: right; }
    .muted { color: #64748b; font-size: 11px; }
    .meta { text-align: right; margin-top: 6px; }
    .parties { display: flex; justify-content: space-between; gap: 40px; margin-bottom: 24px; }
    .parties h4 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; }
    .parties p { margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #475569; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    td.r, th.r { text-align: right; }
    td.c, th.c { text-align: center; width: 32px; }
    .totals { width: 320px; margin-left: auto; }
    .totals tr td { border: none; padding: 6px 10px; }
    .totals .grand td { border-top: 2px solid #0ea5e9; font-weight: 800; font-size: 15px; color: #0f172a; }
    .totals .due td { border-top: 1px dashed #cbd5e1; font-weight: 800; color: #dc2626; }
    .note { margin-top: 24px; padding: 14px; background: #f8fafc; border-radius: 8px; }
    .note h4 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; background: #e0f2fe; color: #0ea5e9; font-weight: 700; font-size: 11px; text-transform: uppercase; }
    .foot { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    @media print { body { padding: 20px; } }
  </style></head><body>
    <div class="head">
      <div>
        <div class="brand">${esc(company)}</div>
        <div class="muted">${esc(user?.email || '')}</div>
      </div>
      <div>
        <div class="doc-title">INVOICE</div>
        <div class="meta"><strong>${esc(inv.invoice_number)}</strong></div>
        <div class="meta muted">Issue date: ${formatDate(inv.issue_date)}</div>
        ${inv.due_date ? `<div class="meta muted">Due date: ${formatDate(inv.due_date)}</div>` : ''}
        <div class="meta" style="margin-top:6px"><span class="badge">${esc(inv.status || 'draft')}</span></div>
      </div>
    </div>

    <div class="parties">
      <div>
        <h4>Billed To</h4>
        <p><strong>${esc(l.company_name || l.contact_name || '\u2014')}</strong></p>
        ${l.contact_name ? `<p>${esc(l.contact_name)}</p>` : ''}
        ${l.contact_email ? `<p class="muted">${esc(l.contact_email)}</p>` : ''}
      </div>
      <div style="text-align:right">
        <h4>Subject</h4>
        <p><strong>${esc(inv.title)}</strong></p>
      </div>
    </div>

    <table>
      <thead><tr>
        <th class="c">#</th><th>Item</th><th class="r">Qty</th>
        <th class="r">Unit Price</th><th class="r">Tax</th><th class="r">Amount</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="6" class="muted">No items</td></tr>'}</tbody>
    </table>

    <table class="totals">
      <tr><td>Subtotal</td><td class="r">${money(totals.subtotal, currency)}</td></tr>
      ${totals.discountAmount ? `<tr><td>Discount${inv.discount_type === 'percentage' ? ` (${Number(inv.discount_value) || 0}%)` : ''}</td><td class="r">- ${money(totals.discountAmount, currency)}</td></tr>` : ''}
      <tr><td>Tax</td><td class="r">${money(totals.taxAmount, currency)}</td></tr>
       <tr class="grand"><td>Total</td><td class="r">${money(totals.total, currency)}</td></tr>
      ${paid ? `<tr><td>Paid</td><td class="r">- ${money(paid, currency)}</td></tr>` : ''}
      <tr class="due"><td>Balance Due</td><td class="r">${money(balance, currency)}</td></tr>
    </table>

    ${inv.notes ? `<div class="note"><h4>Notes</h4><div>${esc(inv.notes)}</div></div>` : ''}
    ${inv.terms ? `<div class="note"><h4>Terms &amp; Conditions</h4><div>${esc(inv.terms)}</div></div>` : ''}

    <div class="foot">This is a computer-generated invoice. ${esc(company)}</div>
  </body></html>`
}

// Downloads an Invoice PDF when the quotation has been converted, else the Quotation PDF.
function downloadDoc(q, user) {
  const invoice = (q.invoices || [])[0]
  if (invoice) {
    const w = window.open('', '_blank', 'width=900,height=1000')
    if (!w) { toast.error('Please allow pop-ups to download the PDF'); return }
    w.document.write(buildInvoiceHTML(invoice, q.lead, user))
    w.document.close()
    w.focus()
    setTimeout(() => { try { w.print() } catch { /* ignore */ } }, 500)
    return
  }
  downloadQuotationPDF(q, user)
}

// ─── Generic ul/li dropdown ─────────────────────────────────────────────────────
function Dropdown({ options, value, onChange, placeholder = 'Select', className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    function handleKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleKey) }
  }, [])

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className={cn('w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white/5 border text-sm text-heading focus:outline-none transition-colors', open ? 'border-primary-500/50' : 'border-app')}>
        <span className={cn('flex items-center gap-2 min-w-0', !selected && 'text-muted')}>
          {selected?.dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', selected.dot)} />}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown className={cn('w-4 h-4 text-muted transition-transform flex-shrink-0', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            className="absolute z-30 mt-1.5 w-full max-h-56 overflow-y-auto scrollbar-thin rounded-xl bg-sidebar border border-app shadow-card-dark py-1">
            {options.length === 0 && <li className="px-3 py-2 text-sm text-muted">No options</li>}
            {options.map(opt => (
              <li key={opt.value}>
                <button type="button" onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={cn('w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-white/5', opt.value === value ? 'text-heading' : 'text-muted')}>
                  <span className="flex items-center gap-2 min-w-0">
                    {opt.dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', opt.dot)} />}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {opt.value === value && <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Row actions menu ───────────────────────────────────────────────────────────
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
      <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}>
        <MoreVertical className="w-4 h-4" />
      </Button>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ opacity: 0, y: up ? 6 : -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: up ? 6 : -6 }} transition={{ duration: 0.15 }}
            className={cn('absolute right-0 z-30 w-48 rounded-xl bg-sidebar border border-app shadow-card-dark py-1', up ? 'bottom-full mb-1' : 'mt-1')}>
            {items.map((it, i) => (
              <li key={i}>
                <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(false); it.onClick() }}
                  className={cn('w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-white/5', it.danger ? 'text-red-400' : 'text-body hover:text-heading')}>
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

// Compact input style for line-item cells.
const cell = 'w-full h-9 rounded-lg border border-app bg-card text-heading placeholder:text-muted px-2.5 text-sm focus:outline-none focus:border-primary-500/50 transition-colors'

const DISCOUNT_OPTIONS = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed amount' },
]
const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR (Rs)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (\u20AC)' },
  { value: 'GBP', label: 'GBP (\u00A3)' },
]

const blankItem = () => ({ product_id: null, name: '', description: '', quantity: 1, unit: 'piece', unit_price: 0, tax_rate: 0, discount_value: 0 })

function QuotationFormModal({ open, onClose, quotationId }) {
  const queryClient = useQueryClient()
  const isEdit = !!quotationId
  const [form, setForm] = useState({
    lead_id: '', title: '', discount_type: 'percentage', discount_value: 0,
    valid_until: '', notes: '', terms: '', currency: 'INR', items: [blankItem()],
  })

  const { data: existing } = useQuery({
    queryKey: ['quotation', quotationId],
    queryFn: () => api.get(`/quotations/${quotationId}`),
    enabled: open && isEdit,
  })
  const { data: leadsData } = useQuery({
    queryKey: ['quotations-lead-options'],
    queryFn: () => api.get('/leads', { params: { limit: 1000 } }),
    enabled: open,
  })
  const { data: productsData } = useQuery({
    queryKey: ['quotations-product-options'],
    queryFn: () => api.get('/products', { params: { limit: 1000, is_active: true } }),
    enabled: open,
  })

  const leadOptions = (leadsData?.data || []).map(l => ({ value: String(l.id), label: l.title || l.contact_name || `Lead #${l.id}` }))
  const products = productsData?.data || []
  const productOptions = products.map(p => ({ value: String(p.id), label: `${p.name} \u00B7 ${money(p.price, p.currency)}` }))

  useEffect(() => {
    if (!open) return
    if (isEdit && existing?.data) {
      const q = existing.data
      setForm({
        lead_id: String(q.lead_id || ''),
        title: q.title || '',
        discount_type: q.discount_type || 'percentage',
        discount_value: q.discount_value || 0,
        valid_until: q.valid_until ? String(q.valid_until).slice(0, 10) : '',
        notes: q.notes || '',
        terms: q.terms || '',
        currency: q.currency || 'INR',
        items: (q.items || []).length ? q.items.map(i => ({
          product_id: i.product_id, name: i.name, description: i.description || '',
          quantity: i.quantity, unit: i.unit || 'piece', unit_price: i.unit_price,
          tax_rate: i.tax_rate || 0, discount_value: i.discount_value || 0,
        })) : [blankItem()],
      })
    } else if (!isEdit) {
      setForm({ lead_id: '', title: '', discount_type: 'percentage', discount_value: 0, valid_until: '', notes: '', terms: '', currency: 'INR', items: [blankItem()] })
    }
  }, [open, isEdit, existing])

  const setItem = (idx, patch) => setForm(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, ...patch } : it) }))
  const removeItem = (idx) => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))
  const addItem = () => setForm(p => ({ ...p, items: [...p.items, blankItem()] }))
  const addProduct = (productId) => {
    const p = products.find(pr => String(pr.id) === productId)
    if (!p) return
    setForm(f => ({ ...f, items: [...f.items, { product_id: p.id, name: p.name, description: p.description || '', quantity: 1, unit: p.unit || 'piece', unit_price: p.price, tax_rate: p.tax_rate || 0, discount_value: 0 }] }))
  }

  const totals = computeTotals(form.items, form.discount_type, form.discount_value)

  const mutation = useMutation({
    mutationFn: (payload) => isEdit ? api.put(`/quotations/${quotationId}`, payload) : api.post('/quotations', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.invalidateQueries({ queryKey: ['quotation', quotationId] })
      onClose()
      toast.success(isEdit ? 'Quotation updated!' : 'Quotation created!')
    },
    onError: (err) => toast.error(err.message),
  })

  const handleSubmit = () => {
    if (!form.lead_id) return toast.error('Please select a lead')
    if (!form.title.trim()) return toast.error('Title is required')
    const items = form.items.filter(i => i.name.trim())
    if (items.length === 0) return toast.error('Add at least one line item')
    mutation.mutate({
      lead_id: Number(form.lead_id),
      title: form.title.trim(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value) || 0,
      valid_until: form.valid_until || null,
      notes: form.notes || null,
      terms: form.terms || null,
      currency: form.currency,
      items: items.map(i => ({
        product_id: i.product_id || null, name: i.name.trim(), description: i.description || null,
        quantity: Number(i.quantity) || 0, unit: i.unit || 'piece', unit_price: Number(i.unit_price) || 0,
        tax_rate: Number(i.tax_rate) || 0, discount_value: Number(i.discount_value) || 0,
      })),
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Quotation' : 'New Quotation'} size="xl" className="overflow-visible"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit} loading={mutation.isPending}>{isEdit ? 'Save Changes' : 'Create Quotation'}</Button></>}>
      <div className="space-y-5 max-h-[70vh] overflow-y-auto scrollbar-thin pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">Lead</label>
            <Dropdown options={leadOptions} value={form.lead_id} onChange={v => setForm(p => ({ ...p, lead_id: v }))} placeholder="Select a lead" />
          </div>
          <Input label="Title" placeholder="e.g. Website Development Package" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        </div>

        {/* Line items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">Line Items</label>
            {productOptions.length > 0 && (
              <div className="w-56"><Dropdown options={productOptions} value="" onChange={addProduct} placeholder="+ Add from products" /></div>
            )}
          </div>
          <div className="hidden sm:grid grid-cols-12 gap-2 px-1 text-[10px] font-semibold text-muted uppercase tracking-wide">
            <div className="col-span-4">Item</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Unit Price</div>
            <div className="col-span-1 text-right">Tax %</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-1" />
          </div>
          <div className="space-y-2">
            {form.items.map((it, idx) => {
              const c = computeItem(it)
              return (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-12 sm:col-span-4 space-y-1">
                    <input className={cell} placeholder="Item name" value={it.name} onChange={e => setItem(idx, { name: e.target.value })} />
                    <input className={cn(cell, 'h-7 text-xs')} placeholder="Description (optional)" value={it.description} onChange={e => setItem(idx, { description: e.target.value })} />
                  </div>
                  <div className="col-span-3 sm:col-span-2"><input type="number" min="0" className={cn(cell, 'text-right')} value={it.quantity} onChange={e => setItem(idx, { quantity: e.target.value })} /></div>
                  <div className="col-span-4 sm:col-span-2"><input type="number" min="0" className={cn(cell, 'text-right')} value={it.unit_price} onChange={e => setItem(idx, { unit_price: e.target.value })} /></div>
                  <div className="col-span-3 sm:col-span-1"><input type="number" min="0" className={cn(cell, 'text-right')} value={it.tax_rate} onChange={e => setItem(idx, { tax_rate: e.target.value })} /></div>
                  <div className="col-span-1 sm:col-span-2 flex items-center h-9 justify-end text-xs font-medium text-heading truncate">{money(c.total, form.currency)}</div>
                  <div className="col-span-1 flex items-center h-9 justify-end">
                    <button type="button" onClick={() => removeItem(idx)} className="text-muted hover:text-red-400 transition-colors" title="Remove">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <Button variant="ghost" size="sm" onClick={addItem}><Plus className="w-3.5 h-3.5" />Add line</Button>
        </div>

        {/* Discount / currency / validity + totals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">Discount Type</label>
                <Dropdown options={DISCOUNT_OPTIONS} value={form.discount_type} onChange={v => setForm(p => ({ ...p, discount_type: v }))} />
              </div>
              <Input label="Discount Value" type="number" min="0" value={form.discount_value} onChange={e => setForm(p => ({ ...p, discount_value: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">Currency</label>
                <Dropdown options={CURRENCY_OPTIONS} value={form.currency} onChange={v => setForm(p => ({ ...p, currency: v }))} />
              </div>
              <Input label="Valid Until" type="date" value={form.valid_until} onChange={e => setForm(p => ({ ...p, valid_until: e.target.value }))} />
            </div>
          </div>
          <div className="rounded-xl border border-app bg-white/4 p-4 space-y-2 self-start">
            <div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><span className="text-body">{money(totals.subtotal, form.currency)}</span></div>
            {totals.discountAmount > 0 && <div className="flex justify-between text-sm"><span className="text-muted">Discount</span><span className="text-red-400">- {money(totals.discountAmount, form.currency)}</span></div>}
            <div className="flex justify-between text-sm"><span className="text-muted">Tax</span><span className="text-body">{money(totals.taxAmount, form.currency)}</span></div>
            <div className="flex justify-between pt-2 border-t border-app"><span className="font-semibold text-heading">Total</span><span className="font-bold text-primary-500">{money(totals.total, form.currency)}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">Notes</label>
            <textarea rows={3} className={cn(cell, 'h-auto py-2 resize-none')} placeholder="Notes visible to the client" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">Terms &amp; Conditions</label>
            <textarea rows={3} className={cn(cell, 'h-auto py-2 resize-none')} placeholder="Payment terms, validity, etc." value={form.terms} onChange={e => setForm(p => ({ ...p, terms: e.target.value }))} />
          </div>
        </div>
      </div>
    </Modal>
  )
}

function QuotationDetailModal({ open, onClose, quotationId, onEdit }) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['quotation', quotationId],
    queryFn: () => api.get(`/quotations/${quotationId}`),
    enabled: open && !!quotationId,
  })
  const q = data?.data
  const currency = q?.currency || 'INR'
  const totals = q ? computeTotals(q.items || [], q.discount_type, q.discount_value) : null

  const sendMutation = useMutation({
    mutationFn: () => api.post(`/quotations/${quotationId}/send`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.invalidateQueries({ queryKey: ['quotation', quotationId] })
      if (res?.warning) toast(res.warning, { icon: '\u26A0\uFE0F' })
      else toast.success('Quotation sent to client')
    },
    onError: (err) => toast.error(err.message),
  })
  const convertMutation = useMutation({
    mutationFn: () => api.post(`/quotations/${quotationId}/convert-to-invoice`, {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quotations'] }); queryClient.invalidateQueries({ queryKey: ['quotation', quotationId] }); toast.success('Invoice created from quotation') },
    onError: (err) => toast.error(err.message),
  })

  return (
    <Modal open={open} onClose={onClose} title={q ? q.quotation_number : 'Quotation'} size="lg"
      footer={q ? (
        <div className="flex items-center justify-between w-full gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => onEdit(q.id)}><Pencil className="w-3.5 h-3.5" />Edit</Button>
          <div className="flex items-center gap-2">
            {q.status === 'draft' && <Button variant="secondary" size="sm" onClick={() => sendMutation.mutate()} loading={sendMutation.isPending}><Send className="w-3.5 h-3.5" />Send</Button>}
            {q.status !== 'accepted' && <Button variant="secondary" size="sm" onClick={() => convertMutation.mutate()} loading={convertMutation.isPending}><Receipt className="w-3.5 h-3.5" />To Invoice</Button>}
            <Button size="sm" onClick={() => downloadDoc(q, user)}><Download className="w-3.5 h-3.5" />Download PDF</Button>
          </div>
        </div>
      ) : null}>
      {isLoading || !q ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-heading">{q.title}</h3>
              <p className="text-sm text-muted">{q.lead?.company_name || q.lead?.contact_name || '\u2014'}</p>
            </div>
            <Badge variant={(STATUS[q.status] || {}).variant}>{(STATUS[q.status] || {}).label || q.status}</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><p className="text-xs text-muted">Date</p><p className="text-body">{formatDate(q.createdAt || q.created_at)}</p></div>
            <div><p className="text-xs text-muted">Valid Until</p><p className="text-body">{q.valid_until ? formatDate(q.valid_until) : '\u2014'}</p></div>
            <div><p className="text-xs text-muted">Contact</p><p className="text-body truncate">{q.lead?.contact_name || '\u2014'}</p></div>
            <div><p className="text-xs text-muted">Created By</p><p className="text-body truncate">{q.creator?.name || '\u2014'}</p></div>
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
                {(q.items || []).map(it => {
                  const c = computeItem(it)
                  return (
                    <tr key={it.id} className="border-t border-app">
                      <td className="px-3 py-2">
                        <p className="text-heading font-medium">{it.name}</p>
                        {it.description && <p className="text-xs text-muted">{it.description}</p>}
                      </td>
                      <td className="px-3 py-2 text-right text-body">{Number(it.quantity)} {it.unit}</td>
                      <td className="px-3 py-2 text-right text-body">{money(it.unit_price, currency)}</td>
                      <td className="px-3 py-2 text-right text-body">{Number(it.tax_rate) || 0}%</td>
                      <td className="px-3 py-2 text-right text-heading font-medium">{money(c.total, currency)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><span className="text-body">{money(totals.subtotal, currency)}</span></div>
              {totals.discountAmount > 0 && <div className="flex justify-between text-sm"><span className="text-muted">Discount</span><span className="text-red-400">- {money(totals.discountAmount, currency)}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-muted">Tax</span><span className="text-body">{money(totals.taxAmount, currency)}</span></div>
              <div className="flex justify-between pt-2 border-t border-app"><span className="font-semibold text-heading">Total</span><span className="font-bold text-primary-500">{money(totals.total, currency)}</span></div>
            </div>
          </div>

          {(q.notes || q.terms) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {q.notes && <div className="rounded-xl bg-white/4 p-3"><p className="text-xs font-semibold text-muted uppercase mb-1">Notes</p><p className="text-sm text-body whitespace-pre-wrap">{q.notes}</p></div>}
              {q.terms && <div className="rounded-xl bg-white/4 p-3"><p className="text-xs font-semibold text-muted uppercase mb-1">Terms</p><p className="text-sm text-body whitespace-pre-wrap">{q.terms}</p></div>}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

export default function Quotations() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [detailId, setDetailId] = useState(null)
  const [formState, setFormState] = useState({ open: false, id: null })

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', search, status],
    queryFn: () => api.get('/quotations', { params: { search: search || undefined, status: status || undefined } }),
  })
  const quotations = data?.data || []

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/quotations/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quotations'] }); toast.success('Quotation deleted') },
    onError: (err) => toast.error(err.message),
  })

  const totalValue = quotations.reduce((s, q) => s + (Number(q.total) || 0), 0)
  const stats = [
    { title: 'Total Quotations', value: quotations.length, icon: FileText, iconColor: 'text-primary-500', iconBg: 'bg-primary-500/10', subtitle: 'All time' },
    { title: 'Draft', value: quotations.filter(q => q.status === 'draft').length, icon: Pencil, iconColor: 'text-slate-400', iconBg: 'bg-slate-500/10', subtitle: 'Not sent yet' },
    { title: 'Sent', value: quotations.filter(q => q.status === 'sent' || q.status === 'viewed').length, icon: Send, iconColor: 'text-brand-blue', iconBg: 'bg-brand-blue/10', subtitle: 'Sent / viewed' },
    { title: 'Accepted', value: quotations.filter(q => q.status === 'accepted').length, icon: CheckCircle2, iconColor: 'text-green-400', iconBg: 'bg-green-500/10', subtitle: 'Won' },
    { title: 'Total Value', value: money(totalValue), icon: IndianRupee, iconColor: 'text-primary-500', iconBg: 'bg-primary-500/10', subtitle: 'Sum of all' },
  ]

  const openCreate = () => setFormState({ open: true, id: null })
  const openEdit = (id) => { setDetailId(null); setFormState({ open: true, id }) }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(s => (
          <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} iconColor={s.iconColor} iconBg={s.iconBg} subtitle={s.subtitle} />
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by number or title..."
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-white/5 border border-app text-sm text-heading placeholder:text-muted focus:outline-none focus:border-primary-500/50 transition-colors" />
        </div>
        <div className="w-full sm:w-44">
          <Dropdown options={[{ value: '', label: 'All statuses' }, ...STATUS_KEYS.map(k => ({ value: k, label: STATUS[k].label }))]} value={status} onChange={setStatus} placeholder="All statuses" />
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5" />New Quotation</Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="glass rounded-xl h-16 border border-app animate-pulse" />)}</div>
      ) : quotations.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted text-sm mb-4">No quotations yet</p>
          <Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5" />Create your first quotation</Button>
        </div>
      ) : (
        <Card className="p-0">
          <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b border-app text-[10px] font-semibold text-muted uppercase tracking-wide">
            <div className="col-span-3">Number</div>
            <div className="col-span-3">Title</div>
            <div className="col-span-2">Client</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <AnimatePresence>
            {quotations.map((q, i) => (
              <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.25) }}
                onClick={() => setDetailId(q.id)}
                className="grid grid-cols-12 gap-3 px-5 py-3.5 border-b border-app last:border-0 hover:bg-white/4 transition-colors cursor-pointer items-center">
                <div className="col-span-12 md:col-span-3 flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-primary-500" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-heading truncate">{q.quotation_number}</p>
                    <p className="text-xs text-muted md:hidden truncate">{q.title}</p>
                  </div>
                </div>
                <div className="hidden md:block col-span-3 text-sm text-body truncate">{q.title}</div>
                <div className="hidden md:block col-span-2 text-sm text-muted truncate">{q.lead?.company_name || q.lead?.contact_name || '\u2014'}</div>
                <div className="col-span-6 md:col-span-1 text-sm font-medium text-heading md:text-right whitespace-nowrap">{money(q.total, q.currency)}</div>
                <div className="col-span-4 md:col-span-2"><Badge variant={(STATUS[q.status] || {}).variant}>{(STATUS[q.status] || {}).label || q.status}</Badge></div>
                <div className="col-span-2 md:col-span-1 flex justify-end" onClick={e => e.stopPropagation()}>
                  <ActionsMenu up={i === quotations.length - 1} items={[
                    { label: 'View', icon: <Eye className="w-3.5 h-3.5" />, onClick: () => setDetailId(q.id) },
                    { label: 'Download PDF', icon: <Download className="w-3.5 h-3.5" />, onClick: async () => { const full = await api.get(`/quotations/${q.id}`); downloadDoc(full.data, user) } },
                    { label: 'Edit', icon: <Pencil className="w-3.5 h-3.5" />, onClick: () => openEdit(q.id) },
                    { label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => { if (window.confirm('Delete this quotation?')) deleteMutation.mutate(q.id) } },
                  ]} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </Card>
      )}

      <QuotationDetailModal open={!!detailId} quotationId={detailId} onClose={() => setDetailId(null)} onEdit={openEdit} />
      <QuotationFormModal open={formState.open} quotationId={formState.id} onClose={() => setFormState({ open: false, id: null })} />
    </div>
  )
}
