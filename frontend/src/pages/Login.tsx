import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('director@colegio.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.mensaje ||
        'Error al iniciar sesión. Verifica tus credenciales.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
      }}
    >
      <div 
        className="card shadow-lg" 
        style={{ 
          width: '100%', 
          maxWidth: '420px',
          border: 'none',
          borderRadius: '12px'
        }}
      >
        <div className="card-body p-5">
          {/* Header */}
          <div className="text-center mb-5">
            <div 
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i
                className="bi bi-mortarboard"
                style={{ fontSize: '2.5rem', color: '#fff' }}
              ></i>
            </div>
            <h1 className="card-title mb-2" style={{ fontSize: '1.8rem', fontWeight: '600', color: '#333' }}>
              Colegio Futuro Digital
            </h1>
            <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
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
                borderRadius: '6px',
                backgroundColor: '#f8d7da'
              }}
            >
              <i className="bi bi-exclamation-circle-fill me-2"></i>
              <span style={{ fontSize: '0.95rem' }}>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="form-label" style={{ fontWeight: '500', marginBottom: '8px' }}>
                📧 Correo Electrónico
              </label>
              <input
                type="email"
                className="form-control form-control-lg"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@colegio.com"
                required
                style={{
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  padding: '12px 16px',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ddd';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label" style={{ fontWeight: '500', marginBottom: '8px' }}>
                🔐 Contraseña
              </label>
              <input
                type="password"
                className="form-control form-control-lg"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
                style={{
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  padding: '12px 16px',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ddd';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-lg w-100 text-white fw-600 mb-3"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
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
                  Iniciando sesión...
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
          <div style={{ position: 'relative', margin: '2rem 0' }}>
            <hr style={{ margin: 0, borderTop: '1px solid #e0e0e0' }} />
            <span 
              style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#fff',
                padding: '0 12px',
                fontSize: '0.85rem',
                color: '#999'
              }}
            >
              Credenciales de Prueba
            </span>
          </div>

          {/* Test Credentials */}
          <div 
            style={{
              background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '0.9rem'
            }}
          >
            <div className="mb-2">
              <strong style={{ color: '#667eea' }}>👤 Director:</strong>
              <div style={{ color: '#555', marginTop: '4px', paddingLeft: '16px' }}>
                📧 <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>director@colegio.com</code>
              </div>
              <div style={{ color: '#555', paddingLeft: '16px' }}>
                🔑 <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>password123</code>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#999' }}>
            <p style={{ margin: 0 }}>Universidad Tecnológica del Perú (UTP)</p>
            <p style={{ margin: '4px 0 0 0' }}>Curso: Arquitectura Orientada a Servicios</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
