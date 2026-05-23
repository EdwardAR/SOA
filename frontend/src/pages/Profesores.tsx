import React, { useEffect, useState } from 'react';
import { profesoresService } from '../api/services';
import Modal from '../components/Modal';
import { generateStructuredCode } from '../utils/codeGenerators';
import { useSortableData } from '../utils/tableSort';

interface Profesor {
  id?: string;
  usuario_id?: string;
  numero_empleado?: string;
  apellido_paterno?: string;
  primer_nombre?: string;
  email_contacto?: string;
  telefono?: string;
  especialidad?: string;
  estado?: string;
}

const Profesores: React.FC = () => {
  const [profesores, setProfesores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Profesor>({
    apellido_paterno: '',
    primer_nombre: '',
    email_contacto: '',
    telefono: '',
    especialidad: '',
    numero_empleado: '',
    estado: 'activo'
  });
  const { sortConfig, requestSort, sortedRows: profesoresOrdenados } = useSortableData(profesores, 'numero_empleado');

  useEffect(() => {
    fetchProfesores();
  }, []);

  const fetchProfesores = async () => {
    try {
      setLoading(true);
      const response = await profesoresService.getAll();
      console.log('Profesores response:', response.data);
      setProfesores(response.data?.datos || []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching profesores:', err);
      setError('Error al cargar profesores');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGenerateEmpleado = () => {
    setFormData((prev) => ({
      ...prev,
      numero_empleado: generateStructuredCode({
        prefix: 'EMP',
        rows: profesores,
        field: 'numero_empleado',
        padding: 4,
      }),
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOpenModal = (profesor?: any) => {
    if (profesor) {
      setEditingId(profesor.id);
      setFormData({
        id: profesor.id,
        usuario_id: profesor.usuario_id,
        numero_empleado: profesor.numero_empleado || '',
        apellido_paterno: profesor.apellido_paterno || '',
        primer_nombre: profesor.primer_nombre || '',
        email_contacto: profesor.email_contacto || '',
        telefono: profesor.telefono || '',
        especialidad: profesor.especialidad || '',
        estado: profesor.estado || 'activo'
      });
    } else {
      setEditingId(null);
      setFormData({
        apellido_paterno: '',
        primer_nombre: '',
        email_contacto: '',
        telefono: '',
        especialidad: '',
        numero_empleado: '',
        estado: 'activo'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.apellido_paterno || !formData.primer_nombre || !formData.especialidad) {
      setError('Por favor completa los campos obligatorios');
      return;
    }

    try {
      setError('');
      if (editingId) {
        await profesoresService.update(editingId, formData);
        setSuccess('Profesor actualizado correctamente');
      } else {
        await profesoresService.create(formData);
        setSuccess('Profesor creado correctamente');
      }
      handleCloseModal();
      fetchProfesores();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.mensaje || 'Error al guardar profesor');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este profesor?')) {
      try {
        await profesoresService.delete(id);
        setSuccess('Profesor eliminado correctamente');
        fetchProfesores();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        console.error('Delete error:', err);
        setError(err.response?.data?.mensaje || 'Error al eliminar profesor');
      }
    }
  };

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">
        <i className="bi bi-person-badge me-2"></i>
        Gestión de Profesores
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
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Profesores ({profesores.length})</h5>
              <button className="btn btn-sm btn-light" onClick={() => handleOpenModal()}>
                <i className="bi bi-plus-circle me-2"></i>
                Nuevo Profesor
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('numero_empleado')}>
                      Empleado {sortConfig.key === 'numero_empleado' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('primer_nombre')}>
                      Nombre {sortConfig.key === 'primer_nombre' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('apellido_paterno')}>
                      Apellido {sortConfig.key === 'apellido_paterno' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('email_contacto')}>
                      Email {sortConfig.key === 'email_contacto' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('especialidad')}>
                      Especialidad {sortConfig.key === 'especialidad' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('telefono')}>
                      Teléfono {sortConfig.key === 'telefono' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {profesoresOrdenados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        No hay profesores registrados
                      </td>
                    </tr>
                  ) : (
                    profesoresOrdenados.map((profesor) => (
                      <tr key={profesor.id}>
                        <td><small className="text-muted">{profesor.numero_empleado || '-'}</small></td>
                        <td>{profesor.primer_nombre}</td>
                        <td>{profesor.apellido_paterno}</td>
                        <td>{profesor.email_contacto || '-'}</td>
                        <td>{profesor.especialidad || '-'}</td>
                        <td>{profesor.telefono || '-'}</td>
                        <td>
                          <button className="btn btn-sm btn-primary me-2" onClick={() => handleOpenModal(profesor)} title="Editar">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(profesor.id)} title="Eliminar">
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
        title={editingId ? 'Editar Profesor' : 'Nuevo Profesor'}
        onClose={handleCloseModal}
        onSave={handleSave}
        saveButtonText={editingId ? 'Actualizar' : 'Crear'}
      >
        <form>
          <div className="mb-3">
            <label htmlFor="numero_empleado" className="form-label">
              Número de Empleado
            </label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                id="numero_empleado"
                name="numero_empleado"
                value={formData.numero_empleado}
                onChange={handleInputChange}
                placeholder="EMP-2026-0001"
              />
              <button type="button" className="btn btn-outline-secondary" onClick={handleAutoGenerateEmpleado}>
                Generar
              </button>
            </div>
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
            <label htmlFor="especialidad" className="form-label">
              Especialidad *
            </label>
            <input
              type="text"
              className="form-control"
              id="especialidad"
              name="especialidad"
              value={formData.especialidad}
              onChange={handleInputChange}
              required
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

export default Profesores;
