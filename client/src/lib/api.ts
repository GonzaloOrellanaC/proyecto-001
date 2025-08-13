import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export type LoginResponse = {
  ok: boolean;
  token: string;
  user: { _id: string; email: string; name: string; role: 'admin' | 'cashier' };
};

// Axios instance with base config
const http = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

// Inject JWT token when available
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config && config.headers) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unified request wrapper compatible with previous fetch-style usage
async function request(path: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase() as AxiosRequestConfig['method'];
  const headers = { 'Content-Type': 'application/json', ...(options.headers as any) } as Record<string, string>;
  const data = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined;
  try {
    const res = await http.request({ url: path, method, headers, data });
    console.log('API Response:', { path, method, status: res.status, data: res.data });
    return res.data;
  } catch (err) {
    const e = err as AxiosError<any>;
    const status = e.response?.status;
    const data = e.response?.data as any;
    console.error('API Error:', { path, method, status, data });
    const message = data?.error || data?.message || e.message || 'Request failed';
    throw new Error(message);
  }
}

export const api = {
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }) as Promise<LoginResponse>,
  me: () => request('/me'),
  // Users (admin)
  listUsers: () => request('/users') as Promise<{ ok: boolean; users: any[] }>,
  listUsersByOrg: (orgId: string) => request(`/users/by-org/${encodeURIComponent(orgId)}`) as Promise<{ ok: boolean; users: any[] }>,
  updateUser: (id: string, data: Partial<{ name: string; phone: string; avatarUrl: string; role: 'admin'|'cashier'; roleId: string }>) =>
    request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }) as Promise<{ ok: boolean; user: any }>,
  createUser: (data: { name: string; email: string; password: string; role?: 'admin'|'cashier'; roleId?: string }) =>
    request('/users', { method: 'POST', body: JSON.stringify(data) }) as Promise<{ ok: boolean; user: any }>,
  // Roles (admin)
  listRoles: () => request('/roles') as Promise<{ ok: boolean; roles: any[] }>,
  createRole: (data: { key: string; name: string; description?: string; permissions?: string[] }) =>
    request('/roles', { method: 'POST', body: JSON.stringify(data) }) as Promise<{ ok: boolean; role: any }>,
  updateRole: (id: string, data: Partial<{ name: string; description: string; permissions: string[] }>) =>
    request(`/roles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }) as Promise<{ ok: boolean; role: any }>,
  deleteRole: (id: string) => request(`/roles/${id}`, { method: 'DELETE' }) as Promise<{ ok: boolean }>,
  // Stores (admin)
  listStores: (orgId: string) => request(`/stores?orgId=${encodeURIComponent(orgId)}`) as Promise<{ ok: boolean; stores: any[] }>,
  createStore: (data: { orgId: string; name: string; code?: string; address?: string; lat?: number; lng?: number }) =>
    request('/stores', { method: 'POST', body: JSON.stringify(data) }) as Promise<{ ok: boolean; store: any }>,
  updateStore: (id: string, data: Partial<{ orgId: string; name: string; code: string; address: string; lat: number; lng: number }>) =>
    request(`/stores/${id}`, { method: 'PATCH', body: JSON.stringify(data) }) as Promise<{ ok: boolean; store: any }>,
  // Products (admin)
  listProducts: (orgId: string) => request(`/products?orgId=${encodeURIComponent(orgId)}`) as Promise<{ ok: boolean; products: any[] }>,
  createProduct: (data: { orgId: string; sku: string; name: string; price: number }) =>
    request('/products', { method: 'POST', body: JSON.stringify(data) }) as Promise<{ ok: boolean; product: any }>,
  updateProduct: (id: string, data: Partial<{ orgId: string; sku: string; name: string; price: number }>) =>
    request(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }) as Promise<{ ok: boolean; product: any }>,
  deleteProduct: (id: string) => request(`/products/${id}`, { method: 'DELETE' }) as Promise<{ ok: boolean }>,
  // Organizations (admin)
  listOrganizations: () => request('/organizations') as Promise<{ ok: boolean; organizations: any[] }>,
  createOrganization: (data: { name: string }) => request('/organizations', { method: 'POST', body: JSON.stringify(data) }) as Promise<{ ok: boolean; organization: any }>,
  listOrganizationsByUser: (userId: string) => request(`/organizations/by-user/${encodeURIComponent(userId)}`) as Promise<{ ok: boolean; links: Array<{ userId: string; orgId: string; role: 'admin'|'cashier' }>}>,
  linkUserToOrganizations: (userId: string, orgIds: string[], role: 'cashier'|'admin'='cashier') =>
    request('/organizations/link', { method: 'POST', body: JSON.stringify({ userId, orgIds, role }) }) as Promise<{ ok: boolean; links: any[] }>,
  // User-Stores (admin/org admin)
  linkUserToStores: (userId: string, storeIds: string[]) =>
    request('/user-stores/link', { method: 'POST', body: JSON.stringify({ userId, storeIds }) }) as Promise<{ ok: boolean; links: any[] }>,
  listStoresByUser: (userId: string) => request(`/user-stores/by-user/${encodeURIComponent(userId)}`) as Promise<{ ok: boolean; links: Array<{ userId: string; storeId: string }> }>,
  // My Orgs (seller)
  listMyOrganizations: () => request('/my/organizations') as Promise<{ ok: boolean; organizations: any[] }>,
  listMyAdminOrganizations: () => request('/my/organizations/admin') as Promise<{ ok: boolean; organizations: any[] }>,
  // Dev/setup endpoints
  devCreateOrg: (name: string, token?: string) => request('/dev/org', { method: 'POST', body: JSON.stringify({ name }), headers: token ? { 'x-setup-token': token } : {} }) as Promise<{ ok: boolean; org: any }>,
  devCreateSeller: (email: string, password: string, name: string, token?: string) => request('/dev/seller', { method: 'POST', body: JSON.stringify({ email, password, name }), headers: token ? { 'x-setup-token': token } : {} }) as Promise<{ ok: boolean; user: any }>,
  devCreateProduct: (data: { orgId: string; sku: string; name: string; price: number }, token?: string) => request('/dev/product', { method: 'POST', body: JSON.stringify(data), headers: token ? { 'x-setup-token': token } : {} }) as Promise<{ ok: boolean; product: any }>,
  // Sales (seller)
  createSale: (data: { orgId: string; storeId: string; items: Array<{ productId: string; qty: number }> }) =>
    request('/sales', { method: 'POST', body: JSON.stringify(data) }) as Promise<{ ok: boolean; sale: any }>,
};
