import React, { useEffect, useState } from 'react';
import { cursosService } from '../api/services';

const Cursos: React.FC = () => {
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    try {
      const response = await cursosService.getAll();
      setCursos(response.data?.datos || []);
    } catch (err: any) {
      setError('Error al cargar cursos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">
        <i className="bi bi-book me-2"></i>
        Gestión de Cursos
      </h1>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card">
          <div className="card-header bg-success text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Cursos</h5>
              <button className="btn btn-sm btn-light">
                <i className="bi bi-plus-circle me-2"></i>
                Nuevo Curso
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
                    <th>Código</th>
                    <th>Grado</th>
                    <th>Capacidad</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cursos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No hay cursos registrados
                      </td>
                    </tr>
                  ) : (
                    cursos.map((curso) => (
                      <tr key={curso.id}>
                        <td>{curso.id}</td>
                        <td>{curso.nombre}</td>
                        <td>{curso.codigo}</td>
                        <td>{curso.grado}</td>
                        <td>{curso.capacidad}</td>
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

export default Cursos;
