import React, { useEffect, useState } from 'react';
import { asistenciaService, alumnosService, cursosService } from '../api/services';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';
import { useSortableData } from '../utils/tableSort';

interface AsistenciaRecord {
  id?: string;
  alumno_id: string;
  curso_id?: string;
  fecha: string;
  estado: string;
  observacion?: string;
  registrada?: boolean;
  motivo_falta?: string | null;
  alumno_nombre?: string;
  alumno_numero_matricula?: string;
  curso_nombre?: string;
  curso_codigo?: string;
}

const toLocalDate = (d: string) => {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};
const estadoClass = (e: string) => {
  const n = e.toLowerCase();
  if (n === 'presente') return 'success';
  if (n === 'ausente' || n === 'falta') return 'danger';
  return 'warning';
};

const Asistencia: React.FC = () => {
  const [asistencias, setAsistencias] = useState<AsistenciaRecord[]>([]);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; id: string }>({ show: false, id: '' });
  const [formData, setFormData] = useState<AsistenciaRecord>({ alumno_id: '', curso_id: '', fecha: new Date().toISOString().split('T')[0], estado: 'PRESENTE', observacion: '' });

  const { sortConfig, requestSort, sortedRows: ordenadas } = useSortableData(asistencias, 'fecha');
  const { user } = useAuth();
  const role = user?.tipo_usuario;
  const allowCreate = can(role, 'asistencia', 'create');
  const allowEdit = can(role, 'asistencia', 'edit');
  const allowDelete = can(role, 'asistencia', 'delete');

  useEffect(() => { fetchAsistencias(); fetchRelacionados(); }, []);

  const fetchRelacionados = async () => {
    try {
      const [a, c] = await Promise.all([alumnosService.getAll(), cursosService.getAll()]);
      setAlumnos(a.data?.datos || []); setCursos(c.data?.datos || []);
    } catch {}
  };

  const fetchAsistencias = async () => {
    try { setLoading(true); setAsistencias((await asistenciaService.getAll()).data?.datos || []); setError(''); }
    catch { setError('Error al cargar asistencias'); } finally { setLoading(false); }
  };

  const handleOpenModal = (a?: AsistenciaRecord) => {
    setError(''); setSuccess('');
    if (a) { setEditingId(a.id||null); setFormData({ ...a, fecha: toLocalDate(a.fecha) }); }
    else { setEditingId(null); setFormData({ alumno_id:'', curso_id:'', fecha: new Date().toISOString().split('T')[0], estado:'PRESENTE', observacion:'' }); }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.alumno_id || !formData.curso_id) { setError('Selecciona alumno y curso'); return; }
    try {
      const payload = { ...formData, estado: String(formData.estado||'').toUpperCase(), registrada: true, motivo_falta: formData.observacion||null };
      if (editingId) { await asistenciaService.update(editingId, payload); setSuccess('Asistencia actualizada'); }
      else { await asistenciaService.create(payload); setSuccess('Asistencia registrada'); }
      setShowModal(false); setEditingId(null); fetchAsistencias(); setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Error al guardar asistencia'); }
  };

  const handleDeleteConfirm = async () => {
    try { await asistenciaService.delete(confirmDelete.id); setConfirmDelete({ show:false, id:'' });
      setSuccess('Asistencia eliminada'); fetchAsistencias(); setTimeout(() => setSuccess(''), 3000);
    } catch { setConfirmDelete({ show:false, id:'' }); setError('Error al eliminar'); }
  };

  const filtradas = ordenadas.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (a.alumno_nombre||'').toLowerCase().includes(q) || (a.curso_nombre||'').toLowerCase().includes(q) || (a.estado||'').toLowerCase().includes(q);
  });

  const presentes = asistencias.filter(a => a.estado.toLowerCase() === 'presente').length;
  const ausentes = asistencias.filter(a => ['ausente','falta'].includes(a.estado.toLowerCase())).length;
  const tardanzas = asistencias.filter(a => a.estado.toLowerCase() === 'tardanza').length;

  const SortIcon = ({ col }: { col: string }) =>
    sortConfig.key === col ? <i className={`bi bi-caret-${sortConfig.direction==='asc'?'up':'down'}-fill ms-1`} style={{fontSize:'0.7rem'}}></i>
      : <i className="bi bi-chevron-expand ms-1 text-muted" style={{fontSize:'0.65rem'}}></i>;

  return (
    <div className="screen-page page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="hero-pill"><i className="bi bi-calendar-check me-1"></i> Control diario</span>
          <span className="hero-pill-count">{asistencias.length} registros</span>
        </div>
        <h1 className="page-hero-title"><i className="bi bi-calendar-check me-2"></i>Control de Asistencia</h1>
        <p className="page-hero-subtitle">Registra y visualiza la asistencia diaria de los alumnos por sección.</p>
      </div>

      {success && <div className="alert alert-success d-flex align-items-center gap-2 mb-3"><i className="bi bi-check-circle-fill"></i><span>{success}</span></div>}
      {error && !showModal && <div className="alert alert-danger d-flex align-items-center gap-2 mb-3"><i className="bi bi-x-circle-fill"></i><span>{error}</span><button className="btn-close ms-auto" onClick={()=>setError('')}/></div>}

      <div className="row g-3 mb-4">
        {[
          { label:'Presentes', val:presentes, icon:'bi-person-check', color:'metric-success' },
          { label:'Ausentes/Faltas', val:ausentes, icon:'bi-person-x', color:'metric-danger' },
          { label:'Tardanzas', val:tardanzas, icon:'bi-clock-history', color:'metric-warning' },
          { label:'Total registros', val:asistencias.length, icon:'bi-calendar2-week', color:'metric-info' },
        ].map(s => (
          <div className="col-6 col-md-3" key={s.label}>
            <div className={`card metric-card ${s.color}`}>
              <div className="card-body stat-card text-center">
                <i className={`bi ${s.icon} metric-icon`}></i>
                <div className="metric-value">{loading?'…':s.val}</div>
                <p className="mb-0 metric-label">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading ? <div className="loading"><div className="spinner-border text-primary" role="status"/></div> : (
        <div className="card dashboard-card table-shell">
          <div className="card-header app-card-header">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <h5 className="mb-0 fw-bold"><i className="bi bi-calendar-check me-2"></i>Asistencias
                <span className="badge bg-white text-primary ms-2 fw-semibold" style={{fontSize:'0.78rem'}}>{filtradas.length}</span>
              </h5>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <div className="input-group input-group-sm" style={{width:220}}>
                  <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                  <input type="text" className="form-control border-start-0 ps-0" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} style={{borderRadius:'0 8px 8px 0'}}/>
                  {search && <button className="btn btn-outline-secondary btn-sm" onClick={()=>setSearch('')}><i className="bi bi-x"></i></button>}
                </div>
                {allowCreate && <button className="btn btn-light btn-sm px-3 fw-semibold" onClick={()=>handleOpenModal()} style={{borderRadius:10}}><i className="bi bi-plus-circle me-1"></i>Registrar</button>}
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 app-table">
                <thead>
                  <tr>
                    <th onClick={()=>requestSort('alumno_nombre')} style={{cursor:'pointer'}}>Alumno <SortIcon col="alumno_nombre"/></th>
                    <th onClick={()=>requestSort('curso_nombre')} style={{cursor:'pointer'}} className="d-none d-md-table-cell">Curso <SortIcon col="curso_nombre"/></th>
                    <th onClick={()=>requestSort('fecha')} style={{cursor:'pointer'}}>Fecha <SortIcon col="fecha"/></th>
                    <th onClick={()=>requestSort('estado')} style={{cursor:'pointer'}}>Estado <SortIcon col="estado"/></th>
                    <th className="d-none d-lg-table-cell">Motivo</th>
                    {(allowEdit||allowDelete) && <th className="text-end" style={{width:110}}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtradas.length===0 ? (
                    <tr><td colSpan={6} className="text-center py-5 text-muted">
                      <i className="bi bi-calendar-x" style={{fontSize:'2.5rem',opacity:0.25}}></i>
                      <p className="mt-2 mb-0">{search?'Sin resultados':'No hay registros de asistencia'}</p>
                    </td></tr>
                  ) : filtradas.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div className="fw-semibold" style={{fontSize:'0.9rem'}}>{a.alumno_nombre||'—'}</div>
                        <small className="text-muted">{a.alumno_numero_matricula||''}</small>
                      </td>
                      <td className="d-none d-md-table-cell" style={{fontSize:'0.88rem'}}>{a.curso_nombre||'—'}</td>
                      <td className="text-muted small">{a.fecha ? new Date(a.fecha+'T00:00:00').toLocaleDateString('es-PE') : '—'}</td>
                      <td><span className={`badge bg-${estadoClass(a.estado)}`}>{a.estado}</span></td>
                      <td className="d-none d-lg-table-cell text-muted small">{a.motivo_falta||a.observacion||'—'}</td>
                      {(allowEdit||allowDelete) && (
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end">
                            {allowEdit && <button className="btn btn-sm app-btn-edit" onClick={()=>handleOpenModal(a)} title="Editar"><i className="bi bi-pencil"></i></button>}
                            {allowDelete && <button className="btn btn-sm app-btn-delete" onClick={()=>setConfirmDelete({show:true,id:a.id!})} title="Eliminar"><i className="bi bi-trash3"></i></button>}
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

      <Modal show={showModal} title={editingId?'Editar Asistencia':'Registrar Asistencia'} onClose={()=>{setShowModal(false);setEditingId(null);}} onSave={handleSave} error={error} success={success}>
        <form onSubmit={e=>e.preventDefault()}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Alumno <span className="text-danger">*</span></label>
            <select className="form-select" value={formData.alumno_id} onChange={e=>setFormData({...formData,alumno_id:e.target.value})}>
              <option value="">Seleccionar alumno</option>
              {alumnos.map(a=><option key={a.id} value={a.id}>{a.primer_nombre} {a.apellido_paterno} ({a.numero_matricula})</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Curso <span className="text-danger">*</span></label>
            <select className="form-select" value={formData.curso_id} onChange={e=>setFormData({...formData,curso_id:e.target.value})}>
              <option value="">Seleccionar curso</option>
              {cursos.map(c=><option key={c.id} value={c.id}>{c.nombre} ({c.grado||c.grado_nivel} · {c.seccion})</option>)}
            </select>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Fecha</label>
              <input type="date" className="form-control" value={formData.fecha} onChange={e=>setFormData({...formData,fecha:e.target.value})}/>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Estado</label>
              <select className="form-select" value={formData.estado} onChange={e=>setFormData({...formData,estado:e.target.value.toUpperCase()})}>
                <option value="PRESENTE">Presente</option>
                <option value="FALTA">Falta</option>
                <option value="JUSTIFICADO">Justificado</option>
                <option value="TARDANZA">Tardanza</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="form-label fw-semibold">Observación</label>
            <textarea className="form-control" value={formData.observacion} onChange={e=>setFormData({...formData,observacion:e.target.value})} rows={2} placeholder="Notas adicionales"/>
          </div>
        </form>
      </Modal>

      <ConfirmModal show={confirmDelete.show} title="Eliminar asistencia"
        message="¿Seguro que deseas eliminar este registro de asistencia?"
        confirmText="Sí, eliminar" variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={()=>setConfirmDelete({show:false,id:''})}/>
    </div>
  );
};

export default Asistencia;
