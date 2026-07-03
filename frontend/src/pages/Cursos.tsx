import React, { useEffect, useState } from 'react';
import { cursosService, profesoresService } from '../api/services';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';
import { useSortableData } from '../utils/tableSort';
import { generateStructuredCode } from '../utils/codeGenerators';
import { validarCurso } from '../utils/validators';
import JsonViewButton from '../components/JsonViewButton';

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

const GRADOS = ['1ro-sec', '2do-sec', '3ro-sec', '4to-sec', '5to-sec'];

const Cursos: React.FC = () => {
  const [cursos, setCursos] = useState<any[]>([]);
  const [profesores, setProfesores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; id: string; nombre: string }>({
    show: false, id: '', nombre: '',
  });
  const [formData, setFormData] = useState<Curso>({
    nombre: '', codigo: '', grado_nivel: '', capacidad_maxima: 40,
    profesor_id: '', seccion: 'A', aula_asignada: '',
    periodo_academico: `${new Date().getFullYear()}-1`,
  });

  const { sortConfig, requestSort, sortedRows: cursosOrdenados } = useSortableData(cursos, 'nombre');
  const { user } = useAuth();
  const role = user?.tipo_usuario;
  const allowCreate = can(role, 'cursos', 'create');
  const allowEdit = can(role, 'cursos', 'edit');
  const allowDelete = can(role, 'cursos', 'delete');

  useEffect(() => { fetchCursos(); fetchProfesores(); }, []);

  const fetchCursos = async () => {
    try {
      setLoading(true);
      const response = await cursosService.getAll();
      setCursos(response.data?.datos || []);
      setError('');
    } catch { setError('Error al cargar cursos'); }
    finally { setLoading(false); }
  };

  const fetchProfesores = async () => {
    try {
      const response = await profesoresService.getAll();
      setProfesores(response.data?.datos || []);
    } catch { /* silencioso */ }
  };

  const emptyForm = (): Curso => ({
    nombre: '', codigo: '', grado_nivel: '', capacidad_maxima: 40,
    profesor_id: profesores[0]?.id || '', seccion: 'A', aula_asignada: '',
    periodo_academico: `${new Date().getFullYear()}-1`,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'capacidad_maxima' ? parseInt(value) : value } as any));
  };

  const handleOpenModal = (curso?: any) => {
    setError(''); setSuccess('');
    if (curso) {
      setFormData({
        nombre: curso.nombre || '',
        codigo: curso.codigo || '',
        grado_nivel: curso.grado || '',
        capacidad_maxima: curso.capacidad || 40,
        profesor_id: curso.profesor_id || '',
        seccion: curso.seccion || 'A',
        aula_asignada: curso.salon || '',
        periodo_academico: curso.periodo_academico || `${new Date().getFullYear()}-1`,
      });
      setEditingId(curso.id);
    } else { setFormData(emptyForm()); setEditingId(null); }
    setShowModal(true);
  };

  const handleCloseModal = () => { setShowModal(false); setEditingId(null); };

  const handleSave = async () => {
    if (!formData.nombre || !formData.codigo || !formData.grado_nivel || !formData.profesor_id) {
      setError('Completa nombre, código, grado y profesor'); return;
    }
    const errores = validarCurso(formData);
    if (errores.length > 0) { setError(errores.join('. ')); return; }
    try {
      setError('');
      const payload = {
        nombre: formData.nombre, codigo: formData.codigo,
        grado: formData.grado_nivel,
        capacidad: formData.capacidad_maxima,
        profesor_id: formData.profesor_id,
        seccion: formData.seccion, salon: formData.aula_asignada,
      };
      if (editingId) { await cursosService.update(editingId, payload); setSuccess('Curso actualizado'); }
      else { await cursosService.create(payload); setSuccess('Curso creado'); }
      handleCloseModal(); fetchCursos(); setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error al guardar curso'); }
  };

  const handleDeleteConfirm = async () => {
    try {
      await cursosService.delete(confirmDelete.id);
      setConfirmDelete({ show: false, id: '', nombre: '' });
      setSuccess('Curso eliminado correctamente');
      setCursos(cursos.filter(c => c.id !== confirmDelete.id));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setConfirmDelete({ show: false, id: '', nombre: '' });
      setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error al eliminar curso');
    }
  };

  const filtrados = cursosOrdenados.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.nombre || '').toLowerCase().includes(q) ||
      (c.codigo || '').toLowerCase().includes(q) ||
      (c.grado || '').toLowerCase().includes(q) ||
      (c.profesor_nombre || '').toLowerCase().includes(q);
  });

  const SortIcon = ({ col }: { col: string }) =>
    sortConfig.key === col
      ? <i className={`bi bi-caret-${sortConfig.direction === 'asc' ? 'up' : 'down'}-fill ms-1`} style={{ fontSize: '0.7rem' }}></i>
      : <i className="bi bi-chevron-expand ms-1 text-muted" style={{ fontSize: '0.65rem' }}></i>;

  return (
    <div className="screen-page page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="hero-pill">
            <i className="bi bi-book me-1"></i> Secciones
          </span>
          <span className="hero-pill-count">{cursos.length} registros</span>
        </div>
        <h1 className="page-hero-title"><i className="bi bi-book me-2"></i>Gestión de Cursos</h1>
        <p className="page-hero-subtitle">Centraliza secciones, grados y profesores en una interfaz ordenada.</p>
      </div>

      {success && <div className="alert alert-success d-flex align-items-center gap-2 mb-3"><i className="bi bi-check-circle-fill"></i><span>{success}</span></div>}
      {error && !showModal && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-x-circle-fill"></i><span>{error}</span>
          <button className="btn-close ms-auto" onClick={() => setError('')} />
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner-border text-primary" role="status" /></div>
      ) : (
        <div className="card dashboard-card table-shell">
          <div className="card-header app-card-header">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-book me-2"></i>Cursos
                <span className="badge bg-white text-primary ms-2 fw-semibold" style={{ fontSize: '0.78rem' }}>{filtrados.length}</span>
              </h5>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <div className="input-group input-group-sm" style={{ width: 220 }}>
                  <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                  <input type="text" className="form-control border-start-0 ps-0" placeholder="Buscar curso..."
                    value={search} onChange={e => setSearch(e.target.value)} style={{ borderRadius: '0 8px 8px 0' }} />
                  {search && <button className="btn btn-outline-secondary btn-sm" onClick={() => setSearch('')}><i className="bi bi-x"></i></button>}
                </div>
                {allowCreate && (
                  <button className="btn btn-light btn-sm px-3 fw-semibold" onClick={() => handleOpenModal()} style={{ borderRadius: 10 }}>
                    <i className="bi bi-plus-circle me-1"></i>Nuevo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 app-table">
                <thead>
                  <tr>
                    <th onClick={() => requestSort('nombre')} style={{ cursor: 'pointer' }}>Nombre <SortIcon col="nombre" /></th>
                    <th onClick={() => requestSort('codigo')} style={{ cursor: 'pointer' }}>Código <SortIcon col="codigo" /></th>
                    <th onClick={() => requestSort('grado')} style={{ cursor: 'pointer' }}>Grado <SortIcon col="grado" /></th>
                    <th onClick={() => requestSort('profesor_nombre')} style={{ cursor: 'pointer' }} className="d-none d-md-table-cell">Profesor <SortIcon col="profesor_nombre" /></th>
                    <th className="d-none d-lg-table-cell">Aula</th>
                    {(allowEdit || allowDelete) && <th className="text-end" style={{ width: 150 }}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-5 text-muted">
                      <i className="bi bi-book" style={{ fontSize: '2.5rem', opacity: 0.25 }}></i>
                      <p className="mt-2 mb-0">{search ? 'Sin resultados' : 'No hay cursos registrados'}</p>
                    </td></tr>
                  ) : filtrados.map(c => (
                    <tr key={c.id}>
                      <td className="fw-semibold">{c.nombre}</td>
                      <td><span className="badge-matricula">{c.codigo || '—'}</span></td>
                      <td>
                        {c.grado
                          ? <span className="badge rounded-pill" style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', fontWeight: 600 }}>{c.grado}</span>
                          : '—'}
                        {c.seccion && <span className="ms-1 text-muted small">· {c.seccion}</span>}
                      </td>
                      <td className="d-none d-md-table-cell">
                        <div className="fw-semibold" style={{ fontSize: '0.88rem' }}>{c.profesor_nombre || '—'}</div>
                      </td>
                      <td className="d-none d-lg-table-cell text-muted small">{c.salon || '—'}</td>
                      {(allowEdit || allowDelete) && (
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end">
                            {allowEdit && <button className="btn btn-sm app-btn-edit" onClick={() => handleOpenModal(c)} title="Editar"><i className="bi bi-pencil"></i></button>}
                            {allowDelete && <button className="btn btn-sm app-btn-delete"
                              onClick={() => setConfirmDelete({ show: true, id: c.id, nombre: c.nombre })} title="Eliminar">
                              <i className="bi bi-trash3"></i>
                            </button>}
                            <JsonViewButton data={c} role={role} title="Curso" />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal show={showModal} title={editingId ? 'Editar Curso' : 'Nuevo Curso'}
        onClose={handleCloseModal} onSave={handleSave}
        saveButtonText={editingId ? 'Actualizar' : 'Crear curso'}
        error={error} success={success}>
        <form onSubmit={e => e.preventDefault()}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Nombre del Curso <span className="text-danger">*</span></label>
            <input type="text" className="form-control" name="nombre" value={formData.nombre} onChange={handleInputChange} />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Código</label>
            <div className="input-group">
              <input type="text" className="form-control" name="codigo" value={formData.codigo} onChange={handleInputChange} placeholder="CUR-2026-0001" />
              <button type="button" className="btn btn-outline-secondary" onClick={() => setFormData(p => ({ ...p, codigo: generateStructuredCode({ prefix: 'CUR', rows: cursos, field: 'codigo', padding: 4, year: new Date().getFullYear() }) }))}>
                <i className="bi bi-magic me-1"></i>Generar
              </button>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Grado/Nivel <span className="text-danger">*</span></label>
            <select className="form-select" name="grado_nivel" value={formData.grado_nivel} onChange={handleInputChange}>
              <option value="">Seleccionar grado</option>
              {GRADOS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Profesor responsable <span className="text-danger">*</span></label>
            <select className="form-select" name="profesor_id" value={formData.profesor_id} onChange={handleInputChange}>
              <option value="">Seleccionar profesor</option>
              {profesores.map(p => (
                <option key={p.id} value={p.id}>{p.primer_nombre} {p.apellido_paterno}</option>
              ))}
            </select>
          </div>
          <div className="row g-3">
            <div className="col-6">
              <label className="form-label fw-semibold">Sección</label>
              <input type="text" className="form-control" name="seccion" value={formData.seccion} onChange={handleInputChange} placeholder="A" />
            </div>
            <div className="col-6">
              <label className="form-label fw-semibold">Aula</label>
              <input type="text" className="form-control" name="aula_asignada" value={formData.aula_asignada} onChange={handleInputChange} placeholder="A-101" />
            </div>
          </div>
          <div className="row g-3 mt-0">
            <div className="col-6">
              <label className="form-label fw-semibold">Período académico <span className="text-danger">*</span></label>
              <input type="text" className="form-control" name="periodo_academico" value={formData.periodo_academico} onChange={handleInputChange} placeholder="2026-1" />
            </div>
            <div className="col-6">
              <label className="form-label fw-semibold">Capacidad máx.</label>
              <input type="number" className="form-control" name="capacidad_maxima" value={formData.capacidad_maxima} onChange={handleInputChange} min={1} max={100} />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmModal show={confirmDelete.show} title="Eliminar curso"
        message={`¿Seguro que deseas eliminar "${confirmDelete.nombre}"? Se eliminarán también sus matrículas y registros asociados.`}
        confirmText="Sí, eliminar" variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete({ show: false, id: '', nombre: '' })} />
    </div>
  );
};

export default Cursos;
