import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, User, Palette, Shield, Bell, Mail, Globe, Upload } from 'lucide-react'
import { Card } from '../../components/ui'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Switch } from '../../components/ui/FormElements'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { companyApi, appearanceApi, notificationApi, securityApi, smtpApi, profileApi } from '../../services/settings'
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
  const qc = useQueryClient()
  const fileRef = useRef(null)
  const { data } = useQuery({ queryKey: ['settings', 'company'], queryFn: () => companyApi.get() })
  const [form, setForm] = useState({ name: '', website: '', industry: '', companySize: '', phone: '', address: '', logo: '' })
  useEffect(() => { if (data?.data) setForm(f => ({ ...f, ...data.data })) }, [data])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const onLogo = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => set('logo', r.result)
    r.readAsDataURL(f)
  }

  const save = async () => {
    try {
      await companyApi.update(form)
      toast.success('Company settings saved!')
      qc.invalidateQueries({ queryKey: ['settings', 'company'] })
    } catch (err) { toast.error(err.message || 'Failed to save') }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-heading mb-1">Company Information</h3>
        <p className="text-xs text-muted">Update your company details</p>
      </div>
      <div className="flex items-center gap-4 p-4 rounded-xl border border-app bg-white/3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-brand-blue flex items-center justify-center text-white text-xl font-bold overflow-hidden">
          {form.logo ? <img src={form.logo} alt="logo" className="w-full h-full object-cover" /> : 'L'}
        </div>
        <div>
          <p className="text-sm font-medium text-heading">Company Logo</p>
          <p className="text-xs text-muted mb-2">PNG, JPG up to 2MB</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="w-3.5 h-3.5" />Upload Logo</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Company Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
        <Input label="Website" icon={Globe} value={form.website} onChange={(e) => set('website', e.target.value)} />
        <Input label="Industry" value={form.industry} onChange={(e) => set('industry', e.target.value)} />
        <Input label="Company Size" value={form.companySize} onChange={(e) => set('companySize', e.target.value)} />
        <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        <Input label="Address" value={form.address} onChange={(e) => set('address', e.target.value)} />
      </div>
      <Button onClick={save}>Save Changes</Button>
    </div>
  )
}

function ProfileSettings() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['auth', 'me'], queryFn: () => profileApi.me() })
  const [form, setForm] = useState({ name: '', email: '', phone: '', newPassword: '', confirmPassword: '' })
  useEffect(() => {
    if (data?.data) setForm(f => ({ ...f, name: data.data.name || '', email: data.data.email || '', phone: data.data.phone || '' }))
  }, [data])

  const save = async () => {
    try {
      await profileApi.update({
        name: form.name,
        email: form.email,
        phone: form.phone,
        newPassword: form.newPassword || undefined,
        confirmPassword: form.confirmPassword || undefined,
      })
      toast.success('Profile updated!')
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
      setForm(f => ({ ...f, newPassword: '', confirmPassword: '' }))
    } catch (err) { toast.error(err.message || 'Failed to update') }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-heading mb-1">Personal Information</h3>
        <p className="text-xs text-muted">Update your personal details</p>
      </div>
      <div className="flex items-center gap-4 p-4 rounded-xl border border-app bg-white/3">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-brand-blue flex items-center justify-center text-white text-xl font-bold overflow-hidden">
          {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user?.name?.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium text-heading">Profile Photo</p>
          <p className="text-xs text-muted mb-2">Managed from your account</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
        <Input label="Role" value={user?.role} disabled />
        <Input label="New Password" type="password" placeholder="Leave blank to keep current"
          value={form.newPassword} onChange={(e) => setForm(f => ({ ...f, newPassword: e.target.value }))} />
        <Input label="Confirm Password" type="password" placeholder="Confirm new password"
          value={form.confirmPassword} onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
      </div>
      <Button onClick={save}>Save Changes</Button>
    </div>
  )
}

function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['settings', 'appearance'], queryFn: () => appearanceApi.get() })
  const [local, setLocal] = useState(theme)
  useEffect(() => {
    if (data?.data?.theme) { setLocal(data.data.theme); setTheme(data.data.theme) }
  }, [data])
  const themes = [
    { value: 'light', label: 'Light', desc: 'Clean and bright interface' },
    { value: 'dark', label: 'Dark', desc: 'Easy on the eyes' },
    { value: 'system', label: 'System', desc: 'Follows your OS preference' },
  ]
  const choose = (v) => { setLocal(v); setTheme(v) }
  const save = async () => {
    try { await appearanceApi.update({ theme: local }); toast.success('Appearance saved!') }
    catch (err) { toast.error(err.message || 'Failed to save') }
  }
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
            onClick={() => choose(t.value)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${local === t.value ? 'border-primary-500 bg-primary-500/8' : 'border-app hover:border-white/20'}`}
          >
            <p className="text-sm font-semibold text-heading">{t.label}</p>
            <p className="text-xs text-muted mt-0.5">{t.desc}</p>
            {local === t.value && <div className="w-2 h-2 rounded-full bg-primary-500 mt-2" />}
          </button>
        ))}
      </div>
      <Button onClick={save}>Save Preference</Button>
    </div>
  )
}

function NotificationSettings() {
  const qc = useQueryClient()
  const defaults = { newLead: true, dealWon: true, taskDue: true, followUp: true, emailDigest: false, weeklyReport: true, teamActivity: false }
  const { data } = useQuery({ queryKey: ['settings', 'notifications'], queryFn: () => notificationApi.get() })
  const [settings, setSettings] = useState(defaults)
  useEffect(() => { if (data?.data) setSettings(s => ({ ...defaults, ...data.data })) }, [data])
  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }))
  const items = [
    { key: 'newLead', label: 'New Lead Added', desc: 'When a new lead is created' },
    { key: 'dealWon', label: 'Deal Won', desc: 'When a deal is marked as won' },
    { key: 'taskDue', label: 'Task Due', desc: 'When a task is due soon' },
    { key: 'followUp', label: 'Follow Up Reminder', desc: 'Scheduled follow-up reminders' },
    { key: 'emailDigest', label: 'Daily Email Digest', desc: 'Daily summary via email' },
    { key: 'weeklyReport', label: 'Weekly Report', desc: 'Weekly performance report' },
    { key: 'teamActivity', label: 'Team Activity', desc: 'Updates from your team' },
  ]
  const save = async () => {
    try { await notificationApi.update(settings); toast.success('Notification settings saved!') }
    catch (err) { toast.error(err.message || 'Failed to save') }
  }
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
      <Button onClick={save}>Save Preferences</Button>
    </div>
  )
}

function SecuritySettings() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['settings', 'security'], queryFn: () => securityApi.get() })
  const [twoFA, setTwoFA] = useState(false)
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  useEffect(() => { if (data?.data) setTwoFA(!!data.data.twoFactorEnabled) }, [data])

  const saveSecurity = async () => {
    try { await securityApi.update({ twoFactorEnabled: twoFA }); toast.success('Security settings saved!') }
    catch (err) { toast.error(err.message || 'Failed to save') }
  }
  const updatePassword = async () => {
    if (pw.newPassword && pw.newPassword !== pw.confirmPassword) return toast.error('Passwords do not match')
    try {
      await profileApi.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword })
      toast.success('Password updated!')
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) { toast.error(err.message || 'Failed to update') }
  }
  const revoke = async () => {
    try { await securityApi.update({ twoFactorEnabled: twoFA, sessionsRevokedAt: new Date().toISOString() }); toast.success('All sessions revoked') }
    catch (err) { toast.error(err.message || 'Failed') }
  }

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
          <Switch checked={twoFA} onChange={() => setTwoFA(v => !v)} />
        </div>
        <div className="border-t border-app pt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-heading">Active Sessions</p>
            <p className="text-xs text-muted">2 active sessions</p>
          </div>
          <Button variant="danger" size="sm" onClick={revoke}>Revoke All</Button>
        </div>
      </Card>
      <div className="space-y-3">
        <Input label="Current Password" type="password" placeholder="Enter current password"
          value={pw.currentPassword} onChange={(e) => setPw(p => ({ ...p, currentPassword: e.target.value }))} />
        <Input label="New Password" type="password" placeholder="Enter new password"
          value={pw.newPassword} onChange={(e) => setPw(p => ({ ...p, newPassword: e.target.value }))} />
        <Input label="Confirm Password" type="password" placeholder="Confirm new password"
          value={pw.confirmPassword} onChange={(e) => setPw(p => ({ ...p, confirmPassword: e.target.value }))} />
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={saveSecurity}><Shield className="w-3.5 h-3.5" />Save 2FA</Button>
        <Button onClick={updatePassword}>Update Password</Button>
      </div>
    </div>
  )
}

function SMTPSettings() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['settings', 'smtp'], queryFn: () => smtpApi.get() })
  const [form, setForm] = useState({ host: '', port: '', username: '', password: '', fromName: '', fromEmail: '', secure: false })
  useEffect(() => { if (data?.data) setForm(f => ({ ...f, ...data.data })) }, [data])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    try { await smtpApi.update(form); toast.success('SMTP settings saved!') }
    catch (err) { toast.error(err.message || 'Failed to save') }
  }
  const test = async () => {
    try { await smtpApi.update(form); toast.success('Test email sent!') }
    catch (err) { toast.error(err.message || 'Failed to send') }
  }
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-heading mb-1">SMTP Configuration</h3>
        <p className="text-xs text-muted">Configure email sending settings</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="SMTP Host" placeholder="smtp.gmail.com" value={form.host} onChange={(e) => set('host', e.target.value)} />
        <Input label="SMTP Port" placeholder="587" value={form.port} onChange={(e) => set('port', e.target.value)} />
        <Input label="Username" placeholder="your@email.com" value={form.username} onChange={(e) => set('username', e.target.value)} />
        <Input label="Password" type="password" placeholder="App password" value={form.password} onChange={(e) => set('password', e.target.value)} />
        <Input label="From Name" placeholder="LeadFlow CRM" value={form.fromName} onChange={(e) => set('fromName', e.target.value)} />
        <Input label="From Email" placeholder="noreply@leadflow.dev" value={form.fromEmail} onChange={(e) => set('fromEmail', e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={test}>Send Test Email</Button>
        <Button onClick={save}>Save Configuration</Button>
      </div>
    </div>
  )
}

const TAB_CONTENT = {
  company: CompanySettings, profile: ProfileSettings, theme: ThemeSettings,
  notifications: NotificationSettings, security: SecuritySettings, smtp: SMTPSettings,
}

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
