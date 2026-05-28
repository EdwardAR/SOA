import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="login-screen container-fluid">
      <div className="row g-0 min-vh-100">
        <div className="col-lg-7 d-none d-lg-block login-hero-panel">
          <div className="login-hero-overlay"></div>
          <div className="login-hero-content fade-in-up">
            <div className="brand-chip mb-4">
              <i className="bi bi-mortarboard-fill me-2"></i>
              Colegio Futuro Digital
            </div>
            <h1>Gestión educativa moderna para Lima norte</h1>
            <p>
              Una experiencia institucional clara, rápida y profesional para administrar cursos,
              alumnos, matrículas, asistencia y pagos desde un solo lugar.
            </p>
            <div className="d-flex flex-wrap gap-3 mt-4">
              <div className="hero-stat">
                <strong>+1 200</strong>
                <span>estudiantes</span>
              </div>
              <div className="hero-stat">
                <strong>25</strong>
                <span>secciones activas</span>
              </div>
              <div className="hero-stat">
                <strong>99%</strong>
                <span>seguimiento digital</span>
              </div>
            </div>
            <div className="login-hero-image-grid mt-5">
              <img
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80"
                alt="Aula moderna"
              />
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80"
                alt="Trabajo colaborativo"
              />
            </div>
          </div>
        </div>

        <div className="col-lg-5 d-flex align-items-center justify-content-center login-form-panel">
          <div className="login-card fade-in-up">
            <div className="text-center mb-4">
              <div className="login-logo mb-3">
                <i className="bi bi-shield-lock-fill"></i>
              </div>
              <h2 className="mb-2">Acceso institucional</h2>
              <p className="text-muted mb-0">
                Ingresa con tu cuenta para continuar al panel de gestión.
              </p>
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-exclamation-circle-fill me-2"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label fw-semibold">
                  Correo institucional
                </label>
                <div className="input-group input-group-lg login-input-group">
                  <span className="input-group-text">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@colegio.edu.pe"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="form-label fw-semibold">
                  Contraseña
                </label>
                <div className="input-group input-group-lg login-input-group">
                  <span className="input-group-text">
                    <i className="bi bi-key"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg w-100 login-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Ingresar al sistema
                  </>
                )}
              </button>
            </form>

            <div className="login-footer mt-4">
              <p className="mb-1">Sistema escolar diseñado para un flujo institucional claro y seguro.</p>
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <span className="text-muted small">Jesús María, Lima, Perú</span>
                <Link to="/" className="text-decoration-none small fw-semibold">
                  Ver presentación pública
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
