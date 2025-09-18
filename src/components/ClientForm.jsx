import { useEffect, useState } from 'react'

export default function ClientForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    documento: '',
    endereco: '',
  })

  useEffect(() => {
    if (initial) {
      setForm({
        nome: initial.nome ?? '',
        telefone: initial.telefone ?? '',
        documento: initial.documento ?? '',
        endereco: initial.endereco ?? '',
      })
    }
  }, [initial])

  function update(k, v) { setForm(prev => ({ ...prev, [k]: v })) }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome?.trim()) { alert('Nome é obrigatório'); return }
    // Montar payload apenas com campos relevantes do backend
    const payload = {
      nome: form.nome.trim(),
      ...(form.telefone ? { telefone: form.telefone } : {}),
      ...(form.documento ? { documento: form.documento } : {}),
      ...(form.endereco ? { endereco: form.endereco } : {}),
    }
    onSubmit?.(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="label">Nome</label>
          <input className="input w-full" value={form.nome} onChange={e => update('nome', e.target.value)} required />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input className="input w-full" value={form.telefone} onChange={e => update('telefone', e.target.value)} placeholder="(+258) 84 000 0000" />
        </div>
        <div>
          <label className="label">Documento</label>
          <input className="input w-full" value={form.documento} onChange={e => update('documento', e.target.value)} placeholder="NUIT/BI" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Endereço</label>
          <input className="input w-full" value={form.endereco} onChange={e => update('endereco', e.target.value)} placeholder="Rua, bairro, cidade" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button type="button" className="btn-outline" onClick={onCancel} disabled={submitting}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </form>
  )
}
