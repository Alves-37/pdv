import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, API_BASE_URL } from '../services/api'
import Modal from '../components/Modal'

export default function PdvRestaurante() {
  const navigate = useNavigate()

  const tenantTipoNegocio = (localStorage.getItem('tenant_tipo_negocio') || 'mercearia').toLowerCase()
  const isRestaurante = tenantTipoNegocio === 'restaurante'

  const [produtos, setProdutos] = useState([])
  const [mesas, setMesas] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [tipoVenda, setTipoVenda] = useState('balcao')
  const [mesaId, setMesaId] = useState(null)
  const [mesaModalOpen, setMesaModalOpen] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState('DINHEIRO')
  const [finalizando, setFinalizando] = useState(false)

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
        const [m, pr] = await Promise.all([
          api.getMesas(),
          api.getProdutos('', { incluir_inativos: false }),
        ])
        if (!mounted) return
        setMesas(Array.isArray(m) ? m : [])
        const arr = Array.isArray(pr) ? pr : (pr?.items || [])
        setProdutos(Array.isArray(arr) ? arr : [])
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

  const fmtMT = (v) => {
    if (v === null || v === undefined) return '—'
    try {
      const num = new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v))
      return `MT ${num}`
    } catch { return `${v}` }
  }

  const getProdutoImageUrl = (p) => {
    const path = String(p?.imagem_path || '')
    if (!path) return ''
    if (path.startsWith('/media/')) {
      const v = p?.updated_at ? encodeURIComponent(String(p.updated_at)) : String(Date.now())
      const sep = path.includes('?') ? '&' : '?'
      return `${API_BASE_URL}${path}${sep}v=${v}`
    }
    return path
  }

  const cartTotal = useMemo(() => {
    return (cart || []).reduce((acc, it) => acc + Number(it?.subtotal || 0), 0)
  }, [cart])

  function addToCart(prod) {
    if (!prod?.id) return
    const preco = Number(prod.preco_venda ?? prod.preco ?? 0)
    if (!(preco > 0)) return
    setCart((prev) => {
      const arr = Array.isArray(prev) ? [...prev] : []
      const idx = arr.findIndex(x => String(x.produto_id) === String(prod.id))
      if (idx >= 0) {
        const cur = arr[idx]
        const qtd = Number(cur.quantidade || 0) + 1
        const subtotal = preco * qtd
        arr[idx] = { ...cur, quantidade: qtd, subtotal }
        return arr
      }
      return [...arr, { produto_id: String(prod.id), produto_nome: prod.nome || 'Produto', preco_unitario: preco, quantidade: 1, subtotal: preco }]
    })
  }

  function changeQty(produtoId, delta) {
    setCart((prev) => {
      const arr = Array.isArray(prev) ? [...prev] : []
      const idx = arr.findIndex(x => String(x.produto_id) === String(produtoId))
      if (idx < 0) return arr
      const cur = arr[idx]
      const qtd = Number(cur.quantidade || 0) + Number(delta || 0)
      if (qtd <= 0) {
        arr.splice(idx, 1)
        return arr
      }
      const subtotal = Number(cur.preco_unitario || 0) * qtd
      arr[idx] = { ...cur, quantidade: qtd, subtotal }
      return arr
    })
  }

  async function finalizar() {
    if (finalizando) return
    if (!cart || cart.length === 0) {
      setError('Adicione pelo menos um produto')
      return
    }
    if (tipoVenda === 'mesa' && (mesaId == null || mesaId === '')) {
      setError('Selecione a mesa')
      return
    }

    setFinalizando(true)
    setError(null)
    try {
      const payload = {
        total: Number(cartTotal || 0),
        desconto: 0,
        forma_pagamento: String(formaPagamento || 'DINHEIRO'),
        tipo_pedido: 'local',
        status_pedido: 'pago',
        mesa_id: tipoVenda === 'mesa' ? Number(mesaId) : 0,
        lugar_numero: 1,
        itens: cart.map(it => ({
          produto_id: String(it.produto_id),
          quantidade: Number(it.quantidade || 0),
          preco_unitario: Number(it.preco_unitario || 0),
          subtotal: Number(it.subtotal || 0),
        })),
      }
      await api.createVenda(payload)
      setCart([])
      setMesaId(null)
      setTipoVenda('balcao')
      setFormaPagamento('DINHEIRO')
    } catch (e) {
      setError(e.message)
    } finally {
      setFinalizando(false)
    }
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
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      <div className="px-1 sm:px-0">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <h1 className="text-2xl font-bold">PDV</h1>
          <div className="flex items-center gap-2">
            <button className="btn-outline" onClick={() => navigate('/produtos')}>Gerir produtos</button>
          </div>
        </div>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-24 bg-gray-200 rounded" />
                <div className="mt-3 h-4 w-24 bg-gray-200 rounded" />
                <div className="mt-2 h-4 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && produtos.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-gray-600">Nenhum produto encontrado.</p>
          </div>
        )}

        {!loading && produtos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pb-40">
            {produtos.filter(p => p?.ativo !== false).map((p) => {
              const imgUrl = getProdutoImageUrl(p)
              const preco = Number(p.preco_venda ?? p.preco ?? 0)
              const inCart = cart.find(x => String(x.produto_id) === String(p.id))
              const qtd = inCart ? Number(inCart.quantidade || 0) : 0
              return (
                <button
                  key={p.id || p.uuid || p.codigo}
                  type="button"
                  className="card card-hover text-left"
                  onClick={() => addToCart(p)}
                >
                  <div className="-mx-4 -mt-4 mb-3">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={p.nome || 'Produto'}
                        className="w-full h-28 object-cover rounded-t-xl border-b"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-28 bg-gray-100 rounded-t-xl border-b flex items-center justify-center text-gray-400">
                        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate" title={p.nome}>{p.nome}</div>
                      <div className="text-sm text-green-700 font-semibold">{fmtMT(preco)}</div>
                    </div>
                    {qtd > 0 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-800">{qtd}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="fixed left-0 right-0 bottom-0 z-40 border-t bg-white/95 backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-lg font-semibold text-green-700">{fmtMT(cartTotal)}</div>
          </div>

          {cart.length > 0 && (
            <div className="max-h-40 overflow-y-auto border rounded-lg">
              {cart.map((it) => (
                <div key={it.produto_id} className="px-3 py-2 flex items-center justify-between gap-2 border-b last:border-b-0">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{it.produto_nome}</div>
                    <div className="text-xs text-gray-500">{fmtMT(it.preco_unitario)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="btn-outline" type="button" onClick={() => changeQty(it.produto_id, -1)}>-</button>
                    <div className="w-10 text-center font-semibold">{it.quantidade}</div>
                    <button className="btn-outline" type="button" onClick={() => changeQty(it.produto_id, 1)}>+</button>
                  </div>
                  <div className="w-28 text-right font-semibold">{fmtMT(it.subtotal)}</div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div>
              <label className="text-xs text-gray-600">Tipo</label>
              <select className="input w-full" value={tipoVenda} onChange={(e) => {
                const v = e.target.value
                setTipoVenda(v)
                if (v !== 'mesa') setMesaId(null)
              }}>
                <option value="balcao">Balcão</option>
                <option value="mesa">Mesa</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600">Mesa</label>
              <button
                type="button"
                className="btn-outline w-full"
                disabled={tipoVenda !== 'mesa'}
                onClick={() => setMesaModalOpen(true)}
              >
                {mesaId ? `Mesa ${mesaId}` : 'Selecionar mesa'}
              </button>
            </div>

            <div>
              <label className="text-xs text-gray-600">Pagamento</label>
              <select className="input w-full" value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="M_PESA">M-Pesa</option>
                <option value="EMOLA">eMola</option>
                <option value="CARTAO">Cartão</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                className="btn-primary w-full"
                disabled={finalizando || cart.length === 0 || (tipoVenda === 'mesa' && !mesaId)}
                onClick={finalizar}
              >
                {finalizando ? 'Finalizando...' : 'Finalizar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={mesaModalOpen}
        title="Selecionar mesa"
        onClose={() => setMesaModalOpen(false)}
        actions={<button className="btn-outline" onClick={() => setMesaModalOpen(false)}>Fechar</button>}
      >
        {mesas.length === 0 ? (
          <div className="text-sm text-gray-600">Nenhuma mesa disponível.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {mesas.map((m, idx) => {
              const n = Number(m?.numero ?? idx)
              return (
                <button
                  key={m?.id ?? m?.numero ?? idx}
                  type="button"
                  className={`btn-outline ${mesaId === n ? 'ring-2 ring-primary-500/40' : ''}`}
                  onClick={() => { setMesaId(n); setMesaModalOpen(false) }}
                >
                  Mesa {n}
                </button>
              )
            })}
          </div>
        )}
      </Modal>
    </div>
  )
}
