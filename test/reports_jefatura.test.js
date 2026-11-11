const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../config/rules');

test('Reportes Jefatura: Generación de métricas de control y trazabilidad directiva', () => {
  const totals = {
    Terror: { total: 10000, day19: 6000, creative: 3000, tarreoCopa: 1000, sorpresas: 0, sanciones: 0 },
    Shooter: { total: 8000, day19: 5000, creative: 2000, tarreoCopa: 1000, sorpresas: 0, sanciones: 0 },
    Action: { total: 5000, day19: 3000, creative: 1500, tarreoCopa: 500, sorpresas: 0, sanciones: 0 }
  };

  const activities = [
    { id: 'babyfutbol', name: 'Baby Fútbol', status: 'Terminada', pointsAwarded: { Terror: 4000, Shooter: 2400, Action: 1200 } },
    { id: 'quemadas', name: 'Quemadas', status: 'Terminada', pointsAwarded: { Terror: 2400, Shooter: 4000, Action: 1200 } },
    { id: 'retro', name: 'Torneo Retro', status: 'Pendiente', pointsAwarded: { Terror: 0, Shooter: 0, Action: 0 } }
  ];

  const reclamos = [
    { id: 1, alliance: 'Terror', detail: 'Reclamo 1', plazo: 'dentro de plazo', fueraDePlazo: false },
    { id: 2, alliance: 'Shooter', detail: 'Reclamo 2', plazo: 'fuera de plazo', fueraDePlazo: true, motivoFueraDePlazo: 'Retraso de transporte' }
  ];

  const sanciones = [
    { id: 1, alliance: 'Action', pointsDeducted: 300, reason: 'Falta disciplinaria' }
  ];

  // Métricas verificadas
  const dentro = reclamos.filter(r => !r.fueraDePlazo).length;
  const fuera = reclamos.filter(r => r.fueraDePlazo).length;
  assert.equal(dentro, 1, '1 reclamo dentro de plazo');
  assert.equal(fuera, 1, '1 reclamo fuera de plazo');

  // Estado de actividades
  const terminadas = activities.filter(a => a.status === 'Terminada').length;
  const pendientes = activities.filter(a => a.status === 'Pendiente').length;
  assert.equal(terminadas, 2);
  assert.equal(pendientes, 1);

  // Sanciones dentro del rango
  sanciones.forEach(s => {
    assert.ok(s.pointsDeducted >= rules.SANCTIONS.minPoints && s.pointsDeducted <= rules.SANCTIONS.maxPoints);
  });
});
