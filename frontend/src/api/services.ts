import apiClient from './client';

const createCrudService = (resource: string, includeDelete = true) => {
  const service = {
    getAll: () => apiClient.get(resource),
    getById: (id: string) => apiClient.get(`${resource}/${id}`),
    create: (data: any) => apiClient.post(resource, data),
    update: (id: string, data: any) => apiClient.put(`${resource}/${id}`, data),
  } as {
    getAll: () => Promise<any>;
    getById: (id: string) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete?: (id: string) => Promise<any>;
  };

  if (includeDelete) {
    service.delete = (id: string) => apiClient.delete(`${resource}/${id}`);
  }

  return service;
};

// Auth
export const authService = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  logout: () => {
    localStorage.removeItem('token');
  },
};

// Alumnos
export const alumnosService = createCrudService('/alumnos');

// Cursos
export const cursosService = createCrudService('/cursos');

// Profesores
export const profesoresService = createCrudService('/profesores');

// Matrículas
export const matriculasService = createCrudService('/matriculas');

// Pagos
export const pagosService = createCrudService('/pagos');

// Asistencia
export const asistenciaService = createCrudService('/asistencia');

// Calificaciones
export const calificacionesService = createCrudService('/calificaciones');

// Notificaciones
export const notificacionesService = {
  getAll: () => apiClient.get('/notificaciones'),
  markAsRead: (id: string) => apiClient.put(`/notificaciones/${id}/read`, {}),
};
