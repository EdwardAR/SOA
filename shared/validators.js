// Validadores compartidos para el sistema SOA

const validadores = {
  // Validar email
  esEmailValido: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  // Validar contraseña fuerte
  esContraseñaFuerte: (password) => {
    // Mínimo 8 caracteres, mayúscula, minúscula, número
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  },

  // Validar número de documento (8 dígitos exactos para DNI)
  esDocumentoValido: (numero) => {
    return /^\d{8}$/.test(numero);
  },

  // Validar teléfono (9 dígitos, empieza con 9)
  esTelefonoValido: (telefono) => {
    return /^9\d{8}$/.test(telefono);
  },

  // Validar nombre (solo letras, espacios, tildes)
  esNombreValido: (nombre) => {
    return /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(nombre);
  },

  // Validar código alfanumérico
  esCodigoValido: (codigo) => {
    return /^[a-zA-Z0-9_-]+$/.test(codigo && codigo.trim());
  },

  // Validar UUID
  esUUIDValido: (uuid) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
  },

  // Validar fecha en formato YYYY-MM-DD
  esFechaValida: (fecha) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(fecha)) return false;
    return !isNaN(Date.parse(fecha));
  },

  // Validar rango de puntuación (0-20)
  esPuntuacionValida: (puntuacion) => {
    return puntuacion >= 0 && puntuacion <= 20;
  },

  // Validar monto monetario
  esMontValido: (monto) => {
    return !isNaN(monto) && monto > 0;
  },

  // Validar tipo de usuario
  esTipoUsuarioValido: (tipo) => {
    const tiposValidos = ['alumno', 'docente', 'administrativo', 'padre', 'director'];
    return tiposValidos.includes(tipo);
  },

  // Validar estado de asistencia
  esEstadoAsistenciaValido: (estado) => {
    const estadosValidos = ['PRESENTE', 'FALTA', 'JUSTIFICADO'];
    return estadosValidos.includes(estado);
  },

  // Validar estado de pago
  esEstadoPagoValido: (estado) => {
    const estadosValidos = ['pendiente', 'pagado', 'cancelado', 'rechazado'];
    return estadosValidos.includes(estado);
  }
};

// Función para validar objeto completo
const validarAlumno = (alumno) => {
  const errores = [];

  if (!alumno.apellido_paterno || alumno.apellido_paterno.trim() === '') {
    errores.push('Apellido paterno es requerido');
  } else if (!validadores.esNombreValido(alumno.apellido_paterno)) {
    errores.push('Apellido paterno no debe contener números');
  }

  if (!alumno.primer_nombre || alumno.primer_nombre.trim() === '') {
    errores.push('Primer nombre es requerido');
  } else if (!validadores.esNombreValido(alumno.primer_nombre)) {
    errores.push('Primer nombre no debe contener números');
  }

  if (!alumno.numero_documento) {
    errores.push('Número de documento es requerido');
  } else if (!validadores.esDocumentoValido(alumno.numero_documento)) {
    errores.push('Número de documento debe tener 8 dígitos');
  }

  if (alumno.telefono && !validadores.esTelefonoValido(alumno.telefono)) {
    errores.push('Teléfono debe tener 9 dígitos y empezar con 9');
  }

  if (alumno.email && !validadores.esEmailValido(alumno.email)) {
    errores.push('Email inválido');
  }

  return {
    valido: errores.length === 0,
    errores
  };
};

const validarProfesor = (profesor) => {
  const errores = [];

  if (!profesor.apellido_paterno || profesor.apellido_paterno.trim() === '') {
    errores.push('Apellido paterno es requerido');
  } else if (!validadores.esNombreValido(profesor.apellido_paterno)) {
    errores.push('Apellido paterno no debe contener números');
  }

  if (!profesor.primer_nombre || profesor.primer_nombre.trim() === '') {
    errores.push('Primer nombre es requerido');
  } else if (!validadores.esNombreValido(profesor.primer_nombre)) {
    errores.push('Primer nombre no debe contener números');
  }

  if (!profesor.numero_documento) {
    errores.push('Número de documento es requerido');
  } else if (!validadores.esDocumentoValido(profesor.numero_documento)) {
    errores.push('Número de documento debe tener 8 dígitos');
  }

  if (profesor.telefono && !validadores.esTelefonoValido(profesor.telefono)) {
    errores.push('Teléfono debe tener 9 dígitos y empezar con 9');
  }

  return {
    valido: errores.length === 0,
    errores
  };
};

const validarCurso = (curso) => {
  const errores = [];

  if (!curso.codigo || curso.codigo.trim() === '') {
    errores.push('Código de curso es requerido');
  }

  if (!curso.nombre || curso.nombre.trim() === '') {
    errores.push('Nombre del curso es requerido');
  }

  if (!curso.grado_nivel || curso.grado_nivel.trim() === '') {
    errores.push('Grado/Nivel es requerido');
  }

  if (!curso.profesor_id) {
    errores.push('Profesor es requerido');
  }

  if (!curso.periodo_academico || curso.periodo_academico.trim() === '') {
    errores.push('Período académico es requerido');
  }

  return {
    valido: errores.length === 0,
    errores
  };
};

const validarPago = (pago) => {
  const errores = [];

  if (!pago.alumno_id) {
    errores.push('Alumno es requerido');
  }

  if (!pago.monto || !validadores.esMontValido(pago.monto)) {
    errores.push('Monto inválido o no especificado');
  }

  if (!pago.concepto || pago.concepto.trim() === '') {
    errores.push('Concepto es requerido');
  }

  return {
    valido: errores.length === 0,
    errores
  };
};

module.exports = {
  validadores,
  validarAlumno,
  validarProfesor,
  validarCurso,
  validarPago
};
