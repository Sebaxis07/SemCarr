// -*- coding: utf-8 -*-
/**
 * Módulo de Seguridad y Autenticación Criptográfica OWASP
 * Semana de la Carrera 2026 - INACAP Sede Antofagasta
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CREDENTIALS_FILE = path.join(__dirname, 'credentials.json');
const SESSIONS_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas
const LOCKOUT_THRESHOLD = 5; // 5 intentos fallidos
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos

// Almacén en memoria de sesiones activas: token -> sessionData
const activeSessions = new Map();

// Almacén en memoria de intentos de fuerza bruta: ip -> { failedAttempts, lockUntil, lastAttempt }
const bruteForceTracker = new Map();

// Helper: Hashing seguro con scrypt (nativo de Node.js, resistente a ataques GPU/ASIC)
function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

let defaultCredentials = null;
try {
  defaultCredentials = require('./credentials.json');
} catch (e) {
  try { defaultCredentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json'), 'utf8')); } catch (_) {}
}

function getCredentialsPath() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpPath = path.join(os.tmpdir(), 'credentials.json');
    if (!fs.existsSync(tmpPath)) {
      const candidates = [
        path.join(process.cwd(), 'credentials.json'),
        path.join(__dirname, 'credentials.json'),
        path.join(__dirname, '..', 'credentials.json')
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
      if (!copied && defaultCredentials) {
        try {
          fs.writeFileSync(tmpPath, JSON.stringify(defaultCredentials, null, 2), 'utf-8');
        } catch (e) {
          console.error('Error seeding credentials.json in tmpdir:', e);
        }
      }
    }
    return tmpPath;
  }
  return path.join(__dirname, 'credentials.json');
}

// Cargar o inicializar credenciales
function loadCredentials() {
  try {
    const credsFile = getCredentialsPath();
    if (!fs.existsSync(credsFile)) {
      initializeDefaultCredentials();
    }
    if (fs.existsSync(credsFile)) {
      return JSON.parse(fs.readFileSync(credsFile, 'utf-8'));
    }
  } catch (e) {
    console.error('Error al leer credentials.json:', e);
  }
  return defaultCredentials ? JSON.parse(JSON.stringify(defaultCredentials)) : {};
}

function saveCredentials(creds) {
  const credsFile = getCredentialsPath();
  try {
    fs.writeFileSync(credsFile, JSON.stringify(creds, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error al guardar credentials.json:', e);
  }
}

// Generar credenciales por defecto seguras si no existen
function initializeDefaultCredentials() {
  const defaultUsers = {
    admin: {
      username: 'admin',
      name: 'Superadministrador (Jefatura / Soporte)',
      role: 'admin',
      passwordHash: hashPassword('InacapAdmin2026!'),
      createdAt: new Date().toISOString()
    },
    coordinacion: {
      username: 'coordinacion',
      name: 'Coordinadora General de Carrera',
      role: 'coordinacion',
      passwordHash: hashPassword('CoordSemana2026#'),
      createdAt: new Date().toISOString()
    },
    mesa: {
      username: 'mesa',
      name: 'Mesa de Control y Jueces de Cancha',
      role: 'mesa',
      passwordHash: hashPassword('MesaCancha2026*'),
      createdAt: new Date().toISOString()
    },
    docente1: {
      username: 'docente1',
      name: 'Docente Evaluador 1',
      role: 'docente',
      passwordHash: hashPassword('DocenteJuez1_2026'),
      createdAt: new Date().toISOString()
    },
    docente2: {
      username: 'docente2',
      name: 'Docente Evaluador 2',
      role: 'docente',
      passwordHash: hashPassword('DocenteJuez2_2026'),
      createdAt: new Date().toISOString()
    },
    staff: {
      username: 'staff',
      name: 'Staff de Cancha y Puntos',
      role: 'staff',
      passwordHash: hashPassword('StaffPuntos2026!'),
      createdAt: new Date().toISOString()
    }
  };
  saveCredentials(defaultUsers);
}

// Obtener IP del cliente (considerando proxies y localhost)
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  ).split(',')[0].trim();
}

// ----------------- DEFENSAS CONTRA FUERZA BRUTA -----------------
function checkRateLimit(req, res, next) {
  const ip = getClientIp(req);
  const record = bruteForceTracker.get(ip);

  if (record && record.lockUntil && Date.now() < record.lockUntil) {
    const remainingSec = Math.ceil((record.lockUntil - Date.now()) / 1000);
    res.setHeader('Retry-After', remainingSec);
    return res.status(429).json({
      error: `Acceso temporalmente bloqueado por exceso de intentos fallidos. Por seguridad, intente de nuevo en ${Math.ceil(remainingSec / 60)} minuto(s).`,
      retryAfterSeconds: remainingSec
    });
  }

  // Tarpitting progresivo: si lleva 3 o más fallos, demoramos intencionalmente la respuesta
  if (record && record.failedAttempts >= 3 && (!record.lockUntil || Date.now() >= record.lockUntil)) {
    const delayMs = Math.min(2500, (record.failedAttempts - 2) * 1000);
    setTimeout(next, delayMs);
  } else {
    next();
  }
}

function recordFailedLogin(ip, username, auditLogCallback) {
  let record = bruteForceTracker.get(ip);
  if (!record) {
    record = { failedAttempts: 0, lockUntil: null, lastAttempt: Date.now() };
    bruteForceTracker.set(ip, record);
  }

  record.failedAttempts += 1;
  record.lastAttempt = Date.now();

  const attemptsLeft = Math.max(0, LOCKOUT_THRESHOLD - record.failedAttempts);

  if (record.failedAttempts >= LOCKOUT_THRESHOLD) {
    record.lockUntil = Date.now() + LOCKOUT_DURATION_MS;
    if (auditLogCallback) {
      auditLogCallback({
        type: 'SECURITY_ACCOUNT_LOCKED',
        action: `Bloqueo de seguridad activado por 15 min para IP ${ip}`,
        user: username || 'Desconocido',
        details: { ip, reason: 'Exceso de 5 intentos fallidos consecutivos' }
      });
    }
  } else if (auditLogCallback) {
    auditLogCallback({
      type: 'SECURITY_LOGIN_FAILED',
      action: `Intento de acceso fallido para usuario: "${username}"`,
      user: username || 'Desconocido',
      details: { ip, attemptsLeft }
    });
  }

  return { attemptsLeft, isLocked: Boolean(record.lockUntil && Date.now() < record.lockUntil) };
}

function recordSuccessfulLogin(ip, username, auditLogCallback) {
  // Limpiar intentos fallidos para la IP
  bruteForceTracker.delete(ip);

  if (auditLogCallback) {
    auditLogCallback({
      type: 'SECURITY_LOGIN_SUCCESS',
      action: `Inicio de sesión exitoso: "${username}"`,
      user: username,
      details: { ip }
    });
  }
}

// ----------------- GESTIÓN DE SESIONES -----------------
function createSession(user, ip) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const session = {
    token,
    username: user.username,
    name: user.name,
    role: user.role,
    ip,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSIONS_TTL_MS).toISOString(),
    expiresAtMs: now + SESSIONS_TTL_MS
  };

  activeSessions.set(token, session);
  return session;
}

function getSession(token) {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;

  // Verificar expiración
  if (Date.now() > session.expiresAtMs) {
    activeSessions.delete(token);
    return null;
  }

  return session;
}

function destroySession(token) {
  if (token) {
    activeSessions.delete(token);
  }
}

// Limpiador periódico de sesiones expiradas (cada 10 min)
const sessionCleaner = setInterval(() => {
  const now = Date.now();
  for (const [token, s] of activeSessions.entries()) {
    if (now > s.expiresAtMs) {
      activeSessions.delete(token);
    }
  }
}, 10 * 60 * 1000);
if (sessionCleaner && sessionCleaner.unref) {
  sessionCleaner.unref();
}

// ----------------- MIDDLEWARES DE AUTORIZACIÓN (RBAC) -----------------
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-session-token']) {
    token = req.headers['x-session-token'];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  const session = getSession(token);
  if (!session) {
    return res.status(401).json({
      error: 'Sesión no válida o expirada. Por favor inicie sesión nuevamente en la consola administrativa.'
    });
  }

  req.user = session;
  next();
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    const userRole = req.user.role;
    // El rol 'admin' siempre tiene acceso a todo
    if (userRole === 'admin' || allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      error: `Acceso denegado: Tu rol actual (${userRole}) no tiene permisos para realizar esta acción. Roles autorizados: ${allowedRoles.join(', ')}.`
    });
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  loadCredentials,
  saveCredentials,
  checkRateLimit,
  recordFailedLogin,
  recordSuccessfulLogin,
  createSession,
  getSession,
  destroySession,
  requireAuth,
  requireRole,
  getClientIp
};
