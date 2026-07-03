import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  alumnosService,
  cursosService,
  profesoresService,
  pagosService,
  matriculasService,
  asistenciaService,
  calificacionesService,
  notificacionesService,
} from '../api/services';
import { API_BASE_URL } from '../api/client';

interface DashboardStats {
  totalAlumnos: number;
  totalCursos: number;
  totalProfesores: number;
  totalPagos: number;
  totalMatriculas: number;
  totalAsistencia: number;
  totalCalificaciones: number;
  totalNotificaciones: number;
  alumnosActivos: number;
  alumnosInactivos: number;
  pagosPagados: number;
  pagosPendientes: number;
  pagosCancelados: number;
  asistenciasPresentes: number;
  asistenciasFaltas: number;
  asistenciasJustificados: number;
  calificacionesPromedio: string;
  notificacionesLeidas: number;
  notificacionesNoLeidas: number;
}

interface PromedioGrado {
  grado: string;
  promedio: number;
  cantidad: number;
}

const PAGOS_COLORS = ['#059669', '#d97706', '#dc2626'];
const ASISTENCIA_COLORS = ['#059669', '#dc2626', '#d97706'];
const GRADOS_COLORS: Record<string, string> = {
  '1ro': '#0f47a1', '2do': '#059669', '3ro': '#d97706',
  '4to': '#7c3aed', '5to': '#dc2626',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
        padding: '0.6rem 0.9rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        fontSize: '0.82rem',
      }}>
        <p style={{ margin: 0, fontWeight: 700 }}>{payload[0].name}</p>
        <p style={{ margin: 0, color: payload[0].color, fontWeight: 600 }}>
          {payload[0].value} ({payload[0].payload.percent}%)
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAlumnos: 0, totalCursos: 0, totalProfesores: 0, totalPagos: 0,
    totalMatriculas: 0, totalAsistencia: 0, totalCalificaciones: 0, totalNotificaciones: 0,
    alumnosActivos: 0, alumnosInactivos: 0,
    pagosPagados: 0, pagosPendientes: 0, pagosCancelados: 0,
    asistenciasPresentes: 0, asistenciasFaltas: 0, asistenciasJustificados: 0,
    calificacionesPromedio: '0.00',
    notificacionesLeidas: 0, notificacionesNoLeidas: 0,
  });
  const [promediosGrado, setPromediosGrado] = useState<PromedioGrado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [alumnos, cursos, profesores, pagos, matriculas, asistencia, calificaciones, notificaciones] = await Promise.all([
          alumnosService.getAll(),
          cursosService.getAll(),
          profesoresService.getAll(),
          pagosService.getAll(),
          matriculasService.getAll(),
          asistenciaService.getAll(),
          calificacionesService.getAll(),
          notificacionesService.getAll(),
        ]);

        const datosAlumnos = alumnos.data?.datos || [];
        const datosCursos = cursos.data?.datos || [];
        const datosPagos = pagos.data?.datos || [];
        const datosAsistencia = asistencia.data?.datos || [];
        const datosCalificaciones = calificaciones.data?.datos || [];
        const datosNotificaciones = notificaciones.data?.datos || [];

        const sumaNotas = datosCalificaciones.reduce((acc: number, c: any) => acc + (Number(c.puntuacion) || 0), 0);

        // Per-grade promedio
        const gradoMap: Record<string, { suma: number; count: number }> = {};
        for (const cal of datosCalificaciones) {
          const curso = datosCursos.find((c: any) => c.id === cal.curso_id);
          const g = curso?.grado || '—';
          if (!gradoMap[g]) gradoMap[g] = { suma: 0, count: 0 };
          gradoMap[g].suma += Number(cal.puntuacion) || 0;
          gradoMap[g].count += 1;
        }
        const orden = ['1ro', '2do', '3ro', '4to', '5to'];
        const promedios = orden
          .filter(g => gradoMap[g])
          .map(g => ({
            grado: g,
            promedio: gradoMap[g].count > 0 ? +(gradoMap[g].suma / gradoMap[g].count).toFixed(1) : 0,
            cantidad: gradoMap[g].count,
          }));

        setPromediosGrado(promedios);
        setStats({
          totalAlumnos: datosAlumnos.length,
          totalCursos: datosCursos.length,
          totalProfesores: profesores.data?.datos?.length || 0,
          totalPagos: datosPagos.length,
          totalMatriculas: matriculas.data?.datos?.length || 0,
          totalAsistencia: datosAsistencia.length,
          totalCalificaciones: datosCalificaciones.length,
          totalNotificaciones: datosNotificaciones.length,
          alumnosActivos: datosAlumnos.filter((a: any) => a.estado === 'activo').length,
          alumnosInactivos: datosAlumnos.filter((a: any) => a.estado && a.estado !== 'activo').length,
          pagosPagados: datosPagos.filter((p: any) => p.estado === 'pagado').length,
          pagosPendientes: datosPagos.filter((p: any) => p.estado === 'pendiente').length,
          pagosCancelados: datosPagos.filter((p: any) => p.estado === 'cancelado' || p.estado === 'rechazado').length,
          asistenciasPresentes: datosAsistencia.filter((a: any) => a.estado === 'PRESENTE').length,
          asistenciasFaltas: datosAsistencia.filter((a: any) => a.estado === 'FALTA').length,
          asistenciasJustificados: datosAsistencia.filter((a: any) => a.estado === 'JUSTIFICADO').length,
          calificacionesPromedio: datosCalificaciones.length > 0 ? (sumaNotas / datosCalificaciones.length).toFixed(2) : '0.00',
          notificacionesLeidas: datosNotificaciones.filter((n: any) => n.leida === 1 || n.leida === true).length,
          notificacionesNoLeidas: datosNotificaciones.filter((n: any) => !n.leida).length,
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
          {/* Stats Cards - Row 1 */}
          <div className="row g-3 g-xl-4 mb-4 metric-grid">
            <div className="col-6 col-xl-3">
              <div className="card metric-card metric-primary text-white">
                <div className="card-body stat-card text-center">
                  <i className="bi bi-people metric-icon"></i>
                  <div className="metric-value">{stats.totalAlumnos}</div>
                  <p className="card-text mb-0 metric-label">Alumnos</p>
                </div>
              </div>
            </div>
            <div className="col-6 col-xl-3">
              <div className="card metric-card metric-success text-white">
                <div className="card-body stat-card text-center">
                  <i className="bi bi-book metric-icon"></i>
                  <div className="metric-value">{stats.totalCursos}</div>
                  <p className="card-text mb-0 metric-label">Cursos</p>
                </div>
              </div>
            </div>
            <div className="col-6 col-xl-3">
              <div className="card metric-card metric-info text-white">
                <div className="card-body stat-card text-center">
                  <i className="bi bi-person-check metric-icon"></i>
                  <div className="metric-value">{stats.totalProfesores}</div>
                  <p className="card-text mb-0 metric-label">Profesores</p>
                </div>
              </div>
            </div>
            <div className="col-6 col-xl-3">
              <div className="card metric-card" style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
                <div className="card-body stat-card text-center">
                  <i className="bi bi-pencil-square metric-icon"></i>
                  <div className="metric-value">{stats.totalMatriculas}</div>
                  <p className="card-text mb-0 metric-label">Matrículas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards - Row 2 */}
          <div className="row g-3 g-xl-4 mb-4 metric-grid">
            <div className="col-6 col-xl-3">
              <div className="card metric-card metric-warning text-white">
                <div className="card-body stat-card text-center">
                  <i className="bi bi-credit-card metric-icon"></i>
                  <div className="metric-value">{stats.totalPagos}</div>
                  <p className="card-text mb-0 metric-label">Pagos</p>
                </div>
              </div>
            </div>
            <div className="col-6 col-xl-3">
              <div className="card metric-card" style={{ background: 'linear-gradient(135deg, #0891b2, #22d3ee)' }}>
                <div className="card-body stat-card text-center">
                  <i className="bi bi-clipboard-check metric-icon"></i>
                  <div className="metric-value">{stats.totalAsistencia}</div>
                  <p className="card-text mb-0 metric-label">Asistencias</p>
                </div>
              </div>
            </div>
            <div className="col-6 col-xl-3">
              <div className="card metric-card" style={{ background: 'linear-gradient(135deg, #d97706, #fbbf24)' }}>
                <div className="card-body stat-card text-center">
                  <i className="bi bi-star metric-icon"></i>
                  <div className="metric-value">{stats.totalCalificaciones}</div>
                  <p className="card-text mb-0 metric-label">Calificaciones</p>
                </div>
              </div>
            </div>
            <div className="col-6 col-xl-3">
              <div className="card metric-card" style={{ background: 'linear-gradient(135deg, #be185d, #f472b6)' }}>
                <div className="card-body stat-card text-center">
                  <i className="bi bi-bell metric-icon"></i>
                  <div className="metric-value">{stats.totalNotificaciones}</div>
                  <p className="card-text mb-0 metric-label">Notificaciones</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="row g-3 g-xl-4 mb-4">
            <div className="col-12 col-md-6 col-xl-4">
              <div className="card dashboard-card h-100">
                <div className="card-header app-card-header">
                  <h6 className="mb-0 fw-bold"><i className="bi bi-credit-card me-2"></i>Pagos por Estado</h6>
                </div>
                <div className="card-body p-3 d-flex flex-column align-items-center">
                  {stats.totalPagos > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Pagados', value: stats.pagosPagados, percent: ((stats.pagosPagados / stats.totalPagos) * 100).toFixed(1) },
                            { name: 'Pendientes', value: stats.pagosPendientes, percent: ((stats.pagosPendientes / stats.totalPagos) * 100).toFixed(1) },
                            { name: 'Cancelados', value: stats.pagosCancelados, percent: ((stats.pagosCancelados / stats.totalPagos) * 100).toFixed(1) },
                          ]}
                          cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                          dataKey="value" paddingAngle={3}
                        >
                          {PAGOS_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-muted py-4">Sin datos</div>
                  )}
                  <div className="d-flex justify-content-center gap-3 flex-wrap mt-1">
                    <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#059669', display: 'inline-block' }}></span>
                      {stats.pagosPagados} pagados
                    </span>
                    <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#d97706', display: 'inline-block' }}></span>
                      {stats.pagosPendientes} pend.
                    </span>
                    <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }}></span>
                      {stats.pagosCancelados} canc.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-xl-4">
              <div className="card dashboard-card h-100">
                <div className="card-header app-card-header">
                  <h6 className="mb-0 fw-bold"><i className="bi bi-clipboard-check me-2"></i>Asistencia</h6>
                </div>
                <div className="card-body p-3 d-flex flex-column align-items-center">
                  {stats.totalAsistencia > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Presentes', value: stats.asistenciasPresentes, percent: ((stats.asistenciasPresentes / stats.totalAsistencia) * 100).toFixed(1) },
                            { name: 'Faltas', value: stats.asistenciasFaltas, percent: ((stats.asistenciasFaltas / stats.totalAsistencia) * 100).toFixed(1) },
                            { name: 'Justificados', value: stats.asistenciasJustificados, percent: ((stats.asistenciasJustificados / stats.totalAsistencia) * 100).toFixed(1) },
                          ]}
                          cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                          dataKey="value" paddingAngle={3}
                        >
                          {ASISTENCIA_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-muted py-4">Sin datos</div>
                  )}
                  <div className="d-flex justify-content-center gap-3 flex-wrap mt-1">
                    <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#059669', display: 'inline-block' }}></span>
                      {stats.asistenciasPresentes} presentes
                    </span>
                    <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }}></span>
                      {stats.asistenciasFaltas} faltas
                    </span>
                    <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#d97706', display: 'inline-block' }}></span>
                      {stats.asistenciasJustificados} just.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-xl-4">
              <div className="card dashboard-card h-100">
                <div className="card-header app-card-header">
                  <h6 className="mb-0 fw-bold"><i className="bi bi-bar-chart me-2"></i>Promedio por Grado</h6>
                </div>
                <div className="card-body p-3 d-flex flex-column align-items-center">
                  {promediosGrado.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={promediosGrado} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="grado" tick={{ fontSize: 12, fontWeight: 600 }} />
                        <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="promedio" name="Promedio" radius={[6, 6, 0, 0]}>
                          {promediosGrado.map((d) => (
                            <Cell key={d.grado} fill={GRADOS_COLORS[d.grado] || '#0f47a1'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-muted py-4">Sin datos</div>
                  )}
                  <div className="d-flex justify-content-center gap-2 flex-wrap mt-1">
                    {promediosGrado.map(d => (
                      <span key={d.grado} style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: GRADOS_COLORS[d.grado] || '#0f47a1', display: 'inline-block' }}></span>
                        {d.grado}: {d.promedio}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="row g-3 g-xl-4 mb-4">
            <div className="col-12 col-md-6 col-xl-4">
              <div className="card dashboard-card h-100">
                <div className="card-header app-card-header">
                  <h6 className="mb-0 fw-bold"><i className="bi bi-people me-2"></i>Alumnos</h6>
                </div>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Activos</span>
                    <span className="fw-bold text-success">{stats.alumnosActivos}</span>
                  </div>
                  <div className="progress mb-3" style={{ height: 6 }}>
                    <div className="progress-bar bg-success" style={{ width: `${stats.totalAlumnos ? (stats.alumnosActivos / stats.totalAlumnos) * 100 : 0}%` }}></div>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Inactivos / Egresados</span>
                    <span className="fw-bold text-danger">{stats.alumnosInactivos}</span>
                  </div>
                  <div className="progress" style={{ height: 6 }}>
                    <div className="progress-bar bg-danger" style={{ width: `${stats.totalAlumnos ? (stats.alumnosInactivos / stats.totalAlumnos) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-xl-4">
              <div className="card dashboard-card h-100">
                <div className="card-header app-card-header">
                  <h6 className="mb-0 fw-bold"><i className="bi bi-star me-2"></i>Calificaciones</h6>
                </div>
                <div className="card-body p-4 d-flex flex-column align-items-center justify-content-center">
                  <div className="display-4 fw-bold" style={{ color: Number(stats.calificacionesPromedio) >= 11 ? '#15803d' : '#dc2626' }}>
                    {stats.calificacionesPromedio}
                  </div>
                  <p className="text-muted mb-0">Promedio general / 20</p>
                  <div className="mt-3 w-100">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted small">Total registros</span>
                      <span className="fw-semibold">{stats.totalCalificaciones}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-xl-4">
              <div className="card dashboard-card h-100">
                <div className="card-header app-card-header">
                  <h6 className="mb-0 fw-bold"><i className="bi bi-bell me-2"></i>Notificaciones</h6>
                </div>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Leídas</span>
                    <span className="fw-bold text-success">{stats.notificacionesLeidas}</span>
                  </div>
                  <div className="progress mb-3" style={{ height: 6 }}>
                    <div className="progress-bar bg-success" style={{ width: `${stats.totalNotificaciones ? (stats.notificacionesLeidas / stats.totalNotificaciones) * 100 : 0}%` }}></div>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">No leídas</span>
                    <span className="fw-bold text-warning">{stats.notificacionesNoLeidas}</span>
                  </div>
                  <div className="progress" style={{ height: 6 }}>
                    <div className="progress-bar bg-warning" style={{ width: `${stats.totalNotificaciones ? (stats.notificacionesNoLeidas / stats.totalNotificaciones) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-xl-4">
              <div className="card dashboard-card h-100">
                <div className="card-header bg-primary text-white">
                  <h6 className="mb-0"><i className="bi bi-graph-up me-2"></i>Resumen General</h6>
                </div>
                <div className="card-body p-4">
                  <p className="mb-2">
                    <strong>Total de Registros:</strong>{' '}
                    {stats.totalAlumnos + stats.totalCursos + stats.totalProfesores +
                     stats.totalPagos + stats.totalMatriculas + stats.totalAsistencia +
                     stats.totalCalificaciones + stats.totalNotificaciones}
                  </p>
                  <p className="mb-2">
                    <strong>Sistema:</strong> SOA - Arquitectura de Microservicios
                  </p>
                  <p className="mb-2">
                    <strong>API Gateway:</strong>{' '}
                    <code style={{ fontSize: '0.85rem' }}>{API_BASE_URL.replace('/api', '')}</code>
                  </p>
                  <p className="mb-0">
                    <strong>Estado:</strong>{' '}
                    <span className="badge bg-success">En Línea</span>
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
