import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5266/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && token !== 'offline-local-token') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const currentToken = localStorage.getItem('accessToken');
    if (error.response?.status === 401 && currentToken !== 'offline-local-token') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const errData = error.response?.data;
    return Promise.reject(errData || { message: 'Không thể kết nối tới máy chủ (Ngoại tuyến).' });
  }
);
