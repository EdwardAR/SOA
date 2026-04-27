import React, { useEffect, useState } from 'react';
import { profesoresService } from '../api/services';

const Profesores: React.FC = () => {
  const [profesores, setProfesores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfesores();
  }, []);

  const fetchProfesores = async () => {
    try {
      const response = await profesoresService.getAll();
      setProfesores(response.data?.datos || []);
    } catch (err: any) {
      setError('Error al cargar profesores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">
        <i className="bi bi-person-check me-2"></i>
        Gestión de Profesores
      </h1>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card">
          <div className="card-header bg-info text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Profesores</h5>
              <button className="btn btn-sm btn-light">
                <i className="bi bi-plus-circle me-2"></i>
                Nuevo Profesor
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Especialidad</th>
                    <th>Teléfono</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {profesores.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No hay profesores registrados
                      </td>
                    </tr>
                  ) : (
                    profesores.map((profesor) => (
                      <tr key={profesor.id}>
                        <td>{profesor.id}</td>
                        <td>{profesor.nombre}</td>
                        <td>{profesor.email}</td>
                        <td>{profesor.especialidad}</td>
                        <td>{profesor.telefono}</td>
                        <td>
                          <button className="btn btn-sm btn-primary me-2">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-danger">
                            <i className="bi bi-trash"></i>
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

export default Profesores;
