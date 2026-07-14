import React, { useEffect, useState, useCallback } from 'react';
import { logsService } from '../api/services';
import { useSortableData } from '../utils/tableSort';

/* ── Types ─────────────────────────────────────────────────────── */
interface Log {
  id: string;
  usuario_id: string | null;
  usuario_nombre: string | null;
  usuario_rol: string | null;
  accion: string;
  tabla_afectada: string;
  registro_id: string | null;
  datos_antes: string | null;
  datos_despues: string | null;
  ip_origen: string | null;
  fecha_accion: string;
}

interface Stats {
  porAccion: { accion: string; total: number }[];
  porTabla: { tabla_afectada: string; total: number }[];
  recientes: Log[];
  usuariosActivos: { nombre: string; tipo_usuario: string; acciones: number; ultima_accion: string }[];
}

/* ── Helpers ────────────────────────────────────────────────────── */
const METODO_LABEL: Record<string, { label: string; color: string; icon: string }> = {
  'POST:CREAR':       { label: 'POST',   color: '#059669', icon: 'bi-plus-circle-fill' },
  'PUT:ACTUALIZAR':   { label: 'PUT',    color: '#0891b2', icon: 'bi-pencil-fill' },
  'PATCH:ACTUALIZAR': { label: 'PATCH',  color: '#0891b2', icon: 'bi-pencil-fill' },
  'DELETE:ELIMINAR':  { label: 'DELETE', color: '#dc2626', icon: 'bi-trash3-fill' },
  'CREAR':            { label: 'CREAR',  color: '#059669', icon: 'bi-plus-circle-fill' },
  'ACTUALIZAR':       { label: 'UPD',    color: '#0891b2', icon: 'bi-pencil-fill' },
  'ELIMINAR':         { label: 'DEL',    color: '#dc2626', icon: 'bi-trash3-fill' },
};

const getAccionMeta = (accion: string) =>
  METODO_LABEL[accion] ?? { label: accion, color: '#64748b', icon: 'bi-circle' };

const TABLA_ICONS: Record<string, string> = {
  alumnos: 'bi-people', profesores: 'bi-person-badge', cursos: 'bi-book',
  matriculas: 'bi-clipboard-check', pagos: 'bi-credit-card', asistencias: 'bi-calendar-check',
  calificaciones: 'bi-graph-up', notificaciones: 'bi-bell',
};

const fmtDate = (d: string) => {
  if (!d) return '—';
  const dt = new Date(d.replace(' ', 'T') + 'Z');
  return dt.toLocaleString('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const TABLAS_FILTRO = ['alumnos', 'profesores', 'cursos', 'matriculas', 'pagos', 'asistencias', 'calificaciones', 'notificaciones'];

/* ── Detail drawer component ────────────────────────────────────── */
const LogDetail: React.FC<{ log: Log | null; onClose: () => void }> = ({ log, onClose }) => {
  if (!log) return null;
  const meta = getAccionMeta(log.accion);

  const renderJson = (raw: string | null, label: string) => {
    if (!raw || raw === 'null') return null;
    try {
      const obj = JSON.parse(raw);
      return (
        <div className="mb-3">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: '0.4rem' }}>{label}</div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.85rem', maxHeight: 220, overflowY: 'auto' }}>
            <pre style={{ margin: 0, fontSize: '0.78rem', color: '#334155', fontFamily: "'Courier New', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(obj, null, 2)}
            </pre>
          </div>
        </div>
      );
    } catch {
      return null;
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', justifyContent: 'flex-end' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }} onClick={onClose} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, background: '#fff', boxShadow: '-8px 0 40px rgba(15,23,42,0.18)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg,#0f47a1,#1976d2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div className="d-flex align-items-center gap-2">
            <i className={`bi ${meta.icon}`}></i>
            <span className="fw-bold">Detalle del log</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', flex: 1 }}>
          {/* Badges */}
          <div className="d-flex flex-wrap gap-2 mb-4">
            <span style={{ padding: '0.3rem 0.8rem', borderRadius: 8, background: `${meta.color}15`, color: meta.color, fontWeight: 700, fontSize: '0.8rem', border: `1px solid ${meta.color}35` }}>
              <i className={`bi ${meta.icon} me-1`}></i>{meta.label}
            </span>
            <span style={{ padding: '0.3rem 0.8rem', borderRadius: 8, background: 'rgba(15,98,254,0.08)', color: '#1565c0', fontWeight: 700, fontSize: '0.8rem', border: '1px solid rgba(15,98,254,0.2)' }}>
              <i className={`bi ${TABLA_ICONS[log.tabla_afectada] || 'bi-table'} me-1`}></i>
              {log.tabla_afectada}
            </span>
          </div>

          {/* Info grid */}
          <div style={{ display: 'grid', gap: '0.65rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Usuario', value: log.usuario_nombre || '(sistema)', sub: log.usuario_rol },
              { label: 'Fecha y hora', value: fmtDate(log.fecha_accion) },
              { label: 'Registro afectado', value: log.registro_id ? log.registro_id.substring(0, 18) + '…' : '—' },
              { label: 'IP origen', value: log.ip_origen || '—' },
            ].map(item => (
              <div key={item.label} style={{ padding: '0.7rem 0.9rem', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: '0.2rem' }}>{item.label}</div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{item.value}</div>
                {item.sub && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 1 }}>{item.sub}</div>}
              </div>
            ))}
          </div>

          {renderJson(log.datos_antes, 'Estado anterior')}
          {renderJson(log.datos_despues, 'Estado posterior')}
        </div>
      </div>
    </div>
  );
};

/* ── Main page ──────────────────────────────────────────────────── */
const AuditoriaLogs: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  // Filters
  const [filterTabla, setFilterTabla] = useState('');
  const [filterAccion, setFilterAccion] = useState('');
  const [filterDesde, setFilterDesde] = useState('');
  const [filterHasta, setFilterHasta] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const { sortConfig, requestSort, sortedRows } = useSortableData(logs, 'fecha_accion');

  const fetchLogs = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page: p, limit: 50 };
      if (filterTabla)  params.tabla  = filterTabla;
      if (filterAccion) params.accion = filterAccion;
      if (filterDesde)  params.desde  = filterDesde;
      if (filterHasta)  params.hasta  = filterHasta;
      const res = await logsService.getLogs(params);
      const d = res.data?.datos;
      setLogs(d?.logs || []);
      setTotalPages(d?.pages || 1);
      setTotalLogs(d?.total || 0);
      setPage(p);
    } catch { setError('Error al cargar logs'); }
    finally { setLoading(false); }
  }, [filterTabla, filterAccion, filterDesde, filterHasta]);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const r = await logsService.getStats();
      setStats(r.data?.datos || null);
    } catch { /* ignore */ }
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const filtrados = sortedRows.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (l.usuario_nombre || '').toLowerCase().includes(q) ||
      (l.tabla_afectada || '').toLowerCase().includes(q) ||
      (l.accion || '').toLowerCase().includes(q) ||
      (l.registro_id || '').toLowerCase().includes(q);
  });

  const SortIcon = ({ col }: { col: string }) =>
    sortConfig.key === col
      ? <i className={`bi bi-caret-${sortConfig.direction === 'asc' ? 'up' : 'down'}-fill ms-1`} style={{ fontSize: '0.7rem' }} />
      : <i className="bi bi-chevron-expand ms-1 text-muted" style={{ fontSize: '0.65rem' }} />;

  return (
    <div className="screen-page page-shell container-fluid p-2 p-md-4">
      {/* Hero */}
      <div className="page-hero mb-4">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="hero-pill"><i className="bi bi-shield-check me-1"></i> Auditoría</span>
          <span className="hero-pill-count">{totalLogs} registros</span>
        </div>
        <h1 className="page-hero-title"><i className="bi bi-journal-text me-2"></i>Logs de Auditoría</h1>
        <p className="page-hero-subtitle">Rastrea todas las operaciones POST/PUT/DELETE realizadas en el sistema con detalle completo de cambios.</p>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-x-circle-fill"></i><span>{error}</span>
          <button className="btn-close ms-auto" onClick={() => setError('')} />
        </div>
      )}

      {/* Stats cards */}
      {!statsLoading && stats && (
        <div className="row g-3 mb-4">
          {/* Acciones breakdown */}
          <div className="col-12 col-lg-5">
            <div className="card dashboard-card h-100" style={{ borderRadius: 18 }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-activity text-primary"></i>
                  <span className="fw-bold" style={{ fontSize: '0.9rem' }}>Operaciones por tipo</span>
                </div>
                <div className="d-flex flex-column gap-2">
                  {stats.porAccion.map(a => {
                    const meta = getAccionMeta(a.accion);
                    const pct = totalLogs > 0 ? Math.round((a.total / totalLogs) * 100) : 0;
                    return (
                      <div key={a.accion}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="d-flex align-items-center gap-2" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                            <i className={`bi ${meta.icon}`} style={{ color: meta.color }}></i>
                            {meta.label} <span style={{ color: '#94a3b8', fontWeight: 400 }}>· {a.accion}</span>
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: meta.color }}>{a.total}</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 99, background: '#f1f5f9' }}>
                          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: meta.color, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Tables breakdown */}
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card dashboard-card h-100" style={{ borderRadius: 18 }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-table text-info"></i>
                  <span className="fw-bold" style={{ fontSize: '0.9rem' }}>Tablas más afectadas</span>
                </div>
                <div className="d-flex flex-column gap-2">
                  {stats.porTabla.slice(0, 6).map(t => (
                    <div key={t.tabla_afectada} className="d-flex align-items-center justify-content-between">
                      <span className="d-flex align-items-center gap-2" style={{ fontSize: '0.82rem', color: '#374151' }}>
                        <i className={`bi ${TABLA_ICONS[t.tabla_afectada] || 'bi-table'} text-primary`}></i>
                        {t.tabla_afectada}
                      </span>
                      <span className="badge" style={{ background: 'rgba(15,98,254,0.1)', color: '#1565c0', fontWeight: 700 }}>{t.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active users */}
          <div className="col-12 col-md-6 col-lg-3">
            <div className="card dashboard-card h-100" style={{ borderRadius: 18 }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-people text-success"></i>
                  <span className="fw-bold" style={{ fontSize: '0.9rem' }}>Usuarios activos</span>
                </div>
                <div className="d-flex flex-column gap-2">
                  {stats.usuariosActivos.slice(0, 5).map(u => (
                    <div key={u.nombre} className="d-flex align-items-center justify-content-between">
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{u.nombre}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{u.tipo_usuario}</div>
                      </div>
                      <span className="badge" style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', fontWeight: 700 }}>{u.acciones}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card dashboard-card mb-3" style={{ borderRadius: 18 }}>
        <div className="card-body p-3">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-sm-6 col-md-3 col-lg-2">
              <label className="form-label fw-semibold" style={{ fontSize: '0.78rem' }}>Tabla</label>
              <select className="form-select form-select-sm" value={filterTabla} onChange={e => setFilterTabla(e.target.value)}>
                <option value="">Todas</option>
                {TABLAS_FILTRO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-3 col-lg-2">
              <label className="form-label fw-semibold" style={{ fontSize: '0.78rem' }}>Operación</label>
              <select className="form-select form-select-sm" value={filterAccion} onChange={e => setFilterAccion(e.target.value)}>
                <option value="">Todas</option>
                <option value="CREAR">POST / CREAR</option>
                <option value="ACTUALIZAR">PUT / ACTUALIZAR</option>
                <option value="ELIMINAR">DELETE / ELIMINAR</option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-2 col-lg-2">
              <label className="form-label fw-semibold" style={{ fontSize: '0.78rem' }}>Desde</label>
              <input type="date" className="form-control form-control-sm" value={filterDesde} onChange={e => setFilterDesde(e.target.value)} />
            </div>
            <div className="col-12 col-sm-6 col-md-2 col-lg-2">
              <label className="form-label fw-semibold" style={{ fontSize: '0.78rem' }}>Hasta</label>
              <input type="date" className="form-control form-control-sm" value={filterHasta} onChange={e => setFilterHasta(e.target.value)} />
            </div>
            <div className="col-12 col-md-4 col-lg-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.78rem' }}>Buscar</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input type="text" className="form-control" placeholder="Usuario, tabla, ID…" value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button className="btn btn-outline-secondary" onClick={() => setSearch('')}><i className="bi bi-x"></i></button>}
              </div>
            </div>
            <div className="col-12 col-lg-1 d-flex gap-2">
              <button className="btn btn-primary btn-sm w-100" onClick={() => fetchLogs(1)}>
                <i className="bi bi-funnel me-1"></i>Filtrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading"><div className="spinner-border text-primary" role="status" /></div>
      ) : (
        <div className="card dashboard-card table-shell">
          <div className="card-header app-card-header">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-journal-text me-2"></i>Registros
                <span className="badge bg-white text-primary ms-2 fw-semibold" style={{ fontSize: '0.78rem' }}>{filtrados.length}</span>
              </h5>
              <div className="d-flex align-items-center gap-2">
                <button className="btn btn-light btn-sm" onClick={() => { fetchLogs(page); fetchStats(); }} title="Refrescar">
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)' }}>
                  Página {page} de {totalPages} · {totalLogs} total
                </span>
                <button className="btn btn-light btn-sm" disabled={page <= 1} onClick={() => fetchLogs(page - 1)}>
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button className="btn btn-light btn-sm" disabled={page >= totalPages} onClick={() => fetchLogs(page + 1)}>
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 app-table">
                <thead>
                  <tr>
                    <th onClick={() => requestSort('fecha_accion')} style={{ cursor: 'pointer', width: 160 }}>
                      Fecha <SortIcon col="fecha_accion" />
                    </th>
                    <th onClick={() => requestSort('accion')} style={{ cursor: 'pointer', width: 130 }}>
                      Operación <SortIcon col="accion" />
                    </th>
                    <th onClick={() => requestSort('tabla_afectada')} style={{ cursor: 'pointer' }}>
                      Tabla <SortIcon col="tabla_afectada" />
                    </th>
                    <th onClick={() => requestSort('usuario_nombre')} style={{ cursor: 'pointer' }} className="d-none d-md-table-cell">
                      Usuario <SortIcon col="usuario_nombre" />
                    </th>
                    <th className="d-none d-lg-table-cell">Registro ID</th>
                    <th style={{ width: 80 }} className="text-center">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-5 text-muted">
                      <i className="bi bi-journal-x" style={{ fontSize: '2.5rem', opacity: 0.25 }}></i>
                      <p className="mt-2 mb-0">No se encontraron registros</p>
                    </td></tr>
                  ) : filtrados.map(log => {
                    const meta = getAccionMeta(log.accion);
                    return (
                      <tr key={log.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedLog(log)}>
                        <td style={{ fontSize: '0.8rem', color: '#475569', whiteSpace: 'nowrap' }}>
                          {fmtDate(log.fecha_accion)}
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                              padding: '0.25rem 0.65rem', borderRadius: 7,
                              background: `${meta.color}12`, color: meta.color,
                              border: `1px solid ${meta.color}30`,
                              fontWeight: 700, fontSize: '0.75rem',
                            }}
                          >
                            <i className={`bi ${meta.icon}`}></i>
                            {meta.label}
                          </span>
                        </td>
                        <td>
                          <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }}>
                            <i className={`bi ${TABLA_ICONS[log.tabla_afectada] || 'bi-table'} text-primary`} style={{ fontSize: '0.9rem' }}></i>
                            {log.tabla_afectada}
                          </span>
                        </td>
                        <td className="d-none d-md-table-cell">
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{log.usuario_nombre || <span className="text-muted">sistema</span>}</div>
                          <small className="text-muted">{log.usuario_rol || ''}</small>
                        </td>
                        <td className="d-none d-lg-table-cell">
                          <code style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {log.registro_id ? log.registro_id.substring(0, 14) + '…' : '—'}
                          </code>
                        </td>
                        <td className="text-center" onClick={e => { e.stopPropagation(); setSelectedLog(log); }}>
                          <button
                            className="btn btn-sm"
                            style={{ background: 'rgba(15,98,254,0.08)', color: '#1565c0', border: '1px solid rgba(15,98,254,0.2)', borderRadius: 8 }}
                            title="Ver detalle"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination footer */}
          {totalPages > 1 && (
            <div className="card-footer" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '0.75rem 1.25rem' }}>
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Mostrando {((page - 1) * 50) + 1}–{Math.min(page * 50, totalLogs)} de {totalLogs} registros
                </span>
                <div className="d-flex gap-1">
                  <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => fetchLogs(1)}>
                    <i className="bi bi-chevron-double-left"></i>
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => fetchLogs(page - 1)}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return p <= totalPages ? (
                      <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => fetchLogs(p)}>
                        {p}
                      </button>
                    ) : null;
                  })}
                  <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages} onClick={() => fetchLogs(page + 1)}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages} onClick={() => fetchLogs(totalPages)}>
                    <i className="bi bi-chevron-double-right"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail side panel */}
      <LogDetail log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
};

export default AuditoriaLogs;
