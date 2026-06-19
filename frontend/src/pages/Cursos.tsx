import React, { useEffect, useState } from 'react';
import { cursosService, profesoresService } from '../api/services';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';
import { useSortableData } from '../utils/tableSort';
import { generateStructuredCode } from '../utils/codeGenerators';
import { validarCurso } from '../utils/validators';

interface Curso {
  id?: string;
  nombre: string;
  codigo?: string;
  grado_nivel?: string;
  capacidad_maxima?: number;
  profesor_id?: string;
  seccion?: string;
  aula_asignada?: string;
  periodo_academico?: string;
}

const Cursos: React.FC = () => {
  const [cursos, setCursos] = useState<any[]>([]);
  const [profesores, setProfesores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Curso>({
    nombre: '',
    codigo: '',
    grado_nivel: '',
    capacidad_maxima: 40,
    profesor_id: '',
    seccion: 'A',
    aula_asignada: '',
    periodo_academico: `${new Date().getFullYear()}-1`,
  });
  const { sortConfig, requestSort, sortedRows: cursosOrdenados } = useSortableData(cursos, 'nombre');

  useEffect(() => {
    fetchCursos();
    fetchProfesores();
  }, []);

  const fetchCursos = async () => {
    try {
      const response = await cursosService.getAll();
      setCursos(response.data?.datos || []);
    } catch (err: any) {
      setError('Error al cargar cursos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const { user } = useAuth();
  const role = user?.tipo_usuario;
  const allowCreate = can(role, 'cursos', 'create');
  const allowEdit = can(role, 'cursos', 'edit');
  const allowDelete = can(role, 'cursos', 'delete');

  const fetchProfesores = async () => {
    try {
      const response = await profesoresService.getAll();
      setProfesores(response.data?.datos || []);
    } catch (err) {
      console.error('Error cargando profesores para cursos:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      return { ...prev, [name]: name === 'capacidad_maxima' ? parseInt(value) : value } as any;
    });
  };

  const handleOpenModal = (curso?: any) => {
    if (curso) {
      setFormData(curso);
      setEditingId(curso.id);
    } else {
      setFormData({
        nombre: '',
        codigo: '',
        grado_nivel: '',
        capacidad_maxima: 40,
        profesor_id: profesores[0]?.id || '',
        seccion: 'A',
        aula_asignada: '',
        periodo_academico: `${new Date().getFullYear()}-1`,
      });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      nombre: '',
      codigo: '',
      grado_nivel: '',
      capacidad_maxima: 40,
      profesor_id: profesores[0]?.id || '',
      seccion: 'A',
      aula_asignada: '',
      periodo_academico: `${new Date().getFullYear()}-1`,
    });
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      setError('');
      if (!formData.nombre || !formData.codigo || !formData.grado_nivel || !formData.profesor_id || !formData.periodo_academico) {
        setError('Completa nombre, código, grado/nivel, profesor y período académico');
        return;
      }
      const errores = validarCurso(formData);
      if (errores.length > 0) {
        setError(errores.join('. '));
        return;
      }

      const payload = {
        nombre: formData.nombre,
        codigo: formData.codigo,
        descripcion: '',
        grado_nivel: formData.grado_nivel,
        capacidad_maxima: formData.capacidad_maxima,
        profesor_id: formData.profesor_id,
        seccion: formData.seccion,
        aula_asignada: formData.aula_asignada,
        periodo_academico: formData.periodo_academico,
      };

      if (editingId) {
        await cursosService.update(editingId, payload);
        setSuccess('Curso actualizado correctamente');
      } else {
        await cursosService.create(payload);
        setSuccess('Curso creado correctamente');
      }
      handleCloseModal();
      fetchCursos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al guardar curso');
    }
  };

  const handleAutoGenerateCodigo = () => {
    const codigoGenerado = generateStructuredCode({
      prefix: 'CUR',
      rows: cursos,
      field: 'codigo',
      padding: 4,
      year: new Date().getFullYear(),
    });

    setFormData((prev) => ({
      ...prev,
      codigo: codigoGenerado,
    }));
    setSuccess('Código generado automáticamente');
    setTimeout(() => setSuccess(''), 2500);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este curso?')) {
      try {
        await cursosService.delete(id);
        setSuccess('Curso eliminado correctamente');
        setCursos(cursos.filter(c => c.id !== id));
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.response?.data?.mensaje || 'Error al eliminar curso');
      }
    }
  };

  return (
    <div className="screen-page page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="badge rounded-pill bg-light text-primary px-3 py-2">Gestión académica</span>
          <span className="badge rounded-pill bg-white text-dark px-3 py-2">Responsive</span>
        </div>
        <h1 className="page-hero-title">
          <i className="bi bi-book me-2"></i>
          Gestión de Cursos
        </h1>
        <p className="page-hero-subtitle">Centraliza secciones, grados y profesores en una interfaz más ordenada y fácil de navegar en cualquier dispositivo.</p>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card table-shell">
          <div className="card-header bg-success text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Cursos ({cursos.length})</h5>
              {allowCreate && (
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => handleOpenModal()}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Nuevo Curso
                </button>
              )}
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('id')}>
                      ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('nombre')}>
                      Nombre {sortConfig.key === 'nombre' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('codigo')}>
                      Código {sortConfig.key === 'codigo' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('grado_nivel')}>
                      Grado {sortConfig.key === 'grado_nivel' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('profesor_nombre')}>
                      Profesor {sortConfig.key === 'profesor_nombre' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('capacidad')}>
                      Capacidad {sortConfig.key === 'capacidad' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cursosOrdenados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        No hay cursos registrados
                      </td>
                    </tr>
                  ) : (
                    cursosOrdenados.map((curso) => (
                      <tr key={curso.id}>
                        <td>
                          <code className="text-muted" title={curso.id}>{curso.id.substring(0, 8)}…</code>
                        </td>
                        <td>{curso.nombre}</td>
                        <td>
                          <span className="badge bg-info">{curso.codigo}</span>
                        </td>
                        <td>{curso.grado_nivel || '-'}</td>
                        <td>
                          <div className="fw-semibold">{curso.profesor_nombre || '-'}</div>
                          <small className="text-muted">{curso.profesor_numero_documento || ''}</small>
                        </td>
                        <td>
                          <span className="badge bg-secondary">
                            {curso.capacidad_maxima}
                          </span>
                        </td>
                        <td>
                          {allowEdit && (
                            <button
                              className="btn btn-sm btn-primary me-2"
                              onClick={() => handleOpenModal(curso)}
                              title="Editar"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                          {allowDelete && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(curso.id)}
                              title="Eliminar"
                            >
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
        title={editingId ? 'Editar Curso' : 'Nuevo Curso'}
        onClose={handleCloseModal}
        onSave={handleSave}
        saveButtonText={editingId ? 'Actualizar' : 'Crear'}
        error={error}
        success={success}
      >
        <form>
          <div className="mb-3">
            <label htmlFor="nombre" className="form-label">
              Nombre del Curso *
            </label>
            <input
              type="text"
              className="form-control"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="codigo" className="form-label">
              Código
            </label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                id="codigo"
                name="codigo"
                value={formData.codigo}
                onChange={handleInputChange}
                placeholder="CUR-2026-0001"
              />
              <button type="button" className="btn btn-outline-secondary" onClick={handleAutoGenerateCodigo}>
                Generar
              </button>
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="grado_nivel" className="form-label">
              Grado/Nivel *
            </label>
            <select
              className="form-select"
              id="grado_nivel"
              name="grado_nivel"
              value={formData.grado_nivel}
              onChange={handleInputChange}
            >
              <option value="">Seleccionar grado</option>
              <option value="1ro-sec">1ro Secundaria</option>
              <option value="2do-sec">2do Secundaria</option>
              <option value="3ro-sec">3ro Secundaria</option>
              <option value="4to-sec">4to Secundaria</option>
              <option value="5to-sec">5to Secundaria</option>
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="profesor_id" className="form-label">
              Profesor responsable *
            </label>
            <select
              className="form-select"
              id="profesor_id"
              name="profesor_id"
              value={formData.profesor_id}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccionar profesor</option>
              {profesores.map((profesor) => (
                <option key={profesor.id} value={profesor.id}>
                  {profesor.primer_nombre} {profesor.apellido_paterno} ({profesor.numero_documento || 'sin documento'})
                </option>
              ))}
            </select>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="seccion" className="form-label">
                Sección
              </label>
              <input
                type="text"
                className="form-control"
                id="seccion"
                name="seccion"
                value={formData.seccion}
                onChange={handleInputChange}
                placeholder="A"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="aula_asignada" className="form-label">
                  Aula asignada
              </label>
              <input
                type="text"
                className="form-control"
                  id="aula_asignada"
                  name="aula_asignada"
                  value={formData.aula_asignada}
                onChange={handleInputChange}
                placeholder="A-101"
              />
            </div>
          </div>
          <div className="mb-3">
              <label htmlFor="periodo_academico" className="form-label">
                Período académico *
            </label>
              <input
                type="text"
              className="form-control"
                id="periodo_academico"
                name="periodo_academico"
                value={formData.periodo_academico}
              onChange={handleInputChange}
                placeholder="2026-1"
            />
          </div>
            <div className="mb-3">
              <label htmlFor="capacidad_maxima" className="form-label">
                Capacidad máxima
              </label>
              <input
                type="number"
                className="form-control"
                id="capacidad_maxima"
                name="capacidad_maxima"
                value={formData.capacidad_maxima}
                onChange={handleInputChange}
                min="1"
                max="100"
              />
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default Cursos;
