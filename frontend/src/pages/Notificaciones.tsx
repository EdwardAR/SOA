import React, { useEffect, useState } from 'react';
import { notificacionesService, usuariosService, alumnosService } from '../api/services';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';
import { useSortableData } from '../utils/tableSort';

interface Notificacion {
  id?: string;
  destinatario_id: string;
  tipo: string;
  mensaje: string;
  leida: boolean;
  fecha_creacion?: string;
  destinatario_nombre?: string;
  destinatario_email?: string;
  destinatario_tipo?: string;
}

const tipoBadge = (t: string) => t==='alerta' ? 'danger' : t==='urgente' ? 'warning' : 'info';
const tipoIcon = (t: string) => t==='alerta' ? 'bi-exclamation-triangle' : t==='urgente' ? 'bi-bell-fill' : t==='recordatorio' ? 'bi-calendar-event' : 'bi-info-circle';

const Notificaciones: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterLeida, setFilterLeida] = useState<'all'|'leida'|'noleida'>('all');
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; id: string }>({ show: false, id: '' });
  const [formData, setFormData] = useState<Notificacion>({ destinatario_id:'', tipo:'informacion', mensaje:'', leida:false });

  const { sortConfig, requestSort, sortedRows: ordenadas } = useSortableData(notificaciones, 'fecha_creacion');
  const { user } = useAuth();
  const role = user?.tipo_usuario;
  const allowCreate = can(role, 'notificaciones', 'create');
  const allowEdit = can(role, 'notificaciones', 'edit');
  const allowDelete = can(role, 'notificaciones', 'delete');

  useEffect(() => { fetchNotificaciones(); fetchRelacionados(); }, []);

  const fetchRelacionados = async () => {
    try {
      const [u, a] = await Promise.all([usuariosService.getAll(), alumnosService.getAll()]);
      setUsuarios(u.data?.datos || []); setAlumnos(a.data?.datos || []);
    } catch {}
  };

  const fetchNotificaciones = async () => {
    try { setLoading(true); setNotificaciones((await notificacionesService.getAll()).data?.datos || []); setError(''); }
    catch { setError('Error al cargar notificaciones'); } finally { setLoading(false); }
  };

  const handleOpenModal = (n?: Notificacion) => {
    setError(''); setSuccess('');
    if (n) { setEditingId(n.id||null); setFormData({ id:n.id, destinatario_id:n.destinatario_id, tipo:n.tipo, mensaje:n.mensaje, leida:!!n.leida }); }
    else { setEditingId(null); setFormData({ destinatario_id:'', tipo:'informacion', mensaje:'', leida:false }); }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.destinatario_id || !formData.mensaje) { setError('Completa destinatario y mensaje'); return; }
    try {
      const payload = { destinatario_id: formData.destinatario_id, tipo: formData.tipo, mensaje: formData.mensaje, leida: !!formData.leida };
      if (editingId) { await notificacionesService.update(editingId, payload); setSuccess('Notificación actualizada'); }
      else { await notificacionesService.create(payload); setSuccess('Notificación enviada'); }
      setShowModal(false); setEditingId(null); fetchNotificaciones(); setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Error al guardar notificación'); }
  };

  const handleToggleLeida = async (n: Notificacion) => {
    try {
      await notificacionesService.update(n.id!, { ...n, leida: !n.leida });
      fetchNotificaciones();
    } catch { setError('Error al actualizar notificación'); }
  };

  const handleDeleteConfirm = async () => {
    try { await notificacionesService.delete(confirmDelete.id); setConfirmDelete({ show:false, id:'' });
      setSuccess('Notificación eliminada'); fetchNotificaciones(); setTimeout(() => setSuccess(''), 3000);
    } catch { setConfirmDelete({ show:false, id:'' }); setError('Error al eliminar'); }
  };

  const getDestinatario = (n: Notificacion) => {
    if (n.destinatario_nombre) return n.destinatario_nombre;
    const u = usuarios.find(x=>x.id===n.destinatario_id);
    if (u) return u.nombre;
    const a = alumnos.find(x=>x.id===n.destinatario_id);
    if (a) return `${a.primer_nombre} ${a.apellido_paterno}`;
    return '—';
  };

  const filtradas = ordenadas.filter(n => {
    if (filterLeida === 'leida' && !n.leida) return false;
    if (filterLeida === 'noleida' && n.leida) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (n.destinatario_nombre||'').toLowerCase().includes(q) || (n.mensaje||'').toLowerCase().includes(q) || (n.tipo||'').toLowerCase().includes(q);
  });

  const leidas = notificaciones.filter(n=>n.leida).length;
  const noLeidas = notificaciones.filter(n=>!n.leida).length;
  const alertas = notificaciones.filter(n=>n.tipo==='alerta').length;
  const informaciones = notificaciones.filter(n=>n.tipo==='informacion').length;

  const SortIcon = ({ col }: { col: string }) =>
    sortConfig.key === col ? <i className={`bi bi-caret-${sortConfig.direction==='asc'?'up':'down'}-fill ms-1`} style={{fontSize:'0.7rem'}}></i>
      : <i className="bi bi-chevron-expand ms-1 text-muted" style={{fontSize:'0.65rem'}}></i>;

  return (
    <div className="screen-page page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="hero-pill"><i className="bi bi-bell me-1"></i> Comunicados</span>
          <span className="hero-pill-count">{notificaciones.length} registros</span>
          {noLeidas > 0 && <span className="hero-pill-warning">{noLeidas} sin leer</span>}
        </div>
        <h1 className="page-hero-title"><i className="bi bi-bell me-2"></i>Centro de Notificaciones</h1>
        <p className="page-hero-subtitle">Comunica avisos, alertas y recordatorios a alumnos, padres y docentes.</p>
      </div>

      {success && <div className="alert alert-success d-flex align-items-center gap-2 mb-3"><i className="bi bi-check-circle-fill"></i><span>{success}</span></div>}
      {error && !showModal && <div className="alert alert-danger d-flex align-items-center gap-2 mb-3"><i className="bi bi-x-circle-fill"></i><span>{error}</span><button className="btn-close ms-auto" onClick={()=>setError('')}/></div>}

      <div className="row g-3 mb-4">
        {[
          { label:'Leídas', val:leidas, icon:'bi-envelope-open', color:'metric-success' },
          { label:'No leídas', val:noLeidas, icon:'bi-envelope', color:'metric-warning' },
          { label:'Informativos', val:informaciones, icon:'bi-info-circle', color:'metric-info' },
          { label:'Alertas', val:alertas, icon:'bi-exclamation-triangle', color:'metric-danger' },
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
              <h5 className="mb-0 fw-bold"><i className="bi bi-bell me-2"></i>Notificaciones
                <span className="badge bg-white text-primary ms-2 fw-semibold" style={{fontSize:'0.78rem'}}>{filtradas.length}</span>
              </h5>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <select className="form-select form-select-sm" style={{width:130}} value={filterLeida} onChange={e=>setFilterLeida(e.target.value as any)}>
                  <option value="all">Todas</option>
                  <option value="leida">Leídas</option>
                  <option value="noleida">No leídas</option>
                </select>
                <div className="input-group input-group-sm" style={{width:200}}>
                  <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                  <input type="text" className="form-control border-start-0 ps-0" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} style={{borderRadius:'0 8px 8px 0'}}/>
                  {search && <button className="btn btn-outline-secondary btn-sm" onClick={()=>setSearch('')}><i className="bi bi-x"></i></button>}
                </div>
                {allowCreate && <button className="btn btn-light btn-sm px-3 fw-semibold" onClick={()=>handleOpenModal()} style={{borderRadius:10}}><i className="bi bi-plus-circle me-1"></i>Nueva</button>}
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 app-table">
                <thead>
                  <tr>
                    <th onClick={()=>requestSort('destinatario_nombre')} style={{cursor:'pointer'}}>Para <SortIcon col="destinatario_nombre"/></th>
                    <th onClick={()=>requestSort('tipo')} style={{cursor:'pointer'}}>Tipo <SortIcon col="tipo"/></th>
                    <th>Mensaje</th>
                    <th onClick={()=>requestSort('leida')} style={{cursor:'pointer'}}>Estado <SortIcon col="leida"/></th>
                    <th onClick={()=>requestSort('fecha_creacion')} style={{cursor:'pointer'}} className="d-none d-md-table-cell">Fecha <SortIcon col="fecha_creacion"/></th>
                    <th className="text-end" style={{width:130}}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.length===0 ? (
                    <tr><td colSpan={6} className="text-center py-5 text-muted">
                      <i className="bi bi-bell-slash" style={{fontSize:'2.5rem',opacity:0.25}}></i>
                      <p className="mt-2 mb-0">{search?'Sin resultados':'No hay notificaciones'}</p>
                    </td></tr>
                  ) : filtradas.map(n => (
                    <tr key={n.id} style={!n.leida ? {background:'rgba(245,158,11,0.04)'} : {}}>
                      <td>
                        <div className={n.leida?'':'fw-semibold'} style={{fontSize:'0.9rem'}}>{getDestinatario(n)}</div>
                        <small className="text-muted">{n.destinatario_email||''}</small>
                      </td>
                      <td>
                        <span className={`badge bg-${tipoBadge(n.tipo)}`}>
                          <i className={`bi ${tipoIcon(n.tipo)} me-1`}></i>{n.tipo}
                        </span>
                      </td>
                      <td style={{maxWidth:280, fontSize:'0.88rem'}} className={n.leida?'text-muted':'fw-semibold'}>
                        <span style={{display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{n.mensaje}</span>
                      </td>
                      <td>
                        <span className={`badge bg-${n.leida?'success':'warning'}`}>{n.leida?'Leída':'No leída'}</span>
                      </td>
                      <td className="d-none d-md-table-cell text-muted small">
                        {n.fecha_creacion ? new Date(n.fecha_creacion).toLocaleDateString('es-PE') : '—'}
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          <button className={`btn btn-sm ${n.leida?'app-btn-edit':'app-btn-success'}`}
                            onClick={()=>handleToggleLeida(n)}
                            title={n.leida?'Marcar no leída':'Marcar leída'}
                            style={!n.leida ? {background:'rgba(5,150,105,0.1)',color:'#059669',border:'1px solid rgba(5,150,105,0.2)',borderRadius:8} : {}}>
                            <i className={`bi ${n.leida?'bi-envelope':'bi-envelope-check'}`}></i>
                          </button>
                          {allowEdit && <button className="btn btn-sm app-btn-edit" onClick={()=>handleOpenModal(n)} title="Editar"><i className="bi bi-pencil"></i></button>}
                          {allowDelete && <button className="btn btn-sm app-btn-delete" onClick={()=>setConfirmDelete({show:true,id:n.id!})} title="Eliminar"><i className="bi bi-trash3"></i></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal show={showModal} title={editingId?'Editar Notificación':'Nueva Notificación'} onClose={()=>{setShowModal(false);setEditingId(null);}} onSave={handleSave} error={error} success={success}>
        <form onSubmit={e=>e.preventDefault()}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Destinatario <span className="text-danger">*</span></label>
            <select className="form-select" value={formData.destinatario_id} onChange={e=>setFormData({...formData,destinatario_id:e.target.value})}>
              <option value="">Seleccionar destinatario</option>
              <optgroup label="Usuarios del sistema">
                {usuarios.map(u=><option key={u.id} value={u.id}>{u.nombre} ({u.tipo_usuario})</option>)}
              </optgroup>
              <optgroup label="Alumnos">
                {alumnos.map(a=><option key={a.id} value={a.id}>{a.primer_nombre} {a.apellido_paterno} ({a.numero_matricula})</option>)}
              </optgroup>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Tipo</label>
            <select className="form-select" value={formData.tipo} onChange={e=>setFormData({...formData,tipo:e.target.value})}>
              <option value="informacion">Información</option>
              <option value="alerta">Alerta</option>
              <option value="recordatorio">Recordatorio</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Mensaje <span className="text-danger">*</span></label>
            <textarea className="form-control" value={formData.mensaje} onChange={e=>setFormData({...formData,mensaje:e.target.value})} rows={4} placeholder="Escribe el mensaje..."/>
          </div>
          <div className="form-check ms-1">
            <input type="checkbox" className="form-check-input" id="leida" checked={formData.leida} onChange={e=>setFormData({...formData,leida:e.target.checked})}/>
            <label className="form-check-label" htmlFor="leida">Marcar como leída</label>
          </div>
        </form>
      </Modal>

      <ConfirmModal show={confirmDelete.show} title="Eliminar notificación"
        message="¿Seguro que deseas eliminar esta notificación?"
        confirmText="Sí, eliminar" variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={()=>setConfirmDelete({show:false,id:''})}/>
    </div>
  );
};

export default Notificaciones;
