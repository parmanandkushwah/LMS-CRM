import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MoreHorizontal, Phone, Mail, DollarSign, User } from 'lucide-react'
import { Card, Avatar, Badge } from '../../components/ui'
import Button from '../../components/ui/Button'
import { PIPELINE_STAGES, MOCK_LEADS } from '../../constants'
import { cn, formatCurrency, STATUS_COLORS } from '../../utils'
import toast from 'react-hot-toast'

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
        <span className="text-xs font-bold text-primary-500">{formatCurrency(lead.budget)}</span>
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
  const total = leads.reduce((sum, l) => sum + l.budget, 0)
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
          <span className="text-xs font-semibold text-primary-500">{formatCurrency(total)}</span>
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
  const [leads, setLeads] = useState(MOCK_LEADS)
  const [dragOverStage, setDragOverStage] = useState(null)

  const handleDrop = (e, toStage) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('leadId')
    const fromStage = e.dataTransfer.getData('fromStage')
    if (fromStage === toStage) { setDragOverStage(null); return }
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: toStage } : l))
    setDragOverStage(null)
    toast.success(`Lead moved to ${PIPELINE_STAGES.find(s => s.id === toStage)?.label}`)
  }

  const totalRevenue = leads.filter(l => l.status === 'won').reduce((sum, l) => sum + l.budget, 0)
  const totalPipeline = leads.filter(l => !['won', 'lost'].includes(l.status)).reduce((sum, l) => sum + l.budget, 0)

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: leads.length, color: 'text-brand-blue' },
          { label: 'Pipeline Value', value: formatCurrency(totalPipeline), color: 'text-brand-purple' },
          { label: 'Won Revenue', value: formatCurrency(totalRevenue), color: 'text-primary-500' },
          { label: 'Win Rate', value: `${Math.round((leads.filter(l => l.status === 'won').length / leads.length) * 100)}%`, color: 'text-yellow-400' },
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
