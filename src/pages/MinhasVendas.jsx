import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'

export default function MinhasVendas() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [prodMap, setProdMap] = useState({})

  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  const toYMD = (d) => {
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const fmtMT = (v) => {
    if (v === null || v === undefined) return '—'
    try {
      const num = new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v))
      return `MT ${num}`
    } catch { return `${v}` }
  }

  const fmtHora = (iso) => {
    if (!iso) return '—'
    try {
      const d = new Date(iso)
      return new Intl.DateTimeFormat('pt-MZ', { hour: '2-digit', minute: '2-digit' }).format(d)
    } catch { return '—' }
  }

  const fmtDataHora = (iso) => {
    if (!iso) return '—'
    try {
      const d = new Date(iso)
      return new Intl.DateTimeFormat('pt-MZ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d)
    } catch { return '—' }
  }

  useEffect(() => {
    let mounted = true
    async function loadProducts() {
      try {
        const data = await api.getProdutos('')
        const arr = Array.isArray(data) ? data : (data?.items || [])
        const map = {}
        for (const p of arr) {
          const key = p.id || p.uuid
          if (key) map[String(key)] = p.nome || p.descricao || String(key)
        }
        if (mounted) setProdMap(map)
      } catch {
        if (mounted) setProdMap({})
      }
    }
    loadProducts()
    return () => { mounted = false }
  }, [])

  const load = useCallback(async () => {
    let mounted = true
    setLoading(true)
    setError(null)
    try {
      const today = new Date()
      const ymd = toYMD(today)
      const data = await api.getVendasPeriodo(ymd, ymd)
      const arr = Array.isArray(data) ? data : (data?.items || [])
      if (mounted) setTodos(arr)
    } catch (e) {
      if (mounted) setError(e.message)
    } finally {
      if (mounted) setLoading(false)
    }
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let cleanup = load()
    const intervalId = setInterval(() => { load() }, 20000)
    const onFocus = () => load()
    const onVisibility = () => { if (document.visibilityState === 'visible') load() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (typeof cleanup === 'function') cleanup()
      clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [load])

  const totalDia = useMemo(() => {
    return (todos || []).reduce((acc, v) => acc + Number(v?.total || 0), 0)
  }, [todos])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Minhas Vendas</h1>
        <div className="card px-4 py-3">
          <div className="text-xs text-gray-500">Total de hoje</div>
          <div className="text-lg font-semibold text-green-700">{fmtMT(totalDia)}</div>
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="mt-3 h-5 w-28 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && (todos || []).length === 0 && (
        <div className="card text-center py-10">
          <p className="text-gray-600">Nenhuma venda hoje.</p>
        </div>
      )}

      {!loading && (todos || []).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(todos || []).map((v) => (
            <div key={v.id} className="card p-3">
              <div className="text-xs text-gray-500 truncate">#{String(v.id || '').slice(0, 8)}</div>
              <div className="mt-1 text-xs text-gray-500">Hora: {fmtHora(v.created_at)}</div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-sm font-semibold text-green-700">{fmtMT(v.total)}</div>
              </div>
              <div className="mt-3">
                <button className="btn-outline w-full" onClick={() => { setSelected(v); setDetailOpen(true) }}>Detalhes</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={detailOpen}
        title={selected ? `Venda #${String(selected.id || '').slice(0, 8)}` : 'Detalhes'}
        onClose={() => setDetailOpen(false)}
        actions={<button className="btn-outline" onClick={() => setDetailOpen(false)}>Fechar</button>}
      >
        {!selected ? (
          <p className="text-sm text-gray-600">Selecione uma venda.</p>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Data/Hora</span>
              <span className="font-medium">{fmtDataHora(selected.created_at)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Forma de pagamento</span>
              <span className="font-medium">{selected.forma_pagamento || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-semibold">{fmtMT(selected.total)}</span>
            </div>
            <div>
              <div className="text-gray-600 mb-1">Itens</div>
              <div className="space-y-2">
                {(selected.itens || []).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 border rounded-md px-3 py-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{prodMap[String(it.produto_id)] || it.produto?.nome || it.produto_nome || it.produto_id}</div>
                      <div className="text-xs text-gray-500">Qtd: {it.quantidade}</div>
                    </div>
                    <div className="font-semibold">{fmtMT(it.subtotal)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
