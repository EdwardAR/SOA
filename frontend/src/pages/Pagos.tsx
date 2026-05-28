import React, { useEffect, useState } from 'react';
import { pagosService, alumnosService } from '../api/services';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';
import { useSortableData } from '../utils/tableSort';

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
  'Matrícula',
  'Cuota mensual - Mayo',
  'Cuota mensual - Junio',
  'Uniforme',
  'Carnet estudiantil',
  'Material educativo',
  'Examen extraordinario'
];

const Pagos: React.FC = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [formData, setFormData] = useState<Pago>({
    alumno_id: '',
    monto: 0,
    concepto: '',
    estado: 'pendiente',
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago: 'transferencia'
  });
  const { sortConfig, requestSort, sortedRows: pagosOrdenados } = useSortableData(pagos, 'fecha_pago');

  useEffect(() => {
    fetchPagos();
    fetchAlumnos();
  }, []);

  const { user } = useAuth();
  const role = user?.tipo_usuario;
  const allowCreate = can(role, 'pagos', 'create');
  const allowEdit = can(role, 'pagos', 'edit');
  const allowDelete = can(role, 'pagos', 'delete');

  const fetchAlumnos = async () => {
    try {
      const response = await alumnosService.getAll();
      setAlumnos(response.data?.datos || []);
    } catch (err) {
      console.error('Error al cargar alumnos para pagos:', err);
    }
  };

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
      if (!allowEdit) return alert('No autorizado para editar pagos');
      setEditingId(pago.id || null);
      setFormData(pago);
    } else {
      if (!allowCreate) return alert('No autorizado para crear pagos');
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

  const getAlumnoNombre = (id: string) => {
    const alumno = alumnos.find(a => a.id === id);
    return alumno ? `${alumno.primer_nombre} ${alumno.apellido_paterno}` : id;
  };

  const getPagoBadge = (estado: string) => {
    if (estado === 'pagado') return 'success';
    if (estado === 'pendiente') return 'warning';
    return 'danger';
  };

  return (
    <div className="page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <h1 className="page-hero-title">
          <i className="bi bi-credit-card me-2"></i>
          Gestión de Pagos
        </h1>
        <p className="page-hero-subtitle">Controla y administra las transacciones financieras y estados de pago estudiantiles</p>
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

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card dashboard-card h-100" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="card-body text-center py-4">
              <h6 className="text-muted small mb-1 fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pagado</h6>
              <h2 className="text-success fw-bold mb-0">${totals.totalPagado.toFixed(2)}</h2>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card dashboard-card h-100" style={{ borderLeft: '4px solid #ef4444' }}>
            <div className="card-body text-center py-4">
              <h6 className="text-muted small mb-1 fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pendiente</h6>
              <h2 className="text-danger fw-bold mb-0">${totals.totalPendiente.toFixed(2)}</h2>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card dashboard-card h-100" style={{ borderLeft: '4px solid #667eea' }}>
            <div className="card-body text-center py-4">
              <h6 className="text-muted small mb-1 fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</h6>
              <h2 className="text-primary fw-bold mb-0">${totals.total.toFixed(2)}</h2>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card dashboard-card h-100" style={{ borderLeft: '4px solid #0ea5e9' }}>
            <div className="card-body text-center py-4">
              <h6 className="text-muted small mb-1 fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transacciones</h6>
              <h2 className="text-info fw-bold mb-0">{totals.transacciones}</h2>
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
              <h5 className="mb-0 fw-bold text-dark">Listado de Pagos</h5>
              {allowCreate && (
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => handleOpenModal()}
                >
                  <i className="bi bi-plus-circle"></i>
                  Registrar Pago
                </button>
              )}
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <div className="p-3 bg-light rounded border">
                  <div className="text-muted small">Pagos cargados</div>
                  <div className="fs-4 fw-bold">{pagos.length}</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded border">
                  <div className="text-muted small">Alumnos disponibles</div>
                  <div className="fs-4 fw-bold">{alumnos.length}</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded border">
                  <div className="text-muted small">Monto total</div>
                  <div className="fs-4 fw-bold">${totals.total.toFixed(2)}</div>
                </div>
              </div>
            </div>
            <div className="table-responsive">
              {pagos.length === 0 ? (
                <div className="alert alert-info">No hay pagos registrados</div>
              ) : (
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                        <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('id')}>
                          ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('alumno_nombre')}>
                          Alumno {sortConfig.key === 'alumno_nombre' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('concepto')}>
                          Concepto {sortConfig.key === 'concepto' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('monto')}>
                          Monto {sortConfig.key === 'monto' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('estado')}>
                          Estado {sortConfig.key === 'estado' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('fecha_pago')}>
                          Fecha Pago {sortConfig.key === 'fecha_pago' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('metodo_pago')}>
                          Método {sortConfig.key === 'metodo_pago' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th>Acciones</th>
                      </tr>
                  </thead>
                  <tbody>
                      {pagosOrdenados.map((pago) => (
                      <tr key={pago.id}>
                        <td>{pago.id}</td>
                        <td>
                          <div className="fw-semibold">
                            {pago.alumno_nombre || getAlumnoNombre(String(pago.alumno_id))}
                          </div>
                          <small className="text-muted">
                            {pago.alumno_numero_matricula || pago.alumno_id}
                          </small>
                        </td>
                        <td>
                          <div className="fw-semibold">{pago.concepto}</div>
                          <small className="text-muted">{pago.observaciones || pago.estado_pago || 'Registro de pago'}</small>
                        </td>
                        <td>${pago.monto.toFixed(2)}</td>
                        <td>
                          <span className={`badge bg-${getPagoBadge(pago.estado)}`}>
                            {pago.estado}
                          </span>
                        </td>
                        <td>{pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString() : '-'}</td>
                        <td>{pago.metodo_pago || '-'}</td>
                        <td>
                          {allowEdit && (
                            <button 
                              className="btn btn-sm btn-primary me-2"
                              onClick={() => handleOpenModal(pago)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                          {allowDelete && (
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(pago.id!)}
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
        title={editingId ? 'Editar Pago' : 'Registrar Pago'}
        onClose={handleCloseModal}
        onSave={handleSave}
      >
        <div className="mb-3">
          <label className="form-label">Alumno *</label>
          <select
            className="form-select"
            value={formData.alumno_id}
            onChange={(e) => setFormData({ ...formData, alumno_id: e.target.value })}
          >
            <option value="">Seleccionar alumno</option>
            {alumnos.map(a => (
              <option key={a.id} value={a.id}>{a.primer_nombre} {a.apellido_paterno} ({a.numero_matricula})</option>
            ))}
            <option value="__other">Otro (manual)</option>
          </select>
          {formData.alumno_id === '__other' && (
            <input
              className="form-control mt-2"
              placeholder="Ingrese nombre o ID manualmente"
              value={formData.observaciones || ''}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            />
          )}
        </div>
        <div className="mb-3">
          <label className="form-label">Concepto</label>
          <select
            className="form-select"
            value={formData.concepto}
            onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
          >
            <option value="">Seleccionar concepto</option>
            {CONCEPTOS_PAGO.map((concepto) => (
              <option key={concepto} value={concepto}>{concepto}</option>
            ))}
            <option value="Otro">Otro</option>
          </select>
          {formData.concepto === 'Otro' && (
            <input
              type="text"
              className="form-control mt-2"
              value={formData.observaciones || ''}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Especifica el concepto"
            />
          )}
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
