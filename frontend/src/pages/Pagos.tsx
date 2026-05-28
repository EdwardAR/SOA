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
  'Cuota mensual - Julio',
  'Cuota mensual - Agosto',
  'Cuota mensual - Setiembre',
  'Cuota mensual - Octubre',
  'Cuota mensual - Noviembre',
  'Cuota mensual - Diciembre',
  'Uniforme',
  'Carnet estudiantil',
  'Material educativo',
  'Examen extraordinario'
];

// Montos fijos por concepto en Soles — ajusta según política del colegio
const CONCEPTOS_MONTO: Record<string, number> = {
  'Matrícula': 850.00,
  'Cuota mensual - Mayo': 1550.00,
  'Cuota mensual - Junio': 1550.00,
  'Cuota mensual - Julio': 1550.00,
  'Cuota mensual - Agosto': 1550.00,
  'Cuota mensual - Setiembre': 1550.00,
  'Cuota mensual - Octubre': 1550.00,
  'Cuota mensual - Noviembre': 1550.00,
  'Cuota mensual - Diciembre': 1550.00,
  'Uniforme': 740.00,
  'Carnet estudiantil': 555.00,
  'Material educativo': 444.00,
  'Examen extraordinario': 185.00
};

const esConceptoFijo = (concepto: string) => Object.prototype.hasOwnProperty.call(CONCEPTOS_MONTO, concepto);

const formatDateForInput = (value?: string | null) => {
  if (!value) return new Date().toISOString().split('T')[0];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0];
  return parsed.toISOString().split('T')[0];
};

const normalizeEstadoPago = (value?: string | null) => {
  const estado = (value || 'pendiente').toString().toLowerCase();
  if (['pendiente', 'pagado', 'vencido', 'cancelado', 'rechazado'].includes(estado)) return estado;
  return 'pendiente';
};

const normalizeMetodoPago = (value?: string | null) => (value || 'transferencia').toString().toLowerCase();

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
      setFormData({
        id: pago.id,
        alumno_id: pago.alumno_id,
        monto: Number(pago.monto) || 0,
        concepto: pago.concepto || '',
        estado: normalizeEstadoPago(pago.estado || pago.estado_pago),
        fecha_pago: formatDateForInput(pago.fecha_pago),
        metodo_pago: normalizeMetodoPago(pago.metodo_pago),
        estado_pago: pago.estado_pago,
        observaciones: pago.observaciones || null
      });
    } else {
      if (!allowCreate) return alert('No autorizado para crear pagos');
      setEditingId(null);
      setFormData({
        alumno_id: '',
        monto: 0,
        concepto: '',
        estado: 'pendiente',
        fecha_pago: formatDateForInput(null),
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
      const payload = {
        alumno_id: formData.alumno_id,
        monto: formData.monto,
        concepto: formData.concepto,
        estado: normalizeEstadoPago(formData.estado),
        fecha_pago: formatDateForInput(formData.fecha_pago),
        metodo_pago: normalizeMetodoPago(formData.metodo_pago),
        estado_pago: formData.estado_pago,
        observaciones: formData.observaciones
      };

      if (editingId) {
        await pagosService.update(editingId, payload);
        setSuccess('Pago actualizado correctamente');
      } else {
        await pagosService.create(payload);
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

  const handleDelete = async (id: string) => {
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
    <div className="screen-page page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="badge rounded-pill bg-light text-primary px-3 py-2">Gestión financiera</span>
          <span className="badge rounded-pill bg-white text-dark px-3 py-2">Responsive</span>
        </div>
        <h1 className="page-hero-title">
          <i className="bi bi-credit-card me-2"></i>
          Gestión de Pagos
        </h1>
        <p className="page-hero-subtitle">Consulta y administra pagos con un diseño más claro, ordenado y preparado para pantallas móviles.</p>
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
      <div className="row summary-grid g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="summary-mini-card border-success">
            <div className="summary-label">Pagado</div>
            <div className="summary-value text-success">S/. {totals.totalPagado.toFixed(2)}</div>
            <div className="summary-note">Ingresos confirmados</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="summary-mini-card border-danger">
            <div className="summary-label">Pendiente</div>
            <div className="summary-value text-danger">S/. {totals.totalPendiente.toFixed(2)}</div>
            <div className="summary-note">Cuentas por regularizar</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="summary-mini-card border-primary">
            <div className="summary-label">Total</div>
            <div className="summary-value text-primary">S/. {totals.total.toFixed(2)}</div>
            <div className="summary-note">Monto acumulado</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="summary-mini-card border-info">
            <div className="summary-label">Transacciones</div>
            <div className="summary-value text-info">{totals.transacciones}</div>
            <div className="summary-note">Operaciones registradas</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card table-shell">
          <div className="card-header bg-warning text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Pagos</h5>
              {allowCreate && (
                <button 
                  className="btn btn-sm btn-light"
                  onClick={() => handleOpenModal()}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Registrar Pago
                </button>
              )}
            </div>
          </div>
          <div className="card-body">
            <div className="row summary-grid g-3 mb-3">
              <div className="col-12 col-md-4">
                <div className="summary-mini-card">
                  <div className="summary-label">Pagos cargados</div>
                  <div className="summary-value">{pagos.length}</div>
                  <div className="summary-note">Movimientos visibles para gestión</div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="summary-mini-card">
                  <div className="summary-label">Alumnos disponibles</div>
                  <div className="summary-value">{alumnos.length}</div>
                  <div className="summary-note">Base de referencia para cobros</div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="summary-mini-card">
                  <div className="summary-label">Monto total</div>
                  <div className="summary-value">S/. {totals.total.toFixed(2)}</div>
                  <div className="summary-note">Consolidado general del periodo</div>
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
                        <td>S/. {pago.monto.toFixed(2)}</td>
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
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Concepto</label>
          <select
            className="form-select"
            value={formData.concepto}
            onChange={(e) => {
              const concepto = e.target.value;
              const monto = CONCEPTOS_MONTO[concepto];
              setFormData({ ...formData, concepto, monto: monto !== undefined ? monto : formData.monto });
            }}
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
            readOnly={esConceptoFijo(formData.concepto) && formData.concepto !== 'Otro'}
          />
          {esConceptoFijo(formData.concepto) && formData.concepto !== 'Otro' && (
            <div className="form-text">El monto se carga automáticamente según el concepto seleccionado.</div>
          )}
        </div>
        <div className="mb-3">
          <label className="form-label">Estado</label>
          <select
            className="form-select"
            value={normalizeEstadoPago(formData.estado)}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
          >
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
            <option value="vencido">Vencido</option>
            <option value="cancelado">Cancelado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Fecha de Pago</label>
          <input
            type="date"
            className="form-control"
            value={formatDateForInput(formData.fecha_pago)}
            onChange={(e) => setFormData({ ...formData, fecha_pago: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Método de Pago</label>
          <select
            className="form-select"
            value={normalizeMetodoPago(formData.metodo_pago)}
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
