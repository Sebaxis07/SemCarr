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

test('Desafío con promedio 80: 2000 por nota', () => {
  const creativeChallenges = {
    status: { Terror: { delivered: false }, Shooter: { delivered: false }, Action: { delivered: false } },
    rubrics: {
      Terror: { notaPromedio: 80 },
      Shooter: { notaPromedio: 50 },
      Action: { notaPromedio: 50 }
    }
  };

  const res = rules.calculateCreativeScores(creativeChallenges);
  assert.equal(res.breakdown.Terror.gradePts, 2000, 'Nota promedio 80 debe dar exactamente 2000 puntos docentes');
});

test('Terror con 83 y 87: 2125. Shooter con 85 y 89: 2175. Action con 85 y 91: 2200, y Action se lleva la obra favorita completa (500)', () => {
  // Terror: (83 + 87) / 2 = 85 -> 85% de 2500 = 2125
  // Shooter: (85 + 89) / 2 = 87 -> 87% de 2500 = 2175
  // Action: (85 + 91) / 2 = 88 -> 88% de 2500 = 2200
  // Obra favorita: Action tiene la nota más alta (88), se lleva los 500 puntos
  const creativeChallenges = {
    status: {
      Terror: { delivered: false },
      Shooter: { delivered: false },
      Action: { delivered: false }
    },
    rubrics: {
      Terror: { docente1Nota: 83, docente2Nota: 87, notaPromedio: 85 },
      Shooter: { docente1Nota: 85, docente2Nota: 89, notaPromedio: 87 },
      Action: { docente1Nota: 85, docente2Nota: 91, notaPromedio: 88 }
    }
  };

  const res = rules.calculateCreativeScores(creativeChallenges);

  assert.equal(res.breakdown.Terror.gradePts, 2125, 'Terror debe tener 2125 pts por nota');
  assert.equal(res.breakdown.Shooter.gradePts, 2175, 'Shooter debe tener 2175 pts por nota');
  assert.equal(res.breakdown.Action.gradePts, 2200, 'Action debe tener 2200 pts por nota');

  assert.equal(res.favoritePointsPerAlliance.Action, 500, 'Action debe llevarse los 500 pts de obra favorita');
  assert.equal(res.favoritePointsPerAlliance.Terror, 0);
  assert.equal(res.favoritePointsPerAlliance.Shooter, 0);
  assert.equal(res.favoriteAllianceText, 'Action');
});

test('Obra favorita empatada entre dos: 250 y 250. Entre tres: 166,67 cada una.', () => {
  // Empate entre dos (Terror y Shooter con 88)
  const dosEmpatadas = {
    status: { Terror: {}, Shooter: {}, Action: {} },
    rubrics: {
      Terror: { notaPromedio: 88 },
      Shooter: { notaPromedio: 88 },
      Action: { notaPromedio: 80 }
    }
  };

  const resDos = rules.calculateCreativeScores(dosEmpatadas);
  assert.equal(resDos.favoritePointsPerAlliance.Terror, 250, 'Terror recibe 250 en empate doble');
  assert.equal(resDos.favoritePointsPerAlliance.Shooter, 250, 'Shooter recibe 250 en empate doble');
  assert.equal(resDos.favoritePointsPerAlliance.Action, 0);

  // Empate triple (las tres con 88)
  const tresEmpatadas = {
    status: { Terror: {}, Shooter: {}, Action: {} },
    rubrics: {
      Terror: { notaPromedio: 88 },
      Shooter: { notaPromedio: 88 },
      Action: { notaPromedio: 88 }
    }
  };

  const resTres = rules.calculateCreativeScores(tresEmpatadas);
  assert.equal(resTres.favoritePointsPerAlliance.Terror, 166.67, 'Terror recibe 166.67 en empate triple');
  assert.equal(resTres.favoritePointsPerAlliance.Shooter, 166.67, 'Shooter recibe 166.67 en empate triple');
  assert.equal(resTres.favoritePointsPerAlliance.Action, 166.67, 'Action recibe 166.67 en empate triple');

  const totalRepartido = resTres.favoritePointsPerAlliance.Terror + resTres.favoritePointsPerAlliance.Shooter + resTres.favoritePointsPerAlliance.Action;
  assert.ok(totalRepartido <= 500.01, 'El total entregado nunca debe superar 500');
});

test('Notas 60 y 85: queda en "revisión conjunta pendiente" y no entra a la obra favorita', () => {
  // Terror tiene notas 60 y 85 (diferencia 25 > 20)
  // Shooter tiene 75 y 75 (promedio 75)
  // Aunque el promedio provisional de Terror sea 72.5, está en revisión conjunta pendiente
  // Si Terror tuviera notas 60 y 95 (promedio 77.5), tampoco debe ganar la obra favorita
  const creativeChallenges = {
    status: { Terror: {}, Shooter: {}, Action: {} },
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

  assert.equal(res.breakdown.Terror.isPendingDiscrepancy, true, 'Terror debe estar marcado en discrepancia pendiente');
  assert.equal(res.favoritePointsPerAlliance.Terror, 0, 'Terror no califica para obra favorita mientras esté pendiente');
  assert.equal(res.favoritePointsPerAlliance.Shooter, 500, 'Shooter se lleva la obra favorita por ser la nota válida definitiva más alta');
  assert.equal(res.hasProvisional, true, 'Debe indicar que hay notas provisorias');
});
