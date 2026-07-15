export const LEAD_STATUSES = ['new', 'contacted', 'interested', 'meeting', 'proposal', 'negotiation', 'won', 'lost']
export const LEAD_PRIORITIES = ['low', 'medium', 'high', 'urgent']
export const LEAD_SOURCES = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Email Campaign', 'Trade Show', 'Google Ads', 'Social Media', 'Partner']
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent']
export const TASK_STATUSES = ['todo', 'in_progress', 'completed', 'overdue']

// Stage ids must match the backend Lead.status enum
// ('new','contacted','qualified','proposal','negotiation','won','lost','on_hold')
export const PIPELINE_STAGES = [
  { id: 'new', label: 'New', color: '#3B82F6' },
  { id: 'contacted', label: 'Contacted', color: '#8B5CF6' },
  { id: 'qualified', label: 'Qualified', color: '#F59E0B' },
  { id: 'proposal', label: 'Proposal Sent', color: '#06B6D4' },
  { id: 'negotiation', label: 'Negotiation', color: '#EC4899' },
  { id: 'won', label: 'Won', color: '#10B981' },
  { id: 'lost', label: 'Lost', color: '#EF4444' },
  { id: 'on_hold', label: 'On Hold', color: '#6B7280' },
]

export const MOCK_LEADS = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@techcorp.com', phone: '+1 555-0101', company: 'TechCorp Inc', status: 'interested', priority: 'high', source: 'LinkedIn', assignedTo: 'Alex Chen', budget: 45000, createdAt: '2024-01-15', avatar: null },
  { id: '2', name: 'Michael Brown', email: 'michael@innovate.io', phone: '+1 555-0102', company: 'Innovate.io', status: 'meeting', priority: 'urgent', source: 'Referral', assignedTo: 'Maria Lopez', budget: 120000, createdAt: '2024-01-18', avatar: null },
  { id: '3', name: 'Emily Davis', email: 'emily@startupxyz.com', phone: '+1 555-0103', company: 'StartupXYZ', status: 'new', priority: 'medium', source: 'Website', assignedTo: 'Alex Chen', budget: 28000, createdAt: '2024-01-20', avatar: null },
  { id: '4', name: 'James Wilson', email: 'james@enterprise.co', phone: '+1 555-0104', company: 'Enterprise Co', status: 'proposal', priority: 'high', source: 'Cold Call', assignedTo: 'David Kim', budget: 250000, createdAt: '2024-01-22', avatar: null },
  { id: '5', name: 'Lisa Martinez', email: 'lisa@globaltech.com', phone: '+1 555-0105', company: 'GlobalTech', status: 'won', priority: 'high', source: 'Google Ads', assignedTo: 'Maria Lopez', budget: 85000, createdAt: '2024-01-25', avatar: null },
  { id: '6', name: 'Robert Taylor', email: 'robert@nexus.dev', phone: '+1 555-0106', company: 'Nexus Dev', status: 'contacted', priority: 'low', source: 'Email Campaign', assignedTo: 'David Kim', budget: 15000, createdAt: '2024-01-28', avatar: null },
  { id: '7', name: 'Amanda White', email: 'amanda@cloudbase.io', phone: '+1 555-0107', company: 'CloudBase', status: 'negotiation', priority: 'urgent', source: 'Trade Show', assignedTo: 'Alex Chen', budget: 320000, createdAt: '2024-02-01', avatar: null },
  { id: '8', name: 'Chris Anderson', email: 'chris@dataflow.com', phone: '+1 555-0108', company: 'DataFlow', status: 'lost', priority: 'medium', source: 'Partner', assignedTo: 'Maria Lopez', budget: 55000, createdAt: '2024-02-03', avatar: null },
]

export const MOCK_EMPLOYEES = [
  { id: '1', name: 'Alex Chen', role: 'Sales Manager', email: 'alex@leadflow.com', phone: '+1 555-1001', avatar: null, leads: 24, revenue: 485000, deals: 12, performance: 92 },
  { id: '2', name: 'Maria Lopez', role: 'Senior Sales Rep', email: 'maria@leadflow.com', phone: '+1 555-1002', avatar: null, leads: 18, revenue: 320000, deals: 9, performance: 85 },
  { id: '3', name: 'David Kim', role: 'Sales Rep', email: 'david@leadflow.com', phone: '+1 555-1003', avatar: null, leads: 15, revenue: 210000, deals: 7, performance: 78 },
  { id: '4', name: 'Sophie Turner', role: 'Junior Sales Rep', email: 'sophie@leadflow.com', phone: '+1 555-1004', avatar: null, leads: 10, revenue: 125000, deals: 4, performance: 65 },
]

export const MOCK_TASKS = [
  { id: '1', title: 'Follow up with Sarah Johnson', description: 'Send proposal document and schedule demo', priority: 'high', status: 'todo', dueDate: '2024-02-10', assignedTo: 'Alex Chen', leadId: '1', leadName: 'Sarah Johnson' },
  { id: '2', title: 'Prepare enterprise proposal', description: 'Create detailed proposal for James Wilson', priority: 'urgent', status: 'in_progress', dueDate: '2024-02-08', assignedTo: 'David Kim', leadId: '4', leadName: 'James Wilson' },
  { id: '3', title: 'Schedule product demo', description: 'Book 30-min demo slot with Michael Brown', priority: 'high', status: 'completed', dueDate: '2024-02-05', assignedTo: 'Maria Lopez', leadId: '2', leadName: 'Michael Brown' },
  { id: '4', title: 'Send onboarding docs', description: 'Send welcome package to Lisa Martinez', priority: 'medium', status: 'todo', dueDate: '2024-02-12', assignedTo: 'Maria Lopez', leadId: '5', leadName: 'Lisa Martinez' },
  { id: '5', title: 'Cold outreach batch', description: 'Send 20 cold emails to new prospects', priority: 'low', status: 'todo', dueDate: '2024-02-15', assignedTo: 'Sophie Turner', leadId: null, leadName: null },
]

export const MOCK_ACTIVITIES = [
  { id: '1', type: 'lead_created', message: 'New lead Sarah Johnson added', user: 'Alex Chen', time: '2 minutes ago', icon: 'UserPlus' },
  { id: '2', type: 'deal_won', message: 'Deal won with Lisa Martinez ($85K)', user: 'Maria Lopez', time: '1 hour ago', icon: 'Trophy' },
  { id: '3', type: 'task_completed', message: 'Task "Schedule product demo" completed', user: 'Maria Lopez', time: '3 hours ago', icon: 'CheckCircle' },
  { id: '4', type: 'meeting_scheduled', message: 'Meeting scheduled with Michael Brown', user: 'Maria Lopez', time: '5 hours ago', icon: 'Calendar' },
  { id: '5', type: 'note_added', message: 'Note added to James Wilson lead', user: 'David Kim', time: '1 day ago', icon: 'FileText' },
  { id: '6', type: 'email_sent', message: 'Proposal email sent to Amanda White', user: 'Alex Chen', time: '1 day ago', icon: 'Mail' },
]

export const MONTHLY_REVENUE = [
  { month: 'Jan', revenue: 42000, leads: 28, deals: 8 },
  { month: 'Feb', revenue: 58000, leads: 35, deals: 11 },
  { month: 'Mar', revenue: 51000, leads: 30, deals: 9 },
  { month: 'Apr', revenue: 74000, leads: 42, deals: 14 },
  { month: 'May', revenue: 68000, leads: 38, deals: 12 },
  { month: 'Jun', revenue: 92000, leads: 55, deals: 18 },
  { month: 'Jul', revenue: 85000, leads: 48, deals: 16 },
  { month: 'Aug', revenue: 110000, leads: 62, deals: 22 },
  { month: 'Sep', revenue: 98000, leads: 57, deals: 19 },
  { month: 'Oct', revenue: 125000, leads: 70, deals: 25 },
  { month: 'Nov', revenue: 118000, leads: 65, deals: 23 },
  { month: 'Dec', revenue: 142000, leads: 80, deals: 28 },
]

export const LEAD_SOURCES_DATA = [
  { name: 'LinkedIn', value: 32, color: '#3B82F6' },
  { name: 'Website', value: 24, color: '#10B981' },
  { name: 'Referral', value: 18, color: '#8B5CF6' },
  { name: 'Cold Call', value: 12, color: '#F97316' },
  { name: 'Email', value: 8, color: '#F59E0B' },
  { name: 'Other', value: 6, color: '#64748B' },
]

export const CONVERSION_DATA = [
  { stage: 'Leads', count: 248 },
  { stage: 'Contacted', count: 186 },
  { stage: 'Interested', count: 124 },
  { stage: 'Meeting', count: 82 },
  { stage: 'Proposal', count: 54 },
  { stage: 'Won', count: 32 },
]

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/leads', label: 'Leads', icon: 'Users' },
  { path: '/pipeline', label: 'Pipeline', icon: 'Kanban' },
  { path: '/customers', label: 'Customers', icon: 'UserCheck' },
  { path: '/companies', label: 'Companies', icon: 'Building2' },
  { path: '/employees', label: 'Employees', icon: 'UserCog' },
  { path: '/tasks', label: 'Tasks', icon: 'CheckSquare' },
  { path: '/followups', label: 'Follow Ups', icon: 'Bell' },
  { path: '/calendar', label: 'Calendar', icon: 'CalendarDays' },
  { path: '/reports', label: 'Reports', icon: 'BarChart3' },
  { path: '/documents', label: 'Documents', icon: 'FolderOpen' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
]
