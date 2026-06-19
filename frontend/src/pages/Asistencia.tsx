import React, { useEffect, useState } from 'react';
import { asistenciaService, alumnosService, cursosService } from '../api/services';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';
import { useSortableData } from '../utils/tableSort';

interface AsistenciaRecord {
  id?: string;
  alumno_id: string;
  curso_id?: string;
  fecha: string;
  estado: string;
  observacion?: string;
  registrada?: boolean;
  motivo_falta?: string | null;
  alumno_nombre?: string;
  alumno_numero_matricula?: string;
  curso_nombre?: string;
  curso_codigo?: string;
}

const toLocalDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
};

const Asistencia: React.FC = () => {
  const [asistencias, setAsistencias] = useState<AsistenciaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);
  const [formData, setFormData] = useState<AsistenciaRecord>({
    alumno_id: '',
    curso_id: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'PRESENTE',
    observacion: ''
  });
  const { sortConfig, requestSort, sortedRows: asistenciasOrdenadas } = useSortableData(asistencias, 'fecha');

  useEffect(() => {
    fetchAsistencias();
    fetchRelacionados();
  }, []);

  const { user } = useAuth();
  const role = user?.tipo_usuario;
  const allowCreate = can(role, 'asistencia', 'create');
  const allowEdit = can(role, 'asistencia', 'edit');
  const allowDelete = can(role, 'asistencia', 'delete');

  const fetchRelacionados = async () => {
    try {
      const [alumnosResponse, cursosResponse] = await Promise.all([
        alumnosService.getAll(),
        cursosService.getAll()
      ]);
      setAlumnos(alumnosResponse.data?.datos || []);
      setCursos(cursosResponse.data?.datos || []);
    } catch (err) {
      console.error('Error cargando relaciones para asistencia:', err);
    }
  };

  const fetchAsistencias = async () => {
    try {
      setLoading(true);
      const response = await asistenciaService.getAll();
      setAsistencias(response.data?.datos || []);
      setError('');
    } catch (err: any) {
      setError('Error al cargar asistencias');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (asistencia?: AsistenciaRecord) => {
    if (asistencia) {
      if (!allowEdit) return alert('No autorizado para editar asistencia');
      setEditingId(asistencia.id || null);
      setFormData({ ...asistencia, fecha: toLocalDate(asistencia.fecha) } as AsistenciaRecord);
    } else {
      if (!allowCreate) return alert('No autorizado para crear asistencia');
      setEditingId(null);
      setFormData({
        alumno_id: '',
        curso_id: '',
        fecha: new Date().toISOString().split('T')[0],
        estado: 'PRESENTE',
        observacion: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.alumno_id || !formData.curso_id) {
      setError('Por favor selecciona alumno y curso');
      return;
    }

    const estadoNormalizado = String(formData.estado || '').toUpperCase();
    const payload = {
      ...formData,
      estado: estadoNormalizado,
      registrada: true,
      motivo_falta: formData.observacion || null,
    };

    try {
      if (editingId) {
        await asistenciaService.update(editingId, payload);
        setSuccess('Asistencia actualizada correctamente');
      } else {
        await asistenciaService.create(payload);
        setSuccess('Asistencia registrada correctamente');
      }
      handleCloseModal();
      fetchAsistencias();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Error al guardar asistencia');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      await asistenciaService.delete(id);
      setSuccess('Asistencia eliminada correctamente');
      fetchAsistencias();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Error al eliminar asistencia');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const calculateStats = () => {
    const normalizedState = (estado: string) => estado.toLowerCase();

    return {
      presentes: asistencias.filter(a => normalizedState(a.estado) === 'presente').length,
      ausentes: asistencias.filter(a => normalizedState(a.estado) === 'ausente' || normalizedState(a.estado) === 'falta').length,
      tardanzas: asistencias.filter(a => normalizedState(a.estado) === 'tardanza').length,
      total: asistencias.length
    };
  };

  const getEstadoClass = (estado: string) => {
    const normalized = estado.toLowerCase();
    if (normalized === 'presente') return 'success';
    if (normalized === 'ausente' || normalized === 'falta') return 'danger';
    return 'warning';
  };

  const getAlumnoNombre = (id: number) => {
    const alumno = alumnos.find(a => String(a.id) === String(id));
    return alumno ? `${alumno.primer_nombre} ${alumno.apellido_paterno}` : id;
  };

  const getCursoNombre = (id?: number) => {
    if (!id) return '-';
    const curso = cursos.find(c => String(c.id) === String(id));
    return curso ? `${curso.nombre} (${curso.codigo || curso.id})` : id;
  };

  const estadoOptions = [
    { label: 'Presente', value: 'PRESENTE' },
    { label: 'Falta', value: 'FALTA' },
    { label: 'Justificado', value: 'JUSTIFICADO' }
  ];

  const stats = calculateStats();

  return (
    <div className="screen-page page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="badge rounded-pill bg-light text-primary px-3 py-2">Gestión académica</span>
          <span className="badge rounded-pill bg-white text-dark px-3 py-2">Responsive</span>
        </div>
        <h1 className="page-hero-title">
          <i className="bi bi-clipboard-check me-2"></i>
          Control de Asistencia
        </h1>
        <p className="page-hero-subtitle">Visualiza y registra asistencia con una interfaz más legible, moderna y optimizada para pantallas pequeñas.</p>
      </div>

      {/* Statistics Cards */}
      <div className="row summary-grid g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="summary-mini-card border-success">
            <div className="summary-label">Presentes</div>
            <div className="summary-value text-success">{stats.presentes}</div>
            <div className="summary-note">Asistencias marcadas</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="summary-mini-card border-danger">
            <div className="summary-label">Ausentes</div>
            <div className="summary-value text-danger">{stats.ausentes}</div>
            <div className="summary-note">Faltas registradas</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="summary-mini-card border-warning">
            <div className="summary-label">Tardanzas</div>
            <div className="summary-value text-warning">{stats.tardanzas}</div>
            <div className="summary-note">Ingresos tardíos</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="summary-mini-card border-info">
            <div className="summary-label">Total</div>
            <div className="summary-value text-info">{stats.total}</div>
            <div className="summary-note">Registros en el periodo</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card table-shell">
          <div className="card-header bg-success text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Asistencias</h5>
              {allowCreate && (
                <button 
                  className="btn btn-sm btn-light"
                  onClick={() => handleOpenModal()}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Registrar Asistencia
                </button>
              )}
            </div>
          </div>
          <div className="card-body">
            <div className="row summary-grid g-3 mb-3">
              <div className="col-12 col-md-3">
                <div className="summary-mini-card">
                  <div className="summary-label">Registros</div>
                  <div className="summary-value">{asistencias.length}</div>
                  <div className="summary-note">Total de asistencias</div>
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
                  <div className="summary-label">Presentes</div>
                  <div className="summary-value">{stats.presentes}</div>
                  <div className="summary-note">Estado favorable</div>
                </div>
              </div>
            </div>
            <div className="table-responsive">
              {asistencias.length === 0 ? (
                <div className="alert alert-info">No hay registros de asistencia</div>
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
                      <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('fecha')}>
                        Fecha {sortConfig.key === 'fecha' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('estado')}>
                        Estado {sortConfig.key === 'estado' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('motivo_falta')}>
                        Motivo {sortConfig.key === 'motivo_falta' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('registrada')}>
                        Registrada {sortConfig.key === 'registrada' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asistenciasOrdenadas.map((asistencia) => (
                      <tr key={asistencia.id}>
                        <td><code title={asistencia.id}>{asistencia.id.substring(0, 8)}…</code></td>
                        <td>
                          <div className="fw-semibold">
                            {asistencia.alumno_nombre || getAlumnoNombre(asistencia.alumno_id)}
                          </div>
                          <small className="text-muted">
                            {asistencia.alumno_numero_matricula || asistencia.alumno_id}
                          </small>
                        </td>
                        <td>
                          <div className="fw-semibold">
                            {asistencia.curso_nombre || getCursoNombre(asistencia.curso_id)}
                          </div>
                          <small className="text-muted">
                            {asistencia.curso_codigo || asistencia.curso_id || '-'}
                          </small>
                        </td>
                        <td>{new Date(asistencia.fecha).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge bg-${
                            getEstadoClass(asistencia.estado)
                          }`}>
                            {asistencia.estado}
                          </span>
                        </td>
                        <td>{asistencia.motivo_falta || asistencia.observacion || '-'}</td>
                        <td>{asistencia.registrada ? 'Sí' : 'No'}</td>
                        <td>
                          {allowEdit && (
                            <button 
                              className="btn btn-sm btn-primary me-2"
                              onClick={() => handleOpenModal(asistencia)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                          {allowDelete && (
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(asistencia.id!)}
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
        title={editingId ? 'Editar Asistencia' : 'Registrar Asistencia'}
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
            {cursos.map(curso => (
              <option key={curso.id} value={curso.id}>{curso.nombre} ({curso.grado} · {curso.seccion})</option>
            ))}
          </select>
          </div>
        <div className="mb-3">
          <label className="form-label">Fecha</label>
          <input
            type="date"
            className="form-control"
            value={formData.fecha}
            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Estado *</label>
          <select
            className="form-control"
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
          >
            {estadoOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Observación</label>
          <textarea
            className="form-control"
            value={formData.observacion}
            onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
            placeholder="Notas adicionales"
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Asistencia;
