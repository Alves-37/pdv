import { useEffect, useState } from 'react'
import { api } from '../services/api'

export default function Mesas() {
  const tenantTipoNegocio = (localStorage.getItem('tenant_tipo_negocio') || 'mercearia').toLowerCase()
  const isRestaurante = tenantTipoNegocio === 'restaurante'

  const [todos, setTodos] = useState([])
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
        const data = await api.getMesas()
        if (!mounted) return
        setTodos(Array.isArray(data) ? data : [])
      } catch (e) {
        if (mounted) setError(e.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    const intervalId = setInterval(load, 20000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => {
      mounted = false
      clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Mesas</h1>
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

      {!loading && todos.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-gray-600">Nenhuma mesa encontrada.</p>
        </div>
      )}

      {!loading && todos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {todos.map((m, idx) => (
            <div key={m?.numero ?? idx} className="card">
              <div className="text-sm text-gray-500">Mesa</div>
              <div className="text-xl font-bold">{m.numero}</div>
              <div className="mt-2 text-sm text-gray-700">Capacidade: <span className="font-semibold">{m.capacidade}</span></div>
              <div className="mt-1 text-sm text-gray-700">Status: <span className="font-semibold">{m.status}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
