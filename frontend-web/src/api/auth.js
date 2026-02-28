import apiClient from './client';

export const registerUser = (data) => apiClient.post('/auth/register', data);
export const loginUser = (data) => apiClient.post('/auth/login', data);
export const getProfile = () => apiClient.get('/users/profile');