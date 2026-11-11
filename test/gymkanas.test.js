const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../config/rules');

test('Gymkanas: Puesto otorga 1 pt por intentar y 1 pt extra por resolver, máx 8 por persona', () => {
  // Participante con 4 puestos intentados y resueltos: 4 * 2 = 8 pts
  const fullPosts = [
    { post: 1, attempted: true, solved: true },
    { post: 2, attempted: true, solved: true },
    { post: 3, attempted: true, solved: true },
    { post: 4, attempted: true, solved: true }
  ];
  assert.equal(rules.calculateGymkanaParticipantTotal(fullPosts), 8);

  // Participante con 3 puestos intentados y resueltos (6 pts) + 1 solo intentado (1 pt) = 7 pts
  const sevenPosts = [
    { post: 1, attempted: true, solved: true },
    { post: 2, attempted: true, solved: true },
    { post: 3, attempted: true, solved: true },
    { post: 4, attempted: true, solved: false }
  ];
  assert.equal(rules.calculateGymkanaParticipantTotal(sevenPosts), 7);

  // Nadie pasa de 8 puntos (incluso si se enviaran más puestos o valores erróneos)
  const excessivePosts = [
    { post: 1, attempted: true, solved: true },
    { post: 2, attempted: true, solved: true },
    { post: 3, attempted: true, solved: true },
    { post: 4, attempted: true, solved: true },
    { post: 5, attempted: true, solved: true }
  ];
  assert.equal(rules.calculateGymkanaParticipantTotal(excessivePosts), 8, 'Nadie pasa de 8 puntos');
});

test('Gymkana promedio 6: 2250 puntos oficiales para la alianza', () => {
  // Dos participantes: uno con 8 y otro con 4 -> promedio (8 + 4) / 2 = 6
  const participants = [
    {
      posts: [
        { post: 1, attempted: true, solved: true },
        { post: 2, attempted: true, solved: true },
        { post: 3, attempted: true, solved: true },
        { post: 4, attempted: true, solved: true }
      ] // total: 8
    },
    {
      posts: [
        { post: 1, attempted: true, solved: true },
        { post: 2, attempted: true, solved: true },
        { post: 3, attempted: false, solved: false },
        { post: 4, attempted: false, solved: false }
      ] // total: 4
    }
  ];

  const res = rules.calculateGymkanaAlliancePoints(participants);
  assert.equal(res.average, 6, 'Promedio debe ser exactamente 6');
  assert.equal(res.pointsAwarded, 2250, 'Promedio 6 debe dar exactamente 2250 pts');
});

test('Gymkana promedio 8: 3000 puntos oficiales para la alianza', () => {
  // Todos con 8 puntos
  const participants = [
    {
      posts: [
        { post: 1, attempted: true, solved: true },
        { post: 2, attempted: true, solved: true },
        { post: 3, attempted: true, solved: true },
        { post: 4, attempted: true, solved: true }
      ]
    },
    {
      posts: [
        { post: 1, attempted: true, solved: true },
        { post: 2, attempted: true, solved: true },
        { post: 3, attempted: true, solved: true },
        { post: 4, attempted: true, solved: true }
      ]
    }
  ];

  const res = rules.calculateGymkanaAlliancePoints(participants);
  assert.equal(res.average, 8, 'Promedio debe ser 8');
  assert.equal(res.pointsAwarded, 3000, 'Promedio 8 debe dar 3000 pts');
});
