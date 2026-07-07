import { forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils'
import { AlertCircle, ChevronDown } from 'lucide-react'

// Select
export const Select = forwardRef(({ label, error, options = [], placeholder, className, containerClassName, ...props }, ref) => (
  <div className={cn('flex flex-col gap-1.5', containerClassName)}>
    {label && <label className="text-sm font-medium text-body">{label}</label>}
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'w-full h-10 rounded-xl border border-app bg-card text-heading appearance-none',
          'px-3 pr-9 py-2 text-sm transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50',
          error && 'border-red-500/50',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
    </div>
    <AnimatePresence>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5" />{error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
))
Select.displayName = 'Select'

// Textarea
export const Textarea = forwardRef(({ label, error, hint, className, containerClassName, rows = 4, ...props }, ref) => (
  <div className={cn('flex flex-col gap-1.5', containerClassName)}>
    {label && <label className="text-sm font-medium text-body">{label}</label>}
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'w-full rounded-xl border border-app bg-card text-heading placeholder:text-muted',
        'px-3 py-2.5 text-sm transition-all duration-200 resize-none',
        'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50',
        error && 'border-red-500/50',
        className
      )}
      {...props}
    />
    <AnimatePresence>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5" />{error}
        </motion.p>
      )}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </AnimatePresence>
  </div>
))
Textarea.displayName = 'Textarea'

// Switch
export function Switch({ checked, onChange, label, size = 'md' }) {
  const sizes = { sm: 'w-8 h-4', md: 'w-11 h-6' }
  const thumbSizes = { sm: 'w-3 h-3', md: 'w-4 h-4' }
  const translateX = { sm: checked ? 16 : 2, md: checked ? 22 : 2 }

  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative rounded-full transition-colors duration-200 flex-shrink-0',
          sizes[size],
          checked ? 'bg-primary-500' : 'bg-white/20'
        )}
      >
        <motion.div
          animate={{ x: translateX[size] }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn('absolute top-1 bg-white rounded-full shadow-sm', thumbSizes[size])}
        />
      </button>
      {label && <span className="text-sm text-body group-hover:text-heading transition-colors">{label}</span>}
    </label>
  )
}

// Checkbox
export function Checkbox({ checked, onChange, label, className }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          'w-4 h-4 rounded border transition-all duration-200 flex items-center justify-center flex-shrink-0',
          checked ? 'bg-primary-500 border-primary-500' : 'border-app hover:border-primary-500/50',
          className
        )}
      >
        {checked && (
          <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        )}
      </div>
      {label && <span className="text-sm text-body group-hover:text-heading transition-colors">{label}</span>}
    </label>
  )
}
