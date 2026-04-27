import React, { useEffect, useState } from 'react';
import { alumnosService } from '../api/services';
import Modal from '../components/Modal';

interface Alumno {
  id?: string;
  nombre: string;
  email: string;
  telefono?: string;
  grado?: string;
  estado?: string;
}

const Alumnos: React.FC = () => {
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Alumno>({
    nombre: '',
    email: '',
    telefono: '',
    grado: '',
  });

  useEffect(() => {
    fetchAlumnos();
  }, []);

  const fetchAlumnos = async () => {
    try {
      const response = await alumnosService.getAll();
      setAlumnos(response.data?.datos || []);
    } catch (err: any) {
      setError('Error al cargar alumnos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOpenModal = (alumno?: any) => {
    if (alumno) {
      setFormData(alumno);
      setEditingId(alumno.id);
    } else {
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        grado: '',
      });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      grado: '',
    });
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      setError('');
      if (editingId) {
        await alumnosService.update(editingId, formData);
        setSuccess('Alumno actualizado correctamente');
      } else {
        await alumnosService.create(formData);
        setSuccess('Alumno creado correctamente');
      }
      handleCloseModal();
      fetchAlumnos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al guardar alumno');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este alumno?')) {
      try {
        await alumnosService.delete(id);
        setSuccess('Alumno eliminado correctamente');
        fetchAlumnos();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.response?.data?.mensaje || 'Error al eliminar alumno');
      }
    }
  };

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">
        <i className="bi bi-people me-2"></i>
        Gestión de Alumnos
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
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Alumnos ({alumnos.length})</h5>
              <button
                className="btn btn-sm btn-light"
                onClick={() => handleOpenModal()}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Nuevo Alumno
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
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Grado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No hay alumnos registrados
                      </td>
                    </tr>
                  ) : (
                    alumnos.map((alumno) => (
                      <tr key={alumno.id}>
                        <td>
                          <small className="text-muted">{alumno.id}</small>
                        </td>
                        <td>{alumno.nombre}</td>
                        <td>{alumno.email}</td>
                        <td>{alumno.telefono || '-'}</td>
                        <td>{alumno.grado || '-'}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => handleOpenModal(alumno)}
                            title="Editar"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(alumno.id)}
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
        title={editingId ? 'Editar Alumno' : 'Nuevo Alumno'}
        onClose={handleCloseModal}
        onSave={handleSave}
        saveButtonText={editingId ? 'Actualizar' : 'Crear'}
      >
        <form>
          <div className="mb-3">
            <label htmlFor="nombre" className="form-label">
              Nombre *
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
            <label htmlFor="email" className="form-label">
              Email *
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="telefono" className="form-label">
              Teléfono
            </label>
            <input
              type="tel"
              className="form-control"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
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
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, grado: e.target.value }))
              }
            >
              <option value="">Seleccionar grado</option>
              <option value="1ro">1ro Primaria</option>
              <option value="2do">2do Primaria</option>
              <option value="3ro">3ro Primaria</option>
              <option value="4to">4to Primaria</option>
              <option value="5to">5to Primaria</option>
              <option value="6to">6to Primaria</option>
              <option value="1ro-sec">1ro Secundaria</option>
              <option value="2do-sec">2do Secundaria</option>
              <option value="3ro-sec">3ro Secundaria</option>
              <option value="4to-sec">4to Secundaria</option>
              <option value="5to-sec">5to Secundaria</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Alumnos;
