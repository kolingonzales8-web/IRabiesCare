import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: 'https://irabiescare-production.up.railway.app/api',
});

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

// ✅ Auto logout if account is deactivated
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const message = error.response?.data?.message || '';
    if (error.response?.status === 401 && message === 'Account is deactivated') {
      // Clear storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      // Reset zustand store
      const useAuthStore = (await import('../store/authStore')).default;
      useAuthStore.getState().logout();

      // Redirect to Login
      const { navigationRef } = await import('../navigation/navigationRef');
      if (navigationRef.isReady()) {
        const { CommonActions } = await import('@react-navigation/native');
        navigationRef.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] })
        );
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;