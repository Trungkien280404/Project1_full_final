// Determine API URL dynamically
let BASE = import.meta.env.VITE_API_URL;

if (!BASE) {
  // Nếu là môi trường Production (đã build), dùng relative path để tự động theo domain hiện tại
  if (import.meta.env.PROD) {
    BASE = '';
  } else {
    // Môi trường Dev (npm run dev)
    const { hostname, protocol } = window.location;

    if (hostname.includes('devtunnels.ms')) {
      // Auto-detect backend port 4000 for devtunnels
      // Example: id-5173.devtunnels.ms -> id-4000.devtunnels.ms
      const newHost = hostname.replace(/-5173\./, '-4000.');
      BASE = `${protocol}//${newHost}`;
    } else {
      // Localhost hoặc IP LAN (192.168.x.x)
      // Tự động trỏ về port 4000 trên cùng hostname
      BASE = `${protocol}//${hostname}:4000`;
    }
  }
}

export function setToken(t) { localStorage.setItem('autoparts_token', t || ''); }
export function getToken() { return localStorage.getItem('autoparts_token') || ''; }

// ---- Helpers cho JSON (Dữ liệu thường)
async function jget(path) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function jpost(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(body)
  });

  const data = await r.json();

  // Nếu response không ok (4xx, 5xx), vẫn return data để component có thể đọc message
  // Không throw error nữa
  return data;
}

async function jput(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function jdel(path) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ---- Helpers cho FormData (Upload ảnh) - KHÔNG SET Content-Type thủ công
async function jpostMultipart(path, formData) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
    body: formData
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function jputMultipart(path, formData) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
    body: formData
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export const Api = {
  // --- Auth ---
  forgot: (email) => jpost('/api/auth/forgot', { email }),
  verifyReset: (email, code) => jpost('/api/auth/verify-reset', { email, code }),
  reset: (email, code, newPassword) => jpost('/api/auth/reset', { email, code, newPassword }),
  login: (email, password) => jpost('/api/auth/login', { email, password }),
  register: (name, email, password) => jpost('/api/auth/register', { name, email, password }),

  // --- Products (CRUD) ---
  products: (params = {}) => {
    // Filter out undefined/null values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null)
    );
    const qs = new URLSearchParams(cleanParams).toString();
    return jget(`/api/products?${qs}`);
  },
  productDetail: (id) => jget(`/api/products/${id}`),
  // Dùng hàm Multipart để hỗ trợ upload file
  createProduct: (formData) => jpostMultipart('/api/products', formData),
  updateProduct: (id, formData) => jputMultipart(`/api/products/${id}`, formData),
  deleteProduct: (id) => jdel(`/api/products/${id}`),

  // --- Orders ---
  checkout: (items, info, method, installation) => jpost('/api/orders', { items, info, method, installation }),
  myOrders: () => jget('/api/orders/my'),
  receiveOrder: (id) => jput(`/api/orders/${id}/receive`, {}),

  // --- Stats ---
  overview: () => jget('/api/stats/overview'),
  traffic: () => jget('/api/stats/traffic'),

  // --- ADMIN: User Management ---
  adminGetUsers: () => jget('/api/admin/users'),
  adminUpdateUserRole: (id, role) => jput(`/api/admin/users/${id}`, { role }),
  adminDeleteUser: (id) => jdel(`/api/admin/users/${id}`),

  // --- ADMIN: Orders Management (QUAN TRỌNG - ĐỂ FIX LỖI BẠN ĐANG GẶP) ---
  adminGetOrders: () => jget('/api/admin/orders'),
  adminUpdateOrderStatus: (id, status) => jput(`/api/admin/orders/${id}`, { status }),

  // --- Misc ---
  ping: () => fetch(`${BASE}/api/traffic/ping`, { method: 'POST' }),

  diagnose: async (file) => {
    const form = new FormData();
    form.append('file', file);
    return jpostMultipart('/api/ml/diagnose', form);
  },

  // --- Reviews & Consultations ---
  submitConsultation: (data) => jpost('/api/consultations', data),
  getReviews: (productId) => jget(`/api/reviews/${productId}`),
  addReview: (data) => jpost('/api/reviews', data),

  // --- Admin: Advanced Features ---
  adminGetReviews: () => jget('/api/admin/reviews'),
  adminGetConsultations: () => jget('/api/admin/consultations'),
  adminUpdateConsultationStatus: (id, status) => jput(`/api/admin/consultations/${id}`, { status }),
  adminGetImports: () => jget('/api/admin/imports'),
  adminAddImport: (data) => jpost('/api/admin/imports', data),

  // --- Address Management ---
  getAddresses: () => jget('/api/user/addresses'),
  addAddress: (data) => jpost('/api/user/addresses', data),
  deleteAddress: (id) => jdel(`/api/user/addresses/${id}`),
};