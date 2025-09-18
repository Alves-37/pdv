import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  // Classes base para acessibilidade e interação: focus primeiro, depois hover
  const linkBase = 'px-2 py-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700 hover:bg-white/10'
  const navItem = ({ isActive }) => `${linkBase} ${isActive ? 'text-white font-semibold' : 'text-white/80 hover:text-white'}`
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="sticky top-0 z-40 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Brand */}
          <div className="flex items-center min-w-0">
            <Link to="/" className={`text-lg font-bold text-white whitespace-nowrap rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700`}>
              Bem vindo(a)
            </Link>
            {/* Nome do usuário ao lado da marca */}
            <span className="ml-2 text-sm text-white/80 truncate max-w-[140px] font-bold">
              {user?.nome || user?.usuario || ''}
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLink to="/dashboard" className={navItem}>Dashboard</NavLink>
            <NavLink to="/produtos" className={navItem}>Produtos</NavLink>
            <NavLink to="/clientes" className={navItem}>Clientes</NavLink>
            <NavLink to="/usuarios" className={navItem}>Usuários</NavLink>
            <NavLink to="/vendas" className={navItem}>Vendas</NavLink>
          </div>

          {/* Desktop user actions */}
          <div className="hidden md:flex items-center gap-3">
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
              className="inline-flex items-center justify-center p-2 rounded-lg border border-white/30 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700 hover:bg-white/10"
              onClick={() => setOpen(v => !v)}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      {open && (
        <div className="md:hidden border-t border-white/10 bg-primary-800/95 backdrop-blur">
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/90">{user?.nome || user?.usuario || 'Usuário'}</span>
            </div>
            <div className="flex flex-col gap-2">
              <NavLink to="/dashboard" className={navItem} onClick={() => setOpen(false)}>Dashboard</NavLink>
              <NavLink to="/produtos" className={navItem} onClick={() => setOpen(false)}>Produtos</NavLink>
              <NavLink to="/clientes" className={navItem} onClick={() => setOpen(false)}>Clientes</NavLink>
              <NavLink to="/usuarios" className={navItem} onClick={() => setOpen(false)}>Usuários</NavLink>
              <NavLink to="/vendas" className={navItem} onClick={() => setOpen(false)}>Vendas</NavLink>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
