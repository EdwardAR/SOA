import React from 'react';

interface Endpoint {
  metodo: string;
  ruta: string;
  descripcion: string;
}

interface Servicio {
  nombre: string;
  puerto: number;
  tipo: string;
  endpoints: Endpoint[];
}

const servicios: Servicio[] = [
  {
    nombre: 'Alumnos',
    puerto: 3001,
    tipo: 'Entidad',
    endpoints: [
      { metodo: 'GET', ruta: '/alumnos', descripcion: 'Listar alumnos (paginado)' },
      { metodo: 'GET', ruta: '/alumnos/:id', descripcion: 'Obtener alumno por ID' },
      { metodo: 'POST', ruta: '/alumnos', descripcion: 'Crear alumno' },
      { metodo: 'PUT', ruta: '/alumnos/:id', descripcion: 'Actualizar alumno' },
      { metodo: 'DELETE', ruta: '/alumnos/:id', descripcion: 'Eliminar alumno (cascada)' },
      { metodo: 'GET', ruta: '/alumnos-por-padre/:padre_id', descripcion: 'Alumnos por padre' },
      { metodo: 'GET', ruta: '/alumnos/:id/deuda', descripcion: 'Estado de deuda' },
    ],
  },
  {
    nombre: 'Matrícula',
    puerto: 3002,
    tipo: 'Entidad',
    endpoints: [
      { metodo: 'GET', ruta: '/matriculas', descripcion: 'Listar matrículas (paginado)' },
      { metodo: 'GET', ruta: '/matriculas/:id', descripcion: 'Obtener matrícula por ID' },
      { metodo: 'POST', ruta: '/matriculas', descripcion: 'Crear matrícula' },
      { metodo: 'PUT', ruta: '/matriculas/:id', descripcion: 'Actualizar matrícula' },
      { metodo: 'DELETE', ruta: '/matriculas/:id', descripcion: 'Eliminar matrícula (cascada)' },
      { metodo: 'GET', ruta: '/matriculas-alumno/:alumno_id', descripcion: 'Matrículas por alumno' },
    ],
  },
  {
    nombre: 'Profesores',
    puerto: 3003,
    tipo: 'Entidad',
    endpoints: [
      { metodo: 'GET', ruta: '/profesores', descripcion: 'Listar profesores (paginado)' },
      { metodo: 'GET', ruta: '/profesores/:id', descripcion: 'Obtener profesor por ID' },
      { metodo: 'POST', ruta: '/profesores', descripcion: 'Crear profesor' },
      { metodo: 'PUT', ruta: '/profesores/:id', descripcion: 'Actualizar profesor' },
      { metodo: 'DELETE', ruta: '/profesores/:id', descripcion: 'Eliminar profesor (cascada)' },
      { metodo: 'GET', ruta: '/profesores-activos/lista/todos', descripcion: 'Profesores activos' },
    ],
  },
  {
    nombre: 'Cursos',
    puerto: 3004,
    tipo: 'Entidad',
    endpoints: [
      { metodo: 'GET', ruta: '/cursos', descripcion: 'Listar cursos (paginado)' },
      { metodo: 'GET', ruta: '/cursos/:id', descripcion: 'Obtener curso por ID' },
      { metodo: 'POST', ruta: '/cursos', descripcion: 'Crear curso' },
      { metodo: 'PUT', ruta: '/cursos/:id', descripcion: 'Actualizar curso' },
      { metodo: 'DELETE', ruta: '/cursos/:id', descripcion: 'Eliminar curso (cascada)' },
      { metodo: 'GET', ruta: '/cursos/:id/estudiantes', descripcion: 'Estudiantes por curso' },
      { metodo: 'GET', ruta: '/cursos-profesor/:profesor_id', descripcion: 'Cursos por profesor' },
    ],
  },
  {
    nombre: 'Pagos',
    puerto: 3005,
    tipo: 'Entidad',
    endpoints: [
      { metodo: 'GET', ruta: '/pagos', descripcion: 'Listar pagos (paginado)' },
      { metodo: 'GET', ruta: '/pagos/:id', descripcion: 'Obtener pago por ID' },
      { metodo: 'POST', ruta: '/pagos', descripcion: 'Crear pago' },
      { metodo: 'PUT', ruta: '/pagos/:id', descripcion: 'Actualizar pago' },
      { metodo: 'PUT', ruta: '/pagos/:id/procesar', descripcion: 'Procesar pago (actualiza deuda)' },
      { metodo: 'DELETE', ruta: '/pagos/:id', descripcion: 'Eliminar pago' },
      { metodo: 'GET', ruta: '/pagos-alumno/:alumno_id', descripcion: 'Pagos por alumno' },
      { metodo: 'GET', ruta: '/deuda/:alumno_id', descripcion: 'Estado de deuda' },
    ],
  },
  {
    nombre: 'Notificaciones',
    puerto: 3006,
    tipo: 'Utilidad',
    endpoints: [
      { metodo: 'GET', ruta: '/notificaciones', descripcion: 'Listar notificaciones (paginado)' },
      { metodo: 'GET', ruta: '/notificaciones/:id', descripcion: 'Obtener notificación por ID' },
      { metodo: 'POST', ruta: '/notificaciones', descripcion: 'Crear notificación' },
      { metodo: 'PUT', ruta: '/notificaciones/:id', descripcion: 'Actualizar notificación' },
      { metodo: 'DELETE', ruta: '/notificaciones/:id', descripcion: 'Eliminar notificación' },
      { metodo: 'GET', ruta: '/notificaciones-usuario/:usuario_id', descripcion: 'Notificaciones por usuario' },
      { metodo: 'POST', ruta: '/notificaciones/inasistencia', descripcion: 'Notificar inasistencia' },
    ],
  },
  {
    nombre: 'Asistencia',
    puerto: 3007,
    tipo: 'Tarea',
    endpoints: [
      { metodo: 'GET', ruta: '/asistencia', descripcion: 'Listar asistencias (paginado)' },
      { metodo: 'GET', ruta: '/asistencia/:id', descripcion: 'Obtener asistencia por ID' },
      { metodo: 'POST', ruta: '/asistencia', descripcion: 'Registrar asistencia' },
      { metodo: 'PUT', ruta: '/asistencia/:id', descripcion: 'Actualizar asistencia' },
      { metodo: 'DELETE', ruta: '/asistencia/:id', descripcion: 'Eliminar asistencia' },
      { metodo: 'GET', ruta: '/asistencia-alumno/:alumno_id', descripcion: 'Asistencias por alumno' },
      { metodo: 'GET', ruta: '/asistencia-curso/:curso_id', descripcion: 'Asistencias por curso' },
      { metodo: 'GET', ruta: '/reporte-inasistencias/:fecha', descripcion: 'Reporte de inasistencias' },
    ],
  },
  {
    nombre: 'Calificaciones',
    puerto: 3008,
    tipo: 'Tarea',
    endpoints: [
      { metodo: 'GET', ruta: '/calificaciones', descripcion: 'Listar calificaciones (paginado)' },
      { metodo: 'GET', ruta: '/calificaciones/:id', descripcion: 'Obtener calificación por ID' },
      { metodo: 'POST', ruta: '/calificaciones', descripcion: 'Crear calificación' },
      { metodo: 'PUT', ruta: '/calificaciones/:id', descripcion: 'Actualizar calificación' },
      { metodo: 'DELETE', ruta: '/calificaciones/:id', descripcion: 'Eliminar calificación' },
      { metodo: 'GET', ruta: '/calificaciones-alumno/:alumno_id', descripcion: 'Calificaciones por alumno' },
      { metodo: 'GET', ruta: '/calificaciones-curso/:curso_id', descripcion: 'Calificaciones por curso' },
      { metodo: 'GET', ruta: '/reporte-promedios/:curso_id', descripcion: 'Reporte de promedios' },
    ],
  },
];

const METODO_COLOR: Record<string, string> = {
  GET: '#1565c0',
  POST: '#059669',
  PUT: '#0891b2',
  DELETE: '#dc2626',
};

const Servicios: React.FC = () => {
  const [expanded, setExpanded] = React.useState<string | null>(null);

  return (
    <div className="screen-page page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="hero-pill"><i className="bi bi-hdd-stack me-1"></i> Microservicios</span>
          <span className="hero-pill-count">{servicios.length} servicios</span>
        </div>
        <h1 className="page-hero-title"><i className="bi bi-diagram-3 me-2"></i>Servicios y Endpoints</h1>
        <p className="page-hero-subtitle">
          Catálogo completo de microservicios del sistema con sus endpoints REST. Cada servicio es un proceso Express independiente.
        </p>
      </div>

      <div className="row g-3">
        {servicios.map((svc) => {
          const isOpen = expanded === svc.nombre;
          return (
            <div key={svc.nombre} className="col-12 col-lg-6">
              <div
                className="card dashboard-card h-100"
                style={{ borderRadius: 18, cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                onClick={() => setExpanded(isOpen ? null : svc.nombre)}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <i className={`bi ${svc.tipo === 'Utilidad' ? 'bi-gear' : svc.tipo === 'Tarea' ? 'bi-lightning' : 'bi-database'} text-primary`} style={{ fontSize: '1.3rem' }}></i>
                      <div>
                        <h5 className="mb-0 fw-bold" style={{ fontSize: '1rem' }}>{svc.nombre}</h5>
                        <span className="badge" style={{ background: 'rgba(15,98,254,0.1)', color: '#1565c0', fontWeight: 600, fontSize: '0.7rem' }}>
                          Puerto {svc.puerto}
                        </span>
                        <span className="badge ms-1" style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', fontWeight: 600, fontSize: '0.7rem' }}>
                          {svc.tipo}
                        </span>
                      </div>
                    </div>
                    <i className={`bi ${isOpen ? 'bi-chevron-up' : 'bi-chevron-down'} text-muted`}></i>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    {svc.endpoints.length} endpoints — {svc.endpoints.filter(e => e.metodo === 'GET').length} GET,{' '}
                    {svc.endpoints.filter(e => e.metodo === 'POST').length} POST,{' '}
                    {svc.endpoints.filter(e => e.metodo === 'PUT').length} PUT,{' '}
                    {svc.endpoints.filter(e => e.metodo === 'DELETE').length} DELETE
                  </div>

                  {isOpen && (
                    <div className="mt-3" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                      <div className="table-responsive">
                        <table className="table table-sm align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                          <thead>
                            <tr>
                              <th style={{ width: 80, color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Método</th>
                              <th style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ruta</th>
                              <th style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Descripción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {svc.endpoints.map((ep, i) => (
                              <tr key={i}>
                                <td>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '0.15rem 0.5rem',
                                      borderRadius: 6,
                                      background: `${METODO_COLOR[ep.metodo]}12`,
                                      color: METODO_COLOR[ep.metodo],
                                      fontWeight: 700,
                                      fontSize: '0.72rem',
                                      fontFamily: "'Courier New', monospace",
                                    }}
                                  >
                                    {ep.metodo}
                                  </span>
                                </td>
                                <td>
                                  <code style={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: 500 }}>{ep.ruta}</code>
                                </td>
                                <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{ep.descripcion}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Servicios;
