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
  const [createDias, setCreateDias] = useState([0, 1, 2, 3, 4])
  const [createHoraInicio, setCreateHoraInicio] = useState('08:00')
  const [createHoraFim, setCreateHoraFim] = useState('16:00')
  const [createSubmitting, setCreateSubmitting] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const [editNome, setEditNome] = useState('')
  const [editDias, setEditDias] = useState([0, 1, 2, 3, 4])
  const [editHoraInicio, setEditHoraInicio] = useState('')
  const [editHoraFim, setEditHoraFim] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

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
      await api.createTurno({
        nome,
        dias_semana: createDias,
        hora_inicio: createHoraInicio,
        hora_fim: createHoraFim,
      })
      setCreateOpen(false)
      setCreateNome('')
      setCreateDias([0, 1, 2, 3, 4])
      setCreateHoraInicio('08:00')
      setCreateHoraFim('16:00')
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setCreateSubmitting(false)
    }
  }

  const diasLabel = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const toggleDia = (arr, d) => {
    const set = new Set(arr)
    if (set.has(d)) set.delete(d)
    else set.add(d)
    return Array.from(set).sort((a, b) => a - b)
  }

  function openEdit(t) {
    setEditId(String(t?.id || ''))
    setEditNome(String(t?.nome || ''))
    setEditDias(Array.isArray(t?.dias_semana) ? t.dias_semana : [0, 1, 2, 3, 4])
    setEditHoraInicio(String(t?.hora_inicio || '08:00'))
    setEditHoraFim(String(t?.hora_fim || '16:00'))
    setEditOpen(true)
  }

  async function submitEdit() {
    const nome = String(editNome || '').trim()
    if (!editId || !nome) return
    setEditSubmitting(true)
    try {
      await api.updateTurno(editId, {
        nome,
        dias_semana: editDias,
        hora_inicio: editHoraInicio,
        hora_fim: editHoraFim,
      })
      setEditOpen(false)
      setEditId('')
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setEditSubmitting(false)
    }
  }

  async function apagar(t) {
    if (!t?.id) return
    setDeleteTarget(t)
    setDeleteOpen(true)
  }

  async function confirmDelete() {
    if (!deleteTarget?.id) return
    setDeleteSubmitting(true)
    try {
      await api.deleteTurno(deleteTarget.id)
      setDeleteOpen(false)
      setDeleteTarget(null)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setDeleteSubmitting(false)
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
        <button className="btn-primary" onClick={() => setCreateOpen(true)} disabled={(todos || []).length >= 2}>Novo turno</button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {loading && <p className="text-gray-600">Carregando...</p>}

      {!loading && (todos || []).length === 0 && (
        <div className="card text-center py-10">
          <p className="text-gray-600">Nenhum turno criado.</p>
        </div>
      )}

      {!loading && (todos || []).length > 0 && (
        <div className="space-y-3">
          {(todos || []).length > 2 && (
            <div className="card p-3">
              <div className="text-sm text-gray-700">Você tem mais de 2 turnos cadastrados. Para usar o modo de 2 turnos, apague os extras.</div>
            </div>
          )}

          <div className="card p-3">
            <div className="text-sm font-semibold">Turno ativo</div>
            <div className="mt-2">
              <select
                className="input w-full"
                value={String((todos || []).find(t => t.ativo)?.id || '')}
                onChange={async (e) => {
                  const id = e.target.value
                  if (!id) return
                  try {
                    await api.ativarTurno(id)
                    await load()
                  } catch (err) {
                    setError(err.message)
                  }
                }}
              >
                <option value="" disabled>Selecione...</option>
                {(todos || []).map(t => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>
            <div className="mt-2 text-xs text-gray-500">A troca automática acontece quando alguém consulta o turno ativo.</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="text-xs text-gray-600">Dias: <span className="font-medium text-gray-800">{(t.dias_semana || []).map(d => diasLabel[d] || d).join(', ') || '—'}</span></div>
                <div className="text-xs text-gray-600">Hora: <span className="font-medium text-gray-800">{t.hora_inicio || '—'} - {t.hora_fim || '—'}</span></div>
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
                <button className="btn-outline" onClick={() => openEdit(t)}>Editar</button>
                <button className="btn-outline" onClick={() => apagar(t)}>Apagar</button>
              </div>
            </div>
            ))}
          </div>
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

          <div>
            <label className="text-sm text-gray-600">Dias da semana</label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {diasLabel.map((lbl, idx) => (
                <label key={idx} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={createDias.includes(idx)}
                    onChange={() => setCreateDias(prev => toggleDia(prev, idx))}
                  />
                  {lbl}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Hora início</label>
              <input className="input w-full" type="time" value={createHoraInicio} onChange={e => setCreateHoraInicio(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Hora fim</label>
              <input className="input w-full" type="time" value={createHoraFim} onChange={e => setCreateHoraFim(e.target.value)} />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={editOpen}
        title="Editar turno"
        onClose={() => { if (!editSubmitting) setEditOpen(false) }}
        fullScreenMobile={false}
        actions={(
          <>
            <button className="btn-outline" disabled={editSubmitting} onClick={() => setEditOpen(false)}>Cancelar</button>
            <button className="btn-primary" disabled={editSubmitting} onClick={submitEdit}>{editSubmitting ? 'Salvando...' : 'Salvar'}</button>
          </>
        )}
      >
        <div className="space-y-3">
          <label className="text-sm text-gray-600">Nome</label>
          <input className="input w-full" value={editNome} onChange={e => setEditNome(e.target.value)} />

          <div>
            <label className="text-sm text-gray-600">Dias da semana</label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {diasLabel.map((lbl, idx) => (
                <label key={idx} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editDias.includes(idx)}
                    onChange={() => setEditDias(prev => toggleDia(prev, idx))}
                  />
                  {lbl}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Hora início</label>
              <input className="input w-full" type="time" value={editHoraInicio} onChange={e => setEditHoraInicio(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Hora fim</label>
              <input className="input w-full" type="time" value={editHoraFim} onChange={e => setEditHoraFim(e.target.value)} />
            </div>
          </div>
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

      <Modal
        open={deleteOpen}
        title="Apagar turno"
        onClose={() => { if (!deleteSubmitting) { setDeleteOpen(false); setDeleteTarget(null) } }}
        fullScreenMobile={false}
        actions={(
          <>
            <button className="btn-outline" disabled={deleteSubmitting} onClick={() => { setDeleteOpen(false); setDeleteTarget(null) }}>Cancelar</button>
            <button className="btn-primary" disabled={deleteSubmitting} onClick={confirmDelete}>{deleteSubmitting ? 'Apagando...' : 'Apagar'}</button>
          </>
        )}
      >
        <div className="space-y-2">
          <div className="text-sm text-gray-700">Tem certeza que deseja apagar este turno?</div>
          <div className="text-sm font-semibold text-gray-900">{deleteTarget?.nome || '—'}</div>
          <div className="text-xs text-gray-500">Essa ação não pode ser desfeita.</div>
        </div>
      </Modal>
    </div>
  )
}
