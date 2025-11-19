import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NavbarRestaurante() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const linkBase = 'px-2 py-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700 hover:bg-white/10'
  const navItem = ({ isActive }) => `${linkBase} ${isActive ? 'text-white font-semibold' : 'text-white/80 hover:text-white'}`
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function handleSwitchBusiness() {
    navigate('/selecionar-tipo', { replace: true })
  }

  return (
    <nav className="sticky top-0 z-40 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center min-w-0">
            <Link to="/restaurante/dashboard" className="text-lg font-bold text-white whitespace-nowrap rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700">
              Restaurante
            </Link>
            <span className="ml-2 text-sm text-white/80 truncate max-w-[140px] font-bold">
              {user?.nome || user?.usuario || ''}
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLink to="/restaurante/dashboard" className={navItem}>Dashboard</NavLink>
            <NavLink to="/restaurante/produtos" className={navItem}>Produtos</NavLink>
            <NavLink to="/restaurante/clientes" className={navItem}>Clientes</NavLink>
            <NavLink to="/restaurante/usuarios" className={navItem}>Usuários</NavLink>
            <NavLink to="/restaurante/vendas" className={navItem}>Vendas</NavLink>
            <NavLink to="/restaurante/relatorios" className={navItem}>Relatórios</NavLink>
          </div>

          {/* Desktop user actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium border border-white/30 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700 hover:bg-white/10"
              onClick={handleSwitchBusiness}
            >
              Trocar negócio
            </button>
            <button
              aria-label="Terminar sessão"
              title="Sair"
              className="inline-flex items-center justify-center rounded-lg p-2 border border-white/30 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700 hover:bg-white/10"
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
              className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium border border-white/30 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700 hover:bg-white/10"
              onClick={handleSwitchBusiness}
            >
              Trocar
            </button>
            <button
              aria-label="Terminar sessão"
              title="Sair"
              className="inline-flex items-center justify-center rounded-lg p-2 border border-white/30 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700 hover:bg-white/10"
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
              className={`inline-flex items-center justify-center p-2 rounded-lg border border-white/30 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700 hover:bg-white/10 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
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

      {/* Mobile panel */}
      <div
        className={`md:hidden border-t border-white/10 bg-emerald-800/95 backdrop-blur transition-all duration-300 ${open ? 'opacity-100 translate-y-0 max-h-[480px]' : 'opacity-0 -translate-y-2 max-h-0 overflow-hidden'}`}
      >
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/90">{user?.nome || user?.usuario || 'Usuário'}</span>
          </div>
          <div className="flex flex-col gap-2">
            <NavLink to="/restaurante/dashboard" className={navItem} onClick={() => setOpen(false)}>Dashboard</NavLink>
            <NavLink to="/restaurante/produtos" className={navItem} onClick={() => setOpen(false)}>Produtos</NavLink>
            <NavLink to="/restaurante/clientes" className={navItem} onClick={() => setOpen(false)}>Clientes</NavLink>
            <NavLink to="/restaurante/usuarios" className={navItem} onClick={() => setOpen(false)}>Usuários</NavLink>
            <NavLink to="/restaurante/vendas" className={navItem} onClick={() => setOpen(false)}>Vendas</NavLink>
            <NavLink to="/restaurante/relatorios" className={navItem} onClick={() => setOpen(false)}>Relatórios</NavLink>
          </div>
        </div>
      </div>
    </nav>
  )
}
