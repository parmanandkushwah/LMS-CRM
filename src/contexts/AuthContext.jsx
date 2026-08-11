import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

const getStorage = (remember) => (remember ? localStorage : sessionStorage)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('lf-user') || sessionStorage.getItem('lf-user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(() => {
    return !!localStorage.getItem('lf-access-token') || !!sessionStorage.getItem('lf-access-token')
  })

  useEffect(() => {
    const token = localStorage.getItem('lf-access-token') || sessionStorage.getItem('lf-access-token')
    if (token && !user) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data)
          const store = localStorage.getItem('lf-access-token') ? localStorage : sessionStorage
          store.setItem('lf-user', JSON.stringify(res.data))
        })
        .catch(() => {
          localStorage.removeItem('lf-access-token')
          localStorage.removeItem('lf-refresh-token')
          localStorage.removeItem('lf-user')
          sessionStorage.removeItem('lf-access-token')
          sessionStorage.removeItem('lf-refresh-token')
          sessionStorage.removeItem('lf-user')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password, remember = true) => {
    const res = await api.post('/auth/login', { email, password })
    const { user: u, accessToken, refreshToken } = res.data
    const store = getStorage(remember)
    store.setItem('lf-access-token', accessToken)
    store.setItem('lf-refresh-token', refreshToken)
    store.setItem('lf-user', JSON.stringify(u))
    setUser(u)
    return u
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    localStorage.removeItem('lf-access-token')
    localStorage.removeItem('lf-refresh-token')
    localStorage.removeItem('lf-user')
    sessionStorage.removeItem('lf-access-token')
    sessionStorage.removeItem('lf-refresh-token')
    sessionStorage.removeItem('lf-user')
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
