import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleLabels: Record<string, { label: string; color: string }> = {
  director:      { label: 'Director',      color: '#7c3aed' },
  administrativo:{ label: 'Administrativo', color: '#0891b2' },
  docente:       { label: 'Docente',        color: '#059669' },
  padre:         { label: 'Apoderado',      color: '#d97706' },
  alumno:        { label: 'Alumno',         color: '#0f62fe' },
};

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleInfo = user?.tipo_usuario ? roleLabels[user.tipo_usuario] : null;
  const initials = user?.nombre
    ? user.nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : '?';

  return (
    <nav className="navbar navbar-custom" style={{ position: 'sticky', top: 0, zIndex: 1040 }}>
      <div className="container-fluid px-3 px-md-4">
        <Link className="navbar-brand text-decoration-none d-flex align-items-center gap-2" to="/dashboard">
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.18)',
              display: 'grid',
              placeItems: 'center',
              fontSize: '1.1rem',
            }}
          >
            <i className="bi bi-mortarboard"></i>
          </div>
          <span className="d-none d-sm-inline fw-bold" style={{ fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
            Colegio Futuro Digital
          </span>
          <span className="d-sm-none fw-bold">CFD</span>
        </Link>

        <div className="ms-auto d-flex align-items-center gap-2">
          {/* Nombre + rol (desktop) */}
          <div className="d-none d-md-flex flex-column align-items-end me-1" style={{ lineHeight: 1.3 }}>
            <span className="text-white fw-semibold" style={{ fontSize: '0.88rem' }}>
              {user?.nombre}
            </span>
            {roleInfo && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: roleInfo.color,
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 6,
                  padding: '1px 7px',
                  marginTop: 1,
                }}
              >
                {roleInfo.label}
              </span>
            )}
          </div>

          {/* Avatar + dropdown */}
          <div className="dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              className="btn p-0 border-0"
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              title="Menú de usuario"
              style={{ background: 'none' }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.16))',
                  border: '2px solid rgba(255,255,255,0.35)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
              >
                {initials}
              </div>
            </button>

            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: 220,
                  background: '#fff',
                  borderRadius: 16,
                  boxShadow: '0 16px 40px rgba(15,23,42,0.18)',
                  border: '1px solid rgba(148,163,184,0.18)',
                  overflow: 'hidden',
                  zIndex: 2000,
                }}
              >
                {/* User info header */}
                <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <div className="fw-semibold" style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                    {user?.nombre}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                    {user?.email}
                  </div>
                  {roleInfo && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: 6,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: roleInfo.color,
                        background: `${roleInfo.color}18`,
                        borderRadius: 6,
                        padding: '2px 8px',
                      }}
                    >
                      {roleInfo.label}
                    </span>
                  )}
                </div>

                {/* Menu items */}
                <div style={{ padding: '6px 0' }}>
                  <a
                    href="/perfil"
                    className="dropdown-item d-flex align-items-center gap-2"
                    style={{ padding: '10px 16px', fontSize: '0.9rem', color: '#374151' }}
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <i className="bi bi-person-circle text-primary"></i>
                    Mi Perfil
                  </a>
                  <hr style={{ margin: '4px 12px', borderColor: '#e2e8f0' }} />
                  <button
                    className="dropdown-item d-flex align-items-center gap-2 w-100"
                    onClick={handleLogout}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '10px 16px',
                      fontSize: '0.9rem',
                      color: '#dc2626',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <i className="bi bi-box-arrow-right"></i>
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
