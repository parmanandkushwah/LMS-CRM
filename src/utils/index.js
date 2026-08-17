import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

export function formatDate(date, options = {}) {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', ...options }).format(d)
}

export function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', hour12: undefined }).format(d)
}

export function formatRelativeTime(date) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function parseDateTimeLocal(value) {
  if (!value || typeof value !== 'string') return null
  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) return null
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  if ([year, month, day, hour, minute].some(n => Number.isNaN(n))) return null
  return new Date(year, month - 1, day, hour, minute, 0, 0)
}

export function toUtcISOString(value) {
  if (!value) return ''
  const d = parseDateTimeLocal(value)
  if (!d || isNaN(d.getTime())) return value
  return d.toISOString()
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

export function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export const STATUS_COLORS = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  contacted: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  interested: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
   qualified: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  meeting: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  proposal: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  negotiation: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
   won: 'bg-green-500/10 text-green-400 border-green-500/20',
   lost: 'bg-red-500/10 text-red-400 border-red-500/20',
   on_hold: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  active: 'bg-green-500/10 text-green-400 border-green-500/20',
  inactive: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export const PRIORITY_COLORS = {
  low: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
}
