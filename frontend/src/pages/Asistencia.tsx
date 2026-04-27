import React, { useEffect, useState } from 'react';
import { asistenciaService } from '../api/services';
import Modal from '../components/Modal';

interface Asistencia {
  id?: number;
  alumno_id: number;
  fecha: string;
  estado: string;
  observacion?: string;
}

const Asistencia: React.FC = () => {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Asistencia>({
    alumno_id: 0,
    fecha: new Date().toISOString().split('T')[0],
    estado: 'presente',
    observacion: ''
  });

  useEffect(() => {
    fetchAsistencias();
  }, []);

  const fetchAsistencias = async () => {
    try {
      setLoading(true);
      const response = await asistenciaService.getAll();
      setAsistencias(response.data?.datos || []);
      setError('');
    } catch (err: any) {
      setError('Error al cargar asistencias');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (asistencia?: Asistencia) => {
    if (asistencia) {
      setEditingId(asistencia.id || null);
      setFormData(asistencia);
    } else {
      setEditingId(null);
      setFormData({
        alumno_id: 0,
        fecha: new Date().toISOString().split('T')[0],
        estado: 'presente',
        observacion: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.alumno_id) {
      setError('Por favor selecciona un alumno');
      return;
    }

    try {
      if (editingId) {
        await asistenciaService.update(editingId, formData);
        setSuccess('Asistencia actualizada correctamente');
      } else {
        await asistenciaService.create(formData);
        setSuccess('Asistencia registrada correctamente');
      }
      handleCloseModal();
      fetchAsistencias();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Error al guardar asistencia');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      await asistenciaService.delete(id);
      setSuccess('Asistencia eliminada correctamente');
      fetchAsistencias();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Error al eliminar asistencia');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const calculateStats = () => {
    return {
      presentes: asistencias.filter(a => a.estado === 'presente').length,
      ausentes: asistencias.filter(a => a.estado === 'ausente').length,
      tardanzas: asistencias.filter(a => a.estado === 'tardanza').length,
      total: asistencias.length
    };
  };

  const stats = calculateStats();

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">
        <i className="bi bi-clipboard-check me-2"></i>
        Control de Asistencia
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
              <h6 className="card-title text-muted">Presentes</h6>
              <h3 className="text-success">{stats.presentes}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card dashboard-card border-danger">
            <div className="card-body text-center">
              <h6 className="card-title text-muted">Ausentes</h6>
              <h3 className="text-danger">{stats.ausentes}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card dashboard-card border-warning">
            <div className="card-body text-center">
              <h6 className="card-title text-muted">Tardanzas</h6>
              <h3 className="text-warning">{stats.tardanzas}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card dashboard-card border-info">
            <div className="card-body text-center">
              <h6 className="card-title text-muted">Total</h6>
              <h3 className="text-info">{stats.total}</h3>
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
          <div className="card-header bg-success text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Asistencias</h5>
              <button 
                className="btn btn-sm btn-light"
                onClick={() => handleOpenModal()}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Registrar Asistencia
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              {asistencias.length === 0 ? (
                <div className="alert alert-info">No hay registros de asistencia</div>
              ) : (
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Alumno ID</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Observación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asistencias.map((asistencia) => (
                      <tr key={asistencia.id}>
                        <td>{asistencia.id}</td>
                        <td>{asistencia.alumno_id}</td>
                        <td>{new Date(asistencia.fecha).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge bg-${
                            asistencia.estado === 'presente' ? 'success' :
                            asistencia.estado === 'ausente' ? 'danger' : 'warning'
                          }`}>
                            {asistencia.estado}
                          </span>
                        </td>
                        <td>{asistencia.observacion || '-'}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => handleOpenModal(asistencia)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(asistencia.id!)}
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
        title={editingId ? 'Editar Asistencia' : 'Registrar Asistencia'}
        onClose={handleCloseModal}
        onSave={handleSave}
      >
        <div className="mb-3">
          <label className="form-label">Alumno ID *</label>
          <input
            type="number"
            className="form-control"
            value={formData.alumno_id}
            onChange={(e) => setFormData({ ...formData, alumno_id: parseInt(e.target.value) })}
            placeholder="ID del alumno"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Fecha</label>
          <input
            type="date"
            className="form-control"
            value={formData.fecha}
            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Estado *</label>
          <select
            className="form-control"
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
          >
            <option value="presente">Presente</option>
            <option value="ausente">Ausente</option>
            <option value="tardanza">Tardanza</option>
            <option value="justificado">Justificado</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Observación</label>
          <textarea
            className="form-control"
            value={formData.observacion}
            onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
            placeholder="Notas adicionales"
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Asistencia;
