import React, { useEffect, useState } from 'react';
import { alumnosService, asistenciaService, pagosService, calificacionesService } from '../api/services';
import { useAuth } from '../context/AuthContext';

interface AlumnoRelacionado {
  id: string;
  primer_nombre?: string;
  apellido_paterno?: string;
  numero_matricula?: string;
  email_contacto?: string;
  padre_nombre?: string;
}

interface ResumenPadre {
  asistencias: any[];
  pagos: any[];
  calificaciones: any[];
}

const Perfil: React.FC = () => {
  const { user } = useAuth();
  const [alumnoRelacionado, setAlumnoRelacionado] = useState<AlumnoRelacionado | null>(null);
  const [resumenPadre, setResumenPadre] = useState<ResumenPadre>({ asistencias: [], pagos: [], calificaciones: [] });
  const [loadingAlumno, setLoadingAlumno] = useState(false);

  useEffect(() => {
    const fetchAlumnoRelacionado = async () => {
      if (!user || user.tipo_usuario !== 'padre') return;

      try {
        setLoadingAlumno(true);
        const [alumnosResponse, asistenciaResponse, pagosResponse, calificacionesResponse] = await Promise.all([
          alumnosService.getAll(),
          asistenciaService.getAll(),
          pagosService.getAll(),
          calificacionesService.getAll(),
        ]);

        const alumno = alumnosResponse.data?.datos?.[0] || null;
        setAlumnoRelacionado(alumno);

        setResumenPadre({
          asistencias: asistenciaResponse.data?.datos || [],
          pagos: pagosResponse.data?.datos || [],
          calificaciones: calificacionesResponse.data?.datos || [],
        });
      } catch (error) {
        console.error('Error al cargar alumno relacionado:', error);
        setAlumnoRelacionado(null);
        setResumenPadre({ asistencias: [], pagos: [], calificaciones: [] });
      } finally {
        setLoadingAlumno(false);
      }
    };

    fetchAlumnoRelacionado();
  }, [user]);

  if (!user) {
    return (
      <div className="container p-4">
        <div className="alert alert-info">No hay usuario autenticado.</div>
      </div>
    );
  }

  return (
    <div className="page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <h1 className="page-hero-title">
          <i className="bi bi-person-circle me-2"></i>
          Mi Perfil
        </h1>
        <p className="page-hero-subtitle">Información de acceso y datos básicos de tu cuenta</p>
      </div>

      <div className="profile-panel">
        <div className="profile-content">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div>
              <span className="profile-badge mb-2">
                <i className="bi bi-person-badge"></i>
                Usuario activo
              </span>
              <h2 className="h4 mb-1">{user.nombre}</h2>
              <div className="text-muted">{user.email}</div>
            </div>
            <div className="text-start text-md-end">
              <div className="text-muted small text-uppercase fw-semibold">Rol</div>
              <div className="fs-5 fw-bold text-primary text-capitalize">{user.tipo_usuario}</div>
            </div>
          </div>

          <div className="profile-detail">
            <i className="bi bi-person-circle fs-4 text-primary"></i>
            <div>
              <div className="small text-muted fw-semibold text-uppercase">Nombre</div>
              <div className="fw-semibold">{user.nombre}</div>
            </div>
          </div>

          <div className="profile-detail">
            <i className="bi bi-envelope-at fs-4 text-primary"></i>
            <div>
              <div className="small text-muted fw-semibold text-uppercase">Correo electrónico</div>
              <div className="fw-semibold">{user.email}</div>
            </div>
          </div>

          <div className="profile-detail">
            <i className="bi bi-shield-check fs-4 text-primary"></i>
            <div>
              <div className="small text-muted fw-semibold text-uppercase">Tipo de usuario</div>
              <div className="fw-semibold text-capitalize">{user.tipo_usuario}</div>
            </div>
          </div>

          {user.tipo_usuario === 'padre' && (
            <div className="mt-4 p-4 rounded-4 border border-light-subtle" style={{ background: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(8px)' }}>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <div>
                  <div className="small text-muted fw-semibold text-uppercase">Hija o hijo vinculado</div>
                  <h3 className="h5 mb-0">Vista general de tu familiar en el sistema</h3>
                </div>
                <span className="badge bg-primary-subtle text-primary px-3 py-2">Relación activa</span>
              </div>

              {loadingAlumno ? (
                <div className="text-muted">Cargando datos del estudiante relacionado...</div>
              ) : alumnoRelacionado ? (
                <>
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-4">
                    <div className="profile-detail h-100">
                      <i className="bi bi-person-vcard fs-4 text-primary"></i>
                      <div>
                        <div className="small text-muted fw-semibold text-uppercase">Nombre completo</div>
                        <div className="fw-semibold">
                          {alumnoRelacionado.primer_nombre} {alumnoRelacionado.apellido_paterno}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="profile-detail h-100">
                      <i className="bi bi-upc-scan fs-4 text-primary"></i>
                      <div>
                        <div className="small text-muted fw-semibold text-uppercase">Matrícula</div>
                        <div className="fw-semibold">{alumnoRelacionado.numero_matricula || '-'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="profile-detail h-100">
                      <i className="bi bi-envelope-paper fs-4 text-primary"></i>
                      <div>
                        <div className="small text-muted fw-semibold text-uppercase">Correo de contacto</div>
                        <div className="fw-semibold">{alumnoRelacionado.email_contacto || '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card metric-card metric-primary text-white h-100">
                      <div className="card-body text-center">
                        <i className="bi bi-calendar-check metric-icon"></i>
                        <div className="metric-value">{resumenPadre.asistencias.length}</div>
                        <p className="mb-0 metric-label">Asistencias</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card metric-card metric-success text-white h-100">
                      <div className="card-body text-center">
                        <i className="bi bi-check2-circle metric-icon"></i>
                        <div className="metric-value">{resumenPadre.asistencias.filter((item) => String(item.estado).toUpperCase() === 'PRESENTE').length}</div>
                        <p className="mb-0 metric-label">Presentes</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card metric-card metric-warning text-white h-100">
                      <div className="card-body text-center">
                        <i className="bi bi-exclamation-triangle metric-icon"></i>
                        <div className="metric-value">{resumenPadre.asistencias.filter((item) => String(item.estado).toUpperCase() === 'FALTA').length}</div>
                        <p className="mb-0 metric-label">Faltas</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card metric-card metric-info text-white h-100">
                      <div className="card-body text-center">
                        <i className="bi bi-credit-card metric-icon"></i>
                        <div className="metric-value">{resumenPadre.pagos.filter((item) => String(item.estado || item.estado_pago).toLowerCase() !== 'pagado').length}</div>
                        <p className="mb-0 metric-label">Pagos pendientes</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-12 col-lg-6">
                    <div className="card dashboard-card h-100">
                      <div className="card-header" style={{ background: 'rgba(102, 126, 234, 0.05)', borderBottom: '1px solid rgba(102, 126, 234, 0.1)', padding: '16px 20px' }}>
                        <h5 className="mb-0 fw-bold text-dark">
                          <i className="bi bi-calendar2-week me-2 text-primary"></i>
                          Asistencia reciente
                        </h5>
                      </div>
                      <div className="card-body p-4">
                        {resumenPadre.asistencias.length === 0 ? (
                          <div className="text-muted">No hay registros de asistencia disponibles.</div>
                        ) : (
                          <div className="list-group list-group-flush">
                            {resumenPadre.asistencias.slice(0, 5).map((asistencia, index) => (
                              <div key={`${asistencia.id || index}`} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                                <div>
                                  <div className="fw-semibold">{asistencia.curso_nombre || asistencia.curso_id || 'Curso asignado'}</div>
                                  <small className="text-muted">{asistencia.fecha || 'Sin fecha'}</small>
                                </div>
                                <span className={`badge bg-${String(asistencia.estado).toUpperCase() === 'PRESENTE' ? 'success' : String(asistencia.estado).toUpperCase() === 'FALTA' ? 'danger' : 'secondary'}`}>
                                  {asistencia.estado || 'Sin estado'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-lg-6">
                    <div className="card dashboard-card h-100">
                      <div className="card-header" style={{ background: 'rgba(102, 126, 234, 0.05)', borderBottom: '1px solid rgba(102, 126, 234, 0.1)', padding: '16px 20px' }}>
                        <h5 className="mb-0 fw-bold text-dark">
                          <i className="bi bi-journal-text me-2 text-primary"></i>
                          Rendimiento y pagos
                        </h5>
                      </div>
                      <div className="card-body p-4">
                        <p className="mb-2">
                          <strong>Calificaciones cargadas:</strong> {resumenPadre.calificaciones.length}
                        </p>
                        <p className="mb-2">
                          <strong>Pagos registrados:</strong> {resumenPadre.pagos.length}
                        </p>
                        <p className="mb-3">
                          <strong>Estado general:</strong> <span className="badge bg-success">Consulta en línea</span>
                        </p>

                        {resumenPadre.pagos.length > 0 && (
                          <div className="list-group list-group-flush">
                            {resumenPadre.pagos.slice(0, 3).map((pago, index) => (
                              <div key={`${pago.id || index}`} className="list-group-item px-0">
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <div className="fw-semibold">{pago.concepto || 'Pago'}</div>
                                    <small className="text-muted">{pago.periodo_academico || 'Periodo no definido'}</small>
                                  </div>
                                  <span className={`badge bg-${String(pago.estado || pago.estado_pago).toLowerCase() === 'pagado' ? 'success' : 'warning'}`}>
                                    {pago.estado || pago.estado_pago || 'pendiente'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </>
              ) : (
                <div className="text-muted">No se encontró un estudiante vinculado a tu cuenta.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Perfil;
