import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Zap, User, Mail, Phone, Lock, ArrowRight } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(2, 'Your name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(7, 'Invalid phone').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] })

function PasswordStrength({ password = '' }) {
  const checks = [
    { label: '6+ characters', pass: password.length >= 6 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /\d/.test(password) },
    { label: 'Special char', pass: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter(c => c.pass).length
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-primary-500']

  if (!password) return null
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < score ? colors[score - 1] : 'bg-white/10'}`} />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {checks.map(c => (
          <span key={c.label} className={`text-xs ${c.pass ? 'text-primary-500' : 'text-muted'}`}>
            {c.pass ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const { register: authRegister } = useAuth()

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const password = watch('password', '')

  const onSubmit = async (data) => {
    try {
      await authRegister({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
        role: 'agent',
      })
      toast.success('Account created successfully!')
      navigate('/login')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-app p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-brand-blue flex items-center justify-center shadow-glow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-heading">LeadFlow</span>
        </div>

        <div className="glass rounded-3xl p-8 border border-app shadow-card-dark">
          <div className="text-center mb-7">
            <h2 className="text-2xl font-bold text-heading">Create your account</h2>
            <p className="text-sm text-muted mt-1">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" icon={User} placeholder="John Doe" error={errors.name?.message} {...register('name')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Email" icon={Mail} type="email" placeholder="you@company.com" error={errors.email?.message} {...register('email')} />
              <Input label="Phone" icon={Phone} placeholder="+1 555-0100" error={errors.phone?.message} {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Input label="Password" icon={Lock} type="password" placeholder="Create a strong password" error={errors.password?.message} {...register('password')} />
              <PasswordStrength password={password} />
            </div>
            <Input label="Confirm Password" icon={Lock} type="password" placeholder="Confirm your password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-2">
              Create Account <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-xs text-muted mt-5">
            By creating an account, you agree to our{' '}
            <span className="text-primary-500 cursor-pointer">Terms of Service</span> and{' '}
            <span className="text-primary-500 cursor-pointer">Privacy Policy</span>
          </p>

          <p className="text-center text-sm text-muted mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
