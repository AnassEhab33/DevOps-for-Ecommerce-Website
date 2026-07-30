import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Auth ───
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/api/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/api/auth/login", data),
  getMe: () => api.get("/api/users/me"),
};

// ─── Products ───
export const productsAPI = {
  getAll: (params?: { page?: number; limit?: number; category_id?: string; q?: string }) =>
    api.get("/api/products", { params }),
  getById: (id: string) => api.get(`/api/products/${id}`),
  getCategories: () => api.get("/api/categories"),
};

// ─── Cart ───
export const cartAPI = {
  get: (userId: string) => api.get(`/api/cart/${userId}`),
  add: (userId: string, item: {
    productId: string; name: string; price: number; image_url?: string; quantity?: number;
  }) => api.post(`/api/cart/${userId}/add`, item),
  updateQty: (userId: string, productId: string, quantity: number) =>
    api.put(`/api/cart/${userId}/item/${productId}`, { quantity }),
  removeItem: (userId: string, productId: string) =>
    api.delete(`/api/cart/${userId}/item/${productId}`),
  clear: (userId: string) => api.delete(`/api/cart/${userId}`),
};

// ─── Orders ───
export const ordersAPI = {
  create: (data: {
    userId: string;
    items: any[];
    shippingAddress: any;
    paymentId?: string;
  }) => api.post("/api/orders", data),
  getByUser: (userId: string) => api.get(`/api/orders/user/${userId}`),
  getById: (id: string) => api.get(`/api/orders/${id}`),
};

// ─── Payments ───
export const paymentsAPI = {
  process: (data: {
    order_id: string;
    amount: number;
    card_number: string;
    card_holder: string;
    expiry_month: number;
    expiry_year: number;
    cvv: string;
  }) => api.post("/api/payments/process", data),
};

export default api;
