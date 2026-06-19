import React, { useEffect, useState } from 'react';
import { alumnosService, asistenciaService, pagosService, calificacionesService, cursosService } from '../api/services';
import { useAuth } from '../context/AuthContext';

const Perfil: React.FC = () => {
  const { user } = useAuth();
  const [alumnosRelacionados, setAlumnosRelacionados] = useState<any[]>([]);
  const [resumenPadre, setResumenPadre] = useState<any>({ asistencias: [], pagos: [], calificaciones: [] });
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loadingAlumno, setLoadingAlumno] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || (user.tipo_usuario !== 'padre' && user.tipo_usuario !== 'alumno')) return;

      try {
        setLoadingAlumno(true);
        const [alumnosResponse, asistenciaResponse, pagosResponse, calificacionesResponse, cursosResponse] = await Promise.all([
          alumnosService.getAll(),
          asistenciaService.getAll(),
          pagosService.getAll(),
          calificacionesService.getAll(),
          cursosService.getAll(),
        ]);

        const hijos = alumnosResponse.data?.datos || [];
        setAlumnosRelacionados(hijos);
        if (hijos.length > 0) setSelectedChildId(hijos[0].id);

        setResumenPadre({
          asistencias: asistenciaResponse.data?.datos || [],
          pagos: pagosResponse.data?.datos || [],
          calificaciones: calificacionesResponse.data?.datos || [],
          cursos: cursosResponse.data?.datos || [],
        });
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setAlumnosRelacionados([]);
        setResumenPadre({ asistencias: [], pagos: [], calificaciones: [] });
      } finally {
        setLoadingAlumno(false);
      }
    };

    fetchData();
  }, [user]);

  const filterByChild = (items: any[], childId: string) =>
    items.filter((item: any) => String(item.alumno_id) === String(childId));

  const selectedChild = alumnosRelacionados.find(a => a.id === selectedChildId) || null;
  const childAsistencias = selectedChildId ? filterByChild(resumenPadre.asistencias, selectedChildId) : [];
  const childPagos = selectedChildId ? filterByChild(resumenPadre.pagos, selectedChildId) : [];
  const childCalificaciones = selectedChildId ? filterByChild(resumenPadre.calificaciones, selectedChildId) : [];

  if (!user) {
    return (
      <div className="container p-4">
        <div className="alert alert-info">No hay usuario autenticado.</div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-hero mb-4">
        <h1 className="page-hero-title">Mi Perfil</h1>
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

          {user.tipo_usuario === 'alumno' && (
            <div className="mt-4 p-4 rounded-4 border bg-light-subtle">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <div>
                  <div className="small text-muted fw-semibold text-uppercase">Estudiante</div>
                  <h3 className="h5 mb-0">Mi resumen académico</h3>
                </div>
              </div>

              {loadingAlumno ? (
                <div className="py-4 text-center text-muted">
                  <div className="spinner-border spinner-border-sm me-2" role="status" />
                  Cargando tus datos...
                </div>
              ) : alumnosRelacionados.length === 0 ? (
                <div className="text-muted">No se encontró tu perfil de estudiante.</div>
              ) : selectedChild && (
                <>
                  {/* Info row */}
                  <div className="d-flex flex-wrap align-items-center gap-3 mb-3 pb-3 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, fontSize: '1rem', fontWeight: 700 }}>
                        {(selectedChild.primer_nombre || '?')[0]}
                      </div>
                      <div>
                        <div className="fw-bold">{selectedChild.primer_nombre} {selectedChild.apellido_paterno}</div>
                        <small className="text-muted">{selectedChild.numero_matricula || 'Sin matrícula'}</small>
                      </div>
                    </div>
                    {selectedChild.email_contacto && (
                      <span className="text-muted small">
                        <i className="bi bi-envelope me-1"></i>{selectedChild.email_contacto}
                      </span>
                    )}
                  </div>

                  {/* 4 compact stat cards */}
                  <div className="row g-2 mb-4">
                    <div className="col-6 col-md-3">
                      <div className="bg-white rounded-3 border p-3 text-center h-100" style={{ borderLeft: '4px solid #8b5cf6' }}>
                        <div className="text-muted small text-uppercase fw-semibold">Cursos</div>
                        <div className="fs-3 fw-bold text-dark">{resumenPadre.cursos.length}</div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="bg-white rounded-3 border p-3 text-center h-100" style={{ borderLeft: '4px solid #3b82f6' }}>
                        <div className="text-muted small text-uppercase fw-semibold">Asistencias</div>
                        <div className="fs-3 fw-bold text-dark">{childAsistencias.length}</div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="bg-white rounded-3 border p-3 text-center h-100" style={{ borderLeft: '4px solid #22c55e' }}>
                        <div className="text-muted small text-uppercase fw-semibold">Calificaciones</div>
                        <div className="fs-3 fw-bold text-success">{childCalificaciones.length}</div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="bg-white rounded-3 border p-3 text-center h-100" style={{ borderLeft: '4px solid #f59e0b' }}>
                        <div className="text-muted small text-uppercase fw-semibold">Pagos pendientes</div>
                        <div className="fs-3 fw-bold text-warning">{childPagos.filter((p: any) => String(p.estado || p.estado_pago).toLowerCase() !== 'pagado').length}</div>
                      </div>
                    </div>
                  </div>

                  {/* Two-column detail */}
                  <div className="row g-3">
                    <div className="col-12 col-lg-6">
                      <div className="card dashboard-card h-100">
                        <div className="card-header bg-primary text-white">
                          <h5 className="mb-0">
                            <i className="bi bi-calendar2-week me-2"></i>
                            Asistencia reciente
                          </h5>
                        </div>
                        <div className="card-body p-4">
                          {childAsistencias.length === 0 ? (
                            <div className="text-muted">No hay registros de asistencia.</div>
                          ) : (
                            <div className="list-group list-group-flush">
                              {childAsistencias.slice(0, 5).map((asistencia: any, index: number) => (
                                <div key={`${asistencia.id || index}`} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                                  <div>
                                    <div className="fw-semibold">{asistencia.curso_nombre || 'Curso'}</div>
                                    <small className="text-muted">{asistencia.fecha || 'Sin fecha'}</small>
                                  </div>
                                  <span className={`badge bg-${String(asistencia.estado).toUpperCase() === 'PRESENTE' ? 'success' : String(asistencia.estado).toUpperCase() === 'FALTA' ? 'danger' : 'secondary'}`}>
                                    {asistencia.estado || '—'}
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
                        <div className="card-header bg-info text-white">
                          <h5 className="mb-0">
                            <i className="bi bi-journal-text me-2"></i>
                            Últimas calificaciones
                          </h5>
                        </div>
                        <div className="card-body p-4">
                          {childCalificaciones.length === 0 ? (
                            <div className="text-muted">No hay calificaciones registradas.</div>
                          ) : (
                            <div className="list-group list-group-flush">
                              {childCalificaciones.slice(0, 5).map((cal: any, index: number) => (
                                <div key={`${cal.id || index}`} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                                  <div>
                                    <div className="fw-semibold">{cal.curso_nombre || 'Curso'}</div>
                                    <small className="text-muted">{cal.tipo_evaluacion || cal.periodo_academico || '—'}</small>
                                  </div>
                                  <span className={`badge bg-${(cal.puntuacion ?? cal.nota) >= 11 ? 'success' : 'danger'}`}>
                                    {cal.puntuacion ?? cal.nota}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {user.tipo_usuario === 'padre' && (
            <div className="mt-4 p-4 rounded-4 border bg-light-subtle">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <div>
                  <div className="small text-muted fw-semibold text-uppercase">Hijos vinculados</div>
                  <h3 className="h5 mb-0">
                    {alumnosRelacionados.length === 1
                      ? 'Resumen académico de tu hijo'
                      : 'Selecciona un hijo para ver su detalle'}
                  </h3>
                </div>
                <span className="badge bg-primary-subtle text-primary px-3 py-2">
                  {alumnosRelacionados.length} {alumnosRelacionados.length === 1 ? 'hijo' : 'hijos'}
                </span>
              </div>

              {loadingAlumno ? (
                <div className="py-4 text-center text-muted">
                  <div className="spinner-border spinner-border-sm me-2" role="status" />
                  Cargando datos de tus hijos...
                </div>
              ) : alumnosRelacionados.length === 0 ? (
                <div className="text-muted">No se encontraron estudiantes vinculados a tu cuenta.</div>
              ) : (
                <>
                  {/* Child selector pills (always shown when >1 child) */}
                  {alumnosRelacionados.length > 1 && (
                    <div className="nav nav-pills gap-2 mb-4 pb-3 border-bottom flex-wrap">
                      {alumnosRelacionados.map((alumno) => (
                        <button
                          key={alumno.id}
                          className={`nav-link ${selectedChildId === alumno.id ? 'active' : ''}`}
                          onClick={() => setSelectedChildId(alumno.id)}
                        >
                          <i className="bi bi-person me-1"></i>
                          {alumno.primer_nombre} {alumno.apellido_paterno}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected child — stats + detail */}
                  {selectedChild && (
                    <>
                      {/* Row: name + matricula + email */}
                      <div className="d-flex flex-wrap align-items-center gap-3 mb-3 pb-3 border-bottom">
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, fontSize: '1rem', fontWeight: 700 }}>
                            {(selectedChild.primer_nombre || '?')[0]}
                          </div>
                          <div>
                            <div className="fw-bold">{selectedChild.primer_nombre} {selectedChild.apellido_paterno}</div>
                            <small className="text-muted">{selectedChild.numero_matricula || 'Sin matrícula'}</small>
                          </div>
                        </div>
                        {selectedChild.email_contacto && (
                          <span className="text-muted small">
                            <i className="bi bi-envelope me-1"></i>{selectedChild.email_contacto}
                          </span>
                        )}
                      </div>

                      {/* 4 compact stat cards */}
                      <div className="row g-2 mb-4">
                        <div className="col-6 col-md-3">
                          <div className="bg-white rounded-3 border p-3 text-center h-100" style={{ borderLeft: '4px solid #3b82f6' }}>
                            <div className="text-muted small text-uppercase fw-semibold">Asistencias</div>
                            <div className="fs-3 fw-bold text-dark">{childAsistencias.length}</div>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="bg-white rounded-3 border p-3 text-center h-100" style={{ borderLeft: '4px solid #22c55e' }}>
                            <div className="text-muted small text-uppercase fw-semibold">Presentes</div>
                            <div className="fs-3 fw-bold text-success">{childAsistencias.filter((a: any) => String(a.estado).toUpperCase() === 'PRESENTE').length}</div>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="bg-white rounded-3 border p-3 text-center h-100" style={{ borderLeft: '4px solid #f59e0b' }}>
                            <div className="text-muted small text-uppercase fw-semibold">Faltas</div>
                            <div className="fs-3 fw-bold text-warning">{childAsistencias.filter((a: any) => String(a.estado).toUpperCase() === 'FALTA').length}</div>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="bg-white rounded-3 border p-3 text-center h-100" style={{ borderLeft: '4px solid #06b6d4' }}>
                            <div className="text-muted small text-uppercase fw-semibold">Pagos pendientes</div>
                            <div className="fs-3 fw-bold text-info">{childPagos.filter((p: any) => String(p.estado || p.estado_pago).toLowerCase() !== 'pagado').length}</div>
                          </div>
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-12 col-lg-6">
                          <div className="card dashboard-card h-100">
                            <div className="card-header bg-primary text-white">
                              <h5 className="mb-0">
                                <i className="bi bi-calendar2-week me-2"></i>
                                Asistencia reciente
                              </h5>
                            </div>
                            <div className="card-body p-4">
                              {childAsistencias.length === 0 ? (
                                <div className="text-muted">No hay registros de asistencia disponibles.</div>
                              ) : (
                                <div className="list-group list-group-flush">
                                  {childAsistencias.slice(0, 5).map((asistencia: any, index: number) => (
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
                            <div className="card-header bg-info text-white">
                              <h5 className="mb-0">
                                <i className="bi bi-journal-text me-2"></i>
                                Rendimiento y pagos
                              </h5>
                            </div>
                            <div className="card-body p-4">
                              <p className="mb-2">
                                <strong>Calificaciones cargadas:</strong> {childCalificaciones.length}
                              </p>
                              <p className="mb-2">
                                <strong>Pagos registrados:</strong> {childPagos.length}
                              </p>
                              <p className="mb-3">
                                <strong>Estado general:</strong> <span className="badge bg-success">Consulta en línea</span>
                              </p>

                              {childPagos.length > 0 && (
                                <div className="list-group list-group-flush">
                                  {childPagos.slice(0, 3).map((pago: any, index: number) => (
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
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Perfil;
