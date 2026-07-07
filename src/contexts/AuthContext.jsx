import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const MOCK_USER = {
  id: '1',
  name: 'Alex Chen',
  email: 'alex@leadflow.com',
  role: 'Admin',
  avatar: null,
  company: 'LeadFlow Inc',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('lf-user')
    return stored ? JSON.parse(stored) : null
  })

  const login = async (email, password) => {
    // Mock login
    await new Promise(r => setTimeout(r, 800))
    if (email && password) {
      const u = { ...MOCK_USER, email }
      setUser(u)
      localStorage.setItem('lf-user', JSON.stringify(u))
      return u
    }
    throw new Error('Invalid credentials')
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('lf-user')
  }

  const register = async (data) => {
    await new Promise(r => setTimeout(r, 1000))
    const u = { ...MOCK_USER, ...data }
    setUser(u)
    localStorage.setItem('lf-user', JSON.stringify(u))
    return u
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
