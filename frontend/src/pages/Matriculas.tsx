import React, { useEffect, useState } from 'react';
import { matriculasService } from '../api/services';

const Matriculas: React.FC = () => {
  const [matriculas, setMatriculas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMatriculas();
  }, []);

  const fetchMatriculas = async () => {
    try {
      const response = await matriculasService.getAll();
      setMatriculas(response.data?.datos || []);
    } catch (err: any) {
      setError('Error al cargar matrículas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">
        <i className="bi bi-clipboard-check me-2"></i>
        Gestión de Matrículas
      </h1>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card">
          <div className="card-header" style={{ background: '#ff9800', color: 'white' }}>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Matrículas</h5>
              <button className="btn btn-sm btn-light">
                <i className="bi bi-plus-circle me-2"></i>
                Nueva Matrícula
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
                    <th>Curso ID</th>
                    <th>Fecha Inscripción</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {matriculas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No hay matrículas registradas
                      </td>
                    </tr>
                  ) : (
                    matriculas.map((matricula) => (
                      <tr key={matricula.id}>
                        <td>{matricula.id}</td>
                        <td>{matricula.alumno_id}</td>
                        <td>{matricula.curso_id}</td>
                        <td>{new Date(matricula.fecha_inscripcion).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${matricula.estado === 'activa' ? 'bg-success' : 'bg-danger'}`}>
                            {matricula.estado}
                          </span>
                        </td>
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

export default Matriculas;
