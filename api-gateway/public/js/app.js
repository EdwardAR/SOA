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
    error: 'bi-exclamation-circle',
    success: 'bi-check-circle',
    warning: 'bi-exclamation-triangle',
    info: 'bi-info-circle'
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
    boton.innerHTML = '<span class="btn-login-loading"></span>Ingresando...';
  } else {
    boton.disabled = false;
    boton.textContent = texto || 'Ingresar';
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
          <span class="login-header-icon">🎓</span>
          <h1>Colegio Futuro Digital</h1>
          <p>Sistema de Gestión Académica SOA</p>
        </div>

        <div class="alert-container"></div>

        <form id="loginForm" class="login-form" onsubmit="handleLogin(event)">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" placeholder="tu@email.com" required>
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input type="password" id="password" placeholder="••••••••" required>
          </div>

          <button type="submit" class="btn-login" id="btnLogin">Ingresar</button>
        </form>

        <div class="login-divider">O usa una cuenta de prueba</div>

        <div class="demo-credentials">
          <h3>👤 Cuentas de Demostración</h3>
          <ul class="demo-credentials-list">
            <li class="demo-credentials-item" onclick="rellenarFormulario('director@colegio.com', 'password123')">
              <span class="demo-credentials-item-icon">👔</span>
              <div class="demo-credentials-item-text">
                <div class="demo-credentials-item-role">Director</div>
                <div class="demo-credentials-item-email">director@colegio.com</div>
              </div>
            </li>
            <li class="demo-credentials-item" onclick="rellenarFormulario('luis@estudiante.com', 'password123')">
              <span class="demo-credentials-item-icon">👨‍🎓</span>
              <div class="demo-credentials-item-text">
                <div class="demo-credentials-item-role">Alumno</div>
                <div class="demo-credentials-item-email">luis@estudiante.com</div>
              </div>
            </li>
            <li class="demo-credentials-item" onclick="rellenarFormulario('juan@colegio.com', 'password123')">
              <span class="demo-credentials-item-icon">👨‍🏫</span>
              <div class="demo-credentials-item-text">
                <div class="demo-credentials-item-role">Docente</div>
                <div class="demo-credentials-item-email">juan@colegio.com</div>
              </div>
            </li>
            <li class="demo-credentials-item" onclick="rellenarFormulario('admin@colegio.com', 'password123')">
              <span class="demo-credentials-item-icon">🔧</span>
              <div class="demo-credentials-item-text">
                <div class="demo-credentials-item-role">Administrador</div>
                <div class="demo-credentials-item-email">admin@colegio.com</div>
              </div>
            </li>
          </ul>
          <div class="demo-credentials-password">
            🔑 Contraseña: <strong>password123</strong>
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
          <span class="login-header-icon">🎓</span>
          <h3>${state.usuario.nombre}</h3>
          <p>${state.usuario.tipo_usuario}</p>
        </div>

        <nav class="sidebar-menu">
          <div class="nav-item">
            <div class="nav-link active" onclick="cargarPagina('inicio', this)">
              <i class="bi bi-speedometer2 nav-link-icon"></i>
              Inicio
            </div>
          </div>

          ${state.usuario.tipo_usuario === 'alumno' ? `
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('mis-cursos', this)">
              <i class="bi bi-book nav-link-icon"></i>
              Mis Cursos
            </div>
          </div>
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('mis-notas', this)">
              <i class="bi bi-pencil-square nav-link-icon"></i>
              Mis Notas
            </div>
          </div>
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('mis-pagos', this)">
              <i class="bi bi-credit-card nav-link-icon"></i>
              Mis Pagos
            </div>
          </div>
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('asistencia', this)">
              <i class="bi bi-check-circle nav-link-icon"></i>
              Asistencia
            </div>
          </div>
          ` : ''}

          ${state.usuario.tipo_usuario === 'docente' ? `
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('mis-cursos', this)">
              <i class="bi bi-book nav-link-icon"></i>
              Mis Cursos
            </div>
          </div>
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('calificaciones', this)">
              <i class="bi bi-pencil-square nav-link-icon"></i>
              Calificaciones
            </div>
          </div>
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('asistencia', this)">
              <i class="bi bi-check-circle nav-link-icon"></i>
              Asistencia
            </div>
          </div>
          ` : ''}

          ${(state.usuario.tipo_usuario === 'administrativo' || state.usuario.tipo_usuario === 'director') ? `
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('alumnos', this)">
              <i class="bi bi-people nav-link-icon"></i>
              Alumnos
            </div>
          </div>
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('cursos', this)">
              <i class="bi bi-book nav-link-icon"></i>
              Cursos
            </div>
          </div>
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('pagos', this)">
              <i class="bi bi-credit-card nav-link-icon"></i>
              Pagos
            </div>
          </div>
          <div class="nav-item">
            <div class="nav-link" onclick="cargarPagina('matriculas', this)">
              <i class="bi bi-list-check nav-link-icon"></i>
              Matrículas
            </div>
          </div>
          ` : ''}
        </nav>

        <div class="sidebar-footer">
          <button class="btn-logout" onclick="handleLogout()">
            <i class="bi bi-box-arrow-left"></i> Cerrar Sesión
          </button>
        </div>
      </div>

      <div class="dashboard-main">
        <div class="topbar">
          <div class="topbar-title">Sistema de Gestión Académica</div>
          <div class="topbar-info">
            <span><strong>👤 ${state.usuario.nombre}</strong></span>
            <span class="topbar-role">${state.usuario.tipo_usuario.toUpperCase()}</span>
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
    <h2 style="margin-bottom: 25px;">Bienvenido, <strong>${state.usuario.nombre}</strong></h2>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">7</div>
        <div class="stat-label">Servicios Activos</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">✅</div>
        <div class="stat-label">Sistema Operativo</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">2024-1</div>
        <div class="stat-label">Período Académico</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">∞</div>
        <div class="stat-label">Escalabilidad</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <i class="bi bi-info-circle"></i> Información del Sistema
      </div>
      <div class="card-body">
        <p><strong>Nombre del Sistema:</strong> Gestión Académica SOA</p>
        <p><strong>Versión:</strong> 1.0.0</p>
        <p><strong>Arquitectura:</strong> Microservicios Distribuidos</p>
        <p><strong>Servicios Disponibles:</strong></p>
        <ul>
          <li><strong>API Gateway</strong> (Puerto 3000) - Autenticación y proxy</li>
          <li><strong>Servicio de Alumnos</strong> (Puerto 3001) - CRUD de estudiantes</li>
          <li><strong>Servicio de Matrículas</strong> (Puerto 3002) - Inscripciones</li>
          <li><strong>Servicio de Profesores</strong> (Puerto 3003) - Gestión docentes</li>
          <li><strong>Servicio de Cursos</strong> (Puerto 3004) - Gestión académica</li>
          <li><strong>Servicio de Pagos</strong> (Puerto 3005) - Transacciones</li>
          <li><strong>Servicio de Notificaciones</strong> (Puerto 3006) - Emails/SMS</li>
          <li><strong>Servicio de Asistencia</strong> (Puerto 3007) - Control de asistencia</li>
        </ul>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <i class="bi bi-shield-check"></i> Reglas de Negocio Implementadas
      </div>
      <div class="card-body">
        <ul>
          <li>✅ <strong>RN-001:</strong> Asignación única de aula por periodo</li>
          <li>✅ <strong>RN-002:</strong> Registro de notas en plazo</li>
          <li>✅ <strong>RN-003:</strong> Control diario de asistencia</li>
          <li>✅ <strong>RN-004:</strong> Restricción de matrícula por deuda</li>
          <li>✅ <strong>RN-005:</strong> Acceso restringido para padres</li>
          <li>✅ <strong>RN-006:</strong> Notificación automática de inasistencias</li>
          <li>✅ <strong>RN-007:</strong> Validación de datos obligatorios</li>
        </ul>
      </div>
    </div>
  `;
}

function mostrarAlumnos(content) {
  content.innerHTML = `
    <h2>👥 Gestión de Alumnos</h2>
    <div class="card">
      <div class="card-header">Lista de Alumnos</div>
      <div class="card-body">
        <p>Funcionalidad disponible a través de la API.</p>
        <p><code>GET /api/alumnos</code></p>
      </div>
    </div>
  `;
}

function mostrarMisCursos(content) {
  content.innerHTML = `
    <h2>📚 Mis Cursos</h2>
    <div class="card">
      <div class="card-header">Cursos Inscritos</div>
      <div class="card-body">
        <p>Cargando información de cursos...</p>
      </div>
    </div>
  `;
}

function mostrarMisNotas(content) {
  content.innerHTML = `
    <h2>📝 Mis Notas</h2>
    <div class="card">
      <div class="card-header">Calificaciones por Curso</div>
      <div class="card-body">
        <p>Cargando calificaciones...</p>
      </div>
    </div>
  `;
}

function mostrarMisPagos(content) {
  content.innerHTML = `
    <h2>💰 Mis Pagos</h2>
    <div class="card">
      <div class="card-header">Estado de Pagos</div>
      <div class="card-body">
        <p>Cargando estado de pagos...</p>
      </div>
    </div>
  `;
}

function mostrarAsistencia(content) {
  content.innerHTML = `
    <h2>✅ Asistencia</h2>
    <div class="card">
      <div class="card-header">Registro de Asistencia</div>
      <div class="card-body">
        <p>Cargando asistencia...</p>
      </div>
    </div>
  `;
}

function mostrarCursos(content) {
  content.innerHTML = `
    <h2>📚 Cursos</h2>
    <div class="card">
      <div class="card-header">Gestión de Cursos</div>
      <div class="card-body">
        <p>Cargando lista de cursos...</p>
      </div>
    </div>
  `;
}

function mostrarPagos(content) {
  content.innerHTML = `
    <h2>💰 Pagos</h2>
    <div class="card">
      <div class="card-header">Gestión de Pagos</div>
      <div class="card-body">
        <p>Cargando pagos...</p>
      </div>
    </div>
  `;
}

function mostrarMatriculas(content) {
  content.innerHTML = `
    <h2>📋 Matrículas</h2>
    <div class="card">
      <div class="card-header">Gestión de Matrículas</div>
      <div class="card-body">
        <p>Cargando matrículas...</p>
      </div>
    </div>
  `;
}
