import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: 'http://192.168.1.5:3001/api',
  // baseURL: 'http://10.0.20.194:3001/api',
  //baseURL: 'http://192.168.100.7:3001/api',
 
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default apiClient;