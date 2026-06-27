import React, { useEffect, useState } from 'react';
import { alumnosService } from '../api/services';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
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
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; id: string; nombre: string }>({
    show: false, id: '', nombre: '',
  });

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
      setAlumnos(response.data?.datos || []);
      setError('');
    } catch (err: any) {
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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      setEmailLocal((alumno.email_contacto || '').split('@')[0] || '');
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
      setEmailLocal('');
    }
    setError('');
    setSuccess('');
    setFieldErrors({});
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
      setError(err.response?.data?.mensaje || 'Error al guardar alumno');
    }
  };

  const handleDeleteRequest = (alumno: any) => {
    setConfirmDelete({
      show: true,
      id: alumno.id,
      nombre: `${alumno.primer_nombre || ''} ${alumno.apellido_paterno || ''}`.trim(),
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await alumnosService.delete(confirmDelete.id);
      setConfirmDelete({ show: false, id: '', nombre: '' });
      setSuccess('Alumno eliminado correctamente');
      fetchAlumnos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setConfirmDelete({ show: false, id: '', nombre: '' });
      setError(err.response?.data?.mensaje || 'Error al eliminar alumno');
    }
  };

  const alumnosFiltrados = alumnosOrdenados.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.primer_nombre || '').toLowerCase().includes(q) ||
      (a.apellido_paterno || '').toLowerCase().includes(q) ||
      (a.numero_matricula || '').toLowerCase().includes(q) ||
      (a.email_contacto || '').toLowerCase().includes(q)
    );
  });

  const SortIcon = ({ col }: { col: string }) =>
    sortConfig.key === col ? (
      <i className={`bi bi-caret-${sortConfig.direction === 'asc' ? 'up' : 'down'}-fill ms-1`} style={{ fontSize: '0.7rem' }}></i>
    ) : (
      <i className="bi bi-chevron-expand ms-1 text-muted" style={{ fontSize: '0.65rem' }}></i>
    );

  return (
    <div className="screen-page page-shell container-fluid p-2 p-md-4">
      {/* Hero */}
      <div className="page-hero mb-4">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="hero-pill">
            <i className="bi bi-mortarboard me-1"></i> Gestión académica
          </span>
          <span className="hero-pill-count">
            {alumnos.length} registros
          </span>
        </div>
        <h1 className="page-hero-title">
          <i className="bi bi-people me-2"></i>
          Gestión de Alumnos
        </h1>
        <p className="page-hero-subtitle">
          Administra el padrón estudiantil: registra, edita y organiza la información de cada alumno.
        </p>
      </div>

      {/* Mensajes globales */}
      {success && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-3 animate__fadeIn" role="alert">
          <i className="bi bi-check-circle-fill"></i>
          <span>{success}</span>
        </div>
      )}
      {error && !showModal && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
          <i className="bi bi-x-circle-fill"></i>
          <span>{error}</span>
          <button className="btn-close ms-auto" onClick={() => setError('')} />
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <div className="card dashboard-card table-shell">
          {/* Card header */}
          <div className="card-header app-card-header">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-people me-2"></i>
                  Alumnos
                  <span className="badge bg-white text-primary ms-2 fw-semibold" style={{ fontSize: '0.78rem' }}>
                    {alumnosFiltrados.length}
                  </span>
                </h5>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                {/* Buscador */}
                <div className="input-group input-group-sm" style={{ width: 220 }}>
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Buscar alumno..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ borderRadius: '0 8px 8px 0' }}
                  />
                  {search && (
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setSearch('')}>
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
                {allowCreate && (
                  <button
                    className="btn btn-light btn-sm px-3 fw-semibold"
                    onClick={() => handleOpenModal()}
                    style={{ borderRadius: 10 }}
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    Nuevo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 app-table">
                <thead>
                  <tr>
                    <th onClick={() => requestSort('numero_matricula')} style={{ cursor: 'pointer', width: 140 }}>
                      Matrícula <SortIcon col="numero_matricula" />
                    </th>
                    <th onClick={() => requestSort('primer_nombre')} style={{ cursor: 'pointer' }}>
                      Nombre <SortIcon col="primer_nombre" />
                    </th>
                    <th onClick={() => requestSort('apellido_paterno')} style={{ cursor: 'pointer' }}>
                      Apellido <SortIcon col="apellido_paterno" />
                    </th>
                    <th onClick={() => requestSort('email_contacto')} style={{ cursor: 'pointer' }} className="d-none d-md-table-cell">
                      Email <SortIcon col="email_contacto" />
                    </th>
                    <th onClick={() => requestSort('telefono')} style={{ cursor: 'pointer' }} className="d-none d-lg-table-cell">
                      Teléfono <SortIcon col="telefono" />
                    </th>
                    {(allowEdit || allowDelete) && (
                      <th className="text-end" style={{ width: 110 }}>Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {alumnosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5 text-muted">
                        <i className="bi bi-people" style={{ fontSize: '2.5rem', opacity: 0.25 }}></i>
                        <p className="mt-2 mb-0">
                          {search ? 'No se encontraron resultados' : 'No hay alumnos registrados'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    alumnosFiltrados.map((alumno) => (
                      <tr key={alumno.id}>
                        <td>
                          <span className="badge-matricula">{alumno.numero_matricula}</span>
                        </td>
                        <td className="fw-semibold">{alumno.primer_nombre}</td>
                        <td>{alumno.apellido_paterno}</td>
                        <td className="d-none d-md-table-cell text-muted small">
                          {alumno.email_contacto
                            ? <><i className="bi bi-envelope me-1"></i>{alumno.email_contacto}</>
                            : <span className="text-muted">—</span>}
                        </td>
                        <td className="d-none d-lg-table-cell text-muted small">
                          {alumno.telefono
                            ? <><i className="bi bi-telephone me-1"></i>{alumno.telefono}</>
                            : <span className="text-muted">—</span>}
                        </td>
                        {(allowEdit || allowDelete) && (
                          <td className="text-end">
                            <div className="d-flex gap-1 justify-content-end">
                              {allowEdit && (
                                <button
                                  className="btn btn-sm app-btn-edit"
                                  onClick={() => handleOpenModal(alumno)}
                                  title="Editar alumno"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                              )}
                              {allowDelete && (
                                <button
                                  className="btn btn-sm app-btn-delete"
                                  onClick={() => handleDeleteRequest(alumno)}
                                  title="Eliminar alumno"
                                >
                                  <i className="bi bi-trash3"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar */}
      <Modal
        show={showModal}
        title={editingId ? 'Editar Alumno' : 'Nuevo Alumno'}
        onClose={handleCloseModal}
        onSave={handleSave}
        saveButtonText={editingId ? 'Actualizar' : 'Crear alumno'}
        error={error}
        success={success}
      >
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="mb-3">
            <label htmlFor="numero_matricula" className="form-label fw-semibold">
              Número de Matrícula <span className="text-danger">*</span>
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
                <i className="bi bi-magic me-1"></i>Generar
              </button>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="apellido_paterno" className="form-label fw-semibold">
                Apellido Paterno <span className="text-danger">*</span>
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
                <div className="invalid-feedback">{fieldErrors.apellido_paterno}</div>
              )}
            </div>
            <div className="col-md-6">
              <label htmlFor="primer_nombre" className="form-label fw-semibold">
                Nombre <span className="text-danger">*</span>
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
                <div className="invalid-feedback">{fieldErrors.primer_nombre}</div>
              )}
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="numero_documento" className="form-label fw-semibold">
              Número de Documento
            </label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-card-text"></i></span>
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
                <div className="invalid-feedback">{fieldErrors.numero_documento}</div>
              )}
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="email_local" className="form-label fw-semibold">
              Email de Contacto
            </label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-envelope"></i></span>
              <input
                type="text"
                className="form-control"
                id="email_local"
                name="email_local"
                value={emailLocal}
                onChange={(e) => setEmailLocal(e.target.value)}
                placeholder="nombre.usuario"
              />
              <span className="input-group-text text-muted" style={{ fontSize: '0.85rem' }}>@colegiofuturo.edu</span>
            </div>
            <div className="form-text">Solo escribe la parte antes de @colegiofuturo.edu</div>
          </div>

          <div className="mt-3">
            <label htmlFor="telefono" className="form-label fw-semibold">
              Teléfono
            </label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-telephone"></i></span>
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
                <div className="invalid-feedback">{fieldErrors.telefono}</div>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        show={confirmDelete.show}
        title="Eliminar alumno"
        message={`¿Seguro que deseas eliminar a ${confirmDelete.nombre}? Esta acción eliminará también sus matrículas, pagos y registros relacionados.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete({ show: false, id: '', nombre: '' })}
      />
    </div>
  );
};

export default Alumnos;
