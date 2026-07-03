import React, { useEffect, useState, useRef, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '../context/AuthContext';
import {
  alumnosService,
  cursosService,
  matriculasService,
  pagosService,
  asistenciaService,
  calificacionesService,
  reportesService,
} from '../api/services';

interface Alumno {
  id: string;
  numero_matricula: string;
  primer_nombre: string;
  segundo_nombre?: string;
  apellido_paterno: string;
  apellido_materno?: string;
  numero_documento?: string;
  telefono?: string;
  email_contacto?: string;
  fecha_nacimiento?: string;
  genero?: string;
  direccion?: string;
  estado: string;
  deuda_pendiente: boolean;
  monto_deuda: number;
  usuario_id: string;
}

interface Curso { id: string; codigo: string; nombre: string; grado_nivel?: string; seccion?: string }
interface Matricula { id: string; alumno_id: string; curso_id: string; curso_nombre?: string; curso_codigo?: string; periodo_academico: string; estado: string; fecha_matricula: string }
interface Pago { id: string; alumno_id: string; monto: number; concepto: string; estado: string; fecha_pago?: string; metodo_pago?: string; periodo_academico?: string }
interface Asistencia { id: string; alumno_id: string; curso_id: string; fecha: string; estado: string; curso_nombre?: string }
interface Calificacion { id: string; alumno_id: string; curso_id: string; puntuacion: number; tipo_evaluacion: string; curso_nombre?: string; periodo_academico?: string }

interface ChildData {
  alumno: Alumno;
  matriculas: Matricula[];
  pagos: Pago[];
  asistencias: Asistencia[];
  calificaciones: Calificacion[];
}

type TabType = 'resumen' | 'calificaciones' | 'asistencia' | 'pagos';

const C = {
  primary: '#0f47a1', primaryLight: '#1e6bc7',
  green: '#059669', greenBg: '#ecfdf5', greenBorder: '#a7f3d0',
  red: '#dc2626', redBg: '#fef2f2', redBorder: '#fecaca',
  amber: '#d97706', amberBg: '#fffbeb', amberBorder: '#fde68a',
  blue: '#1565c0', blueBg: '#eff6ff', blueBorder: '#bfdbfe',
  slate: '#64748b', slateLight: '#94a3b8', slateBg: '#f8fafc', slateBorder: '#e2e8f0',
  dark: '#0f172a', darkBlue: '#1e3a5f',
};

const ESTADO_COLOR: Record<string, string> = {
  activo: C.green, inactivo: C.slateLight, egresado: C.primaryLight,
  PRESENTE: C.green, FALTA: C.red, JUSTIFICADO: C.amber,
  pagado: C.green, pendiente: C.amber, cancelado: C.red, rechazado: C.slateLight,
};

const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: 'resumen', label: 'Resumen', icon: 'bi-graph-up-arrow' },
  { key: 'calificaciones', label: 'Calificaciones', icon: 'bi-file-earmark-text' },
  { key: 'asistencia', label: 'Asistencia', icon: 'bi-calendar-check' },
  { key: 'pagos', label: 'Pagos', icon: 'bi-credit-card' },
];

const INLINE_STYLES = `
  .rpt-page { max-width: 1100px; margin: 0 auto; }
  .rpt-fade { animation: rptFi 0.3s ease-out; }
  @keyframes rptFi { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .rpt-tab-btn {
    transition: all 0.2s ease; border-radius: 10px 10px 0 0; border: 1px solid transparent;
    border-bottom: none; background: transparent;
    padding: 0.6rem 1.3rem; font-weight: 600; font-size: 0.85rem; color: ${C.slateLight}; cursor: pointer;
    margin-bottom: -1px; position: relative; z-index: 1;
  }
  .rpt-tab-btn:hover { color: ${C.blue}; background: #f8fafc; border-color: ${C.slateBorder}; }
  .rpt-tab-btn.active { color: ${C.blue}; background: #fff; border-color: ${C.slateBorder}; box-shadow: 0 -2px 0 ${C.blue}; }
  .rpt-stat { border-radius: 14px; padding: 1rem; text-align: center; transition: all 0.2s; }
  .rpt-stat:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
  .rpt-stat-value { font-size: 1.8rem; font-weight: 800; line-height: 1.2; letter-spacing: -0.02em; }
  .rpt-stat-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.25rem; }
  .rpt-alumno-card {
    cursor: pointer; border-radius: 14px; padding: 0.75rem 1rem;
    transition: all 0.2s ease; border: 2px solid transparent;
    background: #fff;
  }
  .rpt-alumno-card:hover { border-color: ${C.blueBorder}; box-shadow: 0 4px 16px rgba(15,98,254,0.1); }
  .rpt-alumno-card.active { border-color: ${C.blue}; background: ${C.blueBg}; box-shadow: 0 4px 16px rgba(15,98,254,0.15); }
  .rpt-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 0.95rem; color: #fff; flex-shrink: 0;
  }
  .rpt-hero { background: linear-gradient(135deg, #0a3475, #1565c0, #1e6bc7); border-radius: 20px; padding: 1.8rem 2rem; position: relative; overflow: hidden; }
  .rpt-hero::before { content: ''; position: absolute; top: -50%; right: -20%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%); border-radius: 50%; }
  .rpt-hero::after { content: ''; position: absolute; bottom: -30%; left: -10%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%); border-radius: 50%; }
  .rpt-pdf-btn { border-radius: 12px; font-weight: 700; font-size: 0.9rem; transition: all 0.25s ease; }
  .rpt-pdf-btn:hover:not(:disabled) { transform: scale(1.03); }
  .rpt-pdf-btn:active:not(:disabled) { transform: scale(0.97); }
  .rpt-table-wrap { border-radius: 12px; border: 1px solid ${C.slateBorder}; overflow: hidden; }
  .rpt-table-wrap table { margin-bottom: 0; }
  .rpt-table-wrap th { background: ${C.slateBg}; padding: 0.65rem 1rem; text-align: left; font-weight: 700; color: #475569; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
  .rpt-table-wrap td { padding: 0.55rem 1rem; border-bottom: 1px solid #f1f5f9; }
  .rpt-table-wrap tr:last-child td { border-bottom: none; }
  @media (min-width: 992px) {
    .rpt-metrics-grid { grid-template-columns: repeat(3, 1fr) !important; }
    .rpt-info-grid { grid-template-columns: repeat(4, 1fr) !important; }
    .rpt-content { box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
  }
  @media (max-width: 576px) {
    .rpt-hero { padding: 1.2rem 1rem !important; }
    .rpt-hero h1 { font-size: 1.3rem !important; }
    .rpt-hero p { font-size: 0.82rem !important; }
    .rpt-content { padding: 1.2rem 1rem !important; }
    .rpt-content table tr td:first-child { padding-left: 0 !important; }
    .rpt-content table tr td:last-child { padding-right: 0 !important; }
  }
  @media print { .no-print { display: none !important; } }
`;

const avatarBg = (name: string) => {
  const colors = ['#0f47a1', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#ea580c'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const SectionTitle: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
    <div style={{ width: 28, height: 28, borderRadius: 8, background: C.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blue, fontSize: '0.85rem' }}>
      <i className={`bi ${icon}`}></i>
    </div>
    <span style={{ color: C.darkBlue, fontWeight: 700, fontSize: '0.88rem', letterSpacing: '-0.01em' }}>{label}</span>
  </div>
);

const Badge: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span style={{ display: 'inline-block', padding: '0.2rem 0.7rem', borderRadius: 8, background: `${color}14`, color, fontWeight: 700, fontSize: '0.74rem', border: `1px solid ${color}25` }}>{text}</span>
);

const Reportes: React.FC = () => {
  const { user } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<'idle' | 'capturing' | 'pdf' | 'saving' | 'done'>('idle');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [selectedAlumno, setSelectedAlumno] = useState<string | null>(null);
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [reportesHistorial, setReportesHistorial] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  const [showAllForPdf, setShowAllForPdf] = useState(false);

  const esAdmin = user?.tipo_usuario === 'director' || user?.tipo_usuario === 'administrativo';

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        setLoading(true);
        const [alRes, repRes] = await Promise.all([
          alumnosService.getAll(),
          reportesService.getAll(),
        ]);
        const items = alRes.data?.datos?.items || alRes.data?.datos || [];
        setAlumnos(items);
        if (items.length > 0) setSelectedAlumno(items[0].id);
        setReportesHistorial(repRes.data?.datos?.reportes || []);
      } catch { setError('Error al cargar datos'); }
      finally { setLoading(false); }
    };
    fetchInitial();
  }, []);

  const fetchChildData = useCallback(async (alumnoId: string) => {
    try {
      setLoading(true);
      const alumno = alumnos.find(a => a.id === alumnoId);
      if (!alumno) return;

      const [matRes, pagosRes, asisRes, calRes, cursosRes] = await Promise.all([
        matriculasService.getAll(), pagosService.getAll(),
        asistenciaService.getAll(), calificacionesService.getAll(), cursosService.getAll(),
      ]);

      const cursos: Curso[] = cursosRes.data?.datos?.items || cursosRes.data?.datos || [];

      const mat = (matRes.data?.datos?.items || matRes.data?.datos || [])
        .filter((m: any) => m.alumno_id === alumnoId)
        .map((m: any) => { const c = cursos.find((cr: any) => cr.id === m.curso_id); return { ...m, curso_nombre: c?.nombre, curso_codigo: c?.codigo }; });
      const pag = (pagosRes.data?.datos?.items || pagosRes.data?.datos || []).filter((p: any) => p.alumno_id === alumnoId);
      const asis = (asisRes.data?.datos?.items || asisRes.data?.datos || []).filter((a: any) => a.alumno_id === alumnoId)
        .map((a: any) => { const c = cursos.find((cr: any) => cr.id === a.curso_id); return { ...a, curso_nombre: c?.nombre }; });
      const cal = (calRes.data?.datos?.items || calRes.data?.datos || []).filter((c: any) => c.alumno_id === alumnoId)
        .map((c: any) => { const cr = cursos.find((cr: any) => cr.id === c.curso_id); return { ...c, curso_nombre: cr?.nombre }; });

      setChildData({ alumno, matriculas: mat, pagos: pag, asistencias: asis, calificaciones: cal });
      setShowAllForPdf(false);
      setActiveTab('resumen');
    } catch { setError('Error al cargar datos del alumno'); }
    finally { setLoading(false); }
  }, [alumnos]);

  useEffect(() => { if (selectedAlumno) fetchChildData(selectedAlumno); }, [selectedAlumno, fetchChildData]);

  const fmt = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const totalPagado = childData?.pagos?.filter(p => p.estado === 'pagado').reduce((s, p) => s + p.monto, 0) || 0;
  const totalPendiente = childData?.pagos?.filter(p => p.estado === 'pendiente').reduce((s, p) => s + p.monto, 0) || 0;
  const presentes = childData?.asistencias?.filter(a => a.estado === 'PRESENTE').length || 0;
  const faltas = childData?.asistencias?.filter(a => a.estado === 'FALTA').length || 0;
  const justificados = childData?.asistencias?.filter(a => a.estado === 'JUSTIFICADO').length || 0;
  const totalAsistencias = childData?.asistencias?.length || 0;
  const promedio = childData?.calificaciones?.length
    ? (childData.calificaciones.reduce((s, c) => s + c.puntuacion, 0) / childData.calificaciones.length).toFixed(1)
    : '—';

  const generarPDF = async () => {
    if (!reportRef.current || !childData || !selectedAlumno) return;
    try {
      setShowAllForPdf(true);
      setGenerating('capturing');
      setError('');

      await new Promise(r => setTimeout(r, 350));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff',
      });

      setShowAllForPdf(false);
      setGenerating('pdf');
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      const pageH = pdf.internal.pageSize.getHeight();
      let left = pdfH;
      let pos = 0;

      pdf.addImage(imgData, 'PNG', 0, pos, pdfW, pdfH);
      left -= pageH;
      while (left > 0) {
        pos = left - pdfH;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, pos, pdfW, pdfH);
        left -= pageH;
      }

      setGenerating('saving');
      const alumno = childData.alumno;
      const fn = `Reporte_${alumno.apellido_paterno}_${alumno.primer_nombre}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fn);

      await reportesService.create({
        tipo_reporte: 'academico', alumno_id: selectedAlumno,
        periodo_academico: childData.matriculas[0]?.periodo_academico || '2026-1',
        datos_reporte: {
          alumno: `${alumno.primer_nombre} ${alumno.apellido_paterno}`,
          matricula: alumno.numero_matricula, promedio,
          asistencias: { presentes, faltas, justificados },
          pagos: { pagado: totalPagado, pendiente: totalPendiente },
          total_calificaciones: childData.calificaciones.length,
          total_cursos: childData.matriculas.length,
        },
        formato: 'pdf',
      });

      const repRes = await reportesService.getAll();
      setReportesHistorial(repRes.data?.datos?.reportes || []);
      setSuccess('PDF generado exitosamente');
      setTimeout(() => setSuccess(''), 4000);
    } catch { setError('Error al generar el PDF'); setShowAllForPdf(false); }
    finally { setGenerating('idle'); }
  };

  const showSection = (s: TabType) => showAllForPdf || activeTab === s;

  if (loading && !childData) {
    return (
      <div className="screen-page page-shell container-fluid p-2 p-md-4 rpt-page">
        <div className="loading"><div className="spinner-border text-primary" role="status" /></div>
      </div>
    );
  }

  return (
    <div className="screen-page page-shell container-fluid p-2 p-md-4 rpt-page">
      <style>{INLINE_STYLES}</style>

      <div className="rpt-hero mb-4 no-print">
        <div className="d-flex flex-wrap gap-2 mb-2" style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ padding: '0.25rem 0.8rem', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>
            <i className="bi bi-file-earmark-pdf me-1"></i> Reportes
          </span>
          {childData && (
            <span style={{ padding: '0.25rem 0.8rem', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>
              {childData.alumno.primer_nombre} {childData.alumno.apellido_paterno}
            </span>
          )}
          <span style={{ padding: '0.25rem 0.8rem', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>
            {alumnos.length} estudiante{alumnos.length !== 1 ? 's' : ''}
          </span>
        </div>
        <h1 className="page-hero-title" style={{ color: '#fff', fontSize: '1.7rem', position: 'relative', zIndex: 1 }}>
          <i className="bi bi-file-earmark-bar-graph me-2"></i>Reportes Académicos
        </h1>
        <p className="page-hero-subtitle" style={{ color: 'rgba(255,255,255,0.8)', position: 'relative', zIndex: 1, marginBottom: 0 }}>
          {esAdmin
            ? 'Visualiza y genera reportes PDF de cualquier estudiante con toda su información académica.'
            : 'Revisa la información académica de tus hijos y genera reportes en PDF con un solo clic.'}
        </p>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3 rpt-fade" role="alert">
          <i className="bi bi-x-circle-fill"></i><span>{error}</span>
          <button className="btn-close ms-auto" onClick={() => setError('')} />
        </div>
      )}
      {success && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-3 rpt-fade" role="alert">
          <i className="bi bi-check-circle-fill"></i><span>{success}</span>
          <button className="btn-close ms-auto" onClick={() => setSuccess('')} />
        </div>
      )}

      {/* Student selector */}
      <div className="card dashboard-card mb-3 no-print" style={{ borderRadius: 18, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="card-body p-3">
          <div className="d-flex align-items-center gap-2 mb-3">
            <div style={{ width: 30, height: 30, borderRadius: 10, background: C.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blue }}>
              <i className="bi bi-person-badge" style={{ fontSize: '0.9rem' }}></i>
            </div>
            <span style={{ fontWeight: 700, color: C.dark, fontSize: '0.9rem' }}>Seleccionar estudiante</span>
          </div>
          <div className="row g-2">
            {alumnos.map(a => {
              const isActive = selectedAlumno === a.id;
              const initials = `${a.primer_nombre?.[0] || ''}${a.apellido_paterno?.[0] || ''}`;
              const bg = avatarBg(`${a.primer_nombre} ${a.apellido_paterno}`);
              return (
                <div key={a.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                  <div className={`rpt-alumno-card ${isActive ? 'active' : ''}`} onClick={() => setSelectedAlumno(a.id)}
                    style={{ boxShadow: isActive ? '0 4px 16px rgba(15,98,254,0.15)' : '0 1px 3px rgba(0,0,0,0.04)' }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="rpt-avatar" style={{ background: bg }}>{initials}</div>
                        <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: C.dark, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {a.primer_nombre} {a.apellido_paterno}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: C.slateLight, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {a.numero_matricula || 'Sin matrícula'}
                        </div>
                        <div style={{ marginTop: 2 }}>
                          <span style={{
                            display: 'inline-block', padding: '0.1rem 0.5rem', borderRadius: 6,
                            fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                            background: a.estado === 'activo' ? C.greenBg : C.slateBg,
                            color: ESTADO_COLOR[a.estado] || C.slateLight,
                          }}>
                            {a.estado}
                          </span>
                        </div>
                      </div>
                      {isActive && <i className="bi bi-check-circle-fill text-primary ms-auto" style={{ fontSize: '1.1rem' }}></i>}
                    </div>
                  </div>
                </div>
              );
            })}
            {alumnos.length === 0 && (
              <div className="col-12 text-center py-3" style={{ color: C.slateLight }}>
                <i className="bi bi-people" style={{ fontSize: '1.5rem', opacity: 0.3 }}></i>
                <p className="mt-1 mb-0" style={{ fontSize: '0.85rem' }}>No hay estudiantes disponibles</p>
              </div>
            )}
          </div>
        </div>
        <div className="card-footer" style={{ background: C.slateBg, borderTop: `1px solid ${C.slateBorder}`, borderRadius: '0 0 18px 18px', padding: '0.6rem 1.25rem' }}>
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
            <span style={{ fontSize: '0.78rem', color: C.slate }}>
              {childData ? `${childData.matriculas.length} curso${childData.matriculas.length !== 1 ? 's' : ''} · ${totalAsistencias} asistencias · ${childData.calificaciones.length} nota${childData.calificaciones.length !== 1 ? 's' : ''}` : 'Selecciona un estudiante'}
            </span>
            <button
              className="rpt-pdf-btn btn btn-success"
              onClick={generarPDF}
              disabled={generating !== 'idle' || !childData}
              style={{ padding: '0.5rem 1.3rem' }}
            >
              {generating === 'capturing' ? (
                <><span className="spinner-border spinner-border-sm me-2" />Captando...</>
              ) : generating === 'pdf' ? (
                <><span className="spinner-border spinner-border-sm me-2" />Generando PDF...</>
              ) : generating === 'saving' ? (
                <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
              ) : (
                <><i className="bi bi-file-earmark-pdf me-2"></i> Generar PDF</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report content */}
      {childData && (
        <div className="rpt-fade">
          {/* Tabs (hidden during PDF capture) */}
          {!showAllForPdf && (
            <div className="no-print d-flex flex-wrap gap-0 mb-0" style={{ borderBottom: `1px solid ${C.slateBorder}`, paddingLeft: '0.25rem' }}>
              {TABS.map(t => (
                <button key={t.key} className={`rpt-tab-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                  <i className={`bi ${t.icon} me-1`}></i> {t.label}
                </button>
              ))}
            </div>
          )}

          <div ref={reportRef} className="rpt-content" style={{
            background: '#fff', borderRadius: showAllForPdf ? 0 : '0 12px 12px 12px',
            padding: '2.5rem 2.8rem 1.8rem',
            border: `1px solid ${C.slateBorder}`, borderTop: showAllForPdf ? `1px solid ${C.slateBorder}` : 'none',
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: `2px solid ${C.darkBlue}` }}>
              <div className="d-flex align-items-center justify-content-center flex-wrap" style={{ gap: '1.2rem', marginBottom: '0.3rem' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: C.darkBlue,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '1.3rem', fontWeight: 900, fontFamily: 'serif',
                  flexShrink: 0, letterSpacing: '-0.03em',
                }}>
                  FD
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ margin: 0, color: C.dark, fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.01em' }}>Colegio Futuro Digital</h2>
                  <p style={{ margin: '3px 0 0', color: C.slate, fontSize: '0.78rem' }}>
                    Reporte Académico · {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Student info */}
            <div style={{ marginBottom: '2rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <tbody>
                  <tr>
                    {[
                      { label: 'Estudiante', value: `${childData.alumno.primer_nombre} ${childData.alumno.segundo_nombre || ''} ${childData.alumno.apellido_paterno} ${childData.alumno.apellido_materno || ''}`.replace(/\s+/g, ' ') },
                      { label: 'Matrícula', value: childData.alumno.numero_matricula || '—' },
                      { label: 'Documento', value: childData.alumno.numero_documento || '—' },
                    ].map(d => (
                      <td key={d.label} style={{ padding: '0.4rem 0.8rem 0.4rem 0', verticalAlign: 'top', width: '33%' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>{d.label}</div>
                        <div style={{ fontWeight: 500, color: C.dark }}>{d.value}</div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    {[
                      { label: 'Estado', value: childData.alumno.estado },
                      ...(childData.alumno.fecha_nacimiento ? [{ label: 'Fecha Nac.', value: fmt(childData.alumno.fecha_nacimiento) }] : [{ label: 'Email', value: childData.alumno.email_contacto || '—' }]),
                      ...(childData.alumno.email_contacto && childData.alumno.fecha_nacimiento ? [{ label: 'Email', value: childData.alumno.email_contacto }] : childData.alumno.telefono ? [{ label: 'Teléfono', value: childData.alumno.telefono }] : [{ label: '—', value: '' }]),
                    ].slice(0, 3).map((d: any) => (
                      <td key={d.label} style={{ padding: '0.4rem 0.8rem 0.4rem 0', verticalAlign: 'top', width: '33%' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>{d.label}</div>
                        <div style={{ fontWeight: 500, color: C.dark }}>{d.value}</div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Courses */}
            <div style={{ marginBottom: '2rem' }}>
              <SectionTitle icon="bi-book" label="Cursos Matriculados" />
              {childData.matriculas.length === 0 ? (
                <span style={{ color: C.slateLight }}>Sin cursos matriculados</span>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <tbody>
                    <tr>
                      {childData.matriculas.map((m, i) => (
                        <td key={m.id} style={{ padding: '0.3rem 0.6rem 0.3rem 0', verticalAlign: 'top', width: `${100 / Math.min(childData.matriculas.length, 4)}%` }}>
                          <div style={{ fontWeight: 500, color: C.dark, fontSize: '0.85rem' }}>{m.curso_nombre || m.curso_id}</div>
                          <div style={{ fontSize: '0.72rem', color: C.slate }}>{m.periodo_academico}</div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Section: Resumen */}
            {(showSection('resumen')) && (
              <div style={{ marginBottom: '2rem' }}>
                <SectionTitle icon="bi-graph-up-arrow" label="Métricas Generales" />
                <div className="rpt-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0' }}>
                  {[
                    { label: 'Promedio General', value: promedio },
                    { label: 'Asistencias', value: `${presentes} / ${totalAsistencias}` },
                    { label: 'Faltas', value: `${faltas}` },
                    { label: 'Justificados', value: `${justificados}` },
                    { label: 'Total Pagado', value: `S/ ${totalPagado.toFixed(2)}` },
                    { label: 'Pendiente', value: `S/ ${totalPendiente.toFixed(2)}` },
                  ].map(s => (
                    <div key={s.label} style={{
                      padding: '0.85rem 0.75rem', textAlign: 'center',
                      borderRight: `1px solid ${C.slateBorder}`,
                      borderBottom: `1px solid ${C.slateBorder}`,
                    }}>
                      <div style={{ fontSize: '0.64rem', fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{s.label}</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: C.dark, lineHeight: 1.2 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section: Calificaciones */}
            {(showSection('calificaciones')) && (
              <div style={{ marginBottom: '2rem' }}>
                <SectionTitle icon="bi-file-earmark-text" label="Calificaciones" />
                {childData.calificaciones.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: C.slateLight }}>
                    <i className="bi bi-journal-x" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                    <p className="mt-2 mb-0" style={{ fontSize: '0.85rem' }}>No hay calificaciones registradas</p>
                  </div>
                ) : (
                  <div className="rpt-table-wrap" style={{ overflowX: 'auto' }}>
                    <table className="table align-middle mb-0" style={{ fontSize: '0.84rem', width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Curso</th>
                          <th className="d-none d-sm-table-cell">Evaluación</th>
                          <th style={{ textAlign: 'center' }}>Nota</th>
                        </tr>
                      </thead>
                      <tbody>
                        {childData.calificaciones.map(c => (
                          <tr key={c.id}>
                            <td style={{ color: C.dark, fontWeight: 500 }}>{c.curso_nombre || '—'}</td>
                            <td className="d-none d-sm-table-cell" style={{ color: C.slate, textTransform: 'capitalize' }}>{c.tipo_evaluacion}</td>
                            <td style={{ textAlign: 'center', fontWeight: 600, color: C.dark }}>{c.puntuacion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Section: Asistencia */}
            {(showSection('asistencia')) && (
              <div style={{ marginBottom: '2rem' }}>
                <SectionTitle icon="bi-calendar-check" label="Registro de Asistencia" />
                {totalAsistencias > 0 && (
                  <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem', flexWrap: 'wrap', fontSize: '0.84rem' }}>
                    <span><strong style={{ color: C.dark }}>{presentes}</strong> <span style={{ color: C.slate }}>presentes</span></span>
                    <span><strong style={{ color: C.dark }}>{faltas}</strong> <span style={{ color: C.slate }}>falta{faltas !== 1 ? 's' : ''}</span></span>
                    <span><strong style={{ color: C.dark }}>{justificados}</strong> <span style={{ color: C.slate }}>justificado{justificados !== 1 ? 's' : ''}</span></span>
                  </div>
                )}
                {childData.asistencias.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: C.slateLight }}>
                    <i className="bi bi-calendar-x" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                    <p className="mt-2 mb-0" style={{ fontSize: '0.85rem' }}>No hay registros de asistencia</p>
                  </div>
                ) : (
                  <div className="rpt-table-wrap" style={{ overflowX: 'auto' }}>
                    <table className="table align-middle mb-0" style={{ fontSize: '0.84rem', width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Curso</th>
                          <th className="d-none d-sm-table-cell">Fecha</th>
                          <th style={{ textAlign: 'center' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {childData.asistencias.map(a => (
                          <tr key={a.id}>
                            <td style={{ color: C.dark, fontWeight: 500 }}>{a.curso_nombre || '—'}</td>
                            <td className="d-none d-sm-table-cell" style={{ color: C.slate }}>{fmt(a.fecha)}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-block', padding: '0.15rem 0.6rem', borderRadius: 4,
                                fontSize: '0.75rem', fontWeight: 600,
                                background: a.estado === 'PRESENTE' ? '#f0fdf4' : a.estado === 'FALTA' ? '#fef2f2' : '#fffbeb',
                                color: a.estado === 'PRESENTE' ? '#166534' : a.estado === 'FALTA' ? '#991b1b' : '#92400e',
                              }}>
                                {a.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Section: Pagos */}
            {(showSection('pagos')) && (
              <div style={{ marginBottom: '2rem' }}>
                <SectionTitle icon="bi-credit-card" label="Historial de Pagos" />
                {(totalPagado > 0 || totalPendiente > 0) && (
                  <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem', flexWrap: 'wrap', fontSize: '0.84rem' }}>
                    <span><strong style={{ color: C.dark }}>S/ {totalPagado.toFixed(2)}</strong> <span style={{ color: C.slate }}>pagado</span></span>
                    <span><strong style={{ color: C.dark }}>S/ {totalPendiente.toFixed(2)}</strong> <span style={{ color: C.slate }}>pendiente</span></span>
                  </div>
                )}
                {childData.pagos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: C.slateLight }}>
                    <i className="bi bi-wallet2" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                    <p className="mt-2 mb-0" style={{ fontSize: '0.85rem' }}>No hay pagos registrados</p>
                  </div>
                ) : (
                  <div className="rpt-table-wrap" style={{ overflowX: 'auto' }}>
                    <table className="table align-middle mb-0" style={{ fontSize: '0.84rem', width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Concepto</th>
                          <th className="d-none d-sm-table-cell" style={{ textAlign: 'right' }}>Monto</th>
                          <th style={{ textAlign: 'center' }}>Estado</th>
                          <th className="d-none d-sm-table-cell">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {childData.pagos.map(p => (
                          <tr key={p.id}>
                            <td style={{ color: C.dark, fontWeight: 500 }}>{p.concepto}</td>
                            <td className="d-none d-sm-table-cell" style={{ textAlign: 'right', fontWeight: 600, color: C.dark }}>S/ {p.monto.toFixed(2)}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-block', padding: '0.15rem 0.6rem', borderRadius: 4,
                                fontSize: '0.75rem', fontWeight: 600,
                                background: p.estado === 'pagado' ? '#f0fdf4' : p.estado === 'pendiente' ? '#fffbeb' : '#fef2f2',
                                color: p.estado === 'pagado' ? '#166534' : p.estado === 'pendiente' ? '#92400e' : '#991b1b',
                              }}>
                                {p.estado}
                              </span>
                            </td>
                            <td className="d-none d-sm-table-cell" style={{ color: C.slate }}>{p.fecha_pago ? fmt(p.fecha_pago) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', paddingTop: '1.2rem', marginTop: '0.5rem', borderTop: `1px solid ${C.slateBorder}`, color: C.slateLight, fontSize: '0.68rem' }}>
              <p style={{ margin: 0, fontWeight: 500 }}>Colegio Futuro Digital · Sistema de Gestión Académica</p>
              <p style={{ margin: '3px 0 0' }}>Reporte generado el {new Date().toLocaleString('es-PE')}</p>
            </div>
          </div>
        </div>
      )}

      {!childData && !loading && (
        <div className="text-center py-5" style={{ color: C.slateLight }}>
          <i className="bi bi-people" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
          <p className="mt-2" style={{ fontSize: '0.95rem' }}>Selecciona un estudiante para ver su reporte</p>
        </div>
      )}

      {/* Report history */}
      {reportesHistorial.length > 0 && (
        <div className="card dashboard-card mt-4 no-print rpt-fade" style={{ borderRadius: 18, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="card-header app-card-header" style={{ borderRadius: '18px 18px 0 0' }}>
            <h5 className="mb-0 fw-bold"><i className="bi bi-clock-history me-2"></i>Reportes Generados</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 app-table" style={{ fontSize: '0.84rem' }}>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Estudiante</th>
                    <th className="d-none d-sm-table-cell">Periodo</th>
                    <th className="d-none d-sm-table-cell">Formato</th>
                    <th style={{ textAlign: 'center' }}>Estado</th>
                    <th className="d-none d-md-table-cell">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {reportesHistorial.map(r => (
                    <tr key={r.id}>
                      <td>
                        <span style={{ padding: '0.2rem 0.7rem', borderRadius: 6, background: C.blueBg, color: C.blue, fontWeight: 600, fontSize: '0.78rem', textTransform: 'capitalize' }}>
                          {r.tipo_reporte}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: C.dark }}>{r.datos_reporte ? (typeof r.datos_reporte === 'string' ? JSON.parse(r.datos_reporte).alumno : r.datos_reporte.alumno) : '—'}</td>
                      <td className="d-none d-sm-table-cell" style={{ color: C.slate }}>{r.periodo_academico || '—'}</td>
                      <td className="d-none d-sm-table-cell"><span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.04em', color: C.slate }}>{r.formato?.toUpperCase()}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge text={r.estado} color={C.green} />
                      </td>
                      <td className="d-none d-md-table-cell" style={{ color: C.slate, fontSize: '0.8rem' }}>{fmt(r.fecha_generacion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reportes;
