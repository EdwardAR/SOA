import React, { useEffect, useState } from 'react';
import { alumnosService } from '../api/services';

const Alumnos: React.FC = () => {
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAlumnos();
  }, []);

  const fetchAlumnos = async () => {
    try {
      const response = await alumnosService.getAll();
      setAlumnos(response.data?.datos || []);
    } catch (err: any) {
      setError('Error al cargar alumnos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">
        <i className="bi bi-people me-2"></i>
        Gestión de Alumnos
      </h1>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Alumnos</h5>
              <button className="btn btn-sm btn-light">
                <i className="bi bi-plus-circle me-2"></i>
                Nuevo Alumno
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
                    <th>Teléfono</th>
                    <th>Grado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No hay alumnos registrados
                      </td>
                    </tr>
                  ) : (
                    alumnos.map((alumno) => (
                      <tr key={alumno.id}>
                        <td>{alumno.id}</td>
                        <td>{alumno.nombre}</td>
                        <td>{alumno.email}</td>
                        <td>{alumno.telefono}</td>
                        <td>{alumno.grado}</td>
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

export default Alumnos;
