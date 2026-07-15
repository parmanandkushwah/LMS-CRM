import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('lf-user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(!!localStorage.getItem('lf-access-token'))

  useEffect(() => {
    const token = localStorage.getItem('lf-access-token')
    if (token && !user) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data)
          localStorage.setItem('lf-user', JSON.stringify(res.data))
        })
        .catch(() => {
          localStorage.removeItem('lf-access-token')
          localStorage.removeItem('lf-refresh-token')
          localStorage.removeItem('lf-user')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { user: u, accessToken, refreshToken } = res.data
    localStorage.setItem('lf-access-token', accessToken)
    localStorage.setItem('lf-refresh-token', refreshToken)
    localStorage.setItem('lf-user', JSON.stringify(u))
    setUser(u)
    return u
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    localStorage.removeItem('lf-access-token')
    localStorage.removeItem('lf-refresh-token')
    localStorage.removeItem('lf-user')
    setUser(null)
  }

  // Register is admin-only on the backend (POST /api/users)
  // This is used by admins creating new users
  const register = async (data) => {
    const res = await api.post('/users', data)
    return res.data
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
