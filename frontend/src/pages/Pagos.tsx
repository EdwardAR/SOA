import React, { useEffect, useState } from 'react';
import { pagosService } from '../api/services';

const Pagos: React.FC = () => {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPagos();
  }, []);

  const fetchPagos = async () => {
    try {
      const response = await pagosService.getAll();
      setPagos(response.data?.datos || []);
    } catch (err: any) {
      setError('Error al cargar pagos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">
        <i className="bi bi-credit-card me-2"></i>
        Gestión de Pagos
      </h1>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card">
          <div className="card-header bg-warning text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Pagos</h5>
              <button className="btn btn-sm btn-light">
                <i className="bi bi-plus-circle me-2"></i>
                Registrar Pago
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Alumno ID</th>
                    <th>Monto</th>
                    <th>Fecha Pago</th>
                    <th>Método</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        No hay pagos registrados
                      </td>
                    </tr>
                  ) : (
                    pagos.map((pago) => (
                      <tr key={pago.id}>
                        <td>{pago.id}</td>
                        <td>{pago.alumno_id}</td>
                        <td>S/. {pago.monto}</td>
                        <td>{new Date(pago.fecha_pago).toLocaleDateString()}</td>
                        <td>{pago.metodo_pago}</td>
                        <td>
                          <span className={`badge ${pago.estado === 'completado' ? 'bg-success' : 'bg-warning'}`}>
                            {pago.estado}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-primary me-2">
                            <i className="bi bi-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagos;
