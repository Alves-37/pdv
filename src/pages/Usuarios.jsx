import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'
import UserForm from '../components/UserForm'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Usuarios() {
  const [q, setQ] = useState('')
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmUser, setConfirmUser] = useState(null)
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = showInactive ? await api.getUsuariosDesativados() : await api.getUsuarios()
        const arr = Array.isArray(data) ? data : (data?.items || [])
        if (mounted) setTodos(arr)
      } catch (e) {
        if (mounted) setError(e.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [showInactive])

  // Atualização automática: polling e refresh quando a aba volta ao foco
  useEffect(() => {
    const loadCurrent = () => (showInactive ? api.getUsuariosDesativados() : api.getUsuarios())
      .then((data) => Array.isArray(data) ? data : (data?.items || []))
      .then((arr) => setTodos(arr))
      .catch(() => {})

    const intervalId = setInterval(() => { loadCurrent() }, 20000) // 20s
    const onFocus = () => loadCurrent()
    const onVisibility = () => { if (document.visibilityState === 'visible') loadCurrent() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [showInactive])

  // Debounce da busca
  const [debouncedQ, setDebouncedQ] = useState('')
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim().toLowerCase()), 250)
    return () => clearTimeout(id)
  }, [q])

  const filtrados = useMemo(() => {
    if (!debouncedQ) return todos
    return todos.filter(u => {
      const nome = (u.nome || '').toLowerCase()
      const usuario = (u.usuario || '').toLowerCase()
      return nome.includes(debouncedQ) || usuario.includes(debouncedQ)
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
          <h1 className="text-2xl font-bold">Usuários</h1>
          <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>Novo usuário</button>
        </div>
        <div className="flex-1 min-w-[220px] sm:min-w-[320px] max-w-xl">
          <label htmlFor="buscar" className="sr-only">Buscar</label>
          <div className="relative">
            <input id="buscar" className="input w-full pl-9" placeholder="Buscar por nome ou usuário" value={q} onChange={e => setQ(e.target.value)} />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={showInactive ? 'btn-primary' : 'btn-outline'}
            onClick={() => setShowInactive((v) => !v)}
            title={showInactive ? 'Exibir ativos' : 'Exibir desativados'}
          >
            {showInactive ? 'Exibir ativos' : 'Exibir desativados'}
          </button>
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
            <svg className="h-6 w-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12h6"/></svg>
          </div>
          <p className="mt-3 text-gray-600">Nenhum usuário encontrado.</p>
        </div>
      )}

      {!loading && filtrados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((u) => {
            const isDefaultAdmin = (u.usuario || '').toLowerCase() === 'admin'
            return (
            <div key={u.id || u.uuid || u.usuario} className="card card-hover">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate" title={u.nome || u.usuario}>{u.nome || u.usuario}</h3>
                  <div className="text-xs sm:text-sm text-gray-500">Usuário: {u.usuario}</div>
                </div>
                <div className="shrink-0 text-right">
                  {u.is_admin ? (
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Admin</span>
                  ) : (
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Padrão</span>
                  )}
                  {u.ativo === false && (
                    <div className="mt-1 text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">Inativo</div>
                  )}
                  <div className="mt-2 flex items-center justify-end gap-2">
                    {!isDefaultAdmin && (
                      <>
                        <button
                          className="inline-flex items-center justify-center p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                          title="Editar"
                          onClick={() => { setEditing(u); setModalOpen(true) }}
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <button
                          className="inline-flex items-center justify-center p-2 rounded-md border border-red-300 text-red-700 hover:bg-red-50"
                          title="Excluir"
                          onClick={() => { setConfirmUser(u); setConfirmOpen(true) }}
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                        <button
                          className={`inline-flex items-center justify-center p-2 rounded-md border ${u.ativo === false ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-red-300 text-red-700 hover:bg-red-50'}`}
                          title={u.ativo === false ? 'Ativar' : 'Desativar'}
                          onClick={async () => {
                            const id = u.id || u.uuid
                            if (!id) return alert('ID do usuário não encontrado.')
                            try {
                              setSubmitting(true)
                              if (u.ativo === false) {
                                // Ativar usuário desativado
                                await api.activateUsuario(id)
                              } else {
                                // Desativar usuário ativo
                                await api.updateUsuario(id, { ativo: false })
                              }
                              let data = showInactive ? await api.getUsuariosDesativados() : await api.getUsuarios()
                              data = Array.isArray(data) ? data : (data?.items || [])
                              setTodos(data)
                            } catch (e) {
                              alert(e.message || 'Falha ao alterar status')
                            } finally {
                              setSubmitting(false)
                            }
                          }}
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 6h10"/><path d="M6 10h12"/><path d="M10 14h4"/></svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Modal CRUD */}
      <Modal
        open={modalOpen}
        title={editing ? 'Editar usuário' : 'Novo usuário'}
        onClose={() => { if (!submitting) { setModalOpen(false); setEditing(null) } }}
      >
        <UserForm
          initial={editing}
          submitting={submitting}
          onCancel={() => { if (!submitting) { setModalOpen(false); setEditing(null) } }}
          onSubmit={async (payload) => {
            try {
              setSubmitting(true)
              if (editing) {
                const id = editing.id || editing.uuid
                await api.updateUsuario(id, payload)
              } else {
                await api.createUsuario(payload)
              }
              // reload list
              let data = await api.getUsuarios()
              data = Array.isArray(data) ? data : (data?.items || [])
              setTodos(data)
              setModalOpen(false)
              setEditing(null)
            } catch (e) {
              alert(e.message || 'Falha ao salvar usuário')
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
        message={confirmUser ? (
          <>
            Tem certeza que deseja excluir o usuário <b>{confirmUser.nome || confirmUser.usuario}</b>?<br/>
            Esta ação não pode ser desfeita.
          </>
        ) : 'Tem certeza?'}
        confirmText="Excluir"
        cancelText="Cancelar"
        danger
        loading={submitting}
        onCancel={() => { if (!submitting) { setConfirmOpen(false); setConfirmUser(null) } }}
        onConfirm={async () => {
          if (!confirmUser) return
          const id = confirmUser.id || confirmUser.uuid
          if (!id) { alert('ID do usuário não encontrado.'); return }
          try {
            setSubmitting(true)
            await api.deleteUsuario(id)
            let data = await api.getUsuarios()
            data = Array.isArray(data) ? data : (data?.items || [])
            setTodos(data)
            setConfirmOpen(false)
            setConfirmUser(null)
          } catch (e) {
            alert(e.message || 'Falha ao remover usuário')
          } finally {
            setSubmitting(false)
          }
        }}
      />
    </div>
  )
}
