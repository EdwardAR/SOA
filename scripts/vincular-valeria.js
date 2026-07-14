require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './database/colegio.db';
const db = new sqlite3.Database(path.resolve(__dirname, '..', DB_PATH));

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  // 1. Encontrar a Valeria Sánchez
  db.get(`SELECT id, primer_nombre, apellido_paterno, numero_matricula FROM alumnos WHERE numero_matricula = 'MAT-2026-001'`, (err, valeria) => {
    if (err || !valeria) {
      console.error('ERROR: No se encontró a Valeria Sánchez (MAT-2026-001)');
      process.exit(1);
    }
    console.log(`✓ Encontrada: ${valeria.primer_nombre} ${valeria.apellido_paterno} (${valeria.numero_matricula})`);

    // 2. Encontrar todos los cursos de 1ro
    db.all(`SELECT id, codigo, nombre, grado, seccion FROM cursos WHERE grado = '1ro' ORDER BY codigo`, (err, cursos) => {
      if (err || cursos.length === 0) {
        console.error('ERROR: No se encontraron cursos para 1ro');
        process.exit(1);
      }
      console.log(`✓ Cursos de 1ro encontrados: ${cursos.length}`);

      // 3. Ver en cuáles ya está matriculada
      db.all(`SELECT curso_id FROM matriculas WHERE alumno_id = ?`, [valeria.id], (err, existentes) => {
        if (err) { console.error(err); process.exit(1); }

        const idsExistentes = new Set(existentes.map(m => m.curso_id));
        const aAgregar = cursos.filter(c => !idsExistentes.has(c.id));

        if (aAgregar.length === 0) {
          console.log('✓ Valeria ya está matriculada en todos los cursos de 1ro.');
          cerrar();
          return;
        }

        console.log(`  Matrículas existentes: ${existentes.length}`);
        console.log(`  Cursos a agregar: ${aAgregar.length}\n`);

        let insertados = 0;
        aAgregar.forEach(curso => {
          const id = uuidv4();
          db.run(
            `INSERT INTO matriculas (id, alumno_id, curso_id, periodo_academico, fecha_matricula, estado, observaciones)
             VALUES (?, ?, ?, '2026-1', '2026-03-10', 'activa', 'Vinculación adicional')`,
            [id, valeria.id, curso.id],
            function (err) {
              if (err) {
                console.error(`  ✗ Error al matricular en ${curso.codigo}: ${err.message}`);
              } else {
                console.log(`  ✓ Matriculada en ${curso.codigo} - ${curso.nombre} (${curso.seccion})`);
                insertados++;
              }
              if (++insertados === aAgregar.length) {
                console.log(`\n✓ Proceso completado: ${insertados} matrículas creadas.`);
                cerrar();
              }
            }
          );
        });
      });
    });
  });
});

function cerrar() {
  setTimeout(() => {
    db.close();
    process.exit(0);
  }, 200);
}
