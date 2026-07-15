import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Phone, Mail, User } from 'lucide-react'
import { Card, Avatar } from '../../components/ui'
import Button from '../../components/ui/Button'
import { PIPELINE_STAGES } from '../../constants'
import { cn } from '../../utils'
import api from '../../services/api'
import toast from 'react-hot-toast'

const formatINR = (amount) => `Rs ${new Intl.NumberFormat('en-IN').format(Number(amount) || 0)}`

function mapLead(l) {
  return {
    id: l.id,
    name: l.contact_name || l.title,
    company: l.company_name || '',
    priority: l.priority,
    budget: Number(l.estimated_value) || 0,
    assignedTo: l.assignee?.name || 'Unassigned',
    status: l.status,
    avatar: l.avatar,
  }
}

function LeadCard({ lead, onDragStart }) {
  const priorityColors = { low: 'bg-gray-400', medium: 'bg-yellow-400', high: 'bg-orange-400', urgent: 'bg-red-400' }
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      className="glass rounded-xl p-3.5 cursor-grab active:cursor-grabbing border border-app hover:border-primary-500/20 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Avatar name={lead.name} size="xs" />
          <div>
            <p className="text-xs font-semibold text-heading leading-tight">{lead.name}</p>
            <p className="text-xs text-muted">{lead.company}</p>
          </div>
        </div>
        <div className={cn('w-2 h-2 rounded-full mt-1 flex-shrink-0', priorityColors[lead.priority])} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary-500">{formatINR(lead.budget)}</span>
        <div className="flex items-center gap-1">
          <button className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-muted hover:text-heading transition-colors">
            <Phone className="w-3 h-3" />
          </button>
          <button className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-muted hover:text-heading transition-colors">
            <Mail className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-app">
        <User className="w-3 h-3 text-muted" />
        <span className="text-xs text-muted">{lead.assignedTo}</span>
      </div>
    </motion.div>
  )
}

function KanbanColumn({ stage, leads, onDrop, onDragOver, onDragLeave, isDragOver }) {
  const total = leads.reduce((sum, l) => sum + (Number(l.budget) || 0), 0)
  return (
    <div
      onDrop={(e) => onDrop(e, stage.id)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={cn(
        'flex flex-col min-w-[260px] w-[260px] rounded-2xl border transition-all duration-200',
        isDragOver ? 'border-primary-500/40 bg-primary-500/5' : 'border-app bg-white/3'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-app">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
          <span className="text-xs font-semibold text-heading">{stage.label}</span>
          <span className="text-xs bg-white/10 text-muted px-1.5 py-0.5 rounded-md">{leads.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-primary-500">{formatINR(total)}</span>
          <Button variant="ghost" size="icon-sm">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2.5 space-y-2 min-h-[200px] overflow-y-auto scrollbar-thin max-h-[calc(100vh-280px)]">
        <AnimatePresence>
          {leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onDragStart={(e, l) => {
                e.dataTransfer.setData('leadId', l.id)
                e.dataTransfer.setData('fromStage', stage.id)
              }}
            />
          ))}
        </AnimatePresence>
        {leads.length === 0 && (
          <div className={cn(
            'h-20 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors',
            isDragOver ? 'border-primary-500/40 bg-primary-500/5' : 'border-app'
          )}>
            <p className="text-xs text-muted">Drop here</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Pipeline() {
  const queryClient = useQueryClient()
  const [leads, setLeads] = useState([])
  const [dragOverStage, setDragOverStage] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['pipeline-leads'],
    queryFn: () => api.get('/leads', { params: { limit: 1000 } }),
  })

  useEffect(() => {
    if (data?.data) setLeads(data.data.map(mapLead))
  }, [data])

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/leads/${id}/status`, { status }),
    onMutate: ({ id, status }) => {
      const prevLeads = leads
      setLeads(prev => prev.map(l => String(l.id) === String(id) ? { ...l, status } : l))
      return { prevLeads }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pipeline-leads'] }),
    onError: (err, _vars, ctx) => {
      if (ctx?.prevLeads) setLeads(ctx.prevLeads)
      toast.error(err?.message || 'Failed to move lead')
    },
  })

  const handleDrop = (e, toStage) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('leadId')
    const fromStage = e.dataTransfer.getData('fromStage')
    setDragOverStage(null)
    if (!leadId || fromStage === toStage) return
    statusMutation.mutate({ id: leadId, status: toStage })
    toast.success(`Lead moved to ${PIPELINE_STAGES.find(s => s.id === toStage)?.label}`)
  }

  const totalRevenue = leads.filter(l => l.status === 'won').reduce((sum, l) => sum + (Number(l.budget) || 0), 0)
  const totalPipeline = leads.filter(l => !['won', 'lost'].includes(l.status)).reduce((sum, l) => sum + (Number(l.budget) || 0), 0)
  const wonCount = leads.filter(l => l.status === 'won').length
  const winRate = leads.length ? Math.round((wonCount / leads.length) * 100) : 0

  return (
    <div className="space-y-5">
      {isLoading && <p className="text-sm text-muted">Loading pipeline…</p>}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: leads.length, color: 'text-brand-blue' },
          { label: 'Pipeline Value', value: formatINR(totalPipeline), color: 'text-brand-purple' },
          { label: 'Won Revenue', value: formatINR(totalRevenue), color: 'text-primary-500' },
          { label: 'Win Rate', value: `${winRate}%`, color: 'text-yellow-400' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className="text-center py-4">
              <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-muted mt-1">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {PIPELINE_STAGES.map(stage => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              leads={leads.filter(l => l.status === stage.id)}
              isDragOver={dragOverStage === stage.id}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id) }}
              onDragLeave={() => setDragOverStage(null)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
