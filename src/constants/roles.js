export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  AGENT: 'agent',
}

export const isAdminOrManager = (role) => ['admin', 'manager'].includes(role)

export const AGENT_ACCESSIBLE_PATHS = [
  '/dashboard',
  '/leads',
  '/pipeline',
  '/customers',
  '/companies',
  '/tasks',
  '/followups',
  '/quotations',
  '/calendar',
  '/documents',
  '/profile',
  '/settings',
]

export const ADMIN_MANAGER_ONLY_PATHS = [
  '/employees',
  '/reports',
]
