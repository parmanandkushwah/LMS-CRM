import { motion } from 'framer-motion'
import { Building2, FolderOpen, ChevronRight } from 'lucide-react'
import { Card, Avatar } from '../../components/ui'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export function Calendar() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const events = [8, 14, 18, 22, 25]

  return (
    <div className="space-y-5 max-w-3xl">
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-heading">
            {today.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon-sm">‹</Button>
            <Button variant="ghost" size="icon-sm">›</Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {days.map(d => <div key={d} className="text-center text-xs font-semibold text-muted py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
            <motion.div
              key={day}
              whileHover={{ scale: 1.1 }}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm cursor-pointer transition-all relative
                ${day === today.getDate() ? 'bg-primary-500 text-white font-bold' : 'hover:bg-white/8 text-body'}
              `}
            >
              {day}
              {events.includes(day) && day !== today.getDate() && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary-500" />
              )}
            </motion.div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="text-sm font-semibold text-heading mb-3">Upcoming Events</h3>
        <div className="space-y-2">
          {[
            { title: 'Demo with Michael Brown', time: '10:00 AM', date: 'Today', color: 'bg-brand-blue' },
            { title: 'Team standup', time: '9:00 AM', date: 'Tomorrow', color: 'bg-primary-500' },
            { title: 'Proposal review - James Wilson', time: '2:00 PM', date: 'Feb 14', color: 'bg-brand-purple' },
          ].map((e, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/4 transition-colors">
              <div className={`w-1 h-10 rounded-full ${e.color}`} />
              <div>
                <p className="text-sm font-medium text-heading">{e.title}</p>
                <p className="text-xs text-muted">{e.date} · {e.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function Companies() {
  const companies = [
    { name: 'TechCorp Inc', industry: 'Technology', leads: 3, revenue: '$145K', employees: '50-200' },
    { name: 'Innovate.io', industry: 'SaaS', leads: 2, revenue: '$220K', employees: '11-50' },
    { name: 'Enterprise Co', industry: 'Enterprise', leads: 1, revenue: '$250K', employees: '500+' },
    { name: 'GlobalTech', industry: 'Technology', leads: 2, revenue: '$85K', employees: '200-500' },
    { name: 'CloudBase', industry: 'Cloud', leads: 1, revenue: '$320K', employees: '50-200' },
    { name: 'DataFlow', industry: 'Analytics', leads: 1, revenue: '$55K', employees: '11-50' },
  ]
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((c, i) => (
          <motion.div key={c.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card hover className="cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue/20 to-brand-purple/20 border border-app flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-brand-blue" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-heading">{c.name}</h3>
                  <p className="text-xs text-muted">{c.industry}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[{ label: 'Leads', value: c.leads }, { label: 'Revenue', value: c.revenue }, { label: 'Size', value: c.employees }].map(s => (
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
    </div>
  )
}

export function Documents() {
  const docs = [
    { name: 'Q4 Sales Report.pdf', size: '2.4 MB', type: 'PDF', date: 'Jan 15' },
    { name: 'Enterprise Proposal.docx', size: '1.1 MB', type: 'DOC', date: 'Jan 18' },
    { name: 'Product Demo.mp4', size: '45 MB', type: 'VIDEO', date: 'Jan 20' },
    { name: 'Contract Template.pdf', size: '0.8 MB', type: 'PDF', date: 'Jan 22' },
    { name: 'Pricing Sheet.xlsx', size: '0.3 MB', type: 'XLS', date: 'Jan 25' },
  ]
  const typeColors = {
    PDF: 'text-red-400 bg-red-500/10',
    DOC: 'text-brand-blue bg-brand-blue/10',
    VIDEO: 'text-brand-purple bg-brand-purple/10',
    XLS: 'text-primary-500 bg-primary-500/10',
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-heading">Documents</h2>
        <Button size="sm" onClick={() => toast.success('Upload feature coming soon!')}>
          <FolderOpen className="w-3.5 h-3.5" />Upload
        </Button>
      </div>
      <Card className="p-0 overflow-hidden">
        {docs.map((doc, i) => (
          <motion.div key={doc.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
            className="flex items-center gap-4 px-5 py-3.5 border-b border-app last:border-0 hover:bg-white/4 transition-colors cursor-pointer">
            <div className={`px-2 py-1 rounded-md text-xs font-bold ${typeColors[doc.type]}`}>{doc.type}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-heading truncate">{doc.name}</p>
              <p className="text-xs text-muted">{doc.size} · {doc.date}</p>
            </div>
            <Button variant="ghost" size="icon-sm"><ChevronRight className="w-4 h-4" /></Button>
          </motion.div>
        ))}
      </Card>
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
