const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../config/rules');

test('Desempate general: Nivel 1 - Misma puntuación total, desempata mayor cantidad de primeros lugares', () => {
  const totals = {
    Terror: { total: 5000 },
    Shooter: { total: 5000 },
    Action: { total: 2000 }
  };

  // Terror tiene 2 primeros lugares, Shooter tiene 1
  const mockData = {
    activities: [
      { id: 'trivia', status: 'Terminada', pointsAwarded: { Terror: 2000, Shooter: 1200, Action: 600 }, results: { Terror: 1, Shooter: 2, Action: 3 } },
      { id: 'canto', status: 'Terminada', pointsAwarded: { Terror: 1500, Shooter: 900, Action: 450 }, results: { Terror: 1, Shooter: 2, Action: 3 } },
      { id: 'tacataca', status: 'Terminada', pointsAwarded: { Terror: 600, Shooter: 1000, Action: 300 }, results: { Terror: 2, Shooter: 1, Action: 3 } }
    ]
  };

  const { sorted, ranks, tieBreaks } = rules.resolveGeneralRanking(totals, mockData);

  assert.equal(sorted[0], 'Terror', 'Terror debe ganar por mayor cantidad de primeros lugares');
  assert.equal(sorted[1], 'Shooter');
  assert.equal(ranks.Terror, 1);
  assert.equal(ranks.Shooter, 2);
  assert.equal(ranks.Action, 3);
  assert.ok(tieBreaks.Terror, 'Debe registrarse el desempate para Terror');
  assert.equal(tieBreaks.Terror.applied, true);
  assert.equal(tieBreaks.Terror.criterion, 'primeros_lugares');
  assert.match(tieBreaks.Terror.reason, /primeros lugares/i);
});

test('Desempate general: Nivel 2 - Igual total e iguales primeros lugares, desempata más puntos en deportes (Baby + Quemadas)', () => {
  const totals = {
    Terror: { total: 6400 },
    Shooter: { total: 6400 },
    Action: { total: 3000 }
  };

  // Ambos tienen 1 primer lugar cada uno
  // Terror tiene 4000 en babyfutbol + 0 en quemadas = 4000 pts deportivos
  // Shooter tiene 0 en babyfutbol + 2400 en quemadas = 2400 pts deportivos
  const mockData = {
    activities: [
      { id: 'babyfutbol', status: 'Terminada', pointsAwarded: { Terror: 4000, Shooter: 0, Action: 0 }, results: { Terror: 1, Shooter: 2, Action: 3 } },
      { id: 'quemadas', status: 'Terminada', pointsAwarded: { Terror: 0, Shooter: 2400, Action: 0 }, results: { Terror: 3, Shooter: 1, Action: 2 } },
      { id: 'retro', status: 'Pendiente', pointsAwarded: { Terror: 0, Shooter: 0, Action: 0 } }
    ]
  };

  const { sorted, ranks, tieBreaks } = rules.resolveGeneralRanking(totals, mockData);

  assert.equal(sorted[0], 'Terror', 'Terror debe ganar por tener más puntos en deportes');
  assert.equal(sorted[1], 'Shooter');
  assert.equal(ranks.Terror, 1);
  assert.equal(ranks.Shooter, 2);
  assert.ok(tieBreaks.Terror);
  assert.equal(tieBreaks.Terror.criterion, 'deportes');
  assert.match(tieBreaks.Terror.reason, /deportivas/i);
});

test('Desempate general: Nivel 3 - Igual total, primeros lugares y deportes, desempata mejor lugar en torneo retro', () => {
  const totals = {
    Terror: { total: 5800 },
    Shooter: { total: 5800 },
    Action: { total: 4000 }
  };

  // Ambos tienen exactamente 1 primer lugar:
  // Terror: 1° en babyfutbol (4000 pts)
  // Shooter: 1° en trivia (1200 pts)
  // Ambos tienen 4000 pts en deportes:
  // Terror: 4000 (baby) + 0 (quemadas) = 4000
  // Shooter: 0 (baby) + 4000 (quemadas) = 4000
  // En retro: Terror fue 2° (1800 pts) y Shooter fue 3° (600 pts)
  const mockData = {
    activities: [
      { id: 'babyfutbol', status: 'Terminada', pointsAwarded: { Terror: 4000, Shooter: 0, Action: 0 }, results: { Terror: 1, Shooter: 2, Action: 3 } },
      { id: 'quemadas', status: 'Terminada', pointsAwarded: { Terror: 0, Shooter: 4000, Action: 0 }, results: { Terror: 2, Shooter: 1, Action: 3 } },
      { id: 'trivia', status: 'Terminada', pointsAwarded: { Terror: 0, Shooter: 0, Action: 2000 }, results: { Terror: 2, Shooter: 3, Action: 1 } },
      { id: 'retro', status: 'Terminada', pointsAwarded: { Terror: 1800, Shooter: 600, Action: 3000 }, results: { Terror: 2, Shooter: 3, Action: 1 } }
    ]
  };

  const { sorted, ranks, tieBreaks } = rules.resolveGeneralRanking(totals, mockData);

  assert.equal(sorted[0], 'Terror', 'Terror debe ganar por mejor lugar en Torneo Retro');
  assert.equal(sorted[1], 'Shooter');
  assert.equal(ranks.Terror, 1);
  assert.equal(ranks.Shooter, 2);
  assert.ok(tieBreaks.Terror);
  assert.equal(tieBreaks.Terror.criterion, 'retro');
  assert.match(tieBreaks.Terror.reason, /Retro/i);
});
