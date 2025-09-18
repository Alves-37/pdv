import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'

export default function RelatoriosFinanceiros() {
  const today = useMemo(() => new Date(), [])
  const toYMD = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const [inicio, setInicio] = useState(() => {
    const d = new Date(today.getFullYear(), today.getMonth(), 1)
    return toYMD(d)
  })
  const [fim, setFim] = useState(() => toYMD(today))
  const [usuarios, setUsuarios] = useState([])
  const [usuarioId, setUsuarioId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [vendas, setVendas] = useState([])
  const [custoPorProduto, setCustoPorProduto] = useState({})

  const fmtMT = (v) => {
    try {
      return `MT ${new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v||0))}`
    } catch { return `MT ${v}` }
  }

  useEffect(() => {
    let mounted = true
    async function loadUsersProducts() {
      try {
        const [usersData, prodsData] = await Promise.all([
          api.getUsuarios().catch(() => []),
          api.getProdutos('').catch(() => []),
        ])
        const users = Array.isArray(usersData) ? usersData : (usersData?.items || [])
        const prods = Array.isArray(prodsData) ? prodsData : (prodsData?.items || [])
        const map = {}
        for (const p of prods) {
          const key = p.id || p.uuid
          if (!key) continue
          map[key] = Number(p.preco_custo ?? p.custo ?? 0)
        }
        if (mounted) {
          setUsuarios(users)
          setCustoPorProduto(map)
        }
      } catch {}
    }
    loadUsersProducts()
    return () => { mounted = false }
  }, [])

  async function buscar() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getVendasPeriodo(inicio, fim, usuarioId || undefined)
      const arr = Array.isArray(data) ? data : (data?.items || [])
      setVendas(arr)
    } catch (e) {
      setError(e.message)
      setVendas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { buscar() }, [])

  const resumo = useMemo(() => {
    let faturamento = 0
    let custo = 0
    let itensTotal = 0
    for (const v of vendas) {
      for (const it of (v.itens || [])) {
        const pid = it.produto_id || it.produto?.id
        const precoUnit = Number(it.preco_unitario ?? 0)
        const qtd = Number(it.peso_kg && it.peso_kg > 0 ? it.peso_kg : (it.quantidade ?? 0))
        const custoUnit = Number(custoPorProduto[pid] ?? 0)
        faturamento += precoUnit * qtd
        custo += custoUnit * qtd
        itensTotal += qtd
      }
    }
    const lucro = faturamento - custo
    const qtdVendas = vendas.length
    const ticketMedio = qtdVendas > 0 ? faturamento / qtdVendas : 0
    return { faturamento, custo, lucro, qtdVendas, ticketMedio, itensTotal }
  }, [vendas, custoPorProduto])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Relatórios Financeiros</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div>
            <label className="block text-xs text-gray-600">De</label>
            <input type="date" className="input" value={inicio} onChange={e => setInicio(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-600">Até</label>
            <input type="date" className="input" value={fim} onChange={e => setFim(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-600">Vendedor</label>
            <select className="input min-w-[200px]" value={usuarioId} onChange={e => setUsuarioId(e.target.value)}>
              <option value="">Todos</option>
              {usuarios.map(u => (
                <option key={u.id || u.uuid || u.usuario} value={u.id || u.uuid}>{u.nome || u.usuario}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={buscar} disabled={loading}>Filtrar</button>
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card title="Faturamento" value={fmtMT(resumo.faturamento)} color="primary" />
        <Card title="Custo" value={fmtMT(resumo.custo)} color="secondary" />
        <Card title="Lucro" value={fmtMT(resumo.lucro)} color="accent" />
        <Card title="Qtd. Vendas" value={resumo.qtdVendas} color="danger" />
        <Card title="Ticket Médio" value={fmtMT(resumo.ticketMedio)} color="primary" />
        <Card title="Itens Vendidos" value={resumo.itensTotal} color="secondary" />
      </section>
    </div>
  )
}

function Card({ title, value, color = 'primary' }) {
  const colorGrad = {
    primary: 'from-primary-600 via-primary-700 to-primary-900',
    secondary: 'from-secondary-600 via-secondary-700 to-secondary-900',
    accent: 'from-accent-600 via-accent-700 to-accent-900',
    danger: 'from-danger-600 via-danger-700 to-danger-900',
  }
  const grad = colorGrad[color] || colorGrad.primary
  return (
    <div className={`rounded-xl p-4 shadow-card border border-white/10 bg-gradient-to-br ${grad} text-white`}>
      <div className="text-xs text-white/80">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}
