const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5173;

const security = require('./server_security');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

function getWritablePath(filename) {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpPath = path.join('/tmp', filename);
    if (!fs.existsSync(tmpPath)) {
      const srcPath = path.join(__dirname, filename);
      if (fs.existsSync(srcPath)) {
        try {
          fs.copyFileSync(srcPath, tmpPath);
        } catch (e) {
          console.error(`Error copying ${filename} to /tmp:`, e);
          return srcPath;
        }
      }
    }
    return tmpPath;
  }
  return path.join(__dirname, filename);
}

function loadData() {
  const file = getWritablePath('data.json');
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function saveData(data) {
  const file = getWritablePath('data.json');
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing data.json:', e);
  }
}

function loadStudents() {
  const file = getWritablePath('students.json');
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function saveStudents(students) {
  const file = getWritablePath('students.json');
  try {
    fs.writeFileSync(file, JSON.stringify(students, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing students.json:', e);
  }
}

// Helper: Calculate totals for all alliances
function recalculateGlobalPoints(data) {
  const totals = {
    Terror: { total: 0, day19: 0, creative: 0, tarreoCopa: 0, sorpresas: 0, sanciones: 0 },
    Shooter: { total: 0, day19: 0, creative: 0, tarreoCopa: 0, sorpresas: 0, sanciones: 0 },
    Action: { total: 0, day19: 0, creative: 0, tarreoCopa: 0, sorpresas: 0, sanciones: 0 }
  };

  // 1. Actividades del día 19
  data.activities.forEach(act => {
    ['Terror', 'Shooter', 'Action'].forEach(al => {
      const pts = Number(act.pointsAwarded?.[al] || 0);
      totals[al].day19 += pts;
    });
  });

  // 2. Desafíos creativos
  // Check favorite (highest score among the 3)
  const rubrics = data.creativeChallenges.rubrics;
  let maxScore = -1;
  let topAlliance = null;
  let tieTop = false;

  ['Terror', 'Shooter', 'Action'].forEach(al => {
    const avg = rubrics[al].notaPromedio;
    if (avg !== null && avg !== undefined) {
      if (avg > maxScore) {
        maxScore = avg;
        topAlliance = al;
        tieTop = false;
      } else if (avg === maxScore && maxScore > 0) {
        tieTop = true;
      }
    }
  });

  data.creativeChallenges.favoriteAlliance = tieTop ? 'Empate' : topAlliance;

  ['Terror', 'Shooter', 'Action'].forEach(al => {
    let pts = 0;
    // 1000 pts por entrega
    if (data.creativeChallenges.status[al].delivered) {
      pts += 1000;
    }
    // Hasta 2500 pts por nota docente
    const avg = rubrics[al].notaPromedio;
    if (avg !== null && avg !== undefined) {
      pts += Math.round((avg / 100) * 2500);
    }
    // 500 pts si tiene la obra con la mejor nota
    if (topAlliance === al && !tieTop) {
      pts += 500;
    } else if (tieTop && rubrics[al].notaPromedio === maxScore && maxScore > 0) {
      pts += 250; // split favorite on exact tie
    }
    data.creativeChallenges.pointsAwarded[al] = pts;
    totals[al].creative += pts;
  });

  // 3. Copa de Alianzas Tarreo
  // Cazatesoros
  ['Terror', 'Shooter', 'Action'].forEach(al => {
    totals[al].tarreoCopa += Number(data.tarreoCopa.cazatesoros.pointsAwarded?.[al] || 0);
    totals[al].tarreoCopa += Number(data.tarreoCopa.justdance.pointsAwarded?.[al] || 0);
    totals[al].tarreoCopa += Number(data.tarreoCopa.mimica.pointsAwarded?.[al] || 0);
  });

  // 4. Actividades Sorpresa
  data.sorpresas.forEach(sorp => {
    ['Terror', 'Shooter', 'Action'].forEach(al => {
      const pts = Number(sorp.pointsAwarded?.[al] || 0);
      totals[al].sorpresas += pts;
    });
  });

  // 5. Sanciones (restan)
  data.sanciones.forEach(sanc => {
    const al = sanc.alliance;
    if (totals[al]) {
      const deduction = Number(sanc.pointsDeducted || 0);
      totals[al].sanciones += deduction;
    }
  });

  // Sum total
  ['Terror', 'Shooter', 'Action'].forEach(al => {
    totals[al].total = totals[al].day19 + totals[al].creative + totals[al].tarreoCopa + totals[al].sorpresas - totals[al].sanciones;
    if (totals[al].total < 0) totals[al].total = 0;
  });

  // Ranks
  const sorted = ['Terror', 'Shooter', 'Action'].sort((a, b) => totals[b].total - totals[a].total);
  const ranks = {};
  sorted.forEach((al, idx) => {
    ranks[al] = idx + 1;
  });

  return { totals, ranks };
}

// API: Global Stats
app.get('/api/stats', (req, res) => {
  const data = loadData();
  const students = loadStudents();
  const { totals, ranks } = recalculateGlobalPoints(data);

  // Alliance summary
  const alliancesSummary = {};
  ['Terror', 'Shooter', 'Action'].forEach(al => {
    const studentCount = students.filter(s => s.alliance === al).length;
    alliancesSummary[al] = {
      ...data.alliances[al],
      totalStudents: studentCount,
      points: totals[al],
      rank: ranks[al]
    };
  });

  // Determine current and next activity
  const activeAct = data.activities.find(a => a.status === 'En curso') || null;
  const lastFinished = [...data.activities].reverse().find(a => a.status === 'Terminada') || null;
  const nextPending = data.activities.find(a => a.status === 'Pendiente') || null;

  res.json({
    alliances: alliancesSummary,
    activeActivity: activeAct,
    lastFinishedActivity: lastFinished,
    nextActivity: nextPending,
    activities: data.activities,
    creativeChallenges: data.creativeChallenges,
    tarreoCopa: data.tarreoCopa,
    announcements: data.announcements.filter(a => a.active),
    sorpresas: data.sorpresas,
    activeSorpresa: data.activeSorpresa || null,
    sanciones: data.sanciones,
    reclamos: data.reclamos
  });
});

// Normalizar acentos y tildes para búsqueda flexible
function normalizeSearchText(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Normalizar RUT eliminando puntos, guiones y espacios
function cleanRut(rut) {
  return (rut || '').replace(/[^0-9kK]/g, '').toLowerCase();
}

// Helper: Normalizar nombre de Alianza de manera robusta
function normalizeAlliance(al) {
  if (!al) return null;
  const c = normalizeSearchText(al);
  if (c.includes('terror')) return 'Terror';
  if (c.includes('shoot')) return 'Shooter';
  if (c.includes('action') || c.includes('accion') || c.includes('disen') || c.includes('industr')) return 'Action';
  return al;
}

// API: Search Students (Busca por RUT, Nombre o Carrera, con filtro estricto por alianza y exclusión de inscritos)
app.get('/api/students/search', (req, res) => {
  const rawQuery = (req.query.q || '').trim();
  const rawAlliance = req.query.alliance || null;
  const targetAlliance = normalizeAlliance(rawAlliance);
  const excludeActivity = req.query.excludeActivity || null;
  const students = loadStudents();

  let filtered = students;

  // 1. Filtro estricto por alianza
  if (targetAlliance) {
    filtered = filtered.filter(s => normalizeAlliance(s.alliance) === targetAlliance);
  }

  // 2. Excluir estudiantes ya inscritos en la actividad actual
  if (excludeActivity) {
    const currentData = loadData();
    const actPart = currentData.activityParticipants?.[excludeActivity];
    if (actPart && actPart.lists) {
      const enrolledIds = new Set();
      Object.values(actPart.lists).forEach(list => {
        (list || []).forEach(p => enrolledIds.add(p.studentId));
      });
      filtered = filtered.filter(s => !enrolledIds.has(s.id));
    }
  }

  // 3. Si no hay query de texto y se especificó alianza, devolver los disponibles para seleccionar de inmediato
  if (!rawQuery) {
    if (targetAlliance) {
      return res.json(
        filtered.slice(0, 30).map(s => ({
          id: s.id,
          name: s.name,
          carrera: s.carrera,
          alliance: s.alliance
        }))
      );
    }
    return res.json([]);
  }

  const queryNormalized = normalizeSearchText(rawQuery);
  const queryCleanRut = cleanRut(rawQuery);
  const isRutSearch = queryCleanRut.length >= 3 && /^[0-9]+[0-9kK]?$/.test(queryCleanRut);
  const queryTerms = queryNormalized.split(/\s+/).filter(t => t.length > 0);

  const matches = filtered
    .filter(s => {
      // Coincidencia por RUT
      if (isRutSearch && s.rut) {
        const studentCleanRut = cleanRut(s.rut);
        if (studentCleanRut.includes(queryCleanRut)) {
          return true;
        }
      }

      // Coincidencia por Nombre y Carrera
      const studentNameNorm = normalizeSearchText(s.name || '');
      const studentRawNameNorm = normalizeSearchText(s.rawName || '');
      const studentCarreraNorm = normalizeSearchText(s.carrera || '');

      return queryTerms.every(term => 
        studentNameNorm.includes(term) || 
        studentRawNameNorm.includes(term) || 
        studentCarreraNorm.includes(term)
      );
    })
    .slice(0, 30)
    .map(s => ({
      id: s.id,
      name: s.name,
      carrera: s.carrera,
      alliance: s.alliance
    }));

  res.json(matches);
});

// API: Get all public students grouped by alliance (Padrón oficial para Mi Alianza)
app.get('/api/students/by-alliance', (req, res) => {
  const students = loadStudents();
  const grouped = {
    Terror: [],
    Shooter: [],
    Action: []
  };

  students.forEach(s => {
    if (grouped[s.alliance]) {
      grouped[s.alliance].push({
        id: s.id,
        name: s.name,
        carrera: s.carrera,
        alliance: s.alliance
      });
    }
  });

  // Ordenar alfabéticamente por nombre dentro de cada alianza
  for (const al of ['Terror', 'Shooter', 'Action']) {
    grouped[al].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  res.json(grouped);
});

// API: Get Full Data for Public/Staff
app.get('/api/data', (req, res) => {
  res.json(loadData());
});

// ----------------- SEGURIDAD Y AUDITORÍA OWASP -----------------
function addSecurityAuditLog(entry) {
  try {
    const data = loadData();
    if (!data.auditLogs) data.auditLogs = [];
    data.auditLogs.unshift({
      timestamp: new Date().toISOString(),
      action: entry.action,
      user: entry.user || 'Sistema de Seguridad',
      details: entry.details || {}
    });
    if (data.auditLogs.length > 500) data.auditLogs.pop();
    saveData(data);
  } catch (e) {
    console.error('Error al registrar auditoría de seguridad:', e);
  }
}

// Middlewares de Autorización RBAC
const requireAdminOrCoordOrMesa = [security.requireAuth, security.requireRole(['admin', 'coordinacion', 'mesa'])];
const requireStaffOrPoints = [security.requireAuth, security.requireRole(['admin', 'coordinacion', 'mesa', 'staff'])];
const requireAdminOrCoordOrDocente = [security.requireAuth, security.requireRole(['admin', 'coordinacion', 'docente'])];
const requireAdminOrCoord = [security.requireAuth, security.requireRole(['admin', 'coordinacion'])];
const requireAdminOrCoordOrStaff = [security.requireAuth, security.requireRole(['admin', 'coordinacion', 'staff'])];

// Helper: Extraer autor auditado de la sesión o payload
function getAuditAuthor(req, fallbackName = 'Staff') {
  if (req.user) {
    return `${req.user.name} [${req.user.role}]`;
  }
  return fallbackName;
}

// ----------------- ENDPOINTS DE AUTENTICACIÓN OWASP -----------------
app.post('/api/auth/login', security.checkRateLimit, (req, res) => {
  const { username, password } = req.body;
  const ip = security.getClientIp(req);

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const credentials = security.loadCredentials();
  const user = credentials[username.trim().toLowerCase()];

  if (!user || !security.verifyPassword(password, user.passwordHash)) {
    const trackerResult = security.recordFailedLogin(ip, username, addSecurityAuditLog);
    if (trackerResult.isLocked) {
      return res.status(429).json({
        error: 'Demasiados intentos fallidos. Su acceso ha sido bloqueado temporalmente por 15 minutos por políticas de seguridad OWASP.',
        attemptsLeft: 0
      });
    }
    return res.status(401).json({
      error: 'Credenciales inválidas. Por favor verifique su usuario y contraseña.',
      attemptsLeft: trackerResult.attemptsLeft
    });
  }

  // Login exitoso: Limpiar fallos y crear sesión de 4 horas
  security.recordSuccessfulLogin(ip, user.username, addSecurityAuditLog);
  const session = security.createSession(user, ip);

  res.json({
    success: true,
    token: session.token,
    user: {
      username: session.username,
      name: session.name,
      role: session.role,
      expiresAt: session.expiresAt
    }
  });
});

app.post('/api/auth/logout', security.requireAuth, (req, res) => {
  security.destroySession(req.user.token);
  res.json({ success: true, message: 'Sesión finalizada correctamente' });
});

app.get('/api/auth/me', security.requireAuth, (req, res) => {
  res.json({
    user: {
      username: req.user.username,
      name: req.user.name,
      role: req.user.role,
      expiresAt: req.user.expiresAt
    }
  });
});

app.get('/api/admin/security/audit', security.requireAuth, security.requireRole(['admin']), (req, res) => {
  const data = loadData();
  const logs = (data.auditLogs || []).filter(l => 
    l.details && (
      l.details.type?.startsWith('SECURITY_') || 
      l.action?.toLowerCase().includes('seguridad') || 
      l.action?.toLowerCase().includes('sesión') ||
      l.action?.toLowerCase().includes('acceso')
    )
  );
  res.json({ securityLogs: logs.slice(0, 50) });
});

// 1. Update Place Activity (Torneo retro, Pingpong, Trivia, Canto, Barra)
app.post('/api/admin/activity/places', requireStaffOrPoints, (req, res) => {
  const { activityId, results, loggedBy, notes } = req.body;
  const data = loadData();
  const act = data.activities.find(a => a.id === activityId);
  if (!act) return res.status(404).json({ error: 'Actividad no encontrada' });

  act.results = results; // e.g. { Terror: 1, Shooter: 2, Action: 3 } or ties
  act.notes = notes || act.notes;
  act.status = 'Terminada';

  // Calculate points according to 100%, 60%, 30% of maxPoints
  // Handle ties: if two tie for 1st, (p1 + p2)/2
  const p1 = act.pointsDistribution[0];
  const p2 = act.pointsDistribution[1];
  const p3 = act.pointsDistribution[2];

  const placeMap = { 1: [], 2: [], 3: [] };
  ['Terror', 'Shooter', 'Action'].forEach(al => {
    const pl = Number(results[al]);
    if (placeMap[pl]) placeMap[pl].push(al);
  });

  const awarded = { Terror: 0, Shooter: 0, Action: 0 };
  if (placeMap[1].length === 3) {
    // 3-way tie for 1st
    const split = Math.round((p1 + p2 + p3) / 3);
    awarded.Terror = split;
    awarded.Shooter = split;
    awarded.Action = split;
  } else if (placeMap[1].length === 2) {
    // 2-way tie for 1st
    const split = Math.round((p1 + p2) / 2);
    placeMap[1].forEach(al => awarded[al] = split);
    if (placeMap[3].length === 1) {
      awarded[placeMap[3][0]] = p3;
    }
  } else if (placeMap[1].length === 1) {
    awarded[placeMap[1][0]] = p1;
    if (placeMap[2].length === 2) {
      // 2-way tie for 2nd
      const split = Math.round((p2 + p3) / 2);
      placeMap[2].forEach(al => awarded[al] = split);
    } else if (placeMap[2].length === 1) {
      awarded[placeMap[2][0]] = p2;
      if (placeMap[3].length >= 1) {
        awarded[placeMap[3][0]] = p3;
      }
    }
  }

  act.pointsAwarded = awarded;

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Registro de resultados: ${act.name}`,
    user: getAuditAuthor(req, loggedBy),
    details: { results, pointsAwarded: awarded }
  });

  saveData(data);
  res.json({ success: true, activity: act });
});

// 2. Update Match Tables (Baby Fútbol / Quemadas)
app.post('/api/admin/activity/matches', requireStaffOrPoints, (req, res) => {
  const { activityId, matches, loggedBy } = req.body;
  const data = loadData();
  const act = data.activities.find(a => a.id === activityId);
  if (!act) return res.status(404).json({ error: 'Actividad no encontrada' });

  act.matches = matches;
  act.status = 'Terminada';

  // Compute table: 3 pts win, 1 pt tie, 0 loss
  const table = {
    Terror: { pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0 },
    Shooter: { pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0 },
    Action: { pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0 }
  };

  matches.forEach(m => {
    if (m.score1 !== null && m.score2 !== null) {
      const s1 = Number(m.score1);
      const s2 = Number(m.score2);
      const t1 = m.team1;
      const t2 = m.team2;

      table[t1].pj++;
      table[t2].pj++;
      table[t1].gf += s1;
      table[t1].gc += s2;
      table[t2].gf += s2;
      table[t2].gc += s1;

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

  ['Terror', 'Shooter', 'Action'].forEach(al => {
    table[al].dg = table[al].gf - table[al].gc;
  });

  act.table = table;

  // Rank sorting
  const sorted = ['Terror', 'Shooter', 'Action'].sort((a, b) => {
    if (table[b].pts !== table[a].pts) return table[b].pts - table[a].pts;
    if (table[b].dg !== table[a].dg) return table[b].dg - table[a].dg;
    return table[b].gf - table[a].gf;
  });

  // Calculate awarded points based on ranks (4000, 2400, 1200)
  // Check exact ties in table
  const awarded = { Terror: 0, Shooter: 0, Action: 0 };
  const p1 = act.pointsDistribution[0];
  const p2 = act.pointsDistribution[1];
  const p3 = act.pointsDistribution[2];

  const t0 = table[sorted[0]];
  const t1 = table[sorted[1]];
  const t2 = table[sorted[2]];

  const tie01 = (t0.pts === t1.pts && t0.dg === t1.dg && t0.gf === t1.gf);
  const tie12 = (t1.pts === t2.pts && t1.dg === t2.dg && t1.gf === t2.gf);
  const tie02 = (t0.pts === t2.pts && t0.dg === t2.dg && t0.gf === t2.gf);

  if (tie01 && tie12) {
    const split = Math.round((p1 + p2 + p3) / 3);
    awarded.Terror = split; awarded.Shooter = split; awarded.Action = split;
  } else if (tie01) {
    const split = Math.round((p1 + p2) / 2);
    awarded[sorted[0]] = split;
    awarded[sorted[1]] = split;
    awarded[sorted[2]] = p3;
  } else if (tie12) {
    const split = Math.round((p2 + p3) / 2);
    awarded[sorted[0]] = p1;
    awarded[sorted[1]] = split;
    awarded[sorted[2]] = split;
  } else {
    awarded[sorted[0]] = p1;
    awarded[sorted[1]] = p2;
    awarded[sorted[2]] = p3;
  }

  act.pointsAwarded = awarded;

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Registro partidos: ${act.name}`,
    user: getAuditAuthor(req, loggedBy),
    details: { matches, table, pointsAwarded: awarded }
  });

  saveData(data);
  res.json({ success: true, activity: act });
});

// 3. Update Gymkanas (Formula: 3000 * (promedio / 8))
app.post('/api/admin/activity/gymkanas', requireStaffOrPoints, (req, res) => {
  const { participantScores, loggedBy } = req.body;
  // participantScores: { Terror: [4, 6, 8, ...], Shooter: [...], Action: [...] }
  const data = loadData();
  const act = data.activities.find(a => a.id === 'gymkanas');
  if (!act) return res.status(404).json({ error: 'Gymkanas no encontrada' });

  act.participantCards = participantScores;
  act.status = 'Terminada';

  const awarded = { Terror: 0, Shooter: 0, Action: 0 };
  const averages = { Terror: 0, Shooter: 0, Action: 0 };

  ['Terror', 'Shooter', 'Action'].forEach(al => {
    const list = participantScores[al] || [];
    if (list.length > 0) {
      const sum = list.reduce((a, b) => a + Number(b), 0);
      const avg = sum / list.length;
      averages[al] = Number(avg.toFixed(2));
      // Formula: 3000 * (promedio / 8)
      awarded[al] = Math.round(3000 * (avg / 8));
      if (awarded[al] > 3000) awarded[al] = 3000;
    } else {
      averages[al] = 0;
      awarded[al] = 0;
    }
  });

  act.pointsAwarded = awarded;
  act.averages = averages;

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: 'Registro Gymkanas',
    user: getAuditAuthor(req, loggedBy),
    details: { averages, pointsAwarded: awarded }
  });

  saveData(data);
  res.json({ success: true, activity: act });
});

// 4. Update Activity Status / Time (e.g. Set "En curso")
app.post('/api/admin/activity/status', requireStaffOrPoints, (req, res) => {
  const { activityId, status, loggedBy } = req.body;
  const data = loadData();
  const act = data.activities.find(a => a.id === activityId);
  if (!act) return res.status(404).json({ error: 'Actividad no encontrada' });

  act.status = status;
  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Cambio de estado: ${act.name} -> ${status}`,
    user: getAuditAuthor(req, loggedBy)
  });

  saveData(data);
  res.json({ success: true, activity: act });
});

// 5. Docentes: Evaluar Desafíos Creativos
app.post('/api/admin/docentes/evaluar', requireAdminOrCoordOrDocente, (req, res) => {
  const { alliance, docenteNum, scores, delivered, loggedBy } = req.body;
  // scores: { c1: 'Excelente' | 'Bueno' | 'Regular' | 'Básico', ... }
  const data = loadData();
  const rubric = data.creativeChallenges.rubrics[alliance];
  if (!rubric) return res.status(404).json({ error: 'Alianza no encontrada' });

  if (delivered !== undefined) {
    data.creativeChallenges.status[alliance].delivered = Boolean(delivered);
    if (delivered && !data.creativeChallenges.status[alliance].deliveryTime) {
      data.creativeChallenges.status[alliance].deliveryTime = new Date().toISOString();
    }
  }

  const levelMultipliers = {
    'Excelente': 1.0,
    'Bueno': 0.8,
    'Regular': 0.5,
    'Básico': 0.2,
    'Insatisfactorio': 0.0
  };

  // Calculate teacher score (0 to 100)
  let totalScore = 0;
  rubric.criterios.forEach(crit => {
    const lvl = scores[crit.id] || 'Básico';
    const mult = levelMultipliers[lvl] ?? 0.2;
    totalScore += crit.peso * mult;
  });

  if (docenteNum === 1) {
    rubric.docente1 = scores;
    rubric.docente1Nota = Math.round(totalScore);
  } else if (docenteNum === 2) {
    rubric.docente2 = scores;
    rubric.docente2Nota = Math.round(totalScore);
  }

  // If both evaluated, compute average and check discrepancy (> 20)
  if (rubric.docente1Nota !== null && rubric.docente2Nota !== null) {
    rubric.notaPromedio = Math.round((rubric.docente1Nota + rubric.docente2Nota) / 2);
    const diff = Math.abs(rubric.docente1Nota - rubric.docente2Nota);
    rubric.discrepancyAlert = diff > 20;
    data.creativeChallenges.status[alliance].evaluated = true;
  }

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Evaluación docente ${docenteNum} para ${alliance}`,
    user: getAuditAuthor(req, loggedBy || `Docente ${docenteNum}`),
    details: { totalScore, discrepancyAlert: rubric.discrepancyAlert }
  });

  saveData(data);
  res.json({ success: true, rubric, discrepancyAlert: rubric.discrepancyAlert });
});

// 6. Copa Tarreo: Cazatesoros (with 950 pts tie if all zero)
app.post('/api/admin/tarreo/cazatesoros', requireStaffOrPoints, (req, res) => {
  const { tesoros, loggedBy } = req.body; // { Terror: X, Shooter: Y, Action: Z }
  const data = loadData();
  const c = data.tarreoCopa.cazatesoros;
  c.tesoros = tesoros;
  c.status = 'Terminada';

  const tT = Number(tesoros.Terror || 0);
  const tS = Number(tesoros.Shooter || 0);
  const tA = Number(tesoros.Action || 0);

  const awarded = { Terror: 0, Shooter: 0, Action: 0 };

  if (tT === 0 && tS === 0 && tA === 0) {
    // REGLA OFICIAL: Ninguna alianza encontró tesoro, 950 pts c/u
    c.allZeroTie = true;
    awarded.Terror = 950;
    awarded.Shooter = 950;
    awarded.Action = 950;
  } else {
    c.allZeroTie = false;
    const sorted = ['Terror', 'Shooter', 'Action'].sort((a, b) => Number(tesoros[b] || 0) - Number(tesoros[a] || 0));
    const p1 = 1500; const p2 = 900; const p3 = 450;
    const s0 = Number(tesoros[sorted[0]] || 0);
    const s1 = Number(tesoros[sorted[1]] || 0);
    const s2 = Number(tesoros[sorted[2]] || 0);

    if (s0 === s1 && s1 === s2) {
      const split = Math.round((p1 + p2 + p3) / 3);
      awarded.Terror = split; awarded.Shooter = split; awarded.Action = split;
    } else if (s0 === s1) {
      const split = Math.round((p1 + p2) / 2);
      awarded[sorted[0]] = split;
      awarded[sorted[1]] = split;
      awarded[sorted[2]] = p3;
    } else if (s1 === s2) {
      const split = Math.round((p2 + p3) / 2);
      awarded[sorted[0]] = p1;
      awarded[sorted[1]] = split;
      awarded[sorted[2]] = split;
    } else {
      awarded[sorted[0]] = p1;
      awarded[sorted[1]] = p2;
      awarded[sorted[2]] = p3;
    }
  }

  c.pointsAwarded = awarded;

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: 'Registro Cazatesoros Copa Tarreo',
    user: getAuditAuthor(req, loggedBy),
    details: { tesoros, awarded, allZeroTie: c.allZeroTie }
  });

  saveData(data);
  res.json({ success: true, cazatesoros: c });
});

// 7. Copa Tarreo: Just Dance & Mímica Gamer
app.post('/api/admin/tarreo/copa-places', requireStaffOrPoints, (req, res) => {
  const { eventId, places, loggedBy } = req.body; // eventId: 'justdance' (1500,900,450) or 'mimica' (1000,600,300)
  const data = loadData();
  const c = data.tarreoCopa[eventId];
  if (!c) return res.status(404).json({ error: 'Evento no encontrado' });

  c.places = places;
  c.status = 'Terminada';

  const [p1, p2, p3] = eventId === 'justdance' ? [1500, 900, 450] : [1000, 600, 300];
  const placeMap = { 1: [], 2: [], 3: [] };
  ['Terror', 'Shooter', 'Action'].forEach(al => {
    const pl = Number(places[al]);
    if (placeMap[pl]) placeMap[pl].push(al);
  });

  const awarded = { Terror: 0, Shooter: 0, Action: 0 };
  if (placeMap[1].length === 3) {
    const split = Math.round((p1 + p2 + p3) / 3);
    awarded.Terror = split; awarded.Shooter = split; awarded.Action = split;
  } else if (placeMap[1].length === 2) {
    const split = Math.round((p1 + p2) / 2);
    placeMap[1].forEach(al => awarded[al] = split);
    if (placeMap[3].length === 1) awarded[placeMap[3][0]] = p3;
  } else if (placeMap[1].length === 1) {
    awarded[placeMap[1][0]] = p1;
    if (placeMap[2].length === 2) {
      const split = Math.round((p2 + p3) / 2);
      placeMap[2].forEach(al => awarded[al] = split);
    } else if (placeMap[2].length === 1) {
      awarded[placeMap[2][0]] = p2;
      if (placeMap[3].length >= 1) awarded[placeMap[3][0]] = p3;
    }
  }

  c.pointsAwarded = awarded;

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Registro ${c.name} Copa Tarreo`,
    user: getAuditAuthor(req, loggedBy),
    details: { places, awarded }
  });

  saveData(data);
  res.json({ success: true, event: c });
});

// ----------------- MÓDULO: PRUEBAS SORPRESA (BANCO, LANZAMIENTO Y REGISTRO) -----------------

// Helper para calcular puntos de sorpresas acumulados por alianza
function getSorpresasTotalPoints(data) {
  const totals = { Terror: 0, Shooter: 0, Action: 0 };
  (data.sorpresas || []).forEach(s => {
    ['Terror', 'Shooter', 'Action'].forEach(al => {
      totals[al] += Number(s.pointsAwarded?.[al] || 0);
    });
  });
  return totals;
}

// 1. Obtener Banco de Sorpresas (Exclusivo Admin / Staff)
app.get('/api/admin/sorpresas/bank', requireStaffOrPoints, (req, res) => {
  const data = loadData();
  const totals = getSorpresasTotalPoints(data);
  res.json({
    bank: data.sorpresasBank || [],
    activeSorpresa: data.activeSorpresa || null,
    completedSorpresas: data.sorpresas || [],
    completedCount: (data.sorpresas || []).length,
    accumulatedPoints: totals,
    maxLimitPerAlliance: 3000,
    maxCompletedLimit: 6
  });
});

// 2. Agregar o Modificar Prueba en el Banco (Solo Superadmin)
app.post('/api/admin/sorpresas/bank', security.requireAuth, security.requireRole(['admin']), (req, res) => {
  const { id, name, description, duration, decisionType, metricLabel, metricDirection, material, careNotes, pointsDistribution, checklist, isReserve, suggestedSlot } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre de la prueba sorpresa es obligatorio.' });
  }

  const dur = Number(duration);
  if (isNaN(dur) || dur < 1 || dur > 5) {
    return res.status(400).json({ error: 'La duración debe estar entre 1 y 5 minutos según reglamento.' });
  }

  // Lista de comprobación obligatoria de cuidados y seguridad
  if (!checklist || !checklist.voluntaria || !checklist.sinRiesgo || !checklist.sinContacto || !checklist.sinHumillacion) {
    return res.status(400).json({
      error: 'Lista de comprobación de seguridad obligatoria: debe confirmar que la prueba es voluntaria, sin riesgo físico, sin contacto forzado y sin humillaciones.'
    });
  }

  // Puntos por lugar (Topes oficiales: 1° <= 500 y 1° > 2° > 3°)
  const p1 = Number(pointsDistribution?.[0] ?? 500);
  const p2 = Number(pointsDistribution?.[1] ?? Math.round(p1 * 0.6));
  const p3 = Number(pointsDistribution?.[2] ?? Math.round(p1 * 0.3));

  if (p1 > 500) {
    return res.status(400).json({ error: 'El primer lugar no puede superar los 500 puntos (tope de bases).' });
  }
  if (p1 <= p2 || p2 <= p3 || p3 <= 0) {
    return res.status(400).json({ error: 'Orden de puntajes inválido: el 1° lugar debe ser mayor que el 2°, y el 2° mayor que el 3°.' });
  }

  const data = loadData();
  if (!Array.isArray(data.sorpresasBank)) data.sorpresasBank = [];

  const existingIdx = id ? data.sorpresasBank.findIndex(s => s.id === id) : -1;
  const item = {
    id: id || ('sorp_custom_' + Date.now()),
    name: name.trim(),
    description: (description || '').trim(),
    duration: dur,
    decisionType: decisionType === 'medicion' ? 'medicion' : 'jurado',
    metricLabel: decisionType === 'medicion' ? (metricLabel || 'Rondas o métrica').trim() : null,
    metricDirection: metricDirection === 'asc' ? 'asc' : 'desc',
    material: (material || '').trim(),
    careNotes: (careNotes || '').trim(),
    pointsDistribution: [p1, p2, p3],
    isReserve: Boolean(isReserve),
    suggestedSlot: (suggestedSlot || 'Personalizada').trim(),
    status: isReserve ? 'reserva' : 'disponible'
  };

  if (existingIdx >= 0) {
    data.sorpresasBank[existingIdx] = item;
  } else {
    data.sorpresasBank.push(item);
  }

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Banco de Sorpresas: ${existingIdx >= 0 ? 'Modificada' : 'Nueva'} prueba "${item.name}"`,
    user: getAuditAuthor(req)
  });

  saveData(data);
  res.json({ success: true, item, bank: data.sorpresasBank });
});

// 3. Lanzar Prueba Sorpresa (Staff o Admin) -> Anuncio en Vivo y Cuenta de 1 min
app.post('/api/admin/sorpresas/launch', requireStaffOrPoints, (req, res) => {
  const { sorpresaId, customSorpresa, loggedBy } = req.body;
  const data = loadData();

  if (data.activeSorpresa) {
    return res.status(400).json({
      error: `Ya existe una prueba sorpresa activa en este momento: "${data.activeSorpresa.name}". Debe registrar su resultado o cancelarla antes de lanzar otra.`
    });
  }

  if ((data.sorpresas || []).length >= 6) {
    return res.status(400).json({
      error: 'Límite de bases alcanzado: Ya se realizaron las 6 pruebas sorpresa oficiales. La 7ª es reserva y solo puede usarse si se descartó una previa.'
    });
  }

  let sorp = null;
  if (sorpresaId) {
    sorp = (data.sorpresasBank || []).find(s => s.id === sorpresaId);
  } else if (customSorpresa) {
    // Validar custom
    const dur = Number(customSorpresa.duration || 3);
    const p1 = Number(customSorpresa.pointsDistribution?.[0] ?? 500);
    const p2 = Number(customSorpresa.pointsDistribution?.[1] ?? 300);
    const p3 = Number(customSorpresa.pointsDistribution?.[2] ?? 150);

    if (p1 > 500 || p1 <= p2 || p2 <= p3) {
      return res.status(400).json({ error: 'Puntajes inválidos: máx 500 para 1° lugar y orden decreciente 1° > 2° > 3°.' });
    }
    if (!customSorpresa.checklist || !customSorpresa.checklist.voluntaria || !customSorpresa.checklist.sinRiesgo || !customSorpresa.checklist.sinContacto || !customSorpresa.checklist.sinHumillacion) {
      return res.status(400).json({ error: 'Debe marcar todos los cuidados de la lista de verificación obligatoria para lanzar.' });
    }

    sorp = {
      id: 'sorp_live_' + Date.now(),
      name: customSorpresa.name.trim(),
      description: customSorpresa.description || '',
      duration: dur,
      decisionType: customSorpresa.decisionType || 'jurado',
      metricLabel: customSorpresa.metricLabel || null,
      metricDirection: customSorpresa.metricDirection || 'desc',
      material: customSorpresa.material || '',
      careNotes: customSorpresa.careNotes || '',
      pointsDistribution: [p1, p2, p3]
    };
  }

  if (!sorp) {
    return res.status(404).json({ error: 'Prueba sorpresa no encontrada para lanzar.' });
  }

  const launchedAt = new Date().toISOString();
  const prepEndsAt = new Date(Date.now() + 60 * 1000).toISOString(); // 1 minuto de preparación

  data.activeSorpresa = {
    ...sorp,
    launchedAt,
    prepEndsAt,
    prepDurationSec: 60,
    launchedBy: getAuditAuthor(req, loggedBy)
  };

  // Crear anuncio en vivo para pantalla grande y proyector
  const annId = Date.now();
  data.announcements.unshift({
    id: annId,
    text: `🚨 ¡PRUEBA SORPRESA!: ${sorp.name} • 1 minuto de preparación`,
    target: 'all',
    timestamp: launchedAt,
    active: true,
    isSorpresaAlert: true
  });

  data.auditLogs.unshift({
    timestamp: launchedAt,
    action: `Lanzamiento de Prueba Sorpresa: "${sorp.name}"`,
    user: getAuditAuthor(req, loggedBy)
  });

  saveData(data);
  res.json({ success: true, activeSorpresa: data.activeSorpresa });
});

// 4. Cancelar Prueba Sorpresa Activa
app.post('/api/admin/sorpresas/cancel', requireStaffOrPoints, (req, res) => {
  const { loggedBy, reason } = req.body;
  const data = loadData();

  if (!data.activeSorpresa) {
    return res.status(400).json({ error: 'No hay ninguna prueba sorpresa activa.' });
  }

  const cancelledName = data.activeSorpresa.name;
  data.activeSorpresa = null;

  // Remover anuncio de prueba sorpresa
  data.announcements = (data.announcements || []).filter(a => !a.isSorpresaAlert);

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Prueba Sorpresa Cancelada: "${cancelledName}"`,
    user: getAuditAuthor(req, loggedBy),
    details: { reason: reason || 'Cancelada por el operador' }
  });

  saveData(data);
  res.json({ success: true, message: `Prueba sorpresa "${cancelledName}" cancelada.` });
});

// 5. Registrar Resultado de Prueba Sorpresa
app.post('/api/admin/sorpresas/record', requireStaffOrPoints, (req, res) => {
  const { results, details, loggedBy } = req.body;
  const data = loadData();

  if (!data.activeSorpresa) {
    return res.status(400).json({ error: 'No hay ninguna prueba sorpresa activa para registrar resultado.' });
  }

  if ((data.sorpresas || []).length >= 6) {
    return res.status(400).json({
      error: 'Límite de bases alcanzado: Ya se completaron 6 pruebas sorpresa oficiales.'
    });
  }

  const sorp = data.activeSorpresa;
  const [p1, p2, p3] = sorp.pointsDistribution || [500, 300, 150];

  // Resolver podio (1°, 2°, 3°) según tipo de decisión o resultados directos
  let placeMap = { 1: [], 2: [], 3: [] };

  if (sorp.decisionType === 'jurado' && details?.judges) {
    // 3 Jueces: suma de rangos (1 a 3)
    // Menor suma gana (ej: 1+1+1 = 3 gana sobre 2+2+2 = 6)
    const sums = { Terror: 0, Shooter: 0, Action: 0 };
    [details.judges.judge1, details.judges.judge2, details.judges.judge3].forEach(j => {
      if (j) {
        ['Terror', 'Shooter', 'Action'].forEach(al => {
          sums[al] += Number(j[al] || 3);
        });
      }
    });

    const sortedAlliances = ['Terror', 'Shooter', 'Action'].sort((a, b) => sums[a] - sums[b]);
    const s0 = sums[sortedAlliances[0]];
    const s1 = sums[sortedAlliances[1]];
    const s2 = sums[sortedAlliances[2]];

    if (s0 === s1 && s1 === s2) {
      placeMap[1] = ['Terror', 'Shooter', 'Action'];
    } else if (s0 === s1) {
      placeMap[1] = [sortedAlliances[0], sortedAlliances[1]];
      placeMap[3] = [sortedAlliances[2]];
    } else if (s1 === s2) {
      placeMap[1] = [sortedAlliances[0]];
      placeMap[2] = [sortedAlliances[1], sortedAlliances[2]];
    } else {
      placeMap[1] = [sortedAlliances[0]];
      placeMap[2] = [sortedAlliances[1]];
      placeMap[3] = [sortedAlliances[2]];
    }
  } else if (sorp.decisionType === 'medicion' && details?.metrics) {
    // Medición cuantitativa (rondas ganadas, faltas, personas)
    const m = details.metrics;
    const dir = sorp.metricDirection || 'desc';
    const sorted = ['Terror', 'Shooter', 'Action'].sort((a, b) => {
      const vA = Number(m[a] || 0);
      const vB = Number(m[b] || 0);
      return dir === 'asc' ? (vA - vB) : (vB - vA);
    });

    const v0 = Number(m[sorted[0]] || 0);
    const v1 = Number(m[sorted[1]] || 0);
    const v2 = Number(m[sorted[2]] || 0);

    if (v0 === v1 && v1 === v2) {
      placeMap[1] = ['Terror', 'Shooter', 'Action'];
    } else if (v0 === v1) {
      placeMap[1] = [sorted[0], sorted[1]];
      placeMap[3] = [sorted[2]];
    } else if (v1 === v2) {
      placeMap[1] = [sorted[0]];
      placeMap[2] = [sorted[1], sorted[2]];
    } else {
      placeMap[1] = [sorted[0]];
      placeMap[2] = [sorted[1]];
      placeMap[3] = [sorted[2]];
    }
  } else if (results) {
    // Asignación directa por podio { Terror: 1, Shooter: 2, Action: 3 }
    ['Terror', 'Shooter', 'Action'].forEach(al => {
      const pl = Number(results[al]);
      if (placeMap[pl]) placeMap[pl].push(al);
    });
  }

  // Cálculo de puntos con reglas oficiales de empate
  const awarded = { Terror: 0, Shooter: 0, Action: 0 };
  if (placeMap[1].length === 3) {
    const split = Math.round((p1 + p2 + p3) / 3);
    awarded.Terror = split; awarded.Shooter = split; awarded.Action = split;
  } else if (placeMap[1].length === 2) {
    const split = Math.round((p1 + p2) / 2);
    placeMap[1].forEach(al => awarded[al] = split);
    if (placeMap[3].length === 1) awarded[placeMap[3][0]] = p3;
  } else if (placeMap[1].length === 1) {
    awarded[placeMap[1][0]] = p1;
    if (placeMap[2].length === 2) {
      const split = Math.round((p2 + p3) / 2);
      placeMap[2].forEach(al => awarded[al] = split);
    } else if (placeMap[2].length === 1) {
      awarded[placeMap[2][0]] = p2;
      if (placeMap[3].length >= 1) awarded[placeMap[3][0]] = p3;
    }
  }

  // VALIDACIÓN DE TOPE REGLAMENTARIO: Máximo 3.000 puntos por alianza en sorpresas
  const currentTotals = getSorpresasTotalPoints(data);
  for (const al of ['Terror', 'Shooter', 'Action']) {
    const projected = currentTotals[al] + (awarded[al] || 0);
    if (projected > 3000) {
      return res.status(400).json({
        error: `Tope reglamentario excedido: Alianza ${al} alcanzaría ${projected.toLocaleString('es-CL')} pts en sorpresas (Límite máximo permitido por bases: 3.000 pts). Ajuste los puntajes para no violar el tope.`
      });
    }
  }

  const record = {
    id: sorp.id || Date.now(),
    name: sorp.name,
    decisionType: sorp.decisionType,
    details: details || {},
    pointsAwarded: awarded,
    timestamp: new Date().toISOString(),
    loggedBy: getAuditAuthor(req, loggedBy)
  };

  data.sorpresas.push(record);
  data.activeSorpresa = null;

  // Remover anuncio temporal de sorpresa
  data.announcements = (data.announcements || []).filter(a => !a.isSorpresaAlert);

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Resultado Oficial Sorpresa: "${sorp.name}"`,
    user: getAuditAuthor(req, loggedBy),
    details: record
  });

  saveData(data);
  res.json({ success: true, sorpresa: record, accumulatedPoints: getSorpresasTotalPoints(data) });
});

// Endpoint legado para compatibilidad si alguien lo invoca
app.post('/api/admin/sorpresas', requireStaffOrPoints, (req, res) => {
  const { name, pointsAwarded, loggedBy } = req.body;
  const data = loadData();

  if ((data.sorpresas || []).length >= 6) {
    return res.status(400).json({ error: 'Límite de bases alcanzado: Ya se realizaron 6 pruebas sorpresa oficiales.' });
  }

  const currentTotals = getSorpresasTotalPoints(data);
  const awarded = {
    Terror: Math.min(500, Number(pointsAwarded?.Terror || 0)),
    Shooter: Math.min(500, Number(pointsAwarded?.Shooter || 0)),
    Action: Math.min(500, Number(pointsAwarded?.Action || 0))
  };

  for (const al of ['Terror', 'Shooter', 'Action']) {
    if (currentTotals[al] + awarded[al] > 3000) {
      return res.status(400).json({
        error: `Tope reglamentario excedido: Alianza ${al} alcanzaría ${(currentTotals[al] + awarded[al]).toLocaleString('es-CL')} pts en sorpresas (Máximo 3.000 pts).`
      });
    }
  }

  const newSorp = {
    id: Date.now(),
    name,
    pointsAwarded: awarded,
    timestamp: new Date().toISOString(),
    loggedBy: getAuditAuthor(req, loggedBy)
  };

  data.sorpresas.push(newSorp);
  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Nueva Actividad Sorpresa: ${name}`,
    user: getAuditAuthor(req, loggedBy),
    details: newSorp
  });

  saveData(data);
  res.json({ success: true, sorpresa: newSorp });
});

// 9. Sanciones (200 a 600 puntos)
app.post('/api/admin/sanciones', requireAdminOrCoord, (req, res) => {
  const { alliance, pointsDeducted, reason, authorizedBy } = req.body;
  const data = loadData();
  const pts = Number(pointsDeducted);
  if (pts < 200 || pts > 600) {
    return res.status(400).json({ error: 'La sanción debe estar entre 200 y 600 puntos según bases oficiales' });
  }

  const newSanc = {
    id: Date.now(),
    alliance,
    pointsDeducted: pts,
    reason,
    timestamp: new Date().toISOString(),
    authorizedBy: authorizedBy || 'Coordinadora / Juez'
  };

  data.sanciones.push(newSanc);
  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Sanción aplicada: -${pts} pts a ${alliance}`,
    user: getAuditAuthor(req, authorizedBy),
    details: newSanc
  });

  saveData(data);
  res.json({ success: true, sancion: newSanc });
});

// 10. Reclamos (15 min window)
app.post('/api/admin/reclamos', requireAdminOrCoordOrMesa, (req, res) => {
  const { alliance, activityId, detail } = req.body;
  const data = loadData();
  const newReclamo = {
    id: Date.now(),
    alliance,
    activityId,
    detail,
    timestamp: new Date().toISOString(),
    status: 'Pendiente', // Pendiente, En Revisión, Aceptado, Rechazado
    resolution: ''
  };

  data.reclamos.push(newReclamo);
  saveData(data);
  res.json({ success: true, reclamo: newReclamo });
});

app.post('/api/admin/reclamos/resolver', requireAdminOrCoord, (req, res) => {
  const { reclamoId, status, resolution, loggedBy } = req.body;
  const data = loadData();
  const rec = data.reclamos.find(r => r.id === reclamoId);
  if (!rec) return res.status(404).json({ error: 'Reclamo no encontrado' });

  rec.status = status;
  rec.resolution = resolution;

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Resolución de Reclamo #${reclamoId} -> ${status}`,
    user: getAuditAuthor(req, loggedBy),
    details: { resolution }
  });

  saveData(data);
  res.json({ success: true, reclamo: rec });
});

// 11. Gestión de Alianzas: Cambiar de Alianza a un estudiante (Traslado Individual)
app.post('/api/admin/students/move', requireAdminOrCoordOrStaff, (req, res) => {
  const { studentId, targetAlliance, reason, loggedBy } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'El motivo del cambio es obligatorio para fines de auditoría y transparencia.' });
  }
  const validAlliances = ['Terror', 'Shooter', 'Action'];
  if (!validAlliances.includes(targetAlliance)) {
    return res.status(400).json({ error: 'Alianza de destino no válida.' });
  }
  const students = loadStudents();
  const student = students.find(s => s.id === studentId);
  if (!student) return res.status(404).json({ error: 'Estudiante no encontrado en el padrón oficial.' });

  if (student.alliance === targetAlliance) {
    return res.status(400).json({ error: `El estudiante ya pertenece a la Alianza ${targetAlliance}.` });
  }

  const oldAlliance = student.alliance;
  student.alliance = targetAlliance;
  saveStudents(students);

  // Recalcular conteo por alianza
  const counts = { Terror: 0, Shooter: 0, Action: 0 };
  students.forEach(s => {
    if (counts[s.alliance] !== undefined) counts[s.alliance]++;
  });

  const data = loadData();
  data.allianceCounts = counts;
  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Cambio de Alianza: ${student.name} (${oldAlliance} -> ${targetAlliance})`,
    user: getAuditAuthor(req, loggedBy),
    details: {
      studentId: student.id,
      studentName: student.name,
      oldAlliance,
      newAlliance: targetAlliance,
      reason: reason.trim(),
      type: 'move'
    }
  });
  saveData(data);

  res.json({ success: true, student, oldAlliance, newAlliance: targetAlliance, counts });
});

// Permuta 1 a 1 de Alianzas (Intercambio Atómico)
app.post('/api/admin/students/swap', requireAdminOrCoordOrStaff, (req, res) => {
  const { student1Id, student2Id, reason, loggedBy } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'El motivo de la permuta es obligatorio para fines de auditoría y transparencia.' });
  }
  if (!student1Id || !student2Id) {
    return res.status(400).json({ error: 'Debe seleccionar dos estudiantes para realizar la permuta.' });
  }
  if (student1Id === student2Id) {
    return res.status(400).json({ error: 'No se puede permutar al mismo estudiante consigo mismo.' });
  }

  const students = loadStudents();
  const s1 = students.find(s => s.id === student1Id);
  const s2 = students.find(s => s.id === student2Id);

  if (!s1 || !s2) {
    return res.status(404).json({ error: 'Uno o ambos estudiantes no fueron encontrados en el padrón.' });
  }

  if (s1.alliance === s2.alliance) {
    return res.status(400).json({ error: `Ambos estudiantes ya pertenecen a la misma alianza (${s1.alliance}). Una permuta requiere alianzas distintas.` });
  }

  const s1OldAlliance = s1.alliance;
  const s2OldAlliance = s2.alliance;

  // Intercambio atómico
  s1.alliance = s2OldAlliance;
  s2.alliance = s1OldAlliance;
  saveStudents(students);

  // Recalcular conteo por alianza
  const counts = { Terror: 0, Shooter: 0, Action: 0 };
  students.forEach(s => {
    if (counts[s.alliance] !== undefined) counts[s.alliance]++;
  });

  const data = loadData();
  data.allianceCounts = counts;
  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Permuta de Alianzas: ${s1.name} (${s1OldAlliance} -> ${s1.alliance}) <-> ${s2.name} (${s2OldAlliance} -> ${s2.alliance})`,
    user: getAuditAuthor(req, loggedBy),
    details: {
      student1: { id: s1.id, name: s1.name, from: s1OldAlliance, to: s1.alliance },
      student2: { id: s2.id, name: s2.name, from: s2OldAlliance, to: s2.alliance },
      reason: reason.trim(),
      type: 'swap'
    }
  });
  saveData(data);

  res.json({
    success: true,
    student1: s1,
    student2: s2,
    counts
  });
});

// Historial de Traslados y Permutas
app.get('/api/admin/students/transfers-history', requireAdminOrCoordOrStaff, (req, res) => {
  const data = loadData();
  const transfers = (data.auditLogs || []).filter(l => 
    l.details && (l.details.type === 'move' || l.details.type === 'swap')
  );
  res.json(transfers);
});

// 12. Inscripciones al Tarreo (Fortnite cupo 12 + lista de espera, Valorant, Brawl Wii, Minecraft)
app.post('/api/admin/tarreo/inscribir', requireAdminOrCoordOrMesa, (req, res) => {
  const { game, studentName, alliance } = req.body;
  const data = loadData();

  if (game === 'fortnite') {
    const signups = data.tarreoIndividual.fortniteSignups;
    const waitlist = data.tarreoIndividual.fortniteWaitlist;

    if (signups.length < 12) {
      signups.push({
        id: Date.now(),
        name: studentName,
        alliance,
        registeredAt: new Date().toISOString(),
        cupo: signups.length + 1
      });
      saveData(data);
      return res.json({ success: true, status: 'Inscrito', cupo: signups.length });
    } else {
      waitlist.push({
        id: Date.now(),
        name: studentName,
        alliance,
        registeredAt: new Date().toISOString(),
        posicionEspera: waitlist.length + 1
      });
      saveData(data);
      return res.json({ success: true, status: 'Lista de Espera', posicion: waitlist.length });
    }
  } else if (game === 'valorant') {
    data.tarreoIndividual.valorantSignups.push({ name: studentName, alliance, registeredAt: new Date().toISOString() });
  } else if (game === 'brawl') {
    data.tarreoIndividual.brawlSignups.push({ name: studentName, alliance, registeredAt: new Date().toISOString() });
  } else if (game === 'minecraft') {
    data.tarreoIndividual.minecraftSignups.push({ name: studentName, alliance, registeredAt: new Date().toISOString() });
  }

  saveData(data);
  res.json({ success: true, status: 'Inscrito' });
});

app.get('/api/tarreo/inscritos', (req, res) => {
  const data = loadData();
  res.json(data.tarreoIndividual);
});

// 13. Barra de Avisos
app.post('/api/admin/announcements', requireAdminOrCoordOrMesa, (req, res) => {
  const { text, target, loggedBy } = req.body; // target: 'all' | 'banner' | 'bigscreen'
  const data = loadData();
  const newAnn = {
    id: Date.now(),
    text,
    target: target || 'all',
    timestamp: new Date().toISOString(),
    active: true
  };
  data.announcements.unshift(newAnn);

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Nuevo aviso: "${text}"`,
    user: getAuditAuthor(req, loggedBy)
  });

  saveData(data);
  res.json({ success: true, announcement: newAnn });
});

app.delete('/api/admin/announcements/:id', requireAdminOrCoordOrMesa, (req, res) => {
  const id = Number(req.params.id);
  const data = loadData();
  data.announcements = data.announcements.filter(a => a.id !== id);
  saveData(data);
  res.json({ success: true });
});

// ----------------- MÓDULO 15: PARTICIPANTES POR ACTIVIDAD -----------------
// Obtener participantes de una actividad
app.get('/api/admin/participants/:activityId', requireStaffOrPoints, (req, res) => {
  const { activityId } = req.params;
  const data = loadData();
  const actPart = data.activityParticipants?.[activityId];
  if (!actPart) {
    return res.status(404).json({ error: 'Actividad no encontrada en participantes' });
  }
  res.json(actPart);
});

// Agregar participante con validaciones
app.post('/api/admin/participants/add', requireStaffOrPoints, (req, res) => {
  const { activityId, studentId, alliance, score, loggedBy, reason } = req.body;
  const data = loadData();
  const students = loadStudents();
  const student = students.find(s => s.id === studentId);

  if (!student) {
    return res.status(404).json({ error: 'Estudiante no encontrado en el padrón oficial' });
  }

  // Validación 1: Pertenencia a la Alianza
  if (student.alliance !== alliance) {
    return res.status(400).json({
      error: `Validación rechazada: ${student.name} pertenece a la Alianza ${student.alliance}, no a ${alliance}.`
    });
  }

  const actPart = data.activityParticipants?.[activityId];
  if (!actPart) {
    return res.status(404).json({ error: 'Registro de actividad no disponible' });
  }

  const allianceList = actPart.lists[alliance];

  // Validación 2: Duplicado en la misma actividad
  const alreadyIn = allianceList.some(p => p.studentId === studentId);
  if (alreadyIn) {
    return res.status(400).json({
      error: `El estudiante ${student.name} ya se encuentra registrado en esta actividad para la Alianza ${alliance}.`
    });
  }

  // Validación 3: Cupo máximo
  if (actPart.quotaPerAlliance !== null && allianceList.length >= actPart.quotaPerAlliance) {
    // Si la lista está cerrada o llena, verificar si se sobrepasa
    if (!reason) {
      return res.status(400).json({
        error: `Cupo completo (${actPart.quotaPerAlliance} personas máx.) para la Alianza ${alliance} en esta actividad.`
      });
    }
  }

  // Si la lista está cerrada, requerir motivo obligatorio
  if (actPart.isClosed && !reason) {
    return res.status(400).json({
      error: 'La lista de esta actividad ya está CERRADA. Debe ingresar un motivo justificado para realizar modificaciones.'
    });
  }

  const newParticipant = {
    studentId: student.id,
    name: student.name,
    carrera: student.carrera,
    alliance: student.alliance,
    score: (activityId === 'gymkanas' && score !== undefined) ? Number(score) : null,
    addedAt: new Date().toISOString(),
    addedBy: loggedBy || 'Staff Mesa',
    correctionReason: reason || null
  };

  allianceList.push(newParticipant);

  // Si es Gymkana y tiene score, actualizar automáticamente los cálculos de Gymkana
  if (activityId === 'gymkanas') {
    const act = data.activities.find(a => a.id === 'gymkanas');
    if (act) {
      const allScores = allianceList.map(p => Number(p.score || 0));
      if (!act.participantCards) act.participantCards = { Terror: [], Shooter: [], Action: [] };
      act.participantCards[alliance] = allScores;
      
      const sum = allScores.reduce((a, b) => a + b, 0);
      const avg = allScores.length > 0 ? (sum / allScores.length) : 0;
      if (!act.averages) act.averages = { Terror: 0, Shooter: 0, Action: 0 };
      act.averages[alliance] = Number(avg.toFixed(2));
      act.pointsAwarded[alliance] = Math.round(3000 * (avg / 8));
      if (act.pointsAwarded[alliance] > 3000) act.pointsAwarded[alliance] = 3000;
      act.status = 'En curso';
    }
  }

  actPart.audit.unshift({
    timestamp: new Date().toISOString(),
    action: `Participante agregado: ${student.name} (${alliance})`,
    user: getAuditAuthor(req, loggedBy),
    reason: reason || 'Registro inicial'
  });

  saveData(data);
  res.json({ success: true, participant: newParticipant, actPart });
});

// Eliminar participante (requiere motivo si lista cerrada)
app.post('/api/admin/participants/remove', requireStaffOrPoints, (req, res) => {
  const { activityId, studentId, alliance, loggedBy, reason } = req.body;
  const data = loadData();
  const actPart = data.activityParticipants?.[activityId];
  if (!actPart) return res.status(404).json({ error: 'Actividad no encontrada' });

  if (actPart.isClosed && !reason) {
    return res.status(400).json({ error: 'La lista está CERRADA. Se requiere motivo justificado para eliminar a un participante.' });
  }

  const list = actPart.lists[alliance];
  const idx = list.findIndex(p => p.studentId === studentId);
  if (idx === -1) return res.status(404).json({ error: 'Participante no encontrado en la lista' });

  const removed = list.splice(idx, 1)[0];

  // Si es gymkanas, recalcular
  if (activityId === 'gymkanas') {
    const act = data.activities.find(a => a.id === 'gymkanas');
    if (act) {
      const allScores = list.map(p => Number(p.score || 0));
      act.participantCards[alliance] = allScores;
      const sum = allScores.reduce((a, b) => a + b, 0);
      const avg = allScores.length > 0 ? (sum / allScores.length) : 0;
      act.averages[alliance] = Number(avg.toFixed(2));
      act.pointsAwarded[alliance] = Math.round(3000 * (avg / 8));
    }
  }

  actPart.audit.unshift({
    timestamp: new Date().toISOString(),
    action: `Participante eliminado: ${removed.name} (${alliance})`,
    user: getAuditAuthor(req, loggedBy),
    reason: reason || 'Eliminación estándar'
  });

  saveData(data);
  res.json({ success: true, removed, actPart });
});

// Modificar score de Gymkana individual
app.post('/api/admin/participants/gymkana-score', requireStaffOrPoints, (req, res) => {
  const { studentId, alliance, score, loggedBy, reason } = req.body;
  const data = loadData();
  const actPart = data.activityParticipants?.['gymkanas'];
  if (!actPart) return res.status(404).json({ error: 'Gymkanas no disponible' });

  const p = actPart.lists[alliance].find(item => item.studentId === studentId);
  if (!p) return res.status(404).json({ error: 'Participante no encontrado' });

  const oldScore = p.score;
  p.score = Math.min(8, Math.max(0, Number(score)));

  const act = data.activities.find(a => a.id === 'gymkanas');
  if (act) {
    const allScores = actPart.lists[alliance].map(item => Number(item.score || 0));
    act.participantCards[alliance] = allScores;
    const sum = allScores.reduce((a, b) => a + b, 0);
    const avg = allScores.length > 0 ? (sum / allScores.length) : 0;
    act.averages[alliance] = Number(avg.toFixed(2));
    act.pointsAwarded[alliance] = Math.round(3000 * (avg / 8));
  }

  actPart.audit.unshift({
    timestamp: new Date().toISOString(),
    action: `Puntaje modificado a ${p.name}: ${oldScore} -> ${p.score} pts`,
    user: getAuditAuthor(req, loggedBy),
    reason: reason || 'Ajuste de tarjeta'
  });

  saveData(data);
  res.json({ success: true, participant: p });
});

// Cerrar lista oficial de la actividad
app.post('/api/admin/participants/close', requireStaffOrPoints, (req, res) => {
  const { activityId, loggedBy } = req.body;
  const data = loadData();
  const actPart = data.activityParticipants?.[activityId];
  if (!actPart) return res.status(404).json({ error: 'Actividad no encontrada' });

  actPart.isClosed = true;
  actPart.closedAt = new Date().toISOString();
  actPart.closedBy = loggedBy || 'Encargado de Mesa';

  actPart.audit.unshift({
    timestamp: new Date().toISOString(),
    action: `Cierre Oficial de Lista de Participantes`,
    user: getAuditAuthor(req, loggedBy),
    reason: 'Actividad finalizada'
  });

  saveData(data);
  res.json({ success: true, actPart });
});

// Reabrir lista oficial con motivo
app.post('/api/admin/participants/reopen', requireStaffOrPoints, (req, res) => {
  const { activityId, reason, loggedBy } = req.body;
  const data = loadData();
  const actPart = data.activityParticipants?.[activityId];
  if (!actPart) return res.status(404).json({ error: 'Actividad no encontrada' });

  if (!reason) return res.status(400).json({ error: 'Se requiere un motivo justificado para reabrir la lista.' });

  actPart.isClosed = false;
  actPart.audit.unshift({
    timestamp: new Date().toISOString(),
    action: `Reapertura de Lista Oficial`,
    user: getAuditAuthor(req, loggedBy),
    reason
  });

  saveData(data);
  res.json({ success: true, actPart });
});

// Ficha de historial de participación de un estudiante
app.get('/api/admin/participants/student/:studentId', requireStaffOrPoints, (req, res) => {
  const { studentId } = req.params;
  const students = loadStudents();
  const student = students.find(s => s.id === studentId);
  if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });

  const data = loadData();
  const history = [];

  Object.values(data.activityParticipants || {}).forEach(act => {
    ['Terror', 'Shooter', 'Action'].forEach(al => {
      const record = act.lists[al]?.find(p => p.studentId === studentId);
      if (record) {
        history.push({
          activityId: act.activityId,
          activityName: act.name,
          alliance: al,
          score: record.score,
          addedAt: record.addedAt,
          addedBy: record.addedBy
        });
      }
    });
  });

  res.json({
    student,
    totalParticipations: history.length,
    activities: history
  });
});

// Exportar asistencia a CSV / formato compatible Excel
app.get('/api/admin/participants/export/:activityId', requireStaffOrPoints, (req, res) => {
  const { activityId } = req.params;
  const data = loadData();
  const actPart = data.activityParticipants?.[activityId];
  if (!actPart) return res.status(404).send('Actividad no encontrada');

  let csv = '\uFEFF'; // UTF-8 BOM for Excel
  csv += `LISTA OFICIAL DE PARTICIPANTES - SEMANA DE LAS CARRERAS 2026 (TI & DISEÑO)\r\n`;
  csv += `Actividad:;${actPart.name}\r\n`;
  csv += `Estado Lista:;${actPart.isClosed ? 'CERRADA' : 'ABIERTA'}\r\n`;
  csv += `Fecha Emisión:;${new Date().toLocaleString('es-CL')}\r\n\r\n`;
  csv += `Alianza;N°;Nombre Estudiante;Carrera;Puntaje Gymkana;Hora Registro;Registrado Por;Motivo Corrección\r\n`;

  ['Terror', 'Shooter', 'Action'].forEach(al => {
    const list = actPart.lists[al] || [];
    list.forEach((p, idx) => {
      csv += `${al};${idx + 1};"${p.name}";"${p.carrera || ''}";${p.score !== null ? p.score : '-'};"${p.addedAt}";"${p.addedBy || ''}";"${p.correctionReason || ''}"\r\n`;
    });
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="asistencia_${activityId}_2026.csv"`);
  res.send(csv);
});

// ----------------- ASISTENCIA CONSOLIDADA DEL EVENTO -----------------
// Obtener consolidado de asistencia efectiva (quién asistió y en qué actividad)
app.get('/api/admin/attendance', requireAdminOrCoordOrMesa, (req, res) => {
  const students = loadStudents();
  const data = loadData();
  const actPart = data.activityParticipants || {};

  const studentMap = new Map();
  students.forEach(s => {
    studentMap.set(s.id, {
      id: s.id,
      name: s.name,
      rut: s.rut,
      carrera: s.carrera,
      alliance: s.alliance,
      activities: [],
      attended: false
    });
  });

  Object.entries(actPart).forEach(([actId, actInfo]) => {
    const lists = actInfo.lists || {};
    Object.entries(lists).forEach(([allianceName, list]) => {
      (list || []).forEach(p => {
        let entry = studentMap.get(p.studentId);
        if (!entry) {
          entry = {
            id: p.studentId,
            name: p.name,
            rut: p.rut || '',
            carrera: p.carrera || '',
            alliance: p.alliance || allianceName,
            activities: [],
            attended: true
          };
          studentMap.set(p.studentId, entry);
        }
        entry.attended = true;
        entry.activities.push({
          activityId: actId,
          activityName: actInfo.name || actId,
          alliance: allianceName,
          addedAt: p.addedAt,
          score: p.score ?? null
        });
      });
    });
  });

  const allStudents = Array.from(studentMap.values());
  const attendees = allStudents.filter(s => s.attended);

  const stats = {
    totalPadron: students.length,
    totalAsistentes: attendees.length,
    porcentajeAsistencia: students.length > 0 ? Number(((attendees.length / students.length) * 100).toFixed(1)) : 0,
    totalParticipaciones: attendees.reduce((acc, s) => acc + s.activities.length, 0),
    alianzas: {
      Terror: {
        total: students.filter(s => s.alliance === 'Terror').length,
        asistentes: attendees.filter(s => s.alliance === 'Terror').length
      },
      Shooter: {
        total: students.filter(s => s.alliance === 'Shooter').length,
        asistentes: attendees.filter(s => s.alliance === 'Shooter').length
      },
      Action: {
        total: students.filter(s => s.alliance === 'Action').length,
        asistentes: attendees.filter(s => s.alliance === 'Action').length
      }
    }
  };

  res.json({
    stats,
    attendees,
    allStudents,
    activities: (data.activities || []).map(a => ({ id: a.id, name: a.name }))
  });
});

// Exportar Asistencia Consolidada a CSV
app.get('/api/admin/attendance/export', requireAdminOrCoordOrMesa, (req, res) => {
  const students = loadStudents();
  const data = loadData();
  const actPart = data.activityParticipants || {};

  const studentMap = new Map();
  students.forEach(s => {
    studentMap.set(s.id, {
      id: s.id,
      name: s.name,
      rut: s.rut,
      carrera: s.carrera,
      alliance: s.alliance,
      activities: []
    });
  });

  Object.entries(actPart).forEach(([actId, actInfo]) => {
    const lists = actInfo.lists || {};
    Object.entries(lists).forEach(([allianceName, list]) => {
      (list || []).forEach(p => {
        let entry = studentMap.get(p.studentId);
        if (!entry) {
          entry = {
            id: p.studentId,
            name: p.name,
            rut: p.rut || '',
            carrera: p.carrera || '',
            alliance: p.alliance || allianceName,
            activities: []
          };
          studentMap.set(p.studentId, entry);
        }
        entry.activities.push(actInfo.name || actId);
      });
    });
  });

  const attendees = Array.from(studentMap.values()).filter(s => s.activities.length > 0);

  let csv = '\uFEFF'; // BOM UTF-8
  csv += 'NÓMINA DE ASISTENCIA EFECTIVA - SEMANA DE LAS CARRERAS 2026 (TI & DISEÑO)\r\n';
  csv += `Fecha Emisión:;${new Date().toLocaleString('es-CL')}\r\n`;
  csv += `Total Asistentes Únicos:;${attendees.length} de ${students.length}\r\n\r\n`;
  csv += 'N°;RUT;Nombre Completo;Alianza;Carrera;Total Actividades;Actividades Participadas\r\n';

  attendees.forEach((s, idx) => {
    const acts = s.activities.join(', ');
    csv += `${idx + 1};"${s.rut || '-'}";"${s.name}";"${s.alliance}";"${s.carrera || ''}";${s.activities.length};"${acts}"\r\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="asistencia_evento_carreras_2026.csv"');
  res.send(csv);
});

// ----------------- DASHBOARD EJECUTIVO Y AUDITORÍA (MESA DE CONTROL) -----------------
app.get('/api/dashboard/stats', requireAdminOrCoord, (req, res) => {
  const data = loadData();
  const students = loadStudents();
  const { totals, ranks } = recalculateGlobalPoints(data);

  // 1. Participantes únicos y análisis del padrón (281)
  const uniqueStudentsMap = new Map();
  const activityAttendance = {};

  Object.values(data.activityParticipants || {}).forEach(act => {
    let actTotal = 0;
    ['Terror', 'Shooter', 'Action'].forEach(al => {
      const list = act.lists[al] || [];
      actTotal += list.length;
      list.forEach(p => {
        if (!uniqueStudentsMap.has(p.studentId)) {
          const stu = students.find(s => s.id === p.studentId);
          uniqueStudentsMap.set(p.studentId, {
            id: p.studentId,
            name: p.name,
            carrera: stu?.carrera || p.carrera || 'No informada',
            alliance: al,
            activitiesCount: 1
          });
        } else {
          uniqueStudentsMap.get(p.studentId).activitiesCount++;
        }
      });
    });
    activityAttendance[act.activityId] = {
      name: act.name,
      totalParticipants: actTotal,
      isClosed: act.isClosed,
      quotaPerAlliance: act.quotaPerAlliance
    };
  });

  const totalRegistered = students.length; // 281
  const uniqueParticipants = Array.from(uniqueStudentsMap.values());
  const uniqueCount = uniqueParticipants.length;
  const nonParticipantsCount = Math.max(0, totalRegistered - uniqueCount);
  const participationRate = totalRegistered > 0 ? Number(((uniqueCount / totalRegistered) * 100).toFixed(1)) : 0;

  // Desglose por carrera
  const careerStats = {};
  students.forEach(s => {
    const c = s.carrera || 'Otras';
    if (!careerStats[c]) careerStats[c] = { total: 0, participated: 0 };
    careerStats[c].total++;
  });
  uniqueParticipants.forEach(p => {
    if (careerStats[p.carrera]) {
      careerStats[p.carrera].participated++;
    }
  });

  // Desglose por alianza
  const allianceParticipation = {
    Terror: { total: students.filter(s => s.alliance === 'Terror').length, participated: uniqueParticipants.filter(p => p.alliance === 'Terror').length },
    Shooter: { total: students.filter(s => s.alliance === 'Shooter').length, participated: uniqueParticipants.filter(p => p.alliance === 'Shooter').length },
    Action: { total: students.filter(s => s.alliance === 'Action').length, participated: uniqueParticipants.filter(p => p.alliance === 'Action').length }
  };

  // Ranking de convocatoria por actividad
  const activitiesRanked = Object.values(activityAttendance).sort((a, b) => b.totalParticipants - a.totalParticipants);

  // 1.1 Métricas Institucionales Inteligentes (Estándar DAE y Capacidad de Cancha)
  const totalSlotsPlayed = Object.values(activityAttendance).reduce((acc, a) => acc + a.totalParticipants, 0);
  const totalCapacitySlots = 76; // Capacidad física simultánea de las 8 actividades de cancha
  const occupancyRate = totalSlotsPlayed > 0 ? Number(((totalSlotsPlayed / totalCapacitySlots) * 100).toFixed(1)) : 0;
  const rotationIndex = totalSlotsPlayed > 0 ? Number(((uniqueCount / totalSlotsPlayed) * 100).toFixed(1)) : 100;

  // Semáforo Institucional de Convocatoria (Estándar Educación Superior / DAE)
  let daeAssessment = {
    level: 'Pre-Evento',
    label: 'Plataforma Lista para el 19 de Noviembre',
    detail: 'Padrón oficial de 281 estudiantes habilitado. Listas en cancha listas para registrar asistencia en vivo.',
    color: 'text-slate-400 bg-slate-900 border-slate-700'
  };

  if (uniqueCount > 0) {
    if (participationRate >= 35) {
      daeAssessment = {
        level: 'Masivo',
        label: 'Convocatoria Masiva Excepcional',
        detail: 'Supera con creces los promedios de eventos extracurriculares del Área de Tecnologías y Diseño.',
        color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800'
      };
    } else if (participationRate >= 20) {
      daeAssessment = {
        level: 'Alto',
        label: 'Alta Convocatoria Estudiantil (Supera Estándar DAE)',
        detail: 'Rendimiento óptimo para actividades extracurriculares de educación superior.',
        color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800'
      };
    } else if (participationRate >= 10) {
      daeAssessment = {
        level: 'Normal',
        label: 'Convocatoria Operativa Esperada',
        detail: 'Asistencia activa dentro del rango proyectado para competencias inter-alianzas.',
        color: 'text-amber-400 bg-amber-950/80 border-amber-800'
      };
    } else {
      daeAssessment = {
        level: 'Inicial',
        label: 'Convocatoria Inicial en Cancha',
        detail: 'Registro y rotación de participantes en progreso.',
        color: 'text-blue-400 bg-blue-950/80 border-blue-800'
      };
    }
  }

  // Representatividad transversal
  const activeCareersCount = Object.values(careerStats).filter(c => c.participated > 0).length;
  const totalCareersCount = Object.keys(careerStats).length;
  const activeAlliancesCount = Object.values(allianceParticipation).filter(a => a.participated > 0).length;

  // 2. Podio y Brechas
  const sortedAlliances = ['Terror', 'Shooter', 'Action'].sort((a, b) => totals[b].total - totals[a].total);
  const leaderMargin = totals[sortedAlliances[0]].total - totals[sortedAlliances[1]].total;
  const secondThirdMargin = totals[sortedAlliances[1]].total - totals[sortedAlliances[2]].total;

  // 3. Actividades completadas vs programadas
  const completedActivities = (data.activities || []).filter(a => a.status === 'Terminada').length;
  const totalActivities = (data.activities || []).length;

  // 4. Balance de Reclamos y Sanciones
  const reclamosSummary = {
    total: (data.reclamos || []).length,
    resueltos: (data.reclamos || []).filter(r => r.status === 'Aceptado' || r.status === 'Rechazado').length,
    pendientes: (data.reclamos || []).filter(r => r.status === 'Pendiente' || r.status === 'En Revisión').length
  };
  const totalSancionesPoints = (data.sanciones || []).reduce((acc, s) => acc + Number(s.pointsDeducted || 0), 0);

  // 5. Desafíos Creativos & Control de Discrepancias
  const creativeAudit = {
    rubrics: data.creativeChallenges?.rubrics || {},
    favoriteAlliance: data.creativeChallenges?.favoriteAlliance || null,
    pointsAwarded: data.creativeChallenges?.pointsAwarded || {},
    status: data.creativeChallenges?.status || {}
  };

  res.json({
    summary: {
      leader: sortedAlliances[0],
      leaderPoints: totals[sortedAlliances[0]].total,
      leaderMargin,
      secondThirdMargin,
      sortedAlliances,
      totals,
      ranks,
      totalRegistered,
      uniqueCount,
      nonParticipantsCount,
      participationRate,
      completedActivities,
      totalActivities,
      executionRate: totalActivities > 0 ? Number(((completedActivities / totalActivities) * 100).toFixed(1)) : 0,
      reclamosSummary,
      sancionesCount: (data.sanciones || []).length,
      totalSancionesPoints,
      attendancePerDay: data.tarreoResults?.attendance || { day19: 0, day20_tarreo_attended: 0, day21_closing: 0 },
      daeAssessment,
      occupancyRate,
      totalSlotsPlayed,
      totalCapacitySlots,
      rotationIndex,
      activeCareersCount,
      totalCareersCount,
      activeAlliancesCount,
      verdict: completedActivities > 0 
        ? 'Evento seguro, ordenado y con alta rentabilidad formativa y comunitaria. Recomendado para replicar en 2027.'
        : 'Plataforma oficial lista y configurada para el inicio de las actividades el 19 de Noviembre.'
    },
    participation: {
      totalRegistered,
      uniqueCount,
      nonParticipantsCount,
      participationRate,
      careerStats,
      allianceParticipation,
      activitiesRanked,
      mostTurnout: activitiesRanked[0] || null,
      leastTurnout: activitiesRanked[activitiesRanked.length - 1] || null,
      daeAssessment,
      occupancyRate,
      totalSlotsPlayed,
      totalCapacitySlots,
      rotationIndex,
      activeCareersCount,
      totalCareersCount,
      activeAlliancesCount
    },
    day19: {
      activities: data.activities || [],
      scheduleLogs: data.activityScheduleLogs || {}
    },
    creative: creativeAudit,
    tarreo: {
      results: data.tarreoResults || {},
      copa: data.tarreoCopa || {}
    },
    logistics: {
      resources: data.logisticsResources || [],
      incidents: data.technicalIncidents || [],
      security: data.tarreoResults?.security || { expulsions: 0, emergencyExits: 0, minorInfractions: 1 }
    }
  });
});

// SPA Fallback for Admin Portal
app.get(/^\/admin(\/.+)?$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Fallback to index.html for Public SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor Semana de las Carreras 2026 (TI & Diseño) corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
