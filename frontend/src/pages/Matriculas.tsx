import React, { useEffect, useState } from 'react';
import { matriculasService, alumnosService, cursosService } from '../api/services';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';
import { useSortableData } from '../utils/tableSort';
import { validarMatricula } from '../utils/validators';

interface Matricula {
  id?: string;
  alumno_id?: string;
  curso_id?: string;
  periodo_academico?: string;
  fecha_matricula?: string;
  estado?: string;
  observaciones?: string;
}

const estadoBadge = (e?: string) => e === 'activa' ? 'success' : e === 'suspendida' ? 'warning' : 'danger';

const Matriculas: React.FC = () => {
  const [matriculas, setMatriculas] = useState<any[]>([]);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; id: string; label: string }>({
    show: false, id: '', label: '',
  });
  const [formData, setFormData] = useState<Matricula>({
    alumno_id: '', curso_id: '',
    periodo_academico: `${new Date().getFullYear()}-1`,
    fecha_matricula: new Date().toISOString().split('T')[0],
    estado: 'activa', observaciones: '',
  });

  const { sortConfig, requestSort, sortedRows: ordenadas } = useSortableData(matriculas, 'fecha_matricula');
  const { user } = useAuth();
  const role = user?.tipo_usuario;
  const allowCreate = can(role, 'matriculas', 'create');
  const allowEdit = can(role, 'matriculas', 'edit');
  const allowDelete = can(role, 'matriculas', 'delete');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [m, a, c] = await Promise.all([matriculasService.getAll(), alumnosService.getAll(), cursosService.getAll()]);
      setMatriculas(m.data?.datos || []);
      setAlumnos(a.data?.datos || []);
      setCursos(c.data?.datos || []);
      setError('');
    } catch { setError('Error al cargar datos'); }
    finally { setLoading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (mat?: any) => {
    setError(''); setSuccess('');
    if (mat) {
      setEditingId(mat.id);
      setFormData({ id: mat.id, alumno_id: mat.alumno_id, curso_id: mat.curso_id,
        periodo_academico: mat.periodo_academico || `${new Date().getFullYear()}-1`,
        fecha_matricula: mat.fecha_matricula, estado: mat.estado || 'activa', observaciones: mat.observaciones || '' });
    } else {
      setEditingId(null);
      setFormData({ alumno_id: '', curso_id: '', periodo_academico: `${new Date().getFullYear()}-1`,
        fecha_matricula: new Date().toISOString().split('T')[0], estado: 'activa', observaciones: '' });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.alumno_id || !formData.curso_id || !formData.periodo_academico) {
      setError('Selecciona alumno, curso y período'); return;
    }
    const errores = validarMatricula(formData);
    if (errores.length > 0) { setError(errores.join('. ')); return; }
    try {
      setError('');
      const payload = { alumno_id: formData.alumno_id, curso_id: formData.curso_id,
        periodo_academico: formData.periodo_academico, fecha_matricula: formData.fecha_matricula,
        estado: formData.estado, observaciones: formData.observaciones };
      if (editingId) { await matriculasService.update(editingId, payload); setSuccess('Matrícula actualizada'); }
      else { await matriculasService.create(payload); setSuccess('Matrícula registrada'); }
      setShowModal(false); setEditingId(null); fetchData(); setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error al guardar'); }
  };

  const handleDeleteConfirm = async () => {
    try {
      await matriculasService.delete(confirmDelete.id);
      setConfirmDelete({ show: false, id: '', label: '' });
      setSuccess('Matrícula eliminada'); fetchData(); setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setConfirmDelete({ show: false, id: '', label: '' });
      setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error al eliminar');
    }
  };

  const filtradas = ordenadas.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (m.alumno_nombre || '').toLowerCase().includes(q) ||
      (m.curso_nombre || '').toLowerCase().includes(q) ||
      (m.periodo_academico || '').toLowerCase().includes(q) ||
      (m.estado || '').toLowerCase().includes(q);
  });

  const SortIcon = ({ col }: { col: string }) =>
    sortConfig.key === col
      ? <i className={`bi bi-caret-${sortConfig.direction === 'asc' ? 'up' : 'down'}-fill ms-1`} style={{ fontSize: '0.7rem' }}></i>
      : <i className="bi bi-chevron-expand ms-1 text-muted" style={{ fontSize: '0.65rem' }}></i>;

  const activas = matriculas.filter(m => m.estado === 'activa').length;
  const suspendidas = matriculas.filter(m => m.estado === 'suspendida').length;

  return (
    <div className="screen-page page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="hero-pill">
            <i className="bi bi-clipboard-check me-1"></i> Inscripciones
          </span>
          <span className="hero-pill-count">{matriculas.length} registros</span>
        </div>
        <h1 className="page-hero-title"><i className="bi bi-clipboard-check me-2"></i>Gestión de Matrículas</h1>
        <p className="page-hero-subtitle">Registra y controla las inscripciones de alumnos a secciones académicas.</p>
      </div>

      {success && <div className="alert alert-success d-flex align-items-center gap-2 mb-3"><i className="bi bi-check-circle-fill"></i><span>{success}</span></div>}
      {error && !showModal && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-x-circle-fill"></i><span>{error}</span>
          <button className="btn-close ms-auto" onClick={() => setError('')} />
        </div>
      )}

      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total matrículas', val: matriculas.length, icon: 'bi-clipboard-check', color: 'metric-primary' },
          { label: 'Activas', val: activas, icon: 'bi-check-circle', color: 'metric-success' },
          { label: 'Suspendidas', val: suspendidas, icon: 'bi-pause-circle', color: 'metric-warning' },
          { label: 'Alumnos en sistema', val: alumnos.length, icon: 'bi-people', color: 'metric-info' },
        ].map(s => (
          <div className="col-6 col-md-3" key={s.label}>
            <div className={`card metric-card ${s.color}`}>
              <div className="card-body stat-card text-center">
                <i className={`bi ${s.icon} metric-icon`}></i>
                <div className="metric-value">{loading ? '…' : s.val}</div>
                <p className="mb-0 metric-label">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner-border text-primary" role="status" /></div>
      ) : (
        <div className="card dashboard-card table-shell">
          <div className="card-header app-card-header">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-clipboard-check me-2"></i>Matrículas
                <span className="badge bg-white text-primary ms-2 fw-semibold" style={{ fontSize: '0.78rem' }}>{filtradas.length}</span>
              </h5>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <div className="input-group input-group-sm" style={{ width: 220 }}>
                  <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                  <input type="text" className="form-control border-start-0 ps-0" placeholder="Buscar..."
                    value={search} onChange={e => setSearch(e.target.value)} style={{ borderRadius: '0 8px 8px 0' }} />
                  {search && <button className="btn btn-outline-secondary btn-sm" onClick={() => setSearch('')}><i className="bi bi-x"></i></button>}
                </div>
                {allowCreate && (
                  <button className="btn btn-light btn-sm px-3 fw-semibold" onClick={() => handleOpenModal()} style={{ borderRadius: 10 }}>
                    <i className="bi bi-plus-circle me-1"></i>Nueva
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
                    <th onClick={() => requestSort('alumno_nombre')} style={{ cursor: 'pointer' }}>Alumno <SortIcon col="alumno_nombre" /></th>
                    <th onClick={() => requestSort('curso_nombre')} style={{ cursor: 'pointer' }} className="d-none d-md-table-cell">Sección <SortIcon col="curso_nombre" /></th>
                    <th onClick={() => requestSort('periodo_academico')} style={{ cursor: 'pointer' }} className="d-none d-lg-table-cell">Período <SortIcon col="periodo_academico" /></th>
                    <th onClick={() => requestSort('fecha_matricula')} style={{ cursor: 'pointer' }} className="d-none d-lg-table-cell">Fecha <SortIcon col="fecha_matricula" /></th>
                    <th onClick={() => requestSort('estado')} style={{ cursor: 'pointer' }}>Estado <SortIcon col="estado" /></th>
                    {(allowEdit || allowDelete) && <th className="text-end" style={{ width: 110 }}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtradas.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-5 text-muted">
                      <i className="bi bi-clipboard-x" style={{ fontSize: '2.5rem', opacity: 0.25 }}></i>
                      <p className="mt-2 mb-0">{search ? 'Sin resultados' : 'No hay matrículas registradas'}</p>
                    </td></tr>
                  ) : filtradas.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{m.alumno_nombre || '—'}</div>
                        <small className="text-muted">{m.alumno_numero_matricula || ''}</small>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <div style={{ fontSize: '0.88rem' }}>{m.curso_nombre || '—'}</div>
                        <small className="text-muted">{m.curso_grado || ''}{m.curso_seccion ? ` · ${m.curso_seccion}` : ''}</small>
                      </td>
                      <td className="d-none d-lg-table-cell text-muted small">{m.periodo_academico || '—'}</td>
                      <td className="d-none d-lg-table-cell text-muted small">{m.fecha_matricula || '—'}</td>
                      <td>
                        <span className={`badge bg-${estadoBadge(m.estado)}`}>{m.estado}</span>
                      </td>
                      {(allowEdit || allowDelete) && (
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end">
                            {allowEdit && <button className="btn btn-sm app-btn-edit" onClick={() => handleOpenModal(m)} title="Editar"><i className="bi bi-pencil"></i></button>}
                            {allowDelete && <button className="btn btn-sm app-btn-delete"
                              onClick={() => setConfirmDelete({ show: true, id: m.id, label: `${m.alumno_nombre} — ${m.curso_nombre}` })} title="Eliminar">
                              <i className="bi bi-trash3"></i>
                            </button>}
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

      <Modal show={showModal} title={editingId ? 'Editar Matrícula' : 'Nueva Matrícula'}
        onClose={() => { setShowModal(false); setEditingId(null); }} onSave={handleSave}
        saveButtonText={editingId ? 'Actualizar' : 'Registrar'}
        error={error} success={success}>
        <form onSubmit={e => e.preventDefault()}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Alumno <span className="text-danger">*</span></label>
            <select className="form-select" name="alumno_id" value={formData.alumno_id} onChange={handleInputChange}>
              <option value="">Seleccionar alumno</option>
              {alumnos.map(a => <option key={a.id} value={a.id}>{a.primer_nombre} {a.apellido_paterno} ({a.numero_matricula})</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Sección académica <span className="text-danger">*</span></label>
            <select className="form-select" name="curso_id" value={formData.curso_id} onChange={handleInputChange}>
              <option value="">Seleccionar curso</option>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.grado || c.grado_nivel} · {c.seccion})</option>)}
            </select>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Período académico <span className="text-danger">*</span></label>
              <input type="text" className="form-control" name="periodo_academico" value={formData.periodo_academico} onChange={handleInputChange} placeholder="2026-1" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Fecha de matrícula</label>
              <input type="date" className="form-control" name="fecha_matricula" value={formData.fecha_matricula} onChange={handleInputChange} />
            </div>
          </div>
          <div className="mt-3">
            <label className="form-label fw-semibold">Estado</label>
            <select className="form-select" name="estado" value={formData.estado} onChange={handleInputChange}>
              <option value="activa">Activa</option>
              <option value="cancelada">Cancelada</option>
              <option value="suspendida">Suspendida</option>
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmModal show={confirmDelete.show} title="Eliminar matrícula"
        message={`¿Seguro que deseas eliminar la matrícula de ${confirmDelete.label}?`}
        confirmText="Sí, eliminar" variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete({ show: false, id: '', label: '' })} />
    </div>
  );
};

export default Matriculas;
