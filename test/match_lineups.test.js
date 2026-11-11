const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../config/rules');

test('Alineaciones: Baby Fútbol valida paridad y mínimo de 5 jugadores por equipo en cancha', () => {
  // 5 vs 5: cumple paridad y mínimo
  const v5v5 = rules.validateMatchLineup('babyfutbol', 5, 5);
  assert.equal(v5v5.valid, true);

  // 6 vs 6: titulares con suplente habilitado (máx 7)
  const v6v6 = rules.validateMatchLineup('babyfutbol', 6, 6);
  assert.equal(v6v6.valid, true);

  // 5 vs 4: disparidad y una alianza no cumple el mínimo
  const v5v4 = rules.validateMatchLineup('babyfutbol', 5, 4);
  assert.equal(v5v4.valid, false);
  assert.match(v5v4.error, /misma cantidad de jugadores/i);

  // 4 vs 4: tienen paridad pero no cumplen el mínimo de 5
  const v4v4 = rules.validateMatchLineup('babyfutbol', 4, 4);
  assert.equal(v4v4.valid, false);
  assert.match(v4v4.error, /mínimo reglamentario es de 5/i);
});

test('Alineaciones: Excepción de administración autoriza disparidad si se deja un motivo', () => {
  // 5 vs 4 con motivo registrado
  const exc = rules.validateMatchLineup('babyfutbol', 5, 4, {
    allowException: true,
    exceptionReason: 'Lesión imprevista de jugador titular sin más suplentes disponibles en cancha',
    authorizedBy: 'Coordinador Deportivo'
  });

  assert.equal(exc.valid, true);
  assert.equal(exc.hasException, true);
  assert.equal(exc.exceptionReason, 'Lesión imprevista de jugador titular sin más suplentes disponibles en cancha');
});

test('Alineaciones: Quemadas (mín 6), Retro (mín 4), Taca-taca y Ping Pong (mín 2)', () => {
  // Quemadas
  assert.equal(rules.validateMatchLineup('quemadas', 6, 6).valid, true);
  assert.equal(rules.validateMatchLineup('quemadas', 6, 5).valid, false);

  // Retro
  assert.equal(rules.validateMatchLineup('retro', 4, 4).valid, true);
  assert.equal(rules.validateMatchLineup('retro', 3, 3).valid, false);

  // Taca-Taca
  assert.equal(rules.validateMatchLineup('tacataca', 2, 2).valid, true);
  assert.equal(rules.validateMatchLineup('tacataca', 2, 1).valid, false);

  // Ping Pong
  assert.equal(rules.validateMatchLineup('pingpong', 2, 2).valid, true);
  assert.equal(rules.validateMatchLineup('pingpong', 2, 1).valid, false);
});
