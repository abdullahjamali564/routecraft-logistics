import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1', timeout: 10000 });
api.interceptors.request.use((config) => { const token = localStorage.getItem('routecraft_token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
api.interceptors.response.use((response) => response, async (error) => { if (error.response?.status === 401 && !error.config._retry) { error.config._retry = true; const refresh = localStorage.getItem('routecraft_refresh'); if (refresh) { try { const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken: refresh }); localStorage.setItem('routecraft_token', data.data.token); error.config.headers.Authorization = `Bearer ${data.data.token}`; return api(error.config); } catch { localStorage.clear(); window.location.reload(); } } else { localStorage.clear(); window.location.reload(); } } return Promise.reject(error); });
export function apiErrorMessage(error: unknown, fallback: string) { if (axios.isAxiosError(error)) return error.response?.data?.error?.message ?? fallback; return fallback; }
export type Stage = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
export type Order = { _id: string; trackingNumber: string; stage: Stage; dropoff: { addressLine: string; city: string; region?: string; postalCode?: string }; package: { weight: number; description?: string }; priceBreakdown: { total: number; currency: string }; createdAt: string; deliveryLog?: { stage: string; at: string }[] };
export const listOrders = async () => (await api.get<{ data: Order[] }>('/orders')).data.data;
export const createOrder = async (payload: unknown) => (await api.post<{ data: Order }>('/orders', payload)).data.data;
export const login = async (email: string, password: string) => (await api.post<{ data: { token: string; refreshToken?: string; user: { role: string } } }>('/auth/login', { email, password })).data.data;
