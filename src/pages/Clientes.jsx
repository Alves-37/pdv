import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'
import ClientForm from '../components/ClientForm'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Clientes() {
  const [q, setQ] = useState('')
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmClient, setConfirmClient] = useState(null)

  async function load(search) {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getClientes(search)
      const arr = Array.isArray(data) ? data : (data?.items || [])
      setTodos(arr)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load('') }, [])

  // Atualização automática: polling e refresh quando a aba volta ao foco
  useEffect(() => {
    const intervalId = setInterval(() => {
      load(q)
    }, 20000) // 20s

    const onFocus = () => load(q)
    const onVisibility = () => { if (document.visibilityState === 'visible') load(q) }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [q])

  // Debounce da busca
  const [debouncedQ, setDebouncedQ] = useState('')
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim().toLowerCase()), 250)
    return () => clearTimeout(id)
  }, [q])

  const filtrados = useMemo(() => {
    if (!debouncedQ) return todos
    return todos.filter(c => {
      const nome = (c.nome || '').toLowerCase()
      const tel = (c.telefone || '').toLowerCase()
      const doc = (c.documento || '').toLowerCase()
      return nome.includes(debouncedQ) || tel.includes(debouncedQ) || doc.includes(debouncedQ)
    })
  }, [todos, debouncedQ])

  const Skeleton = () => (
    <div className="card animate-pulse">
      <div className="h-4 w-32 bg-gray-200 rounded" />
      <div className="mt-3 h-5 w-24 bg-gray-200 rounded" />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Clientes</h1>
          <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>Novo cliente</button>
        </div>
        <div className="flex-1 min-w-[220px] sm:min-w-[320px] max-w-xl">
          <label htmlFor="buscar" className="sr-only">Buscar</label>
          <div className="relative">
            <input id="buscar" className="input w-full pl-9" placeholder="Buscar por nome, telefone ou documento" value={q} onChange={e => setQ(e.target.value)} />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
            </span>
          </div>
        </div>
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
            <svg className="h-6 w-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <p className="mt-3 text-gray-600">Nenhum cliente encontrado.</p>
        </div>
      )}

      {!loading && filtrados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((c) => (
            <div key={c.id || c.uuid || c.nome} className="card card-hover">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate" title={c.nome}>{c.nome}</h3>
                  {c.telefone && <div className="text-xs sm:text-sm text-gray-500">{c.telefone}</div>}
                  {c.documento && <div className="text-xs text-gray-500">Doc: {c.documento}</div>}
                </div>
                <div className="shrink-0 text-right">
                  {c.ativo === false ? (
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">Inativo</span>
                  ) : (
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Ativo</span>
                  )}
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      className="inline-flex items-center justify-center p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                      title="Editar"
                      onClick={() => { setEditing(c); setModalOpen(true) }}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    </button>
                    <button
                      className="inline-flex items-center justify-center p-2 rounded-md border border-red-300 text-red-700 hover:bg-red-50"
                      title="Excluir"
                      onClick={() => { setConfirmClient(c); setConfirmOpen(true) }}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal CRUD */}
      <Modal
        open={modalOpen}
        title={editing ? 'Editar cliente' : 'Novo cliente'}
        onClose={() => { if (!submitting) { setModalOpen(false); setEditing(null) } }}
      >
        <ClientForm
          initial={editing}
          submitting={submitting}
          onCancel={() => { if (!submitting) { setModalOpen(false); setEditing(null) } }}
          onSubmit={async (payload) => {
            try {
              setSubmitting(true)
              if (editing) {
                const id = editing.id || editing.uuid
                await api.updateCliente(id, payload)
              } else {
                await api.createCliente(payload)
              }
              await load('')
              setModalOpen(false)
              setEditing(null)
            } catch (e) {
              alert(e.message || 'Falha ao salvar cliente')
            } finally {
              setSubmitting(false)
            }
          }}
        />
      </Modal>

      {/* Confirmar exclusão */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar exclusão"
        message={confirmClient ? (
          <>
            Tem certeza que deseja excluir o cliente <b>{confirmClient.nome}</b>?<br/>
            Esta ação não pode ser desfeita.
          </>
        ) : 'Tem certeza?'}
        confirmText="Excluir"
        cancelText="Cancelar"
        danger
        loading={submitting}
        onCancel={() => { if (!submitting) { setConfirmOpen(false); setConfirmClient(null) } }}
        onConfirm={async () => {
          if (!confirmClient) return
          const id = confirmClient.id || confirmClient.uuid
          if (!id) { alert('ID do cliente não encontrado.'); return }
          try {
            setSubmitting(true)
            await api.deleteCliente(id)
            await load('')
            setConfirmOpen(false)
            setConfirmClient(null)
          } catch (e) {
            alert(e.message || 'Falha ao remover cliente')
          } finally {
            setSubmitting(false)
          }
        }}
      />
    </div>
  )
}
