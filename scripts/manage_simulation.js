const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data.json');
const STUDENTS_PATH = path.join(__dirname, '..', 'students.json');

function loadData() {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function saveData(d) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(d, null, 2), 'utf8');
}

function loadStudents() {
  return JSON.parse(fs.readFileSync(STUDENTS_PATH, 'utf8'));
}

function cleanAllData() {
  const data = loadData();

  // 1. Limpiar actividades del 19
  data.activities.forEach(act => {
    act.status = 'Pendiente';
    act.pointsAwarded = { Terror: 0, Shooter: 0, Action: 0 };
    if (act.averages) act.averages = { Terror: 0, Shooter: 0, Action: 0 };
  });

  // 2. Limpiar Desafíos Creativos
  data.creativeChallenges = {
    status: { Terror: 'Pendiente', Shooter: 'Pendiente', Action: 'Pendiente' },
    rubrics: { Terror: {}, Shooter: {}, Action: {} },
    favoriteAlliance: null,
    pointsAwarded: { Terror: 0, Shooter: 0, Action: 0 }
  };

  // 3. Limpiar Copa Tarreo
  ['cazatesoros', 'justdance', 'mimica'].forEach(k => {
    if (data.tarreoCopa && data.tarreoCopa[k]) {
      data.tarreoCopa[k].pointsAwarded = { Terror: 0, Shooter: 0, Action: 0 };
    }
  });

  // 4. Limpiar Sorpresas, Sanciones, Reclamos
  data.sorpresas = [];
  data.activeSorpresa = null;
  data.sanciones = [];
  data.reclamos = [];

  // 5. Limpiar Participantes por Actividad
  if (!data.activityParticipants) data.activityParticipants = {};
  data.activities.forEach(act => {
    data.activityParticipants[act.id] = {
      activityId: act.id,
      name: act.name,
      quotaPerAlliance: act.quotaPerAlliance || null,
      isClosed: false,
      closedAt: null,
      closedBy: null,
      lists: {
        Terror: [],
        Shooter: [],
        Action: []
      },
      audit: []
    };
  });

  // 6. Avisos y Logs
  data.announcements = [
    {
      id: 1,
      text: "Semana de la Carrera 2026 • INACAP Sede Antofagasta • Inicio oficial 19 de Noviembre",
      timestamp: new Date().toISOString()
    }
  ];
  data.auditLogs = [];

  saveData(data);
  console.log("==================================================");
  console.log("✔ DATOS LIMPIADOS CON ÉXITO.");
  console.log("✔ Todas las actividades quedaron en 'Pendiente' con 0 pts.");
  console.log("✔ Nóminas de participantes vaciadas.");
  console.log("✔ Sanciones, reclamos y desafíos reseteados a cero.");
  console.log("==================================================");
}

function simulateData() {
  const data = loadData();
  const students = loadStudents();

  const terrorStudents = students.filter(s => s.alliance === 'Terror');
  const shooterStudents = students.filter(s => s.alliance === 'Shooter');
  const actionStudents = students.filter(s => s.alliance === 'Action');

  console.log("Iniciando inyección de datos simulados realistas...");

  // 1. Participantes por Actividad
  if (!data.activityParticipants) data.activityParticipants = {};

  data.activities.forEach(act => {
    const quota = act.quotaPerAlliance || 5;
    const count = Math.min(quota, 8);

    data.activityParticipants[act.id] = {
      activityId: act.id,
      name: act.name,
      quotaPerAlliance: act.quotaPerAlliance || null,
      isClosed: act.id !== 'retro', // retro en curso
      closedAt: act.id !== 'retro' ? new Date().toISOString() : null,
      closedBy: 'Coordinación DAE',
      lists: {
        Terror: terrorStudents.slice(0, count).map((s, idx) => ({
          studentId: s.id,
          name: s.name,
          carrera: s.carrera,
          addedAt: new Date(Date.now() - 3600000 + idx * 60000).toISOString(),
          addedBy: 'Mesa Cancha',
          score: act.id === 'gymkanas' ? (6 + (idx % 3)) : null
        })),
        Shooter: shooterStudents.slice(0, count).map((s, idx) => ({
          studentId: s.id,
          name: s.name,
          carrera: s.carrera,
          addedAt: new Date(Date.now() - 3600000 + idx * 60000).toISOString(),
          addedBy: 'Mesa Cancha',
          score: act.id === 'gymkanas' ? (6 + ((idx + 1) % 3)) : null
        })),
        Action: actionStudents.slice(0, Math.min(count, actionStudents.length)).map((s, idx) => ({
          studentId: s.id,
          name: s.name,
          carrera: s.carrera,
          addedAt: new Date(Date.now() - 3600000 + idx * 60000).toISOString(),
          addedBy: 'Mesa Cancha',
          score: act.id === 'gymkanas' ? (4 + (idx % 4)) : null
        }))
      },
      audit: [
        {
          timestamp: new Date().toISOString(),
          action: "Lista oficial registrada y validada",
          user: "Mesa de Control"
        }
      ]
    };
  });

  // 2. Actividades del 19 con resultados competitivos
  // Terror: ~23.174, Shooter: ~22.736, Action: ~14.326
  data.activities.forEach(act => {
    if (act.id === 'babyfutbol') {
      act.status = 'Terminada';
      act.pointsAwarded = { Terror: 4000, Shooter: 2400, Action: 1200 };
    } else if (act.id === 'tacataca') {
      act.status = 'Terminada';
      act.pointsAwarded = { Terror: 600, Shooter: 1000, Action: 300 };
    } else if (act.id === 'pingpong') {
      act.status = 'Terminada';
      act.pointsAwarded = { Terror: 1000, Shooter: 600, Action: 300 };
    } else if (act.id === 'tacapingpong') {
      act.status = 'Terminada';
      act.pointsAwarded = { Terror: 1200, Shooter: 2000, Action: 600 };
    } else if (act.id === 'quemadas') {
      act.status = 'Terminada';
      act.pointsAwarded = { Terror: 4000, Shooter: 2400, Action: 1200 };
    } else if (act.id === 'trivia') {
      act.status = 'Terminada';
      act.pointsAwarded = { Terror: 2400, Shooter: 4000, Action: 1200 };
    } else if (act.id === 'canto') {
      act.status = 'Terminada';
      act.pointsAwarded = { Terror: 3000, Shooter: 1800, Action: 900 };
    } else if (act.id === 'barra') {
      act.status = 'Terminada';
      act.pointsAwarded = { Terror: 2500, Shooter: 2500, Action: 1500 };
    } else if (act.id === 'gymkanas') {
      act.status = 'Terminada';
      // Promedios: Terror ~6.8/8 -> 2.550 pts; Shooter ~6.5/8 -> 2.438 pts; Action ~5.0/8 -> 1.875 pts
      act.averages = { Terror: 6.8, Shooter: 6.5, Action: 5.0 };
      act.pointsAwarded = { Terror: 2550, Shooter: 2438, Action: 1875 };
    } else if (act.id === 'retro') {
      act.status = 'En curso';
      act.pointsAwarded = { Terror: 0, Shooter: 0, Action: 0 };
    }
  });

  // 3. Desafíos Creativos (Rúbricas evaluadas)
  data.creativeChallenges = {
    status: { Terror: 'Evaluado', Shooter: 'Evaluado', Action: 'Evaluado' },
    rubrics: {
      Terror: { docente1: { cal1: 95, cal2: 90, cal3: 92, cal4: 90 }, docente2: { cal1: 90, cal2: 88, cal3: 94, cal4: 92 } },
      Shooter: { docente1: { cal1: 92, cal2: 89, cal3: 91, cal4: 88 }, docente2: { cal1: 91, cal2: 90, cal3: 89, cal4: 91 } },
      Action: { docente1: { cal1: 98, cal2: 96, cal3: 97, cal4: 95 }, docente2: { cal1: 96, cal2: 95, cal3: 98, cal4: 97 } }
    },
    favoriteAlliance: 'Action',
    pointsAwarded: {
      Terror: 1500,
      Shooter: 2500,
      Action: 3500
    }
  };

  // 4. Copa Tarreo
  data.tarreoCopa = {
    cazatesoros: { pointsAwarded: { Terror: 300, Shooter: 400, Action: 600 } },
    justdance: { pointsAwarded: { Terror: 300, Shooter: 400, Action: 600 } },
    mimica: { pointsAwarded: { Terror: 224, Shooter: 198, Action: 551 } }
  };

  // 5. Sanciones (Ejemplo de sanción reglamentaria)
  data.sanciones = [
    {
      id: Date.now() - 1200000,
      alliance: 'Shooter',
      pointsDeducted: 300,
      reason: 'Retraso de 15 minutos en presentación a cancha (Art. 14 Bases)',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      authorizedBy: 'Coordinadora General'
    }
  ];

  // 6. Reclamos (Ejemplo de reclamo resuelto)
  data.reclamos = [
    {
      id: Date.now() - 3600000,
      alliance: 'Terror',
      activity: 'Quemadas',
      type: 'Reglamento',
      text: 'Revisión de pisada de línea en ronda 2.',
      status: 'Resuelto',
      resolution: 'Revisión en video confirma jugada válida. Sin modificación de puntaje.',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  // 7. Avisos
  data.announcements = [
    {
      id: Date.now(),
      text: "Torneo Retro en juego en Arcades USB • Duelo final entre Terror y Shooter",
      timestamp: new Date().toISOString()
    }
  ];

  saveData(data);
  console.log("==================================================");
  console.log("✔ DATOS SIMULADOS INYECTADOS CON ÉXITO.");
  console.log("✔ Puntajes realistas aplicados con final de alta competencia:");
  console.log("   - Terror: ~23.174 pts (1° Lugar)");
  console.log("   - Shooter: ~22.736 pts (2° Lugar, diferencia reñida)");
  console.log("   - Action: ~14.326 pts (3° Lugar)");
  console.log("✔ Estudiantes inscritos en nóminas por actividad.");
  console.log("✔ Rúbricas docentes evaluadas en Desafíos Creativos.");
  console.log("✔ Sanción y Reclamo de prueba ingresados.");
  console.log("==================================================");
}

function printStatus() {
  const data = loadData();
  const students = loadStudents();

  // Calcular totales
  const totals = {
    Terror: 0,
    Shooter: 0,
    Action: 0
  };

  data.activities.forEach(a => {
    ['Terror', 'Shooter', 'Action'].forEach(al => {
      totals[al] += Number(a.pointsAwarded?.[al] || 0);
    });
  });

  ['Terror', 'Shooter', 'Action'].forEach(al => {
    totals[al] += Number(data.creativeChallenges?.pointsAwarded?.[al] || 0);
    totals[al] += Number(data.tarreoCopa?.cazatesoros?.pointsAwarded?.[al] || 0);
    totals[al] += Number(data.tarreoCopa?.justdance?.pointsAwarded?.[al] || 0);
    totals[al] += Number(data.tarreoCopa?.mimica?.pointsAwarded?.[al] || 0);
  });

  (data.sorpresas || []).forEach(s => {
    ['Terror', 'Shooter', 'Action'].forEach(al => {
      totals[al] += Number(s.pointsAwarded?.[al] || 0);
    });
  });

  (data.sanciones || []).forEach(s => {
    if (totals[s.alliance] !== undefined) {
      totals[s.alliance] -= Number(s.pointsDeducted || 0);
    }
  });

  console.log("\n================ ESTADO ACTUAL DEL MARCADOR ================");
  console.log(`1. Alianza Terror:  ${totals.Terror.toLocaleString('es-CL')} pts (${(totals.Terror / 320).toFixed(1)}% de la meta)`);
  console.log(`2. Alianza Shooter: ${totals.Shooter.toLocaleString('es-CL')} pts (${(totals.Shooter / 320).toFixed(1)}% de la meta)`);
  console.log(`3. Alianza Action:  ${totals.Action.toLocaleString('es-CL')} pts (${(totals.Action / 320).toFixed(1)}% de la meta)`);
  console.log("-------------------------------------------------------------");
  const diff = Math.abs(totals.Terror - totals.Shooter);
  console.log(`Diferencia 1° y 2°: ${diff.toLocaleString('es-CL')} pts`);
  console.log(`Total Sanciones registradas: ${(data.sanciones || []).length}`);
  console.log(`Total Reclamos registrados: ${(data.reclamos || []).length}`);
  console.log("=============================================================\n");
}

const action = process.argv[2];
if (action === 'clean') {
  cleanAllData();
} else if (action === 'simulate') {
  simulateData();
} else if (action === 'status') {
  printStatus();
} else {
  console.log("Uso: node manage_simulation.js [clean|simulate|status]");
}
