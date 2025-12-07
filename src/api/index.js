import axios from 'axios';

const API_URL = 'http://64.23.151.140/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  refresh: () => api.post('/auth/refresh'),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  get: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// ISPs API
export const ispsAPI = {
  getAll: () => api.get('/isps'),
  get: (id) => api.get(`/isps/${id}`),
  create: (data) => api.post('/isps', data),
  update: (id, data) => api.put(`/isps/${id}`, data),
  delete: (id) => api.delete(`/isps/${id}`),
  suspend: (id) => api.post(`/isps/${id}/suspend`),
  activate: (id) => api.post(`/isps/${id}/activate`),
  getTelemetry: (id) => api.get(`/isps/${id}/telemetry`),
  getDashboard: (id) => api.get(`/isps/${id}/dashboard`),
};

// Licenses API
export const licensesAPI = {
  getAll: () => api.get('/licenses'),
  get: (id) => api.get(`/licenses/${id}`),
  create: (data) => api.post('/licenses', data),
  revoke: (id) => api.post(`/licenses/${id}/revoke`),
  validate: (data) => api.post('/licenses/validate', data),
};

// Distributors API
export const distributorsAPI = {
  getAll: () => api.get('/distributors'),
  get: (id) => api.get(`/distributors/${id}`),
  create: (data) => api.post('/distributors', data),
  update: (id, data) => api.put(`/distributors/${id}`, data),
  getISPs: (id) => api.get(`/distributors/${id}/isps`),
};

// Plans API
export const plansAPI = {
  getAll: () => api.get('/plans'),
  get: (id) => api.get(`/plans/${id}`),
};

// Invoices API
export const invoicesAPI = {
  getAll: () => api.get('/invoices'),
  create: (data) => api.post('/invoices', data),
  markPaid: (id) => api.post(`/invoices/${id}/pay`),
  checkOverdue: () => api.post('/invoices/check-overdue'),
};

// Telemetry API
export const telemetryAPI = {
  getStats: (params) => api.get('/telemetry/stats', { params }),
};

// Logs API
export const logsAPI = {
  getAll: (params) => api.get('/logs', { params }),
  getStats: () => api.get('/logs/stats'),
  cleanup: () => api.delete('/logs/cleanup'),
};

// Settings API
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  get: (key) => api.get(`/settings/get?key=${key}`),
  update: (key, value) => api.put(`/settings/update?key=${key}`, { value }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// Top Sites & Apps API (NEW)
export const topSitesAPI = {
  getTopSites: (params) => api.get('/sites/top', { params }),
  getTopApps: () => api.get('/apps/top'),
  getCategories: () => api.get('/apps/categories'),
};
