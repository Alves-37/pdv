import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'

export default function Vendas() {
  const tenantTipoNegocio = (localStorage.getItem('tenant_tipo_negocio') || 'mercearia').toLowerCase()
  const isRestaurante = tenantTipoNegocio === 'restaurante'

  const [q, setQ] = useState('')
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('today') // today | month | all
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [prodMap, setProdMap] = useState({})
  const [usuarios, setUsuarios] = useState([])
  const [usuarioId, setUsuarioId] = useState('') // UUID do vendedor ou '' para todos

  // Utilitário para datas no formato YYYY-MM-DD (local)
  const toYMD = (d) => {
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  // Carregar conforme período selecionado (com polling + foco/visibilidade)
  const loadData = useCallback(async () => {
    let mounted = true
    setLoading(true)
    setError(null)
    try {
      let data
      if (isRestaurante) {
        data = await api.getPedidos({ status: 'pago', limit: 300 })
      } else
      if (period === 'today') {
        const today = new Date()
        const ymd = toYMD(today)
        data = await api.getVendasPeriodo(ymd, ymd, usuarioId || undefined)
      } else if (period === 'month') {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const data_inicio = toYMD(start)
        const data_fim = toYMD(now)
        data = await api.getVendasPeriodo(data_inicio, data_fim, usuarioId || undefined)
      } else {
        if (usuarioId) {
          // quando há filtro de vendedor, usar um período amplo até hoje
          const data_inicio = '1970-01-01'
          const data_fim = toYMD(new Date())
          data = await api.getVendasPeriodo(data_inicio, data_fim, usuarioId)
        } else {
          data = await api.getVendas()
        }
      }
      const arr = Array.isArray(data) ? data : (data?.items || [])
      if (mounted) setTodos(arr)
    } catch (e) {
      // Fallback: se a busca por período falhar, tentar uma listagem geral para não quebrar a UI
      if (mounted) setError(e.message)
      try {
        let fallback
        if (isRestaurante) {
          fallback = await api.getPedidos({ status: 'pago', limit: 300 })
        } else if (usuarioId) {
          const data_inicio = '1970-01-01'
          const data_fim = toYMD(new Date())
          fallback = await api.getVendasPeriodo(data_inicio, data_fim, usuarioId)
        } else {
          fallback = await api.getVendas()
        }
        const arr2 = Array.isArray(fallback) ? fallback : (fallback?.items || [])
        if (mounted) setTodos(arr2)
      } catch {
        // mantém erro e lista vazia
      }
    } finally {
      if (mounted) setLoading(false)
    }
    return () => { mounted = false }
  }, [isRestaurante, period, usuarioId])

  useEffect(() => {
    let cleanup = loadData()
    const intervalId = setInterval(() => { loadData() }, 20000)
    const onFocus = () => loadData()
    const onVisibility = () => { if (document.visibilityState === 'visible') loadData() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (typeof cleanup === 'function') cleanup()
      clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [loadData])

  // Carregar produtos uma vez para mapear nomes no detalhe (opcional)
  useEffect(() => {
    if (isRestaurante) return
    let mounted = true
    async function loadProducts() {
      try {
        const data = await api.getProdutos('')
        const arr = Array.isArray(data) ? data : (data?.items || [])
        const map = {}
        for (const p of arr) {
          const key = p.id || p.uuid
          if (key) map[key] = p.nome || p.descricao || key
        }
        if (mounted) setProdMap(map)
      } catch { /* silencioso */ }
    }
    loadProducts()
    return () => { mounted = false }
  }, [isRestaurante])

  // Carregar usuários (vendedores) para o filtro
  useEffect(() => {
    if (isRestaurante) return
    let mounted = true
    async function loadUsers() {
      try {
        const data = await api.getUsuarios()
        const arr = Array.isArray(data) ? data : (data?.items || [])
        if (mounted) setUsuarios(arr)
      } catch {}
    }
    loadUsers()
    return () => { mounted = false }
  }, [isRestaurante])

  // Debounce da busca
  const [debouncedQ, setDebouncedQ] = useState('')
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim().toLowerCase()), 250)
    return () => clearTimeout(id)
  }, [q])

  const fmtMT = (v) => {
    if (v === null || v === undefined) return '—'
    try {
      const num = new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v))
      return `MT ${num}`
    } catch { return `${v}` }
  }

  const fmtData = (d) => {
    if (!d) return '—'
    try {
      return new Intl.DateTimeFormat('pt-MZ', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(d))
    } catch {
      return `${d}`
    }
  }

  const fmtDataHora = (d) => {
    if (!d) return '—'
    try {
      return new Intl.DateTimeFormat('pt-MZ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
    } catch {
      return `${d}`
    }
  }

  // Calcula total a partir dos itens quando possível (subtotais - desconto)
  const calcTotal = (venda) => {
    if (isRestaurante) {
      return Number(venda?.total ?? 0)
    }
    try {
      const itens = Array.isArray(venda?.itens) ? venda.itens : []
      if (itens.length === 0) {
        // fallback para campos existentes
        return Number(venda?.total ?? venda?.total_venda ?? 0)
      }
      const soma = itens.reduce((acc, it) => acc + Number(it?.subtotal || 0), 0)
      const desconto = Number(venda?.desconto || 0)
      const total = soma - desconto
      return total >= 0 ? total : 0
    } catch {
      return Number(venda?.total ?? venda?.total_venda ?? 0)
    }
  }

  const filtrados = useMemo(() => {
    if (!debouncedQ) return todos
    return todos.filter(v => {
      const numero = String(v.numero || v.pedido_id || v.id || v.pedido_uuid || '').toLowerCase()
      const cliente = (v.cliente_nome || v.cliente || '').toLowerCase()
      const usuario = (v.usuario_nome || v.usuario || '').toLowerCase()
      const mesa = String(v.mesa_id ?? '').toLowerCase()
      return numero.includes(debouncedQ) || cliente.includes(debouncedQ) || usuario.includes(debouncedQ)
        || mesa.includes(debouncedQ)
    })
  }, [todos, debouncedQ])

  const Skeleton = () => (
    <div className="card animate-pulse">
      <div className="h-4 w-40 bg-gray-200 rounded" />
      <div className="mt-3 h-5 w-28 bg-gray-200 rounded" />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold mr-2">{isRestaurante ? 'Fechamentos' : 'Vendas'}</h1>
          {!isRestaurante && (
            <div className="flex items-center gap-2">
              <button
                className={period === 'today' ? 'btn-primary' : 'btn-outline'}
                onClick={() => setPeriod('today')}
              >Hoje</button>
              <button
                className={period === 'month' ? 'btn-primary' : 'btn-outline'}
                onClick={() => setPeriod('month')}
              >Mês</button>
              <button
                className={period === 'all' ? 'btn-primary' : 'btn-outline'}
                onClick={() => setPeriod('all')}
              >Todas</button>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-[220px] sm:min-w-[320px] max-w-xl">
          <label htmlFor="buscar" className="sr-only">Buscar</label>
          <div className="relative">
            <input id="buscar" className="input w-full pl-9" placeholder="Buscar por nº, cliente ou usuário" value={q} onChange={e => setQ(e.target.value)} />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
            </span>
          </div>
        </div>
        {!isRestaurante && (
          <div className="min-w-[200px]">
            <label htmlFor="vendedor" className="sr-only">Vendedor</label>
            <select id="vendedor" className="input w-full" value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
              <option value="">Todos os vendedores</option>
              {usuarios.map(u => (
                <option key={u.id || u.uuid || u.usuario} value={u.id || u.uuid}>
                  {u.nome || u.usuario}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      )}

      {!loading && filtrados.length === 0 && (
        <div className="card text-center py-10">
          <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v14H3z"/><path d="M3 9h18"/></svg>
          </div>
          <p className="mt-3 text-gray-600">Nenhum registro encontrado.</p>
        </div>
      )}

      {!loading && filtrados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((v) => {
            const total = calcTotal(v)
            const itens = Array.isArray(v.itens) ? v.itens.length : (v.quantidade_itens ?? null)
            const cliente = v.cliente_nome || v.cliente || '—'
            const vendedor = v.usuario_nome || v.usuario || '—'
            const titulo = isRestaurante ? `Pedido #${v.pedido_id || (v.pedido_uuid ? String(v.pedido_uuid).slice(0, 8) : '')}` : `Venda #${v.numero || v.id}`
            const dataLinha = isRestaurante ? (v.created_at ? fmtData(v.created_at) : '—') : (v.data ? fmtData(v.data) : '—')
            return (
              <div
                key={v.id || v.uuid || v.pedido_uuid || JSON.stringify(v)}
                className="card card-hover cursor-pointer"
                onClick={async () => {
                  const id = v.id || v.uuid || v.pedido_uuid
                  if (!id) return
                  setDetailOpen(true)
                  setSelected(null)
                  setLoadingDetail(true)
                  try {
                    const full = isRestaurante ? await api.getPedido(id) : await api.getVenda(id)
                    setSelected(full)
                  } catch (e) {
                    setSelected({ erro: e.message })
                  } finally {
                    setLoadingDetail(false)
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate" title={titulo}>{titulo}</h3>
                    <div className="text-xs sm:text-sm text-gray-500">{dataLinha}</div>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      {isRestaurante ? (
                        <>
                          <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            Mesa {v.mesa_id ?? '—'}{v.lugar_numero ? ` / Cliente ${v.lugar_numero}` : ''}
                          </span>
                          <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {vendedor}
                          </span>
                          <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Pago</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{cliente}</span>
                          <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{vendedor}</span>
                        </>
                      )}
                      {itens != null && (
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{itens} itens</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="text-lg sm:text-xl font-semibold text-green-600">{fmtMT(total)}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detalhes da venda */}
      <Modal
        open={detailOpen}
        title={selected ? (isRestaurante ? `Pedido #${selected.pedido_id || String(selected.pedido_uuid || '').slice(0, 8)}` : `Venda #${selected.numero || selected.id}`) : (isRestaurante ? 'Detalhes do pedido' : 'Detalhes da venda')}
        onClose={() => { setDetailOpen(false); setSelected(null) }}
      >
        {loadingDetail && <p className="text-gray-500">Carregando...</p>}
        {!loadingDetail && selected && (
          <div className="space-y-4">
            {selected.erro ? (
              <div className="text-sm text-red-600">{selected.erro}</div>
            ) : isRestaurante ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Mesa</div>
                    <div className="font-medium">Mesa {selected.mesa_id ?? '—'}{selected.lugar_numero ? ` / Cliente ${selected.lugar_numero}` : ''}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Processado por</div>
                    <div className="font-medium">{selected.usuario_nome || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Data</div>
                    <div className="font-medium">{selected.created_at ? fmtData(selected.created_at) : '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Status alterado por</div>
                    <div className="font-medium">{selected.status_updated_by_nome || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Status alterado em</div>
                    <div className="font-medium">{selected.status_updated_at ? fmtDataHora(selected.status_updated_at) : '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="font-medium">{fmtMT(selected.total)}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold mb-2">Itens</div>
                  {(!selected.itens || selected.itens.length === 0) ? (
                    <div className="text-sm text-gray-500">Nenhum item.</div>
                  ) : (
                    <div className="divide-y border rounded-md">
                      {selected.itens.map((it, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{it.produto_nome || it.produto_id}</div>
                            <div className="text-xs text-gray-500">Qtd: {it.quantidade}</div>
                          </div>
                          <div className="font-semibold text-green-700">{fmtMT(it.subtotal)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Cliente</div>
                    <div className="font-medium">{selected.cliente_nome || selected.cliente || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Vendedor</div>
                    <div className="font-medium">{selected.usuario_nome || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Data</div>
                    <div className="font-medium">{selected.created_at ? fmtData(selected.created_at) : '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Forma de pagamento</div>
                    <div className="font-medium">{selected.forma_pagamento || '—'}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold mb-2">Itens</div>
                  {(!selected.itens || selected.itens.length === 0) ? (
                    <div className="text-sm text-gray-500">Nenhum item.</div>
                  ) : (
                    <div className="divide-y border rounded-md">
                      {selected.itens.map((it, idx) => {
                        const pid = it.produto_id
                        const nome = prodMap[pid] || pid
                        const qtd = it.quantidade
                        const sub = it.subtotal
                        return (
                          <div key={idx} className="p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium truncate">{nome}</div>
                              <div className="text-xs text-gray-500">Qtd: {qtd}</div>
                            </div>
                            <div className="font-semibold text-green-700">{fmtMT(sub)}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="text-lg font-semibold text-green-600">{fmtMT(calcTotal(selected))}</div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
