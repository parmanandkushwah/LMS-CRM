import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, RefreshCw } from 'lucide-react'
import Button from '../../components/ui/Button'

function ErrorPage({ code, title, description, action, actionLabel, secondaryAction, secondaryLabel }) {
  const colors = { 404: '#3B82F6', 403: '#F97316', 500: '#EF4444' }
  const color = colors[code] || '#10B981'

  return (
    <div className="min-h-screen flex items-center justify-center bg-app p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* Illustration */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-8"
        >
          <svg viewBox="0 0 300 200" className="w-64 h-44 mx-auto" fill="none">
            <circle cx="150" cy="100" r="80" fill={`${color}10`} stroke={`${color}30`} strokeWidth="2" />
            <circle cx="150" cy="100" r="55" fill={`${color}08`} stroke={`${color}20`} strokeWidth="1.5" />
            <text x="150" y="115" textAnchor="middle" fontSize="52" fontWeight="800" fill={color} opacity="0.8">{code}</text>
          </svg>
        </motion.div>

        <h1 className="text-2xl font-bold text-heading mb-3">{title}</h1>
        <p className="text-sm text-muted mb-8 leading-relaxed">{description}</p>

        <div className="flex items-center justify-center gap-3">
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction}>
              <ArrowLeft className="w-4 h-4" />{secondaryLabel}
            </Button>
          )}
          <Button onClick={action}>
            <Home className="w-4 h-4" />{actionLabel}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export function NotFound() {
  const navigate = useNavigate()
  return (
    <ErrorPage
      code={404}
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved. Check the URL or go back home."
      action={() => navigate('/dashboard')}
      actionLabel="Go Home"
      secondaryAction={() => navigate(-1)}
      secondaryLabel="Go Back"
    />
  )
}

export function Forbidden() {
  const navigate = useNavigate()
  return (
    <ErrorPage
      code={403}
      title="Access denied"
      description="You don't have permission to access this page. Contact your administrator if you think this is a mistake."
      action={() => navigate('/dashboard')}
      actionLabel="Go Home"
    />
  )
}

export function ServerError() {
  return (
    <ErrorPage
      code={500}
      title="Something went wrong"
      description="We're experiencing some technical difficulties. Our team has been notified and is working on a fix."
      action={() => window.location.reload()}
      actionLabel="Try Again"
      secondaryAction={() => window.history.back()}
      secondaryLabel="Go Back"
    />
  )
}
