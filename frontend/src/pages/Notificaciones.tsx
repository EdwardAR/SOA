import React, { useEffect, useState } from 'react';
import { notificacionesService, usuariosService, alumnosService } from '../api/services';
import Modal from '../components/Modal';
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
      if (!allowEdit) return alert('No autorizado para editar notificaciones');
      setEditingId(notificacion.id || null);
      setFormData({
        id: notificacion.id,
        destinatario_id: notificacion.destinatario_id,
        tipo: notificacion.tipo,
        mensaje: notificacion.mensaje,
        leida: !!notificacion.leida
      });
    } else {
      if (!allowCreate) return alert('No autorizado para crear notificaciones');
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
      const payload = {
        destinatario_id: formData.destinatario_id,
        tipo: formData.tipo,
        mensaje: formData.mensaje,
        leida: !!formData.leida
      };

      if (editingId) {
        await notificacionesService.update(editingId, payload);
        setSuccess('Notificación actualizada correctamente');
      } else {
        await notificacionesService.create(payload);
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
    if (!window.confirm('¿Estás seguro de eliminar esta notificación?')) return;

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

  const stats = calculateStats();

  return (
    <div className="screen-page page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="badge rounded-pill bg-light text-primary px-3 py-2">Gestión académica</span>
          <span className="badge rounded-pill bg-white text-dark px-3 py-2">Responsive</span>
        </div>
        <h1 className="page-hero-title">
          <i className="bi bi-bell me-2"></i>
          Centro de Notificaciones
        </h1>
        <p className="page-hero-subtitle">Comunica avisos y alertas con una presentación más ordenada y una lectura cómoda en cualquier pantalla.</p>
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
      <div className="row summary-grid g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="summary-mini-card border-success">
            <div className="summary-label">Leídas</div>
            <div className="summary-value text-success">{stats.leidas}</div>
            <div className="summary-note">Mensajes revisados</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="summary-mini-card border-warning">
            <div className="summary-label">No Leídas</div>
            <div className="summary-value text-warning">{stats.noleidas}</div>
            <div className="summary-note">Pendientes de atención</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="summary-mini-card border-info">
            <div className="summary-label">Información</div>
            <div className="summary-value text-info">{stats.informaciones}</div>
            <div className="summary-note">Avisos informativos</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="summary-mini-card border-danger">
            <div className="summary-label">Alertas</div>
            <div className="summary-value text-danger">{stats.alertas}</div>
            <div className="summary-note">Casos prioritarios</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card table-shell">
          <div className="card-header bg-info text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Notificaciones</h5>
              {allowCreate && (
                <button 
                  className="btn btn-sm btn-light"
                  onClick={() => handleOpenModal()}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Nueva Notificación
                </button>
              )}
            </div>
          </div>
          <div className="card-body">
            <div className="row summary-grid g-3 mb-3">
              <div className="col-12 col-md-3">
                <div className="summary-mini-card">
                  <div className="summary-label">Notificaciones</div>
                  <div className="summary-value">{notificaciones.length}</div>
                  <div className="summary-note">Mensajes totales</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="summary-mini-card">
                  <div className="summary-label">Leídas</div>
                  <div className="summary-value">{stats.leidas}</div>
                  <div className="summary-note">Mensajes atendidos</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="summary-mini-card">
                  <div className="summary-label">No leídas</div>
                  <div className="summary-value">{stats.noleidas}</div>
                  <div className="summary-note">Pendientes visibles</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="summary-mini-card">
                  <div className="summary-label">Alertas</div>
                  <div className="summary-value">{stats.alertas}</div>
                  <div className="summary-note">Casos prioritarios</div>
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
              placeholder="Ingrese ID de usuario manualmente"
              value={''}
              onChange={(e) => setFormData({ ...formData, destinatario_id: e.target.value })}
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
