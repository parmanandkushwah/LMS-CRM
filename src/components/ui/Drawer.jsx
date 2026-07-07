import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../utils'
import Button from './Button'

const positions = {
  right: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' }, className: 'right-0 top-0 h-full' },
  left: { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' }, className: 'left-0 top-0 h-full' },
  bottom: { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, className: 'bottom-0 left-0 right-0' },
}

const widths = { sm: 'w-80', md: 'w-96', lg: 'w-[480px]', xl: 'w-[600px]' }

export default function Drawer({ open, onClose, title, children, position = 'right', size = 'md', footer }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const pos = positions[position]

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={pos.initial}
            animate={pos.animate}
            exit={pos.exit}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              'absolute glass-sidebar flex flex-col shadow-card-dark',
              pos.className,
              position !== 'bottom' && widths[size]
            )}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-app flex-shrink-0">
              <h3 className="text-base font-semibold text-heading">{title}</h3>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
              {children}
            </div>
            {footer && (
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-app flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
