import api from './api'

export const companyApi = {
  get: () => api.get('/settings/company'),
  update: (data) => api.put('/settings/company', data),
}

export const appearanceApi = {
  get: () => api.get('/settings/appearance'),
  update: (data) => api.put('/settings/appearance', data),
}

export const notificationApi = {
  get: () => api.get('/settings/notifications'),
  update: (data) => api.put('/settings/notifications', data),
}

export const securityApi = {
  get: () => api.get('/settings/security'),
  update: (data) => api.put('/settings/security', data),
}

export const smtpApi = {
  get: () => api.get('/settings/smtp'),
  update: (data) => api.put('/settings/smtp', data),
}

export const profileApi = {
  me: () => api.get('/auth/me'),
  update: (payload) => api.put('/auth/profile', payload),
  changePassword: (payload) => api.put('/auth/change-password', payload),
}
