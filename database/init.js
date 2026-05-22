require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcryptjs = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH || './database/colegio.db';
const dbDir = path.dirname(DB_PATH);

// Asegurar que el directorio existe
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
    process.exit(1);
  }
  console.log('✓ Conectado a SQLite:', DB_PATH);
});

db.serialize(() => {
  // Leer y ejecutar schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Dividir y ejecutar cada sentencia SQL
  const statements = schema.split(';').filter(stmt => stmt.trim());

  let completed = 0;
  const total = statements.length;

  statements.forEach((statement, index) => {
    db.run(statement + ';', (err) => {
      if (err && !err.message.includes('already exists')) {
        console.error(`Error en sentencia ${index + 1}:`, err);
      }
      completed++;
      if (completed === total) {
        console.log('✓ Schema de base de datos creado');
        // Ejecutar seed de datos
        setTimeout(() => {
          seedDatabase();
        }, 500);
      }
    });
  });
});

async function seedDatabase() {
  console.log('\n📊 Sembrando datos de prueba...\n');

  try {
    await resetSeedData();

    // Crear usuarios
    const directorId = uuidv4();
    const adminId = uuidv4();
    const profesor1Id = uuidv4();
    const profesor2Id = uuidv4();
    const alumno1Id = uuidv4();
    const alumno2Id = uuidv4();
    const padreId = uuidv4();

    // Hash de contraseña (password123)
    const hashedPassword = await bcryptjs.hash('password123', 10);

    // Insertar usuarios
    const usuarios = [
      {
        id: directorId,
        nombre: 'Dr. Carlos Martinez',
        email: 'director@colegio.com',
        password: hashedPassword,
        tipo_usuario: 'director'
      },
      {
        id: adminId,
        nombre: 'Ana Gomez',
        email: 'admin@colegio.com',
        password: hashedPassword,
        tipo_usuario: 'administrativo'
      },
      {
        id: profesor1Id,
        nombre: 'Juan Perez',
        email: 'juan@colegio.com',
        password: hashedPassword,
        tipo_usuario: 'docente'
      },
      {
        id: profesor2Id,
        nombre: 'Maria Rodriguez',
        email: 'maria@colegio.com',
        password: hashedPassword,
        tipo_usuario: 'docente'
      },
      {
        id: alumno1Id,
        nombre: 'Luis Sanchez',
        email: 'luis@estudiante.com',
        password: hashedPassword,
        tipo_usuario: 'alumno'
      },
      {
        id: alumno2Id,
        nombre: 'Sofia Torres',
        email: 'sofia@estudiante.com',
        password: hashedPassword,
        tipo_usuario: 'alumno'
      },
      {
        id: padreId,
        nombre: 'Roberto Sanchez',
        email: 'padre@colegio.com',
        password: hashedPassword,
        tipo_usuario: 'padre'
      }
    ];

    for (const user of usuarios) {
      await insertUser(user);
    }
    console.log('✓ Usuarios creados');

    // Insertar profesores
    const profesor1 = {
      id: uuidv4(),
      usuario_id: profesor1Id,
      numero_empleado: 'EMP-001',
      nombre: 'Juan Perez',
      apellido_paterno: 'Perez',
      primer_nombre: 'Juan',
      email: 'juan@colegio.com',
      telefono: '987654321',
      especialidad: 'Matemáticas'
    };

    const profesor2 = {
      id: uuidv4(),
      usuario_id: profesor2Id,
      numero_empleado: 'EMP-002',
      nombre: 'Maria Rodriguez',
      apellido_paterno: 'Rodriguez',
      primer_nombre: 'Maria',
      email: 'maria@colegio.com',
      telefono: '987654322',
      especialidad: 'Lenguaje'
    };

    await insertProfesor(profesor1);
    await insertProfesor(profesor2);
    console.log('✓ Profesores creados');

    // Insertar alumnos
    const alumnos = [
      {
        id: uuidv4(),
        usuario_id: alumno1Id,
        numero_matricula: 'MAT001',
        apellido_paterno: 'Sanchez',
        apellido_materno: '',
        primer_nombre: 'Luis',
        telefono: '999888777',
        email_contacto: 'luis@estudiante.com',
        numero_documento: '12345678',
        padre_id: padreId,
        datos_completos: true,
        deuda_pendiente: false,
        periodo_academico: '2026-1'
      },
      {
        id: uuidv4(),
        usuario_id: alumno2Id,
        numero_matricula: 'MAT002',
        apellido_paterno: 'Torres',
        apellido_materno: '',
        primer_nombre: 'Sofia',
        telefono: '999888776',
        email_contacto: 'sofia@estudiante.com',
        numero_documento: '87654321',
        datos_completos: true,
        deuda_pendiente: false,
        periodo_academico: '2026-1'
      }
    ];

    const alumnoIds = [];
    for (const alumno of alumnos) {
      await insertAlumno(alumno);
      alumnoIds.push(alumno.id);
    }
    console.log('✓ Alumnos creados');

    // Insertar cursos
    const curso1 = {
      id: uuidv4(),
      codigo: 'MAT-001',
      nombre: 'Matemáticas 4to A',
      grado: '4to',
      seccion: 'A',
      profesor_id: profesor1.id,
      salon: 'A-401',
      capacidad: 30,
      estado: 'activo'
    };

    const curso2 = {
      id: uuidv4(),
      codigo: 'LEN-001',
      nombre: 'Lenguaje 4to A',
      grado: '4to',
      seccion: 'A',
      profesor_id: profesor2.id,
      salon: 'A-402',
      capacidad: 30,
      estado: 'activo'
    };

    const curso3 = {
      id: uuidv4(),
      codigo: 'MAT-002',
      nombre: 'Matemáticas 5to A',
      grado: '5to',
      seccion: 'A',
      profesor_id: profesor1.id,
      salon: 'B-101',
      capacidad: 35,
      estado: 'activo'
    };

    const curso4 = {
      id: uuidv4(),
      codigo: 'FIS-001',
      nombre: 'Física 5to A',
      grado: '5to',
      seccion: 'A',
      profesor_id: profesor2.id,
      salon: 'B-102',
      capacidad: 35,
      estado: 'activo'
    };

    const curso5 = {
      id: uuidv4(),
      codigo: 'QUI-001',
      nombre: 'Química 5to B',
      grado: '5to',
      seccion: 'B',
      profesor_id: profesor1.id,
      salon: 'B-103',
      capacidad: 32,
      estado: 'activo'
    };

    const cursos = [curso1, curso2, curso3, curso4, curso5];
    for (const curso of cursos) {
      await insertCurso(curso);
    }
    console.log('✓ Cursos creados (5 cursos)');

    // Insertar matrículas
    const matricula1 = {
      id: uuidv4(),
      alumno_id: alumnoIds[0],
      curso_id: curso1.id,
      fecha_matricula: '2026-03-10',
      estado: 'activa',
      observaciones: 'Matrícula inicial'
    };

    const matricula2 = {
      id: uuidv4(),
      alumno_id: alumnoIds[1],
      curso_id: curso2.id,
      fecha_matricula: '2026-03-10',
      estado: 'activa',
      observaciones: 'Matrícula inicial'
    };

    const matricula3 = {
      id: uuidv4(),
      alumno_id: alumnoIds[0],
      curso_id: curso3.id,
      fecha_matricula: '2026-03-11',
      estado: 'activa',
      observaciones: 'Matrícula inicial'
    };

    const matricula4 = {
      id: uuidv4(),
      alumno_id: alumnoIds[1],
      curso_id: curso5.id,
      fecha_matricula: '2026-03-11',
      estado: 'activa',
      observaciones: 'Matrícula inicial'
    };

    const matriculas = [matricula1, matricula2, matricula3, matricula4];
    for (const matricula of matriculas) {
      await insertMatricula(matricula);
    }
    console.log('✓ Matrículas creadas (4 matrículas)');

    // Insertar pagos
    const pagos = [
      {
        id: uuidv4(),
        alumno_id: alumnoIds[0],
        monto: 350.00,
        concepto: 'Pensión Marzo 2024',
        periodo_academico: '2026-1',
        estado_pago: 'pagado',
        estado: 'pagado',
        fecha_pago: '2026-03-05 10:00:00',
        metodo_pago: 'transferencia'
      },
      {
        id: uuidv4(),
        alumno_id: alumnoIds[1],
        monto: 350.00,
        concepto: 'Pensión Marzo 2024',
        periodo_academico: '2026-1',
        estado_pago: 'pendiente',
        estado: 'pendiente',
        fecha_pago: null,
        metodo_pago: null
      },
      {
        id: uuidv4(),
        alumno_id: alumnoIds[1],
        monto: 200.00,
        concepto: 'Uniforme Escolar',
        periodo_academico: '2026-1',
        estado_pago: 'pendiente',
        estado: 'pendiente',
        fecha_pago: null,
        metodo_pago: null
      },
      {
        id: uuidv4(),
        alumno_id: alumnoIds[0],
        monto: 150.00,
        concepto: 'Carnet Estudiantil',
        periodo_academico: '2026-1',
        estado_pago: 'pagado',
        estado: 'pagado',
        fecha_pago: '2026-03-05 10:15:00',
        metodo_pago: 'efectivo'
      }
    ];

    for (const pago of pagos) {
      await insertPago(pago);
    }
    console.log('✓ Pagos creados (4 pagos)');

    // Insertar asistencias
    const asistencias = [
      {
        id: uuidv4(),
        alumno_id: alumnoIds[0],
        curso_id: curso1.id,
        fecha: '2026-05-20',
        estado: 'PRESENTE',
        registrada: true,
        motivo_falta: null
      },
      {
        id: uuidv4(),
        alumno_id: alumnoIds[1],
        curso_id: curso2.id,
        fecha: '2026-05-20',
        estado: 'FALTA',
        registrada: true,
        motivo_falta: 'Inasistencia sin justificación'
      }
    ];

    for (const asistencia of asistencias) {
      await insertAsistencia(asistencia);
    }
    console.log('✓ Asistencias creadas (2 registros)');

    // Insertar calificaciones
    const calificaciones = [
      {
        id: uuidv4(),
        alumno_id: alumnoIds[0],
        curso_id: curso1.id,
        nota: 18.5,
        periodo: '1',
        observaciones: 'Buen desempeño',
      },
      {
        id: uuidv4(),
        alumno_id: alumnoIds[1],
        curso_id: curso2.id,
        nota: 14.0,
        periodo: '1',
        observaciones: 'Necesita reforzar ejercicios prácticos',
      }
    ];

    for (const calificacion of calificaciones) {
      await insertCalificacion(calificacion);
    }
    console.log('✓ Calificaciones creadas (2 registros)');

    // Insertar notificaciones
    const notificaciones = [
      {
        id: uuidv4(),
        destinatario_id: directorId,
        tipo: 'alerta',
        mensaje: 'El sistema fue inicializado correctamente y ya tiene datos de prueba.',
        leida: true,
        fecha_lectura: '2026-05-20 08:00:00'
      },
      {
        id: uuidv4(),
        destinatario_id: padreId,
        tipo: 'recordatorio',
        mensaje: 'Se registró una falta para Luis Sánchez en Matemáticas.',
        leida: false,
        fecha_lectura: null
      }
    ];

    for (const notificacion of notificaciones) {
      await insertNotificacion(notificacion);
    }
    console.log('✓ Notificaciones creadas (2 registros)');

    console.log('\n✅ Base de datos inicializada correctamente\n');
    console.log('📊 Resumen de datos insertados:');
    console.log('   - 7 usuarios');
    console.log('   - 2 profesores');
    console.log('   - 2 alumnos');
    console.log('   - 5 cursos');
    console.log('   - 4 matrículas');
    console.log('   - 4 pagos');
    console.log('   - 2 asistencias');
    console.log('   - 2 calificaciones');
    console.log('   - 2 notificaciones\n');
    console.log('📝 Credenciales de prueba:');
    console.log('   Director: director@colegio.com / password123');
    console.log('   Admin: admin@colegio.com / password123');
    console.log('   Docente: juan@colegio.com / password123');
    console.log('   Alumno: luis@estudiante.com / password123');
    console.log('   Docente: juan@colegio.com / password123\n');

    process.exit(0);
  } catch (error) {
    console.error('Error al sembrar datos:', error);
    process.exit(1);
  }
}

function resetSeedData() {
  return new Promise((resolve, reject) => {
    db.exec(
      `PRAGMA foreign_keys = OFF;
       DELETE FROM logs_auditoria;
       DELETE FROM reportes_generados;
       DELETE FROM notificaciones;
       DELETE FROM calificaciones;
       DELETE FROM asistencias;
       DELETE FROM pagos;
       DELETE FROM matriculas;
       DELETE FROM cursos;
       DELETE FROM profesores;
       DELETE FROM alumnos;
       DELETE FROM usuarios;
       PRAGMA foreign_keys = ON;`,
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// Funciones auxiliares de inserción
function insertUser(user) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO usuarios (id, nombre, email, password, tipo_usuario)
       VALUES (?, ?, ?, ?, ?)`,
      [user.id, user.nombre, user.email, user.password, user.tipo_usuario],
      (err) => {
        if (err && !err.message.includes('UNIQUE constraint failed')) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

function insertProfesor(profesor) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO profesores (id, usuario_id, numero_empleado, nombre, apellido_paterno, primer_nombre, email, telefono, especialidad, numero_documento, estado, email_contacto, fecha_contratacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)`,
      [profesor.id, profesor.usuario_id, profesor.numero_empleado, profesor.nombre, profesor.apellido_paterno,
       profesor.primer_nombre, profesor.email, profesor.telefono, profesor.especialidad,
       profesor.numero_documento || null, profesor.estado || 'activo', profesor.email || null],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function insertAlumno(alumno) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO alumnos (id, usuario_id, numero_matricula, apellido_paterno, apellido_materno, primer_nombre,
       numero_documento, telefono, email_contacto, padre_id, datos_completos, deuda_pendiente, periodo_academico, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [alumno.id, alumno.usuario_id, alumno.numero_matricula, alumno.apellido_paterno,
       alumno.apellido_materno || null, alumno.primer_nombre, alumno.numero_documento,
       alumno.telefono || null, alumno.email_contacto || null, alumno.padre_id,
       alumno.datos_completos ? 1 : 0, alumno.deuda_pendiente ? 1 : 0,
       alumno.periodo_academico, 'activo'],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function insertCurso(curso) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO cursos (id, nombre, codigo, grado, seccion, capacidad, profesor_id, salon, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [curso.id, curso.nombre, curso.codigo, curso.grado, curso.seccion,
       curso.capacidad, curso.profesor_id, curso.salon, curso.estado || 'activo'],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function insertMatricula(matricula) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO matriculas (id, alumno_id, curso_id, fecha_matricula, estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [matricula.id, matricula.alumno_id, matricula.curso_id, matricula.fecha_matricula,
       matricula.estado || 'activa', matricula.observaciones || null],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function insertPago(pago) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO pagos (id, alumno_id, monto, concepto, estado_pago, estado, fecha_pago, metodo_pago, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pago.id, pago.alumno_id, pago.monto, pago.concepto, pago.estado_pago || pago.estado,
       pago.estado || pago.estado_pago, pago.fecha_pago || null, pago.metodo_pago || null,
       pago.observaciones || null],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function insertAsistencia(asistencia) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO asistencias (id, alumno_id, curso_id, fecha, estado, registrada, motivo_falta)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [asistencia.id, asistencia.alumno_id, asistencia.curso_id, asistencia.fecha,
       asistencia.estado, asistencia.registrada ? 1 : 0, asistencia.motivo_falta],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function insertCalificacion(calificacion) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO calificaciones (id, alumno_id, curso_id, nota, periodo, observaciones)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [calificacion.id, calificacion.alumno_id, calificacion.curso_id, calificacion.nota,
       calificacion.periodo, calificacion.observaciones || null],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function insertNotificacion(notificacion) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO notificaciones (id, destinatario_id, tipo, mensaje, leida, fecha_lectura)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [notificacion.id, notificacion.destinatario_id, notificacion.tipo, notificacion.mensaje,
       notificacion.leida ? 1 : 0, notificacion.fecha_lectura || null],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}
