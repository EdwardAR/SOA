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
// MODAL SYSTEM (Enhanced Notifications)
// ============================================

function mostrarModal(tipo, titulo, mensaje, botones = {}, callback = null) {
  // Crear overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';

  // Iconos por tipo
  const iconos = {
    confirm: 'bi-question-circle-fill',
    success: 'bi-check-circle-fill',
    error: 'bi-exclamation-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill'
  };

  const colores = {
    confirm: '#667eea',
    success: '#27ae60',
    error: '#e74c3c',
    warning: '#f39c12',
    info: '#16a085'
  };

  // Botones por defecto
  if (!botones || Object.keys(botones).length === 0) {
    botones = { 'Aceptar': 'success' };
  }

  // Crear modal
  const modal = document.createElement('div');
  modal.className = 'modal-dialog';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-icon" style="color: ${colores[tipo] || colores.info};">
        <i class="bi ${iconos[tipo]}"></i>
      </div>
      <h3 class="modal-title">${titulo}</h3>
      <p class="modal-message">${mensaje}</p>
      <div class="modal-buttons">
        ${Object.entries(botones).map(([texto, accion]) => `
          <button class="modal-btn modal-btn-${accion || 'primary'}" data-action="${texto}">
            ${texto}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Manejar clics en botones
  modal.querySelectorAll('.modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const accion = btn.dataset.action;
      overlay.remove();
      if (callback) callback(accion);
    });
  });

  // Cerrar al hacer clic en overlay
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      if (callback) callback(null);
    }
  });

  // Cerrar con ESC
  const cerrarModal = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', cerrarModal);
      if (callback) callback(null);
    }
  };
  document.addEventListener('keydown', cerrarModal);
}

// ============================================
// API WRAPPER (Con autenticación)
// ============================================

async function hacerFetch(url, opciones = {}) {
  const urlCompleta = url.startsWith('http') ? url : `${API_BASE}${url}`;

  // Agregar headers por defecto
  opciones.headers = opciones.headers || {};
  opciones.headers['Content-Type'] = 'application/json';

  // Agregar token de autenticación si existe
  if (state.token) {
    opciones.headers['Authorization'] = `Bearer ${state.token}`;
  }

  try {
    const response = await fetch(urlCompleta, opciones);
    const data = await response.json();

    // Si token expiró o no válido
    if (response.status === 401) {
      localStorage.clear();
      state.token = null;
      state.usuario = null;
      mostrarLogin();
      throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }

    // Si no tienes permiso
    if (response.status === 403) {
      throw new Error('No tienes permiso para realizar esta acción.');
    }

    if (!response.ok) {
      throw new Error(data.mensaje || `Error del servidor: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error en fetch:', error);
    mostrarAlerta('error', error.message);
    throw error;
  }
}

// ============================================
// UTILIDADES DE DATOS
// ============================================

function mostrarCarga(elemento) {
  elemento.innerHTML = `
    <div class="text-center">
      <div class="loading-spinner"></div>
      <p style="color: var(--gray); margin-top: 15px;">Cargando datos...</p>
    </div>
  `;
}

function crearTabla(encabezados, datos, acciones = null) {
  if (!datos || datos.length === 0) {
    return `
      <div class="empty-state">
        <i class="bi bi-inbox"></i>
        <p>No hay datos disponibles</p>
      </div>
    `;
  }

  let html = `<table class="data-table"><thead><tr>`;
  encabezados.forEach(enc => {
    html += `<th>${enc}</th>`;
  });
  if (acciones) html += `<th>Acciones</th>`;
  html += `</tr></thead><tbody>`;

  datos.forEach((fila, idx) => {
    html += `<tr>`;
    Object.values(fila).forEach(val => {
      html += `<td>${val || '-'}</td>`;
    });
    if (acciones) {
      html += `<td class="table-actions">`;
      acciones(fila, idx).forEach(accion => {
        html += accion;
      });
      html += `</td>`;
    }
    html += `</tr>`;
  });
  html += `</tbody></table>`;
  return html;
}

function crearBadge(estado) {
  const mapas = {
    'activo': { clase: 'badge-success', texto: 'Activo' },
    'inactivo': { clase: 'badge-danger', texto: 'Inactivo' },
    'pagado': { clase: 'badge-success', texto: 'Pagado' },
    'pendiente': { clase: 'badge-warning', texto: 'Pendiente' },
    'presente': { clase: 'badge-success', texto: 'Presente' },
    'ausente': { clase: 'badge-danger', texto: 'Ausente' },
    'justificado': { clase: 'badge-info', texto: 'Justificado' }
  };

  const config = mapas[estado?.toLowerCase()] || { clase: 'badge-gray', texto: estado };
  return `<span class="badge ${config.clase}">${config.texto}</span>`;
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
  mostrarModal(
    'confirm',
    '¿Cerrar sesión?',
    '¿Estás seguro de que deseas cerrar tu sesión?',
    { 'Cancelar': 'secondary', 'Cerrar Sesión': 'danger' },
    (accion) => {
      if (accion === 'Cerrar Sesión') {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        state.usuario = null;
        state.token = null;
        mostrarLogin();
      }
    }
  );
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

async function mostrarInicio(content) {
  mostrarCarga(content);

  try {
    const datos = await hacerFetch('/health');
    const stats = datos.datos || {};

    let statsHTML = '';
    const rol = state.usuario.tipo_usuario;

    if (rol === 'alumno') {
      statsHTML = `
        <div class="stat-card">
          <div class="stat-icon"><i class="bi bi-book-fill"></i></div>
          <div class="stat-number">${stats.servicios_activos || 7}</div>
          <div class="stat-label">Servicios Activos</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="bi bi-check-circle-fill"></i></div>
          <div class="stat-number">✅</div>
          <div class="stat-label">Sistema Operativo</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="bi bi-calendar-event"></i></div>
          <div class="stat-number">2026-1</div>
          <div class="stat-label">Período Actual</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="bi bi-cloud-check"></i></div>
          <div class="stat-number">∞</div>
          <div class="stat-label">Escalabilidad</div>
        </div>
      `;
    } else if (rol === 'docente') {
      statsHTML = `
        <div class="stat-card">
          <div class="stat-icon"><i class="bi bi-book-fill"></i></div>
          <div class="stat-number">${stats.mis_cursos || 0}</div>
          <div class="stat-label">Mis Cursos</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="bi bi-people-fill"></i></div>
          <div class="stat-number">${stats.total_estudiantes || 0}</div>
          <div class="stat-label">Total Estudiantes</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="bi bi-check-circle-fill"></i></div>
          <div class="stat-number">✅</div>
          <div class="stat-label">Sistema Operativo</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="bi bi-calendar-event"></i></div>
          <div class="stat-number">2026-1</div>
          <div class="stat-label">Período Actual</div>
        </div>
      `;
    } else {
      statsHTML = `
        <div class="stat-card">
          <div class="stat-icon"><i class="bi bi-people-fill"></i></div>
          <div class="stat-number">${stats.total_alumnos || 0}</div>
          <div class="stat-label">Total Alumnos</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="bi bi-book-half"></i></div>
          <div class="stat-number">${stats.cursos_activos || 0}</div>
          <div class="stat-label">Cursos Activos</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="bi bi-cash-coin"></i></div>
          <div class="stat-number">${stats.pagos_pendientes || 0}</div>
          <div class="stat-label">Pagos Pendientes</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="bi bi-calendar-event"></i></div>
          <div class="stat-number">2026-1</div>
          <div class="stat-label">Período Actual</div>
        </div>
      `;
    }

    content.innerHTML = `
      <div class="page-header">
        <h2><i class="bi bi-house-door-fill page-icon"></i> Bienvenido, <strong>${state.usuario.nombre}</strong></h2>
      </div>

      <div class="stats-grid">
        ${statsHTML}
      </div>

      <div class="card">
        <div class="card-header">
          <i class="bi bi-info-circle-fill"></i> Información del Sistema
        </div>
        <div class="card-body">
          <p><strong><i class="bi bi-gear-fill"></i> Nombre:</strong> Gestión Académica SOA</p>
          <p><strong><i class="bi bi-tag-fill"></i> Versión:</strong> 1.0.0</p>
          <p><strong><i class="bi bi-diagram-3-fill"></i> Arquitectura:</strong> Microservicios Distribuidos</p>
          <p><strong><i class="bi bi-server"></i> Tu Rol:</strong> <span class="badge badge-primary">${state.usuario.tipo_usuario.toUpperCase()}</span></p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <i class="bi bi-shield-check"></i> Servicios del Sistema
        </div>
        <div class="card-body">
          <ul>
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
    `;
  } catch (error) {
    content.innerHTML = `
      <div class="card">
        <div class="card-header" style="color: var(--danger);">
          <i class="bi bi-exclamation-circle"></i> Error al cargar datos
        </div>
        <div class="card-body">
          <p>${error.message}</p>
          <button class="btn-primary" onclick="cargarPagina('inicio', document.querySelector('.nav-link.active'))">
            Reintentar
          </button>
        </div>
      </div>
    `;
  }
}

async function mostrarAlumnos(content) {
  mostrarCarga(content);
  try {
    const res = await hacerFetch('/alumnos?pagina=1&limite=10');
    const alumnos = res.datos.alumnos || [];

    const tablaHTML = crearTabla(
      ['Matrícula', 'Nombre', 'Email', 'Deuda', 'Estado'],
      alumnos.map(a => ({
        matricula: a.numero_matricula,
        nombre: a.nombre,
        email: a.email,
        deuda: a.deuda_pendiente ? `S/. ${a.monto_deuda || '0.00'}` : 'Sin deuda',
        estado: crearBadge(a.estado || 'activo')
      })),
      (fila, idx) => [
        `<button class="btn-sm btn-info" onclick="editarAlumno('${alumnos[idx].id}')"><i class="bi bi-pencil"></i></button>`,
        `<button class="btn-sm btn-danger" onclick="eliminarAlumno('${alumnos[idx].id}')"><i class="bi bi-trash"></i></button>`
      ]
    );

    content.innerHTML = `
      <div class="page-header">
        <h2><i class="bi bi-people-fill page-icon"></i> Gestión de Alumnos</h2>
        <button class="btn-primary" onclick="mostrarFormularioAlumno(null)">
          <i class="bi bi-plus-circle"></i> Nuevo Alumno
        </button>
      </div>
      <div class="card">
        <div class="card-header"><i class="bi bi-list-check"></i> Lista de Alumnos</div>
        <div class="card-body">
          ${tablaHTML}
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `
      <div class="card">
        <div class="card-header" style="color: var(--danger);">
          <i class="bi bi-exclamation-circle"></i> Error al cargar alumnos
        </div>
        <div class="card-body">${error.message}</div>
      </div>
    `;
  }
}

async function mostrarMisCursos(content) {
  mostrarCarga(content);
  try {
    let res;
    if (state.usuario.tipo_usuario === 'alumno') {
      res = await hacerFetch(`/matriculas-alumno/${state.usuario.id}`);
    } else {
      res = await hacerFetch(`/profesores/${state.usuario.id}/cursos`);
    }

    const cursos = res.datos || [];
    const tablaHTML = crearTabla(
      ['Curso', 'Código', 'Profesor', 'Período', 'Estado'],
      cursos.map(c => ({
        curso: c.nombre || c.nombre_curso,
        codigo: c.codigo || 'N/A',
        profesor: c.profesor || 'N/A',
        periodo: c.periodo || '2026-1',
        estado: crearBadge(c.estado || 'activo')
      })),
      () => [`<button class="btn-sm btn-info"><i class="bi bi-eye"></i></button>`]
    );

    content.innerHTML = `
      <div class="page-header">
        <h2><i class="bi bi-book-fill page-icon"></i> Mis Cursos</h2>
      </div>
      <div class="card">
        <div class="card-header"><i class="bi bi-mortarboard-fill"></i> Cursos Inscritos</div>
        <div class="card-body">
          ${tablaHTML}
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `
      <div class="card">
        <div class="card-body">
          <p><i class="bi bi-hourglass-split"></i> No hay cursos disponibles</p>
        </div>
      </div>
    `;
  }
}

async function mostrarMisNotas(content) {
  mostrarCarga(content);
  content.innerHTML = `
    <div class="page-header">
      <h2><i class="bi bi-pencil-square page-icon"></i> Mis Notas</h2>
    </div>
    <div class="card">
      <div class="card-header"><i class="bi bi-file-text-fill"></i> Calificaciones por Curso</div>
      <div class="card-body">
        <p><i class="bi bi-info-circle"></i> Módulo de calificaciones en desarrollo</p>
      </div>
    </div>
  `;
}

async function mostrarMisPagos(content) {
  mostrarCarga(content);
  try {
    const res = await hacerFetch(`/pagos-alumno/${state.usuario.id}`);
    const pagos = res.datos.pagos || [];
    const deuda = res.datos.deuda_total || 0;

    const tablaHTML = crearTabla(
      ['Concepto', 'Monto', 'Fecha', 'Estado'],
      pagos.map(p => ({
        concepto: p.concepto,
        monto: `S/. ${p.monto}`,
        fecha: new Date(p.fecha).toLocaleDateString('es-PE'),
        estado: crearBadge(p.estado || 'pendiente')
      })),
      () => [`<button class="btn-sm btn-success"><i class="bi bi-credit-card"></i></button>`]
    );

    content.innerHTML = `
      <div class="page-header">
        <h2><i class="bi bi-credit-card page-icon"></i> Mis Pagos</h2>
      </div>
      <div class="card">
        <div class="card-header"><i class="bi bi-wallet2-fill"></i> Estado de Pagos</div>
        <div class="card-body">
          <p><strong>Deuda Total:</strong> <span style="color: var(--danger); font-size: 1.2em;">S/. ${deuda}</span></p>
          ${tablaHTML}
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `
      <div class="card">
        <div class="card-body">
          <p><i class="bi bi-hourglass-split"></i> Cargando pagos...</p>
        </div>
      </div>
    `;
  }
}

async function mostrarAsistencia(content) {
  mostrarCarga(content);
  try {
    let res;
    if (state.usuario.tipo_usuario === 'alumno') {
      res = await hacerFetch(`/asistencia-alumno/${state.usuario.id}`);
    } else {
      res = await hacerFetch(`/asistencia?pagina=1&limite=20`);
    }

    const asistencias = res.datos || [];
    const tablaHTML = crearTabla(
      ['Fecha', 'Materia', 'Estado', 'Observaciones'],
      asistencias.map(a => ({
        fecha: new Date(a.fecha).toLocaleDateString('es-PE'),
        materia: a.materia || 'N/A',
        estado: crearBadge(a.estado || 'presente'),
        obs: a.observaciones || '-'
      })),
      () => []
    );

    content.innerHTML = `
      <div class="page-header">
        <h2><i class="bi bi-check-circle-fill page-icon"></i> Asistencia</h2>
      </div>
      <div class="card">
        <div class="card-header"><i class="bi bi-calendar2-check"></i> Registro de Asistencia</div>
        <div class="card-body">
          ${tablaHTML}
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `
      <div class="card">
        <div class="card-body">
          <p><i class="bi bi-hourglass-split"></i> Cargando asistencia...</p>
        </div>
      </div>
    `;
  }
}

async function mostrarCursos(content) {
  mostrarCarga(content);
  try {
    const res = await hacerFetch('/cursos?pagina=1&limite=10');
    const cursos = res.datos.cursos || [];

    const tablaHTML = crearTabla(
      ['Nombre', 'Código', 'Profesor', 'Estudiantes', 'Período'],
      cursos.map(c => ({
        nombre: c.nombre,
        codigo: c.codigo,
        profesor: c.profesor_nombre || 'N/A',
        estudiantes: c.total_estudiantes || 0,
        periodo: c.periodo_academico || '2026-1'
      })),
      (fila, idx) => [
        `<button class="btn-sm btn-info"><i class="bi bi-eye"></i></button>`,
        `<button class="btn-sm btn-warning"><i class="bi bi-pencil"></i></button>`,
        `<button class="btn-sm btn-danger"><i class="bi bi-trash"></i></button>`
      ]
    );

    content.innerHTML = `
      <div class="page-header">
        <h2><i class="bi bi-book-half page-icon"></i> Cursos</h2>
        <button class="btn-primary"><i class="bi bi-plus-circle"></i> Nuevo Curso</button>
      </div>
      <div class="card">
        <div class="card-header"><i class="bi bi-collection-fill"></i> Gestión de Cursos</div>
        <div class="card-body">
          ${tablaHTML}
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `
      <div class="card">
        <div class="card-body">
          <p><i class="bi bi-hourglass-split"></i> Cargando cursos...</p>
        </div>
      </div>
    `;
  }
}

async function mostrarPagos(content) {
  mostrarCarga(content);
  try {
    const res = await hacerFetch('/pagos?pagina=1&limite=10');
    const pagos = res.datos.pagos || [];

    const tablaHTML = crearTabla(
      ['Alumno', 'Concepto', 'Monto', 'Fecha', 'Estado'],
      pagos.map(p => ({
        alumno: p.nombre_alumno || 'N/A',
        concepto: p.concepto,
        monto: `S/. ${p.monto}`,
        fecha: new Date(p.fecha).toLocaleDateString('es-PE'),
        estado: crearBadge(p.estado || 'pendiente')
      })),
      (fila, idx) => [
        `<button class="btn-sm btn-success" onclick="procesarPago('${pagos[idx].id}')"><i class="bi bi-check"></i></button>`,
        `<button class="btn-sm btn-danger"><i class="bi bi-trash"></i></button>`
      ]
    );

    content.innerHTML = `
      <div class="page-header">
        <h2><i class="bi bi-currency-dollar page-icon"></i> Pagos</h2>
      </div>
      <div class="card">
        <div class="card-header"><i class="bi bi-cash-coin"></i> Gestión de Pagos</div>
        <div class="card-body">
          ${tablaHTML}
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `
      <div class="card">
        <div class="card-body">
          <p><i class="bi bi-hourglass-split"></i> Cargando pagos...</p>
        </div>
      </div>
    `;
  }
}

async function mostrarMatriculas(content) {
  mostrarCarga(content);
  try {
    const res = await hacerFetch('/matriculas?pagina=1&limite=10');
    const matriculas = res.datos.matriculas || [];

    const tablaHTML = crearTabla(
      ['Alumno', 'Curso', 'Período', 'Fecha', 'Estado'],
      matriculas.map(m => ({
        alumno: m.nombre_alumno || m.alumno_nombre || 'N/A',
        curso: m.nombre_curso || m.curso_nombre || 'N/A',
        periodo: m.periodo_academico || '2026-1',
        fecha: new Date(m.fecha_matricula).toLocaleDateString('es-PE'),
        estado: crearBadge(m.estado || 'activo')
      })),
      (fila, idx) => [
        `<button class="btn-sm btn-info"><i class="bi bi-eye"></i></button>`,
        `<button class="btn-sm btn-danger"><i class="bi bi-trash"></i></button>`
      ]
    );

    content.innerHTML = `
      <div class="page-header">
        <h2><i class="bi bi-list-check page-icon"></i> Matrículas</h2>
        <button class="btn-primary"><i class="bi bi-plus-circle"></i> Nueva Matrícula</button>
      </div>
      <div class="card">
        <div class="card-header"><i class="bi bi-clipboard-check-fill"></i> Gestión de Matrículas</div>
        <div class="card-body">
          ${tablaHTML}
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `
      <div class="card">
        <div class="card-body">
          <p><i class="bi bi-hourglass-split"></i> Cargando matrículas...</p>
        </div>
      </div>
    `;
  }
}

// ============================================
// FUNCIONES AUXILIARES (CRUD)
// ============================================

function mostrarFormularioAlumno(alumnoId) {
  const modal = document.createElement('div');
  modal.className = 'form-modal';
  modal.innerHTML = `
    <div class="form-modal-overlay" onclick="this.parentElement.remove()"></div>
    <div class="form-modal-content">
      <h3>Nuevo Alumno</h3>
      <form onsubmit="guardarAlumno(event)">
        <div class="form-group">
          <label>Nombre</label>
          <input type="text" name="nombre" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="email" required>
        </div>
        <div class="form-group">
          <label>Documento</label>
          <input type="text" name="numero_documento" required>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">Guardar</button>
          <button type="button" class="btn-secondary" onclick="this.closest('.form-modal').remove()">Cancelar</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
}

async function guardarAlumno(event) {
  event.preventDefault();
  const form = event.target;
  const datos = new FormData(form);

  try {
    await hacerFetch('/alumnos', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(datos))
    });
    mostrarAlerta('success', 'Alumno guardado exitosamente');
    form.closest('.form-modal').remove();
    cargarPagina('alumnos', document.querySelector('.nav-link'));
  } catch (error) {
    mostrarAlerta('error', error.message);
  }
}

async function editarAlumno(alumnoId) {
  try {
    const res = await hacerFetch(`/alumnos/${alumnoId}`);
    const alumno = res.datos;
    mostrarFormularioAlumno(alumno);
  } catch (error) {
    mostrarAlerta('error', 'No se pudo cargar el alumno');
  }
}

async function eliminarAlumno(alumnoId) {
  mostrarModal(
    'warning',
    'Eliminar Alumno',
    '¿Estás seguro de que deseas eliminar este alumno?',
    { 'Cancelar': 'secondary', 'Eliminar': 'danger' },
    async (accion) => {
      if (accion === 'Eliminar') {
        try {
          await hacerFetch(`/alumnos/${alumnoId}`, { method: 'DELETE' });
          mostrarAlerta('success', 'Alumno eliminado');
          cargarPagina('alumnos', document.querySelector('.nav-link'));
        } catch (error) {
          mostrarAlerta('error', error.message);
        }
      }
    }
  );
}

async function procesarPago(pagoId) {
  mostrarModal(
    'confirm',
    'Procesar Pago',
    '¿Marcar este pago como procesado?',
    { 'Cancelar': 'secondary', 'Procesar': 'success' },
    async (accion) => {
      if (accion === 'Procesar') {
        try {
          await hacerFetch(`/pagos/${pagoId}/procesar`, { method: 'PUT' });
          mostrarAlerta('success', 'Pago procesado');
          cargarPagina('pagos', document.querySelector('.nav-link'));
        } catch (error) {
          mostrarAlerta('error', error.message);
        }
      }
    }
  );
}
