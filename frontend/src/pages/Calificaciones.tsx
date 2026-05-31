import React, { useEffect, useState } from 'react';
import { calificacionesService, alumnosService, cursosService } from '../api/services';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { can } from '../utils/permissions';
import { useSortableData } from '../utils/tableSort';
import { downloadPdfReport } from '../utils/downloads';

interface Calificacion {
  id?: string;
  alumno_id: string;
  curso_id: string;
  nota: number;
  periodo: string;
  observaciones?: string;
  alumno_nombre?: string;
  alumno_numero_matricula?: string;
  curso_nombre?: string;
  curso_codigo?: string;
}

const Calificaciones: React.FC = () => {
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);
  const [formData, setFormData] = useState<Calificacion>({
    alumno_id: '',
    curso_id: '',
    nota: 0,
    periodo: '1'
  });
  const { sortConfig, requestSort, sortedRows: calificacionesOrdenadas } = useSortableData(calificaciones, 'nota');

  useEffect(() => {
    fetchCalificaciones();
    fetchRelacionados();
  }, []);

  const { user } = useAuth();
  const { notify, confirm } = useToast();
  const role = user?.tipo_usuario;
  const allowCreate = can(role, 'calificaciones', 'create');
  const allowEdit = can(role, 'calificaciones', 'edit');
  const allowDelete = can(role, 'calificaciones', 'delete');
  const isPadre = role?.toLowerCase() === 'padre';
  const isFamilyView = ['padre', 'alumno'].includes(role?.toLowerCase() || '');

  const fetchRelacionados = async () => {
    try {
      const [alumnosResponse, cursosResponse] = await Promise.all([
        alumnosService.getAll(),
        cursosService.getAll()
      ]);
      setAlumnos(alumnosResponse.data?.datos || []);
      setCursos(cursosResponse.data?.datos || []);
    } catch (err) {
      console.error('Error cargando relaciones para calificaciones:', err);
    }
  };

  const fetchCalificaciones = async () => {
    try {
      setLoading(true);
      const response = await calificacionesService.getAll();
      setCalificaciones(response.data?.datos || []);
      setError('');
    } catch (err: any) {
      setError('Error al cargar calificaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (calificacion?: Calificacion) => {
    if (calificacion) {
      if (!allowEdit) {
        notify({ message: 'No autorizado para editar calificaciones', type: 'warning' });
        return;
      }
      setEditingId(calificacion.id || null);
      setFormData(calificacion as Calificacion);
    } else {
      if (!allowCreate) {
        notify({ message: 'No autorizado para crear calificaciones', type: 'warning' });
        return;
      }
      setEditingId(null);
      setFormData({
        alumno_id: '',
        curso_id: '',
        nota: 0,
        periodo: '1'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.alumno_id || !formData.curso_id || formData.nota < 0 || formData.nota > 20) {
      setError('Por favor completa los campos correctamente (nota entre 0 y 20)');
      return;
    }

    try {
      if (editingId) {
        await calificacionesService.update(editingId, formData);
        setSuccess('Calificación actualizada correctamente');
      } else {
        await calificacionesService.create(formData);
        setSuccess('Calificación registrada correctamente');
      }
      handleCloseModal();
      fetchCalificaciones();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Error al guardar calificación');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: '¿Estás seguro de eliminar esta calificación?' }))) return;

    try {
      if (calificacionesService.delete) {
        await calificacionesService.delete(id);
      }
      setSuccess('Calificación eliminada correctamente');
      fetchCalificaciones();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Error al eliminar calificación');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const calculateStats = () => {
    const notas = calificaciones.map(c => c.nota);
    return {
      promedio: notas.length > 0 ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2) : 0,
      maxima: notas.length > 0 ? Math.max(...notas) : 0,
      minima: notas.length > 0 ? Math.min(...notas) : 0,
      total: calificaciones.length
    };
  };

  const stats = calculateStats();
  const aprobadas = calificaciones.filter((c) => Number(c.nota) >= 11).length;
  const porcentajeAprobado = calificaciones.length ? Math.round((aprobadas / calificaciones.length) * 100) : 0;
  const alumnosRiesgo = new Set(
    calificaciones.filter((c) => Number(c.nota) < 11).map((c) => c.alumno_id || c.alumno_nombre)
  ).size;
  const promedioPorCurso = cursos.map((curso) => {
    const notasCurso = calificaciones.filter((c) => String(c.curso_id) === String(curso.id)).map((c) => Number(c.nota));
    const promedio = notasCurso.length ? notasCurso.reduce((sum, nota) => sum + nota, 0) / notasCurso.length : 0;
    return { curso, promedio, total: notasCurso.length };
  }).filter((item) => item.total > 0);

  const getAlumnoNombre = (id: string) => {
    const alumno = alumnos.find(a => String(a.id) === String(id));
    return alumno ? `${alumno.primer_nombre} ${alumno.apellido_paterno}` : id;
  };

  const getCursoNombre = (id: string) => {
    const curso = cursos.find(c => String(c.id) === String(id));
    return curso ? `${curso.nombre} (${curso.codigo || curso.id})` : id;
  };

  const handleDownloadCalificacionesPdf = () => {
    const fecha = new Date().toISOString().slice(0, 10);

    downloadPdfReport({
      title: isPadre ? 'Calificaciones de mis hijos' : 'Reporte de calificaciones',
      subtitle: isPadre
        ? 'Resumen académico de los estudiantes vinculados a tu cuenta.'
        : 'Resumen académico de estudiantes por curso y periodo.',
      filename: `${isPadre ? 'calificaciones-hijos' : 'calificaciones'}-${fecha}.pdf`,
      headers: ['Alumno', 'Matrícula', 'Curso', 'Nota', 'Periodo', 'Estado', 'Observaciones'],
      summary: [
        { label: 'Promedio', value: stats.promedio },
        { label: 'Nota máxima', value: stats.maxima },
        { label: 'Nota mínima', value: stats.minima },
        { label: 'Registros', value: stats.total },
      ],
      studentName: isPadre
        ? 'Estudiantes vinculados'
        : calificacionesOrdenadas[0]?.alumno_nombre || user?.nombre || 'Reporte general',
      observations: Number(stats.promedio) >= 15
        ? 'Rendimiento sobresaliente. Se recomienda mantener el ritmo de estudio y participacion.'
        : Number(stats.promedio) >= 11
          ? 'Rendimiento aprobatorio. Se recomienda reforzar los cursos con menor nota.'
          : 'Rendimiento en seguimiento. Se recomienda reunion con tutor y plan de recuperacion.',
      rows: calificacionesOrdenadas.map((calificacion) => {
        const estado =
          calificacion.nota >= 15 ? 'Excelente' :
          calificacion.nota >= 11 ? 'Aprobado' :
          calificacion.nota >= 6 ? 'En desarrollo' : 'Desaprobado';

        return {
          accent:
            calificacion.nota >= 15 ? 'success' :
            calificacion.nota >= 11 ? 'info' :
            calificacion.nota >= 6 ? 'warning' : 'danger',
          cells: [
            calificacion.alumno_nombre || getAlumnoNombre(calificacion.alumno_id),
            calificacion.alumno_numero_matricula || calificacion.alumno_id,
            `${calificacion.curso_nombre || getCursoNombre(calificacion.curso_id)} (${calificacion.curso_codigo || calificacion.curso_id})`,
            calificacion.nota,
            `P${calificacion.periodo}`,
            estado,
            calificacion.observaciones || 'Sin observaciones',
          ],
        };
      }),
    });
  };

  return (
    <div className="page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <h1 className="page-hero-title">
          <i className="bi bi-file-earmark-text me-2"></i>
          Gestión de Calificaciones
        </h1>
        <p className="page-hero-subtitle">Ingresa, edita y consulta las calificaciones de los estudiantes por períodos</p>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card dashboard-card h-100" style={{ borderLeft: '4px solid #0ea5e9' }}>
            <div className="card-body text-center py-4">
              <h6 className="text-muted small mb-1 fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Promedio</h6>
              <h2 className="text-info fw-bold mb-0">{stats.promedio}</h2>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card dashboard-card h-100" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="card-body text-center py-4">
              <h6 className="text-muted small mb-1 fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nota Máxima</h6>
              <h2 className="text-success fw-bold mb-0">{stats.maxima}</h2>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card dashboard-card h-100" style={{ borderLeft: '4px solid #ef4444' }}>
            <div className="card-body text-center py-4">
              <h6 className="text-muted small mb-1 fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nota Mínima</h6>
              <h2 className="text-danger fw-bold mb-0">{stats.minima}</h2>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card dashboard-card h-100" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="card-body text-center py-4">
              <h6 className="text-muted small mb-1 fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Registros</h6>
              <h2 className="text-warning fw-bold mb-0">{stats.total}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-4">
          <div className="performance-panel h-100">
            <div>
              <span>Porcentaje aprobado</span>
              <strong>{porcentajeAprobado}%</strong>
            </div>
            <div className="mini-progress">
              <span style={{ width: `${porcentajeAprobado}%` }}></span>
            </div>
            <small>{aprobadas} de {calificaciones.length} calificaciones aprobadas</small>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="performance-panel h-100">
            <div>
              <span>Alumnos en riesgo</span>
              <strong>{alumnosRiesgo}</strong>
            </div>
            <div className="mini-progress mini-progress-danger">
              <span style={{ width: `${Math.min(100, alumnosRiesgo * 20)}%` }}></span>
            </div>
            <small>Notas menores a 11 requieren seguimiento</small>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="performance-panel h-100">
            <div>
              <span>Mejor desempeno</span>
              <strong>{stats.maxima}</strong>
            </div>
            <div className="mini-progress mini-progress-success">
              <span style={{ width: `${Math.min(100, (Number(stats.maxima) / 20) * 100)}%` }}></span>
            </div>
            <small>Escala academica de 0 a 20</small>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card">
          <div className="card-header" style={{ background: 'rgba(102, 126, 234, 0.05)', borderBottom: '1px solid rgba(102, 126, 234, 0.1)', padding: '16px 20px' }}>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Listado de Calificaciones</h5>
              <div className="d-flex flex-wrap gap-2 justify-content-end">
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={handleDownloadCalificacionesPdf}
                disabled={calificaciones.length === 0}
                title={isPadre ? 'Descargar PDF de calificaciones de mis hijos' : 'Descargar PDF de calificaciones'}
              >
                <i className="bi bi-download"></i>
                {isPadre ? 'PDF de mis hijos' : 'Descargar PDF'}
              </button>
              {allowCreate && (
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => handleOpenModal()}
                >
                  <i className="bi bi-plus-circle"></i>
                  Registrar Calificación
                </button>
              )}
              </div>
            </div>
          </div>
          <div className="card-body">
            {isFamilyView && calificaciones.length > 0 && (
              <div className="row g-3 mb-4">
                {calificacionesOrdenadas.slice(0, 6).map((calificacion) => {
                  const progress = Math.max(0, Math.min(100, (Number(calificacion.nota) / 20) * 100));
                  return (
                    <div className="col-12 col-md-6 col-xl-4" key={`grade-card-${calificacion.id}`}>
                      <div className="grade-card h-100">
                        <div className="d-flex justify-content-between gap-3">
                          <div>
                            <span className="text-muted small fw-bold text-uppercase">{calificacion.curso_codigo || 'Curso'}</span>
                            <h6>{calificacion.curso_nombre || getCursoNombre(calificacion.curso_id)}</h6>
                            <p>{calificacion.alumno_nombre || getAlumnoNombre(calificacion.alumno_id)}</p>
                          </div>
                          <strong className={calificacion.nota >= 11 ? 'text-success' : 'text-danger'}>{calificacion.nota}</strong>
                        </div>
                        <div className={`mini-progress ${calificacion.nota >= 11 ? 'mini-progress-success' : 'mini-progress-danger'}`}>
                          <span style={{ width: `${progress}%` }}></span>
                        </div>
                        <small>{calificacion.observaciones || 'Sin observaciones'}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {promedioPorCurso.length > 0 && (
              <div className="course-performance mb-4">
                {promedioPorCurso.slice(0, 5).map((item) => (
                  <div key={`course-avg-${item.curso.id}`}>
                    <span>{item.curso.nombre}</span>
                    <div className="mini-progress">
                      <span style={{ width: `${Math.min(100, (item.promedio / 20) * 100)}%` }}></span>
                    </div>
                    <strong>{item.promedio.toFixed(1)}</strong>
                  </div>
                ))}
              </div>
            )}
            <div className="row g-3 mb-3">
              <div className="col-md-3">
                <div className="p-3 bg-light rounded border">
                  <div className="text-muted small">Calificaciones</div>
                  <div className="fs-4 fw-bold">{calificaciones.length}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 bg-light rounded border">
                  <div className="text-muted small">Alumnos</div>
                  <div className="fs-4 fw-bold">{alumnos.length}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 bg-light rounded border">
                  <div className="text-muted small">Cursos</div>
                  <div className="fs-4 fw-bold">{cursos.length}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 bg-light rounded border">
                  <div className="text-muted small">Promedio</div>
                  <div className="fs-4 fw-bold">{stats.promedio}</div>
                </div>
              </div>
            </div>
            <div className="table-responsive">
              {calificaciones.length === 0 ? (
                <div className="alert alert-info">No hay calificaciones registradas</div>
              ) : (
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('id')}>
                        ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('alumno_nombre')}>
                        Alumno {sortConfig.key === 'alumno_nombre' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('curso_nombre')}>
                        Curso {sortConfig.key === 'curso_nombre' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('nota')}>
                        Nota {sortConfig.key === 'nota' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('periodo')}>
                        Período {sortConfig.key === 'periodo' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('observaciones')}>
                        Observaciones {sortConfig.key === 'observaciones' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calificacionesOrdenadas.map((calificacion) => (
                      <tr key={calificacion.id}>
                        <td>{calificacion.id}</td>
                        <td>
                          <div className="fw-semibold">
                            {calificacion.alumno_nombre || getAlumnoNombre(calificacion.alumno_id)}
                          </div>
                          <small className="text-muted">
                            {calificacion.alumno_numero_matricula || calificacion.alumno_id}
                          </small>
                        </td>
                        <td>
                          <div className="fw-semibold">
                            {calificacion.curso_nombre || getCursoNombre(calificacion.curso_id)}
                          </div>
                          <small className="text-muted">
                            {calificacion.curso_codigo || calificacion.curso_id}
                          </small>
                        </td>
                        <td>
                          <strong className={calificacion.nota >= 11 ? 'text-success' : 'text-danger'}>
                            {calificacion.nota}
                          </strong>
                        </td>
                        <td>P{calificacion.periodo}</td>
                        <td>{calificacion.observaciones || 'Sin observaciones'}</td>
                        <td>
                          <span className={`badge bg-${
                            calificacion.nota >= 15 ? 'success' :
                            calificacion.nota >= 11 ? 'info' :
                            calificacion.nota >= 6 ? 'warning' : 'danger'
                          }`}>
                            {calificacion.nota >= 15 ? 'Excelente' :
                             calificacion.nota >= 11 ? 'Aprobado' :
                             calificacion.nota >= 6 ? 'En desarrollo' : 'Desaprobado'}
                          </span>
                        </td>
                        <td>
                          {allowEdit && (
                            <button 
                              className="btn btn-sm btn-primary me-2"
                              onClick={() => handleOpenModal(calificacion)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                          {allowDelete && (
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(calificacion.id!)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        show={showModal}
        title={editingId ? 'Editar Calificación' : 'Registrar Calificación'}
        onClose={handleCloseModal}
        onSave={handleSave}
      >
        <div className="mb-3">
          <label className="form-label">Alumno *</label>
          <select
            className="form-select"
            value={formData.alumno_id}
            onChange={(e) => setFormData({ ...formData, alumno_id: e.target.value })}
          >
            <option value="">Seleccionar alumno</option>
            {alumnos.map(a => (
              <option key={a.id} value={a.id}>{a.primer_nombre} {a.apellido_paterno} ({a.numero_matricula})</option>
            ))}
            <option value="__other">Otro (manual)</option>
          </select>
          {formData.alumno_id === '__other' && (
            <input
              className="form-control mt-2"
              placeholder="Ingrese nombre o ID manualmente"
              value={formData.observaciones || ''}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            />
          )}
        </div>
        <div className="mb-3">
          <label className="form-label">Curso *</label>
          <select
            className="form-select"
            value={formData.curso_id}
            onChange={(e) => setFormData({ ...formData, curso_id: e.target.value })}
          >
            <option value="">Seleccionar curso</option>
            {cursos.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} ({c.codigo})</option>
            ))}
            <option value="__other">Otro (manual)</option>
          </select>
          {formData.curso_id === '__other' && (
            <input
              className="form-control mt-2"
              placeholder="Ingrese nombre o ID manualmente"
              value={formData.observaciones || ''}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            />
          )}
        </div>
        <div className="mb-3">
          <label className="form-label">Nota * (0-20)</label>
          <input
            type="number"
            className="form-control"
            value={formData.nota}
            onChange={(e) => setFormData({ ...formData, nota: parseFloat(e.target.value) })}
            min="0"
            max="20"
            step="0.5"
            placeholder="0-20"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Período *</label>
          <select
            className="form-control"
            value={formData.periodo}
            onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
          >
            <option value="1">Período 1</option>
            <option value="2">Período 2</option>
            <option value="3">Período 3</option>
            <option value="4">Período 4</option>
          </select>
        </div>
      </Modal>
    </div>
  );
};

export default Calificaciones;
