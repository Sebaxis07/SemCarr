const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = require('../server');

const ROOT_DIR = path.resolve(__dirname, '..');
const RUT_REGEX = /\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b/i;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@inacapmail\.cl|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;

// 1. Verificar archivos estáticos públicos
test('Seguridad P0: No debe existir public/students-data.js ni etiquetas script que lo carguen', () => {
  const studentsDataPath = path.join(ROOT_DIR, 'public', 'students-data.js');
  assert.strictEqual(fs.existsSync(studentsDataPath), false, 'public/students-data.js no debe existir en el sistema de archivos');

  const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'public', 'index.html'), 'utf8');
  assert.doesNotMatch(indexHtml, /students-data\.js/i, 'public/index.html no debe incluir script de students-data.js');
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

// 2. Pruebas de API contra el servidor en vivo
test('Seguridad P0: Respuestas de API pública no deben filtrar RUT ni correo', async (t) => {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => server.close());

  // Test /api/students/search por nombre
  await t.test('Buscador público devuelve únicamente nombre, alianza y carrera (sin RUT ni correo ni id)', async () => {
    const res = await fetch(`${baseUrl}/api/students/search?q=Juan`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0, 'Debe encontrar estudiantes por nombre');

    for (const item of data) {
      assert.ok(item.name, 'Debe incluir nombre');
      assert.ok(item.alliance, 'Debe incluir alianza');
      assert.ok(item.carrera, 'Debe incluir carrera');
      assert.strictEqual(item.rut, undefined, 'Nunca debe exponer rut');
      assert.strictEqual(item.email, undefined, 'Nunca debe exponer email');
      assert.strictEqual(item.id, undefined, 'No debe exponer id interno en búsqueda pública');
    }
  });

  // Test /api/students/search por RUT: NO debe confirmar existencia
  await t.test('Buscador público no confirma si un RUT existe cuando se consulta por RUT', async () => {
    // 20954022-3 es un RUT real de un alumno en students.json
    const realRutQuery = '20954022-3';
    const resReal = await fetch(`${baseUrl}/api/students/search?q=${encodeURIComponent(realRutQuery)}`);
    assert.strictEqual(resReal.status, 200);
    const dataReal = await resReal.json();
    assert.deepStrictEqual(dataReal, [], 'Consulta por RUT real debe devolver lista vacía en modo público');

    // RUT no existente
    const fakeRutQuery = '99999999-9';
    const resFake = await fetch(`${baseUrl}/api/students/search?q=${encodeURIComponent(fakeRutQuery)}`);
    assert.strictEqual(resFake.status, 200);
    const dataFake = await resFake.json();
    assert.deepStrictEqual(dataFake, [], 'Consulta por RUT falso debe devolver lista vacía');
  });

  // Test /api/students/by-alliance
  await t.test('Padrón por alianza nunca entrega RUT ni correo', async () => {
    const res = await fetch(`${baseUrl}/api/students/by-alliance`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.Terror && data.Shooter && data.Action);

    ['Terror', 'Shooter', 'Action'].forEach(al => {
      data[al].forEach(st => {
        assert.strictEqual(st.rut, undefined, 'Padrón de alianza no debe tener rut');
        assert.strictEqual(st.email, undefined, 'Padrón de alianza no debe tener email');
      });
    });
  });

  // Test /api/data público
  await t.test('Respuesta de /api/data no contiene patrones de RUT ni correo', async () => {
    const res = await fetch(`${baseUrl}/api/data`);
    assert.strictEqual(res.status, 200);
    const rawText = await res.text();
    assert.doesNotMatch(rawText, RUT_REGEX, 'Respuesta de /api/data no debe contener RUT');
    assert.doesNotMatch(rawText, EMAIL_REGEX, 'Respuesta de /api/data no debe contener correo');
  });

  // Test Rate Limiting
  await t.test('Buscador público aplica límite de intentos por dispositivo (rate limit 429)', async () => {
    let hit429 = false;
    for (let i = 0; i < 40; i++) {
      const r = await fetch(`${baseUrl}/api/students/search?q=test`);
      if (r.status === 429) {
        hit429 = true;
        break;
      }
    }
    assert.strictEqual(hit429, true, 'Debe devolver código 429 al superar el límite de búsquedas');
  });
});
