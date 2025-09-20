import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Dividas() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clientes, setClientes] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [grupos, setGrupos] = useState([])
  const [detalhes, setDetalhes] = useState({ open: false, itens: [], data: '', cliente: '' })
  const [syncMsg, setSyncMsg] = useState('')

  // Carregar clientes para filtro
  useEffect(() => {
    let ignore = false
    async function loadClientes() {
      try {
        const data = await api.getClientes()
        if (!ignore) setClientes(data || [])
      } catch (e) {
        console.warn('Falha ao carregar clientes', e)
      }
    }
    loadClientes()
    return () => { ignore = true }
  }, [])

  const canFilter = useMemo(() => !!clienteId || (!!dataInicio && !!dataFim), [clienteId, dataInicio, dataFim])

  async function carregar() {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams()
      if (clienteId) params.set('cliente_id', clienteId)
      if (dataInicio) params.set('data_inicio', dataInicio)
      if (dataFim) params.set('data_fim', dataFim)
      const qs = params.toString()
      const data = await api.getDividasAgrupadas(qs ? `?${qs}` : '')
      setGrupos(data || [])
    } catch (e) {
      setError(e.message || 'Falha ao buscar dívidas')
    } finally {
      setLoading(false)
    }
  }

  async function verDetalhes(g) {
    try {
      const qs = `?cliente_id=${encodeURIComponent(g.cliente_id)}&data=${encodeURIComponent(g.data)}`
      const itens = await api.getDividasDetalhesDia(qs)
      setDetalhes({ open: true, itens: itens || [], data: g.data, cliente: g.cliente_nome })
    } catch (e) {
      setError(e.message || 'Falha ao buscar detalhes')
    }
  }

  async function registrarPagamento(g) {
    if (!confirm('Confirmar pagamento integral das dívidas deste dia?')) return
    try {
      await api.postDividasRegistrarPagamento({
        cliente_id: g.cliente_id,
        data: g.data,
        forma_pagamento: 'Dinheiro',
      })
      await carregar()
    } catch (e) {
      setError(e.message || 'Falha ao registrar pagamento')
    }
  }

  async function removerDia(g) {
    if (!confirm('Remover todas as dívidas pendentes deste dia?')) return
    try {
      await api.deleteDividasRemoverDia({ cliente_id: g.cliente_id, data: g.data })
      await carregar()
    } catch (e) {
      setError(e.message || 'Falha ao remover dívidas do dia')
    }
  }

  async function syncPendencias() {
    // Como o app web é 100% online, aqui apenas refaz o carregamento.
    // Se no futuro houver cache local, pode chamar endpoint dedicado.
    setSyncMsg('Sincronizando...')
    try {
      await carregar()
      setSyncMsg('Sincronização concluída')
      setTimeout(() => setSyncMsg(''), 2500)
    } catch (e) {
      setSyncMsg('Falha na sincronização')
      setTimeout(() => setSyncMsg(''), 3500)
    }
  }

  useEffect(() => { carregar() }, [])

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h1 className="text-xl font-bold text-blue-900">Gestão de Dívidas</h1>
        <p className="text-sm text-gray-500">Visualize e gerencie dívidas por cliente e dia</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="flex flex-col w-full">
            <label className="text-sm text-gray-700">Cliente</label>
            <select value={clienteId} onChange={(e)=>setClienteId(e.target.value)} className="border rounded px-3 py-2 w-full">
              <option value="">Todos</option>
              {clientes.map(c => (
                <option key={c.id || c.uuid} value={(c.uuid || c.id)}>
                  {c.nome} {c.nuit ? `(${c.nuit})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col w-full">
            <label className="text-sm text-gray-700">Data início</label>
            <input type="date" value={dataInicio} onChange={(e)=>setDataInicio(e.target.value)} className="border rounded px-3 py-2 w-full" />
          </div>
          <div className="flex flex-col w-full">
            <label className="text-sm text-gray-700">Data fim</label>
            <input type="date" value={dataFim} onChange={(e)=>setDataFim(e.target.value)} className="border rounded px-3 py-2 w-full" />
          </div>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-2 w-full">
            <button onClick={carregar} disabled={!canFilter && !clienteId && !dataInicio && !dataFim} className={classNames('px-4 py-2 rounded text-white w-full sm:w-auto', 'bg-blue-600 hover:bg-blue-700')}>Filtrar</button>
            <button onClick={syncPendencias} className="px-4 py-2 rounded text-white bg-blue-900 hover:bg-blue-800 w-full sm:w-auto">Sincronizar Pendências</button>
          </div>
          {syncMsg && <span className="text-sm text-gray-600 sm:col-span-2 lg:col-span-1">{syncMsg}</span>}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Dívidas (agrupadas por dia)</h2>
          {loading && <span className="text-sm text-blue-600">Carregando...</span>}
        </div>
        {error && (
          <div className="bg-red-50 text-red-700 p-2 rounded mb-3">{error}</div>
        )}
        {/* Layout mobile: cards */}
        <div className="md:hidden space-y-3">
          {grupos.length === 0 && (
            <div className="py-6 text-center text-gray-500">Nenhuma dívida encontrada</div>
          )}
          {grupos.map((g, idx) => (
            <div key={`${g.cliente_id}-${g.data}-${idx}`} className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">{g.cliente_nome || '-'}</div>
                  <div className="text-base font-semibold">{g.data}</div>
                </div>
                <span className={classNames('px-2 py-1 rounded text-white text-xs', g.status === 'Quitado' ? 'bg-green-600' : g.status === 'Parcial' ? 'bg-amber-600' : 'bg-orange-600')}>
                  {g.status}
                </span>
              </div>
              <div className="mt-2 text-sm">Total do dia: <span className="font-semibold">MT {Number(g.total_dia || 0).toFixed(2)}</span></div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={()=>verDetalhes(g)} className="px-3 py-2 rounded bg-blue-600 text-white text-sm">Detalhes</button>
                {g.status !== 'Quitado' ? (
                  <>
                    <button onClick={()=>registrarPagamento(g)} className="px-3 py-2 rounded bg-green-600 text-white text-sm">Pagar Dia</button>
                    <button onClick={()=>removerDia(g)} className="px-3 py-2 rounded bg-red-600 text-white text-sm col-span-2">Remover Dia</button>
                  </>
                ) : (
                  <div className="col-span-1" />
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Layout desktop: tabela */}
        <div className="hidden md:block overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-700 border-b">
                <th className="py-2 pr-4">Data</th>
                <th className="py-2 pr-4">Cliente</th>
                <th className="py-2 pr-4">Total do Dia</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {grupos.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">Nenhuma dívida encontrada</td>
                </tr>
              )}
              {grupos.map((g, idx) => (
                <tr key={`${g.cliente_id}-${g.data}-${idx}`} className="border-b hover:bg-gray-50">
                  <td className="py-2 pr-4">{g.data}</td>
                  <td className="py-2 pr-4">{g.cliente_nome || '-'}</td>
                  <td className="py-2 pr-4">MT {Number(g.total_dia || 0).toFixed(2)}</td>
                  <td className="py-2 pr-4">
                    <span className={classNames('px-2 py-1 rounded text-white', g.status === 'Quitado' ? 'bg-green-600' : g.status === 'Parcial' ? 'bg-amber-600' : 'bg-orange-600')}>
                      {g.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-2">
                      <button onClick={()=>verDetalhes(g)} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Detalhes</button>
                      {g.status !== 'Quitado' && (
                        <>
                          <button onClick={()=>registrarPagamento(g)} className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700">Pagar Dia</button>
                          <button onClick={()=>removerDia(g)} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Remover Dia</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalhes */}
      {detalhes.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-3">
          <div className="bg-white rounded-lg shadow p-4 w-full max-w-3xl max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Itens do dia {detalhes.data} - {detalhes.cliente}</h3>
              <button onClick={()=>setDetalhes({open:false, itens: [], data:'', cliente:''})} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">Fechar</button>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-700 border-b">
                    <th className="py-2 pr-4">Produto</th>
                    <th className="py-2 pr-4">Qtd/Peso</th>
                    <th className="py-2 pr-4">Preço Unit.</th>
                    <th className="py-2 pr-4">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detalhes.itens.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-500">Sem itens</td>
                    </tr>
                  )}
                  {detalhes.itens.map((r, i) => {
                    const peso = Number(r.peso_kg || 0)
                    const qtd = Number(r.quantidade || 0)
                    const qtdLabel = peso > 0 ? `${peso.toFixed(3)} KG` : `${qtd.toFixed(0)} un`
                    const produto = r.produto || r.produto_id?.slice(0,8)+'...' || 'Produto'
                    return (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-2 pr-4">{produto}</td>
                        <td className="py-2 pr-4">{qtdLabel}</td>
                        <td className="py-2 pr-4">MT {Number(r.preco_unitario||0).toFixed(2)}</td>
                        <td className="py-2 pr-4">MT {Number(r.subtotal||0).toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
