import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: 'https://irabiescare-production.up.railway.app/api',
});

// ✅ Public routes that don't need token
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

apiClient.interceptors.request.use(async (config) => {
  const isPublic = PUBLIC_ROUTES.some(route => config.url?.includes(route));
  
  if (!isPublic) {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default apiClient;