require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcryptjs = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH || './database/colegio.db';
const dbDir = path.dirname(DB_PATH);
const shouldResetDb = process.env.RESET_DB === 'true';

if (fs.existsSync(DB_PATH) && !shouldResetDb) {
  console.log('✓ Base de datos existente preservada:', DB_PATH);
  process.exit(0);
}

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
      const isIndexStatement = /CREATE\s+INDEX/i.test(statement);
      if (err && !err.message.includes('already exists') && !isIndexStatement) {
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
    await ensureMatriculasPeriodoAcademicoColumn();

    // Crear usuarios
    const directorId = uuidv4();
    const adminId = uuidv4();
    const profesor1Id = uuidv4();
    const profesor2Id = uuidv4();
    const profesor3Id = uuidv4();
    const profesor4Id = uuidv4();
    const profesor5Id = uuidv4();
    const profesor6Id = uuidv4();
    const alumno1Id = uuidv4();
    const alumno2Id = uuidv4();
    const padreId = uuidv4();

    // Hash de contraseña (password123)
    const hashedPassword = await bcryptjs.hash('password123', 10);

    // Insertar usuarios
    const usuarios = [
      {
        id: directorId,
        nombre: 'Dr. Luis Fernando Herrera',
        email: 'luis.herrera@colegiofuturo.edu',
        password: hashedPassword,
        tipo_usuario: 'director'
      },
      {
        id: adminId,
        nombre: 'Lic. Andrea Montalvo',
        email: 'andrea.montalvo@colegiofuturo.edu',
        password: hashedPassword,
        tipo_usuario: 'administrativo'
      },
      {
        id: profesor1Id,
        nombre: 'Prof. Juan Carlos Paredes',
        email: 'juan.paredes@colegiofuturo.edu',
        password: hashedPassword,
        tipo_usuario: 'docente'
      },
      {
        id: profesor2Id,
        nombre: 'Prof. María Elena Ríos',
        email: 'maria.rios@colegiofuturo.edu',
        password: hashedPassword,
        tipo_usuario: 'docente'
      },
      {
        id: profesor3Id,
        nombre: 'Prof. Carlos Alberto Mejía',
        email: 'carlos.mejia@colegiofuturo.edu',
        password: hashedPassword,
        tipo_usuario: 'docente'
      },
      {
        id: profesor4Id,
        nombre: 'Prof. Rosa Elena Salazar',
        email: 'rosa.salazar@colegiofuturo.edu',
        password: hashedPassword,
        tipo_usuario: 'docente'
      },
      {
        id: profesor5Id,
        nombre: 'Prof. Fernando Díaz',
        email: 'fernando.diaz@colegiofuturo.edu',
        password: hashedPassword,
        tipo_usuario: 'docente'
      },
      {
        id: profesor6Id,
        nombre: 'Prof. Patricia Gómez',
        email: 'patricia.gomez@colegiofuturo.edu',
        password: hashedPassword,
        tipo_usuario: 'docente'
      },
      {
        id: alumno1Id,
        nombre: 'Valeria Sánchez',
        email: 'valeria.sanchez@colegiofuturo.edu',
        password: hashedPassword,
        tipo_usuario: 'alumno'
      },
      {
        id: alumno2Id,
        nombre: 'Diego Torres',
        email: 'diego.torres@colegiofuturo.edu',
        password: hashedPassword,
        tipo_usuario: 'alumno'
      },
      {
        id: padreId,
        nombre: 'Patricia Sánchez',
        email: 'patricia.sanchez@colegiofuturo.edu',
        password: hashedPassword,
        tipo_usuario: 'padre'
      }
    ];

    for (const user of usuarios) {
      await insertUser(user);
    }
    console.log('✓ Usuarios creados');

    // Insertar profesores
    const profesores = [
      {
        id: uuidv4(),
        usuario_id: profesor1Id,
        numero_empleado: 'EMP-2041',
        nombre: 'Juan Carlos Paredes',
        apellido_paterno: 'Paredes',
        primer_nombre: 'Juan Carlos',
        email: 'juan.paredes@colegiofuturo.edu',
        telefono: '987654321',
        especialidad: 'Tutoría y Matemática'
      },
      {
        id: uuidv4(),
        usuario_id: profesor2Id,
        numero_empleado: 'EMP-2042',
        nombre: 'María Elena Ríos',
        apellido_paterno: 'Ríos',
        primer_nombre: 'María Elena',
        email: 'maria.rios@colegiofuturo.edu',
        telefono: '987654322',
        especialidad: 'Comunicación'
      },
      {
        id: uuidv4(),
        usuario_id: profesor3Id,
        numero_empleado: 'EMP-2043',
        nombre: 'Carlos Alberto Mejía',
        apellido_paterno: 'Mejía',
        primer_nombre: 'Carlos Alberto',
        email: 'carlos.mejia@colegiofuturo.edu',
        telefono: '987654323',
        especialidad: 'Ciencias'
      },
      {
        id: uuidv4(),
        usuario_id: profesor4Id,
        numero_empleado: 'EMP-2044',
        nombre: 'Rosa Elena Salazar',
        apellido_paterno: 'Salazar',
        primer_nombre: 'Rosa Elena',
        email: 'rosa.salazar@colegiofuturo.edu',
        telefono: '987654324',
        especialidad: 'Historia'
      },
      {
        id: uuidv4(),
        usuario_id: profesor5Id,
        numero_empleado: 'EMP-2045',
        nombre: 'Fernando Díaz',
        apellido_paterno: 'Díaz',
        primer_nombre: 'Fernando',
        email: 'fernando.diaz@colegiofuturo.edu',
        telefono: '987654325',
        especialidad: 'Arte'
      },
      {
        id: uuidv4(),
        usuario_id: profesor6Id,
        numero_empleado: 'EMP-2046',
        nombre: 'Patricia Gómez',
        apellido_paterno: 'Gómez',
        primer_nombre: 'Patricia',
        email: 'patricia.gomez@colegiofuturo.edu',
        telefono: '987654326',
        especialidad: 'Educación Física'
      }
    ];

    for (const profesor of profesores) {
      await insertProfesor(profesor);
    }
    console.log('✓ Profesores creados (6 profesores)');

    // Insertar alumnos
    const alumnos = [
      {
        id: uuidv4(),
        usuario_id: alumno1Id,
        numero_matricula: 'MAT-2026-001',
        apellido_paterno: 'Sánchez',
        apellido_materno: '',
        primer_nombre: 'Valeria',
        telefono: '999888777',
        email_contacto: 'valeria.sanchez@colegiofuturo.edu',
        numero_documento: '41234567',
        padre_id: padreId,
        datos_completos: true,
        deuda_pendiente: false,
        periodo_academico: '2026-1'
      },
      {
        id: uuidv4(),
        usuario_id: alumno2Id,
        numero_matricula: 'MAT-2026-002',
        apellido_paterno: 'Torres',
        apellido_materno: '',
        primer_nombre: 'Diego',
        telefono: '999888776',
        email_contacto: 'diego.torres@colegiofuturo.edu',
        numero_documento: '50987654',
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
    const cursos = [
      {
        id: uuidv4(),
        codigo: 'SEC-1A',
        nombre: profesores[0].especialidad,
        grado: '1ro',
        seccion: 'A',
        profesor_id: profesores[0].id,
        salon: 'A-101',
        capacidad: 32,
        estado: 'activo'
      },
      {
        id: uuidv4(),
        codigo: 'SEC-2A',
        nombre: profesores[1].especialidad,
        grado: '2do',
        seccion: 'A',
        profesor_id: profesores[1].id,
        salon: 'A-102',
        capacidad: 32,
        estado: 'activo'
      },
      {
        id: uuidv4(),
        codigo: 'SEC-3A',
        nombre: profesores[2].especialidad,
        grado: '3ro',
        seccion: 'A',
        profesor_id: profesores[2].id,
        salon: 'B-101',
        capacidad: 34,
        estado: 'activo'
      },
      {
        id: uuidv4(),
        codigo: 'SEC-4A',
        nombre: profesores[3].especialidad,
        grado: '4to',
        seccion: 'A',
        profesor_id: profesores[3].id,
        salon: 'B-102',
        capacidad: 34,
        estado: 'activo'
      },
      {
        id: uuidv4(),
        codigo: 'SEC-5A',
        nombre: profesores[4].especialidad,
        grado: '5to',
        seccion: 'A',
        profesor_id: profesores[4].id,
        salon: 'C-201',
        capacidad: 30,
        estado: 'activo'
      },
      {
        id: uuidv4(),
        codigo: 'SEC-5B',
        nombre: profesores[5].especialidad,
        grado: '5to',
        seccion: 'B',
        profesor_id: profesores[5].id,
        salon: 'C-202',
        capacidad: 30,
        estado: 'activo'
      }
    ];

    for (const curso of cursos) {
      await insertCurso(curso);
    }
    console.log('✓ Cursos creados (6 cursos)');

    // Insertar matrículas
    const matricula1 = {
      id: uuidv4(),
      alumno_id: alumnoIds[0],
      curso_id: cursos[0].id,
      periodo_academico: '2026-1',
      fecha_matricula: '2026-03-10',
      estado: 'activa',
      observaciones: 'Matrícula inicial'
    };

    const matricula2 = {
      id: uuidv4(),
      alumno_id: alumnoIds[1],
      curso_id: cursos[1].id,
      periodo_academico: '2026-1',
      fecha_matricula: '2026-03-10',
      estado: 'activa',
      observaciones: 'Matrícula inicial'
    };

    const matriculas = [matricula1, matricula2];
    for (const matricula of matriculas) {
      await insertMatricula(matricula);
    }
    console.log('✓ Matrículas creadas (2 matrículas base)');

    const MONTO_MATRICULA = 230.00;
    const MONTO_CUOTA_MENSUAL = 420.00;
    const cuotasMensuales = [
      { concepto: 'Cuota mensual - Mayo', fecha_pago: '2026-05-05 10:00:00' },
      { concepto: 'Cuota mensual - Junio', fecha_pago: '2026-06-05 10:00:00' },
      { concepto: 'Cuota mensual - Julio', fecha_pago: '2026-07-05 10:00:00' },
      { concepto: 'Cuota mensual - Agosto', fecha_pago: '2026-08-05 10:00:00' },
      { concepto: 'Cuota mensual - Setiembre', fecha_pago: '2026-09-05 10:00:00' },
      { concepto: 'Cuota mensual - Octubre', fecha_pago: '2026-10-05 10:00:00' },
      { concepto: 'Cuota mensual - Noviembre', fecha_pago: '2026-11-05 10:00:00' },
      { concepto: 'Cuota mensual - Diciembre', fecha_pago: '2026-12-05 10:00:00' }
    ];

    const crearCuotasMensuales = (alumnoId, mesesPagados) => cuotasMensuales.map((cuota, index) => ({
      id: uuidv4(),
      alumno_id: alumnoId,
      monto: MONTO_CUOTA_MENSUAL,
      concepto: cuota.concepto,
      estado_pago: index < mesesPagados ? 'pagado' : 'pendiente',
      estado: index < mesesPagados ? 'pagado' : 'pendiente',
      fecha_pago: index < mesesPagados ? cuota.fecha_pago : null,
      metodo_pago: index < mesesPagados ? 'transferencia' : null,
      observaciones: index < mesesPagados ? 'Cuota mensual cancelada' : 'Cuota mensual pendiente'
    }));

    // Insertar pagos
    const pagos = [
      {
        id: uuidv4(),
        alumno_id: alumnoIds[0],
        monto: MONTO_MATRICULA,
        concepto: 'Matrícula 2026',
        estado_pago: 'pagado',
        estado: 'pagado',
        fecha_pago: '2026-03-05 10:00:00',
        metodo_pago: 'transferencia',
        observaciones: 'Pago de matrícula'
      },
      ...crearCuotasMensuales(alumnoIds[0], 2),
      {
        id: uuidv4(),
        alumno_id: alumnoIds[1],
        monto: MONTO_MATRICULA,
        concepto: 'Matrícula 2026',
        estado_pago: 'pagado',
        estado: 'pagado',
        fecha_pago: '2026-03-05 10:10:00',
        metodo_pago: 'efectivo',
        observaciones: 'Pago de matrícula'
      },
      ...crearCuotasMensuales(alumnoIds[1], 1)
    ];

    for (const pago of pagos) {
      await insertPago(pago);
    }
    console.log(`✓ Pagos creados (${pagos.length} pagos base)`);

    // Insertar asistencias
    const asistencias = [
      {
        id: uuidv4(),
        alumno_id: alumnoIds[0],
        curso_id: cursos[0].id,
        fecha: '2026-05-20',
        estado: 'PRESENTE',
        registrada: true,
        motivo_falta: null
      },
      {
        id: uuidv4(),
        alumno_id: alumnoIds[1],
        curso_id: cursos[1].id,
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
        curso_id: cursos[0].id,
        nota: 18.5,
        periodo: '1',
        observaciones: 'Buen desempeño',
      },
      {
        id: uuidv4(),
        alumno_id: alumnoIds[1],
        curso_id: cursos[1].id,
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
        mensaje: 'Se registró una falta para Valeria Sánchez en Secundaria 4to Grado A.',
        leida: false,
        fecha_lectura: null
      }
    ];

    for (const notificacion of notificaciones) {
      await insertNotificacion(notificacion);
    }
    console.log('✓ Notificaciones creadas (2 registros)');

    // --- Seed adicional: más alumnos relacionados con secciones académicas ---
    const familias = [
      {
        alumno: {
          nombre: 'Camila',
          apellido: 'Herrera',
          email: 'camila.herrera@colegiofuturo.edu',
          telefono: '999700101',
          documento: '40112233',
          matricula: 'MAT-2026-003',
          deuda: false
        },
        padre: {
          nombre: 'Laura Herrera',
          email: 'laura.herrera@colegiofuturo.edu'
        }
      },
      {
        alumno: {
          nombre: 'Andrés',
          apellido: 'López',
          email: 'andres.lopez@colegiofuturo.edu',
          telefono: '999700102',
          documento: '40112234',
          matricula: 'MAT-2026-004',
          deuda: true
        },
        padre: {
          nombre: 'Rocío López',
          email: 'rocio.lopez@colegiofuturo.edu'
        }
      },
      {
        alumno: {
          nombre: 'Sofía',
          apellido: 'Navarro',
          email: 'sofia.navarro@colegiofuturo.edu',
          telefono: '999700103',
          documento: '40112235',
          matricula: 'MAT-2026-005',
          deuda: false
        },
        padre: {
          nombre: 'Miguel Navarro',
          email: 'miguel.navarro@colegiofuturo.edu'
        }
      },
      {
        alumno: {
          nombre: 'Mateo',
          apellido: 'Salas',
          email: 'mateo.salas@colegiofuturo.edu',
          telefono: '999700104',
          documento: '40112236',
          matricula: 'MAT-2026-006',
          deuda: true
        },
        padre: {
          nombre: 'Elena Salas',
          email: 'elena.salas@colegiofuturo.edu'
        }
      },
      {
        alumno: {
          nombre: 'Lucía',
          apellido: 'Vargas',
          email: 'lucia.vargas@colegiofuturo.edu',
          telefono: '999700105',
          documento: '40112237',
          matricula: 'MAT-2026-007',
          deuda: false
        },
        padre: {
          nombre: 'Javier Vargas',
          email: 'javier.vargas@colegiofuturo.edu'
        }
      },
      {
        alumno: {
          nombre: 'Thiago',
          apellido: 'Mendoza',
          email: 'thiago.mendoza@colegiofuturo.edu',
          telefono: '999700106',
          documento: '40112238',
          matricula: 'MAT-2026-008',
          deuda: true
        },
        padre: {
          nombre: 'Carolina Mendoza',
          email: 'carolina.mendoza@colegiofuturo.edu'
        }
      }
    ];

    const extraAlumnoIds = [];
    for (const [index, familia] of familias.entries()) {
      const alumnoUsuarioId = uuidv4();
      const padreUsuarioId = uuidv4();

      await insertUser({
        id: alumnoUsuarioId,
        nombre: familia.alumno.nombre,
        email: familia.alumno.email,
        password: hashedPassword,
        tipo_usuario: 'alumno'
      });

      await insertUser({
        id: padreUsuarioId,
        nombre: familia.padre.nombre,
        email: familia.padre.email,
        password: hashedPassword,
        tipo_usuario: 'padre'
      });

      const alumnoId = uuidv4();
      const alumno = {
        id: alumnoId,
        usuario_id: alumnoUsuarioId,
        numero_matricula: familia.alumno.matricula,
        apellido_paterno: familia.alumno.apellido,
        apellido_materno: '',
        primer_nombre: familia.alumno.nombre,
        telefono: familia.alumno.telefono,
        email_contacto: familia.alumno.email,
        numero_documento: familia.alumno.documento,
        padre_id: padreUsuarioId,
        datos_completos: true,
        deuda_pendiente: familia.alumno.deuda,
        periodo_academico: '2026-1'
      };
      await insertAlumno(alumno);
      extraAlumnoIds.push(alumnoId);

      const cursoAleatorio = cursos[(index + 2) % cursos.length];
      const mesesPagados = familia.alumno.deuda ? 1 : 2;
      await insertMatricula({
        id: uuidv4(),
        alumno_id: alumnoId,
        curso_id: cursoAleatorio.id,
        periodo_academico: '2026-1',
        fecha_matricula: '2026-03-15',
        estado: 'activa'
      });

      await insertPago({
        id: uuidv4(),
        alumno_id: alumnoId,
        monto: MONTO_MATRICULA,
        concepto: 'Matrícula 2026',
        estado_pago: 'pagado',
        estado: 'pagado',
        fecha_pago: '2026-03-15 09:00:00',
        metodo_pago: 'transferencia',
        observaciones: 'Pago de matrícula'
      });

      for (const cuota of crearCuotasMensuales(alumnoId, mesesPagados)) {
        await insertPago(cuota);
      }

      await insertAsistencia({
        id: uuidv4(),
        alumno_id: alumnoId,
        curso_id: cursoAleatorio.id,
        fecha: '2026-05-21',
        estado: index % 4 === 0 ? 'FALTA' : 'PRESENTE',
        registrada: true,
        motivo_falta: index % 4 === 0 ? 'Cita médica' : null
      });

      await insertCalificacion({
        id: uuidv4(),
        alumno_id: alumnoId,
        curso_id: cursoAleatorio.id,
        nota: 12 + (index % 8),
        periodo: '1',
        tipo_evaluacion: 'parcial',
        puntuacion: 12 + (index % 8),
        peso: 1.0,
        observaciones: index % 2 === 0 ? 'Avance constante' : 'Debe reforzar lectura',
        periodo_academico: '2026-1'
      });

      await insertNotificacion({
        id: uuidv4(),
        destinatario_id: padreUsuarioId,
        tipo: 'informacion',
        mensaje: `Se actualizó el seguimiento académico de ${familia.alumno.nombre} ${familia.alumno.apellido} en ${cursoAleatorio.nombre}`,
        leida: false,
        fecha_lectura: null
      });
    }
    console.log(`✓ Seed adicional: ${familias.length} alumnos y relaciones creadas`);

    const totalUsuarios = usuarios.length + familias.length * 2;
    const totalProfesores = profesores.length;
    const totalAlumnos = alumnos.length + familias.length;
    const totalCursos = cursos.length;
    const totalMatriculas = matriculas.length + familias.length;
    const totalPagos = pagos.length + (familias.length * (1 + cuotasMensuales.length));
    const totalAsistencias = asistencias.length + familias.length;
    const totalCalificaciones = calificaciones.length + familias.length;
    const totalNotificaciones = notificaciones.length + familias.length;

    console.log('\n✅ Base de datos inicializada correctamente\n');
    console.log('📊 Resumen de datos insertados:');
    console.log(`   - ${totalUsuarios} usuarios`);
    console.log(`   - ${totalProfesores} profesores`);
    console.log(`   - ${totalAlumnos} alumnos`);
    console.log(`   - ${totalCursos} cursos`);
    console.log(`   - ${totalMatriculas} matrículas`);
    console.log(`   - ${totalPagos} pagos`);
    console.log(`   - ${totalAsistencias} asistencias`);
    console.log(`   - ${totalCalificaciones} calificaciones`);
    console.log(`   - ${totalNotificaciones} notificaciones\n`);
    console.log('📝 Credenciales de prueba:');
    console.log('   Director: luis.herrera@colegiofuturo.edu / password123');
    console.log('   Admin: andrea.montalvo@colegiofuturo.edu / password123');
    console.log('   Docente: juan.paredes@colegiofuturo.edu / password123');
    console.log('   Alumno: valeria.sanchez@colegiofuturo.edu / password123');
    console.log('   Padre: patricia.sanchez@colegiofuturo.edu / password123\n');

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

function ensureMatriculasPeriodoAcademicoColumn() {
  return new Promise((resolve, reject) => {
    db.all('PRAGMA table_info(matriculas)', (err, rows) => {
      if (err) return reject(err);

      const exists = rows.some((row) => row.name === 'periodo_academico');
      if (exists) return resolve();

      db.run(
        "ALTER TABLE matriculas ADD COLUMN periodo_academico TEXT NOT NULL DEFAULT '2026-1'",
        (alterErr) => {
          if (alterErr) reject(alterErr);
          else resolve();
        }
      );
    });
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
      `INSERT INTO profesores (id, usuario_id, numero_empleado, nombre, apellido_paterno, primer_nombre, especialidad, email, telefono, numero_documento, estado, email_contacto, fecha_contratacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)`,
      [profesor.id, profesor.usuario_id, profesor.numero_empleado, profesor.nombre, profesor.apellido_paterno,
       profesor.primer_nombre, profesor.especialidad || null, profesor.email, profesor.telefono,
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
      `INSERT INTO matriculas (id, alumno_id, curso_id, periodo_academico, fecha_matricula, estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [matricula.id, matricula.alumno_id, matricula.curso_id, matricula.periodo_academico || '2026-1', matricula.fecha_matricula,
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
