import { cn, getInitials } from '../../utils'
import { motion } from 'framer-motion'

// Badge
export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-white/10 text-body border-app',
    primary: 'bg-primary-500/10 text-primary-500 border-primary-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  }
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}

// Avatar
export function Avatar({ src, name, size = 'md', className }) {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base', xl: 'w-14 h-14 text-lg', '2xl': 'w-20 h-20 text-2xl' }
  const colors = ['from-primary-500 to-brand-blue', 'from-brand-purple to-brand-blue', 'from-brand-orange to-brand-red', 'from-brand-blue to-brand-purple']
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 overflow-hidden',
      `bg-gradient-to-br ${colors[colorIdx]}`,
      sizes[size],
      className
    )}>
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : getInitials(name)}
    </div>
  )
}

// Card
export function Card({ children, className, hover = false, gradient = false, onClick }) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.005 } : undefined}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'glass rounded-2xl p-5',
        hover && 'cursor-pointer',
        gradient && 'gradient-border',
        className
      )}
    >
      {children}
    </motion.div>
  )
}

// StatCard
export function StatCard({ title, value, change, changeType = 'positive', icon: Icon, iconColor = 'text-primary-500', iconBg = 'bg-primary-500/10', subtitle, loading = false }) {
  if (loading) {
    return (
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="shimmer-bg h-4 w-24 rounded-lg" />
        <div className="shimmer-bg h-8 w-32 rounded-lg" />
        <div className="shimmer-bg h-3 w-20 rounded-lg" />
      </div>
    )
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
      className="glass rounded-2xl p-5 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-2.5 rounded-xl transition-transform group-hover:scale-110', iconBg)}>
          {Icon && <Icon className={cn('w-5 h-5', iconColor)} />}
        </div>
        {change !== undefined && (
          <span className={cn(
            'text-xs font-medium px-2 py-1 rounded-lg',
            changeType === 'positive' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          )}>
            {changeType === 'positive' ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-heading">{value}</p>
        <p className="text-sm font-medium text-body">{title}</p>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
    </motion.div>
  )
}

// Skeleton
export function Skeleton({ className }) {
  return <div className={cn('shimmer-bg rounded-lg', className)} />
}
