// API Base URL
const API_BASE = 'http://localhost:3000/api';

// Estado global
const state = {
  usuario: null,
  token: null,
  paginaActual: 'login'
};

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    state.token = token;
    state.usuario = JSON.parse(localStorage.getItem('usuario'));
    mostrarDashboard();
  } else {
    mostrarLogin();
  }
});

// ============================================
// PÁGINAS
// ============================================

function mostrarLogin() {
  state.paginaActual = 'login';
  document.getElementById('app').innerHTML = `
    <div class="login-container">
      <div class="login-header">
        <h1>🎓 Colegio Futuro Digital</h1>
        <p>Sistema de Gestión Académica SOA</p>
      </div>

      <div class="error-message" id="loginError"></div>

      <form onsubmit="handleLogin(event)">
        <input type="email" id="email" placeholder="Email" class="form-control" required>
        <input type="password" id="password" placeholder="Contraseña" class="form-control" required>
        <button type="submit" class="btn btn-primary">Ingresar</button>
      </form>

      <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #7f8c8d;">
        <p><strong>Credenciales de prueba:</strong></p>
        <p>📧 director@colegio.com</p>
        <p>👨‍🎓 luis@estudiante.com</p>
        <p>👨‍🏫 juan@colegio.com</p>
        <p><em>Contraseña: password123</em></p>
      </div>
    </div>
  `;
}

function mostrarDashboard() {
  state.paginaActual = 'dashboard';
  document.getElementById('app').innerHTML = `
    <div style="display: flex; height: 100vh;">
      <div class="sidebar" style="width: 250px; flex-shrink: 0;">
        <div class="sidebar-header">
          <h3>Menú</h3>
          <p>${state.usuario.nombre}</p>
        </div>

        <div class="nav-item">
          <div class="nav-link active" onclick="cargarPagina('inicio')">📊 Inicio</div>
        </div>

        ${state.usuario.tipo_usuario === 'alumno' ? `
        <div class="nav-item">
          <div class="nav-link" onclick="cargarPagina('mis-cursos')">📚 Mis Cursos</div>
        </div>
        <div class="nav-item">
          <div class="nav-link" onclick="cargarPagina('mis-notas')">📝 Mis Notas</div>
        </div>
        <div class="nav-item">
          <div class="nav-link" onclick="cargarPagina('mis-pagos')">💰 Mis Pagos</div>
        </div>
        <div class="nav-item">
          <div class="nav-link" onclick="cargarPagina('asistencia')">✅ Asistencia</div>
        </div>
        ` : ''}

        ${state.usuario.tipo_usuario === 'docente' ? `
        <div class="nav-item">
          <div class="nav-link" onclick="cargarPagina('mis-cursos')">📚 Mis Cursos</div>
        </div>
        <div class="nav-item">
          <div class="nav-link" onclick="cargarPagina('calificaciones')">📝 Calificaciones</div>
        </div>
        <div class="nav-item">
          <div class="nav-link" onclick="cargarPagina('asistencia')">✅ Asistencia</div>
        </div>
        ` : ''}

        ${(state.usuario.tipo_usuario === 'administrativo' || state.usuario.tipo_usuario === 'director') ? `
        <div class="nav-item">
          <div class="nav-link" onclick="cargarPagina('alumnos')">👥 Alumnos</div>
        </div>
        <div class="nav-item">
          <div class="nav-link" onclick="cargarPagina('cursos')">📚 Cursos</div>
        </div>
        <div class="nav-item">
          <div class="nav-link" onclick="cargarPagina('pagos')">💰 Pagos</div>
        </div>
        <div class="nav-item">
          <div class="nav-link" onclick="cargarPagina('matriculas')">📋 Matrículas</div>
        </div>
        ` : ''}

        <div class="nav-item" style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          <button class="btn btn-logout" onclick="handleLogout()">Cerrar Sesión</button>
        </div>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column;">
        <div class="topbar">
          <div class="topbar-title">Sistema de Gestión Académica</div>
          <div>
            <span style="margin-right: 20px; color: #7f8c8d;">Rol: <strong>${state.usuario.tipo_usuario}</strong></span>
          </div>
        </div>

        <div class="content" id="content" style="flex: 1; overflow-y: auto;">
          <div class="loading">
            <div class="spinner"></div>
            <p>Cargando...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  cargarPagina('inicio');
}

// ============================================
// MANEJADORES DE EVENTOS
// ============================================

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('loginError');

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.datos) {
      state.token = data.datos.token;
      state.usuario = data.datos.usuario;

      localStorage.setItem('token', state.token);
      localStorage.setItem('usuario', JSON.stringify(state.usuario));

      mostrarDashboard();
    } else {
      errorDiv.textContent = data.mensaje || 'Error al iniciar sesión';
      errorDiv.classList.add('show');
    }
  } catch (error) {
    errorDiv.textContent = 'Error de conexión: ' + error.message;
    errorDiv.classList.add('show');
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  state.usuario = null;
  state.token = null;
  mostrarLogin();
}

function cargarPagina(pagina) {
  // Actualizar navegación
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  event.target.classList.add('active');

  // Cargar contenido
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
    <h2>Bienvenido, ${state.usuario.nombre}</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">7</div>
        <div class="stat-label">Servicios Activos</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">100%</div>
        <div class="stat-label">Sistema Operativo</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">2024-1</div>
        <div class="stat-label">Período Académico</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        📋 Información del Sistema
      </div>
      <div class="card-body">
        <p><strong>Sistema:</strong> Gestión Académica SOA</p>
        <p><strong>Versión:</strong> 1.0.0</p>
        <p><strong>Arquitectura:</strong> Microservicios</p>
        <p><strong>Servicios:</strong></p>
        <ul>
          <li>✅ API Gateway (Puerto 3000)</li>
          <li>✅ Servicio de Alumnos (Puerto 3001)</li>
          <li>✅ Servicio de Matrículas (Puerto 3002)</li>
          <li>✅ Servicio de Profesores (Puerto 3003)</li>
          <li>✅ Servicio de Cursos (Puerto 3004)</li>
          <li>✅ Servicio de Pagos (Puerto 3005)</li>
          <li>✅ Servicio de Notificaciones (Puerto 3006)</li>
          <li>✅ Servicio de Asistencia (Puerto 3007)</li>
        </ul>
      </div>
    </div>
  `;
}

function mostrarAlumnos(content) {
  content.innerHTML = `
    <h2>Gestión de Alumnos</h2>
    <div class="card">
      <div class="card-header">
        👥 Lista de Alumnos
      </div>
      <div class="card-body">
        <p>Funcionalidad para gestionar alumnos disponible con API.</p>
        <p><small>Endpoint: GET /api/alumnos</small></p>
      </div>
    </div>
  `;
}

function mostrarMisCursos(content) {
  content.innerHTML = `
    <h2>Mis Cursos</h2>
    <div class="card">
      <div class="card-header">
        📚 Cursos Inscritos
      </div>
      <div class="card-body">
        <p>Viendo cursos disponibles...</p>
        <p><small>Endpoint: GET /api/matriculas</small></p>
      </div>
    </div>
  `;
}

function mostrarMisNotas(content) {
  content.innerHTML = `
    <h2>Mis Notas</h2>
    <div class="card">
      <div class="card-header">
        📝 Calificaciones
      </div>
      <div class="card-body">
        <p>Viendo calificaciones...</p>
      </div>
    </div>
  `;
}

function mostrarMisPagos(content) {
  content.innerHTML = `
    <h2>Mis Pagos</h2>
    <div class="card">
      <div class="card-header">
        💰 Estado de Pagos
      </div>
      <div class="card-body">
        <p>Viendo estado de pagos...</p>
      </div>
    </div>
  `;
}

function mostrarAsistencia(content) {
  content.innerHTML = `
    <h2>Asistencia</h2>
    <div class="card">
      <div class="card-header">
        ✅ Registro de Asistencia
      </div>
      <div class="card-body">
        <p>Viendo asistencia...</p>
      </div>
    </div>
  `;
}

function mostrarCursos(content) {
  content.innerHTML = `
    <h2>Gestión de Cursos</h2>
    <div class="card">
      <div class="card-header">
        📚 Cursos Disponibles
      </div>
      <div class="card-body">
        <p>Viendo cursos...</p>
      </div>
    </div>
  `;
}

function mostrarPagos(content) {
  content.innerHTML = `
    <h2>Gestión de Pagos</h2>
    <div class="card">
      <div class="card-header">
        💰 Pagos Registrados
      </div>
      <div class="card-body">
        <p>Viendo pagos...</p>
      </div>
    </div>
  `;
}

function mostrarMatriculas(content) {
  content.innerHTML = `
    <h2>Gestión de Matrículas</h2>
    <div class="card">
      <div class="card-header">
        📋 Matrículas
      </div>
      <div class="card-body">
        <p>Viendo matrículas...</p>
      </div>
    </div>
  `;
}

// Helper function para llamadas API autenticadas
async function fetchAPI(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${state.token}`,
    ...options.headers
  };

  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });
}
