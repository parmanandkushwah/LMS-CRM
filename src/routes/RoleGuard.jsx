import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RoleGuard({ children, roles }) {
  const { user } = useAuth()

  if (!roles.includes(user?.role)) {
    return <Navigate to="/403" replace />
  }

  return children
}
