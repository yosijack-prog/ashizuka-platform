// ============================================================
// 芦塚酒店 統合プラットフォーム - 共有APIクライアント
// 全アプリ（SmartUnit / CustomerOrder / AlcoholSearch / SalesManager）で使用
// ============================================================

import type {
  Employee,
  Customer,
  Product,
  CustomerPrice,
  Order,
  NewProductIntroduction,
  QuarterlyEvaluation,
  DeliveryStatus,
  ApiResponse,
} from '@ashizuka/types';

export type { Employee, Customer, Product, CustomerPrice, Order, NewProductIntroduction, QuarterlyEvaluation, DeliveryStatus, ApiResponse };

const BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL)
  ?? 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json() as Promise<ApiResponse<T>>;
}

// ---- 社員 ----
export const employeeApi = {
  list: () => request<Employee[]>('/api/employees'),
  get: (id: string) => request<Employee>(`/api/employees/${id}`),
  create: (data: Omit<Employee, 'id'> & { id: string }) =>
    request<Employee>('/api/employees', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Employee>) =>
    request<Employee>(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<null>(`/api/employees/${id}`, { method: 'DELETE' }),
};

// ---- 顧客 ----
export const customerApi = {
  list: (params?: { area?: string; employeeId?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<Customer[]>(`/api/customers${q ? `?${q}` : ''}`);
  },
  get: (id: string) => request<Customer>(`/api/customers/${id}`),
  create: (data: Customer) =>
    request<Customer>('/api/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Customer>) =>
    request<Customer>(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updatePrice: (customerId: string, productId: string, sellingPrice: number) =>
    request<CustomerPrice>(`/api/customers/${customerId}/prices`, {
      method: 'PUT',
      body: JSON.stringify({ productId, sellingPrice }),
    }),
};

// ---- 商品 ----
export const productApi = {
  list: (params?: { genre?: string; q?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<Product[]>(`/api/products${query ? `?${query}` : ''}`);
  },
  get: (id: string) => request<Product>(`/api/products/${id}`),
  create: (data: Product) =>
    request<Product>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Product>) =>
    request<Product>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ---- 発注 ----
export const orderApi = {
  list: (params?: { source?: Order['source']; employeeId?: string; customerId?: string; from?: string; to?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<Order[]>(`/api/orders${query ? `?${query}` : ''}`);
  },
  get: (id: string) => request<Order>(`/api/orders/${id}`),
  create: (data: Omit<Order, 'id'>) =>
    request<Order>('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateDeliveryStatus: (id: string, deliveryStatus: DeliveryStatus) =>
    request<Order>(`/api/orders/${id}/delivery-status`, {
      method: 'PATCH',
      body: JSON.stringify({ deliveryStatus }),
    }),
};

// ---- 新商品導入記録 ----
export const newProductApi = {
  list: (params?: { employeeId?: string; quarterKey?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<NewProductIntroduction[]>(`/api/new-products${query ? `?${query}` : ''}`);
  },
  upsert: (data: Omit<NewProductIntroduction, 'id'>) =>
    request<NewProductIntroduction>('/api/new-products', { method: 'POST', body: JSON.stringify(data) }),
};

// ---- 四半期評価 ----
export const evaluationApi = {
  list: (params?: { employeeId?: string; quarterKey?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<QuarterlyEvaluation[]>(`/api/evaluations${query ? `?${query}` : ''}`);
  },
  upsert: (data: Omit<QuarterlyEvaluation, 'id'>) =>
    request<QuarterlyEvaluation>('/api/evaluations', { method: 'POST', body: JSON.stringify(data) }),
};
