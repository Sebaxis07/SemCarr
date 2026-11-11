const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../config/rules');

test('Premios de nota académica: 1.ª 1.0 punto, 2.ª 0.5 puntos, 3.ª 0.3 puntos', () => {
  const ranks = {
    Terror: 1,
    Shooter: 2,
    Action: 3
  };

  const participantsByAlliance = {
    Terror: [
      { id: 't1', name: 'Estudiante Terror 1', carrera: 'Informática', activities: ['babyfutbol', 'trivia'] },
      { id: 't2', name: 'Estudiante Terror 2', carrera: 'Informática', activities: ['canto'] }
    ],
    Shooter: [
      { id: 's1', name: 'Estudiante Shooter 1', carrera: 'Telecomunicaciones', activities: ['quemadas'] }
    ],
    Action: [
      { id: 'a1', name: 'Estudiante Action 1', carrera: 'Diseño Web', activities: ['gymkanas'] }
    ]
  };

  const res = rules.calculateGradePrizes(ranks, participantsByAlliance);

  // 1° Lugar
  assert.equal(res.Terror.rank, 1);
  assert.equal(res.Terror.gradeBonus, 1.0, '1° lugar recibe 1.0 punto de nota');
  assert.equal(res.Terror.beneficiariesCount, 2);
  assert.equal(res.Terror.beneficiaries[0].gradeBonus, 1.0);

  // 2° Lugar
  assert.equal(res.Shooter.rank, 2);
  assert.equal(res.Shooter.gradeBonus, 0.5, '2° lugar recibe 0.5 puntos de nota');
  assert.equal(res.Shooter.beneficiariesCount, 1);
  assert.equal(res.Shooter.beneficiaries[0].gradeBonus, 0.5);

  // 3° Lugar
  assert.equal(res.Action.rank, 3);
  assert.equal(res.Action.gradeBonus, 0.3, '3° lugar recibe 0.3 puntos de nota');
  assert.equal(res.Action.beneficiariesCount, 1);
  assert.equal(res.Action.beneficiaries[0].gradeBonus, 0.3);
});

test('Premios de nota: Solo reciben el bono los alumnos que participaron en al menos una actividad', () => {
  const ranks = { Terror: 1, Shooter: 2, Action: 3 };

  // Terror tiene solo 1 participante registrado en cancha
  const participantsByAlliance = {
    Terror: [{ id: 't1', name: 'Juan Pérez', carrera: 'Informática', activities: ['babyfutbol'] }],
    Shooter: [],
    Action: []
  };

  const res = rules.calculateGradePrizes(ranks, participantsByAlliance);

  assert.equal(res.Terror.beneficiaries.length, 1, 'Solo Juan Pérez recibe el punto de nota');
  assert.equal(res.Terror.beneficiaries[0].name, 'Juan Pérez');
  assert.equal(res.Shooter.beneficiaries.length, 0, 'Sin participación no hay entrega de nota');
});
