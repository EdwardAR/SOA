import React, { useEffect, useState } from 'react';
import { profesoresService } from '../api/services';
import Modal from '../components/Modal';
import { useSortableData } from '../utils/tableSort';
import { validarProfesor } from '../utils/validators';

interface Profesor {
  id?: string;
  usuario_id?: string;
  numero_documento?: string;
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
    numero_documento: '',
    apellido_paterno: '',
    primer_nombre: '',
    email_contacto: '',
    telefono: '',
    especialidad: '',
    estado: 'activo'
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [emailLocal, setEmailLocal] = useState('');
  const { sortConfig, requestSort, sortedRows: profesoresOrdenados } = useSortableData(profesores, 'numero_documento');

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

  const validateField = (name: string, value: string) => {
    if (name === 'apellido_paterno' || name === 'primer_nombre') {
      if (value && !/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]*$/.test(value)) {
        setFieldErrors(prev => ({ ...prev, [name]: 'No debe contener números' }));
        return;
      }
    }
    if (name === 'numero_documento' && value) {
      if (!/^\d*$/.test(value)) {
        setFieldErrors(prev => ({ ...prev, [name]: 'Solo dígitos' }));
        return;
      }
      if (value.length > 8) {
        setFieldErrors(prev => ({ ...prev, [name]: 'Máximo 8 dígitos' }));
        return;
      }
    }
    if (name === 'telefono' && value) {
      if (!/^\d*$/.test(value)) {
        setFieldErrors(prev => ({ ...prev, [name]: 'Solo dígitos' }));
        return;
      }
      if (value.length > 9) {
        setFieldErrors(prev => ({ ...prev, [name]: 'Máximo 9 dígitos' }));
        return;
      }
      if (value.length > 0 && value[0] !== '9') {
        setFieldErrors(prev => ({ ...prev, [name]: 'Debe empezar con 9' }));
        return;
      }
    }
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    validateField(name, value);
  };

  const handleOpenModal = (profesor?: any) => {
    if (profesor) {
      setEditingId(profesor.id);
      setFormData({
        id: profesor.id,
        usuario_id: profesor.usuario_id,
        numero_documento: profesor.numero_documento || '',
        apellido_paterno: profesor.apellido_paterno || '',
        primer_nombre: profesor.primer_nombre || '',
        email_contacto: profesor.email_contacto || '',
        telefono: profesor.telefono || '',
        especialidad: profesor.especialidad || '',
        estado: profesor.estado || 'activo'
      });
      setEmailLocal((profesor.email_contacto || '').split('@')[0] || '');
      setError('');
      setSuccess('');
      setFieldErrors({});
    } else {
      setEditingId(null);
      setFormData({
        numero_documento: '',
        apellido_paterno: '',
        primer_nombre: '',
        email_contacto: '',
        telefono: '',
        especialidad: '',
        estado: 'activo'
      });
      setEmailLocal('');
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setEmailLocal('');
    setFieldErrors({});
  };

  const handleSave = async () => {
    if (!formData.apellido_paterno || !formData.primer_nombre || !formData.especialidad || !formData.numero_documento) {
      setError('Por favor completa los campos obligatorios');
      return;
    }
    const errores = validarProfesor(formData);
    if (errores.length > 0) {
      setError(errores.join('. '));
      return;
    }

    try {
      setError('');
      const payload: any = { ...formData };
      if (emailLocal) payload.email_contacto = `${emailLocal}@colegiofuturo.edu`;

      if (editingId) {
        await profesoresService.update(editingId, payload);
        setSuccess('Profesor actualizado correctamente');
      } else {
        await profesoresService.create(payload);
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
    <div className="screen-page page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="badge rounded-pill bg-light text-primary px-3 py-2">Gestión académica</span>
          <span className="badge rounded-pill bg-white text-dark px-3 py-2">Responsive</span>
        </div>
        <h1 className="page-hero-title">
          <i className="bi bi-person-badge me-2"></i>
          Gestión de Profesores
        </h1>
        <p className="page-hero-subtitle">Administra la planta docente con una experiencia más limpia, consistente y fácil de usar en móvil o escritorio.</p>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card table-shell">
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
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('numero_documento')}>
                      Documento {sortConfig.key === 'numero_documento' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
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
                        <td><small className="text-muted">{profesor.numero_documento || '-'}</small></td>
                        <td>{profesor.primer_nombre}</td>
                        <td>{profesor.apellido_paterno}</td>
                        <td>{profesor.email || profesor.email_contacto || '-'}</td>
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
        error={error}
        success={success}
      >
        <form>
          <div className="mb-3">
            <label htmlFor="numero_documento" className="form-label">
              Número de Documento *
            </label>
            <input
              type="text"
              className={`form-control ${fieldErrors.numero_documento ? 'is-invalid' : ''}`}
              id="numero_documento"
              name="numero_documento"
              value={formData.numero_documento}
              onChange={handleInputChange}
              inputMode="numeric"
              maxLength={8}
              placeholder="12345678"
              required
            />
            {fieldErrors.numero_documento && (
              <div className="invalid-feedback d-block">{fieldErrors.numero_documento}</div>
            )}
          </div>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="apellido_paterno" className="form-label">
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  className={`form-control ${fieldErrors.apellido_paterno ? 'is-invalid' : ''}`}
                  id="apellido_paterno"
                  name="apellido_paterno"
                  value={formData.apellido_paterno}
                  onChange={handleInputChange}
                  maxLength={50}
                  required
                />
                {fieldErrors.apellido_paterno && (
                  <div className="invalid-feedback d-block">{fieldErrors.apellido_paterno}</div>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="primer_nombre" className="form-label">
                  Nombre *
                </label>
                <input
                  type="text"
                  className={`form-control ${fieldErrors.primer_nombre ? 'is-invalid' : ''}`}
                  id="primer_nombre"
                  name="primer_nombre"
                  value={formData.primer_nombre}
                  onChange={handleInputChange}
                  maxLength={50}
                  required
                />
                {fieldErrors.primer_nombre && (
                  <div className="invalid-feedback d-block">{fieldErrors.primer_nombre}</div>
                )}
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
            <label htmlFor="email_local" className="form-label">
              Email de Contacto
            </label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                id="email_local"
                name="email_local"
                value={emailLocal}
                onChange={(e) => setEmailLocal(e.target.value)}
                placeholder="nombre.usuario"
              />
              <span className="input-group-text">@colegiofuturo.edu</span>
            </div>
            <div className="form-text">Solo escribe la parte antes de @colegiofuturo.edu</div>
          </div>
          <div className="mb-3">
            <label htmlFor="telefono" className="form-label">
              Teléfono
            </label>
            <input
              type="tel"
              className={`form-control ${fieldErrors.telefono ? 'is-invalid' : ''}`}
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              inputMode="numeric"
              maxLength={9}
              placeholder="987654321"
            />
            {fieldErrors.telefono && (
              <div className="invalid-feedback d-block">{fieldErrors.telefono}</div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Profesores;
