import React, { useEffect, useState, useMemo } from 'react';
import { notificacionesService, usuariosService, alumnosService } from '../api/services';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { can } from '../utils/permissions';
import { useSortableData } from '../utils/tableSort';

interface Notificacion {
  id?: string;
  destinatario_id: string;
  tipo: string;
  mensaje: string;
  leida: boolean;
  fecha_creacion?: string;
  destinatario_nombre?: string;
  destinatario_email?: string;
  destinatario_tipo?: string;
}

const Notificaciones: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Tab filter state
  const [activeTab, setActiveTab] = useState<'todas' | 'noleidas' | 'alertas' | 'recordatorios' | 'informacion'>('todas');
  
  // Accordion expanded item state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(current => current === id ? null : id);
  };

  // Form states for creating a new notification (live preview)
  const [formData, setFormData] = useState<Notificacion>({
    destinatario_id: '',
    tipo: 'informacion',
    mensaje: '',
    leida: false
  });

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [alumnos, setAlumnos] = useState<any[]>([]);

  // Real-time phone time simulator
  const [currentTime, setCurrentTime] = useState('09:41');

  // Update clock inside mockup in real-time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const { sortedRows: notificacionesOrdenadas } = useSortableData(notificaciones, 'fecha_creacion');

  useEffect(() => {
    fetchNotificaciones();
    fetchRelacionados();
  }, []);

  const fetchRelacionados = async () => {
    try {
      const [uResp, aResp] = await Promise.all([usuariosService.getAll(), alumnosService.getAll()]);
      setUsuarios(uResp.data?.datos || []);
      setAlumnos(aResp.data?.datos || []);
    } catch (err) {
      console.error('Error cargando usuarios/alumnos:', err);
    }
  };

  const { user } = useAuth();
  const { notify, confirm } = useToast();
  const role = user?.tipo_usuario;
  const allowCreate = can(role, 'notificaciones', 'create');
  const allowEdit = can(role, 'notificaciones', 'edit');
  const allowDelete = can(role, 'notificaciones', 'delete');

  const fetchNotificaciones = async () => {
    try {
      setLoading(true);
      const response = await notificacionesService.getAll();
      setNotificaciones(response.data?.datos || []);
      setError('');
    } catch (err: any) {
      setError('Error al cargar notificaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (notificacion?: Notificacion) => {
    if (notificacion) {
      if (!allowEdit) {
        notify({ message: 'No autorizado para editar notificaciones', type: 'warning' });
        return;
      }
      setEditingId(notificacion.id || null);
      setFormData(notificacion as Notificacion);
      setShowModal(true);
    } else {
      // Clear form for dispatcher
      setFormData({
        destinatario_id: '',
        tipo: 'informacion',
        mensaje: '',
        leida: false
      });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  // Submit standard modal save (for editing)
  const handleSaveModal = async () => {
    if (!formData.destinatario_id || !formData.mensaje) {
      setError('Por favor completa los campos obligatorios');
      return;
    }

    try {
      if (editingId) {
        await notificacionesService.update(editingId, formData);
        notify({ message: 'Notificación actualizada correctamente', type: 'success' });
      }
      handleCloseModal();
      fetchNotificaciones();
    } catch (err: any) {
      setError('Error al guardar notificación');
      console.error(err);
    }
  };

  // Dispatch brand new notification from live center
  const handleDispatchNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.destinatario_id || !formData.mensaje) {
      notify({ message: 'Por favor completa el destinatario y el mensaje', type: 'warning' });
      return;
    }

    try {
      setError('');
      await notificacionesService.create(formData);
      notify({ message: '¡Notificación enviada y simulada con éxito!', type: 'success' });
      
      // Clear message field
      setFormData(prev => ({
        ...prev,
        mensaje: ''
      }));

      // Refresh list
      fetchNotificaciones();
    } catch (err: any) {
      console.error(err);
      notify({ message: 'Error al enviar notificación', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: '¿Estás seguro de eliminar esta notificación permanentemente?' }))) return;

    try {
      await notificacionesService.delete(id);
      notify({ message: 'Notificación eliminada correctamente', type: 'success' });
      fetchNotificaciones();
    } catch (err: any) {
      notify({ message: 'Error al eliminar la notificación', type: 'error' });
      console.error(err);
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering accordion expand
    try {
      await notificacionesService.markAsRead(id);
      notify({ message: 'Notificación marcada como leída', type: 'success' });
      
      // Update local state instantly with a smooth color transition
      setNotificaciones(prev => 
        prev.map(notif => notif.id === id ? { ...notif, leida: true } : notif)
      );
    } catch (err) {
      console.error(err);
      notify({ message: 'Error al marcar como leída', type: 'error' });
    }
  };

  const calculateStats = useMemo(() => {
    return {
      leidas: notificaciones.filter(n => n.leida).length,
      noleidas: notificaciones.filter(n => !n.leida).length,
      informaciones: notificaciones.filter(n => n.tipo === 'informacion').length,
      alertas: notificaciones.filter(n => n.tipo === 'alerta' || n.tipo === 'urgente').length,
      recordatorios: notificaciones.filter(n => n.tipo === 'recordatorio').length,
      total: notificaciones.length
    };
  }, [notificaciones]);

  const getDestinatarioNombre = (id: string) => {
    if (!id) return '-';
    const u = usuarios.find((x) => x.id === id);
    if (u) return u.nombre;
    const a = alumnos.find((x) => x.id === id);
    if (a) return `${a.primer_nombre} ${a.apellido_paterno}`;
    return id;
  };

  const getDestinatarioLabel = (id: string) => {
    if (!id) return '';
    const u = usuarios.find((x) => x.id === id);
    if (u) return `${u.nombre} (${u.tipo_usuario})`;
    const a = alumnos.find((x) => x.id === id);
    if (a) return `${a.primer_nombre} ${a.apellido_paterno} (Estudiante)`;
    if (id === '__other') return 'Otro destinatario';
    return id;
  };

  const getTipoBadge = (tipo: string) => {
    const t = tipo.toLowerCase();
    if (t === 'alerta' || t === 'urgente') return 'danger';
    if (t === 'recordatorio') return 'warning';
    return 'info';
  };

  const getTipoLabel = (tipo: string) => {
    const t = tipo.toLowerCase();
    if (t === 'alerta') return '⚠️ Alerta';
    if (t === 'urgente') return '🚨 Urgente';
    if (t === 'recordatorio') return '📅 Recordatorio';
    return '💬 Información';
  };

  const getTipoIcon = (tipo: string) => {
    const t = tipo.toLowerCase();
    if (t === 'alerta') return 'bi-exclamation-triangle-fill';
    if (t === 'urgente') return 'bi-lightning-charge-fill';
    if (t === 'recordatorio') return 'bi-calendar-event-fill';
    return 'bi-info-circle-fill';
  };

  // Filter list dynamically based on active tab
  const filteredNotificaciones = useMemo(() => {
    return notificacionesOrdenadas.filter(n => {
      if (activeTab === 'todas') return true;
      if (activeTab === 'noleidas') return !n.leida;
      if (activeTab === 'alertas') return n.tipo === 'alerta' || n.tipo === 'urgente';
      if (activeTab === 'recordatorios') return n.tipo === 'recordatorio';
      if (activeTab === 'informacion') return n.tipo === 'informacion';
      return true;
    });
  }, [notificacionesOrdenadas, activeTab]);

  return (
    <div className="page-shell container-fluid p-2 p-md-4">
      {/* Styles for dynamic interactions and glassmorphism elements */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Premium custom variables */
        :root {
          --glass-bg: rgba(255, 255, 255, 0.45);
          --glass-border: rgba(255, 255, 255, 0.25);
          --neon-blue: #0ea5e9;
          --neon-amber: #f59e0b;
          --neon-rose: #f43f5e;
          --neon-green: #10b981;
        }
        
        /* Glassmorphism containers */
        .glass-panel {
          background: rgba(255, 255, 255, 0.68);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(148, 163, 184, 0.06);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        body.dark-mode .glass-panel {
          background: rgba(30, 41, 59, 0.72);
          border-color: rgba(100, 116, 139, 0.25);
          box-shadow: 0 10px 35px rgba(0, 0, 0, 0.18);
        }

        /* Stats Cards with harmonic gradients and micro-scale on hover */
        .gradient-stat-card {
          border-radius: 20px;
          border: 1px solid transparent;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          position: relative;
          cursor: default;
        }
        .gradient-stat-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.1);
        }
        body.dark-mode .gradient-stat-card:hover {
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
        }

        .pulsing-glow {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--neon-amber);
          box-shadow: 0 0 12px var(--neon-amber), 0 0 20px var(--neon-amber);
          animation: pulseGlow 1.8s infinite alternate;
          top: 14px;
          right: 14px;
        }

        @keyframes pulseGlow {
          0% { transform: scale(0.9); opacity: 0.5; box-shadow: 0 0 4px var(--neon-amber); }
          100% { transform: scale(1.4); opacity: 1; box-shadow: 0 0 16px var(--neon-amber), 0 0 25px var(--neon-amber); }
        }

        /* Tab Pill design */
        .tab-bar-container {
          background: rgba(15, 23, 42, 0.05);
          border-radius: 16px;
          padding: 6px;
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        body.dark-mode .tab-bar-container {
          background: rgba(15, 23, 42, 0.35);
        }
        .tab-btn-pill {
          background: transparent;
          border: none;
          color: #475569;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 8px 16px;
          border-radius: 12px;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        body.dark-mode .tab-btn-pill {
          color: #94a3b8;
        }
        .tab-btn-pill:hover {
          color: #0f172a;
          background: rgba(255, 255, 255, 0.4);
        }
        body.dark-mode .tab-btn-pill:hover {
          color: #f8fafc;
          background: rgba(255, 255, 255, 0.05);
        }
        .tab-btn-pill.active {
          background: #fff;
          color: #4f46e5;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
        }
        body.dark-mode .tab-btn-pill.active {
          background: #1e293b;
          color: #60a5fa;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        /* Advanced Phone Mockup container */
        .smartphone-mockup {
          width: 100%;
          max-width: 290px;
          height: 520px;
          border: 11px solid #1e293b;
          border-radius: 36px;
          background: linear-gradient(180deg, #1e1b4b 0%, #030712 100%);
          box-shadow: 0 30px 60px rgba(0,0,0,0.45);
          position: relative;
          overflow: hidden;
          margin: 0 auto;
        }
        body.dark-mode .smartphone-mockup {
          border-color: #0f172a;
        }

        .smartphone-screen {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 44px 16px 16px;
          box-sizing: border-box;
          background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 60%);
        }

        .smart-camera-notch {
          width: 110px;
          height: 25px;
          background: #000;
          border-radius: 20px;
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          box-shadow: inset 0 0 4px rgba(255,255,255,0.2);
        }

        .smart-time-clock {
          color: #fff;
          font-size: 2.75rem;
          font-weight: 200;
          text-align: center;
          margin-top: 20px;
          letter-spacing: -1px;
          font-family: 'Outfit', sans-serif;
        }
        .smart-date {
          color: rgba(255,255,255,0.85);
          font-size: 0.8rem;
          font-weight: 500;
          text-align: center;
          margin-top: 2px;
          margin-bottom: 25px;
        }

        /* Floating Lockscreen Notification */
        .mock-push-banner {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 18px;
          padding: 12px 14px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
          color: #fff;
          font-size: 0.82rem;
          animation: slidePushDown 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: top center;
        }
        body.dark-mode .mock-push-banner {
          background: rgba(15, 23, 42, 0.45);
          border-color: rgba(255,255,255,0.08);
        }

        @keyframes slidePushDown {
          0% { transform: translateY(-30px) scale(0.92); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }

        .push-app-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .push-message-content {
          margin: 0;
          color: #ffffff;
          line-height: 1.4;
          font-weight: 400;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Type selector chip cards */
        .type-selector-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .type-select-chip {
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          padding: 12px;
          text-align: center;
          background: #fff;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 0.82rem;
          color: #334155;
        }
        body.dark-mode .type-select-chip {
          border-color: rgba(148, 163, 184, 0.2);
          background: rgba(15, 23, 42, 0.25);
          color: #cbd5e1;
        }
        .type-select-chip:hover {
          transform: translateY(-2px);
          border-color: #6366f1;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
        }
        .type-select-chip.active {
          border-color: #4f46e5;
          background: rgba(99, 102, 241, 0.06);
          color: #4f46e5;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.12);
        }
        body.dark-mode .type-select-chip.active {
          border-color: #60a5fa;
          background: rgba(96, 165, 250, 0.08);
          color: #60a5fa;
          box-shadow: 0 4px 16px rgba(96, 165, 250, 0.2);
        }

        /* Expandable Interactive Inbox Cards */
        .inbox-card-interactive {
          border-radius: 16px;
          border: 1px solid rgba(226, 232, 240, 0.95);
          padding: 16px 20px;
          background: #fff;
          transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          cursor: pointer;
        }
        body.dark-mode .inbox-card-interactive {
          border-color: rgba(148, 163, 184, 0.12);
          background: rgba(30, 41, 59, 0.65);
        }
        .inbox-card-interactive:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.07);
          border-color: rgba(99, 102, 241, 0.25);
        }
        body.dark-mode .inbox-card-interactive:hover {
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.25);
          border-color: rgba(96, 165, 250, 0.25);
        }

        .inbox-unread-border {
          border-left: 4px solid var(--neon-amber) !important;
          background: linear-gradient(90deg, rgba(245, 158, 11, 0.03) 0%, #fff 100%) !important;
        }
        body.dark-mode .inbox-unread-border {
          background: linear-gradient(90deg, rgba(245, 158, 11, 0.06) 0%, rgba(30, 41, 59, 0.65) 100%) !important;
        }

        .quick-action-badge {
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          cursor: pointer;
          background: rgba(15, 23, 42, 0.05);
          color: #475569;
          transition: all 0.2s ease;
          border: none;
        }
        body.dark-mode .quick-action-badge {
          background: rgba(255, 255, 255, 0.06);
          color: #94a3b8;
        }
        .quick-action-badge:hover {
          background: rgba(79, 70, 229, 0.1);
          color: #4f46e5;
          transform: scale(1.1);
        }
        body.dark-mode .quick-action-badge:hover {
          background: rgba(96, 165, 250, 0.15);
          color: #60a5fa;
        }

        .smart-accordion-detail {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out, padding 0.3s ease;
          padding: 0;
          opacity: 0;
        }
        .smart-accordion-detail.expanded {
          max-height: 400px;
          padding-top: 14px;
          border-top: 1px dashed rgba(226, 232, 240, 0.8);
          margin-top: 14px;
          opacity: 1;
        }
        body.dark-mode .smart-accordion-detail.expanded {
          border-top-color: rgba(148, 163, 184, 0.15);
        }
      ` }} />

      {/* Page Header */}
      <div className="page-hero mb-4 glass-panel p-4" style={{ 
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.15)' 
      }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h1 className="page-hero-title d-flex align-items-center gap-3 fw-extrabold" style={{ letterSpacing: '-0.5px' }}>
              <i className="bi bi-bell-fill text-primary animated-bell" style={{ fontSize: '1.8rem' }}></i>
              Centro de Notificaciones
            </h1>
            <p className="page-hero-subtitle text-muted mb-0 fw-medium">
              Envía avisos rápidos y visualiza comunicados escolares en una bandeja interactiva en tiempo real.
            </p>
          </div>
          {allowCreate && (
            <button 
              className="btn btn-primary d-md-none"
              onClick={() => handleOpenModal()}
              style={{ borderRadius: '14px', padding: '10px 20px', fontWeight: 700 }}
            >
              <i className="bi bi-plus-lg me-2"></i> Nueva Notificación
            </button>
          )}
        </div>
      </div>

      {/* Direct Alert Prompts */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show border-0 shadow-sm mb-4" role="alert" style={{ borderRadius: '16px', background: 'rgba(239, 68, 68, 0.08)', color: '#dc2626' }}>
          <i className="bi bi-exclamation-octagon-fill me-2"></i> {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm mb-4" role="alert" style={{ borderRadius: '16px', background: 'rgba(16, 185, 129, 0.08)', color: '#059669' }}>
          <i className="bi bi-check-circle-fill me-2"></i> {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {/* Statistics Cards - WOW factors */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card gradient-stat-card glass-panel h-100" style={{ borderLeft: '4px solid #6366f1' }}>
            <div className="card-body py-3 px-3 text-center">
              <span className="text-muted small fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</span>
              <h2 className="fw-extrabold text-primary mb-0 mt-1" style={{ fontSize: '1.9rem' }}>{calculateStats.total}</h2>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card gradient-stat-card glass-panel h-100" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="card-body py-3 px-3 text-center">
              <span className="text-muted small fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sin Leer</span>
              <h2 className="fw-extrabold text-warning mb-0 mt-1" style={{ fontSize: '1.9rem' }}>
                {calculateStats.noleidas}
                {calculateStats.noleidas > 0 && <span className="pulsing-glow"></span>}
              </h2>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card gradient-stat-card glass-panel h-100" style={{ borderLeft: '4px solid #ef4444' }}>
            <div className="card-body py-3 px-3 text-center">
              <span className="text-muted small fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Alertas</span>
              <h2 className="fw-extrabold text-danger mb-0 mt-1" style={{ fontSize: '1.9rem' }}>{calculateStats.alertas}</h2>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card gradient-stat-card glass-panel h-100" style={{ borderLeft: '4px solid #0ea5e9' }}>
            <div className="card-body py-3 px-3 text-center">
              <span className="text-muted small fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mensajes</span>
              <h2 className="fw-extrabold text-info mb-0 mt-1" style={{ fontSize: '1.9rem' }}>{calculateStats.informaciones}</h2>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card gradient-stat-card glass-panel h-100" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="card-body py-3 px-3 text-center">
              <span className="text-muted small fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Leídas</span>
              <h2 className="fw-extrabold text-success mb-0 mt-1" style={{ fontSize: '1.9rem' }}>{calculateStats.leidas}</h2>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card gradient-stat-card glass-panel h-100" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="card-body py-3 px-3 text-center">
              <span className="text-muted small fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Efectividad</span>
              <h2 className="fw-extrabold text-success mb-0 mt-1" style={{ fontSize: '1.4rem', lineHeight: '2rem' }}>
                {calculateStats.total ? Math.round((calculateStats.leidas / calculateStats.total) * 100) : 0}%
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="row g-4">
        
        {/* Left Column: Interactive Inbox & Feed list */}
        <div className={allowCreate ? "col-12 col-xl-7" : "col-12"}>
          
          <div className="card glass-panel p-4 mb-4">
            
            {/* Header controls with tabs & title */}
            <div className="d-flex flex-column gap-3 mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="fw-extrabold text-dark mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-chat-left-text text-primary"></i>
                  Bandeja Escolar
                </h4>
                <span className="badge bg-light text-dark fw-bold border" style={{ fontSize: '0.8rem' }}>
                  {filteredNotificaciones.length} comunicados
                </span>
              </div>

              {/* Advanced Tab Pill Filter Bar */}
              <div className="tab-bar-container">
                <button 
                  className={`tab-btn-pill ${activeTab === 'todas' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('todas'); setExpandedId(null); }}
                >
                  Todas
                </button>
                <button 
                  className={`tab-btn-pill ${activeTab === 'noleidas' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('noleidas'); setExpandedId(null); }}
                >
                  Sin leer
                  {calculateStats.noleidas > 0 && (
                    <span className="badge bg-danger rounded-circle p-1" style={{ width: '8px', height: '8px' }}> </span>
                  )}
                </button>
                <button 
                  className={`tab-btn-pill ${activeTab === 'alertas' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('alertas'); setExpandedId(null); }}
                >
                  ⚠️ Alertas
                </button>
                <button 
                  className={`tab-btn-pill ${activeTab === 'recordatorios' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('recordatorios'); setExpandedId(null); }}
                >
                  📅 Recordatorios
                </button>
                <button 
                  className={`tab-btn-pill ${activeTab === 'informacion' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('informacion'); setExpandedId(null); }}
                >
                  💬 Información
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="text-muted mt-2 fw-medium">Sincronizando mensajes...</p>
              </div>
            ) : filteredNotificaciones.length === 0 ? (
              /* Beautiful empty state */
              <div className="text-center py-5 px-4" style={{ 
                borderRadius: '16px',
                background: 'rgba(148,163,184, 0.05)',
                border: '1.5px dashed rgba(148,163,184, 0.15)'
              }}>
                <div className="mx-auto mb-3 text-muted" style={{ fontSize: '3rem' }}>
                  <i className="bi bi-chat-heart text-primary animated-bell" style={{ display: 'inline-block' }}></i>
                </div>
                <h5 className="fw-bold text-dark">No hay comunicados aquí</h5>
                <p className="text-muted small mx-auto mb-0" style={{ maxWidth: '340px' }}>
                  Todo el correo está al día. Las nuevas notificaciones y alertas enviadas aparecerán en esta lista al instante.
                </p>
              </div>
            ) : (
              /* Interactive cards loop */
              <div className="d-flex flex-column gap-3">
                {filteredNotificaciones.map((notificacion) => {
                  const isExpanded = expandedId === notificacion.id;
                  const isUnread = !notificacion.leida;
                  
                  return (
                    <div 
                      key={`card-${notificacion.id}`} 
                      className={`inbox-card-interactive ${isUnread ? 'inbox-unread-border' : ''}`}
                      onClick={() => toggleExpand(notificacion.id!)}
                    >
                      
                      {/* Main card row */}
                      <div className="d-flex align-items-start justify-content-between gap-3">
                        <div className="d-flex align-items-center gap-3">
                          
                          {/* Colored Icon box */}
                          <div 
                            className={`inbox-icon bg-${getTipoBadge(notificacion.tipo)}-subtle text-${getTipoBadge(notificacion.tipo)} d-flex align-items-center justify-content-center`}
                            style={{ 
                              width: '42px', 
                              height: '42px', 
                              borderRadius: '12px',
                              fontSize: '1.1rem',
                              background: notificacion.tipo === 'alerta' || notificacion.tipo === 'urgente' 
                                ? 'rgba(239, 68, 68, 0.12)' 
                                : notificacion.tipo === 'recordatorio' 
                                  ? 'rgba(245, 158, 11, 0.12)' 
                                  : 'rgba(14, 165, 233, 0.12)'
                            }}
                          >
                            <i className={`bi ${getTipoIcon(notificacion.tipo)}`}></i>
                          </div>

                          <div>
                            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                              <span className="fw-extrabold text-dark" style={{ fontSize: '0.92rem' }}>
                                {notificacion.destinatario_nombre || getDestinatarioNombre(notificacion.destinatario_id)}
                              </span>
                              <span className={`badge bg-${getTipoBadge(notificacion.tipo)}`} style={{ fontSize: '0.62rem' }}>
                                {getTipoLabel(notificacion.tipo)}
                              </span>
                              {isUnread && (
                                <span className="badge bg-warning text-dark fw-extrabold" style={{ fontSize: '0.62rem' }}>
                                  NUEVO
                                </span>
                              )}
                            </div>

                            {/* Message snippet preview */}
                            <p 
                              className={`mb-0 text-muted ${isUnread ? 'fw-semibold text-dark' : ''}`}
                              style={{ 
                                fontSize: '0.88rem',
                                display: '-webkit-box',
                                WebkitLineClamp: isExpanded ? 'unset' : 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {notificacion.mensaje}
                            </p>
                          </div>
                        </div>

                        {/* Quick action buttons on right side */}
                        <div className="d-flex align-items-center gap-2" onClick={e => e.stopPropagation()}>
                          
                          {/* Direct Mark as Read action */}
                          {isUnread && (
                            <button 
                              className="quick-action-badge"
                              onClick={(e) => handleMarkAsRead(notificacion.id!, e)}
                              title="Marcar como leída"
                              style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#059669' }}
                            >
                              <i className="bi bi-check2-circle" style={{ fontSize: '1.1rem' }}></i>
                            </button>
                          )}

                          {allowEdit && (
                            <button 
                              className="quick-action-badge"
                              onClick={() => handleOpenModal(notificacion)}
                              title="Editar"
                            >
                              <i className="bi bi-pencil" style={{ fontSize: '0.88rem' }}></i>
                            </button>
                          )}

                          {allowDelete && (
                            <button 
                              className="quick-action-badge"
                              onClick={() => handleDelete(notificacion.id!)}
                              title="Eliminar"
                              style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#dc2626' }}
                            >
                              <i className="bi bi-trash" style={{ fontSize: '0.88rem' }}></i>
                            </button>
                          )}

                          {/* Accordion indicator arrow */}
                          <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} text-muted ms-1`} style={{ fontSize: '0.75rem' }}></i>

                        </div>
                      </div>

                      {/* Expandable detailed content section */}
                      <div className={`smart-accordion-detail ${isExpanded ? 'expanded' : ''}`}>
                        <div className="p-3 rounded bg-light border shadow-inner">
                          <div className="row g-2 mb-3">
                            <div className="col-12 col-md-6">
                              <small className="text-muted d-block uppercase fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>Para:</small>
                              <span className="fw-semibold text-dark" style={{ fontSize: '0.82rem' }}>
                                {getDestinatarioLabel(notificacion.destinatario_id)}
                              </span>
                            </div>
                            <div className="col-12 col-md-6 text-md-end">
                              <small className="text-muted d-block uppercase fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>Enviado el:</small>
                              <span className="fw-semibold text-dark" style={{ fontSize: '0.82rem' }}>
                                {notificacion.fecha_creacion 
                                  ? new Date(notificacion.fecha_creacion).toLocaleString() 
                                  : 'Fecha no registrada'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="border-top pt-2">
                            <small className="text-muted d-block uppercase fw-bold mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>Mensaje Completo:</small>
                            <p className="mb-0 text-dark fw-medium" style={{ fontSize: '0.88rem', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                              {notificacion.mensaje}
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dispatcher Center & Mobile Push Notification Preview Mockup */}
        {allowCreate && (
          <div className="col-12 col-xl-5">
            
            <div className="card glass-panel p-4 mb-4 h-100 d-flex flex-column justify-content-between" style={{ minHeight: '520px' }}>
              
              <div className="mb-4">
                <h4 className="fw-extrabold text-dark mb-2 d-flex align-items-center gap-2">
                  <i className="bi bi-send text-primary"></i>
                  Centro de Despacho
                </h4>
                <p className="text-muted small mb-0 fw-medium">
                  Compon y transmite comunicados. Mira cómo se verá en tiempo real antes de enviar.
                </p>
              </div>

              {/* Dispatch Form and Simulator */}
              <form onSubmit={handleDispatchNew} className="d-flex flex-column gap-3">
                
                {/* Select destinatario */}
                <div>
                  <label className="form-label fw-bold text-muted small" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Destinatario *</label>
                  <select
                    className="form-select"
                    value={formData.destinatario_id}
                    onChange={(e) => setFormData({ ...formData, destinatario_id: e.target.value })}
                    required
                    style={{ borderRadius: '12px' }}
                  >
                    <option value="">Seleccionar destinatario</option>
                    <optgroup label="Usuarios del Sistema">
                      {usuarios.map(u => (
                        <option key={u.id} value={u.id}>{u.nombre} ({u.tipo_usuario})</option>
                      ))}
                    </optgroup>
                    <optgroup label="Estudiantes matriculados">
                      {alumnos.map(a => (
                        <option key={a.id} value={a.id}>{a.primer_nombre} {a.apellido_paterno} (Grado: {a.periodo_academico})</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Priority / Type selector: Beautiful interactive Card buttons! */}
                <div>
                  <label className="form-label fw-bold text-muted small mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo de comunicado *</label>
                  <div className="type-selector-grid">
                    
                    <div 
                      className={`type-select-chip ${formData.tipo === 'informacion' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, tipo: 'informacion' })}
                    >
                      <i className="bi bi-info-circle-fill text-info" style={{ fontSize: '1.25rem' }}></i>
                      <span>Información</span>
                    </div>

                    <div 
                      className={`type-select-chip ${formData.tipo === 'alerta' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, tipo: 'alerta' })}
                    >
                      <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '1.25rem' }}></i>
                      <span>Alerta</span>
                    </div>

                    <div 
                      className={`type-select-chip ${formData.tipo === 'recordatorio' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, tipo: 'recordatorio' })}
                    >
                      <i className="bi bi-calendar-event-fill text-warning" style={{ fontSize: '1.25rem' }}></i>
                      <span>Recordatorio</span>
                    </div>

                    <div 
                      className={`type-select-chip ${formData.tipo === 'urgente' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, tipo: 'urgente' })}
                    >
                      <i className="bi bi-lightning-charge-fill text-danger" style={{ fontSize: '1.25rem' }}></i>
                      <span>Urgente</span>
                    </div>

                  </div>
                </div>

                {/* Message box */}
                <div>
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label fw-bold text-muted small" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mensaje *</label>
                    <span className="text-muted small" style={{ fontSize: '0.72rem' }}>{formData.mensaje.length} / 250</span>
                  </div>
                  <textarea
                    className="form-control"
                    placeholder="Escribe el mensaje aquí. Se sincronizará instantáneamente con la vista previa del teléfono..."
                    value={formData.mensaje}
                    onChange={(e) => setFormData({ ...formData, mensaje: e.target.value.slice(0, 250) })}
                    rows={3}
                    required
                    style={{ borderRadius: '12px', resize: 'none' }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 mt-2"
                  style={{ borderRadius: '12px', padding: '12px', fontWeight: 'bold' }}
                >
                  <i className="bi bi-send-fill"></i>
                  Enviar Notificación
                </button>

              </form>

              {/* Real-time Push Notification Phone Preview Mockup */}
              <div className="mt-4 border-top pt-4">
                <label className="form-label d-block text-center fw-bold text-muted small mb-3" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <i className="bi bi-phone me-1"></i> Vista Previa en Vivo (Lockscreen)
                </label>
                
                <div className="smartphone-mockup">
                  <div className="smartphone-screen">
                    <div className="smart-camera-notch"></div>
                    
                    {/* Status bar */}
                    <div className="phone-status-bar">
                      <span>{currentTime}</span>
                      <div className="d-flex gap-1 align-items-center">
                        <i className="bi bi-reception-4" style={{ fontSize: '0.7rem' }}></i>
                        <i className="bi bi-wifi" style={{ fontSize: '0.7rem' }}></i>
                        <i className="bi bi-battery-full" style={{ fontSize: '0.8rem' }}></i>
                      </div>
                    </div>

                    {/* Clock display */}
                    <div className="smart-time-clock">{currentTime}</div>
                    <div className="smart-date">Domingo, 31 de mayo</div>

                    {/* Sliding Dynamic Push notification banner */}
                    <div className="mock-push-banner">
                      <div className="push-app-bar">
                        <div className="d-flex align-items-center gap-1">
                          <i className="bi bi-mortarboard-fill text-primary" style={{ fontSize: '0.8rem' }}></i>
                          <span>FUTURO DIGITAL</span>
                        </div>
                        <span>ahora</span>
                      </div>
                      
                      {/* Live preview header + content text */}
                      <span className="d-block fw-bold text-white mb-1" style={{ fontSize: '0.82rem' }}>
                        {getTipoLabel(formData.tipo)} para {formData.destinatario_id ? getDestinatarioNombre(formData.destinatario_id).split(' ')[0] : 'Usuario'}
                      </span>
                      
                      <p className="push-message-content">
                        {formData.mensaje || 'Comienza a escribir en el cuadro de mensaje para simular la notificación push de este teléfono en tiempo real...'}
                      </p>
                    </div>

                    {/* Smartphone Swipe bar indicator at bottom */}
                    <div style={{
                      width: '90px',
                      height: '4px',
                      background: 'rgba(255, 255, 255, 0.4)',
                      borderRadius: '2px',
                      position: 'absolute',
                      bottom: '8px',
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}></div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Editing Modal (Fallback standard component only invoked when editing existing items) */}
      <Modal
        show={showModal}
        title={editingId ? 'Editar Notificación' : 'Nueva Notificación'}
        onClose={handleCloseModal}
        onSave={handleSaveModal}
      >
        <div className="mb-3">
          <label className="form-label">Destinatario *</label>
          <select
            className="form-select"
            value={formData.destinatario_id}
            onChange={(e) => setFormData({ ...formData, destinatario_id: e.target.value })}
          >
            <option value="">Seleccionar destinatario</option>
            <optgroup label="Usuarios">
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.tipo_usuario})</option>
              ))}
            </optgroup>
            <optgroup label="Alumnos">
              {alumnos.map(a => (
                <option key={a.id} value={a.id}>{a.primer_nombre} {a.apellido_paterno} ({a.numero_matricula})</option>
              ))}
            </optgroup>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Tipo *</label>
          <select
            className="form-control"
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
          >
            <option value="informacion">Información</option>
            <option value="alerta">Alerta</option>
            <option value="recordatorio">Recordatorio</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Mensaje *</label>
          <textarea
            className="form-control"
            value={formData.mensaje}
            onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
            placeholder="Ingresa el mensaje de la notificación"
            rows={4}
          />
        </div>
        <div className="mb-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="leida"
            checked={formData.leida}
            onChange={(e) => setFormData({ ...formData, leida: e.target.checked })}
          />
          <label className="form-check-label" htmlFor="leida">
            Marcar como leída
          </label>
        </div>
      </Modal>
    </div>
  );
};

export default Notificaciones;
