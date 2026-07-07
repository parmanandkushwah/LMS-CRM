import { motion } from 'framer-motion'
import Button from './Button'

const illustrations = {
  leads: (
    <svg viewBox="0 0 200 160" className="w-40 h-32" fill="none">
      <circle cx="100" cy="60" r="40" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.3)" strokeWidth="2" />
      <circle cx="100" cy="50" r="16" fill="rgba(16,185,129,0.2)" stroke="rgba(16,185,129,0.4)" strokeWidth="1.5" />
      <path d="M68 90 Q100 75 132 90" stroke="rgba(16,185,129,0.4)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="40" y="100" width="120" height="8" rx="4" fill="rgba(255,255,255,0.06)" />
      <rect x="55" y="116" width="90" height="6" rx="3" fill="rgba(255,255,255,0.04)" />
    </svg>
  ),
  tasks: (
    <svg viewBox="0 0 200 160" className="w-40 h-32" fill="none">
      <rect x="50" y="30" width="100" height="100" rx="12" fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.2)" strokeWidth="1.5" />
      <path d="M70 65 L85 80 L115 55" stroke="rgba(59,130,246,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="65" y="90" width="70" height="6" rx="3" fill="rgba(255,255,255,0.06)" />
      <rect x="72" y="104" width="56" height="5" rx="2.5" fill="rgba(255,255,255,0.04)" />
    </svg>
  ),
  default: (
    <svg viewBox="0 0 200 160" className="w-40 h-32" fill="none">
      <rect x="40" y="40" width="120" height="80" rx="12" fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.2)" strokeWidth="1.5" />
      <circle cx="100" cy="80" r="20" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.3)" strokeWidth="1.5" />
      <path d="M93 80 L98 85 L108 75" stroke="rgba(139,92,246,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

export default function EmptyState({ title = 'Nothing here yet', description, action, actionLabel, icon, type = 'default' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-6"
      >
        {illustrations[type] || illustrations.default}
      </motion.div>
      <h3 className="text-base font-semibold text-heading mb-2">{title}</h3>
      {description && <p className="text-sm text-muted max-w-xs mb-6">{description}</p>}
      {action && actionLabel && (
        <Button onClick={action} size="sm">{actionLabel}</Button>
      )}
    </motion.div>
  )
}
