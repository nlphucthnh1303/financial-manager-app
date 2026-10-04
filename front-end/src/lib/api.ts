import axios from 'axios';

function getInitialBaseUrl(): string {
  if (typeof window !== 'undefined') {
    if (window.location.protocol.startsWith('http') && window.location.port) {
      if (window.location.port === '8080' || window.location.port === '5266') {
        return `${window.location.origin}/api/v1`;
      }
    }
    const cached = localStorage.getItem('active_api_base_url');
    if (cached) return cached;
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
}

export let currentApiBaseUrl = getInitialBaseUrl();

export const api = axios.create({
  baseURL: currentApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 1800,
});

export async function discoverActiveApiUrl(fast = false): Promise<string | null> {
  const candidates: string[] = [];
  
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http') && window.location.port) {
    candidates.push(`${window.location.origin}/api/v1`);
  }
  candidates.push(
    'http://localhost:8080/api/v1',
    'http://localhost:5266/api/v1',
    'http://127.0.0.1:8080/api/v1',
    'http://127.0.0.1:5266/api/v1'
  );

  const timeoutMs = fast ? 600 : 1500;
  for (const url of candidates) {
    try {
      const res = await axios.get(`${url}/sync/status`, { timeout: timeoutMs });
      if (res.status === 200) {
        currentApiBaseUrl = url;
        api.defaults.baseURL = url;
        localStorage.setItem('active_api_base_url', url);
        return url;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

// Background initial probe
if (typeof window !== 'undefined') {
  setTimeout(() => {
    discoverActiveApiUrl(true).catch(() => {});
  }, 100);
}

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
  async (error) => {
    const currentToken = localStorage.getItem('accessToken');
    if (error.response?.status === 401 && currentToken !== 'offline-local-token') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const errData = error.response?.data;
    return Promise.reject(errData || { message: 'Không thể kết nối tới máy chủ (Ngoại tuyến).', isOffline: true });
  }
);

