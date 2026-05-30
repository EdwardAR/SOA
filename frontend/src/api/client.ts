import axios from 'axios';

const resolveApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;

  // En tiempo de ejecución (navegador) derivamos la API del origen cuando
  // el frontend se sirve desde ngrok u otro túnel público.
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname || '';

    // Si estamos en un dominio público (no localhost),
    // asumimos que la API está disponible en la misma origen bajo /api.
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `${window.location.protocol}//${window.location.host}/api`;
    }
  }

  // Fallback para desarrollo local
  return 'http://localhost:3000/api';
};

export const API_BASE_URL = resolveApiBaseUrl();

console.log('[APIClient] Configurando con API_BASE_URL:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  console.log(
    '[APIClient] Request a:',
    `${config.baseURL || ''}${config.url || ''}`
  );

  console.log('[APIClient] Método:', config.method);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[APIClient] Token incluido en header');
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log(
      '[APIClient] Respuesta exitosa:',
      response.status,
      response.statusText
    );
    return response;
  },
  (error) => {
    console.error(
      '[APIClient] Error en respuesta:',
      error.response?.status,
      error.response?.statusText
    );

    if (error.response?.status === 401) {
      console.log(
        '[APIClient] 401 detectado, removiendo token y redirigiendo a login'
      );

      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default apiClient;