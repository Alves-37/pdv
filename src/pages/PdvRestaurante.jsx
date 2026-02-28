import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function PdvRestaurante() {
  const navigate = useNavigate()

  const tenantTipoNegocio = (localStorage.getItem('tenant_tipo_negocio') || 'mercearia').toLowerCase()
  const isRestaurante = tenantTipoNegocio === 'restaurante'

  const [mesas, setMesas] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isRestaurante) {
      setError('Esta página está disponível apenas para o modo Restaurante.')
      return
    }

    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [m, p] = await Promise.all([
          api.getMesas(),
          api.getPedidos({ status: 'aberto', limit: 200 }),
        ])
        if (!mounted) return
        setMesas(Array.isArray(m) ? m : [])
        setPedidos(Array.isArray(p) ? p : [])
      } catch (e) {
        if (mounted) setError(e.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    const intervalId = setInterval(load, 15000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => {
      mounted = false
      clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
    }
  }, [isRestaurante])

  const pedidosPorMesa = useMemo(() => {
    const map = new Map()
    for (const p of pedidos || []) {
      const key = p?.mesa_id ?? 0
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(p)
    }
    return map
  }, [pedidos])

  const badgeMesa = (status) => {
    const st = String(status || '').toLowerCase()
    if (st === 'ocupada') return 'bg-yellow-100 text-yellow-800'
    if (st === 'livre') return 'bg-green-100 text-green-800'
    if (st === 'reservada') return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

  const fmtMT = (v) => {
    if (v === null || v === undefined) return '—'
    try {
      const num = new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v))
      return `MT ${num}`
    } catch { return `${v}` }
  }

  if (!isRestaurante) {
    return (
      <div className="space-y-3">
        {error && <p className="text-red-600">{error}</p>}
        <button className="btn-outline" onClick={() => navigate('/dashboard', { replace: true })}>Voltar</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">PDV</h1>
        <div className="flex items-center gap-2">
          <button className="btn-outline" onClick={() => navigate('/mesas')}>Mesas</button>
          <button className="btn-primary" onClick={() => navigate('/pedidos')}>Pedidos</button>
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="mt-3 h-5 w-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && mesas.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-gray-600">Nenhuma mesa encontrada.</p>
        </div>
      )}

      {!loading && mesas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mesas.map((m, idx) => {
            const mesaNumero = m?.numero ?? idx
            const mesaId = Number(mesaNumero)
            const lista = pedidosPorMesa.get(mesaId) || []
            const totalMesa = lista.reduce((acc, p) => acc + Number(p?.total ?? 0), 0)
            return (
              <button
                key={m?.numero ?? idx}
                type="button"
                className="card card-hover text-left"
                onClick={() => navigate('/pedidos')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-gray-500">Mesa</div>
                    <div className="text-xl font-bold">{mesaNumero}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${badgeMesa(m?.status)}`}>{m?.status || '—'}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="text-sm text-gray-700">
                    Pedidos: <span className="font-semibold">{lista.length}</span>
                  </div>
                  <div className="text-sm text-gray-700 text-right">
                    Total: <span className="font-semibold">{fmtMT(totalMesa)}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {!loading && pedidos.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-gray-500">Pedidos abertos</div>
              <div className="text-lg font-semibold">{pedidos.length}</div>
            </div>
            <button className="btn-outline" onClick={() => navigate('/pedidos')}>Ver todos</button>
          </div>
        </div>
      )}
    </div>
  )
}
