import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { alumnosService, cursosService, profesoresService, matriculasService } from '../api/services';

type SearchResult = {
  label: string;
  detail: string;
  icon: string;
  path: string;
};

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/login');
  };

  // Cerrar dropdown cuando se clickea afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const [alumnos, cursos, profesores, matriculas] = await Promise.allSettled([
          alumnosService.getAll(),
          cursosService.getAll(),
          profesoresService.getAll(),
          matriculasService.getAll(),
        ]);

        const rows = (result: PromiseSettledResult<any>) =>
          result.status === 'fulfilled' ? result.value.data?.datos || [] : [];

        const allResults: SearchResult[] = [
          ...rows(alumnos).map((alumno: any) => ({
            label: `${alumno.primer_nombre || ''} ${alumno.apellido_paterno || ''}`.trim(),
            detail: `Alumno · ${alumno.numero_matricula || alumno.email_contacto || 'sin matricula'}`,
            icon: 'bi-person',
            path: '/alumnos',
          })),
          ...rows(cursos).map((curso: any) => ({
            label: curso.nombre,
            detail: `Curso · ${curso.codigo || curso.grado || 'sin codigo'}`,
            icon: 'bi-book',
            path: '/cursos',
          })),
          ...rows(profesores).map((profesor: any) => ({
            label: `${profesor.primer_nombre || ''} ${profesor.apellido_paterno || ''}`.trim(),
            detail: `Profesor · ${profesor.especialidad || profesor.numero_empleado || 'docente'}`,
            icon: 'bi-person-check',
            path: '/profesores',
          })),
          ...rows(matriculas).map((matricula: any) => ({
            label: matricula.alumno_nombre || matricula.curso_nombre || 'Matricula',
            detail: `Matricula · ${matricula.curso_nombre || matricula.periodo_academico || 'activa'}`,
            icon: 'bi-clipboard-check',
            path: '/matriculas',
          })),
        ];

        setSearchResults(
          allResults
            .filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(term))
            .slice(0, 6)
        );
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  return (
    <nav className="navbar navbar-expand-lg navbar navbar-custom" style={{ position: 'sticky', top: 0, zIndex: 1040 }}>
      <div className="container-fluid">
        <a className="navbar-brand" href="/">
          <i className="bi bi-mortarboard me-2"></i>
          <span className="d-none d-sm-inline">Colegio Futuro Digital</span>
          <span className="d-sm-none">CFD</span>
        </a>
        <div className="global-search d-none d-lg-block">
          <i className="bi bi-search"></i>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar alumno, curso, profesor o matricula"
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm('')} aria-label="Limpiar busqueda">
              <i className="bi bi-x"></i>
            </button>
          )}
          {(searchResults.length > 0 || isSearching) && (
            <div className="global-search-results">
              {isSearching && <div className="global-search-empty">Buscando...</div>}
              {!isSearching && searchResults.map((result) => (
                <button
                  key={`${result.path}-${result.label}-${result.detail}`}
                  type="button"
                  onClick={() => {
                    navigate(result.path);
                    setSearchTerm('');
                    setSearchResults([]);
                  }}
                >
                  <i className={`bi ${result.icon}`}></i>
                  <span>
                    <strong>{result.label}</strong>
                    <small>{result.detail}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="ms-auto d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-light navbar-icon-btn"
            type="button"
            onClick={() => setIsDarkMode((current) => !current)}
            title={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
            aria-label={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            <i className={`bi ${isDarkMode ? 'bi-sun' : 'bi-moon-stars'}`}></i>
          </button>
          <span className="text-white me-2 d-none d-md-inline" style={{ fontSize: '0.9rem' }}>
            <i className="bi bi-person me-1"></i>
            {user?.nombre}
          </span>
          <span className="text-white me-2 d-md-none" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-person me-1"></i>
          </span>
          <div className="dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              className="btn btn-outline-light"
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                padding: '0.4rem 1rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                minWidth: '60px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderRadius: '999px',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.25s ease',
              }}
              title="Menú de usuario"
            >
              <i className="bi bi-person-circle" style={{ fontSize: '1rem' }}></i>
              <span className="d-none d-md-inline" style={{ fontSize: '0.85rem' }}>{user?.nombre?.split(' ')[0]}</span>
              <i className="bi bi-chevron-down" style={{ fontSize: '0.75rem' }}></i>
            </button>
            {isDropdownOpen && (
              <ul 
                className="dropdown-menu dropdown-menu-end show" 
                style={{ 
                  display: 'block',
                  minWidth: '220px',
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.7)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(16px)',
                  overflow: 'hidden',
                  padding: '8px 0',
                  animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <li>
                  <div className="px-3 py-2">
                    <p className="mb-0 text-muted small" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Usuario activo</p>
                    <h6 className="mb-0 fw-bold dropdown-user-name" style={{ fontSize: '0.95rem' }}>
                      {user?.nombre}
                    </h6>
                    <span className="badge bg-primary mt-1" style={{ fontSize: '0.65rem', padding: '3px 8px' }}>
                      {user?.tipo_usuario}
                    </span>
                  </div>
                </li>
                <li>
                  <hr className="dropdown-divider my-2" style={{ opacity: 0.1 }} />
                </li>
                <li>
                  <a 
                    className="dropdown-item d-flex align-items-center gap-2" 
                    href="/perfil" 
                    style={{ 
                      padding: '0.6rem 1.2rem',
                      cursor: 'pointer',
                      color: '#334155',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={(e) => {
                      setIsDropdownOpen(false);
                    }}
                  >
                    <i className="bi bi-person-circle text-muted"></i>
                    Mi Perfil
                  </a>
                </li>
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center gap-2 text-danger"
                    onClick={handleLogout}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.6rem 1.2rem',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    <i className="bi bi-box-arrow-right"></i>
                    Cerrar Sesión
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
