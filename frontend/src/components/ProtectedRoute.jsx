import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'

export default function ProtectedRoute({ children, role }) {
  const { token, user, loading } = useAppSelector((state) => state.auth)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (token && !user && loading) {
    return null
  }

  if (role && user?.role !== role) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    }

    if (user?.role === 'monitor') {
      return <Navigate to="/monitor/reservations" replace />
    }

    return <Navigate to="/stagiaire/reservations" replace />
  }

  return children
}
