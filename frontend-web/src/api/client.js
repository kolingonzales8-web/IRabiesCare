import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://irabiescare-production.up.railway.app/api',
});

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

// ✅ Auto logout if account is deactivated
apiClient.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.message || '';
    if (error.response?.status === 401 && message === 'Account is deactivated') {
      // Clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;