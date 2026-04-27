import React, { useEffect, useState } from 'react';
import { pagosService } from '../api/services';
import Modal from '../components/Modal';

interface Pago {
  id?: number;
  alumno_id: number;
  monto: number;
  concepto: string;
  estado: string;
  fecha_pago: string;
  metodo_pago: string;
}

const Pagos: React.FC = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Pago>({
    alumno_id: 0,
    monto: 0,
    concepto: '',
    estado: 'pendiente',
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago: 'transferencia'
  });

  useEffect(() => {
    fetchPagos();
  }, []);

  const fetchPagos = async () => {
    try {
      setLoading(true);
      const response = await pagosService.getAll();
      setPagos(response.data?.datos || []);
      setError('');
    } catch (err: any) {
      setError('Error al cargar pagos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pago?: Pago) => {
    if (pago) {
      setEditingId(pago.id || null);
      setFormData(pago);
    } else {
      setEditingId(null);
      setFormData({
        alumno_id: 0,
        monto: 0,
        concepto: '',
        estado: 'pendiente',
        fecha_pago: new Date().toISOString().split('T')[0],
        metodo_pago: 'transferencia'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.alumno_id || !formData.monto || !formData.concepto) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      if (editingId) {
        await pagosService.update(editingId, formData);
        setSuccess('Pago actualizado correctamente');
      } else {
        await pagosService.create(formData);
        setSuccess('Pago registrado correctamente');
      }
      handleCloseModal();
      fetchPagos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Error al guardar pago');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este pago?')) return;

    try {
      await pagosService.delete(id);
      setSuccess('Pago eliminado correctamente');
      fetchPagos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Error al eliminar pago');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const calculateTotals = () => {
    return {
      totalPagado: pagos.filter(p => p.estado === 'pagado').reduce((sum, p) => sum + p.monto, 0),
      totalPendiente: pagos.filter(p => p.estado === 'pendiente').reduce((sum, p) => sum + p.monto, 0),
      total: pagos.reduce((sum, p) => sum + p.monto, 0),
      transacciones: pagos.length
    };
  };

  const totals = calculateTotals();

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">
        <i className="bi bi-credit-card me-2"></i>
        Gestión de Pagos
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

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card dashboard-card border-success">
            <div className="card-body text-center">
              <h6 className="card-title text-muted">Pagado</h6>
              <h3 className="text-success">${totals.totalPagado.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card dashboard-card border-danger">
            <div className="card-body text-center">
              <h6 className="card-title text-muted">Pendiente</h6>
              <h3 className="text-danger">${totals.totalPendiente.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card dashboard-card border-primary">
            <div className="card-body text-center">
              <h6 className="card-title text-muted">Total</h6>
              <h3 className="text-primary">${totals.total.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card dashboard-card border-info">
            <div className="card-body text-center">
              <h6 className="card-title text-muted">Transacciones</h6>
              <h3 className="text-info">{totals.transacciones}</h3>
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
          <div className="card-header bg-warning text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Pagos</h5>
              <button 
                className="btn btn-sm btn-light"
                onClick={() => handleOpenModal()}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Registrar Pago
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              {pagos.length === 0 ? (
                <div className="alert alert-info">No hay pagos registrados</div>
              ) : (
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Alumno ID</th>
                      <th>Concepto</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Fecha Pago</th>
                      <th>Método</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.map((pago) => (
                      <tr key={pago.id}>
                        <td>{pago.id}</td>
                        <td>{pago.alumno_id}</td>
                        <td>{pago.concepto}</td>
                        <td>${pago.monto.toFixed(2)}</td>
                        <td>
                          <span className={`badge bg-${pago.estado === 'pagado' ? 'success' : 'warning'}`}>
                            {pago.estado}
                          </span>
                        </td>
                        <td>{new Date(pago.fecha_pago).toLocaleDateString()}</td>
                        <td>{pago.metodo_pago}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => handleOpenModal(pago)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(pago.id!)}
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
        title={editingId ? 'Editar Pago' : 'Registrar Pago'}
        onClose={handleCloseModal}
        onSave={handleSave}
      >
        <div className="mb-3">
          <label className="form-label">Alumno ID</label>
          <input
            type="number"
            className="form-control"
            value={formData.alumno_id}
            onChange={(e) => setFormData({ ...formData, alumno_id: parseInt(e.target.value) })}
            placeholder="Ingresa el ID del alumno"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Concepto</label>
          <input
            type="text"
            className="form-control"
            value={formData.concepto}
            onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
            placeholder="Ej: Matrícula, Cuota Mensual"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Monto</label>
          <input
            type="number"
            className="form-control"
            value={formData.monto}
            onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) })}
            placeholder="0.00"
            step="0.01"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Estado</label>
          <select
            className="form-control"
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
          >
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Fecha de Pago</label>
          <input
            type="date"
            className="form-control"
            value={formData.fecha_pago}
            onChange={(e) => setFormData({ ...formData, fecha_pago: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Método de Pago</label>
          <select
            className="form-control"
            value={formData.metodo_pago}
            onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
          >
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
      </Modal>
    </div>
  );
};

export default Pagos;
