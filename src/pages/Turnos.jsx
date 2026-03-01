import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'

export default function Turnos() {
  const tenantTipoNegocio = (localStorage.getItem('tenant_tipo_negocio') || 'mercearia').toLowerCase()
  const isRestaurante = tenantTipoNegocio === 'restaurante'

  const [todos, setTodos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createNome, setCreateNome] = useState('')
  const [createSubmitting, setCreateSubmitting] = useState(false)

  const [membrosOpen, setMembrosOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [membros, setMembros] = useState([{ usuario_id: '', papel: 'funcionario', is_chefe: true }])
  const [membrosSubmitting, setMembrosSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!isRestaurante) {
      setError('Esta página está disponível apenas para o modo Restaurante.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [turnos, users] = await Promise.all([
        api.getTurnos(),
        api.getUsuarios(),
      ])
      setTodos(Array.isArray(turnos) ? turnos : [])
      setUsuarios(Array.isArray(users) ? users : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [isRestaurante])

  useEffect(() => {
    load()
  }, [load])

  const usuariosOptions = useMemo(() => {
    return (usuarios || []).map(u => ({
      id: String(u.id || u.uuid || ''),
      nome: u.nome || u.usuario || String(u.id || u.uuid || ''),
    }))
  }, [usuarios])

  async function submitCreate() {
    const nome = String(createNome || '').trim()
    if (!nome) return
    setCreateSubmitting(true)
    try {
      await api.createTurno({ nome })
      setCreateOpen(false)
      setCreateNome('')
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setCreateSubmitting(false)
    }
  }

  async function ativar(turno) {
    if (!turno?.id) return
    try {
      await api.ativarTurno(turno.id)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  function openMembros(turno) {
    setSelected(turno)
    const arr = Array.isArray(turno?.membros) ? turno.membros : []
    const mapped = arr.length
      ? arr.map(m => ({ usuario_id: String(m.usuario_id || ''), papel: m.papel || 'funcionario', is_chefe: !!m.is_chefe }))
      : [{ usuario_id: '', papel: 'funcionario', is_chefe: true }]
    setMembros(mapped)
    setMembrosOpen(true)
  }

  function setMembro(idx, patch) {
    setMembros(prev => prev.map((m, i) => i === idx ? { ...m, ...patch } : m))
  }

  function addMembro() {
    setMembros(prev => {
      if (prev.length >= 3) return prev
      return [...prev, { usuario_id: '', papel: 'funcionario', is_chefe: false }]
    })
  }

  function removeMembro(idx) {
    setMembros(prev => {
      const next = prev.filter((_, i) => i !== idx)
      if (next.length === 0) return [{ usuario_id: '', papel: 'funcionario', is_chefe: true }]
      if (!next.some(m => m.is_chefe)) {
        next[0] = { ...next[0], is_chefe: true }
      }
      return next
    })
  }

  function pickChefe(idx) {
    setMembros(prev => prev.map((m, i) => ({ ...m, is_chefe: i === idx })))
  }

  async function submitMembros() {
    if (!selected?.id) return
    const cleaned = (membros || []).map(m => ({
      usuario_id: String(m.usuario_id || '').trim(),
      papel: String(m.papel || 'funcionario').trim() || 'funcionario',
      is_chefe: !!m.is_chefe,
    })).filter(m => m.usuario_id)

    setMembrosSubmitting(true)
    try {
      await api.updateTurnoMembros(selected.id, cleaned)
      setMembrosOpen(false)
      setSelected(null)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setMembrosSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Turnos</h1>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>Novo turno</button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {loading && <p className="text-gray-600">Carregando...</p>}

      {!loading && (todos || []).length === 0 && (
        <div className="card text-center py-10">
          <p className="text-gray-600">Nenhum turno criado.</p>
        </div>
      )}

      {!loading && (todos || []).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(todos || []).map(t => (
            <div key={t.id} className="card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{t.nome}</div>
                  <div className="text-xs text-gray-500">{t.ativo ? 'Ativo' : 'Inativo'}</div>
                </div>
                {t.ativo ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Ativo</span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">Inativo</span>
                )}
              </div>

              <div className="mt-3 space-y-1 text-sm">
                {(t.membros || []).length === 0 ? (
                  <div className="text-gray-600">Sem membros</div>
                ) : (
                  (t.membros || []).map(m => (
                    <div key={m.id} className="flex items-center justify-between">
                      <span className="truncate">{m.usuario_nome || m.usuario_id}</span>
                      <span className="text-xs text-gray-500">{m.is_chefe ? 'Chefe' : (m.papel || 'funcionario')}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="btn-outline" onClick={() => openMembros(t)}>Equipe</button>
                <button className="btn-primary" onClick={() => ativar(t)} disabled={t.ativo}>Ativar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        title="Novo turno"
        onClose={() => { if (!createSubmitting) setCreateOpen(false) }}
        fullScreenMobile={false}
        actions={(
          <>
            <button className="btn-outline" disabled={createSubmitting} onClick={() => setCreateOpen(false)}>Cancelar</button>
            <button className="btn-primary" disabled={createSubmitting} onClick={submitCreate}>{createSubmitting ? 'Salvando...' : 'Salvar'}</button>
          </>
        )}
      >
        <div className="space-y-3">
          <label className="text-sm text-gray-600">Nome</label>
          <input className="input w-full" value={createNome} onChange={e => setCreateNome(e.target.value)} placeholder="Ex: Turno Manhã" />
        </div>
      </Modal>

      <Modal
        open={membrosOpen}
        title={selected ? `Equipe - ${selected.nome}` : 'Equipe'}
        onClose={() => { if (!membrosSubmitting) setMembrosOpen(false) }}
        actions={(
          <>
            <button className="btn-outline" disabled={membrosSubmitting} onClick={() => setMembrosOpen(false)}>Cancelar</button>
            <button className="btn-primary" disabled={membrosSubmitting} onClick={submitMembros}>{membrosSubmitting ? 'Salvando...' : 'Salvar'}</button>
          </>
        )}
      >
        <div className="space-y-3">
          {(membros || []).map((m, idx) => (
            <div key={idx} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Membro {idx + 1}</div>
                <button className="btn-outline" onClick={() => removeMembro(idx)} disabled={membrosSubmitting}>Remover</button>
              </div>

              <label className="text-xs text-gray-600">Funcionário</label>
              <select className="input w-full" value={m.usuario_id} onChange={(e) => setMembro(idx, { usuario_id: e.target.value })}>
                <option value="">Selecione...</option>
                {usuariosOptions.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>

              <label className="text-xs text-gray-600">Papel</label>
              <select className="input w-full" value={m.papel} onChange={(e) => setMembro(idx, { papel: e.target.value })}>
                <option value="funcionario">Funcionário</option>
                <option value="cozinha">Cozinha</option>
                <option value="atendente">Atendente</option>
                <option value="caixa">Caixa</option>
                <option value="chefe">Chefe</option>
              </select>

              <div className="flex items-center gap-2">
                <input
                  id={`chefe-${idx}`}
                  type="radio"
                  name="chefe"
                  checked={!!m.is_chefe}
                  onChange={() => pickChefe(idx)}
                />
                <label htmlFor={`chefe-${idx}`} className="text-sm">Chefe do turno</label>
              </div>
            </div>
          ))}

          <button className="btn-outline w-full" onClick={addMembro} disabled={membrosSubmitting || (membros || []).length >= 3}>Adicionar membro</button>
        </div>
      </Modal>
    </div>
  )
}
