const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../config/rules');

test('Baby fútbol sin empate: 4000, 2400, 1200', () => {
  // Terror vence a Shooter (2-0), Shooter vence a Action (1-0), Terror vence a Action (3-0)
  // Tabla: Terror 6 pts (+5), Shooter 3 pts (-1), Action 0 pts (-4)
  const matches = [
    { team1: 'Terror', team2: 'Shooter', score1: 2, score2: 0 },
    { team1: 'Shooter', team2: 'Action', score1: 1, score2: 0 },
    { team1: 'Action', team2: 'Terror', score1: 0, score2: 3 }
  ];

  const res = rules.calculateTriangularStandings('babyfutbol', matches);

  assert.equal(res.sorted[0], 'Terror');
  assert.equal(res.sorted[1], 'Shooter');
  assert.equal(res.sorted[2], 'Action');

  assert.equal(res.awarded.Terror, 4000);
  assert.equal(res.awarded.Shooter, 2400);
  assert.equal(res.awarded.Action, 1200);
});

test('Baby fútbol empate en 1er lugar entre dos: 3200 cada una y la otra 1200', () => {
  // Terror empata con Shooter (1-1)
  // Terror vence a Action (2-0)
  // Shooter vence a Action (2-0)
  // Terror y Shooter igualan en puntos (4), DIF (+2) y GF (3).
  // Action queda 3° con 0 pts.
  const matches = [
    { team1: 'Terror', team2: 'Shooter', score1: 1, score2: 1 },
    { team1: 'Shooter', team2: 'Action', score1: 2, score2: 0 },
    { team1: 'Action', team2: 'Terror', score1: 0, score2: 2 }
  ];

  const res = rules.calculateTriangularStandings('babyfutbol', matches);

  assert.equal(res.awarded.Terror, 3200, 'Terror debe recibir 3200 pts');
  assert.equal(res.awarded.Shooter, 3200, 'Shooter debe recibir 3200 pts');
  assert.equal(res.awarded.Action, 1200, 'Action debe recibir 1200 pts');
});

test('Baby fútbol empate en 2do lugar entre dos: 1800 cada una y la primera 4000', () => {
  // Terror vence a Shooter (2-0) y Terror vence a Action (2-0) -> 6 pts (1° lugar)
  // Shooter empata con Action (1-1) -> ambos 1 pt, DIF -2, GF 1 -> empate exacto en 2do lugar
  const matches = [
    { team1: 'Terror', team2: 'Shooter', score1: 2, score2: 0 },
    { team1: 'Shooter', team2: 'Action', score1: 1, score2: 1 },
    { team1: 'Action', team2: 'Terror', score1: 0, score2: 2 }
  ];

  const res = rules.calculateTriangularStandings('babyfutbol', matches);

  assert.equal(res.awarded.Terror, 4000, 'Terror 1° recibe 4000');
  assert.equal(res.awarded.Shooter, 1800, 'Shooter empatada en 2° recibe 1800');
  assert.equal(res.awarded.Action, 1800, 'Action empatada en 2° recibe 1800');
});

test('Baby fútbol empate triple: 2533,33 cada una, se muestra 2533', () => {
  // Círculo perfecto de resultados idénticos:
  // Terror 1 - 0 Shooter
  // Shooter 1 - 0 Action
  // Action 1 - 0 Terror
  // Cada una tiene 3 pts, DIF 0, GF 1.
  const matches = [
    { team1: 'Terror', team2: 'Shooter', score1: 1, score2: 0 },
    { team1: 'Shooter', team2: 'Action', score1: 1, score2: 0 },
    { team1: 'Action', team2: 'Terror', score1: 1, score2: 0 }
  ];

  const res = rules.calculateTriangularStandings('babyfutbol', matches);

  assert.equal(res.awarded.Terror, 2533.33, 'Terror guarda 2533.33');
  assert.equal(res.awarded.Shooter, 2533.33, 'Shooter guarda 2533.33');
  assert.equal(res.awarded.Action, 2533.33, 'Action guarda 2533.33');

  // Comprobar redondeo de visualización
  assert.equal(rules.roundForDisplay(res.awarded.Terror), 2533, 'Visualización redondeada al entero es 2533');
  assert.equal(rules.roundForDisplay(res.awarded.Shooter), 2533);
  assert.equal(rules.roundForDisplay(res.awarded.Action), 2533);
});

test('Quemadas: victoria 3, empate 1, derrota 0, desempate por rondas ganadas y luego jugadores en pie', () => {
  // Caso 1: Desempate por más rondas ganadas
  // Terror vence a Shooter 2-1 (Terror 3 pts, 2 rondas; Shooter 0 pts, 1 ronda)
  // Shooter vence a Action 2-0 (Shooter 3 pts, 2 rondas; Action 0 pts, 0 rondas)
  // Action vence a Terror 2-0 (Action 3 pts, 2 rondas; Terror 0 pts, 0 rondas)
  // Los tres tienen 3 pts.
  // Rondas ganadas:
  // Shooter: 1 + 2 = 3 rondas ganadas
  // Terror: 2 + 0 = 2 rondas ganadas
  // Action: 0 + 2 = 2 rondas ganadas
  // Shooter debe ser 1° por más rondas ganadas (3 vs 2).
  // Entre Terror y Action, ambos tienen 3 pts y 2 rondas ganadas.
  // Desempate por jugadores en pie:
  // Supongamos Terror acumuló 6 jugadores en pie y Action 4.
  const matches = [
    { team1: 'Terror', team2: 'Shooter', score1: 2, score2: 1, standing1: 4, standing2: 2 },
    { team1: 'Shooter', team2: 'Action', score1: 2, score2: 0, standing1: 3, standing2: 0 },
    { team1: 'Action', team2: 'Terror', score1: 2, score2: 0, standing1: 4, standing2: 2 }
  ];

  const res = rules.calculateTriangularStandings('quemadas', matches);

  // Shooter: 3 pts, 3 rondas ganadas -> 1° Lugar
  // Terror: 3 pts, 2 rondas ganadas, 6 jugadores en pie (4 + 2) -> 2° Lugar
  // Action: 3 pts, 2 rondas ganadas, 4 jugadores en pie (0 + 4) -> 3° Lugar
  assert.equal(res.sorted[0], 'Shooter', 'Shooter gana por mayor cantidad de rondas ganadas (3)');
  assert.equal(res.sorted[1], 'Terror', 'Terror supera a Action por más jugadores en pie (6 vs 4)');
  assert.equal(res.sorted[2], 'Action', 'Action queda 3°');

  assert.equal(res.awarded.Shooter, 4000);
  assert.equal(res.awarded.Terror, 2400);
  assert.equal(res.awarded.Action, 1200);
});
