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
      apellido_paterno: 'Perez',
      primer_nombre: 'Juan',
      especialidad: 'Matemáticas'
    };

    const profesor2 = {
      id: uuidv4(),
      usuario_id: profesor2Id,
      apellido_paterno: 'Rodriguez',
      primer_nombre: 'Maria',
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
        primer_nombre: 'Luis',
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
        primer_nombre: 'Sofia',
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
      grado_nivel: '4to',
      seccion: 'A',
      profesor_id: profesor1.id,
      aula_asignada: '4-A',
      periodo_academico: '2026-1',
      capacidad_maxima: 30
    };

    const curso2 = {
      id: uuidv4(),
      codigo: 'LEN-001',
      nombre: 'Lenguaje 4to A',
      grado_nivel: '4to',
      seccion: 'A',
      profesor_id: profesor2.id,
      aula_asignada: '4-A',
      periodo_academico: '2026-1',
      capacidad_maxima: 30
    };

    const curso3 = {
      id: uuidv4(),
      codigo: 'MAT-002',
      nombre: 'Matemáticas 5to A',
      grado_nivel: '5to',
      seccion: 'A',
      profesor_id: profesor1.id,
      aula_asignada: '5-A',
      periodo_academico: '2026-1',
      capacidad_maxima: 35
    };

    const curso4 = {
      id: uuidv4(),
      codigo: 'FIS-001',
      nombre: 'Física 5to A',
      grado_nivel: '5to',
      seccion: 'A',
      profesor_id: profesor2.id,
      aula_asignada: '5-A',
      periodo_academico: '2026-1',
      capacidad_maxima: 35
    };

    const curso5 = {
      id: uuidv4(),
      codigo: 'QUI-001',
      nombre: 'Química 5to B',
      grado_nivel: '5to',
      seccion: 'B',
      profesor_id: profesor1.id,
      aula_asignada: '5-B',
      periodo_academico: '2026-1',
      capacidad_maxima: 32
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
      aula_asignada: '4-A',
      periodo_academico: '2026-1'
    };

    const matricula2 = {
      id: uuidv4(),
      alumno_id: alumnoIds[1],
      curso_id: curso2.id,
      aula_asignada: '4-A',
      periodo_academico: '2026-1'
    };

    const matricula3 = {
      id: uuidv4(),
      alumno_id: alumnoIds[0],
      curso_id: curso3.id,
      aula_asignada: '5-A',
      periodo_academico: '2026-1'
    };

    const matricula4 = {
      id: uuidv4(),
      alumno_id: alumnoIds[1],
      curso_id: curso5.id,
      aula_asignada: '5-B',
      periodo_academico: '2026-1'
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
        estado: 'pagado',
        metodo_pago: 'transferencia'
      },
      {
        id: uuidv4(),
        alumno_id: alumnoIds[1],
        monto: 350.00,
        concepto: 'Pensión Marzo 2024',
        periodo_academico: '2026-1',
        estado: 'pendiente',
        metodo_pago: null
      },
      {
        id: uuidv4(),
        alumno_id: alumnoIds[1],
        monto: 200.00,
        concepto: 'Uniforme Escolar',
        periodo_academico: '2026-1',
        estado: 'pendiente',
        metodo_pago: null
      },
      {
        id: uuidv4(),
        alumno_id: alumnoIds[0],
        monto: 150.00,
        concepto: 'Carnet Estudiantil',
        periodo_academico: '2026-1',
        estado: 'pagado',
        metodo_pago: 'efectivo'
      }
    ];

    for (const pago of pagos) {
      await insertPago(pago);
    }
    console.log('✓ Pagos creados (4 pagos)');

    console.log('\n✅ Base de datos inicializada correctamente\n');
    console.log('📊 Resumen de datos insertados:');
    console.log('   - 7 usuarios');
    console.log('   - 2 profesores');
    console.log('   - 2 alumnos');
    console.log('   - 5 cursos');
    console.log('   - 4 matrículas');
    console.log('   - 4 pagos\n');
    console.log('📝 Credenciales de prueba:');
    console.log('   Director: director@colegio.com / password123');
    console.log('   Alumno: luis@estudiante.com / password123');
    console.log('   Docente: juan@colegio.com / password123\n');

    process.exit(0);
  } catch (error) {
    console.error('Error al sembrar datos:', error);
    process.exit(1);
  }
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
      `INSERT INTO profesores (id, usuario_id, apellido_paterno, primer_nombre, especialidad)
       VALUES (?, ?, ?, ?, ?)`,
      [profesor.id, profesor.usuario_id, profesor.apellido_paterno, profesor.primer_nombre, profesor.especialidad],
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
      `INSERT INTO alumnos (id, usuario_id, numero_matricula, apellido_paterno, primer_nombre,
       numero_documento, padre_id, datos_completos, periodo_academico)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [alumno.id, alumno.usuario_id, alumno.numero_matricula, alumno.apellido_paterno,
       alumno.primer_nombre, alumno.numero_documento, alumno.padre_id, alumno.datos_completos,
       alumno.periodo_academico],
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
      `INSERT INTO cursos (id, codigo, nombre, grado_nivel, seccion, profesor_id,
       aula_asignada, periodo_academico, capacidad_maxima)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [curso.id, curso.codigo, curso.nombre, curso.grado_nivel, curso.seccion,
       curso.profesor_id, curso.aula_asignada, curso.periodo_academico, curso.capacidad_maxima],
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
      `INSERT INTO matriculas (id, alumno_id, curso_id, aula_asignada, periodo_academico)
       VALUES (?, ?, ?, ?, ?)`,
      [matricula.id, matricula.alumno_id, matricula.curso_id, matricula.aula_asignada,
       matricula.periodo_academico],
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
      `INSERT INTO pagos (id, alumno_id, monto, concepto, periodo_academico, estado, metodo_pago)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [pago.id, pago.alumno_id, pago.monto, pago.concepto, pago.periodo_academico,
       pago.estado, pago.metodo_pago],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}
