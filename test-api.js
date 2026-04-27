#!/usr/bin/env node

/**
 * Script de prueba de APIs
 * Realiza pruebas básicas de los endpoints principales
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let token = '';

async function request(metodo, url, datos = null) {
  try {
    const config = {
      method: metodo,
      url: `${BASE_URL}${url}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (datos) {
      config.data = datos;
    }

    const respuesta = await axios(config);
    return respuesta.data;
  } catch (error) {
    return {
      exito: false,
      error: error.response?.data || error.message
    };
  }
}

async function ejecutarPruebas() {
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║   🧪 PRUEBAS DE API - SISTEMA SOA             ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  console.log('📝 PASO 1: Login\n');
  const loginResp = await request('POST', '/auth/login', {
    email: 'director@colegio.com',
    password: 'password123'
  });

  if (!loginResp.exito) {
    console.log('❌ Error en login:', loginResp.error);
    return;
  }

  token = loginResp.datos.token;
  console.log('✅ Login exitoso');
  console.log(`   Token: ${token.substring(0, 20)}...`);
  console.log(`   Usuario: ${loginResp.datos.usuario.nombre}\n`);

  // Prueba de alumnos
  console.log('📋 PASO 2: Listar Alumnos\n');
  const alumnosResp = await request('GET', '/alumnos');
  if (alumnosResp.exito) {
    console.log(`✅ Alumnos obtenidos: ${alumnosResp.datos.alumnos.length}`);
    console.log(`   Primer alumno: ${alumnosResp.datos.alumnos[0].primer_nombre} ${alumnosResp.datos.alumnos[0].apellido_paterno}\n`);
  } else {
    console.log('❌ Error:', alumnosResp.error);
  }

  // Prueba de profesores
  console.log('👨‍🏫 PASO 3: Listar Profesores\n');
  const profesoresResp = await request('GET', '/profesores');
  if (profesoresResp.exito) {
    console.log(`✅ Profesores obtenidos: ${profesoresResp.datos.profesores.length}`);
    if (profesoresResp.datos.profesores.length > 0) {
      console.log(`   Primer profesor: ${profesoresResp.datos.profesores[0].primer_nombre}\n`);
    }
  } else {
    console.log('❌ Error:', profesoresResp.error);
  }

  // Prueba de cursos
  console.log('📚 PASO 4: Listar Cursos\n');
  const cursosResp = await request('GET', '/cursos');
  if (cursosResp.exito) {
    console.log(`✅ Cursos obtenidos: ${cursosResp.datos.cursos.length}`);
    if (cursosResp.datos.cursos.length > 0) {
      console.log(`   Primer curso: ${cursosResp.datos.cursos[0].nombre}\n`);
    }
  } else {
    console.log('❌ Error:', cursosResp.error);
  }

  // Prueba de matrículas
  console.log('📝 PASO 5: Listar Matrículas\n');
  const matriculasResp = await request('GET', '/matriculas');
  if (matriculasResp.exito) {
    console.log(`✅ Matrículas obtenidas: ${matriculasResp.datos.matriculas.length}\n`);
  } else {
    console.log('❌ Error:', matriculasResp.error);
  }

  // Prueba de pagos
  console.log('💳 PASO 6: Listar Pagos\n');
  const pagosResp = await request('GET', '/pagos');
  if (pagosResp.exito) {
    console.log(`✅ Pagos obtenidos: ${pagosResp.datos.pagos.length}`);
    const pagoPendiente = pagosResp.datos.pagos.filter(p => p.estado === 'pendiente').length;
    console.log(`   Pagos pendientes: ${pagoPendiente}\n`);
  } else {
    console.log('❌ Error:', pagosResp.error);
  }

  // Prueba de información del usuario
  console.log('👤 PASO 7: Información del Usuario Autenticado\n');
  const meResp = await request('GET', '/me');
  if (meResp.exito) {
    console.log('✅ Información obtenida:');
    console.log(`   ID: ${meResp.datos.id}`);
    console.log(`   Nombre: ${meResp.datos.nombre}`);
    console.log(`   Email: ${meResp.datos.email}`);
    console.log(`   Rol: ${meResp.datos.tipo_usuario}\n`);
  } else {
    console.log('❌ Error:', meResp.error);
  }

  console.log('═══════════════════════════════════════════════');
  console.log('✨ Pruebas completadas\n');
}

setTimeout(ejecutarPruebas, 500);
