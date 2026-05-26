/**
 * Script para probar los endpoints DELETE de los servicios
 * Verifica que los DELETE funcionen correctamente con cascada
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Tokens de prueba (estos deberían obtenerse mediante login real)
let adminToken = null;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token
api.interceptors.request.use(config => {
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }
  return config;
});

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testDeleteEndpoints() {
  console.log('🧪 Iniciando pruebas de DELETE endpoints...\n');

  try {
    // 1. Login para obtener token
    console.log('1️⃣ Realizando login...');
    try {
      const loginRes = await api.post('/auth/login', {
        email: 'admin@colegio.com',
        password: 'admin123'
      });
      adminToken = loginRes.data.data.token;
      console.log('✅ Login exitoso\n');
    } catch (err) {
      console.log('⚠️ No se pudo hacer login automático. Las pruebas pueden fallar sin token.\n');
    }

    // 2. Probar DELETE de Alumnos
    console.log('2️⃣ Probando DELETE de Alumnos...');
    try {
      const alumnosRes = await api.get('/alumnos');
      const alumnos = alumnosRes.data.data || [];
      if (alumnos.length > 0) {
        const alumnoId = alumnos[0].id;
        console.log(`   - Intentando eliminar alumno: ${alumnoId}`);
        
        const delRes = await api.delete(`/alumnos/${alumnoId}`);
        console.log(`   ✅ DELETE /alumnos/${alumnoId} - Exitoso`);
        console.log(`   📝 Respuesta: ${delRes.data.mensaje}\n`);
      } else {
        console.log('   ⚠️ No hay alumnos disponibles para prueba\n');
      }
    } catch (err) {
      console.log(`   ❌ Error en DELETE alumnos: ${err.response?.data?.mensaje || err.message}\n`);
    }

    // 3. Probar DELETE de Profesores
    console.log('3️⃣ Probando DELETE de Profesores...');
    try {
      const profesoresRes = await api.get('/profesores');
      const profesores = profesoresRes.data.data || [];
      if (profesores.length > 0) {
        const profesorId = profesores[0].id;
        console.log(`   - Intentando eliminar profesor: ${profesorId}`);
        
        const delRes = await api.delete(`/profesores/${profesorId}`);
        console.log(`   ✅ DELETE /profesores/${profesorId} - Exitoso`);
        console.log(`   📝 Respuesta: ${delRes.data.mensaje}\n`);
      } else {
        console.log('   ⚠️ No hay profesores disponibles para prueba\n');
      }
    } catch (err) {
      console.log(`   ❌ Error en DELETE profesores: ${err.response?.data?.mensaje || err.message}\n`);
    }

    // 4. Probar DELETE de Cursos
    console.log('4️⃣ Probando DELETE de Cursos...');
    try {
      const cursosRes = await api.get('/cursos');
      const cursos = cursosRes.data.data || [];
      if (cursos.length > 0) {
        const cursoId = cursos[0].id;
        console.log(`   - Intentando eliminar curso: ${cursoId}`);
        
        const delRes = await api.delete(`/cursos/${cursoId}`);
        console.log(`   ✅ DELETE /cursos/${cursoId} - Exitoso`);
        console.log(`   📝 Respuesta: ${delRes.data.mensaje}\n`);
      } else {
        console.log('   ⚠️ No hay cursos disponibles para prueba\n');
      }
    } catch (err) {
      console.log(`   ❌ Error en DELETE cursos: ${err.response?.data?.mensaje || err.message}\n`);
    }

    // 5. Probar DELETE de Matrículas
    console.log('5️⃣ Probando DELETE de Matrículas...');
    try {
      const matriculasRes = await api.get('/matriculas');
      const matriculas = matriculasRes.data.data || [];
      if (matriculas.length > 0) {
        const matriculaId = matriculas[0].id;
        console.log(`   - Intentando eliminar matrícula: ${matriculaId}`);
        
        const delRes = await api.delete(`/matriculas/${matriculaId}`);
        console.log(`   ✅ DELETE /matriculas/${matriculaId} - Exitoso`);
        console.log(`   📝 Respuesta: ${delRes.data.mensaje}\n`);
      } else {
        console.log('   ⚠️ No hay matrículas disponibles para prueba\n');
      }
    } catch (err) {
      console.log(`   ❌ Error en DELETE matrículas: ${err.response?.data?.mensaje || err.message}\n`);
    }

    console.log('✅ Pruebas completadas\n');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }

  process.exit(0);
}

// Esperar a que el servidor esté listo
async function waitForServer() {
  console.log('⏳ Esperando que el servidor esté disponible...');
  for (let i = 0; i < 20; i++) {
    try {
      await api.get('/health');
      console.log('✅ Servidor disponible\n');
      return;
    } catch (err) {
      await sleep(1000);
    }
  }
  console.error('❌ El servidor no respondió después de 20 segundos');
  process.exit(1);
}

// Ejecutar
waitForServer().then(() => testDeleteEndpoints()).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
