import React, { useEffect, useState } from 'react';
import { cursosService } from '../api/services';
import Modal from '../components/Modal';

interface Curso {
  id?: string;
  nombre: string;
  codigo?: string;
  grado?: string;
  capacidad?: number;
}

const Cursos: React.FC = () => {
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Curso>({
    nombre: '',
    codigo: '',
    grado: '',
    capacidad: 40,
  });

  useEffect(() => {
    fetchCursos();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacidad' ? parseInt(value) : value,
    }));
  };

  const handleOpenModal = (curso?: any) => {
    if (curso) {
      setFormData(curso);
      setEditingId(curso.id);
    } else {
      setFormData({
        nombre: '',
        codigo: '',
        grado: '',
        capacidad: 40,
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
      grado: '',
      capacidad: 40,
    });
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      setError('');
      if (editingId) {
        await cursosService.update(editingId, formData);
        setSuccess('Curso actualizado correctamente');
      } else {
        await cursosService.create(formData);
        setSuccess('Curso creado correctamente');
      }
      handleCloseModal();
      fetchCursos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al guardar curso');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este curso?')) {
      try {
        await cursosService.delete(id);
        setSuccess('Curso eliminado correctamente');
        fetchCursos();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.response?.data?.mensaje || 'Error al eliminar curso');
      }
    }
  };

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">
        <i className="bi bi-book me-2"></i>
        Gestión de Cursos
      </h1>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError('')}
          ></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess('')}
          ></button>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card">
          <div className="card-header bg-success text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Cursos ({cursos.length})</h5>
              <button
                className="btn btn-sm btn-light"
                onClick={() => handleOpenModal()}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Nuevo Curso
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Código</th>
                    <th>Grado</th>
                    <th>Capacidad</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cursos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No hay cursos registrados
                      </td>
                    </tr>
                  ) : (
                    cursos.map((curso) => (
                      <tr key={curso.id}>
                        <td>
                          <small className="text-muted">{curso.id}</small>
                        </td>
                        <td>{curso.nombre}</td>
                        <td>
                          <span className="badge bg-info">{curso.codigo}</span>
                        </td>
                        <td>{curso.grado || '-'}</td>
                        <td>
                          <span className="badge bg-secondary">
                            {curso.capacidad}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => handleOpenModal(curso)}
                            title="Editar"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(curso.id)}
                            title="Eliminar"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
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
            <input
              type="text"
              className="form-control"
              id="codigo"
              name="codigo"
              value={formData.codigo}
              onChange={handleInputChange}
              placeholder="ej: MAT-001"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="grado" className="form-label">
              Grado
            </label>
            <select
              className="form-select"
              id="grado"
              name="grado"
              value={formData.grado}
              onChange={handleInputChange}
            >
              <option value="">Seleccionar grado</option>
              <option value="4to">4to Primaria</option>
              <option value="5to">5to Primaria</option>
              <option value="6to">6to Primaria</option>
              <option value="1ro-sec">1ro Secundaria</option>
              <option value="2do-sec">2do Secundaria</option>
              <option value="3ro-sec">3ro Secundaria</option>
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="capacidad" className="form-label">
              Capacidad
            </label>
            <input
              type="number"
              className="form-control"
              id="capacidad"
              name="capacidad"
              value={formData.capacidad}
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
