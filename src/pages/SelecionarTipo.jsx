import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

export default function SelecionarTipo() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState([])
  const [selectedTenantId, setSelectedTenantId] = useState(() => localStorage.getItem('tenant_id') || '')
  const [loadingTenants, setLoadingTenants] = useState(true)
  const [creatingTenant, setCreatingTenant] = useState(false)
  const [newTenantName, setNewTenantName] = useState('')
  const [newTenantTipo, setNewTenantTipo] = useState('mercearia')
  const [createOpenMobile, setCreateOpenMobile] = useState(false)
  const [selectingTenantId, setSelectingTenantId] = useState('')
  const [showInactiveTenants, setShowInactiveTenants] = useState(false)
  const [togglingTenantId, setTogglingTenantId] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editTenant, setEditTenant] = useState(null)
  const [editTenantName, setEditTenantName] = useState('')
  const [editTenantTipo, setEditTenantTipo] = useState('mercearia')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsTenant, setDetailsTenant] = useState(null)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removeTenant, setRemoveTenant] = useState(null)
  const [removeSubmitting, setRemoveSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoadingTenants(true)
      setError(null)
      try {
        const t = await api.getTenants()
        if (!mounted) return
        setTenants(Array.isArray(t) ? t : [])

        console.debug('[tenant] loaded tenants', t)

        // Determinar tenant ativo (se não houver selecionado ainda, usar o primeiro)
        const firstId = Array.isArray(t) && t.length ? t[0].id : ''
        const activeTenantId = selectedTenantId || firstId
        if (activeTenantId) {
          const activeObj = (Array.isArray(t) ? t : []).find(x => String(x?.id) === String(activeTenantId))
          localStorage.setItem('tenant_tipo_negocio', activeObj?.tipo_negocio || 'mercearia')
        }

        // Se ainda não tiver tenant selecionado, escolher o primeiro
        if (activeTenantId && activeTenantId !== selectedTenantId) {
          setSelectedTenantId(activeTenantId)
          api.setTenantId(activeTenantId)
          console.debug('[tenant] auto-selected tenant', activeTenantId)
        }
      } catch (e) {
        if (mounted) setError(e.message)
      } finally {
        if (mounted) {
          setLoadingTenants(false)
        }
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  async function onCreateTenant() {
    const nome = (newTenantName || '').trim()
    if (!nome) {
      setError('Informe o nome do negócio')
      return
    }

    setCreatingTenant(true)
    setError(null)
    try {
      const created = await api.createTenant(nome, newTenantTipo, true)
      await refreshTenants()
      if (created?.id) {
        await onSelectTenant(created.id)
        setNewTenantName('')
        setCreateOpenMobile(false)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setCreatingTenant(false)
    }
  }

  async function onToggleTenantActive(t) {
    if (!t?.id) return
    try {
      setTogglingTenantId(t.id)
      setError(null)
      await api.updateTenant(t.id, { ativo: !t.ativo })
      const arr = await refreshTenants()

      if (String(t.id) === String(selectedTenantId) && t.ativo) {
        const firstActive = (arr || []).find(x => x?.ativo)
        if (firstActive?.id) {
          await onSelectTenant(firstActive.id)
        } else {
          api.setTenantId('')
          setSelectedTenantId('')
        }
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setTogglingTenantId('')
    }
  }

  async function refreshTenants() {
    setLoadingTenants(true)
    setError(null)
    try {
      const t = await api.getTenants()
      const arr = Array.isArray(t) ? t : []
      setTenants(arr)
      return arr
    } catch (e) {
      setError(e.message)
      return []
    } finally {
      setLoadingTenants(false)
    }
  }

  function onEditTenant(t) {
    setEditTenant(t)
    setEditTenantName(t?.nome || '')
    setEditTenantTipo(t?.tipo_negocio || 'mercearia')
    setEditOpen(true)
  }

  function onRemoveTenant(t) {
    setRemoveTenant(t)
    setRemoveOpen(true)
  }

  function onTenantDetails(t) {
    setDetailsTenant(t)
    setDetailsOpen(true)
  }

  async function onSelectTenant(id) {
    if (!id || id === selectedTenantId) return
    console.debug('[tenant] selecting tenant', { from: selectedTenantId, to: id })
    setSelectingTenantId(id)
    setSelectedTenantId(id)
    api.setTenantId(id)
    const selectedObj = (tenants || []).find(x => String(x?.id) === String(id))
    localStorage.setItem('tenant_tipo_negocio', selectedObj?.tipo_negocio || 'mercearia')
    console.debug('[tenant] localStorage tenant_id', localStorage.getItem('tenant_id'))
    setError(null)
    // UX: pequeno feedback visual
    setTimeout(() => setSelectingTenantId(''), 400)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Trocar negócio</h1>
          <p className="text-sm text-gray-600">Selecione o estabelecimento (tenant) para ver e operar com os dados corretos.</p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
      )}

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Estabelecimento</h2>
        <div className="text-xs text-gray-500">
          Tenant selecionado: <span className="font-medium">{selectedTenantId || '—'}</span>
        </div>
        <div className="text-sm text-gray-700">
          Negócio selecionado:{' '}
          <span className="font-semibold">
            {(tenants || []).find(t => String(t?.id) === String(selectedTenantId))?.nome || '—'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Inativos</span>
          <button
            type="button"
            aria-pressed={showInactiveTenants}
            onClick={() => setShowInactiveTenants(v => !v)}
            className={`w-10 h-6 rounded-full transition-colors ${showInactiveTenants ? 'bg-indigo-500' : 'bg-gray-300'}`}
            title="Mostrar apenas negócios inativos"
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${showInactiveTenants ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
        </div>

        {loadingTenants && (
          <p className="text-sm text-gray-500">Carregando negócios...</p>
        )}

        <div className="sm:hidden">
          {!createOpenMobile ? (
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => { setCreateOpenMobile(true); setError(null) }}
            >
              Novo negócio
            </button>
          ) : (
            <div className="border border-gray-200 rounded-xl p-3 bg-white space-y-2">
              <div className="grid grid-cols-1 gap-2">
                <input
                  className="input"
                  placeholder="Nome do novo negócio"
                  value={newTenantName}
                  onChange={e => setNewTenantName(e.target.value)}
                />
                <select className="input" value={newTenantTipo} onChange={e => setNewTenantTipo(e.target.value)}>
                  <option value="mercearia">Mercearia</option>
                  <option value="restaurante">Restaurante</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => { if (!creatingTenant) { setCreateOpenMobile(false) } }}
                  disabled={creatingTenant}
                >
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  onClick={onCreateTenant}
                  disabled={creatingTenant}
                >
                  {creatingTenant ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
          <input
            className="input"
            placeholder="Nome do novo negócio"
            value={newTenantName}
            onChange={e => setNewTenantName(e.target.value)}
          />
          <select className="input" value={newTenantTipo} onChange={e => setNewTenantTipo(e.target.value)}>
            <option value="mercearia">Mercearia</option>
            <option value="restaurante">Restaurante</option>
          </select>
          <button
            className="btn-primary"
            onClick={onCreateTenant}
            disabled={creatingTenant}
          >
            {creatingTenant ? 'Criando...' : 'Criar negócio'}
          </button>
        </div>

        {!loadingTenants && tenants.length <= 1 && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
            Só existe 1 negócio (tenant) cadastrado. Para a troca fazer efeito, crie outro tenant e configure dados diferentes.
          </p>
        )}
        <div className="space-y-3">
          {(showInactiveTenants ? tenants.filter(x => x?.ativo === false) : tenants.filter(x => x?.ativo)).map(t => {
            const isSelected = t.id === selectedTenantId
            return (
              <div
                key={t.id}
                className={
                  isSelected
                    ? 'border border-blue-200 bg-blue-50 rounded-xl p-4 shadow-sm'
                    : 'border border-gray-200 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow'
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {t.nome || t.id}
                      {t.ativo === false ? ' (inativo)' : ''}
                    </div>
                    <div className="text-xs text-gray-500 font-mono break-all">{t.id}</div>
                  </div>
                  {isSelected && (
                    <div className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">Selecionado</div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Ativo</span>
                    <button
                      type="button"
                      aria-pressed={Boolean(t.ativo)}
                      onClick={() => onToggleTenantActive(t)}
                      disabled={Boolean(togglingTenantId) || Boolean(selectingTenantId)}
                      className={`w-10 h-6 rounded-full transition-colors ${t.ativo ? 'bg-green-500' : 'bg-gray-300'}`}
                      title={t.ativo ? 'Desativar negócio' : 'Ativar negócio'}
                    >
                      <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${t.ativo ? 'translate-x-4' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  {togglingTenantId === t.id && (
                    <div className="text-xs text-gray-500">Atualizando...</div>
                  )}
                </div>

                <div className="mt-3">
                  <button
                    className={isSelected ? 'btn-primary w-full' : 'btn-outline w-full'}
                    onClick={() => onSelectTenant(t.id)}
                    disabled={Boolean(selectingTenantId)}
                  >
                    {selectingTenantId === t.id ? 'Selecionando...' : 'Selecionar'}
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <button
                    className="btn-outline flex items-center justify-center gap-2"
                    onClick={() => onTenantDetails(t)}
                    aria-label="Detalhes"
                    title="Detalhes"
                  >
                    <span className="sm:hidden" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                    </span>
                    <span className="hidden sm:inline">Detalhes</span>
                  </button>
                  <button
                    className="btn-outline flex items-center justify-center gap-2"
                    onClick={() => onEditTenant(t)}
                    aria-label="Editar"
                    title="Editar"
                  >
                    <span className="sm:hidden" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </span>
                    <span className="hidden sm:inline">Editar</span>
                  </button>
                  <button
                    className="btn-outline flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => onRemoveTenant(t)}
                    aria-label="Remover"
                    title="Remover"
                  >
                    <span className="sm:hidden" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                    </span>
                    <span className="hidden sm:inline">Remover</span>
                  </button>
                  <div className="hidden sm:block" />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <Modal
        open={editOpen}
        title="Editar negócio"
        onClose={() => { if (!editSubmitting) { setEditOpen(false); setEditTenant(null) } }}
        actions={(
          <>
            <button
              type="button"
              className="btn-outline"
              onClick={() => { if (!editSubmitting) { setEditOpen(false); setEditTenant(null) } }}
              disabled={editSubmitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={editSubmitting}
              onClick={async () => {
                const trimmed = String(editTenantName || '').trim()
                if (!trimmed) {
                  setError('Nome inválido')
                  return
                }
                setEditSubmitting(true)
                setError(null)
                try {
                  await api.updateTenant(editTenant?.id, { nome: trimmed, tipo_negocio: editTenantTipo })
                  if (String(editTenant?.id) === String(selectedTenantId)) {
                    localStorage.setItem('tenant_tipo_negocio', editTenantTipo || 'mercearia')
                  }
                  await refreshTenants()
                  setEditOpen(false)
                  setEditTenant(null)
                } catch (e) {
                  setError(e.message)
                } finally {
                  setEditSubmitting(false)
                }
              }}
            >
              {editSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        )}
      >
        <div className="space-y-3">
          <div className="text-sm text-gray-700">Altere o nome e o tipo do negócio.</div>
          <input
            className="input w-full"
            value={editTenantName}
            onChange={e => setEditTenantName(e.target.value)}
            placeholder="Nome"
          />
          <select className="input w-full" value={editTenantTipo} onChange={e => setEditTenantTipo(e.target.value)}>
            <option value="mercearia">Mercearia</option>
            <option value="restaurante">Restaurante</option>
          </select>
        </div>
      </Modal>

      <Modal
        open={detailsOpen}
        title="Detalhes do negócio"
        onClose={() => { setDetailsOpen(false); setDetailsTenant(null) }}
        actions={(
          <button type="button" className="btn-primary" onClick={() => { setDetailsOpen(false); setDetailsTenant(null) }}>
            Fechar
          </button>
        )}
      >
        <div className="space-y-3 text-sm text-gray-700">
          <div>
            <div className="text-xs text-gray-500">ID</div>
            <div className="font-mono break-all">{detailsTenant?.id || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Nome</div>
            <div className="font-medium">{detailsTenant?.nome || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Tipo</div>
            <div className="font-medium">{detailsTenant?.tipo_negocio || 'mercearia'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Status</div>
            <div className="font-medium">{detailsTenant?.ativo === false ? 'Inativo' : 'Ativo'}</div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={removeOpen}
        title="Remover negócio"
        message={`Remover (desativar) o negócio "${removeTenant?.nome || removeTenant?.id}"?`}
        confirmText="Remover"
        cancelText="Cancelar"
        danger
        loading={removeSubmitting}
        onCancel={() => { if (!removeSubmitting) { setRemoveOpen(false); setRemoveTenant(null) } }}
        onConfirm={async () => {
          if (!removeTenant?.id) return
          setRemoveSubmitting(true)
          setError(null)
          try {
            await api.deleteTenant(removeTenant.id)
            const arr = await refreshTenants()

            if (removeTenant.id === selectedTenantId) {
              const firstActive = (arr || []).find(x => x?.ativo)
              if (firstActive?.id) {
                await onSelectTenant(firstActive.id)
              } else {
                api.setTenantId('')
                setSelectedTenantId('')
              }
            }
            setRemoveOpen(false)
            setRemoveTenant(null)
          } catch (e) {
            setError(e.message)
          } finally {
            setRemoveSubmitting(false)
          }
        }}
      />

    </div>
  )
}
