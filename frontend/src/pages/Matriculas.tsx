import React, { useEffect, useState } from 'react';
import { matriculasService, alumnosService, cursosService } from '../api/services';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';
import { useSortableData } from '../utils/tableSort';

interface Matricula {
  id?: string;
  alumno_id?: string;
  curso_id?: string;
  periodo_academico?: string;
  fecha_matricula?: string;
  estado?: string;
  observaciones?: string;
}

const Matriculas: React.FC = () => {
  const [matriculas, setMatriculas] = useState<any[]>([]);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Matricula>({
    alumno_id: '',
    curso_id: '',
    periodo_academico: `${new Date().getFullYear()}-1`,
    fecha_matricula: new Date().toISOString().split('T')[0],
    estado: 'activa'
  });
  const { sortConfig, requestSort, sortedRows: matriculasOrdenadas } = useSortableData(matriculas, 'fecha_matricula');

  useEffect(() => {
    fetchData();
  }, []);

  const { user } = useAuth();
  const role = user?.tipo_usuario;
  const allowCreate = can(role, 'matriculas', 'create');
  const allowEdit = can(role, 'matriculas', 'edit');
  const allowDelete = can(role, 'matriculas', 'delete');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matResponse, almResponse, curResponse] = await Promise.all([
        matriculasService.getAll(),
        alumnosService.getAll(),
        cursosService.getAll()
      ]);
      setMatriculas(matResponse.data?.datos || []);
      setAlumnos(almResponse.data?.datos || []);
      setCursos(curResponse.data?.datos || []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOpenModal = (matricula?: any) => {
    if (matricula) {
      if (!allowEdit) return alert('No autorizado para editar matrícula');
      setEditingId(matricula.id);
      setFormData({
        id: matricula.id,
        alumno_id: matricula.alumno_id,
        curso_id: matricula.curso_id,
        periodo_academico: matricula.periodo_academico || `${new Date().getFullYear()}-1`,
        fecha_matricula: matricula.fecha_matricula,
        estado: matricula.estado || 'activa',
        observaciones: matricula.observaciones || ''
      });
    } else {
      if (!allowCreate) return alert('No autorizado para crear matrícula');
      setEditingId(null);
      setFormData({
        alumno_id: '',
        curso_id: '',
        periodo_academico: `${new Date().getFullYear()}-1`,
        fecha_matricula: new Date().toISOString().split('T')[0],
        estado: 'activa',
        observaciones: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.alumno_id || !formData.curso_id || !formData.periodo_academico) {
      setError('Por favor selecciona alumno, curso y periodo académico');
      return;
    }

    try {
      setError('');
      const payload = {
        alumno_id: formData.alumno_id,
        curso_id: formData.curso_id,
        periodo_academico: formData.periodo_academico,
        fecha_matricula: formData.fecha_matricula,
        estado: formData.estado,
        observaciones: formData.observaciones
      };

      if (editingId) {
        await matriculasService.update(editingId, payload);
        setSuccess('Matrícula actualizada correctamente');
      } else {
        await matriculasService.create(payload);
        setSuccess('Matrícula registrada correctamente');
      }
      handleCloseModal();
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.mensaje || 'Error al guardar matrícula');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta matrícula?')) return;

    try {
      await matriculasService.delete(id);
      setSuccess('Matrícula eliminada correctamente');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.response?.data?.mensaje || 'Error al eliminar matrícula');
    }
  };

  const getAlumnoNombre = (id: string) => {
    const alumno = alumnos.find(a => a.id === id);
    return alumno ? `${alumno.primer_nombre} ${alumno.apellido_paterno}` : id;
  };

  const getCursoNombre = (id: string) => {
    const curso = cursos.find(c => c.id === id);
    return curso ? `${curso.nombre} (${curso.codigo || curso.id})` : id;
  };

  const getEstadoBadge = (estado?: string) => {
    if (estado === 'activa') return 'success';
    if (estado === 'suspendida') return 'warning';
    return 'danger';
  };

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">
        <i className="bi bi-clipboard-check me-2"></i>
        Gestión de Matrículas
      </h1>

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

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card">
          <div className="card-header bg-info text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Matrículas ({matriculas.length})</h5>
              {allowCreate && (
                <button className="btn btn-sm btn-light" onClick={() => handleOpenModal()}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Nueva Matrícula
                </button>
              )}
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <div className="p-3 bg-light rounded border">
                  <div className="text-muted small">Matrículas</div>
                  <div className="fs-4 fw-bold">{matriculas.length}</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded border">
                  <div className="text-muted small">Alumnos cargados</div>
                  <div className="fs-4 fw-bold">{alumnos.length}</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded border">
                  <div className="text-muted small">Cursos cargados</div>
                  <div className="fs-4 fw-bold">{cursos.length}</div>
                </div>
              </div>
            </div>
            <div className="table-responsive">
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
                      Sección académica {sortConfig.key === 'curso_nombre' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('periodo_academico')}>
                      Periodo académico {sortConfig.key === 'periodo_academico' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('fecha_matricula')}>
                      Fecha {sortConfig.key === 'fecha_matricula' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('observaciones')}>
                      Observaciones {sortConfig.key === 'observaciones' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('estado')}>
                      Estado {sortConfig.key === 'estado' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {matriculasOrdenadas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-muted">
                        No hay matrículas registradas
                      </td>
                    </tr>
                  ) : (
                    matriculasOrdenadas.map((matricula) => (
                      <tr key={matricula.id}>
                        <td><small className="text-muted">{matricula.id}</small></td>
                        <td>
                          <div className="fw-semibold">
                            {matricula.alumno_nombre || getAlumnoNombre(matricula.alumno_id)}
                          </div>
                          <small className="text-muted">
                            {matricula.alumno_numero_matricula || matricula.alumno_id}
                          </small>
                        </td>
                        <td>
                          <div className="fw-semibold">
                            {matricula.curso_nombre || getCursoNombre(matricula.curso_id)}
                          </div>
                          <small className="text-muted">
                            {matricula.curso_grado || '-'}{matricula.curso_seccion ? ` · ${matricula.curso_seccion}` : ''}
                          </small>
                        </td>
                        <td>{matricula.periodo_academico || '-'}</td>
                        <td>{matricula.fecha_matricula || '-'}</td>
                        <td>{matricula.observaciones || 'Matrícula inicial'}</td>
                        <td>
                          <span className={`badge bg-${getEstadoBadge(matricula.estado)}`}>
                            {matricula.estado}
                          </span>
                        </td>
                        <td>
                          {allowEdit && (
                            <button className="btn btn-sm btn-primary me-2" onClick={() => handleOpenModal(matricula)} title="Editar">
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                          {allowDelete && (
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(matricula.id)} title="Eliminar">
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal
        show={showModal}
        title={editingId ? 'Editar Matrícula' : 'Nueva Matrícula'}
        onClose={handleCloseModal}
        onSave={handleSave}
        saveButtonText={editingId ? 'Actualizar' : 'Registrar'}
      >
        <form>
          <div className="mb-3">
            <label htmlFor="alumno_id" className="form-label">
              Alumno *
            </label>
            <select
              className="form-select"
              id="alumno_id"
              name="alumno_id"
              value={formData.alumno_id}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccionar alumno</option>
              {alumnos.map((alumno) => (
                <option key={alumno.id} value={alumno.id}>
                  {alumno.primer_nombre} {alumno.apellido_paterno} ({alumno.numero_matricula})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="curso_id" className="form-label">
              Sección académica *
            </label>
            <select
              className="form-select"
              id="curso_id"
              name="curso_id"
              value={formData.curso_id}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccionar curso</option>
              {cursos.map((curso) => (
                <option key={curso.id} value={curso.id}>
                  {curso.nombre} ({curso.grado} · {curso.seccion})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="periodo_academico" className="form-label">
              Periodo académico *
            </label>
            <input
              type="text"
              className="form-control"
              id="periodo_academico"
              name="periodo_academico"
              value={formData.periodo_academico}
              onChange={handleInputChange}
              placeholder="2026-1"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="fecha_matricula" className="form-label">
              Fecha de Matrícula
            </label>
            <input
              type="date"
              className="form-control"
              id="fecha_matricula"
              name="fecha_matricula"
              value={formData.fecha_matricula}
              onChange={handleInputChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="estado" className="form-label">
              Estado
            </label>
            <select
              className="form-select"
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleInputChange}
            >
              <option value="activa">Activa</option>
              <option value="cancelada">Cancelada</option>
              <option value="suspendida">Suspendida</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Matriculas;
