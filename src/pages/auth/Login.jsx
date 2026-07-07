import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Zap, Mail, Lock, ArrowRight, Globe, ExternalLink } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/FormElements'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

function FloatingOrb({ className, delay = 0 }) {
  return (
    <motion.div
      animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
      transition={{ duration: 6, repeat: Infinity, delay, ease: 'easeInOut' }}
      className={`absolute rounded-full blur-3xl opacity-20 ${className}`}
    />
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [remember, setRemember] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: 'alex@leadflow.com', password: 'password123' }
  })

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="min-h-screen flex bg-app">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-[#0B1120] via-[#0d1a2e] to-[#0B1120] items-center justify-center p-12">
        <FloatingOrb className="w-96 h-96 bg-primary-500 -top-20 -left-20" delay={0} />
        <FloatingOrb className="w-64 h-64 bg-brand-blue bottom-20 right-10" delay={2} />
        <FloatingOrb className="w-48 h-48 bg-brand-purple top-1/2 left-1/3" delay={4} />

        <div className="relative z-10 max-w-md text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-brand-blue flex items-center justify-center mx-auto mb-8 shadow-glow">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Close more deals with <span className="text-primary-500">LeadFlow</span>
            </h1>
            <p className="text-lg text-gray-400 mb-10">
              The modern CRM built for high-performance sales teams.
            </p>

            {/* Feature list */}
            <div className="space-y-4 text-left">
              {[
                { title: 'Smart Lead Management', desc: 'Track and nurture leads through every stage' },
                { title: 'Visual Pipeline', desc: 'Drag-and-drop Kanban board for your sales process' },
                { title: 'Powerful Analytics', desc: 'Real-time insights to drive better decisions' },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  className="flex items-start gap-3 glass rounded-xl p-3.5"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="text-xs text-gray-400">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-brand-blue flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-heading">LeadFlow</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-heading">Welcome back</h2>
            <p className="text-sm text-muted mt-1">Sign in to your account to continue</p>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button variant="secondary" size="md" onClick={() => toast('Social login coming soon!')}>
              <Globe className="w-4 h-4" />Google
            </Button>
            <Button variant="secondary" size="md" onClick={() => toast('Social login coming soon!')}>
              <ExternalLink className="w-4 h-4" />GitHub
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border-app" style={{ background: 'var(--border)' }} />
            <span className="text-xs text-muted">or continue with email</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              icon={Mail}
              type="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              icon={Lock}
              type="password"
              placeholder="Your password"
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between">
              <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
              <Link to="/forgot-password" className="text-xs text-primary-500 hover:text-primary-600 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              Sign In <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-500 hover:text-primary-600 font-medium transition-colors">
              Create one free
            </Link>
          </p>

          <p className="text-center text-xs text-muted mt-4 opacity-60">
            Demo: alex@leadflow.com / password123
          </p>
        </motion.div>
      </div>
    </div>
  )
}
