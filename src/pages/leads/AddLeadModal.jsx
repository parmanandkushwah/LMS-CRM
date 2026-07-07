import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { Select, Textarea } from '../../components/ui/FormElements'
import Button from '../../components/ui/Button'
import { LEAD_STATUSES, LEAD_PRIORITIES, LEAD_SOURCES, MOCK_EMPLOYEES } from '../../constants'
import { User, Mail, Phone, Building2, DollarSign } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Invalid phone number'),
  company: z.string().min(1, 'Company is required'),
  status: z.string().min(1, 'Status is required'),
  priority: z.string().min(1, 'Priority is required'),
  source: z.string().min(1, 'Source is required'),
  assignedTo: z.string().min(1, 'Assign to someone'),
  budget: z.string().min(1, 'Budget is required'),
  notes: z.string().optional(),
})

export default function AddLeadModal({ open, onClose, onAdd }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { status: 'new', priority: 'medium' }
  })

  const onSubmit = async (data) => {
    await new Promise(r => setTimeout(r, 500))
    onAdd({ ...data, budget: Number(data.budget) })
    reset()
  }

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); reset() }}
      title="Add New Lead"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => { onClose(); reset() }}>Cancel</Button>
          <Button loading={isSubmitting} onClick={handleSubmit(onSubmit)}>Add Lead</Button>
        </>
      }
    >
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name" icon={User} placeholder="John Doe" error={errors.name?.message} {...register('name')} />
        <Input label="Email" icon={Mail} type="email" placeholder="john@company.com" error={errors.email?.message} {...register('email')} />
        <Input label="Phone" icon={Phone} placeholder="+1 555-0100" error={errors.phone?.message} {...register('phone')} />
        <Input label="Company" icon={Building2} placeholder="Company Inc" error={errors.company?.message} {...register('company')} />
        <Select
          label="Status"
          error={errors.status?.message}
          options={LEAD_STATUSES.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
          {...register('status')}
        />
        <Select
          label="Priority"
          error={errors.priority?.message}
          options={['low', 'medium', 'high', 'urgent'].map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))}
          {...register('priority')}
        />
        <Select
          label="Source"
          placeholder="Select source"
          error={errors.source?.message}
          options={LEAD_SOURCES.map(s => ({ value: s, label: s }))}
          {...register('source')}
        />
        <Select
          label="Assign To"
          placeholder="Select employee"
          error={errors.assignedTo?.message}
          options={MOCK_EMPLOYEES.map(e => ({ value: e.name, label: e.name }))}
          {...register('assignedTo')}
        />
        <Input label="Budget ($)" icon={DollarSign} type="number" placeholder="50000" error={errors.budget?.message} {...register('budget')} />
        <Textarea label="Notes" placeholder="Additional notes..." rows={3} containerClassName="sm:col-span-2" {...register('notes')} />
      </form>
    </Modal>
  )
}
