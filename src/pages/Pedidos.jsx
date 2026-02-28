import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'

export default function Pedidos() {
  const [status, setStatus] = useState('aberto')
  const [mesaId, setMesaId] = useState('')
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [updateOpen, setUpdateOpen] = useState(false)
  const [updateStatus, setUpdateStatus] = useState('')
  const [updateSubmitting, setUpdateSubmitting] = useState(false)

  const tenantTipoNegocio = (localStorage.getItem('tenant_tipo_negocio') || 'mercearia').toLowerCase()
  const isRestaurante = tenantTipoNegocio === 'restaurante'

  const canUpdateStatus = true

  const normStatus = (s) => String(s || '').trim().toLowerCase()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!isRestaurante) {
      setError('Esta página está disponível apenas para o modo Restaurante.')
      return
    }

    if (!token) {
      setError('Faça login para visualizar pedidos.')
      return
    }

    let mounted = true
    let intervalId = null
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const mesaDigits = String(mesaId || '').match(/\d+/)?.[0]
        const data = await api.getPedidos({
          status: status || undefined,
          mesaId: mesaDigits || undefined,
          limit: 200,
        })
        if (!mounted) return
        setTodos(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!mounted) return
        const msg = String(e?.message || '')
        // Se token expirou / inválido, parar polling para não spammar 401
        if (msg.toLowerCase().includes('http 401') || msg.toLowerCase().includes('not authenticated') || msg.toLowerCase().includes('could not validate credentials')) {
          setError('Sessão expirada. Faça login novamente.')
          if (intervalId) clearInterval(intervalId)
          return
        }
        setError(msg)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    intervalId = setInterval(load, 15000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
    }
  }, [status, mesaId])

  const fmtMT = (v) => {
    if (v === null || v === undefined) return '—'
    try {
      const num = new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v))
      return `MT ${num}`
    } catch { return `${v}` }
  }

  const fmtMesa = (p) => {
    if (p?.mesa_id == null) return '—'
    if (Number(p.mesa_id) === 0) return '🛒 Balcão'
    const lugar = p?.lugar_numero ? ` / Cliente ${p.lugar_numero}` : ''
    return `Mesa ${p.mesa_id}${lugar}`
  }

  const badge = (s) => {
    const st = String(s || '').toLowerCase()
    if (st === 'pago') return 'bg-green-100 text-green-800'
    if (st === 'entregue' || st === 'pronto') return 'bg-blue-100 text-blue-800'
    if (st === 'em_preparo') return 'bg-yellow-100 text-yellow-800'
    if (st === 'cancelado') return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  const ordenados = useMemo(() => {
    return [...(todos || [])]
  }, [todos])

  async function openDetails(p) {
    if (!p?.pedido_uuid) return
    setSelected(null)
    setDetailOpen(true)
    setLoadingDetail(true)
    try {
      const data = await api.getPedido(p.pedido_uuid)
      setSelected(data)
    } catch (e) {
      setError(e.message)
      setDetailOpen(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  function openUpdate(p) {
    const st = normStatus(p?.status)
    if (st === 'pago') return
    if (!canUpdateStatus) return
    setSelected(p)
    setUpdateStatus(String(p?.status || ''))
    setUpdateOpen(true)
  }

  async function submitUpdate() {
    if (!canUpdateStatus) return
    if (!selected?.pedido_uuid) return
    if (normStatus(selected?.status) === 'pago') return
    const st = String(updateStatus || '').trim()
    if (!st) return
    setUpdateSubmitting(true)
    try {
      await api.updatePedidoStatus(selected.pedido_uuid, st)
      setUpdateOpen(false)
      // refresh
      const mesaDigits = String(mesaId || '').match(/\d+/)?.[0]
      const data = await api.getPedidos({
        status: status || undefined,
        mesaId: mesaDigits || undefined,
        limit: 200,
      })
      setTodos(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setUpdateSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <div className="grid grid-cols-2 gap-2 min-w-[260px]">
          <input
            className="input w-full"
            value={mesaId}
            inputMode="numeric"
            onChange={(e) => setMesaId(e.target.value)}
            placeholder="Mesa (ex: 3)"
          />
          <select className="input w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="aberto">Aberto</option>
            <option value="em_preparo">Em preparo</option>
            <option value="pronto">Pronto</option>
            <option value="entregue">Entregue</option>
            <option value="pago">Pago</option>
            <option value="criado">Criado</option>
            <option value="aguardando_pagamento">Aguardando pagamento</option>
            <option value="cancelado">Cancelado</option>
          </select>
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

      {!loading && ordenados.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-gray-600">Nenhum pedido encontrado.</p>
        </div>
      )}

      {!loading && ordenados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ordenados.map((p) => (
            <div key={p.pedido_uuid} className="card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 truncate">#{p.pedido_id}</div>
                  <div className="font-semibold truncate">{fmtMesa(p)}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${badge(p.status)}`}>{String(p.status || '—')}</span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-sm font-semibold text-green-700">{fmtMT(p.total)}</div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="btn-outline w-full" onClick={() => openDetails(p)}>Detalhes</button>
                {(() => {
                  const st = normStatus(p?.status)
                  const isPago = st === 'pago'
                  if (isPago) {
                    return <button className="btn-outline w-full" disabled title="Pedido já está pago">Status</button>
                  }
                  if (!canUpdateStatus) {
                    return <button className="btn-outline w-full" disabled title="Sem permissão">Status</button>
                  }
                  return <button className="btn-primary w-full" onClick={() => openUpdate(p)}>Status</button>
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={detailOpen}
        title={selected ? `Pedido #${selected.pedido_id}` : 'Carregando...'}
        onClose={() => setDetailOpen(false)}
        actions={<button className="btn-outline" onClick={() => setDetailOpen(false)}>Fechar</button>}
      >
        {loadingDetail && <p className="text-sm text-gray-600">Carregando detalhes...</p>}
        {!loadingDetail && selected && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status</span>
              <span className={`text-xs px-2 py-1 rounded-full ${badge(selected.status)}`}>{selected.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Mesa</span>
              <span className="font-medium">{fmtMesa(selected)}</span>
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
                      <div className="font-medium truncate">{it.produto_nome}</div>
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

      <Modal
        open={updateOpen}
        title={selected ? `Alterar status #${selected.pedido_id}` : 'Alterar status'}
        onClose={() => { if (!updateSubmitting) setUpdateOpen(false) }}
        fullScreenMobile={false}
        actions={(
          <>
            <button className="btn-outline" disabled={updateSubmitting} onClick={() => setUpdateOpen(false)}>Cancelar</button>
            <button className="btn-primary" disabled={updateSubmitting} onClick={submitUpdate}>{updateSubmitting ? 'Salvando...' : 'Salvar'}</button>
          </>
        )}
      >
        <div className="space-y-3">
          <label className="text-sm text-gray-600">Status</label>
          <select className="input w-full" value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)}>
            <option value="aberto">Aberto</option>
            <option value="em_preparo">Em preparo</option>
            <option value="pronto">Pronto</option>
            <option value="entregue">Entregue</option>
            <option value="pago">Pago</option>
            <option value="cancelado">Cancelado</option>
            <option value="criado">Criado</option>
            <option value="aguardando_pagamento">Aguardando pagamento</option>
          </select>
        </div>
      </Modal>
    </div>
  )
}
