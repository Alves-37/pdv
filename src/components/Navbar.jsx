import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Classes base para acessibilidade e interação: focus primeiro, depois hover
  const linkBase = 'px-2 py-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700 hover:bg-white/10'
  const navItem = ({ isActive }) => `${linkBase} ${isActive ? 'text-white font-semibold' : 'text-white/80 hover:text-white'}`
  const [open, setOpen] = useState(false)

  let tipoNegocio = 'mercearia'
  try {
    tipoNegocio = String(localStorage.getItem('tenant_tipo_negocio') || 'mercearia')
  } catch {}
  const isRestaurante = tipoNegocio === 'restaurante'
  const isAdmin = !!user?.is_admin

  const roleLabel = isAdmin ? 'Admin' : 'Funcionário'
  const businessLabel = isRestaurante ? 'Restaurante' : 'Mercearia'

  useEffect(() => {
    if (open) setOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function handleSwitchBusiness() {
    navigate('/selecionar-tipo', { replace: true })
  }

  return (
    <nav className="sticky top-0 z-40 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-14 py-2 items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center min-w-0">
            <Link
              to={isAdmin ? '/dashboard' : '/pdv'}
              className="min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700"
              title={user?.nome || user?.usuario || ''}
            >
              <div className="flex flex-col leading-tight">
                <span className="text-sm sm:text-lg font-bold text-white whitespace-nowrap">
                  Bem vindo(a)
                </span>
                <span className="text-[11px] sm:text-sm text-white/90 font-semibold truncate max-w-[220px] sm:max-w-[320px]">
                  {user?.nome || user?.usuario || ''}
                </span>
                <span className="text-[10px] sm:text-xs text-white/70 font-medium truncate max-w-[220px] sm:max-w-[320px]">
                  {roleLabel} • {businessLabel}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-6">
            {isAdmin && <NavLink to="/dashboard" className={navItem}>Dashboard</NavLink>}
            {isAdmin && <NavLink to="/produtos" className={navItem}>Produtos</NavLink>}
            {isAdmin && !isRestaurante && <NavLink to="/clientes" className={navItem}>Clientes</NavLink>}
            {isAdmin && <NavLink to="/usuarios" className={navItem}>Usuários</NavLink>}
            {isRestaurante ? (
              <>
                <NavLink to="/pdv" className={navItem}>PDV</NavLink>
                <NavLink to="/pedidos" className={navItem}>Pedidos</NavLink>
                <NavLink to="/mesas" className={navItem}>Mesas</NavLink>
                {isAdmin && <NavLink to="/turnos" className={navItem}>Turnos</NavLink>}
                {isAdmin ? <NavLink to="/vendas" className={navItem}>Fechamentos</NavLink> : <NavLink to="/minhas-vendas" className={navItem}>Minhas Vendas</NavLink>}
              </>
            ) : (
              isAdmin ? <NavLink to="/vendas" className={navItem}>Vendas</NavLink> : <NavLink to="/minhas-vendas" className={navItem}>Minhas Vendas</NavLink>
            )}
            {isAdmin && <NavLink to="/relatorios-financeiros" className={navItem}>Relatórios</NavLink>}
            {isAdmin && <NavLink to="/configuracoes" className={navItem}>Configurações</NavLink>}
          </div>

          {/* Desktop user actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium border border-white/30 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700 hover:bg-white/10"
              onClick={handleSwitchBusiness}
            >
              Trocar negócio
            </button>
            <button
              aria-label="Terminar sessão"
              title="Sair"
              className="inline-flex items-center justify-center rounded-lg p-2 border border-white/30 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700 hover:bg-white/10"
              onClick={handleLogout}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h2"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>

          {/* Mobile actions: Sair + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium border border-white/30 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700 hover:bg-white/10"
              onClick={handleSwitchBusiness}
            >
              Trocar
            </button>
            <button
              aria-label="Terminar sessão"
              title="Sair"
              className="inline-flex items-center justify-center rounded-lg p-2 border border-white/30 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700 hover:bg-white/10"
              onClick={handleLogout}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h2"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
            <button
              aria-label="Abrir menu"
              aria-expanded={open}
              className={`inline-flex items-center justify-center p-2 rounded-lg border border-white/30 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700 hover:bg-white/10 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
              onClick={() => setOpen(v => !v)}
            >
              <svg className="h-5 w-5 transition-all duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {open ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="md:hidden fixed inset-0 z-30 bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile panel (animated) */}
      <div
        className={`md:hidden border-t border-white/10 bg-primary-800/95 backdrop-blur transition-all duration-300 relative z-40 ${open ? 'opacity-100 translate-y-0 max-h-[480px]' : 'opacity-0 -translate-y-2 max-h-0 overflow-hidden'}`}
      >
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm text-white/90 truncate">{user?.nome || user?.usuario || 'Usuário'}</div>
              <div className="text-xs text-white/70 truncate">{roleLabel} • {businessLabel}</div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {isAdmin && <NavLink to="/dashboard" className={navItem} onClick={() => setOpen(false)}>Dashboard</NavLink>}
            {isAdmin && <NavLink to="/produtos" className={navItem} onClick={() => setOpen(false)}>Produtos</NavLink>}
            {isAdmin && !isRestaurante && <NavLink to="/clientes" className={navItem} onClick={() => setOpen(false)}>Clientes</NavLink>}
            {isAdmin && <NavLink to="/usuarios" className={navItem} onClick={() => setOpen(false)}>Usuários</NavLink>}
            {isRestaurante ? (
              <>
                <NavLink to="/pdv" className={navItem} onClick={() => setOpen(false)}>PDV</NavLink>
                <NavLink to="/pedidos" className={navItem} onClick={() => setOpen(false)}>Pedidos</NavLink>
                <NavLink to="/mesas" className={navItem} onClick={() => setOpen(false)}>Mesas</NavLink>
                {isAdmin && <NavLink to="/turnos" className={navItem} onClick={() => setOpen(false)}>Turnos</NavLink>}
                {isAdmin ? (
                  <NavLink to="/vendas" className={navItem} onClick={() => setOpen(false)}>Fechamentos</NavLink>
                ) : (
                  <NavLink to="/minhas-vendas" className={navItem} onClick={() => setOpen(false)}>Minhas Vendas</NavLink>
                )}
              </>
            ) : (
              isAdmin ? (
                <NavLink to="/vendas" className={navItem} onClick={() => setOpen(false)}>Vendas</NavLink>
              ) : (
                <NavLink to="/minhas-vendas" className={navItem} onClick={() => setOpen(false)}>Minhas Vendas</NavLink>
              )
            )}
            {isAdmin && <NavLink to="/relatorios-financeiros" className={navItem} onClick={() => setOpen(false)}>Relatórios</NavLink>}
            {isAdmin && <NavLink to="/configuracoes" className={navItem} onClick={() => setOpen(false)}>Configurações</NavLink>}
          </div>
        </div>
      </div>
    </nav>
  )
}
