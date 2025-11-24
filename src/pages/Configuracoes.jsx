import { useEffect, useState } from 'react'
import { api } from '../services/api'

export default function Configuracoes() {
  const [empresa, setEmpresa] = useState({ nome: '', nuit: '', telefone: '', email: '', endereco: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

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
    load()
    return () => { mounted = false }
  }, [])

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
      setSuccess('Dados de vendas online foram resetados.')
      setResetOpen(false)
      setResetText('')
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
          Ação crítica: o botão abaixo apaga todas as vendas online (itens_venda e vendas) no servidor.
          Produtos, clientes e usuários são mantidos.
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
    </div>
  )
}
