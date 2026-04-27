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
        grado TEXT NOT NULL,
        seccion TEXT,
        capacidad INTEGER,
        profesor_id TEXT,
        horario_inicio TIME,
        horario_fin TIME,
        salon TEXT,
        estado TEXT DEFAULT 'activo',
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
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
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        telefono TEXT,
        especialidad TEXT,
        numero_documento TEXT UNIQUE,
        estado TEXT DEFAULT 'activo',
        fecha_contratacion DATE,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
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
        estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pagado', 'pendiente', 'vencido')),
        fecha_pago DATE,
        metodo_pago TEXT,
        numero_comprobante TEXT,
        observaciones TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
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
  const directorId = 'usr-' + Date.now();
  
  db.serialize(() => {
    // Insert test user (director)
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

    // Insert sample courses
    const cursoIds = [];
    const cursos = [
      { nombre: 'Matemáticas', grado: '1ro', seccion: 'A', profesor: 'Prof. Juan' },
      { nombre: 'Español', grado: '1ro', seccion: 'A', profesor: 'Prof. María' },
      { nombre: 'Ciencias', grado: '2do', seccion: 'A', profesor: 'Prof. Carlos' },
      { nombre: 'Inglés', grado: '2do', seccion: 'B', profesor: 'Prof. Ana' }
    ];

    cursos.forEach((curso) => {
      const cursoId = 'curso-' + Date.now() + Math.random();
      cursoIds.push(cursoId);
      db.run(
        `INSERT INTO cursos (id, nombre, grado, seccion, capacidad, salon, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [cursoId, curso.nombre, curso.grado, curso.seccion, 30, `Aula ${curso.seccion}`, 'activo'],
        (err) => {
          if (err) console.error('Error insertar curso:', err);
          else console.log(`✓ Curso "${curso.nombre}" creado`);
        }
      );
    });

    // Insert sample students
    for (let i = 1; i <= 5; i++) {
      const alumnoId = 'alm-' + i + '-' + Date.now();
      const usuarioId = 'usr-alm-' + i + '-' + Date.now();
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
        `INSERT INTO alumnos (id, usuario_id, numero_matricula, apellido_paterno, primer_nombre, numero_documento, genero)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [alumnoId, usuarioId, `MAT-2024-${i}`, `Apellido${i}`, `Alumno${i}`, `DOC${100+i}`, 'M'],
        (err) => {
          if (err) console.error('Error insertar alumno:', err);
          else console.log(`✓ Alumno ${i} creado`);
        }
      );
    }

    // Insert sample teachers
    for (let i = 1; i <= 3; i++) {
      const profesorId = 'prof-' + i + '-' + Date.now();
      const usuarioId = 'usr-prof-' + i + '-' + Date.now();
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
        `INSERT INTO profesores (id, usuario_id, nombre, email, especialidad, estado)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [profesorId, usuarioId, `Profesor ${i}`, `profesor${i}@colegio.com`, `Especialidad ${i}`, 'activo'],
        (err) => {
          if (err) console.error('Error insertar profesor:', err);
          else console.log(`✓ Profesor ${i} creado`);
        }
      );
    }

    // Close database after a delay to ensure all queries complete
    setTimeout(() => {
      db.close((err) => {
        if (err) console.error('Error closing database:', err);
        else console.log('\n✅ Base de datos inicializada correctamente\n');
        process.exit(0);
      });
    }, 2000);
  });
};
