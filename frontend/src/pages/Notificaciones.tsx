import React, { useEffect, useState } from 'react';
import { notificacionesService, usuariosService, alumnosService } from '../api/services';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
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

const Notificaciones: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Notificacion>({
    destinatario_id: '',
    tipo: 'informacion',
    mensaje: '',
    leida: false
  });
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const { sortConfig, requestSort, sortedRows: notificacionesOrdenadas } = useSortableData(notificaciones, 'fecha_creacion');

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  useEffect(() => {
    fetchRelacionados();
  }, []);

  const fetchRelacionados = async () => {
    try {
      const [uResp, aResp] = await Promise.all([usuariosService.getAll(), alumnosService.getAll()]);
      setUsuarios(uResp.data?.datos || []);
      setAlumnos(aResp.data?.datos || []);
    } catch (err) {
      console.error('Error cargando usuarios/alumnos:', err);
    }
  };

  const { user } = useAuth();
  const { notify, confirm } = useToast();
  const role = user?.tipo_usuario;
  const allowCreate = can(role, 'notificaciones', 'create');
  const allowEdit = can(role, 'notificaciones', 'edit');
  const allowDelete = can(role, 'notificaciones', 'delete');

  const fetchNotificaciones = async () => {
    try {
      setLoading(true);
      const response = await notificacionesService.getAll();
      setNotificaciones(response.data?.datos || []);
      setError('');
    } catch (err: any) {
      setError('Error al cargar notificaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (notificacion?: Notificacion) => {
    if (notificacion) {
      if (!allowEdit) {
        notify({ message: 'No autorizado para editar notificaciones', type: 'warning' });
        return;
      }
      setEditingId(notificacion.id || null);
      setFormData(notificacion as Notificacion);
    } else {
      if (!allowCreate) {
        notify({ message: 'No autorizado para crear notificaciones', type: 'warning' });
        return;
      }
      setEditingId(null);
      setFormData({
        destinatario_id: '',
        tipo: 'informacion',
        mensaje: '',
        leida: false
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.destinatario_id || !formData.mensaje) {
      setError('Por favor completa los campos obligatorios');
      return;
    }

    try {
      if (editingId) {
        await notificacionesService.update(editingId, formData);
        setSuccess('Notificación actualizada correctamente');
      } else {
        await notificacionesService.create(formData);
        setSuccess('Notificación enviada correctamente');
      }
      handleCloseModal();
      fetchNotificaciones();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Error al guardar notificación');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: '¿Estás seguro de eliminar esta notificación?' }))) return;

    try {
      await notificacionesService.delete(id);
      setSuccess('Notificación eliminada correctamente');
      fetchNotificaciones();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Error al eliminar notificación');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const calculateStats = () => {
    return {
      leidas: notificaciones.filter(n => n.leida).length,
      noleidas: notificaciones.filter(n => !n.leida).length,
      informaciones: notificaciones.filter(n => n.tipo === 'informacion').length,
      alertas: notificaciones.filter(n => n.tipo === 'alerta').length
    };
  };

  const getDestinatarioNombre = (id: string) => {
    if (!id) return '-';
    const u = usuarios.find((x) => x.id === id);
    if (u) return u.nombre;
    const a = alumnos.find((x) => x.id === id);
    if (a) return `${a.primer_nombre} ${a.apellido_paterno}`;
    return id;
  };

  const getTipoBadge = (tipo: string) => {
    if (tipo === 'alerta') return 'danger';
    if (tipo === 'urgente') return 'warning';
    return 'info';
  };

  const getTipoIcon = (tipo: string) => {
    if (tipo === 'alerta') return 'bi-exclamation-triangle';
    if (tipo === 'urgente') return 'bi-lightning-charge';
    if (tipo === 'recordatorio') return 'bi-calendar-event';
    return 'bi-info-circle';
  };

  const stats = calculateStats();

  return (
    <div className="page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <h1 className="page-hero-title">
          <i className="bi bi-bell me-2"></i>
          Centro de Notificaciones
        </h1>
        <p className="page-hero-subtitle">Visualiza y envía alertas, avisos e información relevante a la comunidad escolar</p>
      </div>

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

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card dashboard-card h-100" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="card-body text-center py-4">
              <h6 className="text-muted small mb-1 fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Leídas</h6>
              <h2 className="text-success fw-bold mb-0">{stats.leidas}</h2>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card dashboard-card h-100" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="card-body text-center py-4">
              <h6 className="text-muted small mb-1 fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>No Leídas</h6>
              <h2 className="text-warning fw-bold mb-0">{stats.noleidas}</h2>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card dashboard-card h-100" style={{ borderLeft: '4px solid #0ea5e9' }}>
            <div className="card-body text-center py-4">
              <h6 className="text-muted small mb-1 fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Información</h6>
              <h2 className="text-info fw-bold mb-0">{stats.informaciones}</h2>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card dashboard-card h-100" style={{ borderLeft: '4px solid #ef4444' }}>
            <div className="card-body text-center py-4">
              <h6 className="text-muted small mb-1 fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Alertas</h6>
              <h2 className="text-danger fw-bold mb-0">{stats.alertas}</h2>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card">
          <div className="card-header" style={{ background: 'rgba(102, 126, 234, 0.05)', borderBottom: '1px solid rgba(102, 126, 234, 0.1)', padding: '16px 20px' }}>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-dark">Listado de Notificaciones</h5>
              {allowCreate && (
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => handleOpenModal()}
                >
                  <i className="bi bi-plus-circle"></i>
                  Nueva Notificación
                </button>
              )}
            </div>
          </div>
          <div className="card-body">
            <div className="notification-inbox mb-4">
              {notificacionesOrdenadas.slice(0, 6).map((notificacion) => (
                <article className={`inbox-item ${notificacion.leida ? '' : 'inbox-unread'}`} key={`inbox-${notificacion.id}`}>
                  <div className={`inbox-icon inbox-${getTipoBadge(notificacion.tipo)}`}>
                    <i className={`bi ${getTipoIcon(notificacion.tipo)}`}></i>
                  </div>
                  <div>
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                      <strong>{notificacion.destinatario_nombre || getDestinatarioNombre(notificacion.destinatario_id)}</strong>
                      <span className={`badge bg-${getTipoBadge(notificacion.tipo)}`}>{notificacion.tipo}</span>
                      {!notificacion.leida && <span className="badge bg-warning">Nuevo</span>}
                    </div>
                    <p>{notificacion.mensaje}</p>
                    <small>
                      {notificacion.fecha_creacion
                        ? new Date(notificacion.fecha_creacion).toLocaleString()
                        : 'Fecha no registrada'}
                    </small>
                  </div>
                </article>
              ))}
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-3">
                <div className="p-3 bg-light rounded border">
                  <div className="text-muted small">Notificaciones</div>
                  <div className="fs-4 fw-bold">{notificaciones.length}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 bg-light rounded border">
                  <div className="text-muted small">Leídas</div>
                  <div className="fs-4 fw-bold">{stats.leidas}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 bg-light rounded border">
                  <div className="text-muted small">No leídas</div>
                  <div className="fs-4 fw-bold">{stats.noleidas}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 bg-light rounded border">
                  <div className="text-muted small">Alertas</div>
                  <div className="fs-4 fw-bold">{stats.alertas}</div>
                </div>
              </div>
            </div>
            <div className="table-responsive">
              {notificaciones.length === 0 ? (
                <div className="alert alert-info">No hay notificaciones</div>
              ) : (
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('id')}>
                        ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('destinatario_nombre')}>
                        Para {sortConfig.key === 'destinatario_nombre' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('tipo')}>
                        Tipo {sortConfig.key === 'tipo' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('mensaje')}>
                        Mensaje {sortConfig.key === 'mensaje' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('leida')}>
                        Estado {sortConfig.key === 'leida' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('fecha_creacion')}>
                        Fecha {sortConfig.key === 'fecha_creacion' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notificacionesOrdenadas.map((notificacion) => (
                      <tr key={notificacion.id} className={notificacion.leida ? '' : 'table-active'}>
                        <td>{notificacion.id}</td>
                        <td>
                          <div className="fw-semibold">
                            {notificacion.destinatario_nombre || getDestinatarioNombre(notificacion.destinatario_id)}
                          </div>
                          <small className="text-muted">
                            {notificacion.destinatario_email || notificacion.destinatario_id}
                          </small>
                        </td>
                        <td>
                          <span className={`badge bg-${getTipoBadge(notificacion.tipo)}`}>
                            {notificacion.tipo}
                          </span>
                        </td>
                        <td className={notificacion.leida ? '' : 'fw-bold'}>
                          {notificacion.mensaje}
                        </td>
                        <td>
                          <span className={`badge bg-${notificacion.leida ? 'success' : 'warning'}`}>
                            {notificacion.leida ? 'Leída' : 'No leída'}
                          </span>
                        </td>
                        <td>
                          {notificacion.fecha_creacion 
                            ? new Date(notificacion.fecha_creacion).toLocaleDateString() 
                            : '-'}
                        </td>
                        <td>
                          {allowEdit && (
                            <button 
                              className="btn btn-sm btn-primary me-2"
                              onClick={() => handleOpenModal(notificacion)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                          {allowDelete && (
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(notificacion.id!)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        show={showModal}
        title={editingId ? 'Editar Notificación' : 'Nueva Notificación'}
        onClose={handleCloseModal}
        onSave={handleSave}
      >
        <div className="mb-3">
          <label className="form-label">Destinatario *</label>
          <select
            className="form-select"
            value={formData.destinatario_id as any}
            onChange={(e) => setFormData({ ...formData, destinatario_id: e.target.value as any })}
          >
            <option value="">Seleccionar destinatario</option>
            <optgroup label="Usuarios">
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.tipo_usuario})</option>
              ))}
            </optgroup>
            <optgroup label="Alumnos">
              {alumnos.map(a => (
                <option key={a.id} value={a.id}>{a.primer_nombre} {a.apellido_paterno} ({a.numero_matricula})</option>
              ))}
            </optgroup>
            <option value="__other">Otro (manual)</option>
          </select>
          {String(formData.destinatario_id) === '__other' && (
            <input
              className="form-control mt-2"
              placeholder="Ingrese nombre o ID manualmente"
              value={formData.mensaje || ''}
              onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
            />
          )}
        </div>
        <div className="mb-3">
          <label className="form-label">Tipo *</label>
          <select
            className="form-control"
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
          >
            <option value="informacion">Información</option>
            <option value="alerta">Alerta</option>
            <option value="recordatorio">Recordatorio</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Mensaje *</label>
          <textarea
            className="form-control"
            value={formData.mensaje}
            onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
            placeholder="Ingresa el mensaje de la notificación"
            rows={4}
          />
        </div>
        <div className="mb-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="leida"
            checked={formData.leida}
            onChange={(e) => setFormData({ ...formData, leida: e.target.checked })}
          />
          <label className="form-check-label" htmlFor="leida">
            Marcar como leída
          </label>
        </div>
      </Modal>
    </div>
  );
};

export default Notificaciones;
