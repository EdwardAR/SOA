#!/usr/bin/env node

/**
 * Script de verificación de servicios SOA
 * Prueba que todos los servicios estén respondiendo correctamente
 */

const axios = require('axios');

const SERVICIOS = {
  'API Gateway': 'http://localhost:3000/api/health',
  'Alumnos': 'http://localhost:3001/health',
  'Matrículas': 'http://localhost:3002/health',
  'Profesores': 'http://localhost:3003/health',
  'Cursos': 'http://localhost:3004/health',
  'Pagos': 'http://localhost:3005/health',
  'Notificaciones': 'http://localhost:3006/health',
  'Asistencia': 'http://localhost:3007/health',
  'Calificaciones': 'http://localhost:3008/health'
};

async function verificarServicio(nombre, url) {
  try {
    const respuesta = await axios.get(url, { timeout: 5000 });
    console.log(`✅ ${nombre.padEnd(20)} - OK`);
    return true;
  } catch (error) {
    console.log(`❌ ${nombre.padEnd(20)} - ERROR (${error.code || error.message})`);
    return false;
  }
}

async function ejecutarPruebas() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   🔍 VERIFICACIÓN DE SERVICIOS SOA        ║');
  console.log('╚════════════════════════════════════════════╝\n');

  const resultados = [];
  
  for (const [nombre, url] of Object.entries(SERVICIOS)) {
    const resultado = await verificarServicio(nombre, url);
    resultados.push(resultado);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const serviciosActivos = resultados.filter(r => r).length;
  const totalServicios = resultados.length;

  console.log('\n╔════════════════════════════════════════════╗');
  console.log(`║   ${serviciosActivos}/${totalServicios} Servicios activos`);
  console.log('╚════════════════════════════════════════════╝\n');

  if (serviciosActivos === totalServicios) {
    console.log('✨ ¡Todos los servicios están operacionales!\n');
    console.log('📝 Credenciales de prueba:');
    console.log('   Director: director@colegio.com / password123');
    console.log('   Alumno: luis@estudiante.com / password123\n');
    process.exit(0);
  } else {
    console.log('⚠️  Algunos servicios no están disponibles.');
    console.log('   Asegúrese de ejecutar: npm run dev\n');
    process.exit(1);
  }
}

// Esperar un poco antes de comenzar las verificaciones
setTimeout(ejecutarPruebas, 1000);
