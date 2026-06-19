import React, { useEffect, useState } from 'react';
import { alumnosService } from '../api/services';
import Modal from '../components/Modal';
import { generateStructuredCode } from '../utils/codeGenerators';
import { validarAlumno } from '../utils/validators';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';
import { useSortableData } from '../utils/tableSort';

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [emailLocal, setEmailLocal] = useState('');
  const { sortConfig, requestSort, sortedRows: alumnosOrdenados } = useSortableData(alumnos, 'numero_matricula');
  const { user } = useAuth();
  const role = user?.tipo_usuario;
  const allowCreate = can(role, 'alumnos', 'create');
  const allowEdit = can(role, 'alumnos', 'edit');
  const allowDelete = can(role, 'alumnos', 'delete');

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

  const handleAutoGenerateMatricula = () => {
    setFormData((prev) => ({
      ...prev,
      numero_matricula: generateStructuredCode({
        prefix: 'MAT',
        rows: alumnos,
        field: 'numero_matricula',
        padding: 4,
      }),
    }));
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
      const local = (alumno.email_contacto || '').split('@')[0] || '';
      setEmailLocal(local);
      setEditingId(alumno.id);
      setError('');
      setSuccess('');
      setFieldErrors({});
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
      setEmailLocal('');
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
    setEmailLocal('');
    setFieldErrors({});
  };

  const handleSave = async () => {
    try {
      setError('');
      if (!formData.apellido_paterno || !formData.primer_nombre || !formData.numero_matricula) {
        setError('Completa los campos obligatorios');
        return;
      }
      const errores = validarAlumno(formData);
      if (errores.length > 0) {
        setError(errores.join('. '));
        return;
      }

      const payload: any = { ...formData };
      if (emailLocal) payload.email_contacto = `${emailLocal}@colegiofuturo.edu`;

      if (editingId) {
        await alumnosService.update(editingId, payload);
        setSuccess('Alumno actualizado correctamente');
      } else {
        await alumnosService.create(payload);
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
    <div className="screen-page page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="badge rounded-pill bg-light text-primary px-3 py-2">Gestión académica</span>
          <span className="badge rounded-pill bg-white text-dark px-3 py-2">Responsive</span>
        </div>
        <h1 className="page-hero-title">
          <i className="bi bi-people me-2"></i>
          Gestión de Alumnos
        </h1>
        <p className="page-hero-subtitle">Controla el padrón estudiantil con una vista más clara, moderna y adaptable a cualquier pantalla.</p>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card table-shell">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Alumnos ({alumnos.length})</h5>
              {allowCreate && (
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => handleOpenModal()}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Nuevo Alumno
                </button>
              )}
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('numero_matricula')}>
                      Matrícula {sortConfig.key === 'numero_matricula' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
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
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('telefono')}>
                      Teléfono {sortConfig.key === 'telefono' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnosOrdenados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No hay alumnos registrados
                      </td>
                    </tr>
                  ) : (
                    alumnosOrdenados.map((alumno) => (
                      <tr key={alumno.id}>
                        <td>
                          <small className="text-muted">{alumno.numero_matricula}</small>
                        </td>
                        <td>{alumno.primer_nombre}</td>
                        <td>{alumno.apellido_paterno}</td>
                        <td>{alumno.email_contacto || '-'}</td>
                        <td>{alumno.telefono || '-'}</td>
                        <td>
                          {allowEdit && (
                            <button
                              className="btn btn-sm btn-primary me-2"
                              onClick={() => handleOpenModal(alumno)}
                              title="Editar"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                          {allowDelete && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(alumno.id)}
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
        title={editingId ? 'Editar Alumno' : 'Nuevo Alumno'}
        onClose={handleCloseModal}
        onSave={handleSave}
        saveButtonText={editingId ? 'Actualizar' : 'Crear'}
        error={error}
        success={success}
      >
        <form>
          <div className="mb-3">
            <label htmlFor="numero_matricula" className="form-label">
              Número de Matrícula *
            </label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                id="numero_matricula"
                name="numero_matricula"
                value={formData.numero_matricula}
                onChange={handleInputChange}
                placeholder="MAT-2026-0001"
                required
              />
              <button type="button" className="btn btn-outline-secondary" onClick={handleAutoGenerateMatricula}>
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
            <label htmlFor="numero_documento" className="form-label">
              Número de Documento
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
            />
            {fieldErrors.numero_documento && (
              <div className="invalid-feedback d-block">{fieldErrors.numero_documento}</div>
            )}
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

export default Alumnos;
