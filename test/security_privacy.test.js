const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = require('../server');

const ROOT_DIR = path.resolve(__dirname, '..');
const RUT_REGEX = /\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b/i;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@inacapmail\.cl|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;

// 1. Verificar eliminación del portal público y ausencia de datos sensibles en estáticos
test('Seguridad P0: Portal público eliminado y sin public/students-data.js', () => {
  const removedPaths = [
    path.join(ROOT_DIR, 'public', 'students-data.js'),
    path.join(ROOT_DIR, 'public', 'index.html'),
    path.join(ROOT_DIR, 'public', 'app.js'),
    path.join(ROOT_DIR, 'public', 'src'),
    path.join(ROOT_DIR, 'alianzas')
  ];
  for (const targetPath of removedPaths) {
    assert.strictEqual(fs.existsSync(targetPath), false, `${targetPath} no debe existir en modo solo-admin`);
  }
});

test('Seguridad P0: Ningún archivo estático público debe exponer RUTs reales ni correos institucionales', () => {
  const publicDir = path.join(ROOT_DIR, 'public');
  const allowedExtensions = ['.html', '.js', '.json'];

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (allowedExtensions.includes(path.extname(entry.name).toLowerCase())) {
        const content = fs.readFileSync(fullPath, 'utf8');

        // Buscar correos institucionales o personales
        const emailMatch = content.match(EMAIL_REGEX);
        assert.strictEqual(
          emailMatch,
          null,
          `Se encontró un correo en archivo público: ${fullPath} (${emailMatch?.[0]})`
        );

        // Buscar RUTs reales
        const rutMatch = content.match(RUT_REGEX);
        assert.strictEqual(
          rutMatch,
          null,
          `Se encontró un RUT en archivo público: ${fullPath} (${rutMatch?.[0]})`
        );
      }
    }
  }

  scanDir(publicDir);
});

// 2. Pruebas de API y rutas contra el servidor en vivo (Modo Solo Admin)
test('Seguridad P0: Rutas y APIs públicas eliminadas (404) y endpoints admin protegidos (401)', async (t) => {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => server.close());

  await t.test('Rutas web públicas (/, /alianzas) devuelven 404 y /admin responde 200', async () => {
    const resRoot = await fetch(`${baseUrl}/`);
    assert.strictEqual(resRoot.status, 404, '/ debe devolver 404');

    const resAlianzas = await fetch(`${baseUrl}/alianzas`);
    assert.strictEqual(resAlianzas.status, 404, '/alianzas debe devolver 404');

    const resAdmin = await fetch(`${baseUrl}/admin`);
    assert.strictEqual(resAdmin.status, 200, '/admin debe responder 200');
  });

  await t.test('APIs públicas eliminadas devuelven 404', async () => {
    const removedEndpoints = [
      '/api/data',
      '/api/students/by-alliance',
      '/api/tarreo/inscritos',
      '/api/public/alliance/stats'
    ];
    for (const ep of removedEndpoints) {
      const res = await fetch(`${baseUrl}${ep}`);
      assert.strictEqual(res.status, 404, `${ep} debe devolver 404`);
    }
  });

  await t.test('Endpoints compartidos/admin rechazan acceso sin token (401)', async () => {
    const protectedEndpoints = [
      '/api/stats',
      '/api/students/search?q=Juan',
      '/api/admin/event/grade-prizes'
    ];
    for (const ep of protectedEndpoints) {
      const res = await fetch(`${baseUrl}${ep}`);
      assert.strictEqual(res.status, 401, `${ep} debe devolver 401 sin autenticación`);
    }
  });
});
