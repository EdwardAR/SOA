// API Base URL
const API_BASE = 'http://localhost:3000/api';

// Estado global
const state = {
  usuario: null,
  token: null,
  paginaActual: 'login',
  cargando: false
};

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    state.token = token;
    try {
      state.usuario = JSON.parse(localStorage.getItem('usuario'));
      mostrarDashboard();
    } catch (e) {
      localStorage.clear();
      mostrarLogin();
    }
  } else {
    mostrarLogin();
  }
});

// ============================================
// UTILIDADES
// ============================================

function mostrarAlerta(tipo, mensaje, duracion = 5000) {
  const iconos = {
    error: 'bi-exclamation-circle-fill',
    success: 'bi-check-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill'
  };

  const alertDiv = document.createElement('div');
  alertDiv.className = `alert-message alert-${tipo}`;
  alertDiv.innerHTML = `
    <i class="bi ${iconos[tipo]} alert-icon"></i>
    <span>${mensaje}</span>
  `;

  const container = document.querySelector('.alert-container') ||
                   document.querySelector('.login-form');

  if (container) {
    container.insertAdjacentElement('beforebegin', alertDiv);

    if (duracion) {
      setTimeout(() => {
        alertDiv.style.animation = 'slideUp 0.3s ease-out forwards';
        setTimeout(() => alertDiv.remove(), 300);
      }, duracion);
    }
  }
}

function establecerBotonEstado(boton, cargando, texto) {
  if (cargando) {
    boton.disabled = true;
    boton.innerHTML = '<span class="btn-login-loading"></span> Ingresando...';
  } else {
    boton.disabled = false;
    boton.innerHTML = '<i class="bi bi-box-arrow-in-right btn-icon"></i> Ingresar';
  }
}

// ============================================
// LOGIN
// ============================================

function mostrarLogin() {
  state.paginaActual = 'login';
  document.getElementById('app').innerHTML = `
    <div class="login-wrapper">
      <div class="login-container">
        <div class="login-header">
          <div class="login-header-icon-wrapper">
            <i class="bi bi-mortarboard-fill login-header-icon"></i>
          </div>
          <h1>Colegio Futuro Digital</h1>
          <p>Sistema de Gestión Académica SOA</p>
        </div>

        <div class="alert-container"></div>

        <form id="loginForm" class="login-form" onsubmit="handleLogin(event)">
          <div class="form-group">
            <label for="email"><i class="bi bi-envelope-fill form-label-icon"></i> Email</label>
            <input type="email" id="email" placeholder="tu@email.com" required>
          </div>

          <div class="form-group">
            <label for="password"><i class="bi bi-lock-fill form-label-icon"></i> Contraseña</label>
            <input type="password" id="password" placeholder="••••••••" required>
          </div>

          <button type="submit" class="btn-login" id="btnLogin">
            <i class="bi bi-box-arrow-in-right btn-icon"></i> Ingresar
          </button>
        </form>

        <div class="login-divider">O usa una cuenta de prueba</div>

        <div class="demo-credentials">
          <h3><i class="bi bi-people-fill demo-header-icon"></i> Cuentas de Demostración</h3>
          <ul class="demo-credentials-list">
            <li class="demo-credentials-item" onclick="rellenarFormulario('director@colegio.com', 'password123')">
              <span class="demo-credentials-item-icon"><i class="bi bi-person-check-fill icon-director"></i></span>
              <div class="demo-credentials-item-text">
                <div class="demo-credentials-item-role">Director</div>
                <div class="demo-credentials-item-email">director@colegio.com</div>
              </div>
              <span class="demo-credentials-item-action"><i class="bi bi-chevron-right"></i></span>
            </li>
            <li class="demo-credentials-item" onclick="rellenarFormulario('luis@estudiante.com', 'password123')">
              <span class="demo-credentials-item-icon"><i class="bi bi-mortarboard-fill icon-alumno"></i></span>
              <div class="demo-credentials-item-text">
                <div class="demo-credentials-item-role">Alumno</div>
                <div class="demo-credentials-item-email">luis@estudiante.com</div>
              </div>
              <span class="demo-credentials-item-action"><i class="bi bi-chevron-right"></i></span>
            </li>
            <li class="demo-credentials-item" onclick="rellenarFormulario('juan@colegio.com', 'password123')">
              <span class="demo-credentials-item-icon"><i class="bi bi-easel-fill icon-docente"></i></span>
              <div class="demo-credentials-item-text">
                <div class="demo-credentials-item-role">Docente</div>
                <div class="demo-credentials-item-email">juan@colegio.com</div>
              </div>
              <span class="demo-credentials-item-action"><i class="bi bi-chevron-right"></i></span>
            </li>
            <li class="demo-credentials-item" onclick="rellenarFormulario('admin@colegio.com', 'password123')">
              <span class="demo-credentials-item-icon"><i class="bi bi-gear-fill icon-admin"></i></span>
              <div class="demo-credentials-item-text">
                <div class="demo-credentials-item-role">Administrador</div>
                <div class="demo-credentials-item-email">admin@colegio.com</div>
              </div>
              <span class="demo-credentials-item-action"><i class="bi bi-chevron-right"></i></span>
            </li>
          </ul>
          <div class="demo-credentials-password">
            <i class="bi bi-key-fill demo-key-icon"></i> Contraseña: <strong>password123</strong>
          </div>
        </div>
      </div>
    </div>
  `;

  // Focus en primer campo
  setTimeout(() => document.getElementById('email').focus(), 100);
}

function rellenarFormulario(email, password) {
  document.getElementById('email').value = email;
  document.getElementById('password').value = password;
  document.getElementById('password').focus();
  mostrarAlerta('info', `Formulario rellenado con ${email}`, 2000);
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const btnLogin = document.getElementById('btnLogin');

  if (!email || !password) {
    mostrarAlerta('warning', 'Por favor completa todos los campos');
    return;
  }

  establecerBotonEstado(btnLogin, true);

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.datos) {
      state.token = data.datos.token;
      state.usuario = data.datos.usuario;

      localStorage.setItem('token', state.token);
      localStorage.setItem('usuario', JSON.stringify(state.usuario));

      mostrarAlerta('success', `¡Bienvenido ${state.usuario.nombre}!`, 1500);

      setTimeout(() => {
        mostrarDashboard();
      }, 500);
    } else {
      const errorMsg = data.mensaje || 'Error en la autenticación';
      mostrarAlerta('error', errorMsg);
      establecerBotonEstado(btnLogin, false, 'Ingresar');
    }
  } catch (error) {
    console.error('Error de login:', error);
    mostrarAlerta('error',
      '❌ No se puede conectar con el servidor. Asegúrate de que:<br>• El API Gateway esté corriendo (npm run dev)<br>• Accedas desde http://localhost:3000 (no desde otro puerto)');
    establecerBotonEstado(btnLogin, false, 'Ingresar');
  }
}

// ============================================
// DASHBOARD
// ============================================

function mostrarDashboard() {
  state.paginaActual = 'dashboard';
  document.getElementById('app').innerHTML = `
    <div class="dashboard-wrapper">
      <div class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-header-icon-wrapper">
            <i class="bi bi-mortarboard-fill sidebar-header-icon"></i>
          </div>
          <h3>${state.usuario.nombre}</h3>
          <p>${state.usuario.tipo_usuario}</p>
        </div>

        <nav class="sidebar-menu">
          <div class="nav-item">
            <div class="nav-link active" onclick="cargarPagina('inicio', this)">
              <i class="bi bi-speedometer2 nav-link-icon"></i>
              <span>Inicio</span>
            </div>
          </div>

          ${state.usuario.tipo_usuario === 'alumno' ? `
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('mis-cursos', this)">
              <i class="bi bi-book-fill nav-link-icon"></i>
              <span>Mis Cursos</span>
            </div>
          </div>
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('mis-notas', this)">
              <i class="bi bi-pencil-square nav-link-icon"></i>
              <span>Mis Notas</span>
            </div>
          </div>
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('mis-pagos', this)">
              <i class="bi bi-credit-card nav-link-icon"></i>
              <span>Mis Pagos</span>
            </div>
          </div>
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('asistencia', this)">
              <i class="bi bi-check-circle-fill nav-link-icon"></i>
              <span>Asistencia</span>
            </div>
          </div>
          ` : ''}

          ${state.usuario.tipo_usuario === 'docente' ? `
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('mis-cursos', this)">
              <i class="bi bi-book-fill nav-link-icon"></i>
              <span>Mis Cursos</span>
            </div>
          </div>
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('calificaciones', this)">
              <i class="bi bi-pencil-square nav-link-icon"></i>
              <span>Calificaciones</span>
            </div>
          </div>
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('asistencia', this)">
              <i class="bi bi-check-circle-fill nav-link-icon"></i>
              <span>Asistencia</span>
            </div>
          </div>
          ` : ''}

          ${(state.usuario.tipo_usuario === 'administrativo' || state.usuario.tipo_usuario === 'director') ? `
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('alumnos', this)">
              <i class="bi bi-people-fill nav-link-icon"></i>
              <span>Alumnos</span>
            </div>
          </div>
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('cursos', this)">
              <i class="bi bi-book-half nav-link-icon"></i>
              <span>Cursos</span>
            </div>
          </div>
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('pagos', this)">
              <i class="bi bi-currency-dollar nav-link-icon"></i>
              <span>Pagos</span>
            </div>
          </div>
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('matriculas', this)">
              <i class="bi bi-list-check nav-link-icon"></i>
              <span>Matrículas</span>
            </div>
          </div>
          ` : ''}
        </nav>

        <div class="sidebar-footer">
          <button class="btn-logout" onclick="handleLogout()">
            <i class="bi bi-box-arrow-left btn-icon"></i> Cerrar Sesión
          </button>
        </div>
      </div>

      <div class="dashboard-main">
        <div class="topbar">
          <div class="topbar-title">
            <i class="bi bi-diagram-3 topbar-icon"></i> Sistema de Gestión Académica
          </div>
          <div class="topbar-info">
            <span><i class="bi bi-person-circle topbar-user-icon"></i> <strong>${state.usuario.nombre}</strong></span>
            <span class="topbar-role"><i class="bi bi-shield-fill topbar-badge-icon"></i> ${state.usuario.tipo_usuario.toUpperCase()}</span>
          </div>
        </div>

        <div class="content" id="content">
          <div class="text-center">
            <div class="loading-spinner"></div>
            <p style="color: var(--gray); margin-top: 15px;">Cargando...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  cargarPagina('inicio', document.querySelector('.nav-link.active'));
}

function handleLogout() {
  if (confirm('¿Deseas cerrar sesión?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    state.usuario = null;
    state.token = null;
    mostrarLogin();
  }
}

function cargarPagina(pagina, elemento) {
  if (elemento) {
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    elemento.classList.add('active');
  }

  const content = document.getElementById('content');

  switch (pagina) {
    case 'inicio':
      mostrarInicio(content);
      break;
    case 'alumnos':
      mostrarAlumnos(content);
      break;
    case 'mis-cursos':
      mostrarMisCursos(content);
      break;
    case 'mis-notas':
      mostrarMisNotas(content);
      break;
    case 'mis-pagos':
      mostrarMisPagos(content);
      break;
    case 'asistencia':
      mostrarAsistencia(content);
      break;
    case 'cursos':
      mostrarCursos(content);
      break;
    case 'pagos':
      mostrarPagos(content);
      break;
    case 'matriculas':
      mostrarMatriculas(content);
      break;
  }
}

// ============================================
// VISTAS
// ============================================

function mostrarInicio(content) {
  content.innerHTML = `
    <div class="page-header">
      <h2><i class="bi bi-house-door-fill page-icon"></i> Bienvenido, <strong>${state.usuario.nombre}</strong></h2>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon"><i class="bi bi-lightning-charge-fill"></i></div>
        <div class="stat-number">7</div>
        <div class="stat-label">Servicios Activos</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="bi bi-check-circle-fill"></i></div>
        <div class="stat-number">✅</div>
        <div class="stat-label">Sistema Operativo</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="bi bi-calendar-event"></i></div>
        <div class="stat-number">2024-1</div>
        <div class="stat-label">Período Actual</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="bi bi-cloud-check"></i></div>
        <div class="stat-number">∞</div>
        <div class="stat-label">Escalabilidad</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <i class="bi bi-info-circle-fill"></i> Información del Sistema
      </div>
      <div class="card-body">
        <p><strong><i class="bi bi-gear-fill"></i> Nombre:</strong> Gestión Académica SOA</p>
        <p><strong><i class="bi bi-tag-fill"></i> Versión:</strong> 1.0.0</p>
        <p><strong><i class="bi bi-diagram-3-fill"></i> Arquitectura:</strong> Microservicios Distribuidos</p>
        <p><strong><i class="bi bi-server"></i> Servicios Disponibles:</strong></p>
        <ul style="margin-top: 15px;">
          <li><i class="bi bi-cloud-fill"></i> <strong>API Gateway</strong> (Puerto 3000) - Autenticación y proxy</li>
          <li><i class="bi bi-people-fill"></i> <strong>Servicio de Alumnos</strong> (Puerto 3001) - CRUD de estudiantes</li>
          <li><i class="bi bi-clipboard-check"></i> <strong>Servicio de Matrículas</strong> (Puerto 3002) - Inscripciones</li>
          <li><i class="bi bi-easel-fill"></i> <strong>Servicio de Profesores</strong> (Puerto 3003) - Gestión docentes</li>
          <li><i class="bi bi-book-fill"></i> <strong>Servicio de Cursos</strong> (Puerto 3004) - Gestión académica</li>
          <li><i class="bi bi-credit-card-fill"></i> <strong>Servicio de Pagos</strong> (Puerto 3005) - Transacciones</li>
          <li><i class="bi bi-envelope-fill"></i> <strong>Servicio de Notificaciones</strong> (Puerto 3006) - Emails/SMS</li>
          <li><i class="bi bi-check-circle-fill"></i> <strong>Servicio de Asistencia</strong> (Puerto 3007) - Control de asistencia</li>
        </ul>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <i class="bi bi-shield-check"></i> Reglas de Negocio Implementadas
      </div>
      <div class="card-body">
        <ul>
          <li><i class="bi bi-check-circle-fill" style="color: var(--success);"></i> <strong>RN-001:</strong> Asignación única de aula por periodo</li>
          <li><i class="bi bi-check-circle-fill" style="color: var(--success);"></i> <strong>RN-002:</strong> Registro de notas en plazo</li>
          <li><i class="bi bi-check-circle-fill" style="color: var(--success);"></i> <strong>RN-003:</strong> Control diario de asistencia</li>
          <li><i class="bi bi-check-circle-fill" style="color: var(--success);"></i> <strong>RN-004:</strong> Restricción de matrícula por deuda</li>
          <li><i class="bi bi-check-circle-fill" style="color: var(--success);"></i> <strong>RN-005:</strong> Acceso restringido para padres</li>
          <li><i class="bi bi-check-circle-fill" style="color: var(--success);"></i> <strong>RN-006:</strong> Notificación automática de inasistencias</li>
          <li><i class="bi bi-check-circle-fill" style="color: var(--success);"></i> <strong>RN-007:</strong> Validación de datos obligatorios</li>
        </ul>
      </div>
    </div>
  `;
}

function mostrarAlumnos(content) {
  content.innerHTML = `
    <div class="page-header">
      <h2><i class="bi bi-people-fill page-icon"></i> Gestión de Alumnos</h2>
    </div>
    <div class="card">
      <div class="card-header"><i class="bi bi-list-check"></i> Lista de Alumnos</div>
      <div class="card-body">
        <p><i class="bi bi-info-circle"></i> Funcionalidad disponible a través de la API.</p>
        <p><code>GET /api/alumnos</code></p>
      </div>
    </div>
  `;
}

function mostrarMisCursos(content) {
  content.innerHTML = `
    <div class="page-header">
      <h2><i class="bi bi-book-fill page-icon"></i> Mis Cursos</h2>
    </div>
    <div class="card">
      <div class="card-header"><i class="bi bi-mortarboard-fill"></i> Cursos Inscritos</div>
      <div class="card-body">
        <p><i class="bi bi-hourglass-split"></i> Cargando información de cursos...</p>
      </div>
    </div>
  `;
}

function mostrarMisNotas(content) {
  content.innerHTML = `
    <div class="page-header">
      <h2><i class="bi bi-pencil-square page-icon"></i> Mis Notas</h2>
    </div>
    <div class="card">
      <div class="card-header"><i class="bi bi-file-text-fill"></i> Calificaciones por Curso</div>
      <div class="card-body">
        <p><i class="bi bi-hourglass-split"></i> Cargando calificaciones...</p>
      </div>
    </div>
  `;
}

function mostrarMisPagos(content) {
  content.innerHTML = `
    <div class="page-header">
      <h2><i class="bi bi-credit-card page-icon"></i> Mis Pagos</h2>
    </div>
    <div class="card">
      <div class="card-header"><i class="bi bi-wallet2-fill"></i> Estado de Pagos</div>
      <div class="card-body">
        <p><i class="bi bi-hourglass-split"></i> Cargando estado de pagos...</p>
      </div>
    </div>
  `;
}

function mostrarAsistencia(content) {
  content.innerHTML = `
    <div class="page-header">
      <h2><i class="bi bi-check-circle-fill page-icon"></i> Asistencia</h2>
    </div>
    <div class="card">
      <div class="card-header"><i class="bi bi-calendar2-check"></i> Registro de Asistencia</div>
      <div class="card-body">
        <p><i class="bi bi-hourglass-split"></i> Cargando asistencia...</p>
      </div>
    </div>
  `;
}

function mostrarCursos(content) {
  content.innerHTML = `
    <div class="page-header">
      <h2><i class="bi bi-book-half page-icon"></i> Cursos</h2>
    </div>
    <div class="card">
      <div class="card-header"><i class="bi bi-collection-fill"></i> Gestión de Cursos</div>
      <div class="card-body">
        <p><i class="bi bi-hourglass-split"></i> Cargando lista de cursos...</p>
      </div>
    </div>
  `;
}

function mostrarPagos(content) {
  content.innerHTML = `
    <div class="page-header">
      <h2><i class="bi bi-currency-dollar page-icon"></i> Pagos</h2>
    </div>
    <div class="card">
      <div class="card-header"><i class="bi bi-cash-coin"></i> Gestión de Pagos</div>
      <div class="card-body">
        <p><i class="bi bi-hourglass-split"></i> Cargando pagos...</p>
      </div>
    </div>
  `;
}

function mostrarMatriculas(content) {
  content.innerHTML = `
    <div class="page-header">
      <h2><i class="bi bi-list-check page-icon"></i> Matrículas</h2>
    </div>
    <div class="card">
      <div class="card-header"><i class="bi bi-clipboard-check-fill"></i> Gestión de Matrículas</div>
      <div class="card-body">
        <p><i class="bi bi-hourglass-split"></i> Cargando matrículas...</p>
      </div>
    </div>
  `;
}
