import { Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './routes/PrivateRoute'
import AppLayout from './layouts/AppLayout'
import AppLayoutRestaurante from './layouts/AppLayoutRestaurante'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Produtos from './pages/Produtos'
import Usuarios from './pages/Usuarios'
import Clientes from './pages/Clientes'
import Vendas from './pages/Vendas'
import RelatoriosFinanceiros from './pages/RelatoriosFinanceiros'
import BusinessType from './pages/BusinessType'
import DashboardRestaurante from './pages/DashboardRestaurante'
import RestauranteProdutos from './pages/RestauranteProdutos'
import RestauranteClientes from './pages/RestauranteClientes'
import RestauranteUsuarios from './pages/RestauranteUsuarios'
import RestauranteVendas from './pages/RestauranteVendas'
import RestauranteRelatorios from './pages/RestauranteRelatorios'

function App() {
  return (
    <Routes>
      {/* Rota pública de login */}
      <Route path="/login" element={<Login />} />

      {/* Tela de seleção de tipo de negócio pós-login */}
      <Route element={<PrivateRoute />}>
        <Route path="/selecionar-tipo" element={<BusinessType />} />
      </Route>

      {/* Rotas privadas Mercearia com layout padrão */}
      <Route element={<PrivateRoute />}> 
        <Route element={<AppLayout />}> 
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/relatorios-financeiros" element={<RelatoriosFinanceiros />} />

          {/* Redirect raiz para dashboard Mercearia */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      {/* Rotas privadas Restaurante com layout próprio e prefixo /restaurante */}
      <Route element={<PrivateRoute />}> 
        <Route element={<AppLayoutRestaurante />}> 
          <Route path="/restaurante/dashboard" element={<DashboardRestaurante />} />
          <Route path="/restaurante/produtos" element={<RestauranteProdutos />} />
          <Route path="/restaurante/clientes" element={<RestauranteClientes />} />
          <Route path="/restaurante/usuarios" element={<RestauranteUsuarios />} />
          <Route path="/restaurante/vendas" element={<RestauranteVendas />} />
          <Route path="/restaurante/relatorios" element={<RestauranteRelatorios />} />
        </Route>
      </Route>

      {/* Catch-all: redireciona para dashboard Mercearia se autenticado, senão login */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
