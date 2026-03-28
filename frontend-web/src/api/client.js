import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://backend-production-9b22.up.railway.app/api',
});

// ✅ Public routes that don't need token
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

apiClient.interceptors.request.use((config) => {
  const isPublic = PUBLIC_ROUTES.some(route => config.url?.includes(route));

  if (!isPublic) {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;