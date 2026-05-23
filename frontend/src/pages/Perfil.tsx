import React from 'react';
import { useAuth } from '../context/AuthContext';

const Perfil: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container p-4">
        <div className="alert alert-info">No hay usuario autenticado.</div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-hero mb-4">
        <h1 className="page-hero-title">Mi Perfil</h1>
        <p className="page-hero-subtitle">Información de acceso y datos básicos de tu cuenta</p>
      </div>

      <div className="profile-panel">
        <div className="profile-content">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div>
              <span className="profile-badge mb-2">
                <i className="bi bi-person-badge"></i>
                Usuario activo
              </span>
              <h2 className="h4 mb-1">{user.nombre}</h2>
              <div className="text-muted">{user.email}</div>
            </div>
            <div className="text-start text-md-end">
              <div className="text-muted small text-uppercase fw-semibold">Rol</div>
              <div className="fs-5 fw-bold text-primary text-capitalize">{user.tipo_usuario}</div>
            </div>
          </div>

          <div className="profile-detail">
            <i className="bi bi-person-circle fs-4 text-primary"></i>
            <div>
              <div className="small text-muted fw-semibold text-uppercase">Nombre</div>
              <div className="fw-semibold">{user.nombre}</div>
            </div>
          </div>

          <div className="profile-detail">
            <i className="bi bi-envelope-at fs-4 text-primary"></i>
            <div>
              <div className="small text-muted fw-semibold text-uppercase">Correo electrónico</div>
              <div className="fw-semibold">{user.email}</div>
            </div>
          </div>

          <div className="profile-detail">
            <i className="bi bi-shield-check fs-4 text-primary"></i>
            <div>
              <div className="small text-muted fw-semibold text-uppercase">Tipo de usuario</div>
              <div className="fw-semibold text-capitalize">{user.tipo_usuario}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
