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

test('Sincronizacion CSV: /api/students/by-alliance entrega los 39 alumnos del formulario', async () => {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/students/by-alliance`);
    assert.strictEqual(res.ok, true);
    const data = await res.json();

    assert.strictEqual(data.Terror.length, 19, 'Terror debe tener 19 alumnos inscritos');
    assert.strictEqual(data.Shooter.length, 10, 'Shooter debe tener 10 alumnos inscritos');
    assert.strictEqual(data.Action.length, 10, 'Action debe tener 10 alumnos inscritos');

    const total = data.Terror.length + data.Shooter.length + data.Action.length;
    assert.strictEqual(total, 39, 'El total de inscritos debe ser exactamente 39');
  } finally {
    server.close();
  }
});

test('Sincronizacion CSV: Buscador publico encuentra alumnos con la alianza elegida en el formulario', async () => {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Makarena se inscribio en Terror en el formulario
    const res = await fetch(`${baseUrl}/api/students/search?q=Makarena`);
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
