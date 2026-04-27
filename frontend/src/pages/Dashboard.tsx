import React, { useEffect, useState } from 'react';
import {
  alumnosService,
  cursosService,
  profesoresService,
  pagosService,
} from '../api/services';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalAlumnos: 0,
    totalCursos: 0,
    totalProfesores: 0,
    totalPagos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [alumnos, cursos, profesores, pagos] = await Promise.all([
          alumnosService.getAll(),
          cursosService.getAll(),
          profesoresService.getAll(),
          pagosService.getAll(),
        ]);

        setStats({
          totalAlumnos: alumnos.data?.datos?.length || 0,
          totalCursos: cursos.data?.datos?.length || 0,
          totalProfesores: profesores.data?.datos?.length || 0,
          totalPagos: pagos.data?.datos?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">
        <i className="bi bi-speedometer2 me-2"></i>
        Dashboard
      </h1>

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-md-6 col-lg-3">
            <div className="card dashboard-card bg-primary text-white">
              <div className="card-body stat-card">
                <i className="bi bi-people icon"></i>
                <h3 className="card-title">{stats.totalAlumnos}</h3>
                <p className="card-text">Alumnos</p>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="card dashboard-card bg-success text-white">
              <div className="card-body stat-card">
                <i className="bi bi-book icon"></i>
                <h3 className="card-title">{stats.totalCursos}</h3>
                <p className="card-text">Cursos</p>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="card dashboard-card bg-info text-white">
              <div className="card-body stat-card">
                <i className="bi bi-person-check icon"></i>
                <h3 className="card-title">{stats.totalProfesores}</h3>
                <p className="card-text">Profesores</p>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="card dashboard-card bg-warning text-white">
              <div className="card-body stat-card">
                <i className="bi bi-credit-card icon"></i>
                <h3 className="card-title">{stats.totalPagos}</h3>
                <p className="card-text">Pagos</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-4 mt-4">
        <div className="col-lg-6">
          <div className="card dashboard-card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-graph-up me-2"></i>
                Resumen General
              </h5>
            </div>
            <div className="card-body">
              <p className="mb-2">
                <strong>Total de Registros:</strong>{' '}
                {stats.totalAlumnos +
                  stats.totalCursos +
                  stats.totalProfesores +
                  stats.totalPagos}
              </p>
              <p className="mb-2">
                <strong>Sistema:</strong> SOA - Arquitectura de Microservicios
              </p>
              <p className="mb-0">
                <strong>Estado:</strong>{' '}
                <span className="badge bg-success">En Línea</span>
              </p>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card dashboard-card">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Información del Sistema
              </h5>
            </div>
            <div className="card-body">
              <p className="mb-2">
                <strong>Versión:</strong> 1.0.0
              </p>
              <p className="mb-2">
                <strong>API Gateway:</strong> http://localhost:3000
              </p>
              <p className="mb-0">
                <strong>Base de Datos:</strong> PostgreSQL
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
