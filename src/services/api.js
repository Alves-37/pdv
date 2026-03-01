// Simple API client using fetch, with base URL and auth token
const DEFAULT_DEV_API_BASE_URL = 'http://127.0.0.1:8000'
const DEFAULT_PROD_API_BASE_URL = 'https://vuchadabackend-production.up.railway.app'
const DEFAULT_TENANT_ID = '11111111-1111-1111-1111-111111111111'
const API_BASE_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_BASE_URL_DEV || DEFAULT_DEV_API_BASE_URL)
  : (import.meta.env.VITE_API_BASE_URL || DEFAULT_PROD_API_BASE_URL);

console.log('[api] loaded', { baseUrl: API_BASE_URL, env: import.meta.env.MODE })

try {
  const tid = localStorage.getItem('tenant_id')
  if (tid && String(tid) === DEFAULT_TENANT_ID) {
    localStorage.removeItem('tenant_id')
  }
} catch {}

async function request(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  const token = auth ? localStorage.getItem('access_token') : null;
  const tenantId = localStorage.getItem('tenant_id');
  const includeTenantHeader = !String(path).startsWith('/auth/')
  const finalHeaders = {
    // Content-Type pode ser sobrescrito (ex.: form-urlencoded no login)
    'Content-Type': headers['Content-Type'] || 'application/json',
    ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    ...(includeTenantHeader && tenantId && String(tenantId) !== DEFAULT_TENANT_ID ? { 'X-Tenant-Id': tenantId } : {}),
    ...headers,
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...finalHeaders,
    },
    body: body && headers['Content-Type'] === 'application/x-www-form-urlencoded'
      ? body
      : (body ? JSON.stringify(body) : undefined),
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      const detail = data?.detail ?? data?.message
      if (typeof detail === 'string') {
        message = detail
      } else if (Array.isArray(detail)) {
        message = detail
          .map((d) => {
            if (typeof d === 'string') return d
            const loc = Array.isArray(d?.loc) ? d.loc.join('.') : ''
            const msg = d?.msg || ''
            return loc ? `${loc}: ${msg}` : (msg || JSON.stringify(d))
          })
          .join(' | ')
      } else if (detail && typeof detail === 'object') {
        message = JSON.stringify(detail)
      } else {
        message = message
      }
      console.error('[api] error response', { path, status: res.status, data })
    } catch {}
    throw new Error(message);
  }
  // try parse json else return null
  try {
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

async function uploadFile(path, file, { auth = true } = {}) {
  const token = auth ? localStorage.getItem('access_token') : null;
  const tenantId = localStorage.getItem('tenant_id');

  const form = new FormData();
  form.append('file', file);

  const headers = {
    ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId && String(tenantId) !== DEFAULT_TENANT_ID ? { 'X-Tenant-Id': tenantId } : {}),
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: form,
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      message = data?.detail || data?.message || message;
      try {
        console.error('[api] upload error response', { path, status: res.status, data })
      } catch {}
    } catch {}
    throw new Error(message);
  }

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

  // Tenants
  getTenants: () => request('/api/tenants/?incluir_system=true'),
  createTenant: (nome, tipo_negocio = 'mercearia', ativo = true) => request('/api/tenants/', { method: 'POST', body: { nome, tipo_negocio, ativo } }),
  updateTenant: (id, payload) => request(`/api/tenants/${id}`, { method: 'PUT', body: payload }),
  deleteTenant: (id) => request(`/api/tenants/${id}`, { method: 'DELETE' }),
  setTenantId: (tenantId) => {
    if (!tenantId || String(tenantId) === DEFAULT_TENANT_ID) {
      localStorage.removeItem('tenant_id');
      try { window.dispatchEvent(new CustomEvent('tenant_changed', { detail: { tenantId: null } })) } catch {}
      return;
    }
    localStorage.setItem('tenant_id', tenantId);
    try { window.dispatchEvent(new CustomEvent('tenant_changed', { detail: { tenantId } })) } catch {}
  },

  // Métricas (com tenant header)
  getMetricasVendasDia: (data) => request(`/api/metricas/vendas-dia?data=${encodeURIComponent(data)}`),
  getMetricasVendasMes: (anoMes) => request(`/api/metricas/vendas-mes?ano_mes=${encodeURIComponent(anoMes)}`),
  // Produtos
  getProdutos: (q, { incluir_inativos = false } = {}) => {
    const qs = new URLSearchParams()
    if (q) qs.set('q', q)
    if (incluir_inativos) qs.set('incluir_inativos', 'true')
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request(`/api/produtos/${suffix}`)
  },
  createProduto: (payload) => request('/api/produtos/', { method: 'POST', body: payload }),
  updateProduto: (id, payload) => request(`/api/produtos/${id}`, { method: 'PUT', body: payload }),
  deleteProduto: (id) => request(`/api/produtos/${id}`, { method: 'DELETE' }),
  uploadProdutoImagem: (id, file) => uploadFile(`/api/produtos/${id}/imagem`, file),
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
  createVenda: (payload) => {
    const body = { ...payload }
    if (!body.created_at) {
      // Preservar timestamp de criação no backend
      body.created_at = new Date().toISOString()
    }
    return request('/api/vendas/', { method: 'POST', body })
  },
  updateVenda: (id, payload) => {
    const body = { ...payload }
    return request(`/api/vendas/${id}`, { method: 'PUT', body })
  },
  getVendasPeriodo: (data_inicio, data_fim, usuario_id, limit, offset = 0) => {
    const qs = new URLSearchParams()
    if (data_inicio) qs.set('data_inicio', data_inicio)
    if (data_fim) qs.set('data_fim', data_fim)
    if (usuario_id != null) qs.set('usuario_id', usuario_id)
    if (limit != null) qs.set('limit', limit)
    if (offset) qs.set('offset', offset)
    return request(`/api/vendas/periodo?${qs.toString()}`)
  },

  // Restaurante: Pedidos (admin)
  getPedidos: ({ status, mesaId, incluir_cancelados = false, limit } = {}) => {
    const qs = new URLSearchParams()
    if (status) qs.set('status_filter', status)
    if (mesaId != null) {
      const raw = String(mesaId).trim()
      if (raw && /^\d+$/.test(raw)) {
        qs.set('mesa_id', raw)
      }
    }
    if (incluir_cancelados) qs.set('incluir_cancelados', 'true')
    if (limit != null) qs.set('limit', String(limit))
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request(`/api/pedidos/${suffix}`)
  },
  createPedido: (payload) => request('/api/pedidos/', { method: 'POST', body: payload }),
  getPedido: (uuid) => request(`/api/pedidos/uuid/${encodeURIComponent(uuid)}`),
  updatePedidoStatus: (uuid, status) => request(`/api/pedidos/uuid/${encodeURIComponent(uuid)}/status`, { method: 'PUT', body: { status } }),

  // Restaurante: Turnos (escala)
  getTurnos: () => request('/api/turnos/'),
  getTurnoAtivo: () => request('/api/turnos/ativo'),
  createTurno: (payload) => request('/api/turnos/', { method: 'POST', body: payload }),
  updateTurno: (id, payload) => request(`/api/turnos/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  ativarTurno: (id) => request(`/api/turnos/${encodeURIComponent(id)}/ativar`, { method: 'POST' }),
  updateTurnoMembros: (id, membros) => request(`/api/turnos/${encodeURIComponent(id)}/membros`, { method: 'PUT', body: { membros } }),
  deleteTurno: (id) => request(`/api/turnos/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  // Mesas
  getMesas: () => request('/api/mesas/'),
  createMesa: (payload) => request('/api/mesas/', { method: 'POST', body: payload }),
  updateMesa: (id, payload) => request(`/api/mesas/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  updateMesaStatus: (id, status) => request(`/api/mesas/${encodeURIComponent(id)}/status`, { method: 'PUT', body: { status } }),
  deleteMesa: (id) => request(`/api/mesas/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  // Dívidas
  /**
   * Cria uma nova dívida no backend.
   * payload deve seguir o modelo DividaCreate:
   * {
   *   id_local?: number,
   *   cliente_id?: string (UUID),
   *   usuario_id?: string (UUID),
   *   observacao?: string,
   *   desconto_aplicado?: number,
   *   percentual_desconto?: number,
   *   itens: [{ produto_id: string (UUID), quantidade, preco_unitario, subtotal }]
   * }
   */
  createDivida: (payload) => request('/api/dividas/', { method: 'POST', body: payload }),

  /**
   * Lista dívidas abertas. Se clienteId (UUID) for informado, filtra por cliente.
   */
  getDividasAbertas: (clienteId) => {
    const qs = clienteId ? `?cliente_id=${encodeURIComponent(clienteId)}` : ''
    return request(`/api/dividas/abertas${qs}`)
  },

  /**
   * Registra pagamento de uma dívida existente.
   * dividaId: UUID da dívida no backend
   * payload: { valor: number, forma_pagamento: string, usuario_id?: string(UUID) }
   */
  pagarDivida: (dividaId, payload) => (
    request(`/api/dividas/${dividaId}/pagamentos`, { method: 'POST', body: payload })
  ),
  // Métricas
  getMetricasEstoque: () => request('/api/metricas/estoque'),

  // Configuração da empresa
  getEmpresaConfig: () => request('/api/config/empresa'),
  updateEmpresaConfig: (payload) => request('/api/config/empresa', { method: 'PUT', body: payload }),

  // Admin
  resetDadosOnline: () => request('/api/admin/reset-dados', { method: 'POST' }),
  resetDadosTenant: (tenantId) => request(`/api/admin/tenants/${tenantId}/reset-dados`, { method: 'POST' }),
};

export { API_BASE_URL };

export default api;
