import { useEffect, useState } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'

export default function Mesas() {
  const { user } = useAuth()
  const tenantTipoNegocio = (localStorage.getItem('tenant_tipo_negocio') || 'mercearia').toLowerCase()
  const isRestaurante = tenantTipoNegocio === 'restaurante'
  const isAdmin = !!user?.is_admin

  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [statusSubmitting, setStatusSubmitting] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [createNumero, setCreateNumero] = useState('')
  const [createCapacidade, setCreateCapacidade] = useState('4')
  const [createSubmitting, setCreateSubmitting] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editNumero, setEditNumero] = useState('')
  const [editCapacidade, setEditCapacidade] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

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
        const data = await api.getMesas()
        if (!mounted) return
        setTodos(Array.isArray(data) ? data : [])
      } catch (e) {
        if (mounted) setError(e.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    const intervalId = setInterval(load, 20000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => {
      mounted = false
      clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  function openEdit(m) {
    setEditTarget(m)
    setEditNumero(String(m?.numero ?? ''))
    setEditCapacidade(String(m?.capacidade ?? ''))
    setEditStatus(String(m?.status ?? 'Livre'))
    setEditOpen(true)
  }

  async function submitCreate() {
    const numero = Number(String(createNumero || '').trim())
    const capacidade = Number(String(createCapacidade || '').trim())
    if (!numero || !capacidade) return
    setCreateSubmitting(true)
    try {
      await api.createMesa({ numero, capacidade })
      setCreateOpen(false)
      setCreateNumero('')
      setCreateCapacidade('4')
      const data = await api.getMesas()
      setTodos(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setCreateSubmitting(false)
    }
  }

  async function submitEdit() {
    if (!editTarget?.id) return
    const payload = {
      numero: editNumero ? Number(editNumero) : undefined,
      capacidade: editCapacidade ? Number(editCapacidade) : undefined,
      status: String(editStatus || '').trim() || undefined,
    }
    setEditSubmitting(true)
    try {
      await api.updateMesa(editTarget.id, payload)
      setEditOpen(false)
      setEditTarget(null)
      const data = await api.getMesas()
      setTodos(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setEditSubmitting(false)
    }
  }

  function askDelete(m) {
    setDeleteTarget(m)
    setDeleteOpen(true)
  }

  async function confirmDelete() {
    if (!deleteTarget?.id) return
    setDeleteSubmitting(true)
    try {
      await api.deleteMesa(deleteTarget.id)
      setDeleteOpen(false)
      setDeleteTarget(null)
      const data = await api.getMesas()
      setTodos(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Mesas</h1>
        {isAdmin && <button className="btn-primary" onClick={() => setCreateOpen(true)}>Nova mesa</button>}
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="mt-3 h-5 w-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && todos.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-gray-600">Nenhuma mesa encontrada.</p>
        </div>
      )}

      {!loading && todos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {todos.map((m, idx) => (
            <div key={m?.numero ?? idx} className="card">
              <div className="text-sm text-gray-500">Mesa</div>
              <div className="text-xl font-bold">{m.numero}</div>
              <div className="mt-2 text-sm text-gray-700">Capacidade: <span className="font-semibold">{m.capacidade}</span></div>
              <div className="mt-1 text-sm text-gray-700">Status: <span className="font-semibold">{m.status}</span></div>

              {isAdmin ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="btn-outline" onClick={() => openEdit(m)}>Editar</button>
                  <button className="btn-outline" onClick={() => askDelete(m)}>Apagar</button>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <label className="text-xs text-gray-600">Alterar status</label>
                  <select
                    className="input w-full"
                    value={String(m?.status || 'Livre')}
                    disabled={statusSubmitting}
                    onChange={async (e) => {
                      const st = e.target.value
                      if (!m?.id) return
                      setStatusSubmitting(true)
                      try {
                        await api.updateMesaStatus(m.id, st)
                        const data = await api.getMesas()
                        setTodos(Array.isArray(data) ? data : [])
                      } catch (err) {
                        setError(err.message)
                      } finally {
                        setStatusSubmitting(false)
                      }
                    }}
                  >
                    <option value="Livre">Livre</option>
                    <option value="Ocupado">Ocupado</option>
                    <option value="Reservado">Reservado</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <>
          <Modal
            open={createOpen}
            title="Nova mesa"
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
              <div>
                <label className="text-sm text-gray-600">Número</label>
                <input className="input w-full" type="number" value={createNumero} onChange={e => setCreateNumero(e.target.value)} placeholder="Ex: 5" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Capacidade</label>
                <input className="input w-full" type="number" value={createCapacidade} onChange={e => setCreateCapacidade(e.target.value)} />
              </div>
            </div>
          </Modal>

          <Modal
            open={editOpen}
            title={editTarget ? `Editar mesa ${editTarget.numero}` : 'Editar mesa'}
            onClose={() => { if (!editSubmitting) { setEditOpen(false); setEditTarget(null) } }}
            fullScreenMobile={false}
            actions={(
              <>
                <button className="btn-outline" disabled={editSubmitting} onClick={() => { setEditOpen(false); setEditTarget(null) }}>Cancelar</button>
                <button className="btn-primary" disabled={editSubmitting} onClick={submitEdit}>{editSubmitting ? 'Salvando...' : 'Salvar'}</button>
              </>
            )}
          >
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Número</label>
                <input className="input w-full" type="number" value={editNumero} onChange={e => setEditNumero(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Capacidade</label>
                <input className="input w-full" type="number" value={editCapacidade} onChange={e => setEditCapacidade(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <select className="input w-full" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                  <option value="Livre">Livre</option>
                  <option value="Ocupado">Ocupado</option>
                  <option value="Reservado">Reservado</option>
                </select>
              </div>
            </div>
          </Modal>

          <Modal
            open={deleteOpen}
            title="Apagar mesa"
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
              <div className="text-sm text-gray-700">Tem certeza que deseja apagar esta mesa?</div>
              <div className="text-sm font-semibold text-gray-900">Mesa {deleteTarget?.numero ?? '—'}</div>
              <div className="text-xs text-gray-500">Essa ação não pode ser desfeita.</div>
            </div>
          </Modal>
        </>
      )}
    </div>
  )
}
