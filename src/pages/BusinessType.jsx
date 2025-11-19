import { useNavigate } from 'react-router-dom'

export default function BusinessType() {
  const navigate = useNavigate()

  function handleMercearia() {
    navigate('/dashboard', { replace: true })
  }

  function handleRestaurante() {
    navigate('/restaurante/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="mb-6 text-center text-slate-100">
          <h1 className="text-2xl font-bold tracking-tight">Escolha como deseja usar o sistema</h1>
          <p className="text-sm text-slate-300 mt-1">Você pode alternar entre Mercearia e Restaurante a qualquer momento.</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur rounded-2xl shadow-2xl border border-white/10 p-6 space-y-4">
          <button
            type="button"
            onClick={handleMercearia}
            className="group w-full flex items-center justify-between gap-3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white text-sm font-medium shadow-card hover:shadow-card-hover transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 group-hover:bg-white/15 transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7h18v13H3z" />
                  <path d="M16 3H8v4" />
                </svg>
              </span>
              <div className="text-left">
                <div className="text-sm font-semibold">Mercearia</div>
                <div className="text-xs text-blue-100/80">Focado em vendas de balcão e gestão de estoque.</div>
              </div>
            </div>
            <svg className="h-4 w-4 text-blue-100 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleRestaurante}
            className="group w-full flex items-center justify-between gap-3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white text-sm font-medium shadow-card hover:shadow-card-hover transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 group-hover:bg-white/15 transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 3h16v4H4z" />
                  <path d="M10 14v7" />
                  <path d="M4 10h16v11H4z" />
                  <path d="M14 14v3" />
                </svg>
              </span>
              <div className="text-left">
                <div className="text-sm font-semibold">Restaurante</div>
                <div className="text-xs text-emerald-100/80">Ideal para mesas, pedidos e controle de cozinha.</div>
              </div>
            </div>
            <svg className="h-4 w-4 text-emerald-100 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
