require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || './database/colegio.db';

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
  console.log('✓ Conectado a BD:', DB_PATH);
});

console.log('\n📊 ===== VERIFICACIÓN DE DATOS =====\n');

// Conteo de registros
const queries = [
  { tabla: 'cursos', emoji: '📚' },
  { tabla: 'matriculas', emoji: '📝' },
  { tabla: 'pagos', emoji: '💰' },
  { tabla: 'asistencias', emoji: '✅' },
  { tabla: 'calificaciones', emoji: '📊' },
  { tabla: 'alumnos', emoji: '👨‍🎓' },
  { tabla: 'profesores', emoji: '👨‍🏫' },
  { tabla: 'usuarios', emoji: '👥' }
];

let completados = 0;

queries.forEach(q => {
  db.all(`SELECT COUNT(*) as total FROM ${q.tabla}`, (err, rows) => {
    if (!err) {
      const count = rows ? rows[0].total : 0;
      console.log(`${q.emoji} ${q.tabla.padEnd(15)} : ${count}`);
    }
    completados++;
    
    if (completados === queries.length) {
      // Mostrar algunos registros específicos
      console.log('\n📋 MUESTRA DE DATOS:\n');
      
      db.all('SELECT nombre, email, tipo_usuario FROM usuarios LIMIT 3', (err, rows) => {
        if (!err && rows) {
          console.log('👥 Usuarios:');
          rows.forEach(r => {
            console.log(`   • ${r.nombre} (${r.email}) [${r.tipo_usuario}]`);
          });
        }
        
        db.all('SELECT codigo, nombre, grado_nivel FROM cursos LIMIT 3', (err, rows) => {
          if (!err && rows) {
            console.log('\n📚 Cursos:');
            rows.forEach(r => {
              console.log(`   • ${r.codigo}: ${r.nombre}`);
            });
          }
          
          db.all('SELECT numero_matricula, primer_nombre, apellido_paterno FROM alumnos LIMIT 3', (err, rows) => {
            if (!err && rows) {
              console.log('\n👨‍🎓 Alumnos:');
              rows.forEach(r => {
                console.log(`   • ${r.numero_matricula}: ${r.primer_nombre} ${r.apellido_paterno}`);
              });
            }
            
            db.all(`
              SELECT estado, COUNT(*) as cantidad, SUM(monto) as total 
              FROM pagos 
              GROUP BY estado
            `, (err, rows) => {
              if (!err && rows) {
                console.log('\n💰 Pagos por Estado:');
                rows.forEach(r => {
                  console.log(`   • ${r.estado}: ${r.cantidad} registros, Total: $${r.total}`);
                });
              }
              
              console.log('\n✅ VERIFICACIÓN COMPLETADA\n');
              setTimeout(() => { db.close(); process.exit(0); }, 100);
            });
          });
        });
      });
    }
  });
});
