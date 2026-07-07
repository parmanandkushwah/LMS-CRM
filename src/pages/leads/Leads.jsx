import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Filter, Download, Upload, Trash2, MoreHorizontal,
  Eye, Edit, Phone, Mail, SlidersHorizontal
} from 'lucide-react'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import { Badge, Avatar, Card } from '../../components/ui'
import { Select } from '../../components/ui/FormElements'
import EmptyState from '../../components/ui/EmptyState'
import { MOCK_LEADS, LEAD_STATUSES, LEAD_PRIORITIES, LEAD_SOURCES } from '../../constants'
import { cn, formatCurrency, formatDate, STATUS_COLORS, PRIORITY_COLORS } from '../../utils'
import toast from 'react-hot-toast'
import AddLeadModal from './AddLeadModal'

function StatusBadge({ status }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize', STATUS_COLORS[status] || STATUS_COLORS.new)}>
      {status}
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

function ActionsMenu({ lead, onDelete }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  return (
    <div className="relative">
      <Button variant="ghost" size="icon-sm" onClick={() => setOpen(p => !p)}>
        <MoreHorizontal className="w-4 h-4" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-0 top-8 w-40 glass rounded-xl border border-app shadow-card-dark z-20 p-1"
          >
            {[
              { label: 'View', icon: Eye, action: () => navigate(`/leads/${lead.id}`) },
              { label: 'Edit', icon: Edit, action: () => {} },
              { label: 'Call', icon: Phone, action: () => {} },
              { label: 'Email', icon: Mail, action: () => {} },
            ].map(item => (
              <button key={item.label} onClick={() => { item.action(); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-body hover:text-heading hover:bg-white/8 transition-colors">
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
            <div className="border-t border-app mt-1 pt-1">
              <button onClick={() => { onDelete(lead.id); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/8 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}

export default function Leads() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState(MOCK_LEADS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [selectedRows, setSelectedRows] = useState([])
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const PAGE_SIZE = 6

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const q = search.toLowerCase()
      const matchSearch = !q || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.company.toLowerCase().includes(q)
      const matchStatus = !statusFilter || l.status === statusFilter
      const matchPriority = !priorityFilter || l.priority === priorityFilter
      const matchSource = !sourceFilter || l.source === sourceFilter
      return matchSearch && matchStatus && matchPriority && matchSource
    })
  }, [leads, search, statusFilter, priorityFilter, sourceFilter])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleDelete = (id) => {
    setLeads(prev => prev.filter(l => l.id !== id))
    toast.success('Lead deleted')
  }

  const handleBulkDelete = () => {
    setLeads(prev => prev.filter(l => !selectedRows.includes(l.id)))
    setSelectedRows([])
    toast.success(`${selectedRows.length} leads deleted`)
  }

  const columns = [
    {
      key: 'name', label: 'Lead', sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/leads/${row.id}`)}>
          <Avatar name={row.name} size="sm" />
          <div>
            <p className="text-sm font-medium text-heading hover:text-primary-500 transition-colors">{row.name}</p>
            <p className="text-xs text-muted">{row.email}</p>
          </div>
        </div>
      )
    },
    { key: 'phone', label: 'Phone', render: (val) => <span className="text-xs text-body">{val}</span> },
    { key: 'company', label: 'Company', sortable: true, render: (val) => <span className="text-sm text-body">{val}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (val) => <StatusBadge status={val} /> },
    { key: 'priority', label: 'Priority', render: (val) => <PriorityDot priority={val} /> },
    { key: 'source', label: 'Source', render: (val) => <span className="text-xs text-body">{val}</span> },
    { key: 'assignedTo', label: 'Assigned', render: (val) => (
      <div className="flex items-center gap-2">
        <Avatar name={val} size="xs" />
        <span className="text-xs text-body hidden lg:block">{val}</span>
      </div>
    )},
    { key: 'budget', label: 'Budget', sortable: true, render: (val) => <span className="text-sm font-semibold text-heading">{formatCurrency(val)}</span> },
    { key: 'createdAt', label: 'Created', render: (val) => <span className="text-xs text-muted">{formatDate(val)}</span> },
    {
      key: 'actions', label: '', cellClassName: 'text-right',
      render: (_, row) => <ActionsMenu lead={row} onDelete={handleDelete} />
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">All Leads</h2>
          <p className="text-sm text-muted">{filtered.length} leads total</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
              <span className="text-xs text-muted">{selectedRows.length} selected</span>
              <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            </motion.div>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowFilters(p => !p)}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.success('Exported!')}>
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
          <Card className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Select
                placeholder="All Statuses"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                options={LEAD_STATUSES.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
              />
              <Select
                placeholder="All Priorities"
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                options={['low', 'medium', 'high', 'urgent'].map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))}
              />
              <Select
                placeholder="All Sources"
                value={sourceFilter}
                onChange={e => setSourceFilter(e.target.value)}
                options={LEAD_SOURCES.map(s => ({ value: s, label: s }))}
              />
              <Button variant="ghost" size="md" onClick={() => { setStatusFilter(''); setPriorityFilter(''); setSourceFilter('') }}>
                Clear Filters
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <Table
          columns={columns}
          data={paginated}
          searchable
          searchValue={search}
          onSearch={setSearch}
          searchPlaceholder="Search leads..."
          selectedRows={selectedRows}
          onSelectRow={(id, checked) => setSelectedRows(prev => checked ? [...prev, id] : prev.filter(r => r !== id))}
          onSelectAll={(checked) => setSelectedRows(checked ? paginated.map(r => r.id) : [])}
          pagination={{ page, pageSize: PAGE_SIZE, total: filtered.length }}
          onPageChange={setPage}
          emptyState={<EmptyState title="No leads found" description="Try adjusting your filters or add a new lead." action={() => setShowAdd(true)} actionLabel="Add Lead" type="leads" />}
          className="p-4"
        />
      </Card>

      <AddLeadModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={(lead) => {
        setLeads(prev => [{ ...lead, id: String(prev.length + 1), createdAt: new Date().toISOString().split('T')[0] }, ...prev])
        setShowAdd(false)
        toast.success('Lead added successfully!')
      }} />
    </div>
  )
}
