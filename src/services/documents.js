import api from './api'

export const documentsApi = {
  list: (params) => api.get('/documents', { params }),
  upload: (formData) =>
    api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  download: async (id, name) => {
    const blob = await api.get(`/documents/${id}/download`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name || 'document'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  },
  remove: (id) => api.delete(`/documents/${id}`),
}

export const formatBytes = (bytes) => {
  const n = Number(bytes) || 0
  if (n === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(n) / Math.log(1024))
  return `${(n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export const docTypeFromName = (name = '') => {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'PDF'
  if (ext === 'doc' || ext === 'docx') return 'DOC'
  if (ext === 'xls' || ext === 'xlsx') return 'XLS'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'IMG'
  if (['mp4', 'mov', 'webm', 'avi'].includes(ext)) return 'VIDEO'
  return 'FILE'
}

export const getInlineUrl = (id) => {
  const token = localStorage.getItem('lf-access-token')
  const q = token ? `?token=${encodeURIComponent(token)}` : ''
  return `${api.defaults.baseURL}/documents/${id}/view${q}`
}

export default documentsApi
