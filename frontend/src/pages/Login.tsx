import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { role: 'Director',       email: 'luis.herrera@colegiofuturo.edu',    icon: 'bi-shield-fill',       color: '#7c3aed', bg: 'rgba(124,58,237,0.12)',  border: 'rgba(124,58,237,0.3)'  },
  { role: 'Administrativo', email: 'andrea.montalvo@colegiofuturo.edu', icon: 'bi-briefcase-fill',    color: '#0891b2', bg: 'rgba(8,145,178,0.12)',   border: 'rgba(8,145,178,0.3)'   },
  { role: 'Docente',        email: 'juan.paredes@colegiofuturo.edu',    icon: 'bi-person-badge-fill', color: '#059669', bg: 'rgba(5,150,105,0.12)',   border: 'rgba(5,150,105,0.3)'   },
  { role: 'Alumno',         email: 'valeria.sanchez@colegiofuturo.edu', icon: 'bi-mortarboard-fill',  color: '#0f62fe', bg: 'rgba(15,98,254,0.12)',   border: 'rgba(15,98,254,0.3)'   },
  { role: 'Apoderado',      email: 'patricia.sanchez@colegiofuturo.edu',icon: 'bi-house-heart-fill',  color: '#d97706', bg: 'rgba(217,119,6,0.12)',   border: 'rgba(217,119,6,0.3)'   },
];

const FEATURES = [
  { icon: 'bi-people',         label: 'Alumnos' },
  { icon: 'bi-book',           label: 'Cursos' },
  { icon: 'bi-clipboard-check',label: 'Matrículas' },
  { icon: 'bi-graph-up',       label: 'Calificaciones' },
  { icon: 'bi-calendar-check', label: 'Asistencia' },
  { icon: 'bi-credit-card',    label: 'Pagos' },
];

const Login: React.FC = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [shake, setShake]       = useState(false);
  const navigate                = useNavigate();
  const { login }               = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.mensaje || err.message || 'Credenciales incorrectas. Intenta de nuevo.';
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="login-screen container-fluid p-0">
      <div className="row g-0" style={{ minHeight: '100vh' }}>

        {/* ── LEFT PANEL ────────────────────────────────────────── */}
        <div
          className="col-lg-6 d-none d-lg-flex flex-column"
          style={{
            background: 'linear-gradient(145deg,#071528 0%,#0c2340 45%,#0f3460 100%)',
            position: 'relative',
            overflow: 'hidden',
            padding: '3rem 3.5rem',
          }}
        >
          {/* Decorative orbs */}
          <div style={{ position:'absolute', width:380, height:380, borderRadius:'50%', background:'rgba(59,130,246,0.1)', filter:'blur(70px)', top:-120, right:-80, pointerEvents:'none', animation:'floatSlow 14s ease-in-out infinite' }} />
          <div style={{ position:'absolute', width:260, height:260, borderRadius:'50%', background:'rgba(139,92,246,0.1)', filter:'blur(60px)', bottom:-60, left:-60, pointerEvents:'none', animation:'floatSlow 18s ease-in-out infinite reverse' }} />
          <div style={{ position:'absolute', width:140, height:140, borderRadius:'50%', background:'rgba(16,185,129,0.08)', filter:'blur(40px)', top:'45%', left:'60%', pointerEvents:'none' }} />

          {/* Grid lines decoration */}
          <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize:'48px 48px', pointerEvents:'none' }} />

          {/* Brand */}
          <div className="d-flex align-items-center gap-3 mb-auto fade-in-up" style={{ position:'relative', zIndex:1 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.18)', display:'grid', placeItems:'center', fontSize:'1.2rem' }}>
              <i className="bi bi-mortarboard text-white"></i>
            </div>
            <div>
              <div style={{ color:'#fff', fontWeight:800, fontSize:'0.95rem', lineHeight:1.2 }}>Colegio Futuro Digital</div>
              <div style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.72rem' }}>Sistema de Gestión Académica</div>
            </div>
          </div>

          {/* Main copy */}
          <div style={{ position:'relative', zIndex:1, margin:'auto 0' }}>
            <div
              className="fade-in-up"
              style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'rgba(96,165,250,0.15)', border:'1px solid rgba(96,165,250,0.35)', borderRadius:999, padding:'0.4rem 1rem', fontSize:'0.75rem', fontWeight:700, color:'#93c5fd', marginBottom:'1.4rem' }}
            >
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#60a5fa', display:'inline-block', animation:'pulse-dot 2s ease-in-out infinite' }} />
              Plataforma activa · Lima, Perú
            </div>

            <h1
              className="fade-in-up"
              style={{ color:'#fff', fontWeight:800, fontSize:'clamp(2rem,3vw,2.8rem)', lineHeight:1.1, letterSpacing:'-0.03em', marginBottom:'1.2rem' }}
            >
              Gestión educativa<br />
              <span style={{ background:'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                moderna y segura.
              </span>
            </h1>

            <p className="fade-in-up delay-1" style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.95rem', lineHeight:1.75, maxWidth:420, marginBottom:'2rem' }}>
              Administra cursos, alumnos, matrículas, calificaciones, asistencia y pagos desde un solo panel centralizado.
            </p>

            {/* Feature chips */}
            <div className="d-flex flex-wrap gap-2 mb-2rem fade-in-up delay-1" style={{ marginBottom:'2rem' }}>
              {FEATURES.map(f => (
                <span key={f.label} style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', padding:'0.38rem 0.85rem', borderRadius:10, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.13)', color:'rgba(255,255,255,0.78)', fontSize:'0.78rem', fontWeight:600 }}>
                  <i className={`bi ${f.icon}`}></i>{f.label}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="d-flex gap-3 flex-wrap fade-in-up delay-2">
              {[
                { val:'+1 250', lbl:'Estudiantes' },
                { val:'65',     lbl:'Docentes' },
                { val:'28',     lbl:'Secciones' },
              ].map(s => (
                <div key={s.lbl} style={{ padding:'0.75rem 1.1rem', borderRadius:14, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', textAlign:'center', minWidth:90 }}>
                  <div style={{ color:'#fff', fontWeight:800, fontSize:'1.2rem', lineHeight:1 }}>{s.val}</div>
                  <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.7rem', marginTop:3, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom images */}
          <div className="fade-in-up delay-2" style={{ position:'relative', zIndex:1, marginTop:'2.5rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:'0.85rem' }}>
              <img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80" alt="Aula" style={{ width:'100%', height:130, objectFit:'cover', borderRadius:16 }} />
              <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80" alt="Trabajo colaborativo" style={{ width:'100%', height:130, objectFit:'cover', borderRadius:16 }} />
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ───────────────────────────────────────── */}
        <div
          className="col-12 col-lg-6 d-flex align-items-center justify-content-center"
          style={{ background:'#f8fafc', minHeight:'100vh', padding:'2rem 1rem' }}
        >
          <div style={{ width:'100%', maxWidth:460 }} className="fade-in-up">

            {/* Mobile brand */}
            <div className="d-flex d-lg-none align-items-center gap-2 mb-5 justify-content-center">
              <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#0f62fe,#3b82f6)', display:'grid', placeItems:'center', fontSize:'1.1rem' }}>
                <i className="bi bi-mortarboard text-white"></i>
              </div>
              <div>
                <div style={{ fontWeight:800, color:'#0f172a', fontSize:'0.95rem' }}>Colegio Futuro Digital</div>
                <div style={{ color:'#64748b', fontSize:'0.72rem' }}>Sistema de Gestión Académica</div>
              </div>
            </div>

            {/* Card */}
            <div
              style={{
                background:'#fff',
                borderRadius:24,
                boxShadow:'0 8px 40px rgba(15,23,42,0.1)',
                border:'1px solid rgba(148,163,184,0.15)',
                padding:'clamp(1.75rem,5vw,2.5rem)',
              }}
            >
              {/* Header */}
              <div className="text-center mb-5">
                <div
                  style={{
                    width:64, height:64, borderRadius:18, margin:'0 auto 1.2rem',
                    background:'linear-gradient(135deg,#0f62fe 0%,#3b82f6 100%)',
                    display:'grid', placeItems:'center',
                    boxShadow:'0 12px 28px rgba(15,98,254,0.3)',
                    fontSize:'1.6rem', color:'#fff',
                  }}
                >
                  <i className="bi bi-shield-lock-fill"></i>
                </div>
                <h2 style={{ fontWeight:800, color:'#0f172a', fontSize:'1.5rem', letterSpacing:'-0.02em', marginBottom:'0.4rem' }}>
                  Acceso institucional
                </h2>
                <p style={{ color:'#64748b', fontSize:'0.88rem', marginBottom:0 }}>
                  Ingresa con tu cuenta para continuar al panel de gestión.
                </p>
              </div>

              {/* Error alert */}
              {error && (
                <div
                  style={{
                    background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12,
                    padding:'0.8rem 1rem', marginBottom:'1.25rem',
                    display:'flex', alignItems:'center', gap:'0.6rem',
                    animation: shake ? 'shake 0.5s ease' : 'none',
                  }}
                >
                  <i className="bi bi-x-circle-fill" style={{ color:'#ef4444', flexShrink:0 }}></i>
                  <span style={{ color:'#991b1b', fontSize:'0.88rem', fontWeight:500 }}>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" style={{ display:'block', fontWeight:700, color:'#374151', fontSize:'0.85rem', marginBottom:'0.45rem' }}>
                    Correo institucional
                  </label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:'1rem', pointerEvents:'none' }}>
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="nombre@colegiofuturo.edu"
                      required
                      style={{
                        width:'100%', padding:'0.85rem 1rem 0.85rem 2.6rem',
                        borderRadius:12, border:'1.5px solid #e2e8f0',
                        fontSize:'0.92rem', color:'#0f172a',
                        background:'#f8fafc', outline:'none',
                        transition:'border-color 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor='#0f62fe'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(15,98,254,0.1)'; e.currentTarget.style.background='#fff'; }}
                      onBlur={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.background='#f8fafc'; }}
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label htmlFor="password" style={{ display:'block', fontWeight:700, color:'#374151', fontSize:'0.85rem', marginBottom:'0.45rem' }}>
                    Contraseña
                  </label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:'1rem', pointerEvents:'none' }}>
                      <i className="bi bi-key"></i>
                    </span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Tu contraseña"
                      required
                      style={{
                        width:'100%', padding:'0.85rem 3rem 0.85rem 2.6rem',
                        borderRadius:12, border:'1.5px solid #e2e8f0',
                        fontSize:'0.92rem', color:'#0f172a',
                        background:'#f8fafc', outline:'none',
                        transition:'border-color 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor='#0f62fe'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(15,98,254,0.1)'; e.currentTarget.style.background='#fff'; }}
                      onBlur={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.background='#f8fafc'; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(s => !s)}
                      style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94a3b8', cursor:'pointer', padding:'4px', fontSize:'1rem', lineHeight:1 }}
                      tabIndex={-1}
                    >
                      <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width:'100%', padding:'0.95rem',
                    borderRadius:14, border:'none',
                    background: loading ? '#94a3b8' : 'linear-gradient(135deg,#0f47a1 0%,#1565c0 50%,#0f62fe 100%)',
                    color:'#fff', fontWeight:700, fontSize:'1rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 8px 24px rgba(15,98,254,0.35)',
                    transition:'transform 0.18s ease, box-shadow 0.18s ease, background 0.2s ease',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
                  }}
                  onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform='translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 12px 30px rgba(15,98,254,0.45)'; } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow='0 8px 24px rgba(15,98,254,0.35)'; }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" style={{ width:'1rem', height:'1rem', borderWidth:'0.15em' }} aria-hidden="true" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right"></i>
                      Ingresar al sistema
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', margin:'1.75rem 0' }}>
                <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
                <span style={{ color:'#94a3b8', fontSize:'0.75rem', fontWeight:600, whiteSpace:'nowrap' }}>cuentas de demostración</span>
                <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
              </div>

              {/* Demo accounts */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:'0.5rem' }}>
                {DEMO_ACCOUNTS.map(acc => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => fillDemo(acc)}
                    style={{
                      background: acc.bg, border:`1px solid ${acc.border}`,
                      borderRadius:10, padding:'0.6rem 0.5rem',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:'0.35rem',
                      cursor:'pointer', transition:'transform 0.18s ease, box-shadow 0.18s ease',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow=`0 6px 16px ${acc.border}`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow='none'; }}
                    title={`Iniciar como ${acc.role}: ${acc.email}`}
                  >
                    <i className={`bi ${acc.icon}`} style={{ color:acc.color, fontSize:'1.1rem' }}></i>
                    <span style={{ color:acc.color, fontSize:'0.72rem', fontWeight:700 }}>{acc.role}</span>
                  </button>
                ))}
              </div>
              <p style={{ color:'#94a3b8', fontSize:'0.72rem', textAlign:'center', marginTop:'0.6rem', marginBottom:0 }}>
                Haz clic en un rol para autocompletar · contraseña: <code style={{ color:'#64748b' }}>password123</code>
              </p>

              {/* Footer */}
              <div style={{ marginTop:'1.75rem', paddingTop:'1.25rem', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.5rem' }}>
                <span style={{ color:'#94a3b8', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:'0.35rem' }}>
                  <i className="bi bi-geo-alt text-info"></i> Jesús María, Lima, Perú
                </span>
                <Link to="/" style={{ color:'#0f62fe', fontSize:'0.78rem', fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', gap:'0.3rem' }}>
                  <i className="bi bi-arrow-left"></i> Página principal
                </Link>
              </div>
            </div>

            {/* Security badge */}
            <div style={{ textAlign:'center', marginTop:'1.25rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem', color:'#94a3b8', fontSize:'0.74rem' }}>
              <i className="bi bi-shield-check text-success"></i>
              Conexión segura · JWT · Sesión cifrada
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
