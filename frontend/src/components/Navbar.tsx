import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/login');
  };

  // Cerrar dropdown cuando se clickea afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar navbar-custom" style={{ position: 'sticky', top: 0, zIndex: 1040 }}>
      <div className="container-fluid">
        <a className="navbar-brand" href="/">
          <i className="bi bi-mortarboard me-2"></i>
          <span className="d-none d-sm-inline">Colegio Futuro Digital</span>
          <span className="d-sm-none">CFD</span>
        </a>
        <div className="ms-auto d-flex align-items-center gap-2">
          <span className="text-white me-2 d-none d-md-inline" style={{ fontSize: '0.9rem' }}>
            <i className="bi bi-person me-1"></i>
            {user?.nombre}
          </span>
          <span className="text-white me-2 d-md-none" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-person me-1"></i>
          </span>
          <div className="dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              className="btn btn-outline-light dropdown-toggle"
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                padding: '0.6rem 1.2rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
                fontSize: '1.1rem',
                minWidth: '60px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              title="Menú de usuario"
            >
              <i className="bi bi-chevron-down"></i>
            </button>
            {isDropdownOpen && (
              <ul 
                className="dropdown-menu dropdown-menu-end show" 
                style={{ 
                  display: 'block',
                  minWidth: '200px',
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  border: '1px solid #dee2e6',
                  borderRadius: '0.25rem',
                  boxShadow: '0 0.5rem 1rem rgba(0,0,0,0.15)',
                }}
              >
                <li>
                  <h6 className="dropdown-header">
                    <i className="bi bi-person-circle me-2"></i>
                    {user?.nombre}
                  </h6>
                </li>
                <li>
                  <hr className="dropdown-divider m-2" />
                </li>
                <li>
                  <a 
                    className="dropdown-item" 
                    href="/perfil" 
                    style={{ 
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      display: 'block',
                      color: '#212529',
                      textDecoration: 'none',
                    }}
                    onClick={(e) => {
                      setIsDropdownOpen(false);
                    }}
                  >
                    <i className="bi bi-person-circle me-2"></i>
                    Mi Perfil
                  </a>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={handleLogout}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.5rem 1rem',
                      color: '#212529',
                      fontSize: '0.95rem',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.backgroundColor = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Cerrar Sesión
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
