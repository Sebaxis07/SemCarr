const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../config/rules');

test('Taca-taca y ping pong: 1000, 600, 300 con registro detallado por partido', () => {
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
  assert.equal(taca.awarded.Terror, 1000, '1° lugar en Taca-taca recibe 1000 pts');
  assert.equal(taca.awarded.Shooter, 600, '2° lugar en Taca-taca recibe 600 pts');
  assert.equal(taca.awarded.Action, 300, '3° lugar en Taca-taca recibe 300 pts');

  // Ping Pong
  const ping = rules.calculateActivityDetailedScores('pingpong', detail);
  assert.equal(ping.awarded.Terror, 1000);
  assert.equal(ping.awarded.Shooter, 600);
  assert.equal(ping.awarded.Action, 300);

  // Desempate por diferencia de puntos si empatan en victorias (máx 8)
  const tieDetail = {
    Terror: { victorias: 5, diferenciaPuntos: 8 },
    Shooter: { victorias: 5, diferenciaPuntos: 4 },
    Action: { victorias: 2, diferenciaPuntos: -12 }
  };
  const tiePing = rules.calculateActivityDetailedScores('pingpong', tieDetail);
  assert.equal(tiePing.places.Terror, 1, 'Terror desempata en 1° por mayor diferencia de puntos');
  assert.equal(tiePing.places.Shooter, 2);
  assert.equal(tiePing.awarded.Terror, 1000);
  assert.equal(tiePing.awarded.Shooter, 600);
});

test('Trivia de conocimiento: 2000, 1200, 600 con aciertos de 3 representantes y pregunta extra', () => {
  // Terror: 3 representantes aciertan [8, 9, 7] -> suma = 24
  // Shooter: 3 representantes aciertan [6, 7, 6] -> suma = 19
  // Action: 3 representantes aciertan [5, 4, 5] -> suma = 14
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
    Terror: { reps: [7, 7, 6], preguntaExtra: 0 }, // suma 20, extra 0
    Shooter: { reps: [8, 6, 6], preguntaExtra: 1 }, // suma 20, extra 1
    Action: { reps: [4, 4, 4], preguntaExtra: 0 }   // suma 12
  };
  const tieRes = rules.calculateActivityDetailedScores('trivia', tieDetail);
  assert.equal(tieRes.places.Shooter, 1, 'Shooter desempata por pregunta extra');
  assert.equal(tieRes.places.Terror, 2);
  assert.equal(tieRes.awarded.Shooter, 2000);
  assert.equal(tieRes.awarded.Terror, 1200);
});

test('Torneo Retro: 4 duelos por enfrentamiento, máx 8 victorias, desempate por rondas y duelo extra', () => {
  // 1° 3000, 2° 1800, 3° 900
  // Terror: 6 duelos ganados, 14 rondas
  // Shooter: 6 duelos ganados, 12 rondas
  // Action: 2 duelos ganados, 6 rondas
  const detail = {
    Terror: { victorias: 6, rondas: 14, dueloExtra: 0 },
    Shooter: { victorias: 6, rondas: 12, dueloExtra: 0 },
    Action: { victorias: 2, rondas: 6, dueloExtra: 0 }
  };

  const res = rules.calculateActivityDetailedScores('retro', detail);
  assert.equal(res.places.Terror, 1, 'Terror desempata por mayor cantidad de rondas ganadas (14 vs 12)');
  assert.equal(res.places.Shooter, 2);
  assert.equal(res.places.Action, 3);

  assert.equal(res.awarded.Terror, 3000, '1° lugar en Retro recibe 3000 pts');
  assert.equal(res.awarded.Shooter, 1800, '2° lugar en Retro recibe 1800 pts');
  assert.equal(res.awarded.Action, 900, '3° lugar en Retro recibe 900 pts');
});

test('Canto y Barra: Trazabilidad y desempates oficiales (canción extra y nota de jurado)', () => {
  // Canto: 1500, 900, 450
  const cantoDetail = {
    Terror: { restantes: 8, cancionExtra: 0 },
    Shooter: { restantes: 8, cancionExtra: 1 }, // Desempata con canción extra
    Action: { restantes: 5, cancionExtra: 0 }
  };
  const canto = rules.calculateActivityDetailedScores('canto', cantoDetail);
  assert.equal(canto.places.Shooter, 1);
  assert.equal(canto.places.Terror, 2);
  assert.equal(canto.places.Action, 3);
  assert.equal(canto.awarded.Shooter, 1500);
  assert.equal(canto.awarded.Terror, 900);
  assert.equal(canto.awarded.Action, 450);

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
