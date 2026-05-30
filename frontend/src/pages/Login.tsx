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

  const quickRoles = [
    {
      label: 'Director',
      email: 'luis.herrera@colegiofuturo.edu',
      password: 'password123',
      color: '#7c3aed',
      icon: 'bi-person-badge-fill',
    },
    {
      label: 'Administrador',
      email: 'andrea.montalvo@colegiofuturo.edu',
      password: 'password123',
      color: '#2563eb',
      icon: 'bi-shield-lock-fill',
    },
    {
      label: 'Docente',
      email: 'juan.paredes@colegiofuturo.edu',
      password: 'password123',
      color: '#0ea5e9',
      icon: 'bi-journal-bookmark-fill',
    },
    {
      label: 'Alumno',
      email: 'valeria.sanchez@colegiofuturo.edu',
      password: 'password123',
      color: '#10b981',
      icon: 'bi-person-fill',
    },
    {
      label: 'Padre',
      email: 'patricia.sanchez@colegiofuturo.edu',
      password: 'password123',
      color: '#f97316',
      icon: 'bi-people-fill',
    },
  ];

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

  const handleQuickAccess = async (roleEmail: string, rolePassword: string) => {
    setEmail(roleEmail);
    setPassword(rolePassword);
    setLoading(true);
    setError('');

    try {
      await login(roleEmail, rolePassword);
      navigate('/dashboard');
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.mensaje ||
        err.message ||
        'Error al iniciar sesión. Verifica tus credenciales.';
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
        background: 'radial-gradient(circle at top left, rgba(99, 102, 241, 0.24) 0%, transparent 26%), radial-gradient(circle at bottom right, rgba(168, 85, 247, 0.18) 0%, transparent 28%), linear-gradient(180deg, #0f172a 0%, #111827 100%)',
        position: 'relative',
        padding: '20px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '12%',
          right: '10%',
          width: '160px',
          height: '160px',
          background: 'rgba(99, 102, 241, 0.16)',
          borderRadius: '50%',
          filter: 'blur(72px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '8%',
          width: '220px',
          height: '220px',
          background: 'rgba(168, 85, 247, 0.14)',
          borderRadius: '50%',
          filter: 'blur(84px)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="card border-0"
        style={{
          width: '100%',
          maxWidth: '720px',
          borderRadius: '30px',
          overflow: 'hidden',
          background: 'rgba(15, 23, 42, 0.96)',
          boxShadow: '0 30px 70px rgba(15, 23, 42, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div className="row g-0">
          <div
            className="col-12 col-md-5"
            style={{
              background: 'linear-gradient(180deg, rgba(67, 56, 202, 0.94), rgba(124, 58, 237, 0.96))',
              color: '#f8fafc',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '100%',
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.95rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(255,255,255,0.16)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <i className="bi bi-mortarboard-fill" style={{ fontSize: '1.2rem', color: '#eef2ff' }}></i>
                </div>
                <span style={{ fontSize: '0.77rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(226, 232, 255, 0.78)' }}>
                  Futuro Digital
                </span>
              </div>
              <h2 style={{ fontSize: '1.95rem', fontWeight: 800, lineHeight: 1.05, marginBottom: '0.7rem' }}>
                Bienvenido de vuelta
              </h2>
              <p style={{ color: 'rgba(226, 232, 255, 0.88)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                Tu espacio académico con acceso inmediato y enfoque en tareas importantes.
              </p>
            </div>
          </div>

          <div className="col-12 col-md-7">
            <div className="card-body p-4" style={{ background: '#fff', minHeight: '100%', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '14px', right: '14px', width: '56px', height: '56px', background: 'rgba(124, 58, 237, 0.14)', borderRadius: '50%' }} />
              <div className="text-center mb-3">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#7c3aed', fontSize: '0.75rem' }}>
                  <i className="bi bi-lock-fill"></i>
                  Acceso seguro
                </span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.3rem' }}>Inicia sesión</h3>
                <p className="text-muted mb-0" style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>
                  Accede con tu correo institucional o uno de nuestros accesos rápidos.
                </p>
              </div>

              {error && (
                <div className="alert alert-danger d-flex align-items-center mb-4" role="alert" style={{ borderRadius: '18px', padding: '14px 18px' }}>
                  <i className="bi bi-exclamation-triangle-fill me-3" style={{ fontSize: '1.1rem' }}></i>
                  <div>
                    <strong className="d-block">No se pudo iniciar sesión</strong>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    Correo Electrónico
                  </label>
                  <div className="input-group shadow-sm" style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#fff' }}>
                    <span className="input-group-text" style={{ background: '#f8fafc', border: 'none', color: '#6366f1', width: '52px', justifyContent: 'center' }}>
                      <i className="bi bi-envelope-fill"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control border-0"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@colegio.com"
                      required
                      style={{ minHeight: '50px', padding: '0.95rem 1rem', fontSize: '0.95rem' }}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    Contraseña
                  </label>
                  <div className="input-group shadow-sm" style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#fff' }}>
                    <span className="input-group-text" style={{ background: '#f8fafc', border: 'none', color: '#a855f7', width: '52px', justifyContent: 'center' }}>
                      <i className="bi bi-lock-fill"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control border-0"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Contraseña segura"
                      required
                      style={{ minHeight: '50px', padding: '0.95rem 1rem', fontSize: '0.95rem' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn w-100 text-white"
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)',
                    borderRadius: '14px',
                    padding: '13px',
                    fontSize: '0.96rem',
                    fontWeight: 700,
                    boxShadow: '0 14px 26px rgba(99, 102, 241, 0.2)',
                    opacity: loading ? 0.75 : 1,
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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

              <div style={{ marginTop: '16px' }}>
                <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#7c3aed' }} />
                  <div style={{ fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#334155', fontSize: '0.78rem' }}>
                    Accesos rápidos
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.65rem' }}>
                  {quickRoles.map((role) => (
                    <button
                      key={role.label}
                      type="button"
                      className="btn text-start d-flex align-items-center"
                      onClick={() => handleQuickAccess(role.email, role.password)}
                      style={{
                        background: '#f8fafc',
                        borderRadius: '16px',
                        padding: '0.9rem 0.95rem',
                        minHeight: '92px',
                        border: '1px solid #e2e8f0',
                        color: '#1f2937',
                        boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)',
                      }}
                      disabled={loading}
                    >
                      <span style={{ width: '34px', height: '34px', borderRadius: '12px', background: role.color, display: 'grid', placeItems: 'center', color: '#fff', marginRight: '0.95rem' }}>
                        <i className={`bi ${role.icon}`} style={{ fontSize: '1rem' }}></i>
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.15rem' }}>{role.label}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{role.email.split('@')[0]}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
