const sqlite3 = require('sqlite3').verbose();
const bcryptjs = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = './database/colegio.db';

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Delete old database if exists
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('✓ Base de datos anterior eliminada');
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error al crear la base de datos:', err);
    process.exit(1);
  }
  console.log('✓ Base de datos creada');
  initializeSchema();
});

const initializeSchema = () => {
  db.serialize(() => {
    // Tabla de usuarios
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('alumno', 'docente', 'administrativo', 'padre', 'director')),
        estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'bloqueado')),
        telefono TEXT,
        direccion TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error crear tabla usuarios:', err);
      else console.log('✓ Tabla usuarios creada');
    });

    // Tabla de alumnos
    db.run(`
      CREATE TABLE IF NOT EXISTS alumnos (
        id TEXT PRIMARY KEY,
        usuario_id TEXT UNIQUE,
        numero_matricula TEXT UNIQUE NOT NULL,
        apellido_paterno TEXT NOT NULL,
        apellido_materno TEXT,
        primer_nombre TEXT NOT NULL,
        segundo_nombre TEXT,
        numero_documento TEXT UNIQUE,
        genero TEXT,
        fecha_nacimiento DATE,
        direccion TEXT,
        telefono TEXT,
        email_contacto TEXT,
        padre_id TEXT,
        datos_completos BOOLEAN DEFAULT 0,
        deuda_pendiente DECIMAL(10,2) DEFAULT 0,
        periodo_academico TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        estado TEXT DEFAULT 'activo',
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `, (err) => {
      if (err) console.error('Error crear tabla alumnos:', err);
      else console.log('✓ Tabla alumnos creada');
    });

    // Tabla de cursos
    db.run(`
      CREATE TABLE IF NOT EXISTS cursos (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        codigo TEXT,
        grado TEXT NOT NULL,
        seccion TEXT,
        capacidad INTEGER,
        profesor_id TEXT,
        horario_inicio TIME,
        horario_fin TIME,
        salon TEXT,
        estado TEXT DEFAULT 'activo',
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error crear tabla cursos:', err);
      else console.log('✓ Tabla cursos creada');
    });

    // Tabla de profesores
    db.run(`
      CREATE TABLE IF NOT EXISTS profesores (
        id TEXT PRIMARY KEY,
        usuario_id TEXT UNIQUE,
        numero_empleado TEXT,
        nombre TEXT NOT NULL,
        apellido_paterno TEXT,
        primer_nombre TEXT,
        email TEXT UNIQUE,
        telefono TEXT,
        especialidad TEXT,
        numero_documento TEXT UNIQUE,
        estado TEXT DEFAULT 'activo',
        email_contacto TEXT,
        fecha_contratacion DATE,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `, (err) => {
      if (err) console.error('Error crear tabla profesores:', err);
      else console.log('✓ Tabla profesores creada');
    });

    // Tabla de matrículas
    db.run(`
      CREATE TABLE IF NOT EXISTS matriculas (
        id TEXT PRIMARY KEY,
        alumno_id TEXT NOT NULL,
        curso_id TEXT NOT NULL,
        fecha_matricula DATE,
        estado TEXT DEFAULT 'activa' CHECK (estado IN ('activa', 'cancelada', 'suspendida')),
        observaciones TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
        FOREIGN KEY (curso_id) REFERENCES cursos(id)
      )
    `, (err) => {
      if (err) console.error('Error crear tabla matriculas:', err);
      else console.log('✓ Tabla matrículas creada');
    });

    // Tabla de pagos
    db.run(`
      CREATE TABLE IF NOT EXISTS pagos (
        id TEXT PRIMARY KEY,
        alumno_id TEXT NOT NULL,
        monto DECIMAL(10,2) NOT NULL,
        concepto TEXT,
        estado_pago TEXT DEFAULT 'pendiente' CHECK (estado_pago IN ('pagado', 'pendiente', 'vencido')),
        estado TEXT DEFAULT 'pendiente',
        fecha_pago DATE,
        metodo_pago TEXT,
        numero_comprobante TEXT,
        observaciones TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (alumno_id) REFERENCES alumnos(id)
      )
    `, (err) => {
      if (err) console.error('Error crear tabla pagos:', err);
      else console.log('✓ Tabla pagos creada');
    });

    // Tabla de asistencia
    db.run(`
      CREATE TABLE IF NOT EXISTS asistencia (
        id TEXT PRIMARY KEY,
        alumno_id TEXT NOT NULL,
        fecha DATE NOT NULL,
        estado TEXT DEFAULT 'presente' CHECK (estado IN ('presente', 'ausente', 'tardanza', 'justificado')),
        observacion TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (alumno_id) REFERENCES alumnos(id)
      )
    `, (err) => {
      if (err) console.error('Error crear tabla asistencia:', err);
      else console.log('✓ Tabla asistencia creada');
    });

    // Tabla de calificaciones
    db.run(`
      CREATE TABLE IF NOT EXISTS calificaciones (
        id TEXT PRIMARY KEY,
        alumno_id TEXT NOT NULL,
        curso_id TEXT NOT NULL,
        nota DECIMAL(5,2),
        periodo TEXT,
        observaciones TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
        FOREIGN KEY (curso_id) REFERENCES cursos(id)
      )
    `, (err) => {
      if (err) console.error('Error crear tabla calificaciones:', err);
      else console.log('✓ Tabla calificaciones creada');
    });

    // Tabla de notificaciones
    db.run(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id TEXT PRIMARY KEY,
        destinatario_id TEXT NOT NULL,
        tipo TEXT DEFAULT 'informacion' CHECK (tipo IN ('informacion', 'alerta', 'recordatorio', 'urgente')),
        mensaje TEXT NOT NULL,
        leida BOOLEAN DEFAULT 0,
        fecha_lectura DATETIME,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error crear tabla notificaciones:', err);
      else console.log('✓ Tabla notificaciones creada');
      insertSeedData();
    });
  });
};

const insertSeedData = () => {
  const hashedPassword = bcryptjs.hashSync('password123', 10);
  const baseTime = Date.now();
  const directorId = 'usr-dir-' + baseTime;
  
  // Store IDs for relations
  let alumnoIds = [];
  let cursoIds = [];
  let profesorIds = [];
  let usuarioAlumnoIds = [];

  db.serialize(() => {
    // 1. Insert director
    db.run(
      `INSERT INTO usuarios (id, nombre, email, password, tipo_usuario, estado, telefono)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [directorId, 'Director General', 'director@colegio.com', hashedPassword, 'director', 'activo', '999999999'],
      (err) => {
        if (err) {
          console.error('Error insertar director:', err);
        } else {
          console.log('✓ Usuario director de prueba creado');
        }
      }
    );

    // 2. Insert sample courses
    const cursos = [
      { nombre: 'Matemáticas', grado: '1ro', codigo: 'MAT-001', seccion: 'A' },
      { nombre: 'Español', grado: '1ro', codigo: 'ESP-001', seccion: 'A' },
      { nombre: 'Ciencias Naturales', grado: '2do', codigo: 'CCN-001', seccion: 'A' },
      { nombre: 'Inglés', grado: '2do', codigo: 'ING-001', seccion: 'B' }
    ];

    cursos.forEach((curso, idx) => {
      const cursoId = 'cur-' + (1000 + idx);
      cursoIds.push(cursoId);
      db.run(
        `INSERT INTO cursos (id, nombre, codigo, grado, seccion, capacidad, salon, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [cursoId, curso.nombre, curso.codigo, curso.grado, curso.seccion, 30, `Aula ${curso.seccion}`, 'activo'],
        (err) => {
          if (err) console.error('Error insertar curso:', err);
          else console.log(`✓ Curso "${curso.nombre}" creado`);
        }
      );
    });

    // 3. Insert students with users
    for (let i = 1; i <= 5; i++) {
      const alumnoId = 'alm-' + (1000 + i);
      const usuarioId = 'usr-alm-' + (1000 + i);
      alumnoIds.push(alumnoId);
      usuarioAlumnoIds.push(usuarioId);
      const hashedAlumnoPassword = bcryptjs.hashSync('alumno123', 10);
      
      db.run(
        `INSERT INTO usuarios (id, nombre, email, password, tipo_usuario, estado)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [usuarioId, `Alumno ${i}`, `alumno${i}@colegio.com`, hashedAlumnoPassword, 'alumno', 'activo'],
        (err) => {
          if (err) console.error('Error insertar usuario alumno:', err);
        }
      );

      db.run(
        `INSERT INTO alumnos (id, usuario_id, numero_matricula, apellido_paterno, primer_nombre, numero_documento, genero, email_contacto, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [alumnoId, usuarioId, `MAT-2024-${1000 + i}`, `Apellido${i}`, `Alumno`, `DOC${100 + i}`, 'M', `alumno${i}@colegio.com`, 'activo'],
        (err) => {
          if (err) console.error('Error insertar alumno:', err);
          else console.log(`✓ Alumno ${i} creado`);
        }
      );
    }

    // 4. Insert teachers with users
    for (let i = 1; i <= 3; i++) {
      const profesorId = 'pro-' + (1000 + i);
      const usuarioId = 'usr-prof-' + (1000 + i);
      profesorIds.push(profesorId);
      const hashedProfPassword = bcryptjs.hashSync('profesor123', 10);
      
      db.run(
        `INSERT INTO usuarios (id, nombre, email, password, tipo_usuario, estado)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [usuarioId, `Profesor ${i}`, `profesor${i}@colegio.com`, hashedProfPassword, 'docente', 'activo'],
        (err) => {
          if (err) console.error('Error insertar usuario profesor:', err);
        }
      );

      db.run(
        `INSERT INTO profesores (id, usuario_id, nombre, apellido_paterno, primer_nombre, email_contacto, especialidad, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [profesorId, usuarioId, `Profesor ${i}`, `Apellido${i}`, `Profesor`, `profesor${i}@colegio.com`, `Especialidad ${i}`, 'activo'],
        (err) => {
          if (err) console.error('Error insertar profesor:', err);
          else console.log(`✓ Profesor ${i} creado`);
        }
      );
    }

    // 5. Insert matriculas (after a delay)
    setTimeout(() => {
      for (let i = 0; i < alumnoIds.length; i++) {
        for (let j = 0; j < Math.min(2, cursoIds.length); j++) {
          const matriculaId = 'mat-' + (10000 + i * 100 + j);
          db.run(
            `INSERT INTO matriculas (id, alumno_id, curso_id, fecha_matricula, estado)
             VALUES (?, ?, ?, ?, ?)`,
            [matriculaId, alumnoIds[i], cursoIds[j], new Date().toISOString().split('T')[0], 'activa'],
            (err) => {
              if (err) console.error('Error insertar matrícula:', err);
            }
          );
        }
      }
      console.log('✓ Matrículas creadas');
    }, 500);

    // 6. Insert pagos
    setTimeout(() => {
      for (let i = 0; i < alumnoIds.length; i++) {
        for (let j = 1; j <= 3; j++) {
          const pagoId = 'pag-' + (10000 + i * 100 + j);
          const estados = ['pagado', 'pagado', 'pendiente'];
          db.run(
            `INSERT INTO pagos (id, alumno_id, monto, concepto, estado_pago, estado, fecha_pago)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [pagoId, alumnoIds[i], 500.00 * j, `Cuota mensual ${j}`, estados[j-1], estados[j-1], new Date().toISOString().split('T')[0]],
            (err) => {
              if (err) console.error('Error insertar pago:', err);
            }
          );
        }
      }
      console.log('✓ Pagos creados');
    }, 800);

    // 7. Insert asistencia
    setTimeout(() => {
      for (let i = 0; i < alumnoIds.length; i++) {
        for (let j = 0; j < 10; j++) {
          const asistenciaId = 'ast-' + (10000 + i * 100 + j);
          const estados = ['presente', 'ausente', 'tardanza', 'justificado'];
          const estado = estados[Math.floor(Math.random() * estados.length)];
          const fecha = new Date();
          fecha.setDate(fecha.getDate() - (9 - j));
          db.run(
            `INSERT INTO asistencia (id, alumno_id, fecha, estado)
             VALUES (?, ?, ?, ?)`,
            [asistenciaId, alumnoIds[i], fecha.toISOString().split('T')[0], estado],
            (err) => {
              if (err) console.error('Error insertar asistencia:', err);
            }
          );
        }
      }
      console.log('✓ Registros de asistencia creados');
    }, 1100);

    // 8. Insert calificaciones
    setTimeout(() => {
      for (let i = 0; i < alumnoIds.length; i++) {
        for (let j = 0; j < cursoIds.length; j++) {
          const calificacionId = 'cal-' + (10000 + i * 100 + j);
          const nota = (Math.random() * 4 + 14).toFixed(2);
          db.run(
            `INSERT INTO calificaciones (id, alumno_id, curso_id, nota, periodo)
             VALUES (?, ?, ?, ?, ?)`,
            [calificacionId, alumnoIds[i], cursoIds[j], nota, '2024-Q1'],
            (err) => {
              if (err) console.error('Error insertar calificación:', err);
            }
          );
        }
      }
      console.log('✓ Calificaciones creadas');
    }, 1400);

    // 9. Insert notificaciones
    setTimeout(() => {
      const tipos = ['informacion', 'alerta', 'recordatorio', 'urgente'];
      const mensajes = [
        'Recordatorio: Pago vencido próxima semana',
        'Calificaciones del primer trimestre publicadas',
        'Reunión de padres: próxima semana',
        'Alerta: Falta de asistencia detectada'
      ];
      for (let i = 0; i < 5; i++) {
        const notifId = 'not-' + (1000 + i);
        const tipo = tipos[i % tipos.length];
        db.run(
          `INSERT INTO notificaciones (id, destinatario_id, tipo, mensaje, leida)
           VALUES (?, ?, ?, ?, ?)`,
          [notifId, directorId, tipo, mensajes[i % mensajes.length], i > 2 ? 1 : 0],
          (err) => {
            if (err) console.error('Error insertar notificación:', err);
          }
        );
      }
      console.log('✓ Notificaciones creadas');
    }, 1700);

    // Close database after a delay
    setTimeout(() => {
      db.close((err) => {
        if (err) console.error('Error closing database:', err);
        else console.log('\n✅ Base de datos inicializada correctamente\n');
        process.exit(0);
      });
    }, 2200);
  });
};
