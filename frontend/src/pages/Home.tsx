import React from 'react';
import { Link } from 'react-router-dom';

const highlights = [
  {
    icon: 'bi-geo-alt-fill',
    title: 'Ubicación estratégica',
    text: 'Jesús María, Lima, con acceso ágil a transporte, servicios y zonas residenciales.'
  },
  {
    icon: 'bi-pc-display-horizontal',
    title: 'Aulas digitales',
    text: 'Laboratorios, conectividad y herramientas para gestión académica en tiempo real.'
  },
  {
    icon: 'bi-people-fill',
    title: 'Comunidad activa',
    text: 'Familias, docentes y estudiantes coordinados con una cultura de mejora continua.'
  }
];

const Home: React.FC = () => {
  return (
    <div className="public-landing">
      <div className="landing-orb orb-one"></div>
      <div className="landing-orb orb-two"></div>

      <section className="landing-hero container py-5">
        <div className="row align-items-center g-5 py-4">
          <div className="col-lg-6 fade-in-up">
            <span className="eyebrow-pill mb-3 d-inline-flex align-items-center gap-2">
              <i className="bi bi-stars"></i>
              Colegio Futuro Digital
            </span>
            <h1 className="display-4 fw-bold text-white mb-3">
              Formación moderna para una educación con visión de futuro.
            </h1>
            <p className="lead text-white-75 mb-4">
              Institución ficticia ubicada en Jesús María, Lima, diseñada para mostrar una experiencia escolar
              clara, elegante y tecnológica con presencia institucional y gestión centralizada.
            </p>
            <div className="d-flex flex-wrap gap-3 mb-4">
              <Link to="/login" className="btn btn-light btn-lg px-4 fw-semibold">
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Ir al acceso
              </Link>
              <a href="#detalle" className="btn btn-outline-light btn-lg px-4 fw-semibold">
                Conocer más
              </a>
            </div>
            <div className="d-flex flex-wrap gap-3 hero-metrics">
              <div>
                <strong>1 250</strong>
                <span>estudiantes</span>
              </div>
              <div>
                <strong>65</strong>
                <span>docentes</span>
              </div>
              <div>
                <strong>28</strong>
                <span>secciones</span>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="hero-media-grid fade-in-up delay-1">
              <div className="hero-media hero-media-large floating-card">
                <img
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80"
                  alt="Estudiantes en aula moderna"
                />
              </div>
              <div className="hero-media hero-media-small floating-card">
                <img
                  src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80"
                  alt="Laboratorio de computación"
                />
              </div>
              <div className="hero-glass-card floating-card">
                <i className="bi bi-building-check display-6 text-white mb-2"></i>
                <h5 className="text-white mb-1">Campus preparado para el aprendizaje integral</h5>
                <p className="text-white-75 mb-0">
                  Ambientes luminosos, espacios colaborativos y seguimiento académico digital.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="detalle" className="container pb-5">
        <div className="row g-4 mb-4">
          {highlights.map((item) => (
            <div className="col-md-4" key={item.title}>
              <div className="landing-card h-100 fade-in-up">
                <div className="landing-icon"><i className={`bi ${item.icon}`}></i></div>
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-4 align-items-stretch">
          <div className="col-lg-5">
            <div className="landing-card location-card h-100 fade-in-up delay-1">
              <span className="section-kicker">Ubicación</span>
              <h3 className="mt-2 mb-3">Jesús María, Lima, Perú</h3>
              <p className="mb-4">
                Una ubicación urbana ideal para una comunidad educativa conectada, segura y accesible.
              </p>
              <div className="detail-list">
                <div><i className="bi bi-pin-map me-2"></i>Av. ficticia La Educación 480</div>
                <div><i className="bi bi-bus-front me-2"></i>Conexión con corredores y avenidas principales</div>
                <div><i className="bi bi-shield-check me-2"></i>Entorno pensado para bienestar escolar</div>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="row g-4">
              <div className="col-md-6">
                <div className="landing-photo-card fade-in-up delay-1">
                  <img
                    src="https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&w=1200&q=80"
                    alt="Biblioteca moderna"
                  />
                  <div className="photo-overlay">Biblioteca y lectura</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="landing-photo-card fade-in-up delay-2">
                  <img
                    src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80"
                    alt="Ceremonia escolar"
                  />
                  <div className="photo-overlay">Comunidad y valores</div>
                </div>
              </div>
              <div className="col-12">
                <div className="landing-strip fade-in-up delay-2">
                  <div>
                    <span className="section-kicker">Gestión integrada</span>
                    <h4 className="mt-2 mb-1">Administración, seguimiento y comunicación en una sola plataforma</h4>
                    <p className="mb-0 text-muted">
                      Accede al sistema para revisar cursos, matrículas, asistencia, notas y pagos.
                    </p>
                  </div>
                  <Link to="/login" className="btn btn-primary btn-lg px-4">
                    Ingresar al sistema
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;