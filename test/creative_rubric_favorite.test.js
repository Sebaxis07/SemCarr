const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../config/rules');

test('Criterio de peso 20: Excelente 20, Bueno 16, Regular 10, Básico 4. Cualquier otro nivel se rechaza.', () => {
  const criterios = [{ id: 'c1', peso: 20 }];

  assert.equal(rules.calculateDocenteScore(criterios, { c1: 'Excelente' }), 20);
  assert.equal(rules.calculateDocenteScore(criterios, { c1: 'Bueno' }), 16);
  assert.equal(rules.calculateDocenteScore(criterios, { c1: 'Regular' }), 10);
  assert.equal(rules.calculateDocenteScore(criterios, { c1: 'Básico' }), 4);
  assert.equal(rules.calculateDocenteScore(criterios, { c1: 'Basico' }), 4);

  // Cualquier otro nivel se rechaza
  assert.throws(() => {
    rules.calculateDocenteScore(criterios, { c1: 'Insatisfactorio' });
  }, /inválido|no permitido|revisión/i);

  assert.throws(() => {
    rules.calculateDocenteScore(criterios, { c1: 'Pésimo' });
  }, /inválido|no permitido/i);
});

test('Desafío entregado: solo al llevarlo gana los 4000 puntos. Las notas docentes no otorgan puntos (gradePts = 0)', () => {
  const creativeChallenges = {
    status: {
      Terror: { delivered: true },
      Shooter: { delivered: false },
      Action: { delivered: true }
    },
    rubrics: {
      Terror: { notaPromedio: 80 },
      Shooter: { notaPromedio: 95 },
      Action: { notaPromedio: 60 }
    }
  };

  const res = rules.calculateCreativeScores(creativeChallenges);
  // Al entregar gana 4000 puntos
  assert.equal(res.pointsAwarded.Terror, 4000, 'Terror entregó, debe ganar exactamente 4000 pts');
  assert.equal(res.breakdown.Terror.deliveryPts, 4000);
  assert.equal(res.breakdown.Terror.gradePts, 0, 'La nota docente no suma puntos (0 pts)');
  assert.equal(res.breakdown.Terror.favoritePts, 0, 'No hay puntos por obra favorita');

  // Sin entrega recibe 0 puntos
  assert.equal(res.pointsAwarded.Shooter, 0, 'Shooter no entregó, debe tener 0 pts');
  assert.equal(res.breakdown.Shooter.deliveryPts, 0);

  // Action entregó, gana 4000 puntos
  assert.equal(res.pointsAwarded.Action, 4000, 'Action entregó, debe ganar 4000 pts');
});

test('Terror con 83 y 87 (85), Shooter con 85 y 89 (87), Action con 85 y 91 (88): Action gana Mención de Honor, pero no suma puntos extra', () => {
  // Terror: avg 85
  // Shooter: avg 87
  // Action: avg 88 -> Mejor nota
  const creativeChallenges = {
    status: {
      Terror: { delivered: true },
      Shooter: { delivered: true },
      Action: { delivered: true }
    },
    rubrics: {
      Terror: { docente1Nota: 83, docente2Nota: 87, notaPromedio: 85 },
      Shooter: { docente1Nota: 85, docente2Nota: 89, notaPromedio: 87 },
      Action: { docente1Nota: 85, docente2Nota: 91, notaPromedio: 88 }
    }
  };

  const res = rules.calculateCreativeScores(creativeChallenges);

  // Todas reciben 4000 pts al entregar
  assert.equal(res.pointsAwarded.Terror, 4000);
  assert.equal(res.pointsAwarded.Shooter, 4000);
  assert.equal(res.pointsAwarded.Action, 4000);

  // Ninguna recibe puntos por nota ni por obra favorita
  assert.equal(res.breakdown.Terror.gradePts, 0);
  assert.equal(res.breakdown.Shooter.gradePts, 0);
  assert.equal(res.breakdown.Action.gradePts, 0);
  assert.equal(res.breakdown.Action.favoritePts, 0);

  // Mención de Honor es para Action (mejor nota)
  assert.equal(res.favoriteAllianceText, 'Action');
  assert.equal(res.mencionHonorText, 'Action');
  assert.deepEqual(res.favoriteAlliances, ['Action']);
  assert.equal(res.breakdown.Action.mencionHonor, true);
  assert.equal(res.breakdown.Terror.mencionHonor, false);
});

test('Mención de Honor empatada entre dos o tres: mención compartida sin otorgar puntos', () => {
  // Empate entre Terror y Shooter con 88
  const dosEmpatadas = {
    status: { Terror: { delivered: true }, Shooter: { delivered: true }, Action: { delivered: true } },
    rubrics: {
      Terror: { notaPromedio: 88 },
      Shooter: { notaPromedio: 88 },
      Action: { notaPromedio: 80 }
    }
  };

  const resDos = rules.calculateCreativeScores(dosEmpatadas);
  assert.equal(resDos.pointsAwarded.Terror, 4000);
  assert.equal(resDos.pointsAwarded.Shooter, 4000);
  assert.equal(resDos.favoritePointsPerAlliance.Terror, 0, 'No reparte puntos en empate');
  assert.equal(resDos.favoritePointsPerAlliance.Shooter, 0);
  assert.match(resDos.favoriteAllianceText, /Terror.*Shooter/);
  assert.equal(resDos.breakdown.Terror.mencionHonor, true);
  assert.equal(resDos.breakdown.Shooter.mencionHonor, true);
  assert.equal(resDos.breakdown.Action.mencionHonor, false);

  // Empate triple (las tres con 88)
  const tresEmpatadas = {
    status: { Terror: { delivered: true }, Shooter: { delivered: true }, Action: { delivered: true } },
    rubrics: {
      Terror: { notaPromedio: 88 },
      Shooter: { notaPromedio: 88 },
      Action: { notaPromedio: 88 }
    }
  };

  const resTres = rules.calculateCreativeScores(tresEmpatadas);
  assert.equal(resTres.pointsAwarded.Terror, 4000);
  assert.equal(resTres.pointsAwarded.Shooter, 4000);
  assert.equal(resTres.pointsAwarded.Action, 4000);
  assert.equal(resTres.favoritePointsPerAlliance.Terror, 0);
  assert.equal(resTres.favoritePointsPerAlliance.Shooter, 0);
  assert.equal(resTres.favoritePointsPerAlliance.Action, 0);
  assert.equal(resTres.favoriteAlliances.length, 3);
});

test('Notas 60 y 85: queda en "revisión conjunta pendiente" y no entra a la mención de honor', () => {
  // Terror tiene notas 60 y 85 (diferencia 25 > 20)
  // Shooter tiene 70 y 70 (promedio 70)
  const creativeChallenges = {
    status: { Terror: { delivered: true }, Shooter: { delivered: true }, Action: { delivered: true } },
    rubrics: {
      Terror: {
        docente1Nota: 60,
        docente2Nota: 85,
        notaPromedio: 72.5,
        discrepancyAlert: true,
        estado: 'revisión conjunta pendiente',
        discrepancyResolved: false
      },
      Shooter: {
        docente1Nota: 70,
        docente2Nota: 70,
        notaPromedio: 70,
        discrepancyAlert: false,
        discrepancyResolved: true
      },
      Action: {
        docente1Nota: 65,
        docente2Nota: 65,
        notaPromedio: 65,
        discrepancyAlert: false,
        discrepancyResolved: true
      }
    }
  };

  const res = rules.calculateCreativeScores(creativeChallenges);

  // Al haber entregado, todas tienen sus 4000 pts
  assert.equal(res.pointsAwarded.Terror, 4000);
  assert.equal(res.pointsAwarded.Shooter, 4000);

  // Pero Terror está en discrepancia, por lo que no puede ganar la Mención de Honor
  assert.equal(res.breakdown.Terror.isPendingDiscrepancy, true);
  assert.equal(res.breakdown.Terror.mencionHonor, false);
  assert.equal(res.favoriteAllianceText, 'Shooter', 'Shooter se lleva la mención de honor provisional por ser la nota válida definitiva más alta');
  assert.equal(res.hasProvisional, true, 'Debe alertar que hay notas provisorias');
});

test('Asignación docente individual: Prof. Eduardo califica Terror y Shooter (definitiva), Prof. Natalia califica Action (definitiva)', () => {
  // Prof. Eduardo evalúa Terror (92) y Shooter (86). Prof. Natalia evalúa Action (90).
  const creativeChallenges = {
    status: {
      Terror: { delivered: true, evaluated: true },
      Shooter: { delivered: true, evaluated: true },
      Action: { delivered: true, evaluated: true }
    },
    rubrics: {
      Terror: { docente1Nota: 92, notaPromedio: 92, estado: 'definitiva', notaDefinitiva: true },
      Shooter: { docente1Nota: 86, notaPromedio: 86, estado: 'definitiva', notaDefinitiva: true },
      Action: { docente2Nota: 90, notaPromedio: 90, estado: 'definitiva', notaDefinitiva: true }
    }
  };

  const res = rules.calculateCreativeScores(creativeChallenges);

  // Cada alianza que entregó recibe 4000 pts oficiales
  assert.equal(res.pointsAwarded.Terror, 4000);
  assert.equal(res.pointsAwarded.Shooter, 4000);
  assert.equal(res.pointsAwarded.Action, 4000);

  // Terror tiene la nota más alta (92 de Prof. Eduardo), gana Mención de Honor
  assert.equal(res.mencionHonorText, 'Terror');
  assert.equal(res.breakdown.Terror.mencionHonor, true);
  assert.equal(res.breakdown.Action.mencionHonor, false);
  assert.equal(res.breakdown.Shooter.mencionHonor, false);
});

