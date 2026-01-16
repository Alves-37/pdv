import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute() {
  const { isAuthenticated, autoLogin } = useAuth()
  const [checking, setChecking] = useState(true)
  const location = useLocation()

  useEffect(() => {
    let cancelled = false

    async function check() {
      if (isAuthenticated) {
        setChecking(false)
        return
      }
      try {
        await autoLogin()
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, autoLogin])

  if (checking) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />

  const tenantId = localStorage.getItem('tenant_id')
  const isSelectingTenant = location.pathname === '/selecionar-tipo'
  if (!tenantId && !isSelectingTenant) {
    return <Navigate to="/selecionar-tipo" replace />
  }
  return <Outlet />
}
