import React, { useEffect, useMemo, useState } from 'react';
import {
  alumnosService,
  cursosService,
  profesoresService,
  pagosService,
  asistenciaService,
  calificacionesService,
  notificacionesService,
} from '../api/services';
import { API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';

type DashboardData = {
  alumnos: any[];
  cursos: any[];
  profesores: any[];
  pagos: any[];
  asistencias: any[];
  calificaciones: any[];
  notificaciones: any[];
};

const emptyData: DashboardData = {
  alumnos: [],
  cursos: [],
  profesores: [],
  pagos: [],
  asistencias: [],
  calificaciones: [],
  notificaciones: [],
};

const getRows = (response: any) => response?.data?.datos || [];

const average = (values: number[]) => {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
};

const money = (value: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value || 0);

const normalizePaymentStatus = (pago: any) =>
  String(pago.estado_pago || pago.estado || '').toLowerCase();

const StatCard = ({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string | number;
  tone: 'primary' | 'success' | 'info' | 'warning';
}) => (
  <div className="col-12 col-sm-6 col-xl-3">
    <div className={`card metric-card metric-${tone} text-white`}>
      <div className="card-body stat-card text-center">
        <i className={`bi ${icon} metric-icon`}></i>
        <div className="metric-value">{value}</div>
        <p className="card-text mb-0 metric-label">{label}</p>
      </div>
    </div>
  </div>
);

const DonutChart = ({
  title,
  value,
  label,
  color,
}: {
  title: string;
  value: number;
  label: string;
  color: string;
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="dashboard-chart-card">
      <div className="donut-chart" style={{ background: `conic-gradient(${color} ${clamped}%, #e2e8f0 0)` }}>
        <div>
          <strong>{clamped}%</strong>
          <span>{label}</span>
        </div>
      </div>
      <h6>{title}</h6>
    </div>
  );
};

const BarChart = ({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: number; color: string }>;
}) => {
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <div className="card dashboard-card h-100">
      <div className="card-header">
        <h5 className="mb-0 fw-bold">
          <i className="bi bi-bar-chart-line me-2 text-primary"></i>
          {title}
        </h5>
      </div>
      <div className="card-body">
        <div className="bar-chart">
          {rows.map((row) => (
            <div className="bar-row" key={row.label}>
              <div className="bar-label">{row.label}</div>
              <div className="bar-track">
                <span style={{ width: `${(row.value / max) * 100}%`, background: row.color }} />
              </div>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AlertList = ({ alerts }: { alerts: Array<{ icon: string; title: string; text: string; tone: string }> }) => (
  <div className="card dashboard-card h-100">
    <div className="card-header">
      <h5 className="mb-0 fw-bold">
        <i className="bi bi-lightning-charge me-2 text-warning"></i>
        Alertas inteligentes
      </h5>
    </div>
    <div className="card-body">
      <div className="smart-alert-list">
        {alerts.length ? alerts.map((alert) => (
          <div className={`smart-alert smart-alert-${alert.tone}`} key={`${alert.title}-${alert.text}`}>
            <i className={`bi ${alert.icon}`}></i>
            <div>
              <strong>{alert.title}</strong>
              <span>{alert.text}</span>
            </div>
          </div>
        )) : (
          <div className="smart-alert smart-alert-success">
            <i className="bi bi-check-circle"></i>
            <div>
              <strong>Todo en orden</strong>
              <span>No hay alertas criticas para este rol.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const role = user?.tipo_usuario?.toLowerCase() || '';
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      const requests = await Promise.allSettled([
        alumnosService.getAll(),
        cursosService.getAll(),
        profesoresService.getAll(),
        pagosService.getAll(),
        asistenciaService.getAll(),
        calificacionesService.getAll(),
        notificacionesService.getAll(),
      ]);

      const safeRows = (index: number) =>
        requests[index].status === 'fulfilled' ? getRows((requests[index] as PromiseFulfilledResult<any>).value) : [];

      setData({
        alumnos: safeRows(0),
        cursos: safeRows(1),
        profesores: safeRows(2),
        pagos: safeRows(3),
        asistencias: safeRows(4),
        calificaciones: safeRows(5),
        notificaciones: safeRows(6),
      });
      setLoading(false);
    };

    fetchDashboard();
  }, []);

  const insights = useMemo(() => {
    const notas = data.calificaciones.map((item) => Number(item.nota)).filter(Number.isFinite);
    const promedio = average(notas);
    const aprobadas = notas.filter((nota) => nota >= 11).length;
    const asistenciaTotal = data.asistencias.length;
    const presentes = data.asistencias.filter((item) => String(item.estado).toUpperCase() === 'PRESENTE').length;
    const faltas = data.asistencias.filter((item) => String(item.estado).toUpperCase() === 'FALTA').length;
    const pagosPendientes = data.pagos.filter((pago) => normalizePaymentStatus(pago) !== 'pagado');
    const deuda = pagosPendientes.reduce((sum, pago) => sum + Number(pago.monto || 0), 0);
    const noLeidas = data.notificaciones.filter((item) => !item.leida).length;
    const cursosSinProfesor = data.cursos.filter((curso) => !curso.profesor_nombre && !curso.profesor_id).length;
    const alumnosRiesgo = new Set(
      data.calificaciones.filter((item) => Number(item.nota) < 11).map((item) => item.alumno_id || item.alumno_nombre)
    ).size;

    return {
      promedio,
      aprobacion: notas.length ? (aprobadas / notas.length) * 100 : 0,
      asistencia: asistenciaTotal ? (presentes / asistenciaTotal) * 100 : 0,
      faltas,
      deuda,
      pagosPendientes: pagosPendientes.length,
      noLeidas,
      cursosSinProfesor,
      alumnosRiesgo,
    };
  }, [data]);

  const roleCopy = {
    director: {
      title: 'Centro de mando institucional',
      subtitle: 'Indicadores globales de gestion academica, pagos y seguimiento escolar.',
    },
    administrativo: {
      title: 'Panel administrativo',
      subtitle: 'Control operativo de alumnos, pagos, cursos y alertas pendientes.',
    },
    docente: {
      title: 'Panel docente',
      subtitle: 'Seguimiento de tus cursos, alumnos en riesgo y asistencia reciente.',
    },
    padre: {
      title: 'Panel familiar',
      subtitle: 'Resumen de calificaciones, pagos y asistencia de tus hijos vinculados.',
    },
    alumno: {
      title: 'Mi dia academico',
      subtitle: 'Cursos, promedio, asistencia y avisos importantes en un solo lugar.',
    },
  }[role] || {
    title: 'Dashboard',
    subtitle: 'Vista general del estado del sistema y sus principales modulos.',
  };

  const alerts = useMemo(() => {
    const list = [];
    if (insights.alumnosRiesgo) {
      list.push({
        icon: 'bi-exclamation-triangle',
        title: `${insights.alumnosRiesgo} alumno(s) en riesgo`,
        text: 'Hay notas menores a 11 que requieren seguimiento.',
        tone: 'danger',
      });
    }
    if (insights.pagosPendientes) {
      list.push({
        icon: 'bi-credit-card',
        title: `${insights.pagosPendientes} pago(s) pendiente(s)`,
        text: `Monto por revisar: ${money(insights.deuda)}.`,
        tone: 'warning',
      });
    }
    if (insights.faltas) {
      list.push({
        icon: 'bi-calendar-x',
        title: `${insights.faltas} falta(s) registradas`,
        text: 'Conviene revisar asistencia y justificar si corresponde.',
        tone: 'info',
      });
    }
    if (insights.noLeidas) {
      list.push({
        icon: 'bi-bell',
        title: `${insights.noLeidas} notificacion(es) sin leer`,
        text: 'Hay mensajes recientes esperando revision.',
        tone: 'primary',
      });
    }
    if (insights.cursosSinProfesor) {
      list.push({
        icon: 'bi-person-dash',
        title: `${insights.cursosSinProfesor} curso(s) sin docente`,
        text: 'Asignar responsables mejora la trazabilidad academica.',
        tone: 'warning',
      });
    }
    return list.slice(0, 5);
  }, [insights]);

  const paymentRows = [
    { label: 'Pagados', value: data.pagos.filter((pago) => normalizePaymentStatus(pago) === 'pagado').length, color: '#16a34a' },
    { label: 'Pendientes', value: insights.pagosPendientes, color: '#f59e0b' },
    { label: 'Otros', value: data.pagos.filter((pago) => !['pagado', 'pendiente'].includes(normalizePaymentStatus(pago))).length, color: '#0284c7' },
  ];

  const gradesRows = [
    { label: 'Excelente', value: data.calificaciones.filter((item) => Number(item.nota) >= 15).length, color: '#16a34a' },
    { label: 'Aprobado', value: data.calificaciones.filter((item) => Number(item.nota) >= 11 && Number(item.nota) < 15).length, color: '#0284c7' },
    { label: 'En riesgo', value: data.calificaciones.filter((item) => Number(item.nota) < 11).length, color: '#dc2626' },
  ];

  const todayCourses = data.cursos.slice(0, 4);

  return (
    <div className="page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <h1 className="page-hero-title">
          <i className="bi bi-stars me-2"></i>
          {roleCopy.title}
        </h1>
        <p className="page-hero-subtitle">{roleCopy.subtitle}</p>
      </div>

      {loading ? (
        <div className="loading text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="row g-3 g-xl-4 mb-4 metric-grid">
            <StatCard icon="bi-people" label={role === 'padre' ? 'Hijos vinculados' : 'Alumnos'} value={data.alumnos.length} tone="primary" />
            <StatCard icon="bi-book" label={role === 'alumno' ? 'Mis cursos' : 'Cursos'} value={data.cursos.length} tone="success" />
            <StatCard icon="bi-graph-up-arrow" label="Promedio" value={insights.promedio.toFixed(1)} tone="info" />
            <StatCard icon="bi-credit-card" label="Pendiente" value={money(insights.deuda)} tone="warning" />
          </div>

          <div className="row g-3 g-xl-4 mb-4">
            <div className="col-12 col-xl-4">
              <div className="card dashboard-card h-100">
                <div className="card-header">
                  <h5 className="mb-0 fw-bold">
                    <i className="bi bi-pie-chart me-2 text-primary"></i>
                    Salud academica
                  </h5>
                </div>
                <div className="card-body">
                  <div className="dashboard-chart-grid">
                    <DonutChart title="Aprobacion" value={insights.aprobacion} label="notas" color="#16a34a" />
                    <DonutChart title="Asistencia" value={insights.asistencia} label="presente" color="#0284c7" />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-xl-4">
              <BarChart title="Rendimiento por notas" rows={gradesRows} />
            </div>
            <div className="col-12 col-xl-4">
              <BarChart title="Estado de pagos" rows={paymentRows} />
            </div>
          </div>

          <div className="row g-3 g-xl-4">
            <div className="col-12 col-xl-5">
              <AlertList alerts={alerts} />
            </div>
            <div className="col-12 col-xl-7">
              <div className="card dashboard-card h-100">
                <div className="card-header">
                  <h5 className="mb-0 fw-bold">
                    <i className={`bi ${role === 'alumno' ? 'bi-calendar-week' : 'bi-activity'} me-2 text-primary`}></i>
                    {role === 'alumno' ? 'Mis cursos destacados' : 'Actividad reciente'}
                  </h5>
                </div>
                <div className="card-body">
                  {role === 'alumno' ? (
                    <div className="today-course-list">
                      {todayCourses.length ? todayCourses.map((curso) => (
                        <div className="today-course" key={curso.id}>
                          <div>
                            <strong>{curso.nombre}</strong>
                            <span>{curso.profesor_nombre || 'Profesor por asignar'} · {curso.salon || 'Aula por definir'}</span>
                          </div>
                          <span className="badge bg-info">{curso.codigo || 'Curso'}</span>
                        </div>
                      )) : (
                        <div className="text-muted">No hay cursos asignados todavia.</div>
                      )}
                    </div>
                  ) : (
                    <div className="activity-grid">
                      <div>
                        <span>Profesores activos</span>
                        <strong>{data.profesores.length}</strong>
                      </div>
                      <div>
                        <span>Notificaciones</span>
                        <strong>{data.notificaciones.length}</strong>
                      </div>
                      <div>
                        <span>Asistencias</span>
                        <strong>{data.asistencias.length}</strong>
                      </div>
                      <div>
                        <span>API Gateway</span>
                        <code>{API_BASE_URL.replace('/api', '')}</code>
                      </div>
                    </div>
                  )}
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
