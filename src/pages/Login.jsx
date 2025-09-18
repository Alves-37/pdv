import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { login, loading, error } = useAuth()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    const ok = await login(usuario, senha)
    if (ok) navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Lado visual (desktop) */}
      <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PDV3 Online</h1>
          <p className="mt-2 text-white/80">Sistema de ponto de venda com sincronização online.</p>
        </div>
        <div className="space-y-4">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-sm leading-relaxed">
              Acesse sua conta para gerir <strong>Vendas</strong>, <strong>Produtos</strong>,
              <strong> Clientes</strong> e <strong>Usuários</strong> em um único lugar.
            </p>
          </div>
          <p className="text-xs text-white/70">© {new Date().getFullYear()} PDV3. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Lado do formulário */}
      <div className="flex items-center justify-center px-6 py-10 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Marca (mobile) */}
          <div className="md:hidden mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">PDV3 Online</h1>
            <p className="text-sm text-gray-500">Faça login para continuar</p>
          </div>

          <div className="bg-white shadow-card rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900">Entrar</h2>
            <p className="text-sm text-gray-500 mb-6">Use suas credenciais do sistema</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label mb-1">Usuário</label>
                <input className="input" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="ex.: admin" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label">Senha</label>
                  <a className="text-xs text-primary-600 hover:underline" href="#">Esqueceu a senha?</a>
                </div>
                <input className="input" type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full h-11" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>

              <p className="text-xs text-gray-500 text-center">Dica: utilize um usuário válido cadastrado no backend</p>
            </form>
          </div>

          {/* Rodapé (mobile) */}
          <p className="md:hidden text-center text-xs text-gray-400 mt-6">© {new Date().getFullYear()} PDV3</p>
        </div>
      </div>
    </div>
  )
}
