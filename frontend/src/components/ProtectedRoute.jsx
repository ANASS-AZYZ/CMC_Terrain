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
    return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/stagiaire/reservations'} replace />
  }

  return children
}
