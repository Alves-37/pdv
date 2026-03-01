import { useEffect, useState } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'

export default function Configuracoes() {
  const [empresa, setEmpresa] = useState({ nome: '', nuit: '', telefone: '', email: '', endereco: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [backups, setBackups] = useState([])
  const [backupsLoading, setBackupsLoading] = useState(false)
  const [backupNome, setBackupNome] = useState('')
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [restoreOpen, setRestoreOpen] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState(null)
  const [restoring, setRestoring] = useState(false)
  const [deleteBackupOpen, setDeleteBackupOpen] = useState(false)
  const [deleteBackupTarget, setDeleteBackupTarget] = useState(null)
  const [deletingBackup, setDeletingBackup] = useState(false)

  const [resetOpen, setResetOpen] = useState(false)
  const [resetText, setResetText] = useState('')
  const [resetting, setResetting] = useState(false)
  const [showEmpresaForm, setShowEmpresaForm] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const cfg = await api.getEmpresaConfig()
        if (mounted && cfg) {
          setEmpresa({
            nome: cfg.nome || '',
            nuit: cfg.nuit || '',
            telefone: cfg.telefone || '',
            email: cfg.email || '',
            endereco: cfg.endereco || '',
          })
        }
      } catch (e) {
        if (mounted) setError(e.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    async function loadBackups() {
      setBackupsLoading(true)
      try {
        const rows = await api.getTenantBackups()
        if (mounted) setBackups(Array.isArray(rows) ? rows : [])
      } catch (e) {
        if (mounted) setError(e.message)
      } finally {
        if (mounted) setBackupsLoading(false)
      }
    }
    load()
    loadBackups()
    return () => { mounted = false }
  }, [])

  async function criarBackup() {
    setCreatingBackup(true)
    setError(null)
    setSuccess(null)
    try {
      await api.createTenantBackup(backupNome || undefined)
      setBackupNome('')
      const rows = await api.getTenantBackups()
      setBackups(Array.isArray(rows) ? rows : [])
      setSuccess('Backup criado com sucesso.')
    } catch (e) {
      setError(e.message)
    } finally {
      setCreatingBackup(false)
    }
  }

  async function confirmarRestaurar() {
    if (!restoreTarget?.id) return
    setRestoring(true)
    setError(null)
    setSuccess(null)
    try {
      await api.restoreTenantBackup(restoreTarget.id)
      setRestoreOpen(false)
      setRestoreTarget(null)
      try {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
      } catch {}
      setSuccess('Backup restaurado com sucesso. Reiniciando sessão...')
      window.location.assign('/login')
    } catch (e) {
      setError(e.message)
    } finally {
      setRestoring(false)
    }
  }

  async function confirmarApagarBackup() {
    if (!deleteBackupTarget?.id) return
    setDeletingBackup(true)
    setError(null)
    setSuccess(null)
    try {
      await api.deleteTenantBackup(deleteBackupTarget.id)
      setDeleteBackupOpen(false)
      setDeleteBackupTarget(null)
      const rows = await api.getTenantBackups()
      setBackups(Array.isArray(rows) ? rows : [])
      setSuccess('Backup apagado com sucesso.')
    } catch (e) {
      setError(e.message)
    } finally {
      setDeletingBackup(false)
    }
  }

  async function salvar() {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await api.updateEmpresaConfig(empresa)
      setSuccess('Dados da empresa atualizados com sucesso.')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function confirmarReset() {
    if (resetText !== 'RESETAR') {
      setError('Digite "RESETAR" para confirmar o reset.')
      return
    }
    setResetting(true)
    setError(null)
    setSuccess(null)
    try {
      await api.resetDadosOnline()
      try {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
      } catch {}
      setSuccess('Dados online foram resetados. Reiniciando sessão...')
      setResetOpen(false)
      setResetText('')
      window.location.assign('/login')
    } catch (e) {
      setError(e.message)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-gray-600">Dados da empresa e ações administrativas do PDV online.</p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-md px-3 py-2">{success}</p>}

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Dados da empresa</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Carregando dados da empresa...</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-1 text-sm text-gray-700">
                <p className="font-medium">{empresa.nome || 'Sem nome definido'}</p>
                <p className="text-xs text-gray-500">
                  {empresa.nuit && <span>NUIT: {empresa.nuit}</span>}
                  {empresa.telefone && <span>{empresa.nuit ? ' · ' : ''}Tel: {empresa.telefone}</span>}
                  {empresa.email && <span>{(empresa.nuit || empresa.telefone) ? ' · ' : ''}{empresa.email}</span>}
                </p>
              </div>
              <button
                type="button"
                className="btn-outline text-xs md:text-sm"
                onClick={() => setShowEmpresaForm(v => !v)}
              >
                {showEmpresaForm ? 'Fechar edição' : 'Ver / editar dados'}
              </button>
            </div>

            {showEmpresaForm && (
              <>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nome da empresa</label>
                    <input
                      className="input w-full"
                      value={empresa.nome}
                      onChange={e => setEmpresa(prev => ({ ...prev, nome: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">NUIT</label>
                    <input
                      className="input w-full"
                      value={empresa.nuit}
                      onChange={e => setEmpresa(prev => ({ ...prev, nuit: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Telefone</label>
                    <input
                      className="input w-full"
                      value={empresa.telefone}
                      onChange={e => setEmpresa(prev => ({ ...prev, telefone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">E-mail</label>
                    <input
                      className="input w-full"
                      value={empresa.email}
                      onChange={e => setEmpresa(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Endereço</label>
                    <textarea
                      className="input w-full min-h-[80px]"
                      value={empresa.endereco}
                      onChange={e => setEmpresa(prev => ({ ...prev, endereco: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    className="btn-primary"
                    onClick={salvar}
                    disabled={saving || loading}
                  >
                    {saving ? 'Salvando...' : 'Salvar dados'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-red-700">Administração</h2>
        <p className="text-sm text-gray-600">
          Ação crítica: o botão abaixo apaga todos os dados do tenant no servidor (vendas, dívidas, mesas, turnos, produtos, clientes, usuários e configurações).
          Os backups são mantidos.
        </p>
        <button
          className="btn-outline border-red-400 text-red-700 hover:bg-red-50"
          onClick={() => { setResetOpen(true); setError(null); setSuccess(null); }}
        >
          Resetar dados online
        </button>

        {resetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-semibold text-red-700">Confirmar reset</h3>
              <p className="text-sm text-gray-700">
                Esta ação vai apagar todas as vendas online. Produtos, clientes e usuários serão mantidos.
                Para confirmar, digite <span className="font-mono font-semibold">RESETAR</span> abaixo.
              </p>
              <input
                className="input w-full"
                value={resetText}
                onChange={e => setResetText(e.target.value)}
                placeholder="Digite RESETAR para confirmar"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => { if (!resetting) { setResetOpen(false); setResetText('') } }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary bg-red-600 hover:bg-red-700"
                  disabled={resetting}
                  onClick={confirmarReset}
                >
                  {resetting ? 'Resetando...' : 'Confirmar reset'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Backups (completo)</h2>
        <p className="text-sm text-gray-600">
          Crie backups antes de fazer reset. O reset não apaga os backups.
          O backup inclui: usuários, clientes, produtos, mesas, turnos, dívidas, vendas e configurações.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nome do backup (opcional)</label>
            <input className="input w-full" value={backupNome} onChange={e => setBackupNome(e.target.value)} placeholder="Ex: Fechamento do dia 01/03" />
          </div>
          <button className="btn-primary" onClick={criarBackup} disabled={creatingBackup}>
            {creatingBackup ? 'Criando...' : 'Criar backup'}
          </button>
        </div>

        {backupsLoading ? (
          <p className="text-sm text-gray-500">Carregando backups...</p>
        ) : backups.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum backup encontrado.</p>
        ) : (
          <div className="space-y-2">
            {backups.map((b) => (
              <div key={String(b.id)} className="border border-gray-200 rounded-md p-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{b.nome || 'Backup'}</div>
                  <div className="text-xs text-gray-500">{b.created_at}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-outline" onClick={() => { setRestoreTarget(b); setRestoreOpen(true); setError(null); setSuccess(null) }}>Restaurar</button>
                  <button className="btn-outline border-red-300 text-red-700 hover:bg-red-50" onClick={() => { setDeleteBackupTarget(b); setDeleteBackupOpen(true); setError(null); setSuccess(null) }}>Apagar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={restoreOpen}
        title="Restaurar backup"
        onClose={() => { if (!restoring) { setRestoreOpen(false); setRestoreTarget(null) } }}
        fullScreenMobile={false}
        actions={(
          <>
            <button className="btn-outline" disabled={restoring} onClick={() => { setRestoreOpen(false); setRestoreTarget(null) }}>Cancelar</button>
            <button className="btn-primary" disabled={restoring} onClick={confirmarRestaurar}>{restoring ? 'Restaurando...' : 'Restaurar'}</button>
          </>
        )}
      >
        <div className="space-y-2">
          <div className="text-sm text-gray-700">
            Esta ação vai apagar as vendas atuais e restaurar as vendas do backup selecionado.
          </div>
          <div className="text-sm font-semibold text-gray-900">{restoreTarget?.nome || 'Backup'}</div>
        </div>
      </Modal>

      <Modal
        open={deleteBackupOpen}
        title="Apagar backup"
        onClose={() => { if (!deletingBackup) { setDeleteBackupOpen(false); setDeleteBackupTarget(null) } }}
        fullScreenMobile={false}
        actions={(
          <>
            <button className="btn-outline" disabled={deletingBackup} onClick={() => { setDeleteBackupOpen(false); setDeleteBackupTarget(null) }}>Cancelar</button>
            <button className="btn-primary" disabled={deletingBackup} onClick={confirmarApagarBackup}>{deletingBackup ? 'Apagando...' : 'Apagar'}</button>
          </>
        )}
      >
        <div className="space-y-2">
          <div className="text-sm text-gray-700">Tem certeza que deseja apagar este backup?</div>
          <div className="text-sm font-semibold text-gray-900">{deleteBackupTarget?.nome || 'Backup'}</div>
        </div>
      </Modal>
    </div>
  )
}
