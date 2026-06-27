import React, { useEffect, useState } from 'react';
import { pagosService, alumnosService } from '../api/services';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';
import { useSortableData } from '../utils/tableSort';
import { validarPago } from '../utils/validators';

interface Pago {
  id?: string;
  alumno_id: string;
  monto: number;
  concepto: string;
  estado: string;
  fecha_pago: string | null;
  metodo_pago: string | null;
  estado_pago?: string;
  observaciones?: string | null;
  alumno_nombre?: string;
  alumno_numero_matricula?: string;
}

const CONCEPTOS_PAGO = [
  'Matrícula','Cuota mensual - Mayo','Cuota mensual - Junio','Cuota mensual - Julio',
  'Cuota mensual - Agosto','Cuota mensual - Setiembre','Cuota mensual - Octubre',
  'Cuota mensual - Noviembre','Cuota mensual - Diciembre','Uniforme',
  'Carnet estudiantil','Material educativo','Examen extraordinario',
];
const CONCEPTOS_MONTO: Record<string, number> = {
  'Matrícula':850,'Cuota mensual - Mayo':1550,'Cuota mensual - Junio':1550,
  'Cuota mensual - Julio':1550,'Cuota mensual - Agosto':1550,'Cuota mensual - Setiembre':1550,
  'Cuota mensual - Octubre':1550,'Cuota mensual - Noviembre':1550,'Cuota mensual - Diciembre':1550,
  'Uniforme':740,'Carnet estudiantil':555,'Material educativo':444,'Examen extraordinario':185,
};
const esConceptoFijo = (c: string) => Object.prototype.hasOwnProperty.call(CONCEPTOS_MONTO, c);
const toDate = (v?: string | null) => { if (!v) return new Date().toISOString().split('T')[0]; const p = new Date(v); return isNaN(p.getTime()) ? new Date().toISOString().split('T')[0] : p.toISOString().split('T')[0]; };
const normEstado = (v?: string | null) => { const s = (v||'pendiente').toLowerCase(); return ['pendiente','pagado','vencido','cancelado','rechazado'].includes(s) ? s : 'pendiente'; };
const normMetodo = (v?: string | null) => (v||'transferencia').toLowerCase();
const estadoBadge = (e: string) => e==='pagado' ? 'success' : e==='pendiente' ? 'warning' : 'danger';

const Pagos: React.FC = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; id: string; label: string }>({ show: false, id: '', label: '' });
  const [formData, setFormData] = useState<Pago>({ alumno_id:'', monto:0, concepto:'', estado:'pendiente', fecha_pago: toDate(null), metodo_pago:'transferencia' });

  const { sortConfig, requestSort, sortedRows: pagosOrdenados } = useSortableData(pagos, 'fecha_pago');
  const { user } = useAuth();
  const role = user?.tipo_usuario;
  const allowCreate = can(role, 'pagos', 'create');
  const allowEdit = can(role, 'pagos', 'edit');
  const allowDelete = can(role, 'pagos', 'delete');

  useEffect(() => { fetchPagos(); fetchAlumnos(); }, []);

  const fetchAlumnos = async () => { try { setAlumnos((await alumnosService.getAll()).data?.datos || []); } catch {} };
  const fetchPagos = async () => {
    try { setLoading(true); setPagos((await pagosService.getAll()).data?.datos || []); setError(''); }
    catch { setError('Error al cargar pagos'); } finally { setLoading(false); }
  };

  const handleOpenModal = (pago?: Pago) => {
    setError(''); setSuccess('');
    if (pago) {
      setEditingId(pago.id || null);
      setFormData({ id: pago.id, alumno_id: pago.alumno_id, monto: Number(pago.monto)||0,
        concepto: pago.concepto||'', estado: normEstado(pago.estado||pago.estado_pago),
        fecha_pago: toDate(pago.fecha_pago), metodo_pago: normMetodo(pago.metodo_pago),
        observaciones: pago.observaciones||null });
    } else {
      setEditingId(null);
      setFormData({ alumno_id:'', monto:0, concepto:'', estado:'pendiente', fecha_pago: toDate(null), metodo_pago:'transferencia' });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.alumno_id || !formData.monto || !formData.concepto) { setError('Completa todos los campos'); return; }
    const errores = validarPago(formData);
    if (errores.length > 0) { setError(errores.join('. ')); return; }
    try {
      const payload = { alumno_id: formData.alumno_id, monto: formData.monto, concepto: formData.concepto,
        estado: normEstado(formData.estado), fecha_pago: toDate(formData.fecha_pago),
        metodo_pago: normMetodo(formData.metodo_pago), observaciones: formData.observaciones };
      if (editingId) { await pagosService.update(editingId, payload); setSuccess('Pago actualizado'); }
      else { await pagosService.create(payload); setSuccess('Pago registrado'); }
      setShowModal(false); setEditingId(null); fetchPagos(); setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error al guardar'); }
  };

  const handleDeleteConfirm = async () => {
    try { await pagosService.delete(confirmDelete.id); setConfirmDelete({ show:false,id:'',label:'' });
      setSuccess('Pago eliminado'); fetchPagos(); setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setConfirmDelete({ show:false,id:'',label:'' }); setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error al eliminar'); }
  };

  const filtrados = pagosOrdenados.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.alumno_nombre||'').toLowerCase().includes(q) || (p.concepto||'').toLowerCase().includes(q) || (p.estado||'').toLowerCase().includes(q);
  });

  const totalPagado = pagos.filter(p=>p.estado==='pagado').reduce((s,p)=>s+Number(p.monto),0);
  const totalPendiente = pagos.filter(p=>p.estado==='pendiente').reduce((s,p)=>s+Number(p.monto),0);
  const total = pagos.reduce((s,p)=>s+Number(p.monto),0);

  const SortIcon = ({ col }: { col: string }) =>
    sortConfig.key === col ? <i className={`bi bi-caret-${sortConfig.direction==='asc'?'up':'down'}-fill ms-1`} style={{fontSize:'0.7rem'}}></i>
      : <i className="bi bi-chevron-expand ms-1 text-muted" style={{fontSize:'0.65rem'}}></i>;

  return (
    <div className="screen-page page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="hero-pill"><i className="bi bi-credit-card me-1"></i> Finanzas</span>
          <span className="hero-pill-count">{pagos.length} registros</span>
        </div>
        <h1 className="page-hero-title"><i className="bi bi-credit-card me-2"></i>Gestión de Pagos</h1>
        <p className="page-hero-subtitle">Consulta y administra pagos de matrículas y cuotas mensuales.</p>
      </div>

      {success && <div className="alert alert-success d-flex align-items-center gap-2 mb-3"><i className="bi bi-check-circle-fill"></i><span>{success}</span></div>}
      {error && !showModal && <div className="alert alert-danger d-flex align-items-center gap-2 mb-3"><i className="bi bi-x-circle-fill"></i><span>{error}</span><button className="btn-close ms-auto" onClick={()=>setError('')}/></div>}

      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { label:'Total pagado', val:`S/. ${totalPagado.toFixed(2)}`, icon:'bi-check-circle', color:'metric-success' },
          { label:'Total pendiente', val:`S/. ${totalPendiente.toFixed(2)}`, icon:'bi-clock', color:'metric-warning' },
          { label:'Monto total', val:`S/. ${total.toFixed(2)}`, icon:'bi-wallet2', color:'metric-primary' },
          { label:'Transacciones', val:pagos.length, icon:'bi-receipt', color:'metric-info' },
        ].map(s => (
          <div className="col-6 col-md-3" key={s.label}>
            <div className={`card metric-card ${s.color}`}>
              <div className="card-body stat-card text-center">
                <i className={`bi ${s.icon} metric-icon`}></i>
                <div className="metric-value" style={{fontSize:'1.5rem'}}>{loading?'…':s.val}</div>
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
              <h5 className="mb-0 fw-bold"><i className="bi bi-credit-card me-2"></i>Pagos
                <span className="badge bg-white text-primary ms-2 fw-semibold" style={{fontSize:'0.78rem'}}>{filtrados.length}</span>
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
                    <th onClick={()=>requestSort('concepto')} style={{cursor:'pointer'}}>Concepto <SortIcon col="concepto"/></th>
                    <th onClick={()=>requestSort('monto')} style={{cursor:'pointer'}}>Monto <SortIcon col="monto"/></th>
                    <th onClick={()=>requestSort('estado')} style={{cursor:'pointer'}}>Estado <SortIcon col="estado"/></th>
                    <th onClick={()=>requestSort('fecha_pago')} style={{cursor:'pointer'}} className="d-none d-md-table-cell">Fecha <SortIcon col="fecha_pago"/></th>
                    <th onClick={()=>requestSort('metodo_pago')} style={{cursor:'pointer'}} className="d-none d-lg-table-cell">Método <SortIcon col="metodo_pago"/></th>
                    {(allowEdit||allowDelete) && <th className="text-end" style={{width:110}}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length===0 ? (
                    <tr><td colSpan={7} className="text-center py-5 text-muted">
                      <i className="bi bi-credit-card" style={{fontSize:'2.5rem',opacity:0.25}}></i>
                      <p className="mt-2 mb-0">{search?'Sin resultados':'No hay pagos registrados'}</p>
                    </td></tr>
                  ) : filtrados.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="fw-semibold" style={{fontSize:'0.9rem'}}>{p.alumno_nombre||'—'}</div>
                        <small className="text-muted">{p.alumno_numero_matricula||''}</small>
                      </td>
                      <td style={{fontSize:'0.88rem'}}>{p.concepto}</td>
                      <td className="fw-bold" style={{color:'#0f172a'}}>S/. {Number(p.monto).toFixed(2)}</td>
                      <td><span className={`badge bg-${estadoBadge(p.estado)}`}>{p.estado}</span></td>
                      <td className="d-none d-md-table-cell text-muted small">{p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-PE') : '—'}</td>
                      <td className="d-none d-lg-table-cell text-muted small">{p.metodo_pago||'—'}</td>
                      {(allowEdit||allowDelete) && (
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end">
                            {allowEdit && <button className="btn btn-sm app-btn-edit" onClick={()=>handleOpenModal(p as Pago)} title="Editar"><i className="bi bi-pencil"></i></button>}
                            {allowDelete && <button className="btn btn-sm app-btn-delete" onClick={()=>setConfirmDelete({show:true,id:p.id!,label:`${p.alumno_nombre} — ${p.concepto}`})} title="Eliminar"><i className="bi bi-trash3"></i></button>}
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

      <Modal show={showModal} title={editingId?'Editar Pago':'Registrar Pago'} onClose={()=>{setShowModal(false);setEditingId(null);}} onSave={handleSave} error={error} success={success}>
        <form onSubmit={e=>e.preventDefault()}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Alumno <span className="text-danger">*</span></label>
            <select className="form-select" value={formData.alumno_id} onChange={e=>setFormData({...formData,alumno_id:e.target.value})}>
              <option value="">Seleccionar alumno</option>
              {alumnos.map(a=><option key={a.id} value={a.id}>{a.primer_nombre} {a.apellido_paterno} ({a.numero_matricula})</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Concepto</label>
            <select className="form-select" value={formData.concepto} onChange={e=>{const c=e.target.value;setFormData({...formData,concepto:c,monto:CONCEPTOS_MONTO[c]??formData.monto});}}>
              <option value="">Seleccionar concepto</option>
              {CONCEPTOS_PAGO.map(c=><option key={c} value={c}>{c}</option>)}
              <option value="Otro">Otro</option>
            </select>
            {formData.concepto==='Otro' && <input type="text" className="form-control mt-2" value={formData.observaciones||''} onChange={e=>setFormData({...formData,observaciones:e.target.value})} placeholder="Especifica el concepto"/>}
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Monto (S/.)</label>
            <input type="number" className="form-control" value={formData.monto} onChange={e=>setFormData({...formData,monto:parseFloat(e.target.value)})} step="0.01" readOnly={esConceptoFijo(formData.concepto)&&formData.concepto!=='Otro'}/>
            {esConceptoFijo(formData.concepto)&&formData.concepto!=='Otro' && <div className="form-text">Monto fijo según concepto.</div>}
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Estado</label>
              <select className="form-select" value={normEstado(formData.estado)} onChange={e=>setFormData({...formData,estado:e.target.value})}>
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
                <option value="vencido">Vencido</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Método de pago</label>
              <select className="form-select" value={normMetodo(formData.metodo_pago)} onChange={e=>setFormData({...formData,metodo_pago:e.target.value})}>
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="form-label fw-semibold">Fecha de pago</label>
            <input type="date" className="form-control" value={toDate(formData.fecha_pago)} onChange={e=>setFormData({...formData,fecha_pago:e.target.value})}/>
          </div>
        </form>
      </Modal>

      <ConfirmModal show={confirmDelete.show} title="Eliminar pago"
        message={`¿Seguro que deseas eliminar el pago de ${confirmDelete.label}?`}
        confirmText="Sí, eliminar" variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={()=>setConfirmDelete({show:false,id:'',label:''})}/>
    </div>
  );
};

export default Pagos;
