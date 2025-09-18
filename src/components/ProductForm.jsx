import { useEffect, useState } from 'react'
import { api } from '../services/api'

export default function ProductForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    nome: '',
    codigo: '',
    preco_venda: '',
    preco_custo: '',
    estoque: '',
    estoque_minimo: '',
    unidade_medida: 'un',
    venda_por_peso: false,
    categoria_id: '',
    descricao: '',
  })
  const [categorias, setCategorias] = useState([])
  const [categoriasErro, setCategoriasErro] = useState(null)

  useEffect(() => {
    if (initial) {
      setForm({
        nome: initial.nome ?? '',
        codigo: initial.codigo ?? '',
        preco_venda: initial.preco_venda ?? initial.preco ?? '',
        preco_custo: initial.preco_custo ?? '',
        estoque: initial.estoque ?? '',
        estoque_minimo: initial.estoque_minimo ?? '',
        unidade_medida: initial.unidade_medida ?? 'un',
        venda_por_peso: Boolean(initial.venda_por_peso),
        categoria_id: initial.categoria_id ?? '',
        descricao: initial.descricao ?? '',
      })
    }
  }, [initial])

  // Carregar categorias
  useEffect(() => {
    let mounted = true
    async function loadCats() {
      try {
        const data = await api.getCategorias()
        const arr = Array.isArray(data) ? data : (data?.items || data?.results || [])
        if (mounted) setCategorias(arr)
      } catch (e) {
        if (mounted) setCategoriasErro(e.message || 'Falha ao carregar categorias')
      }
    }
    loadCats()
    return () => { mounted = false }
  }, [])

  function update(k, v) { setForm(prev => ({ ...prev, [k]: v })) }
  function handleSubmit(e) {
    e.preventDefault()
    // Validações básicas
    if (!form.nome?.trim()) { alert('Nome é obrigatório'); return }
    if (!form.codigo?.trim()) { alert('Código é obrigatório'); return }
    // Se houver categorias carregadas, podemos exigir seleção (opcional)
    // if (categorias.length > 0 && !form.categoria_id) { alert('Selecione uma categoria'); return }

    const unidade = form.venda_por_peso ? 'kg' : 'un'
    const payload = {
      ...form,
      preco_venda: Number(form.preco_venda || 0),
      preco_custo: form.preco_custo === '' ? null : Number(form.preco_custo),
      estoque: form.estoque === '' ? null : Number(form.estoque),
      estoque_minimo: form.estoque_minimo === '' ? null : Number(form.estoque_minimo),
      categoria_id: form.categoria_id === '' ? null : form.categoria_id,
      unidade_medida: unidade,
    }
    onSubmit?.(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Linha 1: Código, Categoria, Nome, Venda por peso */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-1">
          <label className="label">Código</label>
          <input className="input w-full" value={form.codigo} onChange={e => update('codigo', e.target.value)} />
        </div>
        <div className="sm:col-span-1">
          <label className="label">Categoria</label>
          {categoriasErro ? (
            <input className="input w-full" value={form.categoria_id} onChange={e => update('categoria_id', e.target.value)} placeholder="Categoria (fallback)" />
          ) : (
            <select className="input w-full" value={form.categoria_id} onChange={e => update('categoria_id', e.target.value)}>
              <option value="">Selecione uma categoria</option>
              {categorias.map((c) => (
                <option key={c.id || c.uuid || c.nome} value={c.id || c.uuid || ''}>{c.nome || c.descricao || c.id}</option>
              ))}
            </select>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="label">Nome</label>
          <input className="input w-full" value={form.nome} onChange={e => update('nome', e.target.value)} required />
        </div>
        <div className="sm:col-span-4">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="checkbox" checked={form.venda_por_peso} onChange={e => update('venda_por_peso', e.target.checked)} />
            <span>Venda por peso</span>
          </label>
        </div>
      </div>

      {/* Linha 2: Descrição */}
      <div>
        <label className="label">Descrição</label>
        <textarea className="input w-full" rows={3} value={form.descricao} onChange={e => update('descricao', e.target.value)} />
      </div>

      {/* Linha 3: Preço custo, Preço venda, Estoque, Estoque mínimo */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="label">Preço custo (MT)</label>
          <input type="number" step="0.01" className="input w-full" value={form.preco_custo} onChange={e => update('preco_custo', e.target.value)} />
        </div>
        <div>
          <label className="label">{form.venda_por_peso ? 'Preço por KG (MT)' : 'Preço por Unidade (MT)'}</label>
          <input type="number" step="0.01" className="input w-full" value={form.preco_venda} onChange={e => update('preco_venda', e.target.value)} required />
        </div>
        <div>
          <label className="label">{form.venda_por_peso ? 'Estoque (KG)' : 'Estoque (Unidades)'}</label>
          <input type="number" className="input w-full" value={form.estoque} onChange={e => update('estoque', e.target.value)} />
        </div>
        <div>
          <label className="label">Estoque mínimo</label>
          <input type="number" className="input w-full" value={form.estoque_minimo} onChange={e => update('estoque_minimo', e.target.value)} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button type="button" className="btn-outline" onClick={onCancel} disabled={submitting}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </form>
  )
}
