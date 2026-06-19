import React, { useEffect, useState } from 'react';
import { calificacionesService, alumnosService, cursosService } from '../api/services';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';
import { useSortableData } from '../utils/tableSort';

interface Calificacion {
  id?: string;
  alumno_id: string;
  curso_id: string;
  tipo_evaluacion: string;
  puntuacion: number;
  periodo_academico: string;
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
    tipo_evaluacion: 'parcial',
    puntuacion: 0,
    periodo_academico: `${new Date().getFullYear()}-1`
  });
  const { sortConfig, requestSort, sortedRows: calificacionesOrdenadas } = useSortableData(calificaciones, 'puntuacion');

  useEffect(() => {
    fetchCalificaciones();
    fetchRelacionados();
  }, []);

  const { user } = useAuth();
  const role = user?.tipo_usuario;
  const allowCreate = can(role, 'calificaciones', 'create');
  const allowEdit = can(role, 'calificaciones', 'edit');
  const allowDelete = can(role, 'calificaciones', 'delete');

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

  const normalizeCalificacion = (c: any) => ({
    ...c,
    puntuacion: c.puntuacion ?? c.nota,
    nota: c.puntuacion ?? c.nota,
    periodo_academico: c.periodo_academico ?? c.periodo,
  });

  const fetchCalificaciones = async () => {
    try {
      setLoading(true);
      const response = await calificacionesService.getAll();
      setCalificaciones((response.data?.datos || []).map(normalizeCalificacion));
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
      if (!allowEdit) return alert('No autorizado para editar calificaciones');
      setEditingId(calificacion.id || null);
      setFormData(calificacion as Calificacion);
    } else {
      if (!allowCreate) return alert('No autorizado para crear calificaciones');
      setEditingId(null);
      setFormData({
        alumno_id: '',
        curso_id: '',
        tipo_evaluacion: 'parcial',
        puntuacion: 0,
        periodo_academico: `${new Date().getFullYear()}-1`
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.alumno_id || !formData.curso_id || !formData.tipo_evaluacion || formData.puntuacion < 0 || formData.puntuacion > 20 || !formData.periodo_academico) {
      setError('Por favor completa los campos correctamente');
      return;
    }

    try {
      const payload = {
        alumno_id: formData.alumno_id,
        curso_id: formData.curso_id,
        nota: formData.puntuacion,
        periodo: formData.periodo_academico,
        observaciones: formData.observaciones,
      };

      if (editingId) {
        await calificacionesService.update(editingId, payload);
        setSuccess('Calificación actualizada correctamente');
      } else {
        await calificacionesService.create(payload);
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
    if (!window.confirm('¿Estás seguro de eliminar esta calificación?')) return;

    try {
      await calificacionesService.delete(id);
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
    const notas = calificaciones.map(c => c.puntuacion).filter((n): n is number => n != null);
    return {
      promedio: notas.length > 0 ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2) : '—',
      maxima: notas.length > 0 ? Math.max(...notas) : '—',
      minima: notas.length > 0 ? Math.min(...notas) : '—',
      total: calificaciones.length
    };
  };

  const stats = calculateStats();

  const getAlumnoNombre = (id: number) => {
    const alumno = alumnos.find(a => String(a.id) === String(id));
    return alumno ? `${alumno.primer_nombre} ${alumno.apellido_paterno}` : id;
  };

  const getCursoNombre = (id: number) => {
    const curso = cursos.find(c => String(c.id) === String(id));
    return curso ? `${curso.nombre} (${curso.codigo || curso.id})` : id;
  };

  return (
    <div className="screen-page page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="badge rounded-pill bg-light text-primary px-3 py-2">Gestión académica</span>
          <span className="badge rounded-pill bg-white text-dark px-3 py-2">Responsive</span>
        </div>
        <h1 className="page-hero-title">
          <i className="bi bi-graph-up me-2"></i>
          Gestión de Calificaciones
        </h1>
        <p className="page-hero-subtitle">Supervisa el rendimiento académico con una interfaz más limpia, consistente y adaptada a cualquier pantalla.</p>
      </div>

      {/* Statistics Cards */}
      <div className="row summary-grid g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="summary-mini-card border-info">
            <div className="summary-label">Promedio</div>
            <div className="summary-value text-info">{stats.promedio}</div>
            <div className="summary-note">Rendimiento general</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="summary-mini-card border-success">
            <div className="summary-label">Nota Máxima</div>
            <div className="summary-value text-success">{stats.maxima}</div>
            <div className="summary-note">Mejor desempeño</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="summary-mini-card border-danger">
            <div className="summary-label">Nota Mínima</div>
            <div className="summary-value text-danger">{stats.minima}</div>
            <div className="summary-note">Seguimiento de riesgo</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="summary-mini-card border-warning">
            <div className="summary-label">Total Registros</div>
            <div className="summary-value text-warning">{stats.total}</div>
            <div className="summary-note">Notas disponibles</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card table-shell">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Calificaciones</h5>
              {allowCreate && (
                <button 
                  className="btn btn-sm btn-light"
                  onClick={() => handleOpenModal()}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Registrar Calificación
                </button>
              )}
            </div>
          </div>
          <div className="card-body">
            <div className="row summary-grid g-3 mb-3">
              <div className="col-12 col-md-3">
                <div className="summary-mini-card">
                  <div className="summary-label">Calificaciones</div>
                  <div className="summary-value">{calificaciones.length}</div>
                  <div className="summary-note">Registros académicos</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="summary-mini-card">
                  <div className="summary-label">Alumnos</div>
                  <div className="summary-value">{alumnos.length}</div>
                  <div className="summary-note">Base disponible</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="summary-mini-card">
                  <div className="summary-label">Cursos</div>
                  <div className="summary-value">{cursos.length}</div>
                  <div className="summary-note">Secciones activas</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="summary-mini-card">
                  <div className="summary-label">Promedio</div>
                  <div className="summary-value">{stats.promedio}</div>
                  <div className="summary-note">Rendimiento global</div>
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
                      <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('puntuacion')}>
                        Nota {sortConfig.key === 'puntuacion' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('periodo_academico')}>
                        Período {sortConfig.key === 'periodo_academico' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
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
                        <td><code title={calificacion.id}>{calificacion.id.substring(0, 8)}…</code></td>
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
                          <strong className={calificacion.puntuacion >= 11 ? 'text-success' : 'text-danger'}>
                            {calificacion.puntuacion}
                          </strong>
                        </td>
                        <td>{calificacion.periodo_academico}</td>
                        <td>{calificacion.observaciones || 'Sin observaciones'}</td>
                        <td>
                          <span className={`badge bg-${
                            calificacion.puntuacion >= 15 ? 'success' :
                            calificacion.puntuacion >= 11 ? 'info' :
                            calificacion.puntuacion >= 6 ? 'warning' : 'danger'
                          }`}>
                            {calificacion.puntuacion >= 15 ? 'Excelente' :
                             calificacion.puntuacion >= 11 ? 'Aprobado' :
                             calificacion.puntuacion >= 6 ? 'En desarrollo' : 'Desaprobado'}
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
        error={error}
        success={success}
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
          </select>
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
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Tipo de evaluación *</label>
          <select
            className="form-select"
            value={formData.tipo_evaluacion}
            onChange={(e) => setFormData({ ...formData, tipo_evaluacion: e.target.value })}
          >
            <option value="parcial">Parcial</option>
            <option value="final">Final</option>
            <option value="extra">Extra</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Puntuación * (0-20)</label>
          <input
            type="number"
            className="form-control"
            value={formData.puntuacion}
            onChange={(e) => setFormData({ ...formData, puntuacion: parseFloat(e.target.value) })}
            min="0"
            max="20"
            step="0.5"
            placeholder="0-20"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Período académico *</label>
          <input
            type="text"
            className="form-control"
            value={formData.periodo_academico}
            onChange={(e) => setFormData({ ...formData, periodo_academico: e.target.value })}
            placeholder="2026-1"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Observaciones</label>
          <textarea
            className="form-control"
            value={formData.observaciones || ''}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Calificaciones;
