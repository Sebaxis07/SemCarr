const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../server');

test('Sincronizacion CSV: /Alumn queda bloqueado por HTTP retornando 404', async () => {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const resUpper = await fetch(`${baseUrl}/Alumn/participantes-semana-carrera-2026-11-14.csv`);
    assert.strictEqual(resUpper.status, 404, 'La ruta /Alumn debe responder 404');

    const resLower = await fetch(`${baseUrl}/alumn/participantes-semana-carrera-2026-11-14.csv`);
    assert.strictEqual(resLower.status, 404, 'La ruta /alumn debe responder 404');
  } finally {
    server.close();
  }
});

test('Sincronizacion CSV: /api/stats autenticado entrega los 57 alumnos del formulario en Inf/', async () => {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'InacapAdmin2026!' })
    });
    assert.strictEqual(loginRes.status, 200);
    const { token } = await loginRes.json();

    const res = await fetch(`${baseUrl}/api/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(res.ok, true);
    const data = await res.json();

    assert.strictEqual(data.alliances.Terror.totalStudents, 29, 'Terror debe tener 29 alumnos inscritos');
    assert.strictEqual(data.alliances.Shooter.totalStudents, 14, 'Shooter debe tener 14 alumnos inscritos');
    assert.strictEqual(data.alliances.Action.totalStudents, 14, 'Action debe tener 14 alumnos inscritos');

    const total = data.alliances.Terror.totalStudents + data.alliances.Shooter.totalStudents + data.alliances.Action.totalStudents;
    assert.strictEqual(total, 57, 'El total de inscritos debe ser exactamente 57');
  } finally {
    server.close();
  }
});

test('Lista de Alianzas: /api/admin/alliances-overview entrega alianzas, integrantes y actividades', async () => {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'InacapAdmin2026!' })
    });
    assert.strictEqual(loginRes.status, 200);
    const { token } = await loginRes.json();

    const res = await fetch(`${baseUrl}/api/admin/alliances-overview`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    assert.ok(data.alliances.Terror && data.alliances.Shooter && data.alliances.Action);
    assert.strictEqual(data.alliances.Terror.totalStudents, 29);
    assert.strictEqual(data.alliances.Shooter.totalStudents, 14);
    assert.strictEqual(data.alliances.Action.totalStudents, 14);
    assert.ok(Array.isArray(data.alliances.Terror.students[0].activities), 'Cada integrante debe incluir su arreglo de actividades');
  } finally {
    server.close();
  }
});

test('Sincronizacion CSV: Buscador admin encuentra alumnos con la alianza elegida en el formulario', async () => {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'InacapAdmin2026!' })
    });
    assert.strictEqual(loginRes.status, 200);
    const { token } = await loginRes.json();

    // Makarena se inscribio en Terror en el formulario
    const res = await fetch(`${baseUrl}/api/students/search?q=Makarena`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(res.ok, true);
    const list = await res.json();
    assert.strictEqual(list.length > 0, true);
    const makarena = list.find(s => s.name.toLowerCase().includes('makarena'));
    assert.strictEqual(!!makarena, true);
    assert.strictEqual(makarena.alliance, 'Terror', 'Makarena debe pertenecer a Terror segun el formulario');
  } finally {
    server.close();
  }
});
