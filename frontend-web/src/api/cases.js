import apiClient from './client';

export const getAllCases = (params) => apiClient.get('/cases/all', { params }); // admin sees all patients
export const getCaseById = (id) => apiClient.get(`/cases/${id}`);
export const createCase = (data) => apiClient.post('/cases', data);
export const updateCase = (id, data) => apiClient.put(`/cases/${id}`, data);
export const deleteCase = (id) => apiClient.delete(`/cases/${id}`);
export const getCaseStats = () => apiClient.get('/cases/stats');