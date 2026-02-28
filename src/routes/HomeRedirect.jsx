import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function HomeRedirect() {
  const { user } = useAuth()
  const isAdmin = !!user?.is_admin
  return <Navigate to={isAdmin ? '/dashboard' : '/pdv'} replace />
}
