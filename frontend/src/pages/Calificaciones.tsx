import React, { useEffect, useState } from 'react';
import { calificacionesService } from '../api/services';
import Modal from '../components/Modal';

interface Calificacion {
  id?: number;
  alumno_id: number;
  curso_id: number;
  nota: number;
  periodo: string;
}

const Calificaciones: React.FC = () => {
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Calificacion>({
    alumno_id: 0,
    curso_id: 0,
    nota: 0,
    periodo: '1'
  });

  useEffect(() => {
    fetchCalificaciones();
  }, []);

  const fetchCalificaciones = async () => {
    try {
      setLoading(true);
      const response = await calificacionesService.getAll();
      setCalificaciones(response.data?.datos || []);
      setError('');
    } catch (err: any) {
      setError('Error al cargar calificaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (calificacion?: Calificacion) => {
    if (calificacion) {
      setEditingId(calificacion.id || null);
      setFormData(calificacion);
    } else {
      setEditingId(null);
      setFormData({
        alumno_id: 0,
        curso_id: 0,
        nota: 0,
        periodo: '1'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.alumno_id || !formData.curso_id || formData.nota < 0 || formData.nota > 20) {
      setError('Por favor completa los campos correctamente (nota entre 0 y 20)');
      return;
    }

    try {
      if (editingId) {
        await calificacionesService.update(editingId, formData);
        setSuccess('Calificación actualizada correctamente');
      } else {
        await calificacionesService.create(formData);
        setSuccess('Calificación registrada correctamente');
      }
      handleCloseModal();
      fetchCalificaciones();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Error al guardar calificación');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta calificación?')) return;

    try {
      await calificacionesService.delete(id);
      setSuccess('Calificación eliminada correctamente');
      fetchCalificaciones();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Error al eliminar calificación');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const calculateStats = () => {
    const notas = calificaciones.map(c => c.nota);
    return {
      promedio: notas.length > 0 ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2) : 0,
      maxima: notas.length > 0 ? Math.max(...notas) : 0,
      minima: notas.length > 0 ? Math.min(...notas) : 0,
      total: calificaciones.length
    };
  };

  const stats = calculateStats();

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">
        <i className="bi bi-graph-up me-2"></i>
        Gestión de Calificaciones
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
          <div className="card dashboard-card border-info">
            <div className="card-body text-center">
              <h6 className="card-title text-muted">Promedio</h6>
              <h3 className="text-info">{stats.promedio}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card dashboard-card border-success">
            <div className="card-body text-center">
              <h6 className="card-title text-muted">Nota Máxima</h6>
              <h3 className="text-success">{stats.maxima}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card dashboard-card border-danger">
            <div className="card-body text-center">
              <h6 className="card-title text-muted">Nota Mínima</h6>
              <h3 className="text-danger">{stats.minima}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card dashboard-card border-warning">
            <div className="card-body text-center">
              <h6 className="card-title text-muted">Total Registros</h6>
              <h3 className="text-warning">{stats.total}</h3>
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
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Calificaciones</h5>
              <button 
                className="btn btn-sm btn-light"
                onClick={() => handleOpenModal()}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Registrar Calificación
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              {calificaciones.length === 0 ? (
                <div className="alert alert-info">No hay calificaciones registradas</div>
              ) : (
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Alumno ID</th>
                      <th>Curso ID</th>
                      <th>Nota</th>
                      <th>Período</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calificaciones.map((calificacion) => (
                      <tr key={calificacion.id}>
                        <td>{calificacion.id}</td>
                        <td>{calificacion.alumno_id}</td>
                        <td>{calificacion.curso_id}</td>
                        <td>
                          <strong className={calificacion.nota >= 11 ? 'text-success' : 'text-danger'}>
                            {calificacion.nota}
                          </strong>
                        </td>
                        <td>P{calificacion.periodo}</td>
                        <td>
                          <span className={`badge bg-${
                            calificacion.nota >= 15 ? 'success' :
                            calificacion.nota >= 11 ? 'info' :
                            calificacion.nota >= 6 ? 'warning' : 'danger'
                          }`}>
                            {calificacion.nota >= 15 ? 'Excelente' :
                             calificacion.nota >= 11 ? 'Aprobado' :
                             calificacion.nota >= 6 ? 'En desarrollo' : 'Desaprobado'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => handleOpenModal(calificacion)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(calificacion.id!)}
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
        title={editingId ? 'Editar Calificación' : 'Registrar Calificación'}
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
          <label className="form-label">Curso ID *</label>
          <input
            type="number"
            className="form-control"
            value={formData.curso_id}
            onChange={(e) => setFormData({ ...formData, curso_id: parseInt(e.target.value) })}
            placeholder="ID del curso"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Nota * (0-20)</label>
          <input
            type="number"
            className="form-control"
            value={formData.nota}
            onChange={(e) => setFormData({ ...formData, nota: parseFloat(e.target.value) })}
            min="0"
            max="20"
            step="0.5"
            placeholder="0-20"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Período *</label>
          <select
            className="form-control"
            value={formData.periodo}
            onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
          >
            <option value="1">Período 1</option>
            <option value="2">Período 2</option>
            <option value="3">Período 3</option>
            <option value="4">Período 4</option>
          </select>
        </div>
      </Modal>
    </div>
  );
};

export default Calificaciones;
