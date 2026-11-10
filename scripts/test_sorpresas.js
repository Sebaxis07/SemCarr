const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch(e) { json = body; }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function login(username, password) {
  const res = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username, password });

  if (res.status !== 200 || !res.data.token) {
    throw new Error(`Login failed for ${username}: ${JSON.stringify(res.data)}`);
  }
  return res.data.token;
}

async function runTests() {
  console.log('=== INICIANDO PRUEBAS DE PRUEBAS SORPRESA ===\n');

  // 1. Iniciar sesión como staff y como admin
  console.log('1. Autenticación...');
  const staffToken = await login('staff', 'StaffPuntos2026!');
  const adminToken = await login('admin', 'InacapAdmin2026!');
  console.log('✔ Staff y Admin autenticados con éxito.\n');

  // 2. Staff consulta el banco de sorpresas
  console.log('2. Consultar banco de sorpresas como Staff...');
  const bankRes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/admin/sorpresas/bank',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  console.log(`Status: ${bankRes.status}, Total en banco: ${bankRes.data.bank?.length}`);
  if (bankRes.status !== 200 || bankRes.data.bank?.length !== 7) {
    throw new Error('Banco no devolvió 7 sorpresas');
  }
  const piramide = bankRes.data.bank.find(s => s.name.includes('Pirámide'));
  if (!piramide || !piramide.careNotes?.includes('ALERTA DE SEGURIDAD')) {
    throw new Error('Pirámide humana no tiene alerta de seguridad');
  }
  console.log('✔ Banco verificado con las 7 sorpresas y alerta de seguridad en pirámide.\n');

  // 3. Staff intenta crear una prueba en el banco (debe dar 403 Forbidden - solo admin)
  console.log('3. Probar restricción de creación en banco (Staff debe recibir 403)...');
  const staffAddRes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/admin/sorpresas/bank',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' }
  }, {
    name: 'Prueba Hack',
    description: 'No permitida',
    duration: 3,
    decisionType: 'medicion',
    pointsDistribution: [500, 300, 150],
    checklist: { voluntaria: true, sinRiesgo: true, sinContacto: true, sinHumillacion: true }
  });
  console.log(`Status devuelto a staff al intentar añadir al banco: ${staffAddRes.status}`);
  if (staffAddRes.status !== 403) {
    throw new Error(`Se esperaba 403 pero se obtuvo ${staffAddRes.status}`);
  }
  console.log('✔ Restricción de permisos verificada: Solo Admin puede agregar al banco.\n');

  // 4. Admin intenta crear prueba con checklist de seguridad incompleto (debe fallar 400)
  console.log('4. Validación de checklist de seguridad obligatorio al crear...');
  const unsafeRes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/admin/sorpresas/bank',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, {
    name: 'Prueba Insegura',
    description: 'Falta checklist',
    duration: 3,
    decisionType: 'medicion',
    pointsDistribution: [500, 300, 150],
    checklist: { voluntaria: true, sinRiesgo: false, sinContacto: true, sinHumillacion: true }
  });
  console.log(`Status de prueba con checklist incompleto: ${unsafeRes.status} (${unsafeRes.data.error})`);
  if (unsafeRes.status !== 400) {
    throw new Error('Debió fallar con 400 por checklist incompleto');
  }
  console.log('✔ Validación de seguridad aprobada: exige los 4 puntos del checklist.\n');

  // 5. Lanzar "Alianza más caracterizada" (Jurado) como staff
  console.log('5. Lanzar prueba sorpresa como Staff...');
  const launchRes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/admin/sorpresas/launch',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' }
  }, {
    sorpresaId: 'sorp_caracterizada'
  });
  console.log(`Status lanzamiento: ${launchRes.status}, Mensaje: ${launchRes.data.message}`);
  if (launchRes.status !== 200 || !launchRes.data.activeSorpresa) {
    throw new Error('Fallo al lanzar prueba');
  }
  console.log(`✔ Prueba "${launchRes.data.activeSorpresa.name}" lanzada en vivo.\n`);

  // 6. Verificar privacidad en portal público (/api/stats)
  console.log('6. Verificar privacidad en endpoint público /api/stats...');
  const statsRes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/stats',
    method: 'GET'
  });
  if (statsRes.data.sorpresasBank) {
    throw new Error('VULNERABILIDAD DE PRIVACIDAD: sorpresasBank está expuesto al público en /api/stats');
  }
  if (!statsRes.data.activeSorpresa || statsRes.data.activeSorpresa.id !== 'sorp_caracterizada') {
    throw new Error('La prueba activa no está visible públicamente en /api/stats');
  }
  console.log('✔ Privacidad verificada: El banco está oculto al público y la prueba activa se muestra en vivo.\n');

  // 7. Registrar resultado por jurado (3 jueces)
  console.log('7. Registrar resultado por Jurado (3 jueces)...');
  // Juez 1: Terror 1, Shooter 2, Action 3 (sum: T=1, S=2, A=3)
  // Juez 2: Terror 1, Shooter 2, Action 3 (sum: T=2, S=4, A=6)
  // Juez 3: Terror 2, Shooter 1, Action 3 (sum: T=4, S=5, A=9)
  // Total sum: Terror=4 (1°), Shooter=5 (2°), Action=9 (3°)
  const recordRes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/admin/sorpresas/record',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' }
  }, {
    details: {
      judges: {
        judge1: { Terror: 1, Shooter: 2, Action: 3 },
        judge2: { Terror: 1, Shooter: 2, Action: 3 },
        judge3: { Terror: 2, Shooter: 1, Action: 3 }
      }
    }
  });
  console.log(`Status resultado: ${recordRes.status}`);
  const awarded = recordRes.data.sorpresa?.pointsAwarded;
  console.log('Puntos asignados:', awarded);
  if (recordRes.status !== 200 || !awarded) {
    throw new Error(`Error al registrar resultado: ${JSON.stringify(recordRes.data)}`);
  }
  if (awarded.Terror !== 500 || awarded.Shooter !== 300 || awarded.Action !== 150) {
    throw new Error(`Puntos no coinciden con los esperados (500, 300, 150). Obtenido: ${JSON.stringify(awarded)}`);
  }
  console.log('✔ Resultados y puntajes registrados y sumados al marcador correctamente.\n');

  // 8. Verificar que activeSorpresa se limpió y el marcador se actualizó
  console.log('8. Verificar actualización del marcador en /api/stats...');
  const statsAfterRes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/stats',
    method: 'GET'
  });
  if (statsAfterRes.data.activeSorpresa !== null) {
    throw new Error('activeSorpresa debería ser null tras finalizar la prueba');
  }
  const tPts = statsAfterRes.data.alliances.Terror.points;
  console.log(`Terror pts -> Sorpresas: ${tPts.sorpresas}, Total: ${tPts.total}`);
  if (tPts.sorpresas !== 500) {
    throw new Error(`Terror debió tener 500 pts en sorpresas pero tiene ${tPts.sorpresas}`);
  }
  console.log('✔ Marcador general actualizado con éxito.\n');

  // 9. Probar prueba por Medición y Empate en 1° Lugar
  console.log('9. Probar prueba por Medición (Caza de Objetos) y Empate en 1° Lugar...');
  const launchCaza = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/admin/sorpresas/launch',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' }
  }, {
    sorpresaId: 'sorp_caza'
  });
  if (launchCaza.status !== 200) {
    throw new Error('Fallo al lanzar Caza de objetos');
  }

  // Empate en rondas ganadas: Terror=4 rondas, Shooter=4 rondas, Action=1 ronda
  // 1° y 2° empatan: (500 + 300) / 2 = 400 pts para Terror y Shooter. Action 3° = 150 pts.
  const recordEmpate = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/admin/sorpresas/record',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' }
  }, {
    details: {
      metrics: { Terror: 4, Shooter: 4, Action: 1 }
    }
  });
  console.log('Status registro empate:', recordEmpate.status);
  const ptsEmpate = recordEmpate.data.sorpresa?.pointsAwarded;
  console.log('Puntos repartidos por empate:', ptsEmpate);
  if (ptsEmpate.Terror !== 400 || ptsEmpate.Shooter !== 400 || ptsEmpate.Action !== 150) {
    throw new Error(`Cálculo de empate erróneo: esperado { Terror: 400, Shooter: 400, Action: 150 }, obtenido: ${JSON.stringify(ptsEmpate)}`);
  }
  console.log('✔ Sistema de desempate/reparto equitativo probado con éxito (400 pts c/u).\n');

  // 10. Probar tope de 6 sorpresas completadas
  console.log('10. Probar tope reglamentario de 6 sorpresas...');
  // Ya van 2 sorpresas registradas. Agreguemos 4 más directamente para llegar a 6
  for (let i = 3; i <= 6; i++) {
    await request({
      hostname: 'localhost',
      port: 5173,
      path: '/api/admin/sorpresas/launch',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' }
    }, { sorpresaId: 'sorp_silencio' });

    await request({
      hostname: 'localhost',
      port: 5173,
      path: '/api/admin/sorpresas/record',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' }
    }, {
      details: { metrics: { Terror: 1, Shooter: 2, Action: 3 } }
    });
  }
  console.log('✔ Se completaron 6 sorpresas.');

  // Intentar lanzar la 7ª sorpresa (debe ser rechazada con 400 por superar el tope de 6)
  const launch7 = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/admin/sorpresas/launch',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' }
  }, {
    sorpresaId: 'sorp_piramide'
  });
  console.log(`Status lanzamiento de la 7ª sorpresa: ${launch7.status} (${launch7.data.error})`);
  if (launch7.status !== 400) {
    throw new Error('Debió rechazar el lanzamiento de la 7ª sorpresa por superar el tope de 6');
  }
  console.log('✔ Bloqueo estricto del tope de 6 sorpresas verificado con éxito.\n');

  console.log('==================================================');
  console.log('✔ TODAS LAS PRUEBAS DE PRUEBAS SORPRESA PASARON EXITOSAMENTE!');
  console.log('==================================================');
}

runTests().catch(err => {
  console.error('❌ Error en pruebas:', err);
  process.exit(1);
});
