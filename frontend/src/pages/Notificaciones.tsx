import React, { useEffect, useState } from 'react';
import { notificacionesService } from '../api/services';

const Notificaciones: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  const fetchNotificaciones = async () => {
    try {
      const response = await notificacionesService.getAll();
      setNotificaciones(response.data?.datos || []);
    } catch (err: any) {
      setError('Error al cargar notificaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">
        <i className="bi bi-bell me-2"></i>
        Notificaciones
      </h1>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="row g-3">
          {notificaciones.length === 0 ? (
            <div className="col-12">
              <div className="alert alert-info" role="alert">
                No hay notificaciones
              </div>
            </div>
          ) : (
            notificaciones.map((notificacion) => (
              <div key={notificacion.id} className="col-md-6">
                <div className={`card ${notificacion.leida ? 'bg-light' : 'border-primary'}`}>
                  <div className="card-body">
                    <h5 className="card-title">{notificacion.titulo}</h5>
                    <p className="card-text">{notificacion.mensaje}</p>
                    <small className="text-muted">
                      {new Date(notificacion.fecha_creacion).toLocaleString()}
                    </small>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notificaciones;
