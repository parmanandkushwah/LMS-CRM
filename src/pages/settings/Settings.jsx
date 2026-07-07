import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, User, Palette, Shield, Bell, CreditCard, Mail, Key, Globe, Upload } from 'lucide-react'
import { Card } from '../../components/ui'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Switch } from '../../components/ui/FormElements'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'theme', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'smtp', label: 'SMTP', icon: Mail },
]

function CompanySettings() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-heading mb-1">Company Information</h3>
        <p className="text-xs text-muted">Update your company details</p>
      </div>
      <div className="flex items-center gap-4 p-4 rounded-xl border border-app bg-white/3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-brand-blue flex items-center justify-center text-white text-xl font-bold">L</div>
        <div>
          <p className="text-sm font-medium text-heading">Company Logo</p>
          <p className="text-xs text-muted mb-2">PNG, JPG up to 2MB</p>
          <Button variant="outline" size="sm"><Upload className="w-3.5 h-3.5" />Upload Logo</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Company Name" defaultValue="LeadFlow Inc" />
        <Input label="Website" icon={Globe} defaultValue="https://leadflow.dev" />
        <Input label="Industry" defaultValue="SaaS / Technology" />
        <Input label="Company Size" defaultValue="11-50 employees" />
        <Input label="Phone" defaultValue="+1 555-0100" />
        <Input label="Address" defaultValue="San Francisco, CA" />
      </div>
      <Button onClick={() => toast.success('Company settings saved!')}>Save Changes</Button>
    </div>
  )
}

function ProfileSettings() {
  const { user } = useAuth()
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-heading mb-1">Personal Information</h3>
        <p className="text-xs text-muted">Update your personal details</p>
      </div>
      <div className="flex items-center gap-4 p-4 rounded-xl border border-app bg-white/3">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-brand-blue flex items-center justify-center text-white text-xl font-bold">
          {user?.name?.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium text-heading">Profile Photo</p>
          <p className="text-xs text-muted mb-2">PNG, JPG up to 2MB</p>
          <Button variant="outline" size="sm"><Upload className="w-3.5 h-3.5" />Upload Photo</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name" defaultValue={user?.name} />
        <Input label="Email" type="email" defaultValue={user?.email} />
        <Input label="Phone" defaultValue="+1 555-1001" />
        <Input label="Role" defaultValue={user?.role} />
        <Input label="New Password" type="password" placeholder="Leave blank to keep current" />
        <Input label="Confirm Password" type="password" placeholder="Confirm new password" />
      </div>
      <Button onClick={() => toast.success('Profile updated!')}>Save Changes</Button>
    </div>
  )
}

function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  const themes = [
    { value: 'light', label: 'Light', desc: 'Clean and bright interface' },
    { value: 'dark', label: 'Dark', desc: 'Easy on the eyes' },
    { value: 'system', label: 'System', desc: 'Follows your OS preference' },
  ]
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-heading mb-1">Appearance</h3>
        <p className="text-xs text-muted">Customize how LeadFlow looks</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {themes.map(t => (
          <button
            key={t.value}
            onClick={() => { setTheme(t.value); toast.success(`${t.label} theme applied!`) }}
            className={`p-4 rounded-xl border-2 text-left transition-all ${theme === t.value ? 'border-primary-500 bg-primary-500/8' : 'border-app hover:border-white/20'}`}
          >
            <p className="text-sm font-semibold text-heading">{t.label}</p>
            <p className="text-xs text-muted mt-0.5">{t.desc}</p>
            {theme === t.value && <div className="w-2 h-2 rounded-full bg-primary-500 mt-2" />}
          </button>
        ))}
      </div>
    </div>
  )
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    newLead: true, dealWon: true, taskDue: true, followUp: true,
    emailDigest: false, weeklyReport: true, teamActivity: false,
  })
  const toggle = (key) => setSettings(p => ({ ...p, [key]: !p[key] }))
  const items = [
    { key: 'newLead', label: 'New Lead Added', desc: 'When a new lead is created' },
    { key: 'dealWon', label: 'Deal Won', desc: 'When a deal is marked as won' },
    { key: 'taskDue', label: 'Task Due', desc: 'When a task is due soon' },
    { key: 'followUp', label: 'Follow Up Reminder', desc: 'Scheduled follow-up reminders' },
    { key: 'emailDigest', label: 'Daily Email Digest', desc: 'Daily summary via email' },
    { key: 'weeklyReport', label: 'Weekly Report', desc: 'Weekly performance report' },
    { key: 'teamActivity', label: 'Team Activity', desc: 'Updates from your team' },
  ]
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-heading mb-1">Notification Preferences</h3>
        <p className="text-xs text-muted">Choose what you want to be notified about</p>
      </div>
      <div className="space-y-1">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-white/4 transition-colors">
            <div>
              <p className="text-sm font-medium text-heading">{item.label}</p>
              <p className="text-xs text-muted">{item.desc}</p>
            </div>
            <Switch checked={settings[item.key]} onChange={() => toggle(item.key)} />
          </div>
        ))}
      </div>
      <Button onClick={() => toast.success('Notification settings saved!')}>Save Preferences</Button>
    </div>
  )
}

function SecuritySettings() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-heading mb-1">Security Settings</h3>
        <p className="text-xs text-muted">Manage your account security</p>
      </div>
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-heading">Two-Factor Authentication</p>
            <p className="text-xs text-muted">Add an extra layer of security</p>
          </div>
          <Button variant="outline" size="sm"><Shield className="w-3.5 h-3.5" />Enable 2FA</Button>
        </div>
        <div className="border-t border-app pt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-heading">Active Sessions</p>
            <p className="text-xs text-muted">2 active sessions</p>
          </div>
          <Button variant="danger" size="sm">Revoke All</Button>
        </div>
      </Card>
      <div className="space-y-3">
        <Input label="Current Password" type="password" placeholder="Enter current password" />
        <Input label="New Password" type="password" placeholder="Enter new password" />
        <Input label="Confirm Password" type="password" placeholder="Confirm new password" />
      </div>
      <Button onClick={() => toast.success('Password updated!')}>Update Password</Button>
    </div>
  )
}

function SMTPSettings() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-heading mb-1">SMTP Configuration</h3>
        <p className="text-xs text-muted">Configure email sending settings</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="SMTP Host" placeholder="smtp.gmail.com" />
        <Input label="SMTP Port" placeholder="587" />
        <Input label="Username" placeholder="your@email.com" />
        <Input label="Password" type="password" placeholder="App password" />
        <Input label="From Name" placeholder="LeadFlow CRM" />
        <Input label="From Email" placeholder="noreply@leadflow.dev" />
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => toast.success('Test email sent!')}>Send Test Email</Button>
        <Button onClick={() => toast.success('SMTP settings saved!')}>Save Configuration</Button>
      </div>
    </div>
  )
}

const TAB_CONTENT = { company: CompanySettings, profile: ProfileSettings, theme: ThemeSettings, notifications: NotificationSettings, security: SecuritySettings, smtp: SMTPSettings }

export default function Settings() {
  const [activeTab, setActiveTab] = useState('company')
  const ActiveContent = TAB_CONTENT[activeTab]

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar */}
        <div className="lg:w-52 flex-shrink-0">
          <Card className="p-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                  activeTab === tab.id ? 'bg-primary-500/10 text-primary-500' : 'text-muted hover:text-heading hover:bg-white/8'
                )}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          <Card>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <ActiveContent />
              </motion.div>
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
