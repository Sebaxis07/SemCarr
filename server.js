const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5173;

const security = require('./server_security');
const rules = require('./config/rules');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));
app.use('/alianzas', express.static(path.join(__dirname, 'alianzas')));

let defaultData = null;
try {
  defaultData = require('./data.json');
} catch (e) {
  try { defaultData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8')); } catch (_) {}
}

let defaultStudents = null;
try {
  defaultStudents = require('./students.json');
} catch (e) {
  try { defaultStudents = JSON.parse(fs.readFileSync(path.join(__dirname, 'students.json'), 'utf8')); } catch (_) {}
}

function getWritablePath(filename) {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpPath = path.join(os.tmpdir(), filename);
    if (!fs.existsSync(tmpPath)) {
      const candidates = [
        path.join(process.cwd(), filename),
        path.join(__dirname, filename),
        path.join(__dirname, '..', filename)
      ];
      let copied = false;
      for (const src of candidates) {
        if (fs.existsSync(src)) {
          try {
            fs.copyFileSync(src, tmpPath);
            copied = true;
            break;
          } catch (e) {
            console.error(`Error copying ${src} to tmpdir:`, e);
          }
        }
      }
      if (!copied) {
        try {
          let seed = null;
          if (filename === 'data.json') seed = defaultData;
          else if (filename === 'students.json') seed = defaultStudents;
          if (seed) {
            fs.writeFileSync(tmpPath, JSON.stringify(seed, null, 2), 'utf-8');
          }
        } catch (e) {
          console.error(`Error seeding ${tmpPath}:`, e);
        }
      }
    }
    return tmpPath;
  }
  return path.join(__dirname, filename);
}

function loadData() {
  try {
    const file = getWritablePath('data.json');
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch (e) {
    console.error('Error in loadData():', e);
  }
  return defaultData ? JSON.parse(JSON.stringify(defaultData)) : {};
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
  try {
    const file = getWritablePath('students.json');
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch (e) {
    console.error('Error in loadStudents():', e);
  }
  return defaultStudents ? JSON.parse(JSON.stringify(defaultStudents)) : [];
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

  // 2. Desafíos creativos (con Decisión 1 de obra favorita y regla de discrepancia > 20)
  const creativeResult = rules.calculateCreativeScores(data.creativeChallenges);
  data.creativeChallenges.pointsAwarded = creativeResult.pointsAwarded;
  data.creativeChallenges.favoriteAlliance = creativeResult.favoriteAllianceText;
  data.creativeChallenges.hasProvisional = creativeResult.hasProvisional;

  ['Terror', 'Shooter', 'Action'].forEach(al => {
    totals[al].creative = Number(creativeResult.pointsAwarded[al] || 0);
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
    totals[al].displayTotal = rules.roundForDisplay(totals[al].total);
    totals[al].displayDay19 = rules.roundForDisplay(totals[al].day19);
    totals[al].displayCreative = rules.roundForDisplay(totals[al].creative);
    totals[al].displayTarreoCopa = rules.roundForDisplay(totals[al].tarreoCopa);
    totals[al].displaySorpresas = rules.roundForDisplay(totals[al].sorpresas);
    totals[al].displaySanciones = rules.roundForDisplay(totals[al].sanciones);
  });

  // Ranks con desempate general de 3 niveles según Sección 8 de las Bases
  const { sorted, ranks, tieBreaks, tieBreakDecisions } = rules.resolveGeneralRanking(totals, data);

  return { totals, ranks, sorted, tieBreaks, tieBreakDecisions };
}

// API: Global Stats
app.get('/api/stats', (req, res) => {
  try {
    const data = loadData();
    const students = loadStudents();
    const { totals, ranks, sorted, tieBreaks, tieBreakDecisions } = recalculateGlobalPoints(data);

    // Alliance summary
    const alliancesSummary = {};
    ['Terror', 'Shooter', 'Action'].forEach(al => {
      const studentCount = (students || []).filter(s => s.alliance === al).length;
      alliancesSummary[al] = {
        ...(data.alliances?.[al] || {}),
        totalStudents: studentCount,
        points: totals[al],
        rank: ranks[al],
        tieBreak: tieBreaks?.[al] || null
      };
    });

    // Determine current and next activity
    const activities = data.activities || [];
    const activeAct = activities.find(a => a.status === 'En curso') || null;
    const lastFinished = [...activities].reverse().find(a => a.status === 'Terminada') || null;
    const nextPending = activities.find(a => a.status === 'Pendiente') || null;

    res.json({
      alliances: alliancesSummary,
      sortedAlliances: sorted,
      tieBreaks: tieBreaks,
      tieBreakDecisions: tieBreakDecisions,
      activeActivity: activeAct,
      lastFinishedActivity: lastFinished,
      nextActivity: nextPending,
      activities: activities,
      creativeChallenges: data.creativeChallenges || {},
      tarreoCopa: data.tarreoCopa || {},
      announcements: (data.announcements || []).filter(a => a.active),
      sorpresas: data.sorpresas || [],
      activeSorpresa: data.activeSorpresa || null,
      sanciones: data.sanciones || {},
      reclamos: data.reclamos || [],
      eventClosed: Boolean(data.eventClosed),
      eventClosedAt: data.eventClosedAt || null,
      eventClosedBy: data.eventClosedBy || null,
      gradePrizes: data.eventClosed ? data.finalGradePrizes : null
    });
  } catch (err) {
    console.error('Error in /api/stats:', err);
    res.status(500).json({ error: 'Error al cargar stats: ' + err.message });
  }
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

// Helper: Obtener usuario autenticado si existe sesión válida
function getAuthUser(req) {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-session-token']) {
    token = req.headers['x-session-token'];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }
  if (!token) return null;
  return security.getSession(token);
}

// Rate limiter en memoria para buscador público por dispositivo/IP (30 req/min)
const searchRateLimiter = new Map();
function checkSearchRateLimit(ip) {
  const now = Date.now();
  let rec = searchRateLimiter.get(ip);
  if (!rec || now > rec.resetAt) {
    rec = { count: 1, resetAt: now + 60000 };
    searchRateLimiter.set(ip, rec);
    return { ok: true };
  }
  rec.count++;
  if (rec.count > 30) {
    const retryAfter = Math.ceil((rec.resetAt - now) / 1000);
    return { ok: false, retryAfter };
  }
  return { ok: true };
}

// API: Search Students (Busca por Nombre o Carrera en público; RUT solo para administradores autenticados)
app.get('/api/students/search', (req, res) => {
  const ip = security.getClientIp(req);
  const authUser = getAuthUser(req);
  const isAdminOrStaff = Boolean(authUser && ['admin', 'coordinacion', 'mesa', 'staff'].includes(authUser.role));

  if (!isAdminOrStaff) {
    const rate = checkSearchRateLimit(ip);
    if (!rate.ok) {
      res.setHeader('Retry-After', rate.retryAfter);
      return res.status(429).json({
        error: 'Límite de consultas excedido para este dispositivo: por favor espera un momento antes de volver a buscar',
        retryAfterSeconds: rate.retryAfter
      });
    }
  }

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

  // 3. Si no hay query de texto y se especificó alianza (uso admin para selectores rápidos)
  if (!rawQuery) {
    if (targetAlliance && isAdminOrStaff) {
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
  const isRutPattern = queryCleanRut.length >= 3 && /^[0-9]+[0-9kK]?$/.test(queryCleanRut);
  const queryTerms = queryNormalized.split(/\s+/).filter(t => t.length > 0);

  // La búsqueda por RUT solo está disponible para personal autenticado de mesa de control
  const allowRutMatch = isAdminOrStaff;

  const matches = filtered
    .filter(s => {
      // Coincidencia por RUT solo para personal autorizado
      if (allowRutMatch && isRutPattern && s.rut) {
        const studentCleanRut = cleanRut(s.rut);
        if (studentCleanRut.includes(queryCleanRut)) {
          return true;
        }
      }

      // Si la consulta pública es por RUT, no confirmar existencia y rechazar coincidencia
      if (!allowRutMatch && isRutPattern) {
        return false;
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
    .map(s => {
      if (isAdminOrStaff) {
        return {
          id: s.id,
          name: s.name,
          carrera: s.carrera,
          alliance: s.alliance
        };
      }
      // Público: devuelve única y exclusivamente nombre, alianza y carrera. Nunca RUT, correo ni id.
      return {
        name: s.name,
        alliance: s.alliance,
        carrera: s.carrera
      };
    });

  res.json(matches);
});

// API: Get all public students grouped by alliance (Padrón oficial para Mi Alianza)
app.get('/api/students/by-alliance', (req, res) => {
  try {
    const students = loadStudents();
    const grouped = {
      Terror: [],
      Shooter: [],
      Action: []
    };

    (students || []).forEach(s => {
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
  } catch (err) {
    console.error('Error in /api/students/by-alliance:', err);
    res.status(500).json({ error: 'Error al cargar estudiantes: ' + err.message });
  }
});

// API: Get Full Data for Public/Staff
app.get('/api/data', (req, res) => {
  try {
    res.json(loadData());
  } catch (err) {
    console.error('Error in /api/data:', err);
    res.status(500).json({ error: 'Error al cargar data: ' + err.message });
  }
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
  const { activityId, results, detail, loggedBy, notes } = req.body;
  const data = loadData();
  const act = data.activities.find(a => a.id === activityId);
  if (!act) return res.status(404).json({ error: 'Actividad no encontrada' });

  let awarded;
  let places = results;

  if (detail) {
    try {
      const computed = rules.calculateActivityDetailedScores(activityId, detail);
      places = computed.places;
      awarded = computed.awarded;
      act.detailedScores = detail;
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  } else {
    // Distribuir puntos con precisión decimal y manejo de empates según Bases
    awarded = rules.distributePointsForTies(act.pointsDistribution, results);
  }

  const prevAwarded = act.pointsAwarded;
  act.results = places;
  act.notes = notes || act.notes;
  act.status = 'Terminada';
  if (!act.horaTermino) act.horaTermino = new Date().toISOString();
  act.pointsAwarded = awarded;

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Registro de resultados: ${act.name}`,
    user: getAuditAuthor(req, loggedBy),
    details: { valorAnterior: prevAwarded, valorNuevo: awarded, results: places }
  });

  saveData(data);
  res.json({ success: true, activity: act });
});

// Registro detallado de actividad con cálculo automático de posiciones
app.post('/api/admin/activity/detail', requireStaffOrPoints, (req, res) => {
  const { activityId, detail, loggedBy, notes } = req.body;
  const data = loadData();
  const act = data.activities.find(a => a.id === activityId);
  if (!act) return res.status(404).json({ error: 'Actividad no encontrada' });

  let computed;
  try {
    computed = rules.calculateActivityDetailedScores(activityId, detail);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const prevAwarded = act.pointsAwarded;
  act.detailedScores = detail;
  act.results = computed.places;
  act.pointsAwarded = computed.awarded;
  act.notes = notes || act.notes;
  act.status = 'Terminada';
  if (!act.horaTermino) act.horaTermino = new Date().toISOString();

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Registro detallado de planilla: ${act.name}`,
    user: getAuditAuthor(req, loggedBy),
    details: {
      activityId,
      valorAnterior: prevAwarded,
      valorNuevo: computed.awarded,
      lugares: computed.places,
      detalle: detail
    }
  });

  saveData(data);
  res.json({ success: true, activity: act, computed });
});

// 2. Update Match Tables (Baby Fútbol / Quemadas)
app.post('/api/admin/activity/matches', requireStaffOrPoints, (req, res) => {
  const { activityId, matches, loggedBy } = req.body;
  const data = loadData();
  const act = data.activities.find(a => a.id === activityId);
  if (!act) return res.status(404).json({ error: 'Actividad no encontrada' });

  // Validar paridad y mínimos reglamentarios por partido si se informan jugadores
  for (let i = 0; i < (matches || []).length; i++) {
    const m = matches[i];
    const c1 = m.team1Count ?? (Array.isArray(m.lineup1) ? m.lineup1.length : null);
    const c2 = m.team2Count ?? (Array.isArray(m.lineup2) ? m.lineup2.length : null);

    if (c1 !== null && c2 !== null) {
      const v = rules.validateMatchLineup(activityId, c1, c2, {
        allowException: m.allowException,
        exceptionReason: m.exceptionReason,
        authorizedBy: loggedBy
      });

      if (!v.valid) {
        return res.status(400).json({ error: `Partido ${i + 1} (${m.team1} vs ${m.team2}): ${v.error}` });
      }

      if (v.hasException) {
        data.auditLogs.unshift({
          timestamp: new Date().toISOString(),
          action: `Excepción de alineación autorizada en ${act.name}: ${m.team1} (${c1}) vs ${m.team2} (${c2})`,
          user: getAuditAuthor(req, loggedBy),
          details: { activityId, partido: i + 1, motivo: v.exceptionReason }
        });
      }
    }
  }

  act.matches = matches;
  act.status = 'Terminada';
  if (!act.horaTermino) act.horaTermino = new Date().toISOString();

  // Calcular tabla, desempates según deporte y puntos oficiales
  const { table, sorted, places, awarded } = rules.calculateTriangularStandings(activityId, matches, act.pointsDistribution);

  act.table = table;
  act.results = places;
  act.pointsAwarded = awarded;

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Registro partidos: ${act.name}`,
    user: getAuditAuthor(req, loggedBy),
    details: { matches, table, results: places, pointsAwarded: awarded }
  });

  saveData(data);
  res.json({ success: true, activity: act });
});

// Validar paridad y cantidad de jugadores por partido (Baby fútbol, Quemadas, Retro, Taca-taca, Ping pong)
app.post('/api/admin/matches/validate-lineup', requireStaffOrPoints, (req, res) => {
  const { activityId, team1Count, team2Count, allowException, exceptionReason, loggedBy } = req.body;
  const validation = rules.validateMatchLineup(activityId, team1Count, team2Count, {
    allowException: Boolean(allowException),
    exceptionReason,
    authorizedBy: loggedBy
  });

  if (!validation.valid) {
    return res.status(400).json(validation);
  }

  if (validation.hasException) {
    const data = loadData();
    data.auditLogs.unshift({
      timestamp: new Date().toISOString(),
      action: `Excepción de alineación autorizada en ${activityId}`,
      user: getAuditAuthor(req, loggedBy),
      details: { activityId, team1Count, team2Count, motivo: validation.exceptionReason }
    });
    saveData(data);
  }

  res.json(validation);
});

// Ingreso de suplente durante el partido (sustitución oficial)
app.post('/api/admin/matches/substitute', requireStaffOrPoints, (req, res) => {
  const { activityId, alliance, playerOutId, playerInId, reason, matchIndex, loggedBy } = req.body;
  const data = loadData();
  const students = loadStudents();

  const playerOut = students.find(s => s.id === playerOutId);
  const playerIn = students.find(s => s.id === playerInId);

  if (!playerOut || !playerIn) {
    return res.status(404).json({ error: 'Uno o ambos jugadores no existen en el padrón.' });
  }

  if (playerIn.alliance !== alliance) {
    return res.status(400).json({ error: `El suplente ${playerIn.name} debe pertenecer a la Alianza ${alliance}.` });
  }

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Sustitución en cancha: ${alliance} en ${activityId}`,
    user: getAuditAuthor(req, loggedBy),
    details: {
      activityId,
      alliance,
      sale: { id: playerOut.id, name: playerOut.name },
      entra: { id: playerIn.id, name: playerIn.name },
      motivo: reason || 'Cambio de suplente',
      partido: matchIndex
    }
  });

  saveData(data);
  res.json({
    success: true,
    message: `Sustitución registrada: sale ${playerOut.name}, entra suplente ${playerIn.name}.`
  });
});

// 3. Update Gymkanas con trazabilidad por persona y por puesto (4 puestos de destreza)
app.post('/api/admin/activity/gymkanas', requireStaffOrPoints, (req, res) => {
  const { participantsDetail, participantScores, loggedBy } = req.body;
  const data = loadData();
  const act = data.activities.find(a => a.id === 'gymkanas');
  if (!act) return res.status(404).json({ error: 'Gymkanas no encontrada' });

  const rawInput = participantsDetail || participantScores || {};
  const normalizedDetail = { Terror: [], Shooter: [], Action: [] };
  const awarded = { Terror: 0, Shooter: 0, Action: 0 };
  const averages = { Terror: 0, Shooter: 0, Action: 0 };

  ['Terror', 'Shooter', 'Action'].forEach(al => {
    const list = rawInput[al] || [];
    const formattedList = list.map((item, idx) => {
      let posts = [];
      let studentName = `Participante ${idx + 1}`;
      let studentId = item.studentId || null;

      if (typeof item === 'number') {
        // Compatibilidad: migrar número plano a 4 puestos
        posts = rules.migrateGymkanaScoreToPosts(item);
      } else if (item && Array.isArray(item.posts)) {
        posts = item.posts;
        if (item.name) studentName = item.name;
      } else if (item && typeof item.score === 'number') {
        posts = rules.migrateGymkanaScoreToPosts(item.score);
        if (item.name) studentName = item.name;
      }

      // El total de la persona se calcula siempre a partir del detalle, nunca a mano
      const calculatedTotal = rules.calculateGymkanaParticipantTotal(posts);

      return {
        id: studentId || `${al}_gym_${idx + 1}`,
        studentId,
        name: studentName,
        posts,
        total: calculatedTotal
      };
    });

    normalizedDetail[al] = formattedList;
    const calc = rules.calculateGymkanaAlliancePoints(formattedList);
    averages[al] = calc.average;
    awarded[al] = calc.pointsAwarded;
  });

  const prevAwarded = act.pointsAwarded;
  act.participantsDetail = normalizedDetail;
  act.participantCards = {
    Terror: normalizedDetail.Terror.map(p => p.total),
    Shooter: normalizedDetail.Shooter.map(p => p.total),
    Action: normalizedDetail.Action.map(p => p.total)
  };
  act.averages = averages;
  act.pointsAwarded = awarded;
  act.status = 'Terminada';
  if (!act.horaTermino) act.horaTermino = new Date().toISOString();

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: 'Registro trazable de Gymkanas por puesto',
    user: getAuditAuthor(req, loggedBy),
    details: { 
      averages, 
      valorAnterior: prevAwarded, 
      valorNuevo: awarded,
      conteoParticipantes: {
        Terror: normalizedDetail.Terror.length,
        Shooter: normalizedDetail.Shooter.length,
        Action: normalizedDetail.Action.length
      }
    }
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
  if (status === 'Terminada' && !act.horaTermino) {
    act.horaTermino = new Date().toISOString();
  } else if (status === 'En curso' && !act.horaInicio) {
    act.horaInicio = new Date().toISOString();
  }
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
  const rubric = data.creativeChallenges?.rubrics?.[alliance];
  if (!rubric) return res.status(404).json({ error: 'Alianza no encontrada' });

  if (delivered !== undefined) {
    data.creativeChallenges.status[alliance].delivered = Boolean(delivered);
    if (delivered && !data.creativeChallenges.status[alliance].deliveryTime) {
      data.creativeChallenges.status[alliance].deliveryTime = new Date().toISOString();
    }
  }

  // Validar y calcular nota del docente según los 4 niveles estrictos de las Bases
  let totalScore = 0;
  try {
    totalScore = rules.calculateDocenteScore(rubric.criterios, scores || {});
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const prevNota = docenteNum === 1 ? rubric.docente1Nota : rubric.docente2Nota;

  if (docenteNum === 1) {
    rubric.docente1 = scores;
    rubric.docente1Nota = totalScore;
  } else if (docenteNum === 2) {
    rubric.docente2 = scores;
    rubric.docente2Nota = totalScore;
  }

  // Si ambos docentes evaluaron, calcular promedio y validar discrepancia (> 20)
  if (rubric.docente1Nota !== null && rubric.docente1Nota !== undefined &&
      rubric.docente2Nota !== null && rubric.docente2Nota !== undefined) {
    rubric.notaPromedio = (rubric.docente1Nota + rubric.docente2Nota) / 2;
    const diff = Math.abs(rubric.docente1Nota - rubric.docente2Nota);
    if (diff > 20) {
      rubric.discrepancyAlert = true;
      rubric.estado = 'revisión conjunta pendiente';
      rubric.notaDefinitiva = false;
      rubric.discrepancyResolved = false;
    } else {
      rubric.discrepancyAlert = false;
      rubric.estado = 'definitiva';
      rubric.notaDefinitiva = true;
      rubric.discrepancyResolved = true;
    }
    data.creativeChallenges.status[alliance].evaluated = true;
  }

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Evaluación docente ${docenteNum} para ${alliance}`,
    user: getAuditAuthor(req, loggedBy || `Docente ${docenteNum}`),
    details: { 
      docenteNum, 
      valorAnterior: prevNota, 
      valorNuevo: totalScore, 
      estado: rubric.estado, 
      discrepancyAlert: rubric.discrepancyAlert 
    }
  });

  saveData(data);
  res.json({ success: true, rubric, discrepancyAlert: rubric.discrepancyAlert, estado: rubric.estado });
});

// Registro de nota acordada tras revisión conjunta por discrepancia > 20 pts
app.post('/api/admin/docentes/acordar-nota', requireAdminOrCoordOrDocente, (req, res) => {
  const { alliance, notaAcordada, motivo, loggedBy } = req.body;
  const data = loadData();
  const rubric = data.creativeChallenges?.rubrics?.[alliance];
  if (!rubric) return res.status(404).json({ error: 'Alianza no encontrada' });

  const nota = Number(notaAcordada);
  if (isNaN(nota) || nota < 0 || nota > 100) {
    return res.status(400).json({ error: 'La nota acordada debe ser un número entre 0 y 100.' });
  }
  if (!motivo || !motivo.trim()) {
    return res.status(400).json({ error: 'Debe ingresar el motivo o acuerdo de la revisión conjunta.' });
  }

  const prevNota = rubric.notaPromedio;
  rubric.notaAcordada = nota;
  rubric.notaPromedio = nota;
  rubric.estado = 'definitiva';
  rubric.notaDefinitiva = true;
  rubric.discrepancyResolved = true;
  rubric.discrepancyAlert = false;
  rubric.acuerdoMotivo = motivo.trim();
  data.creativeChallenges.status[alliance].evaluated = true;

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Resolución de discrepancia docente para ${alliance}: nota acordada ${nota}`,
    user: getAuditAuthor(req, loggedBy),
    details: { valorAnterior: prevNota, valorNuevo: nota, motivo: motivo.trim() }
  });

  saveData(data);
  res.json({ success: true, rubric });
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

// 9. Sanciones (200 a 600 puntos según Sección 8 de las Bases)
app.post('/api/admin/sanciones', requireAdminOrCoord, (req, res) => {
  const { alliance, pointsDeducted, reason, authorizedBy } = req.body;
  const data = loadData();
  const pts = Number(pointsDeducted);
  if (isNaN(pts) || pts < rules.SANCTIONS.minPoints || pts > rules.SANCTIONS.maxPoints) {
    return res.status(400).json({ 
      error: `La sanción debe estar entre ${rules.SANCTIONS.minPoints} y ${rules.SANCTIONS.maxPoints} puntos según bases oficiales` 
    });
  }

  const newSanc = {
    id: Date.now(),
    alliance,
    pointsDeducted: pts,
    reason: reason || 'Sanción disciplinaria',
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

// 10. Reclamos con ventana estricta de 15 minutos (Sección 8 de las Bases)
app.post('/api/admin/reclamos', requireAdminOrCoordOrMesa, (req, res) => {
  const { alliance, activityId, detail, timestamp, motivoFueraDePlazo, loggedBy } = req.body;
  const data = loadData();
  const act = (data.activities || []).find(a => a.id === activityId);
  const now = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();

  // Evaluar ventana de 15 minutos desde la hora de término de la actividad
  const windowCheck = rules.evaluateClaimWindow(act?.horaTermino, now);

  const newReclamo = {
    id: Date.now(),
    alliance,
    activityId,
    activityName: act?.name || activityId,
    detail,
    timestamp: now,
    horaTerminoActividad: act?.horaTermino || null,
    fueraDePlazo: !windowCheck.isWithinWindow,
    plazo: windowCheck.status, // 'dentro de plazo' o 'fuera de plazo'
    motivoFueraDePlazo: !windowCheck.isWithinWindow ? (motivoFueraDePlazo || 'Ingresado por administración') : null,
    status: 'Pendiente', // Pendiente, En Revisión, Aceptado, Rechazado
    resolution: ''
  };

  data.reclamos.push(newReclamo);

  data.auditLogs.unshift({
    timestamp: now,
    action: `Ingreso de reclamo: Alianza ${alliance} (${windowCheck.status})`,
    user: getAuditAuthor(req, loggedBy),
    details: {
      reclamoId: newReclamo.id,
      activityId,
      fueraDePlazo: newReclamo.fueraDePlazo,
      plazo: newReclamo.plazo,
      motivoFueraDePlazo: newReclamo.motivoFueraDePlazo,
      detail
    }
  });

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

// Obtener participantes únicos con participación efectiva por alianza
function getUniqueParticipantsByAlliance(data, students) {
  const map = { Terror: new Map(), Shooter: new Map(), Action: new Map() };

  // 1. Actividades registradas en activityParticipants
  Object.entries(data.activityParticipants || {}).forEach(([actId, actObj]) => {
    ['Terror', 'Shooter', 'Action'].forEach(al => {
      (actObj.lists?.[al] || []).forEach(p => {
        const id = p.studentId || p.id;
        if (!id) return;
        if (!map[al].has(id)) {
          const s = (students || []).find(stu => stu.id === id);
          map[al].set(id, {
            id,
            name: p.name || s?.name || 'Estudiante',
            carrera: p.carrera || s?.carrera || 'No informada',
            alliance: al,
            activities: [actId]
          });
        } else {
          const entry = map[al].get(id);
          if (!entry.activities.includes(actId)) entry.activities.push(actId);
        }
      });
    });
  });

  // 2. Gymkanas
  const gym = (data.activities || []).find(a => a.id === 'gymkanas');
  if (gym?.participantsDetail) {
    ['Terror', 'Shooter', 'Action'].forEach(al => {
      (gym.participantsDetail[al] || []).forEach(p => {
        const id = p.studentId || p.id;
        if (!id) return;
        if (!map[al].has(id)) {
          const s = (students || []).find(stu => stu.id === id);
          map[al].set(id, {
            id,
            name: p.name || s?.name || 'Estudiante',
            carrera: s?.carrera || 'No informada',
            alliance: al,
            activities: ['gymkanas']
          });
        } else {
          const entry = map[al].get(id);
          if (!entry.activities.includes('gymkanas')) entry.activities.push('gymkanas');
        }
      });
    });
  }

  return {
    Terror: Array.from(map.Terror.values()),
    Shooter: Array.from(map.Shooter.values()),
    Action: Array.from(map.Action.values())
  };
}

// Cierre oficial de evento y asignación de premios de nota académica (1.ª: 1.0, 2.ª: 0.5, 3.ª: 0.3)
app.post('/api/admin/event/close', security.requireAuth, security.requireRole(['admin']), (req, res) => {
  const { ratifiedBy, notes } = req.body;
  const data = loadData();
  const students = loadStudents();

  const { totals, ranks, sorted } = recalculateGlobalPoints(data);
  const participantsByAlliance = getUniqueParticipantsByAlliance(data, students);
  const gradePrizes = rules.calculateGradePrizes(ranks, participantsByAlliance);

  data.eventClosed = true;
  data.eventClosedAt = new Date().toISOString();
  data.eventClosedBy = ratifiedBy || 'Administrador / Jefatura';
  data.eventNotes = notes || 'Cierre oficial y ratificación de premios de nota académica';
  data.finalGradePrizes = gradePrizes;
  data.finalRanks = ranks;
  data.finalTotals = totals;

  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Cierre Oficial del Evento y Ratificación de Notas Académicas`,
    user: getAuditAuthor(req, ratifiedBy),
    details: {
      ratifiedBy,
      podio: sorted,
      premios: {
        Terror: { rank: ranks.Terror, bono: gradePrizes.Terror.gradeBonus, beneficiarios: gradePrizes.Terror.beneficiariesCount },
        Shooter: { rank: ranks.Shooter, bono: gradePrizes.Shooter.gradeBonus, beneficiarios: gradePrizes.Shooter.beneficiariesCount },
        Action: { rank: ranks.Action, bono: gradePrizes.Action.gradeBonus, beneficiarios: gradePrizes.Action.beneficiariesCount }
      }
    }
  });

  saveData(data);
  res.json({ success: true, eventClosed: true, gradePrizes, finalRanks: ranks });
});

// Reabrir evento oficial
app.post('/api/admin/event/reopen', security.requireAuth, security.requireRole(['admin']), (req, res) => {
  const { reason, loggedBy } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Se requiere un motivo justificado para reabrir el evento.' });
  }

  const data = loadData();
  data.eventClosed = false;
  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: `Reapertura de Evento Oficial`,
    user: getAuditAuthor(req, loggedBy),
    details: { motivo: reason.trim() }
  });

  saveData(data);
  res.json({ success: true, eventClosed: false });
});

// Consulta de premios de nota académica
app.get('/api/admin/event/grade-prizes', (req, res) => {
  const data = loadData();
  const students = loadStudents();
  const { ranks } = recalculateGlobalPoints(data);
  const participantsByAlliance = getUniqueParticipantsByAlliance(data, students);
  const gradePrizes = rules.calculateGradePrizes(ranks, participantsByAlliance);

  res.json({
    eventClosed: Boolean(data.eventClosed),
    eventClosedAt: data.eventClosedAt || null,
    eventClosedBy: data.eventClosedBy || null,
    gradePrizes
  });
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
  const { totals, ranks, sorted, tieBreaks, tieBreakDecisions } = recalculateGlobalPoints(data);

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
  const sortedAlliances = sorted;
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

// =========================================================================
// MÓDULO PÚBLICO "MI ALIANZA" & SISTEMA DE SOLICITUDES DE CAMBIO CON APROBACIÓN
// =========================================================================

// Helpers de validación de RUT
function cleanRut(rut) {
  return (rut || '').toString().toUpperCase().replace(/[^0-9K]/g, '');
}

function validateRut(rawRut) {
  const rut = cleanRut(rawRut);
  if (rut.length < 2) return false;
  const body = rut.slice(0, -1);
  const dv = rut.slice(-1);
  if (!/^\d+$/.test(body)) return false;

  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const mod11 = 11 - (sum % 11);
  const expectedDv = mod11 === 11 ? '0' : mod11 === 10 ? 'K' : mod11.toString();
  return dv === expectedDv;
}

// Rate Limiter en Memoria para consultas públicas
const publicRateLimitMap = new Map();

function checkPublicRateLimit(ip) {
  const now = Date.now();
  let record = publicRateLimitMap.get(ip);
  if (!record) {
    record = { attempts: 0, firstAttemptAt: now, failedRuts: new Set(), blockedUntil: 0 };
    publicRateLimitMap.set(ip, record);
  }

  if (record.blockedUntil > now) {
    const minsLeft = Math.ceil((record.blockedUntil - now) / 60000);
    return { blocked: true, message: `Dispositivo bloqueado temporalmente por exceso de intentos. Espere ${minsLeft} minuto(s).` };
  }

  // Ventana de 1 hora
  if (now - record.firstAttemptAt > 3600000) {
    record.attempts = 0;
    record.firstAttemptAt = now;
    record.failedRuts.clear();
    record.blockedUntil = 0;
  }

  if (record.attempts >= 10) {
    record.blockedUntil = now + 900000; // 15 minutos
    return { blocked: true, message: 'Límite de 10 consultas por hora alcanzado. Bloqueado temporalmente por 15 minutos.' };
  }

  record.attempts++;
  return { blocked: false, attempts: record.attempts };
}

function recordFailedRutAttempt(ip, rut) {
  const record = publicRateLimitMap.get(ip);
  if (record) {
    record.failedRuts.add(rut);
    if (record.failedRuts.size >= 5) {
      record.blockedUntil = Date.now() + 900000; // 15 minutos de bloqueo por fuerza bruta
    }
  }
}

// Sesiones públicas temporales (15 minutos)
const publicSessions = new Map();

function createPublicSession(student, req) {
  const token = 'pub_' + crypto.randomBytes(24).toString('hex');
  const ip = security.getClientIp(req);
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const expiresAt = Date.now() + 15 * 60 * 1000;

  publicSessions.set(token, {
    studentId: student.id,
    rut: cleanRut(student.rut),
    name: student.name,
    carrera: student.carrera,
    alliance: student.alliance,
    expiresAt,
    ip,
    userAgent
  });

  return token;
}

function getPublicSession(req) {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-public-token']) {
    token = req.headers['x-public-token'];
  }
  if (!token) return null;

  const sess = publicSessions.get(token);
  if (!sess) return null;
  if (Date.now() > sess.expiresAt) {
    publicSessions.delete(token);
    return null;
  }
  return sess;
}

// 1. Estadísticas públicas de cupos y alianzas
app.get('/api/public/alliance/stats', (req, res) => {
  const data = loadData();
  const students = loadStudents();

  const counts = { Terror: 0, Shooter: 0, Action: 0 };
  (students || []).forEach(s => {
    if (counts[s.alliance] !== undefined) counts[s.alliance]++;
  });

  const cfg = data.allianceChangeConfig || { open: true, deadline: '2026-11-16T23:59:59-03:00', maxDiff: 4 };
  const maxDiff = cfg.maxDiff || 4;
  const isPastDeadline = cfg.deadline ? (new Date() > new Date(cfg.deadline)) : false;
  const isOpen = cfg.open && !isPastDeadline;

  // Cálculo de cupos disponibles para Terror y Shooter
  const diff = counts.Terror - counts.Shooter;
  const terrorCanGrow = (diff + 2) <= maxDiff;
  const shooterCanGrow = (-diff + 2) <= maxDiff;

  res.json({
    counts,
    config: {
      open: isOpen,
      rawOpen: cfg.open,
      deadline: cfg.deadline,
      maxDiff
    },
    slots: {
      terrorCurrent: counts.Terror,
      shooterCurrent: counts.Shooter,
      actionCurrent: counts.Action,
      diff: Math.abs(diff),
      terrorCanAccept: terrorCanGrow,
      shooterCanAccept: shooterCanGrow
    }
  });
});

// 2. Autenticación pública de estudiante con RUT (NO DEVUELVE NINGÚN RUT)
app.post('/api/public/alliance/auth', (req, res) => {
  const { rut } = req.body;
  const ip = security.getClientIp(req);

  const rateCheck = checkPublicRateLimit(ip);
  if (rateCheck.blocked) {
    return res.status(429).json({ error: rateCheck.message });
  }

  if (!rut || !validateRut(rut)) {
    recordFailedRutAttempt(ip, cleanRut(rut));
    return res.status(400).json({ error: 'RUT no registrado en el padrón oficial o datos incorrectos.' });
  }

  const targetRut = cleanRut(rut);
  const students = loadStudents();
  const student = students.find(s => cleanRut(s.rut) === targetRut);

  if (!student) {
    recordFailedRutAttempt(ip, targetRut);
    return res.status(404).json({ error: 'RUT no registrado en el padrón oficial o datos incorrectos.' });
  }

  // Crear sesión pública (15 min)
  const token = createPublicSession(student, req);
  const data = loadData();
  const myRequest = (data.allianceRequests || []).find(r => r.studentId === student.id && r.status !== 'reverted');

  // NINGÚN RUT SALE EN LA RESPUESTA
  res.json({
    success: true,
    token,
    student: {
      id: student.id,
      name: student.name,
      carrera: student.carrera,
      alliance: student.alliance
    },
    hasRequestedChange: !!myRequest,
    request: myRequest || null
  });
});

// 3. Solicitar cambio de alianza
app.post('/api/public/alliance/request', (req, res) => {
  const sess = getPublicSession(req);
  if (!sess) {
    return res.status(401).json({ error: 'Sesión expirada o no válida. Por favor ingrese su RUT nuevamente.' });
  }

  const data = loadData();
  const cfg = data.allianceChangeConfig || { open: true, deadline: '2026-11-16T23:59:59-03:00', maxDiff: 4 };
  const isPastDeadline = cfg.deadline ? (new Date() > new Date(cfg.deadline)) : false;
  if (!cfg.open || isPastDeadline) {
    return res.status(403).json({ error: 'El periodo oficial de recepción de solicitudes de cambio se encuentra cerrado.' });
  }

  // Alianza Action (Diseño) está CERRADA
  if (sess.alliance === 'Action' || (sess.carrera && sess.carrera.toLowerCase().includes('diseño'))) {
    return res.status(403).json({ error: 'La Alianza Action (Diseño e Industria Digital) es exclusiva y no admite cambios.' });
  }

  const { targetAlliance, reason, termsAccepted } = req.body;
  if (!termsAccepted) {
    return res.status(400).json({ error: 'Debes leer y aceptar el reglamento y condiciones de traslado antes de formalizar la solicitud.' });
  }
  if (!targetAlliance || (targetAlliance !== 'Terror' && targetAlliance !== 'Shooter')) {
    return res.status(400).json({ error: 'El cambio solo está permitido entre Alianza Terror y Alianza Shooter.' });
  }

  if (targetAlliance === sess.alliance) {
    return res.status(400).json({ error: `Ya perteneces a la Alianza ${sess.alliance}.` });
  }

  // Comprobar si ya tiene una solicitud registrada
  data.allianceRequests = data.allianceRequests || [];
  const existing = data.allianceRequests.find(r => r.studentId === sess.studentId && r.status !== 'rejected' && r.status !== 'reverted');
  if (existing) {
    return res.status(400).json({ error: 'Ya tienes una solicitud de cambio registrada. Solo se permite una por estudiante.' });
  }

  const students = loadStudents();
  const counts = { Terror: 0, Shooter: 0, Action: 0 };
  students.forEach(s => {
    if (counts[s.alliance] !== undefined) counts[s.alliance]++;
  });

  // Verificar si existe una solicitud opuesta que pueda emparejarse como Swap
  const swapCandidate = data.allianceRequests.find(r => 
    (r.status === 'pending' || r.status === 'waiting_list') &&
    r.currentAlliance === targetAlliance &&
    r.targetAlliance === sess.alliance &&
    !r.swapPartnerId
  );

  let initialStatus = 'pending';
  let isSwap = false;
  let swapPartnerId = null;

  if (swapCandidate) {
    // Emparejado como permuta: no consume cupos netos
    isSwap = true;
    swapPartnerId = swapCandidate.id;
    initialStatus = 'pending';
  } else {
    // Evaluar cupo con maxDiff
    const maxDiff = cfg.maxDiff || 4;
    const newTargetCount = counts[targetAlliance] + 1;
    const newSourceCount = counts[sess.alliance] - 1;
    const diffAfter = Math.abs(newTargetCount - newSourceCount);

    if (diffAfter > maxDiff) {
      initialStatus = 'waiting_list'; // Sin cupo inmediato
    } else {
      initialStatus = 'pending';
    }
  }

  const newRequest = {
    id: 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    studentId: sess.studentId,
    studentName: sess.name,
    carrera: sess.carrera,
    currentAlliance: sess.alliance,
    targetAlliance,
    reason: (reason || '').trim(),
    status: initialStatus, // 'pending' | 'waiting_list'
    createdAt: new Date().toISOString(),
    termsAccepted: true,
    termsAcceptedAt: new Date().toISOString(),
    ip: sess.ip,
    userAgent: sess.userAgent,
    isSwap,
    swapPartnerId
  };

  data.allianceRequests.unshift(newRequest);

  // Si se emparejó con swapCandidate, actualizar swapCandidate
  if (swapCandidate) {
    swapCandidate.isSwap = true;
    swapCandidate.swapPartnerId = newRequest.id;
    if (swapCandidate.status === 'waiting_list') {
      swapCandidate.status = 'pending'; // Promover ya que ahora está emparejada
    }
  }

  saveData(data);

  res.json({
    success: true,
    request: newRequest,
    message: initialStatus === 'pending' 
      ? 'Solicitud recibida correctamente. Queda en estado Pendiente de Revisión por el administrador.' 
      : 'No hay cupos disponibles de inmediato. Tu solicitud ha quedado registrada en Lista de Espera por orden de llegada.'
  });
});

// 4. Consultar estado propio
app.get('/api/public/alliance/my-request', (req, res) => {
  const sess = getPublicSession(req);
  if (!sess) {
    return res.status(401).json({ error: 'Sesión no válida o expirada.' });
  }

  const data = loadData();
  const request = (data.allianceRequests || []).find(r => r.studentId === sess.studentId && r.status !== 'reverted') || null;

  res.json({
    success: true,
    student: {
      id: sess.studentId,
      name: sess.name,
      carrera: sess.carrera,
      alliance: sess.alliance
    },
    request
  });
});

// ----------------- RUTAS ADMIN DE GESTIÓN DE SOLICITUDES -----------------

// Listar solicitudes
app.get('/api/admin/alliance-requests', security.requireAuth, security.requireRole(['admin', 'coordinacion']), (req, res) => {
  const data = loadData();
  const students = loadStudents();

  const counts = { Terror: 0, Shooter: 0, Action: 0 };
  students.forEach(s => {
    if (counts[s.alliance] !== undefined) counts[s.alliance]++;
  });

  const requests = data.allianceRequests || [];

  // Detección de dispositivos sospechosos: contar solicitudes por IP
  const ipCounts = {};
  requests.forEach(r => {
    if (r.ip) ipCounts[r.ip] = (ipCounts[r.ip] || 0) + 1;
  });

  const enriched = requests.map(r => ({
    ...r,
    multiRutDeviceAlert: (ipCounts[r.ip] || 0) > 1
  }));

  res.json({
    requests: enriched,
    counts,
    config: data.allianceChangeConfig || { open: true, deadline: '2026-11-16T23:59:59-03:00', maxDiff: 4 },
    auditLog: data.allianceAuditLog || []
  });
});

// Aprobar solicitud
app.post('/api/admin/alliance-requests/:id/approve', security.requireAuth, security.requireRole(['admin', 'coordinacion']), (req, res) => {
  const reqId = req.params.id;
  const data = loadData();
  const requests = data.allianceRequests || [];
  const reqItem = requests.find(r => r.id === reqId);

  if (!reqItem) return res.status(404).json({ error: 'Solicitud no encontrada.' });
  if (reqItem.status === 'approved') return res.status(400).json({ error: 'Esta solicitud ya fue aprobada.' });

  const students = loadStudents();
  const student = students.find(s => s.id === reqItem.studentId);
  if (!student) return res.status(404).json({ error: 'Estudiante no encontrado en el padrón.' });

  const oldAlliance = student.alliance;
  student.alliance = reqItem.targetAlliance;
  saveStudents(students);

  // Marcar como aprobada
  reqItem.status = 'approved';
  reqItem.approvedAt = new Date().toISOString();
  reqItem.approvedBy = getAuditAuthor(req, 'Admin');

  // Registrar auditoría
  data.allianceAuditLog = data.allianceAuditLog || [];
  data.allianceAuditLog.unshift({
    timestamp: new Date().toISOString(),
    action: 'APROBAR_CAMBIO_ALIANZA',
    author: getAuditAuthor(req, 'Admin'),
    details: {
      requestId: reqItem.id,
      studentName: student.name,
      oldAlliance,
      newAlliance: reqItem.targetAlliance,
      isSwap: !!reqItem.isSwap
    }
  });

  // Si era un swap, buscar partner y aprobarlo también
  if (reqItem.isSwap && reqItem.swapPartnerId) {
    const partnerReq = requests.find(r => r.id === reqItem.swapPartnerId && r.status !== 'approved');
    if (partnerReq) {
      const partnerStudent = students.find(s => s.id === partnerReq.studentId);
      if (partnerStudent) {
        const partnerOld = partnerStudent.alliance;
        partnerStudent.alliance = partnerReq.targetAlliance;
        saveStudents(students);

        partnerReq.status = 'approved';
        partnerReq.approvedAt = new Date().toISOString();
        partnerReq.approvedBy = getAuditAuthor(req, 'Admin (Permuta Automática)');

        data.allianceAuditLog.unshift({
          timestamp: new Date().toISOString(),
          action: 'APROBAR_PERMUTA_AUTOMATICA',
          author: getAuditAuthor(req, 'Admin'),
          details: {
            requestId: partnerReq.id,
            studentName: partnerStudent.name,
            oldAlliance: partnerOld,
            newAlliance: partnerReq.targetAlliance
          }
        });
      }
    }
  }

  // Reevaluar lista de espera
  reevaluateWaitingList(data, students);

  saveData(data);

  res.json({ success: true, request: reqItem, message: `Cambio de ${student.name} aprobado exitosamente a ${reqItem.targetAlliance}.` });
});

// Rechazar solicitud
app.post('/api/admin/alliance-requests/:id/reject', security.requireAuth, security.requireRole(['admin', 'coordinacion']), (req, res) => {
  const reqId = req.params.id;
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'El motivo de rechazo es obligatorio para fines de auditoría.' });
  }

  const data = loadData();
  const requests = data.allianceRequests || [];
  const reqItem = requests.find(r => r.id === reqId);

  if (!reqItem) return res.status(404).json({ error: 'Solicitud no encontrada.' });
  if (reqItem.status === 'rejected') return res.status(400).json({ error: 'Esta solicitud ya está rechazada.' });

  reqItem.status = 'rejected';
  reqItem.rejectedAt = new Date().toISOString();
  reqItem.rejectedBy = getAuditAuthor(req, 'Admin');
  reqItem.rejectReason = reason.trim();

  // Si era parte de un swap, desvincular al compañero
  if (reqItem.isSwap && reqItem.swapPartnerId) {
    const partnerReq = requests.find(r => r.id === reqItem.swapPartnerId);
    if (partnerReq) {
      partnerReq.isSwap = false;
      partnerReq.swapPartnerId = null;
    }
  }

  data.allianceAuditLog = data.allianceAuditLog || [];
  data.allianceAuditLog.unshift({
    timestamp: new Date().toISOString(),
    action: 'RECHAZAR_CAMBIO_ALIANZA',
    author: getAuditAuthor(req, 'Admin'),
    details: {
      requestId: reqItem.id,
      studentName: reqItem.studentName,
      reason: reqItem.rejectReason
    }
  });

  saveData(data);

  res.json({ success: true, request: reqItem, message: 'Solicitud rechazada correctamente.' });
});

// Aprobación Excepcional (Bypass de cupos)
app.post('/api/admin/alliance-requests/:id/force-approve', security.requireAuth, security.requireRole(['admin', 'coordinacion']), (req, res) => {
  const reqId = req.params.id;
  const data = loadData();
  const requests = data.allianceRequests || [];
  const reqItem = requests.find(r => r.id === reqId);

  if (!reqItem) return res.status(404).json({ error: 'Solicitud no encontrada.' });

  const students = loadStudents();
  const student = students.find(s => s.id === reqItem.studentId);
  if (!student) return res.status(404).json({ error: 'Estudiante no encontrado en el padrón.' });

  const oldAlliance = student.alliance;
  student.alliance = reqItem.targetAlliance;
  saveStudents(students);

  reqItem.status = 'approved';
  reqItem.approvedAt = new Date().toISOString();
  reqItem.approvedBy = getAuditAuthor(req, 'Admin [Excepción Directiva]');
  reqItem.isForced = true;

  data.allianceAuditLog = data.allianceAuditLog || [];
  data.allianceAuditLog.unshift({
    timestamp: new Date().toISOString(),
    action: 'APROBACION_EXCEPCIONAL_DIRECTIVA',
    author: getAuditAuthor(req, 'Admin'),
    details: {
      requestId: reqItem.id,
      studentName: student.name,
      oldAlliance,
      newAlliance: reqItem.targetAlliance,
      reason: 'Bypass de cupos aprobado manualmente por la coordinación/admin'
    }
  });

  saveData(data);

  res.json({ success: true, request: reqItem, message: `Aprobación excepcional aplicada para ${student.name}.` });
});

// Revertir cambio
app.post('/api/admin/alliance-requests/:id/revert', security.requireAuth, security.requireRole(['admin', 'coordinacion']), (req, res) => {
  const reqId = req.params.id;
  const data = loadData();
  const requests = data.allianceRequests || [];
  const reqItem = requests.find(r => r.id === reqId);

  if (!reqItem) return res.status(404).json({ error: 'Solicitud no encontrada.' });
  if (reqItem.status !== 'approved') return res.status(400).json({ error: 'Solo se pueden revertir solicitudes aprobadas.' });

  const students = loadStudents();
  const student = students.find(s => s.id === reqItem.studentId);
  if (!student) return res.status(404).json({ error: 'Estudiante no encontrado en el padrón.' });

  // Restaurar alianza original
  student.alliance = reqItem.currentAlliance;
  saveStudents(students);

  reqItem.status = 'reverted';
  reqItem.revertedAt = new Date().toISOString();
  reqItem.revertedBy = getAuditAuthor(req, 'Admin');

  data.allianceAuditLog = data.allianceAuditLog || [];
  data.allianceAuditLog.unshift({
    timestamp: new Date().toISOString(),
    action: 'REVERTIR_CAMBIO_ALIANZA',
    author: getAuditAuthor(req, 'Admin'),
    details: {
      requestId: reqItem.id,
      studentName: student.name,
      restoredAlliance: reqItem.currentAlliance
    }
  });

  reevaluateWaitingList(data, students);

  saveData(data);

  res.json({ success: true, message: `Cambio revertido. ${student.name} ha sido devuelto a su alianza oficial ${reqItem.currentAlliance}.` });
});

// Configurar parámetros de recepción
app.put('/api/admin/alliance-requests/settings', security.requireAuth, security.requireRole(['admin', 'coordinacion']), (req, res) => {
  const { open, deadline, maxDiff } = req.body;
  const data = loadData();
  data.allianceChangeConfig = data.allianceChangeConfig || {};

  if (open !== undefined) data.allianceChangeConfig.open = Boolean(open);
  if (deadline !== undefined) data.allianceChangeConfig.deadline = deadline;
  if (maxDiff !== undefined) data.allianceChangeConfig.maxDiff = parseInt(maxDiff, 10) || 4;

  data.allianceAuditLog = data.allianceAuditLog || [];
  data.allianceAuditLog.unshift({
    timestamp: new Date().toISOString(),
    action: 'ACTUALIZAR_CONFIG_SOLICITUDES',
    author: getAuditAuthor(req, 'Admin'),
    details: data.allianceChangeConfig
  });

  saveData(data);

  res.json({ success: true, config: data.allianceChangeConfig });
});

// Función auxiliar para reevaluar lista de espera y promover el primero si hay cupo
function reevaluateWaitingList(data, students) {
  const requests = data.allianceRequests || [];
  const waiting = requests.filter(r => r.status === 'waiting_list').sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (waiting.length === 0) return;

  const counts = { Terror: 0, Shooter: 0, Action: 0 };
  students.forEach(s => {
    if (counts[s.alliance] !== undefined) counts[s.alliance]++;
  });

  const maxDiff = data.allianceChangeConfig?.maxDiff || 4;

  for (const candidate of waiting) {
    const newTarget = counts[candidate.targetAlliance] + 1;
    const newSource = counts[candidate.currentAlliance] - 1;
    if (Math.abs(newTarget - newSource) <= maxDiff) {
      candidate.status = 'pending';
      data.allianceAuditLog.unshift({
        timestamp: new Date().toISOString(),
        action: 'PROMOVER_LISTA_ESPERA',
        author: 'Sistema Automático',
        details: {
          requestId: candidate.id,
          studentName: candidate.studentName,
          targetAlliance: candidate.targetAlliance
        }
      });
      break; // Promover 1 por cada cupo liberado
    }
  }
}

// SPA Fallback for Admin Portal
app.get(/^\/admin(\/.+)?$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// SPA Fallback for Alianzas Portal
app.get(/^\/alianzas(\/.+)?$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'alianzas', 'index.html'));
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
