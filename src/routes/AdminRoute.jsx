import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute() {
  const { user } = useAuth()
  const isAdmin = !!user?.is_admin

  if (!isAdmin) {
    return <Navigate to="/pdv" replace />
  }

  return <Outlet />
}
