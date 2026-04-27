import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/alumnos', label: 'Alumnos', icon: 'bi-people' },
    { path: '/profesores', label: 'Profesores', icon: 'bi-person-check' },
    { path: '/cursos', label: 'Cursos', icon: 'bi-book' },
    { path: '/matriculas', label: 'Matrículas', icon: 'bi-clipboard-check' },
    { path: '/pagos', label: 'Pagos', icon: 'bi-credit-card' },
    { path: '/asistencia', label: 'Asistencia', icon: 'bi-calendar-check' },
    { path: '/calificaciones', label: 'Calificaciones', icon: 'bi-file-earmark-text' },
    { path: '/notificaciones', label: 'Notificaciones', icon: 'bi-bell' },
  ];

  const toggleSidebar = () => setIsExpanded(!isExpanded);

  return (
    <>
      {/* Toggle Button (Mobile) */}
      <button
        className="btn btn-primary d-lg-none position-fixed"
        style={{
          bottom: '20px',
          right: '20px',
          zIndex: 1030,
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={toggleSidebar}
      >
        <i className="bi bi-list" style={{ fontSize: '1.5rem' }}></i>
      </button>

      {/* Backdrop (Mobile) */}
      {isExpanded && (
        <div
          className="d-lg-none"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1020,
          }}
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className="sidebar d-flex flex-column h-100"
        style={{
          width: '250px',
          position: 'fixed',
          top: '70px',
          left: 0,
          height: 'calc(100vh - 70px)',
          overflowY: 'auto',
          paddingTop: '10px',
          transform: isExpanded ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
          zIndex: 1025,
          '@media (max-width: 991px)': {
            boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
          },
        }}
        className={`sidebar d-flex flex-column h-100 ${isExpanded ? 'd-block' : 'd-none d-lg-flex'}`}
      >
        <div className="p-3 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <p className="text-white-50 mb-0" style={{ fontSize: '0.85rem' }}>
            Tipo: <strong>{user?.tipo_usuario}</strong>
          </p>
        </div>
        <div className="flex-grow-1 overflow-auto">
          <nav className="nav flex-column p-3">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setIsExpanded(false)}
              >
                <i className={`bi ${item.icon} me-2`}></i>
                <span className="d-inline-block">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop Layout Adjustment */}
      <style>{`
        @media (min-width: 992px) {
          .sidebar {
            transform: translateX(0) !important;
            display: flex !important;
            position: fixed !important;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
