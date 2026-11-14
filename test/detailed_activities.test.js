const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../config/rules');

test('Taca-taca y ping pong: 1500, 900, 450 con registro detallado por partido (Bases v2.3)', () => {
  // Taca-taca:
  // Terror: 6 victorias, diff +10
  // Shooter: 4 victorias, diff +2
  // Action: 2 victorias, diff -12
  const detail = {
    Terror: { victorias: 6, diferenciaPuntos: 10 },
    Shooter: { victorias: 4, diferenciaPuntos: 2 },
    Action: { victorias: 2, diferenciaPuntos: -12 }
  };

  const taca = rules.calculateActivityDetailedScores('tacataca', detail);
  assert.equal(taca.places.Terror, 1);
  assert.equal(taca.places.Shooter, 2);
  assert.equal(taca.places.Action, 3);
  assert.equal(taca.awarded.Terror, 1500, '1° lugar en Taca-taca recibe 1500 pts');
  assert.equal(taca.awarded.Shooter, 900, '2° lugar en Taca-taca recibe 900 pts');
  assert.equal(taca.awarded.Action, 450, '3° lugar en Taca-taca recibe 450 pts');

  // Ping Pong
  const ping = rules.calculateActivityDetailedScores('pingpong', detail);
  assert.equal(ping.awarded.Terror, 1500);
  assert.equal(ping.awarded.Shooter, 900);
  assert.equal(ping.awarded.Action, 450);

  // Desempate por diferencia de puntos si empatan en victorias (máx 8)
  const tieDetail = {
    Terror: { victorias: 5, diferenciaPuntos: 8 },
    Shooter: { victorias: 5, diferenciaPuntos: 4 },
    Action: { victorias: 2, diferenciaPuntos: -12 }
  };
  const tiePing = rules.calculateActivityDetailedScores('pingpong', tieDetail);
  assert.equal(tiePing.places.Terror, 1, 'Terror desempata en 1° por mayor diferencia de puntos');
  assert.equal(tiePing.places.Shooter, 2);
  assert.equal(tiePing.awarded.Terror, 1500);
  assert.equal(tiePing.awarded.Shooter, 900);
});

test('Trivia de conocimiento: 2000, 1200, 600 con aciertos de 3 representantes y pregunta extra', () => {
  const detail = {
    Terror: { reps: [8, 9, 7], preguntaExtra: 0 },
    Shooter: { reps: [6, 7, 6], preguntaExtra: 0 },
    Action: { reps: [5, 4, 5], preguntaExtra: 0 }
  };

  const res = rules.calculateActivityDetailedScores('trivia', detail);

  assert.equal(res.totals.Terror, 24);
  assert.equal(res.totals.Shooter, 19);
  assert.equal(res.totals.Action, 14);

  assert.equal(res.places.Terror, 1);
  assert.equal(res.places.Shooter, 2);
  assert.equal(res.places.Action, 3);

  assert.equal(res.awarded.Terror, 2000, '1° lugar en Trivia recibe 2000 pts');
  assert.equal(res.awarded.Shooter, 1200, '2° lugar en Trivia recibe 1200 pts');
  assert.equal(res.awarded.Action, 600, '3° lugar en Trivia recibe 600 pts');

  // Empate en suma resuelto por pregunta extra
  const tieDetail = {
    Terror: { reps: [7, 7, 6], preguntaExtra: 0 },
    Shooter: { reps: [8, 6, 6], preguntaExtra: 1 },
    Action: { reps: [4, 4, 4], preguntaExtra: 0 }
  };
  const tieRes = rules.calculateActivityDetailedScores('trivia', tieDetail);
  assert.equal(tieRes.places.Shooter, 1, 'Shooter desempata por pregunta extra');
  assert.equal(tieRes.places.Terror, 2);
  assert.equal(tieRes.awarded.Shooter, 2000);
  assert.equal(tieRes.awarded.Terror, 1200);
});

test('Torneo Retro: 4 duelos por enfrentamiento, máx 8 victorias, desempate por rondas y duelo extra (Bases v2.3)', () => {
  // 1° 4000, 2° 2400, 3° 1200
  const detail = {
    Terror: { victorias: 6, rondas: 14, dueloExtra: 0 },
    Shooter: { victorias: 6, rondas: 12, dueloExtra: 0 },
    Action: { victorias: 2, rondas: 6, dueloExtra: 0 }
  };

  const res = rules.calculateActivityDetailedScores('retro', detail);
  assert.equal(res.places.Terror, 1, 'Terror desempata por mayor cantidad de rondas ganadas (14 vs 12)');
  assert.equal(res.places.Shooter, 2);
  assert.equal(res.places.Action, 3);

  assert.equal(res.awarded.Terror, 4000, '1° lugar en Retro recibe 4000 pts en Bases v2.3');
  assert.equal(res.awarded.Shooter, 2400, '2° lugar en Retro recibe 2400 pts en Bases v2.3');
  assert.equal(res.awarded.Action, 1200, '3° lugar en Retro recibe 1200 pts en Bases v2.3');
});

test('Canto y Barra: Trazabilidad y desempates oficiales (canción extra y nota de jurado)', () => {
  // Canto en v2.3: 2000, 1200, 600
  const cantoDetail = {
    Terror: { restantes: 4, cancionExtra: 0 },
    Shooter: { restantes: 4, cancionExtra: 1 }, // Desempata con canción extra
    Action: { restantes: 2, cancionExtra: 0 }
  };
  const canto = rules.calculateActivityDetailedScores('canto', cantoDetail);
  assert.equal(canto.places.Shooter, 1);
  assert.equal(canto.places.Terror, 2);
  assert.equal(canto.places.Action, 3);
  assert.equal(canto.awarded.Shooter, 2000, '1° lugar Canto recibe 2000 pts en v2.3');
  assert.equal(canto.awarded.Terror, 1200, '2° lugar Canto recibe 1200 pts en v2.3');
  assert.equal(canto.awarded.Action, 600, '3° lugar Canto recibe 600 pts en v2.3');

  // Barra y Ruido: 3 mediciones en decibeles, promedio y nota de jurado para desempate
  const barraDetail = {
    Terror: { mediciones: [95, 96, 94], notaJurado: 85 }, // promedio 95.0
    Shooter: { mediciones: [93, 94, 95], notaJurado: 90 }, // promedio 94.0
    Action: { mediciones: [91, 90, 89], notaJurado: 75 }  // promedio 90.0
  };
  const barra = rules.calculateActivityDetailedScores('barra', barraDetail);
  assert.equal(barra.promedios.Terror, 95);
  assert.equal(barra.promedios.Shooter, 94);
  assert.equal(barra.places.Terror, 1);
  assert.equal(barra.places.Shooter, 2);
  assert.equal(barra.places.Action, 3);
  assert.equal(barra.awarded.Terror, 1500);
  assert.equal(barra.awarded.Shooter, 900);
  assert.equal(barra.awarded.Action, 450);
});
