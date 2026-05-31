const sqlite3 = require('sqlite3').verbose();
const DB_PATH = './database/colegio.db';

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to DB:', err);
    process.exit(1);
  }
});

db.all('SELECT id, nombre, email, password, tipo_usuario FROM usuarios', [], (err, rows) => {
  if (err) {
    console.error('Error querying users:', err);
  } else {
    console.log('TOTAL USERS FOUND:', rows.length);
    rows.forEach(r => {
      console.log(`- ${r.nombre} | ${r.email} | ${r.tipo_usuario} | ${r.password.substring(0, 15)}...`);
    });
  }
  db.close();
});
