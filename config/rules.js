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

// Cálculo oficial de partidos triangulares (Baby Fútbol y Quemadas)
function calculateTriangularStandings(activityId, matches, distribution = [4000, 2400, 1200]) {
  const isQuemadas = activityId === 'quemadas';
  const table = {
    Terror: { pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, rondasGanadas: 0, rondasPerdidas: 0, jugadoresEnPie: 0 },
    Shooter: { pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, rondasGanadas: 0, rondasPerdidas: 0, jugadoresEnPie: 0 },
    Action: { pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, rondasGanadas: 0, rondasPerdidas: 0, jugadoresEnPie: 0 }
  };

  (matches || []).forEach(m => {
    if (m.score1 !== null && m.score2 !== null && m.score1 !== '' && m.score2 !== '') {
      const s1 = Number(m.score1);
      const s2 = Number(m.score2);
      const t1 = m.team1;
      const t2 = m.team2;

      table[t1].pj++;
      table[t2].pj++;

      if (isQuemadas) {
        table[t1].rondasGanadas += s1;
        table[t1].rondasPerdidas += s2;
        table[t2].rondasGanadas += s2;
        table[t2].rondasPerdidas += s1;

        const jp1 = Number(m.standing1 ?? m.jugadoresEnPie1 ?? 0);
        const jp2 = Number(m.standing2 ?? m.jugadoresEnPie2 ?? 0);
        table[t1].jugadoresEnPie += jp1;
        table[t2].jugadoresEnPie += jp2;
      } else {
        table[t1].gf += s1;
        table[t1].gc += s2;
        table[t2].gf += s2;
        table[t2].gc += s1;
      }

      if (s1 > s2) {
        table[t1].pts += 3;
        table[t1].pg++;
        table[t2].pp++;
      } else if (s2 > s1) {
        table[t2].pts += 3;
        table[t2].pg++;
        table[t1].pp++;
      } else {
        table[t1].pts += 1;
        table[t2].pts += 1;
        table[t1].pe++;
        table[t2].pe++;
      }
    }
  });

  if (!isQuemadas) {
    ['Terror', 'Shooter', 'Action'].forEach(al => {
      table[al].dg = table[al].gf - table[al].gc;
    });
  }

  // Ordenamiento con criterios oficiales
  const sorted = ['Terror', 'Shooter', 'Action'].sort((a, b) => {
    const tA = table[a];
    const tB = table[b];
    if (tB.pts !== tA.pts) return tB.pts - tA.pts;

    if (isQuemadas) {
      // Quemadas: 1. Rondas ganadas, 2. Jugadores en pie
      if (tB.rondasGanadas !== tA.rondasGanadas) return tB.rondasGanadas - tA.rondasGanadas;
      if (tB.jugadoresEnPie !== tA.jugadoresEnPie) return tB.jugadoresEnPie - tA.jugadoresEnPie;
      return 0;
    } else {
      // Baby Fútbol: 1. Diferencia de goles, 2. Goles a favor
      if (tB.dg !== tA.dg) return tB.dg - tA.dg;
      if (tB.gf !== tA.gf) return tB.gf - tA.gf;
      return 0;
    }
  });

  // Determinar empates en la tabla
  const isTied = (x, y) => {
    if (x.pts !== y.pts) return false;
    if (isQuemadas) {
      return x.rondasGanadas === y.rondasGanadas && x.jugadoresEnPie === y.jugadoresEnPie;
    } else {
      return x.dg === y.dg && x.gf === y.gf;
    }
  };

  const t0 = table[sorted[0]];
  const t1 = table[sorted[1]];
  const t2 = table[sorted[2]];

  const tie01 = isTied(t0, t1);
  const tie12 = isTied(t1, t2);

  const places = {};
  if (tie01 && tie12) {
    places[sorted[0]] = 1;
    places[sorted[1]] = 1;
    places[sorted[2]] = 1;
  } else if (tie01) {
    places[sorted[0]] = 1;
    places[sorted[1]] = 1;
    places[sorted[2]] = 3;
  } else if (tie12) {
    places[sorted[0]] = 1;
    places[sorted[1]] = 2;
    places[sorted[2]] = 2;
  } else {
    places[sorted[0]] = 1;
    places[sorted[1]] = 2;
    places[sorted[2]] = 3;
  }

  // Distribución equitativa sin redondeo prematuro (Decisión 2)
  const p1 = Number(distribution[0] || 4000);
  const p2 = Number(distribution[1] || 2400);
  const p3 = Number(distribution[2] || 1200);

  const awarded = {};
  if (tie01 && tie12) {
    const split = Number(((p1 + p2 + p3) / 3).toFixed(2));
    awarded[sorted[0]] = split;
    awarded[sorted[1]] = split;
    awarded[sorted[2]] = split;
  } else if (tie01) {
    const split = Number(((p1 + p2) / 2).toFixed(2));
    awarded[sorted[0]] = split;
    awarded[sorted[1]] = split;
    awarded[sorted[2]] = p3;
  } else if (tie12) {
    const split = Number(((p2 + p3) / 2).toFixed(2));
    awarded[sorted[0]] = p1;
    awarded[sorted[1]] = split;
    awarded[sorted[2]] = split;
  } else {
    awarded[sorted[0]] = p1;
    awarded[sorted[1]] = p2;
    awarded[sorted[2]] = p3;
  }

  return { table, sorted, places, awarded };
}

// Cálculo del puntaje docente según los 4 niveles estrictos de las Bases
function calculateDocenteScore(criterios, scores) {
  const allowed = {
    'Excelente': 1.0,
    'Bueno': 0.8,
    'Regular': 0.5,
    'Básico': 0.2,
    'Basico': 0.2
  };

  let totalScore = 0;
  for (const crit of (criterios || [])) {
    const lvl = scores[crit.id];
    if (lvl === 'sin evaluar' || lvl === null || lvl === undefined) {
      continue;
    }
    if (!(lvl in allowed)) {
      throw new Error(`Nivel de rúbrica inválido: "${lvl}". Solo se permiten los 4 niveles oficiales: Excelente (100%), Bueno (80%), Regular (50%) y Básico (20%).`);
    }
    totalScore += crit.peso * allowed[lvl];
  }
  return totalScore;
}

// Cálculo del Desafío Creativo (Entrega 1.000 + Nota Docente hasta 2.500 + Obra Favorita 500)
// Aplica Decisión 1 (máx 500 repartido en empates) y Regla de Discrepancia > 20 pts
function calculateCreativeScores(creativeChallenges) {
  if (!creativeChallenges || !creativeChallenges.rubrics) {
    return {
      pointsAwarded: { Terror: 0, Shooter: 0, Action: 0 },
      breakdown: {},
      favoriteAlliances: [],
      favoriteAllianceText: null,
      hasProvisional: false
    };
  }

  const rubrics = creativeChallenges.rubrics;
  const status = creativeChallenges.status || {};
  const alliances = ['Terror', 'Shooter', 'Action'];

  // Identificar alianzas con nota docente válida y definitiva (no en revisión por discrepancia)
  let maxScore = -1;
  let eligibleTopAlliances = [];
  let hasProvisional = false;

  alliances.forEach(al => {
    const r = rubrics[al];
    if (!r) return;

    const isPendingDiscrepancy = (r.discrepancyAlert || r.estado === 'revisión conjunta pendiente') && !r.discrepancyResolved;
    if (isPendingDiscrepancy) {
      hasProvisional = true;
      r.estado = 'revisión conjunta pendiente';
      r.notaDefinitiva = false;
      return; // Queda fuera de la obra favorita hasta acordar nota
    }

    const avg = r.notaPromedio;
    if (avg !== null && avg !== undefined && !isNaN(avg)) {
      if (avg > maxScore) {
        maxScore = avg;
        eligibleTopAlliances = [al];
      } else if (avg === maxScore && maxScore > 0) {
        eligibleTopAlliances.push(al);
      }
    }
  });

  // Reparto exacto de los 500 puntos de Obra Favorita (Decisión 1)
  const favoritePointsPerAlliance = { Terror: 0, Shooter: 0, Action: 0 };
  if (eligibleTopAlliances.length === 1) {
    favoritePointsPerAlliance[eligibleTopAlliances[0]] = 500;
  } else if (eligibleTopAlliances.length === 2) {
    eligibleTopAlliances.forEach(al => favoritePointsPerAlliance[al] = 250);
  } else if (eligibleTopAlliances.length === 3) {
    eligibleTopAlliances.forEach(al => favoritePointsPerAlliance[al] = Number((500 / 3).toFixed(2))); // 166.67
  }

  const pointsAwarded = {};
  const breakdown = {};

  alliances.forEach(al => {
    const r = rubrics[al] || {};
    const st = status[al] || {};
    let pts = 0;

    // 1000 pts por entrega dentro de plazo
    const isDelivered = st.delivered === true || st.delivered === 'true';
    const deliveryPts = isDelivered ? 1000 : 0;
    pts += deliveryPts;

    // Hasta 2500 pts proporcionales a la nota docente promedio
    let gradePts = 0;
    const avg = r.notaPromedio;
    if (avg !== null && avg !== undefined && !isNaN(avg)) {
      gradePts = (Number(avg) / 100) * 2500;
      pts += gradePts;
    }

    // Puntos de obra favorita (solo si califica)
    const favPts = favoritePointsPerAlliance[al] || 0;
    pts += favPts;

    pointsAwarded[al] = pts;
    breakdown[al] = {
      delivered: isDelivered,
      deliveryPts,
      notaPromedio: avg,
      gradePts,
      favoritePts: favPts,
      isPendingDiscrepancy: (r.discrepancyAlert || r.estado === 'revisión conjunta pendiente') && !r.discrepancyResolved,
      total: pts
    };
  });

  const favoriteAllianceText = eligibleTopAlliances.length === 1 
    ? eligibleTopAlliances[0] 
    : (eligibleTopAlliances.length > 1 ? `Empate (${eligibleTopAlliances.join(', ')})` : null);

  return {
    pointsAwarded,
    breakdown,
    favoriteAlliances: eligibleTopAlliances,
    favoriteAllianceText,
    favoritePointsPerAlliance,
    hasProvisional
  };
}

// Evaluación de ventana de reclamos (15 minutos tras término de actividad, Sección 8)
function evaluateClaimWindow(activityEndedAt, claimTimestamp = new Date()) {
  if (!activityEndedAt) {
    return { isWithinWindow: true, diffMinutes: 0, status: 'dentro de plazo' };
  }
  const endMs = new Date(activityEndedAt).getTime();
  const claimMs = new Date(claimTimestamp).getTime();
  const diffMs = claimMs - endMs;
  const diffMinutes = diffMs / (60 * 1000);

  // A los 15 minutos exactos (o menos): dentro de plazo. Más de 15 minutos: fuera de plazo.
  const isWithinWindow = diffMs <= 15 * 60 * 1000;
  return {
    isWithinWindow,
    diffMinutes,
    status: isWithinWindow ? 'dentro de plazo' : 'fuera de plazo'
  };
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
  resolveGeneralRanking,
  calculateTriangularStandings,
  calculateDocenteScore,
  calculateCreativeScores,
  evaluateClaimWindow
};
