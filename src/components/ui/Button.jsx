import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils'
import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-glow hover:shadow-glow',
  secondary: 'bg-white/10 hover:bg-white/15 text-heading border border-app',
  ghost: 'hover:bg-white/8 text-body hover:text-heading',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  outline: 'border border-app hover:border-primary-500/50 text-body hover:text-primary-500',
  gradient: 'bg-gradient-to-r from-primary-500 to-brand-blue text-white hover:opacity-90',
}

const sizes = {
  xs: 'h-7 px-2.5 text-xs rounded-lg',
  sm: 'h-8 px-3 text-sm rounded-xl',
  md: 'h-9 px-4 text-sm rounded-xl',
  lg: 'h-11 px-6 text-base rounded-2xl',
  xl: 'h-12 px-8 text-base rounded-2xl',
  icon: 'h-9 w-9 rounded-xl',
  'icon-sm': 'h-8 w-8 rounded-lg',
  'icon-lg': 'h-11 w-11 rounded-2xl',
}

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  onClick,
  type = 'button',
  ...props
}, ref) => {
  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </motion.button>
  )
})

Button.displayName = 'Button'
export default Button
