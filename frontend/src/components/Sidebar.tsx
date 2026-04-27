import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

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

  return (
    <div className="sidebar d-flex flex-column h-100" style={{ width: '250px', position: 'fixed', top: '70px', left: 0, height: 'calc(100vh - 70px)', overflowY: 'auto', paddingTop: '10px' }}>
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
            >
              <i className={`bi ${item.icon} me-2`}></i>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
