export const validators = {
  esEmailValido: (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),

  esDocumentoValido: (numero: string) =>
    /^\d{8}$/.test(numero),

  esTelefonoValido: (telefono: string) =>
    /^9\d{8}$/.test(telefono),

  esNombreValido: (nombre: string) =>
    /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(nombre),

  esCodigoValido: (codigo: string) =>
    /^[a-zA-Z0-9_-]+$/.test(codigo?.trim()),

  esMontoValido: (monto: number) =>
    !isNaN(monto) && monto > 0,

  esPuntuacionValida: (puntuacion: number) =>
    puntuacion >= 0 && puntuacion <= 20,
};

export function validarAlumno(data: Record<string, any>): string[] {
  const errores: string[] = [];
  if (!data.apellido_paterno?.trim()) errores.push('Apellido paterno es requerido');
  else if (!validators.esNombreValido(data.apellido_paterno)) errores.push('Apellido paterno no debe contener números');
  if (!data.primer_nombre?.trim()) errores.push('Primer nombre es requerido');
  else if (!validators.esNombreValido(data.primer_nombre)) errores.push('Primer nombre no debe contener números');
  if (data.numero_documento && !validators.esDocumentoValido(data.numero_documento)) errores.push('Número de documento debe tener 8 dígitos');
  if (data.telefono && !validators.esTelefonoValido(data.telefono)) errores.push('Teléfono debe tener 9 dígitos y empezar con 9');
  return errores;
}

export function validarProfesor(data: Record<string, any>): string[] {
  const errores: string[] = [];
  if (!data.apellido_paterno?.trim()) errores.push('Apellido paterno es requerido');
  else if (!validators.esNombreValido(data.apellido_paterno)) errores.push('Apellido paterno no debe contener números');
  if (!data.primer_nombre?.trim()) errores.push('Primer nombre es requerido');
  else if (!validators.esNombreValido(data.primer_nombre)) errores.push('Primer nombre no debe contener números');
  if (!data.especialidad?.trim()) errores.push('Especialidad es requerida');
  if (data.numero_documento && !validators.esDocumentoValido(data.numero_documento)) errores.push('Número de documento debe tener 8 dígitos');
  if (data.telefono && !validators.esTelefonoValido(data.telefono)) errores.push('Teléfono debe tener 9 dígitos y empezar con 9');
  return errores;
}

export function validarCurso(data: Record<string, any>): string[] {
  const errores: string[] = [];
  if (!data.nombre?.trim()) errores.push('Nombre del curso es requerido');
  if (!data.codigo?.trim()) errores.push('Código del curso es requerido');
  else if (!validators.esCodigoValido(data.codigo)) errores.push('Código solo puede contener letras, números, guiones');
  if (!data.grado_nivel) errores.push('Grado/Nivel es requerido');
  if (!data.profesor_id) errores.push('Profesor es requerido');
  if (!data.periodo_academico?.trim()) errores.push('Período académico es requerido');
  return errores;
}

export function validarMatricula(data: Record<string, any>): string[] {
  const errores: string[] = [];
  if (!data.alumno_id) errores.push('Alumno es requerido');
  if (!data.curso_id) errores.push('Sección académica es requerida');
  if (!data.periodo_academico?.trim()) errores.push('Período académico es requerido');
  return errores;
}

export function validarPago(data: Record<string, any>): string[] {
  const errores: string[] = [];
  if (!data.alumno_id) errores.push('Alumno es requerido');
  if (!data.concepto?.trim()) errores.push('Concepto es requerido');
  if (!data.monto || data.monto <= 0) errores.push('Monto debe ser mayor a 0');
  return errores;
}
