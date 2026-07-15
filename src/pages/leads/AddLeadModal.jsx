import { useState, useRef, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { Textarea } from '../../components/ui/FormElements'
import Button from '../../components/ui/Button'
import {
  User, Mail, Phone, Building2, DollarSign,
  ChevronDown, Check, Tag, Calendar, Zap, Globe, UserCheck
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../utils'

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES = [
  { value: 'new',         label: 'New',          color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  { value: 'contacted',   label: 'Contacted',    color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  { value: 'qualified',   label: 'Qualified',    color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  { value: 'proposal',    label: 'Proposal',     color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' },
  { value: 'negotiation', label: 'Negotiation',  color: 'bg-pink-500/15 text-pink-400 border-pink-500/20' },
  { value: 'won',         label: 'Won',          color: 'bg-green-500/15 text-green-400 border-green-500/20' },
  { value: 'lost',        label: 'Lost',         color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  { value: 'on_hold',     label: 'On Hold',      color: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
]

const PRIORITIES = [
  { value: 'low',    label: 'Low',    dot: 'bg-gray-400' },
  { value: 'medium', label: 'Medium', dot: 'bg-yellow-400' },
  { value: 'high',   label: 'High',   dot: 'bg-orange-400' },
  { value: 'urgent', label: 'Urgent', dot: 'bg-red-400' },
]

const SOURCES = [
  { value: 'website',       label: 'Website' },
  { value: 'referral',      label: 'Referral' },
  { value: 'cold_call',     label: 'Cold Call' },
  { value: 'email',         label: 'Email' },
  { value: 'social_media',  label: 'Social Media' },
  { value: 'advertisement', label: 'Advertisement' },
  { value: 'event',         label: 'Event' },
  { value: 'other',         label: 'Other' },
]

const schema = z.object({
  title:               z.string().min(2, 'Title is required'),
  contact_name:        z.string().min(2, 'Contact name is required'),
  contact_email:       z.string().email('Invalid email').optional().or(z.literal('')),
  contact_phone:       z.string().optional(),
  company_name:        z.string().optional(),
  status:              z.string().min(1),
  priority:            z.string().min(1),
  source:              z.string().min(1),
  assigned_to:         z.string().optional(),
  estimated_value:     z.string().optional(),
  expected_close_date: z.string().optional(),
  notes:               z.string().optional(),
})

// ─── Custom Dropdown ──────────────────────────────────────────────────────────
function CustomSelect({ label, value, onChange, options, placeholder, error, renderOption, renderValue }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      {label && <label className="text-xs font-medium text-muted uppercase tracking-wide">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={cn(
            'w-full h-10 flex items-center justify-between px-3 rounded-xl border bg-white/5 text-sm transition-all',
            open ? 'border-primary-500/50 ring-2 ring-primary-500/20' : 'border-app hover:border-white/20',
            error ? 'border-red-500/50' : '',
            !selected ? 'text-muted' : 'text-heading'
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selected ? (renderValue ? renderValue(selected) : selected.label) : (placeholder || 'Select...')}
          </span>
          <ChevronDown className={cn('w-4 h-4 text-muted flex-shrink-0 transition-transform', open && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-1.5 border border-white/10 rounded-xl overflow-hidden shadow-card-dark max-h-52 overflow-y-auto" style={{ background: 'rgba(15, 23, 42, 0.97)', backdropFilter: 'blur(8px)' }}
            >
              {options.map(opt => (
                <li
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors text-sm',
                    opt.value === value
                      ? 'bg-primary-500/15 text-primary-500'
                      : 'text-body hover:bg-white/10 hover:text-heading'
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    {renderOption ? renderOption(opt) : opt.label}
                  </span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div className="col-span-2 flex items-center gap-2 pt-1">
      <div className="h-px flex-1 bg-white/8" />
      <span className="text-xs font-semibold text-muted uppercase tracking-widest px-1">{children}</span>
      <div className="h-px flex-1 bg-white/8" />
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function AddLeadModal({ open, onClose, onAdd, editLead = null }) {
  const { user } = useAuth()
  const isAdminOrManager = ['admin', 'manager'].includes(user?.role)

  const { data: usersRes } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.get('/users'),
    enabled: isAdminOrManager && open,
  })
  const users = usersRes?.data || []

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: editLead ? {
      ...editLead,
      assigned_to: editLead.assigned_to ? String(editLead.assigned_to) : '',
      estimated_value: editLead.estimated_value ? String(editLead.estimated_value) : '',
    } : { status: 'new', priority: 'medium', source: 'other' },
  })

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      assigned_to:     data.assigned_to ? parseInt(data.assigned_to) : undefined,
      estimated_value: data.estimated_value ? parseFloat(data.estimated_value) : undefined,
      expected_close_date: data.expected_close_date || undefined,
    }
    await onAdd(payload)
    reset()
  }

  const handleClose = () => { onClose(); reset() }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <p className="text-xs text-muted">Fields marked <span className="text-red-400">*</span> are required</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
              {editLead ? 'Save Changes' : 'Add Lead'}
            </Button>
          </div>
        </div>
      }
    >
      {/* Modal Header */}
      <div className="flex items-center gap-3 mb-6 pb-5 border-b border-app">
        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-primary-500" />
        </div>
        <div>
          <h2 className="text-base font-bold text-heading">{editLead ? 'Edit Lead' : 'Add New Lead'}</h2>
          <p className="text-xs text-muted mt-0.5">Fill in the details to {editLead ? 'update this' : 'create a new'} lead</p>
        </div>
      </div>

      <form className="grid grid-cols-2 gap-x-4 gap-y-3">

        {/* Contact Info */}
        <SectionLabel>Contact Info</SectionLabel>

        <Input
          label="Lead Title *"
          icon={Tag}
          placeholder="e.g. Enterprise Software Deal"
          error={errors.title?.message}
          containerClassName="col-span-2"
          {...register('title')}
        />
        <Input
          label="Contact Name *"
          icon={User}
          placeholder="John Doe"
          error={errors.contact_name?.message}
          {...register('contact_name')}
        />
        <Input
          label="Company"
          icon={Building2}
          placeholder="Company Inc"
          {...register('company_name')}
        />
        <Input
          label="Email"
          icon={Mail}
          type="email"
          placeholder="john@company.com"
          error={errors.contact_email?.message}
          {...register('contact_email')}
        />
        <Input
          label="Phone"
          icon={Phone}
          placeholder="+1 555-0100"
          {...register('contact_phone')}
        />

        {/* Lead Details */}
        <SectionLabel>Lead Details</SectionLabel>

        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Status"
              value={field.value}
              onChange={field.onChange}
              options={STATUSES}
              error={errors.status?.message}
              renderOption={(opt) => (
                <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium border', opt.color)}>
                  {opt.label}
                </span>
              )}
              renderValue={(opt) => (
                <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium border', opt.color)}>
                  {opt.label}
                </span>
              )}
            />
          )}
        />

        <Controller
          name="priority"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Priority"
              value={field.value}
              onChange={field.onChange}
              options={PRIORITIES}
              error={errors.priority?.message}
              renderOption={(opt) => (
                <span className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0', opt.dot)} />
                  {opt.label}
                </span>
              )}
              renderValue={(opt) => (
                <span className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0', opt.dot)} />
                  {opt.label}
                </span>
              )}
            />
          )}
        />

        <Controller
          name="source"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Source"
              value={field.value}
              onChange={field.onChange}
              options={SOURCES}
              error={errors.source?.message}
              renderOption={(opt) => (
                <span className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-muted" />
                  {opt.label}
                </span>
              )}
            />
          )}
        />

        {isAdminOrManager && (
          <Controller
            name="assigned_to"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="Assign To"
                placeholder="Select agent"
                value={field.value}
                onChange={field.onChange}
                options={users.map(u => ({ value: String(u.id), label: u.name, role: u.role }))}
                renderOption={(opt) => (
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-500 flex-shrink-0">
                      {opt.label.charAt(0).toUpperCase()}
                    </span>
                    <span>
                      <span className="block text-sm text-heading">{opt.label}</span>
                      <span className="block text-xs text-muted capitalize">{opt.role}</span>
                    </span>
                  </span>
                )}
                renderValue={(opt) => (
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-primary-500" />
                    {opt.label}
                  </span>
                )}
              />
            )}
          />
        )}

        {/* Financial */}
        <SectionLabel>Financial & Timeline</SectionLabel>

        <Input
          label="Estimated Value"
          icon={DollarSign}
          type="number"
          placeholder="50000"
          {...register('estimated_value')}
        />
        <Input
          label="Expected Close Date"
          icon={Calendar}
          type="date"
          {...register('expected_close_date')}
        />

        {/* Notes */}
        <Textarea
          label="Notes"
          placeholder="Add any relevant notes about this lead..."
          rows={2}
          containerClassName="col-span-2"
          {...register('notes')}
        />
      </form>
    </Modal>
  )
}
