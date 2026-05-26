import apiClient from './client';

const createCrudService = (resource: string, includeDelete = true) => {
  const service = {
    getAll: () => apiClient.get(resource),
    getById: (id: string | number) => apiClient.get(`${resource}/${id}`),
    create: (data: any) => apiClient.post(resource, data),
    update: (id: string | number, data: any) => apiClient.put(`${resource}/${id}`, data),
  } as {
    getAll: () => Promise<any>;
    getById: (id: string | number) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string | number, data: any) => Promise<any>;
    delete?: (id: string | number) => Promise<any>;
  };

  service.delete = includeDelete
    ? (id: string | number) => apiClient.delete(`${resource}/${id}`)
    : () => Promise.reject(new Error('Delete operation is not supported for this resource type'));

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

// Usuarios
export const usuariosService = createCrudService('/usuarios');

// Cursos
export const cursosService = createCrudService('/cursos');

// Profesores
export const profesoresService = createCrudService('/profesores');

// Matrículas
export const matriculasService = createCrudService('/matriculas');

// Pagos
export const pagosService = createCrudService('/pagos');

// Asistencia
export const asistenciaService = createCrudService('/asistencia', true);

// Calificaciones
export const calificacionesService = createCrudService('/calificaciones', true);

// Notificaciones
export const notificacionesService = createCrudService('/notificaciones', true);
