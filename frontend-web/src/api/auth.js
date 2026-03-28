import apiClient from './client';

export const registerUser = (data) => apiClient.post('/auth/register', data);
export const loginUser = (data) => apiClient.post('/auth/login', data);
export const getProfile = () => apiClient.get('/users/profile');
export const forgotPassword = (data) => apiClient.post('/auth/forgot-password', data);
export const resetPassword = (data) => apiClient.post('/auth/reset-password', data);