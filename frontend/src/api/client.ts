import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

console.log('[APIClient] Configurando con API_BASE_URL:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('[APIClient] Request a:', config.baseURL + config.url);
  console.log('[APIClient] Método:', config.method);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[APIClient] Token incluido en header');
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log('[APIClient] Respuesta exitosa:', response.status, response.statusText);
    return response;
  },
  (error) => {
    console.error('[APIClient] Error en respuesta:', error.response?.status, error.response?.statusText);
    if (error.response?.status === 401) {
      console.log('[APIClient] 401 detectado, removiendo token y redirigiendo a login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
