import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar navbar-custom" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
      <div className="container-fluid">
        <a className="navbar-brand" href="/">
          <i className="bi bi-mortarboard me-2"></i>
          Colegio Futuro Digital
        </a>
        <div className="ms-auto d-flex align-items-center">
          <span className="text-white me-3">
            <i className="bi bi-person me-2"></i>
            {user?.nombre}
          </span>
          <div className="dropdown">
            <button
              className="btn btn-sm btn-outline-light dropdown-toggle"
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <i className="bi bi-chevron-down"></i>
            </button>
            {showDropdown && (
              <div className="dropdown-menu dropdown-menu-end show" style={{ display: 'block' }}>
                <a className="dropdown-item" href="/perfil">
                  <i className="bi bi-person me-2"></i>Mi Perfil
                </a>
                <hr className="dropdown-divider" />
                <button
                  className="dropdown-item"
                  onClick={handleLogout}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
