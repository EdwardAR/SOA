import React, { useEffect, useState } from 'react';
import {
  alumnosService,
  cursosService,
  profesoresService,
  pagosService,
} from '../api/services';
import { API_BASE_URL } from '../api/client';

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
    <div className="page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <h1 className="page-hero-title">
          <i className="bi bi-speedometer2 me-2"></i>
          Dashboard
        </h1>
        <p className="page-hero-subtitle">Vista general del estado del sistema y sus principales módulos</p>
      </div>

      {loading ? (
        <div className="loading text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="row g-3 g-xl-4 mb-4 metric-grid">
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card metric-card metric-primary text-white">
                <div className="card-body stat-card text-center">
                  <i className="bi bi-people metric-icon"></i>
                  <div className="metric-value">{stats.totalAlumnos}</div>
                  <p className="card-text mb-0 metric-label">Alumnos</p>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card metric-card metric-success text-white">
                <div className="card-body stat-card text-center">
                  <i className="bi bi-book metric-icon"></i>
                  <div className="metric-value">{stats.totalCursos}</div>
                  <p className="card-text mb-0 metric-label">Cursos</p>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card metric-card metric-info text-white">
                <div className="card-body stat-card text-center">
                  <i className="bi bi-person-check metric-icon"></i>
                  <div className="metric-value">{stats.totalProfesores}</div>
                  <p className="card-text mb-0 metric-label">Profesores</p>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card metric-card metric-warning text-white">
                <div className="card-body stat-card text-center">
                  <i className="bi bi-credit-card metric-icon"></i>
                  <div className="metric-value">{stats.totalPagos}</div>
                  <p className="card-text mb-0 metric-label">Pagos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="row g-3 g-xl-4">
            <div className="col-12 col-lg-6">
              <div className="card dashboard-card h-100">
                <div className="card-header" style={{ background: 'rgba(102, 126, 234, 0.05)', borderBottom: '1px solid rgba(102, 126, 234, 0.1)', padding: '16px 20px' }}>
                  <h5 className="mb-0 fw-bold text-dark">
                    <i className="bi bi-graph-up me-2 text-primary"></i>
                    Resumen General
                  </h5>
                </div>
                <div className="card-body p-4">
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

            <div className="col-12 col-lg-6">
              <div className="card dashboard-card h-100">
                <div className="card-header" style={{ background: 'rgba(102, 126, 234, 0.05)', borderBottom: '1px solid rgba(102, 126, 234, 0.1)', padding: '16px 20px' }}>
                  <h5 className="mb-0 fw-bold text-dark">
                    <i className="bi bi-info-circle me-2 text-primary"></i>
                    Información del Sistema
                  </h5>
                </div>
                <div className="card-body p-4">
                  <p className="mb-2">
                    <strong>Versión:</strong> 1.0.1
                  </p>
                  <p className="mb-2">
                    <strong>API Gateway:</strong> 
                    <br />
                    <code style={{ fontSize: '0.85rem' }}>{API_BASE_URL.replace('/api', '')}</code>
                  </p>
                  <p className="mb-0">
                    <strong>Base de Datos:</strong> 
                    <br />
                    <code style={{ fontSize: '0.85rem' }}>SQLite3 (colegio.db)</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
