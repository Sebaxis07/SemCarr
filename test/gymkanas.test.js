const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../config/rules');

test('Gymkanas: Puesto otorga 1 pt por intentar y 1 pt extra por resolver, máx 6 por persona (Bases v2.3)', () => {
  // Participante con 3 puestos intentados y resueltos: 3 * 2 = 6 pts
  const fullPosts = [
    { post: 1, attempted: true, solved: true },
    { post: 2, attempted: true, solved: true },
    { post: 3, attempted: true, solved: true }
  ];
  assert.equal(rules.calculateGymkanaParticipantTotal(fullPosts), 6);

  // Participante con 2 puestos intentados y resueltos (4 pts) + 1 solo intentado (1 pt) = 5 pts
  const fivePosts = [
    { post: 1, attempted: true, solved: true },
    { post: 2, attempted: true, solved: true },
    { post: 3, attempted: true, solved: false }
  ];
  assert.equal(rules.calculateGymkanaParticipantTotal(fivePosts), 5);

  // Nadie pasa de 6 puntos (incluso si se enviaran más puestos o valores erróneos)
  const excessivePosts = [
    { post: 1, attempted: true, solved: true },
    { post: 2, attempted: true, solved: true },
    { post: 3, attempted: true, solved: true },
    { post: 4, attempted: true, solved: true }
  ];
  assert.equal(rules.calculateGymkanaParticipantTotal(excessivePosts), 6, 'Nadie pasa de 6 puntos en v2.3');
});

test('Gymkana promedio 4.5: 3000 puntos oficiales para la alianza (Ejemplo oficial Bases v2.3)', () => {
  // Dos participantes: uno con 6 y otro con 3 -> promedio (6 + 3) / 2 = 4.5
  const participants = [
    {
      posts: [
        { post: 1, attempted: true, solved: true },
        { post: 2, attempted: true, solved: true },
        { post: 3, attempted: true, solved: true }
      ] // total: 6
    },
    {
      posts: [
        { post: 1, attempted: true, solved: true },
        { post: 2, attempted: true, solved: false },
        { post: 3, attempted: false, solved: false }
      ] // total: 3
    }
  ];

  const res = rules.calculateGymkanaAlliancePoints(participants);
  assert.equal(res.average, 4.5, 'Promedio debe ser exactamente 4.5');
  assert.equal(res.pointsAwarded, 3000, 'Promedio 4.5 debe dar exactamente 3000 pts (4000 * 4.5 / 6)');
});

test('Gymkana promedio 6: 4000 puntos oficiales máximos para la alianza (Bases v2.3)', () => {
  // Todos con 6 puntos (máximo)
  const participants = [
    {
      posts: [
        { post: 1, attempted: true, solved: true },
        { post: 2, attempted: true, solved: true },
        { post: 3, attempted: true, solved: true }
      ]
    },
    {
      posts: [
        { post: 1, attempted: true, solved: true },
        { post: 2, attempted: true, solved: true },
        { post: 3, attempted: true, solved: true }
      ]
    }
  ];

  const res = rules.calculateGymkanaAlliancePoints(participants);
  assert.equal(res.average, 6, 'Promedio debe ser 6');
  assert.equal(res.pointsAwarded, 4000, 'Promedio 6 debe dar 4000 pts (máximo)');
});
