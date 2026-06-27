import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ── Animated counter hook ─────────────────────────────────────── */
function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

/* ── Scroll-reveal hook ────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ── Reveal wrapper ────────────────────────────────────────────── */
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = '' }) => {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

/* ── Stats section ─────────────────────────────────────────────── */
const StatItem: React.FC<{ value: number; suffix?: string; label: string; started: boolean; delay: number }> = ({ value, suffix = '', label, started, delay }) => {
  const count = useCountUp(value, 1600, started);
  return (
    <div
      style={{
        padding: '1.1rem 1.4rem',
        borderRadius: 18,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        textAlign: 'center',
        minWidth: 110,
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        opacity: started ? 1 : 0,
        transform: started ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      <div style={{ fontSize: '1.9rem', fontWeight: 800, lineHeight: 1, color: '#fff' }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
    </div>
  );
};

/* ── Data ──────────────────────────────────────────────────────── */
const highlights = [
  { icon: 'bi-geo-alt-fill', title: 'Ubicación estratégica', text: 'Jesús María, Lima, con acceso ágil a transporte, servicios y zonas residenciales de alto flujo académico.', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { icon: 'bi-pc-display-horizontal', title: 'Aulas digitales', text: 'Laboratorios, conectividad y herramientas integradas para gestión académica en tiempo real desde cualquier dispositivo.', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { icon: 'bi-people-fill', title: 'Comunidad activa', text: 'Familias, docentes y estudiantes coordinados en una cultura de mejora continua y comunicación abierta.', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
];

const modules = [
  { icon: 'bi-people', label: 'Alumnos', color: '#3b82f6' },
  { icon: 'bi-person-badge', label: 'Profesores', color: '#8b5cf6' },
  { icon: 'bi-book', label: 'Cursos', color: '#10b981' },
  { icon: 'bi-clipboard-check', label: 'Matrículas', color: '#f59e0b' },
  { icon: 'bi-credit-card', label: 'Pagos', color: '#ef4444' },
  { icon: 'bi-calendar-check', label: 'Asistencia', color: '#06b6d4' },
  { icon: 'bi-graph-up', label: 'Calificaciones', color: '#84cc16' },
  { icon: 'bi-bell', label: 'Notificaciones', color: '#f97316' },
];

const values = [
  { icon: 'bi-lightbulb', title: 'Innovación', text: 'Adoptamos tecnología educativa de vanguardia para potenciar el aprendizaje.', color: '#f59e0b' },
  { icon: 'bi-heart', title: 'Vocación', text: 'Cada docente trabaja con pasión y compromiso hacia el desarrollo integral del estudiante.', color: '#ef4444' },
  { icon: 'bi-shield-check', title: 'Integridad', text: 'Transparencia y ética son la base de cada decisión académica y administrativa.', color: '#10b981' },
  { icon: 'bi-trophy', title: 'Excelencia', text: 'Buscamos los más altos estándares académicos y de gestión institucional.', color: '#3b82f6' },
];

const testimonials = [
  { name: 'Ing. María Condori', role: 'Directora académica', text: '"La plataforma centraliza todo lo que necesito para supervisar el avance de cada sección. Es clara, rápida y confiable."', avatar: 'MC' },
  { name: 'Prof. Carlos Quispe', role: 'Docente de Matemáticas', text: '"Registrar asistencia y calificaciones desde cualquier dispositivo ha transformado mi rutina de trabajo diaria."', avatar: 'CQ' },
  { name: 'Lucía Vargas', role: 'Apoderada de 2do grado', text: '"Puedo ver las notas y los pagos de mi hija en tiempo real. Me da mucha tranquilidad saber todo al instante."', avatar: 'LV' },
];

const timelineItems = [
  { year: '1998', label: 'Fundación', desc: 'Apertura del primer pabellón con 120 estudiantes en el corazón de Jesús María.' },
  { year: '2005', label: 'Expansión', desc: 'Construcción del laboratorio de ciencias y la sala de computación con 40 equipos.' },
  { year: '2014', label: 'Digital', desc: 'Implementación del primer sistema de gestión académica y wifi en todo el campus.' },
  { year: '2024', label: 'SOA', desc: 'Migración a arquitectura orientada a servicios con panel web integral para toda la comunidad.' },
];

/* ── Component ─────────────────────────────────────────────────── */
const Home: React.FC = () => {
  const [statsStarted, setStatsStarted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStatsStarted(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="public-landing" style={{ overflowX: 'hidden' }}>
      {/* Orbs */}
      <div className="landing-orb orb-one" />
      <div className="landing-orb orb-two" />
      {/* Extra orb */}
      <div style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', background: 'rgba(139,92,246,0.12)', filter: 'blur(60px)', top: '30%', left: '-100px', pointerEvents: 'none', animation: 'floatSlow 18s ease-in-out infinite' }} />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="landing-hero container py-5">
        <div className="row align-items-center g-5 py-4">
          {/* Left */}
          <div className="col-lg-6 fade-in-up">
            <div
              className="d-inline-flex align-items-center gap-2 mb-4"
              style={{ background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: 999, padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#93c5fd', backdropFilter: 'blur(8px)' }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#60a5fa', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
              Sistema activo · Colegio Futuro Digital
            </div>

            <h1
              className="fw-bold text-white mb-4"
              style={{ fontSize: 'clamp(2.2rem, 4.8vw, 3.6rem)', lineHeight: 1.08, letterSpacing: '-0.03em' }}
            >
              Educación moderna,<br />
              <span
                style={{
                  background: 'linear-gradient(90deg,#60a5fa,#a78bfa,#34d399)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                gestión inteligente.
              </span>
            </h1>

            <p className="mb-5" style={{ color: 'rgba(255,255,255,0.72)', fontSize: '1.05rem', maxWidth: 500, lineHeight: 1.7 }}>
              Institución ficticia en Jesús María, Lima. Diseñada para mostrar
              una experiencia escolar clara, elegante y tecnológica con gestión académica centralizada.
            </p>

            <div className="d-flex flex-wrap gap-3 mb-5">
              <Link
                to="/login"
                className="btn btn-lg px-5 fw-bold home-btn-primary"
              >
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Acceder al sistema
              </Link>
              <a
                href="#valores"
                className="btn btn-lg px-4 fw-semibold"
                style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.3)', color: '#fff', background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(4px)' }}
              >
                Conocer más <i className="bi bi-arrow-down ms-1"></i>
              </a>
            </div>

            {/* Stats */}
            <div className="d-flex flex-wrap gap-3">
              <StatItem value={1250} label="estudiantes" started={statsStarted} delay={0} />
              <StatItem value={65} label="docentes" started={statsStarted} delay={100} />
              <StatItem value={28} label="secciones" started={statsStarted} delay={200} />
              <StatItem value={100} suffix="%" label="digital" started={statsStarted} delay={300} />
            </div>
          </div>

          {/* Right — media */}
          <div className="col-lg-6 fade-in-up delay-1">
            <div className="hero-media-grid">
              <div className="hero-media hero-media-large floating-card" style={{ position: 'relative' }}>
                <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80" alt="Estudiantes en aula moderna" />
                {/* Live badge */}
                <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(16,185,129,0.92)', borderRadius: 8, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 5, backdropFilter: 'blur(4px)' }}>
                  <span style={{ width: 7, height: 7, background: '#fff', borderRadius: '50%', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                  En línea
                </div>
              </div>
              <div className="hero-media hero-media-small floating-card">
                <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80" alt="Laboratorio de computación" />
              </div>
              <div className="hero-glass-card floating-card">
                <div className="d-flex align-items-center gap-3 mb-2">
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(96,165,250,0.22)', display: 'grid', placeItems: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                    <i className="bi bi-building-check text-white"></i>
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>Campus preparado</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>para el aprendizaje integral</div>
                  </div>
                </div>
                <div className="d-flex gap-2 flex-wrap mt-1">
                  {['WiFi campus', 'Aulas tech', 'Biblioteca', 'Lab. ciencias'].map(t => (
                    <span key={t} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MODULES STRIP ─────────────────────────────────────────── */}
      <Reveal>
        <div className="container pb-3">
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '1.4rem 1.8rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.85rem' }}>Módulos del sistema</p>
            <div className="d-flex flex-wrap gap-2">
              {modules.map((m, i) => (
                <div
                  key={m.label}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                    padding: '0.45rem 0.95rem',
                    borderRadius: 10,
                    background: `${m.color}18`,
                    border: `1px solid ${m.color}40`,
                    color: m.color,
                    fontSize: '0.82rem', fontWeight: 700,
                    transition: `transform 0.2s ease ${i * 40}ms`,
                    cursor: 'default',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <i className={`bi ${m.icon}`}></i>
                  {m.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── HIGHLIGHTS ────────────────────────────────────────────── */}
      <section className="container py-5">
        <Reveal>
          <div className="text-center mb-5">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.35)', borderRadius: 999, padding: '0.4rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#93c5fd', marginBottom: '1rem' }}>
              <i className="bi bi-stars"></i> Por qué elegirnos
            </span>
            <h2 className="text-white fw-bold" style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', letterSpacing: '-0.02em' }}>
              Todo lo que necesita tu institución
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 520, margin: '0.75rem auto 0' }}>
              Un entorno diseñado para el crecimiento académico, con infraestructura moderna y tecnología al servicio del aprendizaje.
            </p>
          </div>
        </Reveal>

        <div className="row g-4">
          {highlights.map((item, i) => (
            <div className="col-md-4" key={item.title}>
              <Reveal delay={i * 120}>
                <div
                  className="home-card h-100"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '2rem', position: 'relative', overflow: 'hidden', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 40px ${item.color}22`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                >
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: item.bg, display: 'grid', placeItems: 'center', fontSize: '1.5rem', color: item.color, marginBottom: '1.2rem' }}>
                    <i className={`bi ${item.icon}`}></i>
                  </div>
                  <h4 className="fw-bold mb-2" style={{ color: '#f1f5f9', fontSize: '1.05rem' }}>{item.title}</h4>
                  <p className="mb-0" style={{ color: 'rgba(255,255,255,0.58)', lineHeight: 1.7, fontSize: '0.92rem' }}>{item.text}</p>
                  {/* Glow corner */}
                  <div style={{ position: 'absolute', bottom: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: `${item.color}12`, filter: 'blur(20px)' }} />
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      {/* ── VALUES ────────────────────────────────────────────────── */}
      <section id="valores" className="container py-5">
        <Reveal>
          <div className="text-center mb-5">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: 999, padding: '0.4rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#c4b5fd', marginBottom: '1rem' }}>
              <i className="bi bi-gem"></i> Nuestros valores
            </span>
            <h2 className="text-white fw-bold" style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', letterSpacing: '-0.02em' }}>
              Principios que nos guían
            </h2>
          </div>
        </Reveal>

        <div className="row g-3">
          {values.map((v, i) => (
            <div className="col-sm-6 col-lg-3" key={v.title}>
              <Reveal delay={i * 100}>
                <div
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${v.color}30`, borderRadius: 18, padding: '1.6rem', textAlign: 'center', height: '100%', transition: 'transform 0.22s ease, border-color 0.22s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.borderColor = `${v.color}70`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = `${v.color}30`; }}
                >
                  <div style={{ width: 54, height: 54, borderRadius: '50%', background: `${v.color}20`, display: 'grid', placeItems: 'center', fontSize: '1.4rem', color: v.color, margin: '0 auto 1rem' }}>
                    <i className={`bi ${v.icon}`}></i>
                  </div>
                  <h5 className="fw-bold mb-2" style={{ color: '#f1f5f9', fontSize: '0.98rem' }}>{v.title}</h5>
                  <p className="mb-0" style={{ color: 'rgba(255,255,255,0.52)', fontSize: '0.85rem', lineHeight: 1.65 }}>{v.text}</p>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      {/* ── TIMELINE ──────────────────────────────────────────────── */}
      <section className="container py-5">
        <Reveal>
          <div className="text-center mb-5">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 999, padding: '0.4rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#6ee7b7', marginBottom: '1rem' }}>
              <i className="bi bi-clock-history"></i> Nuestra historia
            </span>
            <h2 className="text-white fw-bold" style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', letterSpacing: '-0.02em' }}>
              Un camino de crecimiento
            </h2>
          </div>
        </Reveal>

        <div className="row g-4">
          {timelineItems.map((t, i) => (
            <div className="col-sm-6 col-lg-3" key={t.year}>
              <Reveal delay={i * 130}>
                <div style={{ position: 'relative', paddingTop: '1rem' }}>
                  {/* Line connector */}
                  {i < timelineItems.length - 1 && (
                    <div className="d-none d-lg-block" style={{ position: 'absolute', top: '2.1rem', left: 'calc(50% + 28px)', width: 'calc(100% - 56px)', height: 2, background: 'linear-gradient(90deg,rgba(99,102,241,0.6),rgba(99,102,241,0.1))', zIndex: 0 }} />
                  )}
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 18, padding: '1.5rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', border: '2px solid rgba(99,102,241,0.5)', display: 'grid', placeItems: 'center', margin: '0 auto 1rem', fontWeight: 800, fontSize: '0.95rem', color: '#a5b4fc' }}>
                      {t.year}
                    </div>
                    <h6 className="fw-bold mb-2" style={{ color: '#e2e8f0', fontSize: '0.95rem' }}>{t.label}</h6>
                    <p className="mb-0" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', lineHeight: 1.6 }}>{t.desc}</p>
                  </div>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
      <section className="container py-5">
        <Reveal>
          <div className="text-center mb-5">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 999, padding: '0.4rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#fcd34d', marginBottom: '1rem' }}>
              <i className="bi bi-chat-quote"></i> Testimonios
            </span>
            <h2 className="text-white fw-bold" style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', letterSpacing: '-0.02em' }}>
              Lo que dice nuestra comunidad
            </h2>
          </div>
        </Reveal>

        <div className="row g-4">
          {testimonials.map((t, i) => (
            <div className="col-md-4" key={t.name}>
              <Reveal delay={i * 120}>
                <div
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '2rem', height: '100%', position: 'relative', transition: 'transform 0.22s ease' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '2.5rem', color: 'rgba(245,158,11,0.6)', lineHeight: 1, marginBottom: '1rem' }}>"</div>
                  <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.92rem', lineHeight: 1.75, marginBottom: '1.5rem', fontStyle: 'italic' }}>
                    {t.text.replace(/^"|"$/g, '')}
                  </p>
                  <div className="d-flex align-items-center gap-3">
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '0.85rem', color: '#fff', flexShrink: 0 }}>
                      {t.avatar}
                    </div>
                    <div>
                      <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.9rem' }}>{t.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      {/* ── LOCATION + PHOTOS ─────────────────────────────────────── */}
      <section id="detalle" className="container py-5">
        <div className="row g-4 align-items-stretch">
          <div className="col-lg-5">
            <Reveal>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '2rem', height: '100%' }}>
                <span className="section-kicker">Ubicación</span>
                <h3 className="mt-2 mb-2 fw-bold text-white" style={{ fontSize: '1.4rem' }}>Jesús María, Lima, Perú</h3>
                <p className="mb-4" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.92rem' }}>
                  Una ubicación urbana ideal para una comunidad educativa conectada, segura y accesible.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { icon: 'bi-pin-map', text: 'Av. ficticia La Educación 480' },
                    { icon: 'bi-bus-front', text: 'Conexión con corredores y avenidas principales' },
                    { icon: 'bi-shield-check', text: 'Entorno pensado para bienestar escolar' },
                    { icon: 'bi-clock', text: 'Horario: Lunes a Viernes, 7:30 am – 3:30 pm' },
                  ].map(item => (
                    <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 12, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                      <i className={`bi ${item.icon} text-info`} style={{ fontSize: '1rem', flexShrink: 0 }}></i>
                      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem' }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          <div className="col-lg-7">
            <div className="row g-4">
              <div className="col-md-6">
                <Reveal delay={100}>
                  <div className="landing-photo-card">
                    <img src="https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&w=1200&q=80" alt="Biblioteca moderna" />
                    <div className="photo-overlay">Biblioteca y lectura</div>
                  </div>
                </Reveal>
              </div>
              <div className="col-md-6">
                <Reveal delay={200}>
                  <div className="landing-photo-card">
                    <img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80" alt="Ceremonia escolar" />
                    <div className="photo-overlay">Comunidad y valores</div>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────── */}
      <section className="container pb-5" ref={statsRef}>
        <Reveal>
          <div
            style={{
              borderRadius: 28,
              padding: 'clamp(2rem,5vw,3.5rem)',
              background: 'linear-gradient(135deg,rgba(59,130,246,0.22),rgba(139,92,246,0.18))',
              border: '1px solid rgba(99,102,241,0.35)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Glow blobs */}
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', filter: 'blur(60px)', top: -100, left: -80, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', filter: 'blur(50px)', bottom: -60, right: -40, pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '0.75rem' }}>🎓</div>
              <h2 className="text-white fw-bold mb-3" style={{ fontSize: 'clamp(1.6rem,3.5vw,2.5rem)', letterSpacing: '-0.025em' }}>
                ¿Listo para gestionar tu institución?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 540, margin: '0 auto 2rem', fontSize: '1.02rem' }}>
                Accede al sistema y administra alumnos, cursos, matrículas, calificaciones, asistencia y pagos desde un solo lugar.
              </p>
              <div className="d-flex flex-wrap gap-3 justify-content-center">
                <Link
                  to="/login"
                  className="btn btn-lg px-5 fw-bold home-btn-primary"
                >
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Ingresar al sistema
                </Link>
                <a
                  href="#valores"
                  className="btn btn-lg px-4 fw-semibold"
                  style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.3)', color: '#fff', background: 'rgba(255,255,255,0.06)' }}
                >
                  <i className="bi bi-arrow-up me-1"></i>Volver arriba
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="container pb-5" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>
        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', marginBottom: '1.5rem' }} />
        <div className="d-flex flex-wrap justify-content-center gap-4 mb-3" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem' }}>
          {modules.slice(0, 5).map(m => (
            <span key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <i className={`bi ${m.icon}`} style={{ color: m.color }}></i>{m.label}
            </span>
          ))}
        </div>
        © {new Date().getFullYear()} Colegio Futuro Digital — Sistema de Gestión Académica SOA
      </footer>
    </div>
  );
};

export default Home;
