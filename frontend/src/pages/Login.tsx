import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('luis.herrera@colegiofuturo.edu');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('[Login] Iniciando intento de login');
    console.log('[Login] Email:', email);

    try {
      console.log('[Login] Llamando a login()...');
      await login(email, password);
      console.log('[Login] ✓ Login exitoso, navegando a /dashboard');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[Login] ✗ Error capturado:', err);
      const errorMsg = 
        err.response?.data?.mensaje ||
        err.message ||
        'Error al iniciar sesión. Verifica tus credenciales.';
      
      console.error('[Login] Mensaje de error:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ 
        minHeight: '100vh', 
        background: 'radial-gradient(circle at 50% 50%, #4c3385 0%, #2e1a4d 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '20px',
      }}
    >
      {/* Premium Ambient Background Blobs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '15%',
        width: '320px',
        height: '320px',
        background: 'rgba(102, 126, 234, 0.25)',
        borderRadius: '50%',
        filter: 'blur(90px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '15%',
        width: '380px',
        height: '380px',
        background: 'rgba(118, 75, 162, 0.22)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none',
      }} />

      <div 
        className="card shadow-lg" 
        style={{ 
          width: '100%', 
          maxWidth: '430px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 2,
        }}
      >
        <div className="card-body p-4 p-md-5">
          {/* Header */}
          <div className="text-center mb-4">
            <div 
              style={{
                width: '72px',
                height: '72px',
                margin: '0 auto 16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
              }}
            >
              <i
                className="bi bi-mortarboard-fill"
                style={{ fontSize: '2.2rem', color: '#fff' }}
              ></i>
            </div>
            <h1 className="card-title mb-1" style={{ fontSize: '1.65rem', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.5px' }}>
              Colegio Futuro Digital
            </h1>
            <p className="text-muted mb-0" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
              Sistema Integral de Gestión Educativa
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div 
              className="alert alert-danger d-flex align-items-center mb-4" 
              role="alert"
              style={{
                borderLeft: '4px solid #dc3545',
                borderRadius: '12px',
                backgroundColor: 'rgba(220, 53, 69, 0.08)',
                color: '#dc3545',
                padding: '12px 16px',
              }}
            >
              <i className="bi bi-exclamation-circle-fill me-2" style={{ fontSize: '1.1rem' }}></i>
              <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label" style={{ fontWeight: '600', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                Correo Electrónico
              </label>
              <div className="input-group">
                <span className="input-group-text" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRight: 'none', borderRadius: '12px 0 0 12px', color: '#64748b' }}>
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control form-control-lg"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@colegio.com"
                  required
                  style={{
                    borderRadius: '0 12px 12px 0',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.95rem',
                    padding: '10px 14px',
                  }}
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label" style={{ fontWeight: '600', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                Contraseña
              </label>
              <div className="input-group">
                <span className="input-group-text" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRight: 'none', borderRadius: '12px 0 0 12px', color: '#64748b' }}>
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type="password"
                  className="form-control form-control-lg"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                  style={{
                    borderRadius: '0 12px 12px 0',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.95rem',
                    padding: '10px 14px',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-lg w-100 text-white mb-3"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.25s ease',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.25)'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Verificando...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Separator */}
          <div style={{ position: 'relative', margin: '1.8rem 0' }}>
            <hr style={{ margin: 0, borderTop: '1px solid #e2e8f0' }} />
            <span 
              style={{
                position: 'absolute',
                top: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(255,255,255,0.92)',
                padding: '0 12px',
                fontSize: '0.75rem',
                color: '#64748b',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Credenciales de Prueba
            </span>
          </div>

          {/* Test Credentials */}
          <div 
            style={{
              background: 'rgba(102, 126, 234, 0.04)',
              border: '1px solid rgba(102, 126, 234, 0.12)',
              borderRadius: '16px',
              padding: '14px 18px',
              fontSize: '0.85rem'
            }}
          >
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-person-badge text-primary" style={{ fontSize: '1rem' }}></i>
                <strong className="text-dark">Acceso Director:</strong>
              </div>
              <div className="d-flex flex-column gap-1" style={{ paddingLeft: '22px' }}>
                <span className="text-muted">Correo: <code style={{ color: '#667eea', background: 'rgba(102, 126, 234, 0.06)', padding: '2px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>luis.herrera@colegiofuturo.edu</code></span>
                <span className="text-muted">Clave: <code style={{ color: '#764ba2', background: 'rgba(118, 75, 162, 0.06)', padding: '2px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>password123</code></span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
            <p className="mb-1">Universidad Tecnológica del Perú (UTP)</p>
            <p className="mb-0 text-muted">Arquitectura Orientada a Servicios</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
