// Simple API client using fetch, with base URL and auth token
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function request(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  const token = auth ? localStorage.getItem('access_token') : null;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      // Content-Type pode ser sobrescrito (ex.: form-urlencoded no login)
      'Content-Type': headers['Content-Type'] || 'application/json',
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body && headers['Content-Type'] === 'application/x-www-form-urlencoded'
      ? body
      : (body ? JSON.stringify(body) : undefined),
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      message = data?.detail || data?.message || message;
    } catch {}
    throw new Error(message);
  }
  // try parse json else return null
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export const api = {
  // Backend espera OAuth2PasswordRequestForm: username, password (form-urlencoded)
  login: (usuario, senha) => request('/auth/login', {
    method: 'POST',
    body: new URLSearchParams({ username: usuario, password: senha }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    auth: false,
  }),
  // Produtos
  getProdutos: (q) => request(`/api/produtos/${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  createProduto: (payload) => request('/api/produtos/', { method: 'POST', body: payload }),
  updateProduto: (id, payload) => request(`/api/produtos/${id}`, { method: 'PUT', body: payload }),
  deleteProduto: (id) => request(`/api/produtos/${id}`, { method: 'DELETE' }),
  // Categorias
  getCategorias: () => request('/api/categorias/'),
  // Usuários
  getUsuarios: () => request('/api/usuarios/'),
  getUsuariosDesativados: () => request('/api/usuarios/desativados'),
  createUsuario: (payload) => request('/api/usuarios/', { method: 'POST', body: payload }),
  updateUsuario: (id, payload) => request(`/api/usuarios/${id}`, { method: 'PUT', body: payload }),
  activateUsuario: (id) => request(`/api/usuarios/${id}/ativar`, { method: 'PUT' }),
  deleteUsuario: (id) => request(`/api/usuarios/${id}`, { method: 'DELETE' }),
  // Clientes
  getClientes: (q) => request(`/api/clientes/${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  createCliente: (payload) => request('/api/clientes/', { method: 'POST', body: payload }),
  updateCliente: (id, payload) => request(`/api/clientes/${id}`, { method: 'PUT', body: payload }),
  deleteCliente: (id) => request(`/api/clientes/${id}`, { method: 'DELETE' }),
  // Vendas
  getVendas: () => request('/api/vendas/'),
  getVenda: (id) => request(`/api/vendas/id/${id}`),
  getVendasPeriodo: (data_inicio, data_fim, usuario_id, limit, offset = 0) => {
    const qs = new URLSearchParams()
    if (data_inicio) qs.set('data_inicio', data_inicio)
    if (data_fim) qs.set('data_fim', data_fim)
    if (usuario_id != null) qs.set('usuario_id', usuario_id)
    if (limit != null) qs.set('limit', limit)
    if (offset) qs.set('offset', offset)
    return request(`/api/vendas/periodo?${qs.toString()}`)
  },
};

export default api;
