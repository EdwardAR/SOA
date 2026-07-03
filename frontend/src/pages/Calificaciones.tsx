import React, { useEffect, useState } from 'react';
import { calificacionesService, alumnosService, cursosService } from '../api/services';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';
import { useSortableData } from '../utils/tableSort';
import JsonViewButton from '../components/JsonViewButton';

interface Calificacion {
  id?: string;
  alumno_id: string;
  curso_id: string;
  tipo_evaluacion: string;
  puntuacion: number;
  periodo_academico: string;
  observaciones?: string;
  alumno_nombre?: string;
  alumno_numero_matricula?: string;
  curso_nombre?: string;
  curso_codigo?: string;
}

const normCal = (c: any): Calificacion => ({
  ...c,
  puntuacion: c.puntuacion ?? c.nota ?? 0,
  periodo_academico: c.periodo_academico ?? c.periodo ?? '',
});

const gradeBadge = (n: number) => n >= 15 ? ['success','Excelente'] : n >= 11 ? ['info','Aprobado'] : n >= 6 ? ['warning','En desarrollo'] : ['danger','Desaprobado'];

const Calificaciones: React.FC = () => {
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; id: string }>({ show: false, id: '' });
  const [formData, setFormData] = useState<Calificacion>({ alumno_id:'', curso_id:'', tipo_evaluacion:'parcial', puntuacion:0, periodo_academico:`${new Date().getFullYear()}-1` });

  const { sortConfig, requestSort, sortedRows: ordenadas } = useSortableData(calificaciones, 'puntuacion');
  const { user } = useAuth();
  const role = user?.tipo_usuario;
  const allowCreate = can(role, 'calificaciones', 'create');
  const allowEdit = can(role, 'calificaciones', 'edit');
  const allowDelete = can(role, 'calificaciones', 'delete');

  useEffect(() => { fetchCalificaciones(); fetchRelacionados(); }, []);

  const fetchRelacionados = async () => {
    try {
      const [a, c] = await Promise.all([alumnosService.getAll(), cursosService.getAll()]);
      setAlumnos(a.data?.datos || []); setCursos(c.data?.datos || []);
    } catch {}
  };

  const fetchCalificaciones = async () => {
    try { setLoading(true); setCalificaciones(((await calificacionesService.getAll()).data?.datos || []).map(normCal)); setError(''); }
    catch { setError('Error al cargar calificaciones'); } finally { setLoading(false); }
  };

  const handleOpenModal = (c?: Calificacion) => {
    setError(''); setSuccess('');
    if (c) { setEditingId(c.id||null); setFormData(c); }
    else { setEditingId(null); setFormData({ alumno_id:'', curso_id:'', tipo_evaluacion:'parcial', puntuacion:0, periodo_academico:`${new Date().getFullYear()}-1` }); }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.alumno_id || !formData.curso_id || formData.puntuacion < 0 || formData.puntuacion > 20) {
      setError('Completa todos los campos correctamente (nota 0-20)'); return;
    }
    try {
      const payload = { alumno_id: formData.alumno_id, curso_id: formData.curso_id,
        nota: formData.puntuacion, periodo: formData.periodo_academico, observaciones: formData.observaciones };
      if (editingId) { await calificacionesService.update(editingId, payload); setSuccess('Calificación actualizada'); }
      else { await calificacionesService.create(payload); setSuccess('Calificación registrada'); }
      setShowModal(false); setEditingId(null); fetchCalificaciones(); setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Error al guardar calificación'); }
  };

  const handleDeleteConfirm = async () => {
    try { await calificacionesService.delete(confirmDelete.id); setConfirmDelete({ show:false, id:'' });
      setSuccess('Calificación eliminada'); fetchCalificaciones(); setTimeout(() => setSuccess(''), 3000);
    } catch { setConfirmDelete({ show:false, id:'' }); setError('Error al eliminar'); }
  };

  const filtradas = ordenadas.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.alumno_nombre||'').toLowerCase().includes(q) || (c.curso_nombre||'').toLowerCase().includes(q) ||
      (c.periodo_academico||'').toLowerCase().includes(q);
  });

  const notas = calificaciones.map(c => c.puntuacion).filter(n => n != null);
  const promedio = notas.length > 0 ? (notas.reduce((a,b)=>a+b,0)/notas.length).toFixed(2) : '—';
  const maxima = notas.length > 0 ? Math.max(...notas) : '—';
  const minima = notas.length > 0 ? Math.min(...notas) : '—';

  const SortIcon = ({ col }: { col: string }) =>
    sortConfig.key === col ? <i className={`bi bi-caret-${sortConfig.direction==='asc'?'up':'down'}-fill ms-1`} style={{fontSize:'0.7rem'}}></i>
      : <i className="bi bi-chevron-expand ms-1 text-muted" style={{fontSize:'0.65rem'}}></i>;

  return (
    <div className="screen-page page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="hero-pill"><i className="bi bi-graph-up me-1"></i> Rendimiento académico</span>
          <span className="hero-pill-count">{calificaciones.length} registros</span>
        </div>
        <h1 className="page-hero-title"><i className="bi bi-graph-up me-2"></i>Gestión de Calificaciones</h1>
        <p className="page-hero-subtitle">Supervisa el rendimiento académico y registra las evaluaciones por curso y alumno.</p>
      </div>

      {success && <div className="alert alert-success d-flex align-items-center gap-2 mb-3"><i className="bi bi-check-circle-fill"></i><span>{success}</span></div>}
      {error && !showModal && <div className="alert alert-danger d-flex align-items-center gap-2 mb-3"><i className="bi bi-x-circle-fill"></i><span>{error}</span><button className="btn-close ms-auto" onClick={()=>setError('')}/></div>}

      <div className="row g-3 mb-4">
        {[
          { label:'Promedio general', val:promedio, icon:'bi-bar-chart', color:'metric-info' },
          { label:'Nota máxima', val:maxima, icon:'bi-trophy', color:'metric-success' },
          { label:'Nota mínima', val:minima, icon:'bi-exclamation-triangle', color:'metric-danger' },
          { label:'Total registros', val:calificaciones.length, icon:'bi-journal-check', color:'metric-warning' },
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
              <h5 className="mb-0 fw-bold"><i className="bi bi-graph-up me-2"></i>Calificaciones
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
                    <th onClick={()=>requestSort('puntuacion')} style={{cursor:'pointer'}}>Nota <SortIcon col="puntuacion"/></th>
                    <th>Estado</th>
                    <th onClick={()=>requestSort('periodo_academico')} style={{cursor:'pointer'}} className="d-none d-lg-table-cell">Período <SortIcon col="periodo_academico"/></th>
                    <th className="d-none d-lg-table-cell">Observaciones</th>
                    {(allowEdit||allowDelete) && <th className="text-end" style={{width:150}}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtradas.length===0 ? (
                    <tr><td colSpan={7} className="text-center py-5 text-muted">
                      <i className="bi bi-journal-x" style={{fontSize:'2.5rem',opacity:0.25}}></i>
                      <p className="mt-2 mb-0">{search?'Sin resultados':'No hay calificaciones registradas'}</p>
                    </td></tr>
                  ) : filtradas.map(c => {
                    const [badgeColor, badgeLabel] = gradeBadge(c.puntuacion);
                    return (
                      <tr key={c.id}>
                        <td>
                          <div className="fw-semibold" style={{fontSize:'0.9rem'}}>{c.alumno_nombre||'—'}</div>
                          <small className="text-muted">{c.alumno_numero_matricula||''}</small>
                        </td>
                        <td className="d-none d-md-table-cell" style={{fontSize:'0.88rem'}}>{c.curso_nombre||'—'}</td>
                        <td>
                          <span className="fw-bold" style={{fontSize:'1.05rem', color: c.puntuacion >= 11 ? '#15803d' : '#dc2626'}}>{c.puntuacion}</span>
                          <small className="text-muted ms-1">/ 20</small>
                        </td>
                        <td><span className={`badge bg-${badgeColor}`}>{badgeLabel}</span></td>
                        <td className="d-none d-lg-table-cell text-muted small">{c.periodo_academico||'—'}</td>
                        <td className="d-none d-lg-table-cell text-muted small">{c.observaciones||'—'}</td>
                        {(allowEdit||allowDelete) && (
                          <td className="text-end">
                            <div className="d-flex gap-1 justify-content-end">
                              {allowEdit && <button className="btn btn-sm app-btn-edit" onClick={()=>handleOpenModal(c)} title="Editar"><i className="bi bi-pencil"></i></button>}
                            {allowDelete && <button className="btn btn-sm app-btn-delete" onClick={()=>setConfirmDelete({show:true,id:c.id!})} title="Eliminar"><i className="bi bi-trash3"></i></button>}
                            <JsonViewButton data={c} role={role} title="Calificación" />
                          </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal show={showModal} title={editingId?'Editar Calificación':'Registrar Calificación'} onClose={()=>{setShowModal(false);setEditingId(null);}} onSave={handleSave} error={error} success={success}>
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
              {cursos.map(c=><option key={c.id} value={c.id}>{c.nombre} ({c.codigo||c.grado_nivel})</option>)}
            </select>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Tipo evaluación</label>
              <select className="form-select" value={formData.tipo_evaluacion} onChange={e=>setFormData({...formData,tipo_evaluacion:e.target.value})}>
                <option value="parcial">Parcial</option>
                <option value="final">Final</option>
                <option value="extra">Extra</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Nota (0–20) <span className="text-danger">*</span></label>
              <input type="number" className="form-control" value={formData.puntuacion} onChange={e=>setFormData({...formData,puntuacion:parseFloat(e.target.value)})} min={0} max={20} step={0.5}/>
            </div>
          </div>
          <div className="mt-3">
            <label className="form-label fw-semibold">Período académico</label>
            <input type="text" className="form-control" value={formData.periodo_academico} onChange={e=>setFormData({...formData,periodo_academico:e.target.value})} placeholder="2026-1"/>
          </div>
          <div className="mt-3">
            <label className="form-label fw-semibold">Observaciones</label>
            <textarea className="form-control" value={formData.observaciones||''} onChange={e=>setFormData({...formData,observaciones:e.target.value})} rows={2}/>
          </div>
        </form>
      </Modal>

      <ConfirmModal show={confirmDelete.show} title="Eliminar calificación"
        message="¿Seguro que deseas eliminar esta calificación?"
        confirmText="Sí, eliminar" variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={()=>setConfirmDelete({show:false,id:''})}/>
    </div>
  );
};

export default Calificaciones;
