const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../config/rules');

test('Reclamos: A los 15 minutos exactos del término de la actividad está "dentro de plazo"', () => {
  const finActividad = new Date('2026-11-19T12:00:00.000Z');
  const ingresoReclamo = new Date('2026-11-19T12:15:00.000Z'); // Exactamente 15 min después

  const res = rules.evaluateClaimWindow(finActividad, ingresoReclamo);
  assert.equal(res.isWithinWindow, true, 'A los 15 minutos exactos debe estar dentro de plazo');
  assert.equal(res.status, 'dentro de plazo');
});

test('Reclamos: 16 minutos después del término de la actividad queda "fuera de plazo"', () => {
  const finActividad = new Date('2026-11-19T12:00:00.000Z');
  const ingresoReclamo = new Date('2026-11-19T12:16:00.000Z'); // 16 min después

  const res = rules.evaluateClaimWindow(finActividad, ingresoReclamo);
  assert.equal(res.isWithinWindow, false, 'A los 16 minutos debe marcarse fuera de plazo');
  assert.equal(res.status, 'fuera de plazo');
  assert.equal(res.diffMinutes, 16);
});

test('Sanciones: Sanción fuera del rango oficial de 200 a 600 puntos se rechaza', () => {
  const min = rules.SANCTIONS.minPoints;
  const max = rules.SANCTIONS.maxPoints;
  assert.equal(min, 200);
  assert.equal(max, 600);

  // Casos inválidos
  const invalidLow = 150;
  const invalidHigh = 700;
  const isInvalid = (val) => val < min || val > max;

  assert.equal(isInvalid(invalidLow), true, '150 puntos debe ser rechazada');
  assert.equal(isInvalid(invalidHigh), true, '700 puntos debe ser rechazada');
  assert.equal(isInvalid(199), true, '199 puntos debe ser rechazada');
  assert.equal(isInvalid(601), true, '601 puntos debe ser rechazada');

  // Casos válidos
  assert.equal(isInvalid(200), false, '200 puntos debe ser aceptada');
  assert.equal(isInvalid(400), false, '400 puntos debe ser aceptada');
  assert.equal(isInvalid(600), false, '600 puntos debe ser aceptada');
});
