import React, { useEffect, useState } from 'react';
import { alumnosService } from '../api/services';
import Modal from '../components/Modal';

interface Alumno {
  id?: string;
  apellido_paterno?: string;
  primer_nombre?: string;
  email_contacto?: string;
  telefono?: string;
  numero_matricula?: string;
  numero_documento?: string;
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
    apellido_paterno: '',
    primer_nombre: '',
    email_contacto: '',
    telefono: '',
    numero_matricula: '',
    numero_documento: '',
  });

  useEffect(() => {
    fetchAlumnos();
  }, []);

  const fetchAlumnos = async () => {
    try {
      setLoading(true);
      const response = await alumnosService.getAll();
      console.log('Response:', response.data);
      setAlumnos(response.data?.datos || []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching alumnos:', err);
      setError('Error al cargar alumnos');
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

  const handleOpenModal = (alumno?: any) => {
    if (alumno) {
      setFormData({
        id: alumno.id,
        apellido_paterno: alumno.apellido_paterno || '',
        primer_nombre: alumno.primer_nombre || '',
        email_contacto: alumno.email_contacto || '',
        telefono: alumno.telefono || '',
        numero_matricula: alumno.numero_matricula || '',
        numero_documento: alumno.numero_documento || '',
        estado: alumno.estado || 'activo',
      });
      setEditingId(alumno.id);
    } else {
      setFormData({
        apellido_paterno: '',
        primer_nombre: '',
        email_contacto: '',
        telefono: '',
        numero_matricula: '',
        numero_documento: '',
        estado: 'activo',
      });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      apellido_paterno: '',
      primer_nombre: '',
      email_contacto: '',
      telefono: '',
      numero_matricula: '',
      numero_documento: '',
    });
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      setError('');
      if (!formData.apellido_paterno || !formData.primer_nombre || !formData.numero_matricula) {
        setError('Completa los campos obligatorios');
        return;
      }

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
      console.error('Save error:', err);
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
        console.error('Delete error:', err);
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
                    <th>Matrícula</th>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Email</th>
                    <th>Teléfono</th>
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
                          <small className="text-muted">{alumno.numero_matricula}</small>
                        </td>
                        <td>{alumno.primer_nombre}</td>
                        <td>{alumno.apellido_paterno}</td>
                        <td>{alumno.email_contacto || '-'}</td>
                        <td>{alumno.telefono || '-'}</td>
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
            <label htmlFor="numero_matricula" className="form-label">
              Número de Matrícula *
            </label>
            <input
              type="text"
              className="form-control"
              id="numero_matricula"
              name="numero_matricula"
              value={formData.numero_matricula}
              onChange={handleInputChange}
              placeholder="MAT-2024-XXXX"
              required
            />
          </div>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="apellido_paterno" className="form-label">
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="apellido_paterno"
                  name="apellido_paterno"
                  value={formData.apellido_paterno}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="primer_nombre" className="form-label">
                  Nombre *
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="primer_nombre"
                  name="primer_nombre"
                  value={formData.primer_nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="numero_documento" className="form-label">
              Número de Documento
            </label>
            <input
              type="text"
              className="form-control"
              id="numero_documento"
              name="numero_documento"
              value={formData.numero_documento}
              onChange={handleInputChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="email_contacto" className="form-label">
              Email de Contacto
            </label>
            <input
              type="email"
              className="form-control"
              id="email_contacto"
              name="email_contacto"
              value={formData.email_contacto}
              onChange={handleInputChange}
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
        </form>
      </Modal>
    </div>
  );
};

export default Alumnos;
