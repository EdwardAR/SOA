import React, { useEffect, useState } from 'react';
import { notificacionesService } from '../api/services';
import Modal from '../components/Modal';

interface Notificacion {
  id?: number;
  destinatario_id: number;
  tipo: string;
  mensaje: string;
  leida: boolean;
  fecha_creacion?: string;
}

const Notificaciones: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Notificacion>({
    destinatario_id: 0,
    tipo: 'informacion',
    mensaje: '',
    leida: false
  });

  useEffect(() => {
    fetchNotificaciones();
  }, []);

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
      setEditingId(notificacion.id || null);
      setFormData(notificacion);
    } else {
      setEditingId(null);
      setFormData({
        destinatario_id: 0,
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

  const handleDelete = async (id: number) => {
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

  const stats = calculateStats();

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">
        <i className="bi bi-bell me-2"></i>
        Centro de Notificaciones
      </h1>

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
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card dashboard-card border-success">
            <div className="card-body text-center">
              <h6 className="card-title text-muted">Leídas</h6>
              <h3 className="text-success">{stats.leidas}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card dashboard-card border-warning">
            <div className="card-body text-center">
              <h6 className="card-title text-muted">No Leídas</h6>
              <h3 className="text-warning">{stats.noleidas}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card dashboard-card border-info">
            <div className="card-body text-center">
              <h6 className="card-title text-muted">Información</h6>
              <h3 className="text-info">{stats.informaciones}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card dashboard-card border-danger">
            <div className="card-body text-center">
              <h6 className="card-title text-muted">Alertas</h6>
              <h3 className="text-danger">{stats.alertas}</h3>
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
          <div className="card-header bg-info text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Notificaciones</h5>
              <button 
                className="btn btn-sm btn-light"
                onClick={() => handleOpenModal()}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Nueva Notificación
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              {notificaciones.length === 0 ? (
                <div className="alert alert-info">No hay notificaciones</div>
              ) : (
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Para</th>
                      <th>Tipo</th>
                      <th>Mensaje</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notificaciones.map((notificacion) => (
                      <tr key={notificacion.id} className={notificacion.leida ? '' : 'table-active'}>
                        <td>{notificacion.id}</td>
                        <td>{notificacion.destinatario_id}</td>
                        <td>
                          <span className={`badge bg-${
                            notificacion.tipo === 'alerta' ? 'danger' : 'info'
                          }`}>
                            {notificacion.tipo}
                          </span>
                        </td>
                        <td className={notificacion.leida ? '' : 'fw-bold'}>{notificacion.mensaje}</td>
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
                          <button 
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => handleOpenModal(notificacion)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(notificacion.id!)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
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
          <label className="form-label">Destinatario ID *</label>
          <input
            type="number"
            className="form-control"
            value={formData.destinatario_id}
            onChange={(e) => setFormData({ ...formData, destinatario_id: parseInt(e.target.value) })}
            placeholder="ID del destinatario"
          />
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
