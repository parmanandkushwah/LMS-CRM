import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Download, Trash2, MoreHorizontal,
  Eye, Edit, Phone, Mail, SlidersHorizontal, X
} from 'lucide-react'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import { Badge, Avatar, Card } from '../../components/ui'
import { Select } from '../../components/ui/FormElements'
import EmptyState from '../../components/ui/EmptyState'
import { cn, formatCurrency, formatDate, STATUS_COLORS, PRIORITY_COLORS } from '../../utils'
import toast from 'react-hot-toast'
import AddLeadModal from './AddLeadModal'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'on_hold']
const PRIORITIES = ['low', 'medium', 'high', 'urgent']
const SOURCES = ['website', 'referral', 'cold_call', 'email', 'social_media', 'advertisement', 'event', 'other']
const PAGE_SIZE = 15

function StatusBadge({ status }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize', STATUS_COLORS[status] || STATUS_COLORS.new)}>
      {status?.replace('_', ' ')}
    </span>
  )
}

function PriorityDot({ priority }) {
  const colors = { low: 'bg-gray-400', medium: 'bg-yellow-400', high: 'bg-orange-400', urgent: 'bg-red-400' }
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('w-2 h-2 rounded-full', colors[priority])} />
      <span className="text-xs text-body capitalize">{priority}</span>
    </div>
  )
}

function ActionsMenu({ lead, onEdit, onDelete, canDelete }) {
  const [open, setOpen] = useState(false)
  const [up, setUp] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  const toggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setUp(rect.bottom + 200 > window.innerHeight)
    }
    setOpen(p => !p)
  }

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon-sm" onClick={toggle}>
        <MoreHorizontal className="w-4 h-4" />
      </Button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                'absolute right-0 w-40 glass rounded-xl border border-app shadow-card-dark z-20 p-1',
                up ? 'bottom-full mb-2' : 'top-8'
              )}
            >
              {[
                { label: 'View', icon: Eye, action: () => navigate(`/leads/${lead.id}`) },
                { label: 'Edit', icon: Edit, action: () => onEdit(lead) },
                { label: 'Call', icon: Phone, action: () => lead.contact_phone && window.open(`tel:${lead.contact_phone}`) },
                { label: 'Email', icon: Mail, action: () => lead.contact_email && window.open(`mailto:${lead.contact_email}`) },
              ].map(item => (
                <button key={item.label} onClick={() => { item.action(); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-body hover:text-heading hover:bg-white/8 transition-colors">
                  <item.icon className="w-3.5 h-3.5" />{item.label}
                </button>
              ))}
              {canDelete && (
                <div className="border-t border-app mt-1 pt-1">
                  <button onClick={() => { onDelete(lead.id); setOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/8 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />Delete
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Leads() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const canDelete = ['admin', 'manager'].includes(user?.role)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [selectedRows, setSelectedRows] = useState([])
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [editLead, setEditLead] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['leads', page, search, statusFilter, priorityFilter, sourceFilter],
    queryFn: () => api.get('/leads', {
      params: {
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        source: sourceFilter || undefined,
      }
    }),
    keepPreviousData: true,
  })

  const leads = data?.data || []
  const total = data?.pagination?.total || 0

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/leads', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Lead added successfully!')
      setShowAdd(false)
    },
    onError: (err) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/leads/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Lead updated!')
      setEditLead(null)
    },
    onError: (err) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Lead deleted')
    },
    onError: (err) => toast.error(err.message),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => api.delete(`/leads/${id}`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setSelectedRows([])
      toast.success(`${selectedRows.length} leads deleted`)
    },
    onError: (err) => toast.error(err.message),
  })

  const handleSearch = (val) => { setSearch(val); setPage(1) }
  const clearFilters = () => { setStatusFilter(''); setPriorityFilter(''); setSourceFilter(''); setPage(1) }
  const hasFilters = statusFilter || priorityFilter || sourceFilter

  const columns = [
    {
      key: 'contact_name', label: 'Lead', sortable: true, className: 'w-[24%]',
      render: (val, row) => (
        <div className="flex items-center gap-3 cursor-pointer min-w-0" onClick={() => navigate(`/leads/${row.id}`)}>
          <Avatar name={row.contact_name} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-heading hover:text-primary-500 transition-colors truncate">{row.title}</p>
            <p className="text-xs text-muted truncate">{row.contact_name} · {row.contact_email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'contact_phone', label: 'Phone',
      className: 'hidden md:table-cell w-[12%]', cellClassName: 'hidden md:table-cell truncate',
      render: (val) => <span className="text-xs text-body">{val || '—'}</span>
    },
    {
      key: 'company_name', label: 'Company', sortable: true,
      className: 'hidden sm:table-cell w-[14%]', cellClassName: 'hidden sm:table-cell truncate',
      render: (val) => <span className="text-sm text-body">{val || '—'}</span>
    },
    { key: 'status', label: 'Status', sortable: true, className: 'w-[10%]', render: (val) => <StatusBadge status={val} /> },
    { key: 'priority', label: 'Priority', className: 'w-[10%]', render: (val) => <PriorityDot priority={val} /> },
    {
      key: 'source', label: 'Source',
      className: 'hidden lg:table-cell w-[10%]', cellClassName: 'hidden lg:table-cell truncate',
      render: (val) => <span className="text-xs text-body capitalize truncate">{val?.replace('_', ' ')}</span>
    },
    {
      key: 'assignee', label: 'Assigned',
      className: 'hidden lg:table-cell w-[12%]', cellClassName: 'hidden lg:table-cell',
      render: (val) => val ? (
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={val.name} size="xs" />
          <span className="text-xs text-body truncate hidden lg:block">{val.name}</span>
        </div>
      ) : <span className="text-xs text-muted">Unassigned</span>
    },
    {
      key: 'estimated_value', label: 'Value', sortable: true,
      className: 'w-[11%]', cellClassName: 'truncate',
      render: (val) => <span className="text-sm font-semibold text-heading">{val ? formatCurrency(val) : '—'}</span>
    },
    {
      key: 'createdAt', label: 'Created',
      className: 'hidden xl:table-cell w-[10%]', cellClassName: 'hidden xl:table-cell truncate',
      render: (val) => <span className="text-xs text-muted">{formatDate(val)}</span>
    },
    {
      key: 'actions', label: '', className: 'w-[7%]', cellClassName: 'text-right',
      render: (_, row) => (
        <ActionsMenu
          lead={row}
          onEdit={setEditLead}
          onDelete={(id) => deleteMutation.mutate(id)}
          canDelete={canDelete}
        />
      )
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">All Leads</h2>
          <p className="text-sm text-muted">{total} leads total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedRows.length > 0 && canDelete && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
              <span className="text-xs text-muted">{selectedRows.length} selected</span>
              <Button variant="danger" size="sm" onClick={() => bulkDeleteMutation.mutate(selectedRows)} loading={bulkDeleteMutation.isPending}>
                <Trash2 className="w-3.5 h-3.5" />Delete
              </Button>
            </motion.div>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowFilters(p => !p)}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 ml-0.5" />}
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-3.5 h-3.5" />Add Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Select
                  placeholder="All Statuses"
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                  options={STATUSES.map(s => ({ value: s, label: s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) }))}
                />
                <Select
                  placeholder="All Priorities"
                  value={priorityFilter}
                  onChange={e => { setPriorityFilter(e.target.value); setPage(1) }}
                  options={PRIORITIES.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))}
                />
                <Select
                  placeholder="All Sources"
                  value={sourceFilter}
                  onChange={e => { setSourceFilter(e.target.value); setPage(1) }}
                  options={SOURCES.map(s => ({ value: s, label: s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) }))}
                />
                <Button variant="ghost" size="md" onClick={clearFilters} disabled={!hasFilters}>
                  <X className="w-3.5 h-3.5" />Clear
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <Card className="p-0">
        <Table
          columns={columns}
          data={leads}
          loading={isLoading}
          searchable
          searchValue={search}
          onSearch={handleSearch}
          searchPlaceholder="Search leads..."
          selectedRows={selectedRows}
          onSelectRow={(id, checked) => setSelectedRows(prev => checked ? [...prev, id] : prev.filter(r => r !== id))}
          onSelectAll={(checked) => setSelectedRows(checked ? leads.map(r => r.id) : [])}
          pagination={{ page, pageSize: PAGE_SIZE, total }}
          onPageChange={setPage}
          emptyState={
            <EmptyState
              title="No leads found"
              description="Try adjusting your filters or add a new lead."
              action={() => setShowAdd(true)}
              actionLabel="Add Lead"
              type="leads"
            />
          }
          className="p-4"
        />
      </Card>

      {/* Add Modal */}
      <AddLeadModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={(payload) => createMutation.mutateAsync(payload)}
      />

      {/* Edit Modal */}
      <AddLeadModal
        open={!!editLead}
        onClose={() => setEditLead(null)}
        editLead={editLead}
        onAdd={(payload) => updateMutation.mutateAsync({ id: editLead.id, payload })}
      />
    </div>
  )
}
