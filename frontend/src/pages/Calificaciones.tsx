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
      if (!allowEdit) return alert('No autorizado para editar calificaciones');
      setEditingId(calificacion.id || null);
      setFormData(calificacion as Calificacion);
    } else {
      if (!allowCreate) return alert('No autorizado para crear calificaciones');
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

  const handleDelete = async (id: number) => {
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
    const notas = calificaciones.map(c => c.nota);
    return {
      promedio: notas.length > 0 ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2) : 0,
      maxima: notas.length > 0 ? Math.max(...notas) : 0,
      minima: notas.length > 0 ? Math.min(...notas) : 0,
      total: calificaciones.length
    };
  };

  const stats = calculateStats();

  const getAlumnoNombre = (id: number) => {
    const alumno = alumnos.find(a => Number(a.id) === Number(id));
    return alumno ? `${alumno.primer_nombre} ${alumno.apellido_paterno}` : id;
  };

  const getCursoNombre = (id: number) => {
    const curso = cursos.find(c => Number(c.id) === Number(id));
    return curso ? `${curso.nombre} (${curso.codigo || curso.id})` : id;
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

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card">
          <div className="card-header" style={{ background: 'rgba(102, 126, 234, 0.05)', borderBottom: '1px solid rgba(102, 126, 234, 0.1)', padding: '16px 20px' }}>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-dark">Listado de Calificaciones</h5>
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
          <div className="card-body">
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
