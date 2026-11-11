// -*- coding: utf-8 -*-
/**
 * Configuración Central de Reglas, Puntuaciones y Límites Oficiales
 * Semana de la Carrera 2026 - INACAP Sede Antofagasta
 * 
 * Regla: Cálculos siempre en el servidor. Todas las cifras en este único archivo.
 */

// Decisiones provisorias configurables
const PROVISIONAL_SETTINGS = {
  // Decisión 1: Obra favorita 500 pts total repartido en partes iguales en caso de empate
  FAVORITE_WORK_TOTAL_POINTS: 500,
  
  // Decisión 2: Redondeo solo para visualización al entero más cercano (0.5 sube)
  ROUND_ONLY_FOR_DISPLAY: true,
  
  // Decisión 3: Cuatro niveles de rúbrica docente estrictos de las Bases
  DOCENTE_RUBRIC_LEVELS: {
    Excelente: 1.0,  // 100%
    Bueno: 0.8,      // 80%
    Regular: 0.5,    // 50%
    Basico: 0.2      // 20%
  }
};

// Tabla oficial de 25.000 puntos (Sección 4 de las Bases)
const ACTIVITY_POINTS = {
  babyfutbol: {
    name: 'Baby Fútbol',
    distribution: [4000, 2400, 1200],
    minPlayers: 5,
    maxPlayers: 7, // 5 titulares + 2 suplentes
    tieBreakOrder: ['points', 'goalDifference', 'goalsFor', 'penalties']
  },
  quemadas: {
    name: 'Quemadas',
    distribution: [4000, 2400, 1200],
    minPlayers: 6,
    maxPlayers: 8, // 6 titulares + 2 suplentes
    tieBreakOrder: ['points', 'roundsWon', 'standingPlayers']
  },
  retro: {
    name: 'Torneo Retro',
    distribution: [3000, 1800, 900],
    minPlayers: 4,
    maxPlayers: 5, // 4 titulares + 1 suplente
    duelsPerMatch: 4,
    maxVictories: 8
  },
  tacataca: {
    name: 'Taca-Taca',
    distribution: [1000, 600, 300],
    minPlayers: 2,
    maxPlayers: 3, // 2 titulares + 1 suplente
    maxVictories: 8
  },
  pingpong: {
    name: 'Ping Pong',
    distribution: [1000, 600, 300],
    minPlayers: 2,
    maxPlayers: 3, // 2 titulares + 1 suplente
    maxVictories: 8
  },
  trivia: {
    name: 'Trivia de Conocimiento',
    distribution: [2000, 1200, 600],
    representativesPerAlliance: 3
  },
  canto: {
    name: 'Si Se la Sabe Cante',
    distribution: [1500, 900, 450],
    initialRowSize: 10
  },
  barra: {
    name: 'Barra y Ruido',
    distribution: [1500, 900, 450],
    decibelMeasurements: 3
  },
  gymkanas: {
    name: 'Gymkanas',
    maxPoints: 3000,
    postsCount: 4,
    pointsPerAttempt: 1,
    pointsPerSolved: 1,
    maxPointsPerPerson: 8
  }
};

// Desafío Creativo (Sección 6)
const CREATIVE_CHALLENGE = {
  deliveryOnTimePoints: 1000,
  maxEvaluationPoints: 2500,
  favoriteWorkPoints: PROVISIONAL_SETTINGS.FAVORITE_WORK_TOTAL_POINTS,
  maxTeacherDiscrepancy: 20 // Diferencia > 20 pts gatilla "revisión conjunta pendiente"
};

// Sanciones (Sección 8)
const SANCTIONS = {
  minPoints: 200,
  maxPoints: 600
};

// Reclamos (Sección 8)
const CLAIMS = {
  windowMinutes: 15,
  windowMs: 15 * 60 * 1000
};

// Premios de Nota académica (Sección 3 y 10)
const GRADE_PRIZES = {
  firstPlace: 1.0,
  secondPlace: 0.5,
  thirdPlace: 0.3
};

// Copa de Alianzas Tarreo
const TARREO_COPA = {
  cazatesoros: {
    distribution: [1500, 900, 450],
    allZeroDistribution: [950, 950, 950]
  },
  justdance: {
    distribution: [1500, 900, 450]
  },
  mimica: {
    distribution: [1000, 600, 300]
  }
};

// Sorpresas
const SORPRESAS = {
  referencePoints: [500, 300, 150],
  maxTotalPerAlliance: 3000,
  maxActivitiesCount: 6,
  reserveActivitiesCount: 1
};

// Función de redondeo estándar para visualización
function roundForDisplay(val) {
  if (val === null || val === undefined || isNaN(val)) return 0;
  return Math.round(Number(val));
}

// Reparto equitativo de puntos para empates (guarda con decimales exactos)
function distributePointsForTies(distribution, placesMap) {
  // distribution: [p1, p2, p3]
  // placesMap: { Terror: 1, Shooter: 2, Action: 3 } o array ordenado
  const p1 = Number(distribution[0] || 0);
  const p2 = Number(distribution[1] || 0);
  const p3 = Number(distribution[2] || 0);

  const placeMap = { 1: [], 2: [], 3: [] };
  ['Terror', 'Shooter', 'Action'].forEach(al => {
    const pl = Number(placesMap[al]);
    if (placeMap[pl]) placeMap[pl].push(al);
  });

  const awarded = { Terror: 0, Shooter: 0, Action: 0 };

  if (placeMap[1].length === 3) {
    // Empate triple en 1er lugar: (p1 + p2 + p3) / 3
    const split = (p1 + p2 + p3) / 3;
    awarded.Terror = split;
    awarded.Shooter = split;
    awarded.Action = split;
  } else if (placeMap[1].length === 2) {
    // Empate doble en 1er lugar: (p1 + p2) / 2 para los dos empatados, 3er lugar recibe p3
    const split = (p1 + p2) / 2;
    placeMap[1].forEach(al => awarded[al] = split);
    if (placeMap[3].length === 1) {
      awarded[placeMap[3][0]] = p3;
    } else if (placeMap[2].length === 1) {
      awarded[placeMap[2][0]] = p3;
    }
  } else if (placeMap[1].length === 1) {
    awarded[placeMap[1][0]] = p1;
    if (placeMap[2].length === 2) {
      // Empate doble en 2do lugar: (p2 + p3) / 2
      const split = (p2 + p3) / 2;
      placeMap[2].forEach(al => awarded[al] = split);
    } else if (placeMap[2].length === 1) {
      awarded[placeMap[2][0]] = p2;
      if (placeMap[3].length >= 1) {
        awarded[placeMap[3][0]] = p3;
      }
    }
  }

  return awarded;
}

// Cuenta de primeros lugares oficiales para el desempate general (Sección 8)
function countFirstPlaces(data, al) {
  let count = 0;
  if (!data) return 0;

  // 1. Actividades del día 19
  (data.activities || []).forEach(act => {
    const isFinished = act.status === 'Terminada' || (act.pointsAwarded && Object.values(act.pointsAwarded).some(p => Number(p) > 0));
    if (!isFinished) return;

    if (act.results && act.results[al] !== null && act.results[al] !== undefined && Number(act.results[al]) === 1) {
      count++;
    } else if (act.pointsAwarded) {
      const maxPts = Math.max(...['Terror', 'Shooter', 'Action'].map(a => Number(act.pointsAwarded[a] || 0)));
      if (maxPts > 0 && Number(act.pointsAwarded[al] || 0) === maxPts) {
        count++;
      }
    }
  });

  // 2. Copa de Alianzas Tarreo
  if (data.tarreoCopa) {
    ['cazatesoros', 'justdance', 'mimica'].forEach(k => {
      const item = data.tarreoCopa[k];
      if (!item) return;
      const isFinished = item.status === 'Terminada' || (item.pointsAwarded && Object.values(item.pointsAwarded).some(p => Number(p) > 0));
      if (!isFinished) return;

      if (item.places && item.places[al] !== null && item.places[al] !== undefined && Number(item.places[al]) === 1) {
        count++;
      } else if (item.pointsAwarded) {
        const maxPts = Math.max(...['Terror', 'Shooter', 'Action'].map(a => Number(item.pointsAwarded[a] || 0)));
        if (maxPts > 0 && Number(item.pointsAwarded[al] || 0) === maxPts) {
          count++;
        }
      }
    });
  }

  // 3. Desafíos Creativos
  if (data.creativeChallenges?.pointsAwarded) {
    const maxPts = Math.max(...['Terror', 'Shooter', 'Action'].map(a => Number(data.creativeChallenges.pointsAwarded[a] || 0)));
    if (maxPts > 0 && Number(data.creativeChallenges.pointsAwarded[al] || 0) === maxPts) {
      count++;
    }
  }

  // 4. Sorpresas
  (data.sorpresas || []).forEach(s => {
    if (s.pointsAwarded) {
      const maxPts = Math.max(...['Terror', 'Shooter', 'Action'].map(a => Number(s.pointsAwarded[a] || 0)));
      if (maxPts > 0 && Number(s.pointsAwarded[al] || 0) === maxPts) {
        count++;
      }
    }
  });

  return count;
}

// Puntaje acumulado en deportes (Baby Fútbol + Quemadas) para desempate general (Sección 8)
function getSportsPoints(data, al) {
  if (!data) return 0;
  let pts = 0;
  const baby = (data.activities || []).find(a => a.id === 'babyfutbol');
  if (baby?.pointsAwarded) {
    pts += Number(baby.pointsAwarded[al] || 0);
  }
  const quemadas = (data.activities || []).find(a => a.id === 'quemadas');
  if (quemadas?.pointsAwarded) {
    pts += Number(quemadas.pointsAwarded[al] || 0);
  }
  return pts;
}

// Posición en Torneo Retro para desempate general (Sección 8)
function getRetroPlace(data, al) {
  if (!data) return 999;
  const retro = (data.activities || []).find(a => a.id === 'retro');
  if (!retro) return 999;
  if (retro.results && retro.results[al] !== null && retro.results[al] !== undefined) {
    const pl = Number(retro.results[al]);
    if (!isNaN(pl) && pl > 0) return pl;
  }
  if (retro.pointsAwarded) {
    const entries = ['Terror', 'Shooter', 'Action'].map(a => ({
      al: a,
      pts: Number(retro.pointsAwarded[a] || 0)
    })).sort((x, y) => y.pts - x.pts);
    if (entries.every(e => e.pts === 0)) return 999;
    const idx = entries.findIndex(e => e.al === al);
    return idx >= 0 ? idx + 1 : 999;
  }
  return 999;
}

// Resolución del ranking general con los 3 niveles de desempate de las Bases (Sección 8)
function resolveGeneralRanking(totals, data) {
  const alliances = ['Terror', 'Shooter', 'Action'];
  const firstPlaces = {};
  const sportsPoints = {};
  const retroPlaces = {};

  alliances.forEach(al => {
    firstPlaces[al] = countFirstPlaces(data, al);
    sportsPoints[al] = getSportsPoints(data, al);
    retroPlaces[al] = getRetroPlace(data, al);
  });

  const tieBreakDecisions = [];

  const sorted = [...alliances].sort((a, b) => {
    const diff = Number(totals[b].total || 0) - Number(totals[a].total || 0);
    if (Math.abs(diff) > 0.0001) {
      return diff > 0 ? 1 : -1;
    }

    // Nivel 1: Mayor cantidad de primeros lugares
    const dFirst = firstPlaces[b] - firstPlaces[a];
    if (dFirst !== 0) {
      const winner = dFirst > 0 ? b : a;
      const loser = dFirst > 0 ? a : b;
      tieBreakDecisions.push({
        winner,
        loser,
        criterion: 'primeros_lugares',
        reason: `Mayor cantidad de primeros lugares: ${winner} (${Math.max(firstPlaces[a], firstPlaces[b])}) supera a ${loser} (${Math.min(firstPlaces[a], firstPlaces[b])})`
      });
      return dFirst > 0 ? 1 : -1;
    }

    // Nivel 2: Mayor puntaje en deportes (Baby Fútbol + Quemadas)
    const dSports = sportsPoints[b] - sportsPoints[a];
    if (Math.abs(dSports) > 0.0001) {
      const winner = dSports > 0 ? b : a;
      const loser = dSports > 0 ? a : b;
      tieBreakDecisions.push({
        winner,
        loser,
        criterion: 'deportes',
        reason: `Mayor puntaje en actividades deportivas (Baby Fútbol + Quemadas): ${winner} (${Math.max(sportsPoints[a], sportsPoints[b])} pts) supera a ${loser} (${Math.min(sportsPoints[a], sportsPoints[b])} pts)`
      });
      return dSports > 0 ? 1 : -1;
    }

    // Nivel 3: Mejor posición en Torneo Retro (menor lugar es mejor)
    const dRetro = (retroPlaces[a] || 999) - (retroPlaces[b] || 999);
    if (dRetro !== 0 && (retroPlaces[a] !== 999 || retroPlaces[b] !== 999)) {
      const winner = dRetro < 0 ? a : b;
      const loser = dRetro < 0 ? b : a;
      const bestPlace = Math.min(retroPlaces[a], retroPlaces[b]);
      const worstPlace = Math.max(retroPlaces[a], retroPlaces[b]);
      tieBreakDecisions.push({
        winner,
        loser,
        criterion: 'retro',
        reason: `Mejor posición en Torneo Retro: ${winner} (${bestPlace}° lugar) supera a ${loser} (${worstPlace}° lugar)`
      });
      return dRetro < 0 ? -1 : 1;
    }

    return 0;
  });

  const ranks = {};
  const tieBreaks = { Terror: null, Shooter: null, Action: null };

  sorted.forEach((al, idx) => {
    if (idx === 0) {
      ranks[al] = 1;
    } else {
      const prev = sorted[idx - 1];
      const sameTotal = Math.abs(Number(totals[al].total || 0) - Number(totals[prev].total || 0)) <= 0.0001;
      const same1st = firstPlaces[al] === firstPlaces[prev];
      const sameSports = Math.abs(sportsPoints[al] - sportsPoints[prev]) <= 0.0001;
      const sameRetro = retroPlaces[al] === retroPlaces[prev];
      if (sameTotal && same1st && sameSports && sameRetro) {
        ranks[al] = ranks[prev];
      } else {
        ranks[al] = idx + 1;
      }
    }
  });

  tieBreakDecisions.forEach(decision => {
    if (!tieBreaks[decision.winner]) {
      tieBreaks[decision.winner] = {
        applied: true,
        against: decision.loser,
        criterion: decision.criterion,
        reason: decision.reason
      };
    }
  });

  return { sorted, ranks, tieBreaks, tieBreakDecisions, firstPlaces, sportsPoints, retroPlaces };
}

module.exports = {
  PROVISIONAL_SETTINGS,
  ACTIVITY_POINTS,
  CREATIVE_CHALLENGE,
  SANCTIONS,
  CLAIMS,
  GRADE_PRIZES,
  TARREO_COPA,
  SORPRESAS,
  roundForDisplay,
  distributePointsForTies,
  countFirstPlaces,
  getSportsPoints,
  getRetroPlace,
  resolveGeneralRanking
};
