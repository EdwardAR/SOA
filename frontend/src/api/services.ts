import apiClient from './client';

// Auth
export const authService = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  logout: () => {
    localStorage.removeItem('token');
  },
};

// Alumnos
export const alumnosService = {
  getAll: () => apiClient.get('/alumnos'),
  getById: (id: string) => apiClient.get(`/alumnos/${id}`),
  create: (data: any) => apiClient.post('/alumnos', data),
  update: (id: string, data: any) => apiClient.put(`/alumnos/${id}`, data),
  delete: (id: string) => apiClient.delete(`/alumnos/${id}`),
};

// Cursos
export const cursosService = {
  getAll: () => apiClient.get('/cursos'),
  getById: (id: string) => apiClient.get(`/cursos/${id}`),
  create: (data: any) => apiClient.post('/cursos', data),
  update: (id: string, data: any) => apiClient.put(`/cursos/${id}`, data),
  delete: (id: string) => apiClient.delete(`/cursos/${id}`),
};

// Profesores
export const profesoresService = {
  getAll: () => apiClient.get('/profesores'),
  getById: (id: string) => apiClient.get(`/profesores/${id}`),
  create: (data: any) => apiClient.post('/profesores', data),
  update: (id: string, data: any) => apiClient.put(`/profesores/${id}`, data),
  delete: (id: string) => apiClient.delete(`/profesores/${id}`),
};

// Matrículas
export const matriculasService = {
  getAll: () => apiClient.get('/matriculas'),
  getById: (id: string) => apiClient.get(`/matriculas/${id}`),
  create: (data: any) => apiClient.post('/matriculas', data),
  update: (id: string, data: any) => apiClient.put(`/matriculas/${id}`, data),
  delete: (id: string) => apiClient.delete(`/matriculas/${id}`),
};

// Pagos
export const pagosService = {
  getAll: () => apiClient.get('/pagos'),
  getById: (id: string) => apiClient.get(`/pagos/${id}`),
  create: (data: any) => apiClient.post('/pagos', data),
  update: (id: string, data: any) => apiClient.put(`/pagos/${id}`, data),
  delete: (id: string) => apiClient.delete(`/pagos/${id}`),
};

// Asistencia
export const asistenciaService = {
  getAll: () => apiClient.get('/asistencia'),
  getById: (id: string) => apiClient.get(`/asistencia/${id}`),
  create: (data: any) => apiClient.post('/asistencia', data),
  update: (id: string, data: any) => apiClient.put(`/asistencia/${id}`, data),
};

// Calificaciones
export const calificacionesService = {
  getAll: () => apiClient.get('/calificaciones'),
  getById: (id: string) => apiClient.get(`/calificaciones/${id}`),
  create: (data: any) => apiClient.post('/calificaciones', data),
  update: (id: string, data: any) => apiClient.put(`/calificaciones/${id}`, data),
};

// Notificaciones
export const notificacionesService = {
  getAll: () => apiClient.get('/notificaciones'),
  markAsRead: (id: string) => apiClient.put(`/notificaciones/${id}/read`, {}),
};
