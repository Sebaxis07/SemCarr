const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../server');
const security = require('../server_security');

test('Tunel Admin: Requiere autenticacion y rol admin/coordinacion', async (t) => {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => server.close());

  await t.test('Sin token devuelve 401 en status/start/stop', async () => {
    const r1 = await fetch(`${baseUrl}/api/admin/tunnel/status`);
    assert.strictEqual(r1.status, 401);

    const r2 = await fetch(`${baseUrl}/api/admin/tunnel/start`, { method: 'POST' });
    assert.strictEqual(r2.status, 401);

    const r3 = await fetch(`${baseUrl}/api/admin/tunnel/stop`, { method: 'POST' });
    assert.strictEqual(r3.status, 401);
  });

  await t.test('Rol docente no puede consultar ni controlar el tunel (403)', async () => {
    const session = security.createSession({ username: 'docente1', name: 'Docente 1', role: 'docente' }, '127.0.0.1');

    const r = await fetch(`${baseUrl}/api/admin/tunnel/status`, {
      headers: { 'Authorization': `Bearer ${session.token}` }
    });
    assert.strictEqual(r.status, 403);
  });

  await t.test('Admin autenticado recibe estado del tunel y lanUrl', async () => {
    const loginAdmin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'InacapAdmin2026!' })
    });
    assert.strictEqual(loginAdmin.status, 200);
    const { token } = await loginAdmin.json();

    const r = await fetch(`${baseUrl}/api/admin/tunnel/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(r.status, 200);
    const data = await r.json();
    assert.strictEqual(data.active, false);
    assert.ok(data.lanUrl && data.lanUrl.endsWith('/admin'), 'Debe incluir lanUrl hacia /admin');
  });
});
