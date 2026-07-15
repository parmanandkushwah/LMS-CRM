import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, ChevronRight, ChevronLeft, Clock, CalendarDays, Trash2, Upload, Download, FileText } from 'lucide-react'
import { Card, Avatar } from '../../components/ui'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useAuth } from '../../contexts/AuthContext'
import { cn, formatNumber } from '../../utils'
import api from '../../services/api'
import { documentsApi, formatBytes, docTypeFromName, getInlineUrl } from '../../services/documents'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

const TYPE_META = {
  call: { label: 'Call', dot: 'bg-brand-blue', text: 'text-brand-blue', bar: 'bg-brand-blue' },
  email: { label: 'Email', dot: 'bg-brand-purple', text: 'text-brand-purple', bar: 'bg-brand-purple' },
  meeting: { label: 'Meeting', dot: 'bg-primary-500', text: 'text-primary-500', bar: 'bg-primary-500' },
  whatsapp: { label: 'WhatsApp', dot: 'bg-green-400', text: 'text-green-400', bar: 'bg-green-400' },
  task: { label: 'Task', dot: 'bg-orange-400', text: 'text-orange-400', bar: 'bg-orange-400' },
}

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
const fmtDayLabel = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
}

function EventRow({ event }) {
  const meta = TYPE_META[event.type] || { dot: 'bg-white/20', text: 'text-muted', label: 'Event' }
  const done = event.outcome === 'completed'
  const inner = (
    <div className={cn('flex items-center gap-3 p-3 rounded-xl transition-colors', event.leadId ? 'hover:bg-white/6' : '', done && 'opacity-60')}>
      <div className={cn('w-1 h-10 rounded-full flex-shrink-0', meta.bar)} />
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium text-heading truncate', done && 'line-through')}>{event.title}</p>
        <p className="text-xs text-muted truncate">
          {fmtTime(event.at)} · <span className={meta.text}>{meta.label}</span>
          {event.leadName ? ` · ${event.leadName}` : ''}
        </p>
      </div>
      {done && <span className="text-[10px] font-semibold text-green-400 flex-shrink-0">Done</span>}
    </div>
  )
  return event.leadId ? <Link to={`/leads/${event.leadId}`} className="block">{inner}</Link> : inner
}

export function Calendar() {
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const [cursor, setCursor] = useState(() => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), 1) })
  const [selected, setSelected] = useState(() => ymd(new Date()))

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const rangeStart = new Date(year, month, 1)
  const rangeEnd = new Date(year, month + 1, 0, 23, 59, 59)

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () => api.get('/calendar', { params: { start: rangeStart.toISOString(), end: rangeEnd.toISOString() } }),
  })

  const events = (data?.data || []).map(a => ({
    id: a.id,
    type: a.type,
    title: a.title || a.lead?.title || (TYPE_META[a.type]?.label ?? 'Event'),
    at: a.scheduled_at,
    dateKey: ymd(new Date(a.scheduled_at)),
    leadId: a.lead?.id,
    leadName: a.lead?.contact_name || a.lead?.title,
    company: a.lead?.company_name,
    outcome: a.outcome,
    assignedTo: a.user?.name,
  }))

  const byDay = {}
  for (const e of events) { (byDay[e.dateKey] || (byDay[e.dateKey] = [])).push(e) }

  const todayKey = ymd(new Date())
  const selectedEvents = (byDay[selected] || []).slice().sort((a, b) => new Date(a.at) - new Date(b.at))

  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0))
  const upcoming = events
    .filter(e => new Date(e.at) >= startOfToday && e.outcome !== 'completed')
    .sort((a, b) => new Date(a.at) - new Date(b.at))
    .slice(0, 6)

  const goPrev = () => setCursor(new Date(year, month - 1, 1))
  const goNext = () => setCursor(new Date(year, month + 1, 1))
  const goToday = () => { const t = new Date(); setCursor(new Date(t.getFullYear(), t.getMonth(), 1)); setSelected(ymd(t)) }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Calendar grid */}
      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-heading">
              {cursor.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            {isLoading && <p className="text-xs text-muted">Loading events…</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={goToday}>Today</Button>
            <Button variant="ghost" size="icon-sm" onClick={goPrev}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon-sm" onClick={goNext}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayLabels.map(d => <div key={d} className="text-center text-xs font-semibold text-muted py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const key = ymd(new Date(year, month, day))
            const dayEvents = byDay[key] || []
            const isToday = key === todayKey
            const isSelected = key === selected
            return (
              <motion.button
                key={day}
                whileHover={{ scale: 1.04 }}
                onClick={() => setSelected(key)}
                className={cn(
                  'aspect-square flex flex-col items-center justify-start pt-1.5 rounded-xl text-sm cursor-pointer transition-all relative border',
                  isSelected ? 'border-primary-500/50 bg-primary-500/10' : 'border-transparent hover:bg-white/8',
                  isToday && !isSelected && 'bg-white/5',
                )}
              >
                <span className={cn(
                  'w-6 h-6 flex items-center justify-center rounded-full text-xs',
                  isToday ? 'bg-primary-500 text-white font-bold' : 'text-body',
                )}>{day}</span>
                {dayEvents.length > 0 && (
                  <div className="flex items-center gap-0.5 mt-1 flex-wrap justify-center px-1">
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <span key={idx} className={cn('w-1.5 h-1.5 rounded-full', (TYPE_META[e.type] || {}).dot || 'bg-white/30')} />
                    ))}
                    {dayEvents.length > 3 && <span className="text-[9px] text-muted leading-none">+{dayEvents.length - 3}</span>}
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </Card>

      {/* Side panel */}
      <div className="space-y-5">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-heading">{fmtDayLabel(selected)}</h3>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={selected} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-1">
              {selectedEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-muted mx-auto mb-2" />
                  <p className="text-xs text-muted">No events scheduled</p>
                </div>
              ) : (
                selectedEvents.map(e => <EventRow key={e.id} event={e} />)
              )}
            </motion.div>
          </AnimatePresence>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-heading mb-3">Upcoming</h3>
          <div className="space-y-1">
            {upcoming.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">Nothing coming up</p>
            ) : (
              upcoming.map(e => <EventRow key={e.id} event={e} />)
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

// Companies are derived from leads grouped by company_name
// (there is no separate company model on the backend).
function buildCompanies(leads) {
  const map = new Map()
  for (const l of leads) {
    const name = l.company_name
    if (!name) continue
    const value = Number(l.estimated_value) || 0
    const location = [l.city, l.country].filter(Boolean).join(', ')
    const existing = map.get(name)
    if (existing) {
      existing.leads += 1
      existing.revenue += value
      if (l.status === 'won') existing.won += 1
      if (!existing.location && location) existing.location = location
    } else {
      map.set(name, {
        name,
        location: location || l.company_website || '',
        leads: 1,
        revenue: value,
        won: l.status === 'won' ? 1 : 0,
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
}

export function Companies() {
  const { data, isLoading } = useQuery({
    queryKey: ['companies-leads'],
    queryFn: () => api.get('/leads', { params: { limit: 1000 } }),
  })

  const companies = buildCompanies(data?.data || [])

  return (
    <div className="space-y-5">
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 border border-app animate-pulse h-36" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c, i) => (
            <motion.div key={c.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card hover className="cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue/20 to-brand-purple/20 border border-app flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-brand-blue" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-heading truncate">{c.name}</h3>
                    <p className="text-xs text-muted truncate">{c.location || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Leads', value: c.leads },
                    { label: 'Revenue', value: `Rs ${formatNumber(c.revenue)}` },
                    { label: 'Won', value: c.won },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2 rounded-lg bg-white/4">
                      <p className="text-xs font-bold text-heading">{s.value}</p>
                      <p className="text-xs text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && companies.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted text-sm">No companies found</p>
        </div>
      )}
    </div>
  )
}

export function Documents() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list(),
  })

  const docs = (data?.data || []).map((d) => ({
    id: d.id,
    name: d.title || d.original_name,
    size: formatBytes(d.file_size),
    type: docTypeFromName(d.original_name || d.file_name),
    fileName: d.file_name,
    filePath: d.file_path,
    date: new Date(d.createdAt || d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    uploader: d.uploader?.name,
    canDelete: d.uploaded_by === user?.id || ['admin', 'manager'].includes(user?.role),
  }))

  const typeColors = {
    PDF: 'text-red-400 bg-red-500/10',
    DOC: 'text-brand-blue bg-brand-blue/10',
    VIDEO: 'text-brand-purple bg-brand-purple/10',
    XLS: 'text-primary-500 bg-primary-500/10',
    IMG: 'text-green-400 bg-green-500/10',
    FILE: 'text-muted bg-white/10',
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setUploading(true)
      const form = new FormData()
      form.append('document', file)
      form.append('title', file.name)
      await documentsApi.upload(form)
      toast.success('Document uploaded!')
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (doc) => {
    try {
      await documentsApi.download(doc.id, doc.name)
    } catch {
      toast.error('Download failed')
    }
  }

  const handleDelete = async (doc) => {
    try {
      await documentsApi.remove(doc.id)
      toast.success('Document deleted')
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    }
  }

  const canPreviewInline = previewDoc && ['PDF', 'IMG'].includes(previewDoc.type)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-heading">Documents</h2>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} />
        <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <Upload className="w-3.5 h-3.5" />{uploading ? 'Uploading…' : 'Upload'}
        </Button>
      </div>
      <Card className="p-0 overflow-hidden">
        {isLoading && (
          <div className="px-5 py-10 text-center text-xs text-muted">Loading documents…</div>
        )}
        {!isLoading && docs.length === 0 && (
          <div className="px-5 py-10 text-center text-xs text-muted">No documents yet. Upload one to get started.</div>
        )}
        {!isLoading && docs.map((doc, i) => (
          <motion.div key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
            className="flex items-center gap-4 px-5 py-3.5 border-b border-app last:border-0 hover:bg-white/4 transition-colors">
            <button onClick={() => setPreviewDoc(doc)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
              <div className={`px-2 py-1 rounded-md text-xs font-bold ${typeColors[doc.type] || typeColors.FILE}`}>{doc.type}</div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-heading truncate">{doc.name}</p>
                <p className="text-xs text-muted">{doc.size} · {doc.date}{doc.uploader ? ` · ${doc.uploader}` : ''}</p>
              </div>
            </button>
            <Button variant="ghost" size="icon-sm" onClick={() => handleDownload(doc)} title="Download">
              <Download className="w-4 h-4" />
            </Button>
            {doc.canDelete && (
              <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(doc)} title="Delete">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </motion.div>
        ))}
      </Card>

      <Modal open={!!previewDoc} onClose={() => setPreviewDoc(null)} size="xl"
        title={previewDoc?.name}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => window.open(getFileUrl(previewDoc?.filePath), '_blank')}>
              Open in new tab
            </Button>
            <Button size="sm" onClick={() => handleDownload(previewDoc)}>
              <Download className="w-3.5 h-3.5" />Download
            </Button>
          </>
        }
      >
        {previewDoc && canPreviewInline ? (
          previewDoc.type === 'PDF' ? (
            <iframe src={getInlineUrl(previewDoc.id)} title={previewDoc.name}
              className="w-full h-[70vh] rounded-lg bg-white" />
          ) : (
            <img src={getInlineUrl(previewDoc.id)} alt={previewDoc.name} className="max-h-[70vh] mx-auto rounded-lg" />
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-12 h-12 text-muted mb-3" />
            <p className="text-sm text-heading font-medium">{previewDoc?.name}</p>
            <p className="text-xs text-muted mt-1">
              {previewDoc ? `${previewDoc.size} · ${previewDoc.type}` : ''}
            </p>
            <p className="text-xs text-muted mt-4 max-w-sm">
              In-browser preview isn't available for this file type. Use "Open in new tab" or "Download" to view it.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export function Profile() {
  const { user } = useAuth()
  return (
    <div className="max-w-2xl space-y-5">
      <Card>
        <div className="flex items-center gap-5 mb-6">
          <Avatar name={user?.name} size="2xl" />
          <div>
            <h2 className="text-xl font-bold text-heading">{user?.name}</h2>
            <p className="text-sm text-muted">{user?.role} · {user?.company}</p>
            <p className="text-sm text-muted">{user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" defaultValue={user?.name} />
          <Input label="Email" type="email" defaultValue={user?.email} />
          <Input label="Role" defaultValue={user?.role} />
          <Input label="Company" defaultValue={user?.company} />
        </div>
        <Button className="mt-4" onClick={() => toast.success('Profile updated!')}>Save Changes</Button>
      </Card>
    </div>
  )
}

export function Subscription() {
  return (
    <div className="max-w-3xl space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { name: 'Starter', price: '$29', features: ['5 Users', '1,000 Leads', 'Basic Reports', 'Email Support'], current: false },
          { name: 'Professional', price: '$79', features: ['15 Users', '10,000 Leads', 'Advanced Analytics', 'Priority Support', 'API Access'], current: true },
          { name: 'Enterprise', price: '$199', features: ['Unlimited Users', 'Unlimited Leads', 'Custom Reports', '24/7 Support', 'Custom Integrations', 'SLA'], current: false },
        ].map((plan, i) => (
          <motion.div key={plan.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className={plan.current ? 'border-primary-500/40 gradient-border' : ''}>
              {plan.current && <div className="text-xs font-semibold text-primary-500 mb-2">Current Plan</div>}
              <h3 className="text-base font-bold text-heading">{plan.name}</h3>
              <p className="text-2xl font-bold text-heading mt-1">{plan.price}<span className="text-sm font-normal text-muted">/mo</span></p>
              <ul className="space-y-2 my-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-body">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />{f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.current ? 'secondary' : 'primary'}
                size="sm"
                className="w-full"
                onClick={() => toast(plan.current ? 'Already on this plan' : 'Upgrade coming soon!')}
              >
                {plan.current ? 'Current Plan' : 'Upgrade'}
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
