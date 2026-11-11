// Application State
let appData = {
  alliances: {},
  activities: [],
  creativeChallenges: {},
  tarreoCopa: {},
  announcements: [],
  sorpresas: [],
  sanciones: [],
  reclamos: []
};

let currentTab = 'inicio';
let refreshInterval = null;

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  // Poll for live score updates every 6 seconds
  refreshInterval = setInterval(loadStats, 6000);
  lucide.createIcons();
});

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Error al cargar datos');
    appData = await res.json();
    
    // Solo re-renderizar la vista completa si estamos en inicio o bigscreen.
    // En las demás pestañas (mialianza, participantes, actividades, admin, etc.)
    // NUNCA recargar la vista para no resetear inputs, búsquedas ni el scroll del usuario.
    if (currentTab === 'inicio') {
      renderCurrentTab();
    }
    updateLiveAnnouncement();
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
}
function updateLiveAnnouncement() {
  const annEl = document.getElementById('announcement-text');
  if (!annEl) return;
  if (appData.activeSorpresa) {
    annEl.innerHTML = `<span class="text-amber-400 font-bold uppercase animate-pulse">🚨 ¡PRUEBA SORPRESA EN VIVO!: ${appData.activeSorpresa.name} • 1 min de preparación</span>`;
  } else if (appData.announcements && appData.announcements.length > 0) {
    annEl.textContent = appData.announcements[0].text;
  } else {
    annEl.textContent = 'Semana de las Carreras 2026: Torneos, Gymkanas, Desafíos y Tarreo Gamer • Informática, Telecom & Diseño.';
  }
}

function updatePublicSorpresaCountdown() {
  const el = document.getElementById('public-sorp-countdown');
  if (!el || !appData.activeSorpresa || !appData.activeSorpresa.prepEndsAt) return;
  const diff = new Date(appData.activeSorpresa.prepEndsAt).getTime() - Date.now();
  if (diff <= 0) {
    el.textContent = '¡Comenzó!';
    el.className = 'text-2xl font-mono font-bold text-emerald-400 block animate-pulse';
  } else {
    const sec = Math.ceil(diff / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}
setInterval(updatePublicSorpresaCountdown, 1000);

// Navigation Router
function navigate(tab) {
  currentTab = tab;
  
  // Highlight active tab
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('text-white', 'bg-[#E6194B]', 'bg-slate-800', 'font-bold', 'shadow-lg', 'shadow-[#E6194B]/40', 'border', 'border-white/30', 'border-slate-700/60');
    btn.classList.add('text-slate-300');
  });
  
  const activeBtn = document.getElementById(`nav-${tab}`);
  if (activeBtn) {
    activeBtn.classList.remove('text-slate-300');
    activeBtn.classList.add('text-white', 'bg-[#E6194B]', 'font-bold', 'shadow-lg', 'shadow-[#E6194B]/40', 'border', 'border-white/30');
  }

  // Tab navigation
  if (tab === 'bigscreen') tab = 'inicio';

  renderCurrentTab();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


let countdownInterval = null;
function initCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  const targetDate = new Date('2026-11-19T09:30:00-03:00').getTime();

  function update() {
    const timerEl = document.getElementById('countdown-timer');
    const labelEl = document.getElementById('countdown-label');
    if (!timerEl) return;

    const now = Date.now();
    const diff = targetDate - now;

    if (diff <= 0) {
      if (labelEl) labelEl.textContent = 'Estado del Evento';
      timerEl.textContent = '¡En Desarrollo!';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    timerEl.textContent = `${days}d ${hours}h ${mins}m ${secs}s`;
  }

  update();
  countdownInterval = setInterval(update, 1000);
}

function renderCurrentTab() {
  const container = document.getElementById('app-container');
  if (!container) return;

  switch (currentTab) {
    case 'inicio':
      container.innerHTML = renderInicio();
      initCountdown();
      break;

    case 'actividades':
      container.innerHTML = renderActividades();
      break;
    case 'desafios':
      container.innerHTML = renderDesafios();
      break;
    case 'mialianza':
      container.innerHTML = renderMiAlianza();
      break;
    case 'reglas':
      container.innerHTML = renderReglas();
      break;
    case 'premios':
      container.innerHTML = renderPremios();
      break;

    default:
      container.innerHTML = renderInicio();
  }

  lucide.createIcons();
}

// ==========================================

// Helper: Determinar posiciones oficiales de una actividad sin mostrar puntos
function getActivityPodium(act) {
  if (!act || act.status !== 'Terminada') return null;
  const p = act.pointsAwarded || {};
  const entries = [
    { al: 'Terror', pts: Number(p.Terror || 0) },
    { al: 'Shooter', pts: Number(p.Shooter || 0) },
    { al: 'Action', pts: Number(p.Action || 0) }
  ].sort((a, b) => b.pts - a.pts);

  if (entries[0].pts === entries[1].pts && entries[1].pts === entries[2].pts) {
    return {
      first: 'Empate Triple',
      second: '-',
      third: '-'
    };
  }
  if (entries[0].pts === entries[1].pts) {
    return {
      first: `Empate: ${entries[0].al} y ${entries[1].al}`,
      second: '-',
      third: entries[2].al
    };
  }
  if (entries[1].pts === entries[2].pts) {
    return {
      first: entries[0].al,
      second: `Empate: ${entries[1].al} y ${entries[2].al}`,
      third: '-'
    };
  }

  return {
    first: entries[0].al,
    second: entries[1].al,
    third: entries[2].al
  };
}

// ==========================================

// ==========================================
// 1. INICIO: ÚLTIMA ACTIVIDAD CERRADA Y SUS GANADORES (SIN CLASIFICACIÓN GENERAL DE ALIANZAS)
// ==========================================
function renderInicio() {
  const activities = appData.activities || [];
  
  // Buscar las actividades terminadas (cerradas)
  const closedActivities = activities.filter(a => a.status === 'Terminada');
  // La última actividad cerrada es la última de la lista terminada
  const lastClosedAct = closedActivities.length > 0 ? closedActivities[closedActivities.length - 1] : null;

  // Actividad en curso y próxima
  const activeAct = activities.find(a => a.status === 'En curso');
  const nextAct = activities.find(a => a.status === 'Pendiente');

  // Obtener podio de la última cerrada
  const lastPodium = lastClosedAct ? getActivityPodium(lastClosedAct) : null;

  return `
    <div class="space-y-8 max-w-6xl mx-auto">
      
      <!-- ======================================================== -->
      <!-- HERO POSTER ESPORTS & GUÍA GRÁFICA SYNTH-TECH            -->
      <!-- ======================================================== -->
      <section class="relative bg-gradient-to-b from-[#0A1333] via-[#050C24] to-[#0A1333] border-2 border-[#2D46B9]/60 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden glow-rim">
        
        <!-- Destellos radiales internos -->
        <div class="absolute -top-24 -left-24 w-80 h-80 bg-[#E6194B]/15 blur-3xl rounded-full pointer-events-none"></div>
        <div class="absolute -bottom-24 -right-24 w-80 h-80 bg-[#2D46B9]/20 blur-3xl rounded-full pointer-events-none"></div>

        <!-- 1. Encabezado del Póster: Subtítulo + Año flanqueado + Título de Impacto -->
        <div class="relative z-10 text-center space-y-1">
          <p class="font-display font-black italic tracking-widest text-slate-300 text-sm sm:text-lg uppercase">
            SEMANA DE LAS
          </p>

          <!-- Año en Rojo Carmesí flanqueado por 2 líneas blancas horizontales -->
          <div class="flex items-center justify-center gap-3 sm:gap-4 my-1">
            <span class="h-0.5 w-12 sm:w-24 bg-white/90"></span>
            <span class="text-[#E6194B] font-display font-black text-2xl sm:text-3xl italic tracking-widest">
              2026
            </span>
            <span class="h-0.5 w-12 sm:w-24 bg-white/90"></span>
          </div>

          <!-- Título Principal de Impacto con Deformación y Sombra Sólida -->
          <h1 class="esport-title text-4xl sm:text-6xl md:text-7xl font-black italic tracking-tight text-white uppercase text-center drop-shadow-2xl">
            CARRERAS
          </h1>
        </div>

        <!-- 2. Ilustración Central Synth-Tech / Esports (Tríada con Renders Oficiales PNG) -->
        <div class="relative z-10 my-4 flex items-center justify-center">
          <div class="w-full max-w-4xl relative">
            
            <!-- Resplandor de fondo y horizonte curvo -->
            <div class="relative flex items-end justify-center gap-2 sm:gap-6 pt-6 pb-2">
              
              <!-- Halo de Fondo Central -->
              <div class="absolute inset-0 bg-[#0E1E48]/80 blur-3xl rounded-full -z-10"></div>
              
              <!-- 1. Operador Gamer Azul (Izquierda - Alianza Shooter) -->
              <div class="relative w-28 sm:w-44 md:w-52 h-44 sm:h-56 md:h-64 flex items-end justify-center -mr-4 sm:-mr-6 z-10 group cursor-pointer" onclick="navigate('mialianza'); setAllianceFilter('Shooter');" title="Alianza Shooter">
                <div class="absolute inset-0 bg-[#2D46B9]/30 blur-2xl rounded-full"></div>
                <img 
                  src="/img/mascota-shooter.png" 
                  alt="Operador Gamer Azul - Alianza Shooter" 
                  class="relative z-10 max-h-full object-contain filter drop-shadow-[0_10px_25px_rgba(45,70,185,0.6)] group-hover:scale-105 group-hover:-translate-y-2 transition duration-300"
                />
              </div>

              <!-- 2. Mascota Gamer Enmascarada Roja (Centro - Alianza Terror - Protagonista) -->
              <div class="relative w-36 sm:w-56 md:w-64 h-52 sm:h-64 md:h-72 flex items-end justify-center z-20 group cursor-pointer" onclick="navigate('mialianza'); setAllianceFilter('Terror');" title="Alianza Terror">
                <div class="absolute inset-0 bg-[#E6194B]/35 blur-3xl rounded-full"></div>
                <img 
                  src="/img/mascota-terror.png" 
                  alt="Mascota Enmascarada Roja - Alianza Terror" 
                  class="relative z-20 max-h-full object-contain filter drop-shadow-[0_15px_30px_rgba(230,25,75,0.7)] group-hover:scale-105 group-hover:-translate-y-2 transition duration-300"
                />
              </div>

              <!-- 3. Gamer Cinéfilo Neón (Derecha - Alianza Action) -->
              <div class="relative w-28 sm:w-44 md:w-52 h-44 sm:h-56 md:h-64 flex items-end justify-center -ml-4 sm:-ml-6 z-10 group cursor-pointer" onclick="navigate('mialianza'); setAllianceFilter('Action');" title="Alianza Action">
                <div class="absolute inset-0 bg-[#059669]/30 blur-2xl rounded-full"></div>
                <img 
                  src="/img/mascota-action.png" 
                  alt="Gamer Cinéfilo Neón - Alianza Action" 
                  class="relative z-10 max-h-full object-contain filter drop-shadow-[0_10px_25px_rgba(5,150,105,0.6)] group-hover:scale-105 group-hover:-translate-y-2 transition duration-300"
                />
              </div>

            </div>

            <!-- Arco Curvo Bicolor que sirve de Horizonte -->
            <div class="w-full h-2 rounded-full bg-gradient-to-r from-[#2D46B9] via-[#E6194B] to-[#7F9CF5] shadow-lg shadow-[#E6194B]/40 -mt-2 relative z-30"></div>
          </div>
        </div>

        <!-- 3. Cinta Divisoria (Ribbon Banner Parallelogram en Rojo Carmesí #E6194B) -->
        <div class="relative z-10 my-5">
          <div class="mx-auto max-w-3xl bg-[#E6194B] shadow-2xl shadow-[#E6194B]/50 p-2.5 sm:p-3 text-center transition hover:scale-[1.01]" style="transform: var(--banner-skew);">
            <div style="transform: skewX(15deg);" class="flex items-center justify-center gap-3">
              <span class="text-white font-black text-sm sm:text-base select-none tracking-widest hidden sm:inline">= = =</span>
              <span class="font-display font-black italic uppercase tracking-wider text-white text-xs sm:text-base md:text-lg">
                CUATRO CARRERAS, UN SOLO TROFEO
              </span>
              <span class="text-white font-black text-sm sm:text-base select-none tracking-widest hidden sm:inline">= = =</span>
            </div>
          </div>

          <!-- Frase de Invitación Inferior flanqueada por Spark Lines (=) -->
          <div class="mt-3 flex items-center justify-center gap-3 text-center">
            <span class="text-[#E6194B] font-display font-black text-lg select-none">=</span>
            <span class="font-display font-bold italic text-slate-200 text-xs sm:text-sm tracking-wide">
              ¡Ven a disfrutar de los torneos, gymkanas y desafíos en vivo!
            </span>
            <span class="text-[#E6194B] font-display font-black text-lg select-none">=</span>
          </div>
        </div>

        <!-- 4. Grilla de 4 Columnas de Especialidades (Líneas de trazo outline 3-4px blanco) -->
        <div class="relative z-10 mt-7 pt-6 border-t border-[#142252] grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <!-- Columna 1: Informática -->
          <div class="flex flex-col items-center text-center p-3 md:border-r md:border-[#E6194B]/40 group">
            <div class="w-14 h-14 rounded-2xl bg-[#0A1333] border-2 border-[#2D46B9] flex items-center justify-center mb-3 group-hover:border-[#E6194B] transition shadow-md shadow-[#2D46B9]/20">
              <!-- Laptop con </> Outline Blanco (~3-4px stroke) -->
              <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="12" rx="2" />
                <line x1="2" y1="20" x2="22" y2="20" />
                <polyline points="9 9 7 11 9 13" />
                <polyline points="15 9 17 11 15 13" />
              </svg>
            </div>
            <h4 class="font-display font-semibold text-white text-xs sm:text-sm leading-tight">
              Ingeniería en Informática
            </h4>
            <span class="text-[10px] text-slate-400 font-mono mt-1">Desarrollo & Algoritmos</span>
          </div>

          <!-- Columna 2: Telecomunicaciones -->
          <div class="flex flex-col items-center text-center p-3 md:border-r md:border-[#E6194B]/40 group">
            <div class="w-14 h-14 rounded-2xl bg-[#0A1333] border-2 border-[#2D46B9] flex items-center justify-center mb-3 group-hover:border-[#E6194B] transition shadow-md shadow-[#2D46B9]/20">
              <!-- Antena Telecom Outline Blanco (~3-4px stroke) -->
              <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 10a12 12 0 0 1 16 0" />
                <path d="M7 13a7 7 0 0 1 10 0" />
                <line x1="12" y1="16" x2="12" y2="22" />
                <circle cx="12" cy="16" r="2" fill="white" />
              </svg>
            </div>
            <h4 class="font-display font-semibold text-white text-xs sm:text-sm leading-tight">
              Telecomunicaciones & Redes
            </h4>
            <span class="text-[10px] text-slate-400 font-mono mt-1">Conectividad & Ciberseguridad</span>
          </div>

          <!-- Columna 3: Analista Programador -->
          <div class="flex flex-col items-center text-center p-3 md:border-r md:border-[#E6194B]/40 group">
            <div class="w-14 h-14 rounded-2xl bg-[#0A1333] border-2 border-[#2D46B9] flex items-center justify-center mb-3 group-hover:border-[#E6194B] transition shadow-md shadow-[#2D46B9]/20">
              <!-- Servidor en Rack Outline Blanco (~3-4px stroke) -->
              <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="7" rx="2" />
                <rect x="2" y="14" width="20" height="7" rx="2" />
                <line x1="6" y1="6.5" x2="6.01" y2="6.5" stroke-width="4" />
                <line x1="6" y1="17.5" x2="6.01" y2="17.5" stroke-width="4" />
                <line x1="14" y1="6.5" x2="18" y2="6.5" />
                <line x1="14" y1="17.5" x2="18" y2="17.5" />
              </svg>
            </div>
            <h4 class="font-display font-semibold text-white text-xs sm:text-sm leading-tight">
              Analista Programador
            </h4>
            <span class="text-[10px] text-slate-400 font-mono mt-1">Bases de Datos & Sistemas</span>
          </div>

          <!-- Columna 4: Diseño Web & Mobile -->
          <div class="flex flex-col items-center text-center p-3 group">
            <div class="w-14 h-14 rounded-2xl bg-[#0A1333] border-2 border-[#2D46B9] flex items-center justify-center mb-3 group-hover:border-[#E6194B] transition shadow-md shadow-[#2D46B9]/20">
              <!-- Pluma Bézier Outline Blanco (~3-4px stroke) -->
              <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <circle cx="11" cy="11" r="2" />
              </svg>
            </div>
            <h4 class="font-display font-semibold text-white text-xs sm:text-sm leading-tight">
              Diseño Web & Mobile
            </h4>
            <span class="text-[10px] text-slate-400 font-mono mt-1">UI/UX & Multimedia</span>
          </div>

        </div>

      </section>

      <!-- ======================================================== -->
      <!-- RESULTADOS OFICIALES EN CANCHA Y CONTADOR                -->
      <!-- ======================================================== -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#142252] pb-5">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-[#E6194B] animate-pulse"></span>
            <span class="text-xs font-mono font-bold uppercase tracking-wider text-[#7F9CF5]">Resultados Oficiales en Cancha</span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">Competencias y Actividades</h2>
          <p class="text-xs text-slate-300 mt-1">Sigue el resultado oficial de cada actividad de la Semana de las Carreras 2026 • Informática, Telecomunicaciones y Diseño Digital.</p>
          <div class="mt-2.5">
            <button onclick="navigate('reglas')" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-[#0E1E48] hover:bg-[#142252] text-[#7F9CF5] border border-[#2D46B9] transition shadow-sm">
              <i data-lucide="calculator" class="w-3.5 h-3.5 text-[#7F9CF5]"></i>
              <span>¿Cómo se calculó? Entiéndelo en 1 minuto →</span>
            </button>
          </div>
        </div>

        <!-- Cronómetro / Estado del evento con Token Navy & Bordes de Acento -->
        <div class="bg-[#0A1333] border-2 border-[#2D46B9] rounded-2xl px-5 py-3.5 flex items-center gap-4 shrink-0 shadow-lg glow-electric">
          <div class="p-2.5 rounded-xl bg-[#050C24] text-[#E6194B]">
            <i data-lucide="clock-3" class="w-5 h-5"></i>
          </div>
          <div>
            <span class="text-[10px] uppercase font-display font-bold tracking-wider text-[#7F9CF5] block leading-tight" id="countdown-label">Tiempo al Evento</span>
            <span class="text-base sm:text-lg font-mono font-black text-white tracking-wide block" id="countdown-timer">--:--:--</span>
          </div>
        </div>
      </div>

      <!-- SI HAY PRUEBA SORPRESA EN CURSO -->
      ${appData.activeSorpresa ? `
        <div class="p-5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-purple-950/70 border-2 border-amber-500/80 shadow-2xl space-y-3 relative overflow-hidden">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500 text-slate-950 uppercase animate-pulse shadow-md">
                🚨 ¡PRUEBA SORPRESA EN VIVO!
              </span>
              <h3 class="text-xl font-bold font-heading text-white mt-1.5">${appData.activeSorpresa.name}</h3>
              <p class="text-xs text-slate-300 mt-0.5">${appData.activeSorpresa.description || ''}</p>
            </div>
            <div class="p-3 bg-slate-950/90 border border-amber-600/60 rounded-xl text-center min-w-[140px] shrink-0 shadow-lg">
              <span class="text-[10px] font-mono uppercase text-amber-400 block font-bold">Tiempo de Preparación</span>
              <span class="text-2xl font-mono font-bold text-white block" id="public-sorp-countdown">01:00</span>
              <span class="text-[9px] font-mono text-slate-400">1 minuto oficial</span>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 border-t border-amber-900/40 pt-2.5">
            <span>Material: <strong class="text-white">${appData.activeSorpresa.material || 'Ninguno'}</strong></span>
            <span>•</span>
            <span class="text-amber-300">${appData.activeSorpresa.careNotes || ''}</span>
          </div>
        </div>
      ` : ''}

      <!-- SECCIÓN PRINCIPAL: ÚLTIMA ACTIVIDAD CERRADA -->
      <div class="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div class="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
          <div class="flex items-center gap-2.5">
            <span class="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
            <span class="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Última Actividad Cerrada • Resultado Oficial
            </span>
          </div>
          <span class="text-[11px] font-mono text-slate-500">
            ${lastClosedAct ? `Finalizada: ${lastClosedAct.time || 'Jornada'}` : 'En espera'}
          </span>
        </div>

        ${lastClosedAct && lastPodium ? `
          <div>
            <div class="mb-5">
              <span class="text-xs font-mono uppercase text-slate-500 block">${lastClosedAct.group} • ${lastClosedAct.location}</span>
              <h3 class="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight mt-1">
                ${lastClosedAct.name}
              </h3>
              <p class="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-3xl">
                ${lastClosedAct.description || 'Competencia oficial disputada en cancha.'}
              </p>
            </div>

            <!-- PODIO EXCLUSIVO DE ESTA ACTIVIDAD (1°, 2°, 3° LUGAR) -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              
              <!-- 1° Lugar -->
              <div class="bg-[#0A1333] border-2 border-[#E6194B] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl shadow-[#E6194B]/20 relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-16 h-16 bg-[#E6194B]/10 rounded-bl-3xl pointer-events-none"></div>
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[11px] font-display font-black uppercase px-3 py-1 rounded-md bg-[#E6194B] text-white flex items-center gap-1.5 shadow-sm shadow-[#E6194B]/50">
                      <span>🥇</span>
                      <span>1° Lugar (Ganador)</span>
                    </span>
                  </div>
                  <h4 class="text-xl font-black font-display text-white mt-2.5 tracking-tight">
                    Alianza ${lastPodium.first}
                  </h4>
                  <span class="text-xs text-slate-300 block mt-0.5">
                    ${appData.alliances?.[lastPodium.first]?.carrera || 'Alianza oficial'}
                  </span>
                </div>
                <div class="mt-4 pt-2.5 border-t border-[#142252] text-xs font-display font-bold text-[#E6194B]">
                  Ganador de la competencia
                </div>
              </div>

              <!-- 2° Lugar -->
              <div class="bg-[#0A1333] border-2 border-[#2D46B9] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl shadow-[#2D46B9]/20 relative overflow-hidden group">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[11px] font-display font-black uppercase px-3 py-1 rounded-md bg-[#2D46B9] text-white flex items-center gap-1.5 shadow-sm">
                      <span>🥈</span>
                      <span>2° Lugar</span>
                    </span>
                  </div>
                  <h4 class="text-xl font-black font-display text-white mt-2.5 tracking-tight">
                    Alianza ${lastPodium.second}
                  </h4>
                  <span class="text-xs text-slate-300 block mt-0.5">
                    ${appData.alliances?.[lastPodium.second]?.carrera || 'Alianza oficial'}
                  </span>
                </div>
                <div class="mt-4 pt-2.5 border-t border-[#142252] text-xs font-display font-bold text-[#7F9CF5]">
                  Segundo puesto
                </div>
              </div>

              <!-- 3° Lugar -->
              <div class="bg-[#0A1333] border-2 border-[#142252] hover:border-[#7F9CF5]/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl relative overflow-hidden group transition">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[11px] font-display font-black uppercase px-3 py-1 rounded-md bg-[#142252] text-slate-200 border border-slate-700 flex items-center gap-1.5">
                      <span>🥉</span>
                      <span>3° Lugar</span>
                    </span>
                  </div>
                  <h4 class="text-xl font-black font-display text-white mt-2.5 tracking-tight">
                    Alianza ${lastPodium.third}
                  </h4>
                  <span class="text-xs text-slate-300 block mt-0.5">
                    ${appData.alliances?.[lastPodium.third]?.carrera || 'Alianza oficial'}
                  </span>
                </div>
                <div class="mt-4 pt-2.5 border-t border-[#142252] text-xs font-display font-bold text-slate-400">
                  Tercer puesto
                </div>
              </div>

            </div>
          </div>
        ` : `
          <div class="py-10 text-center text-slate-400 space-y-2">
            <i data-lucide="trophy" class="w-8 h-8 text-slate-600 mx-auto"></i>
            <h4 class="text-base font-bold text-white font-heading">Aún no hay actividades cerradas</h4>
            <p class="text-xs text-slate-500 max-w-md mx-auto">
              Apenas la mesa de control cierre y certifique la primera competencia en cancha, aquí se publicará qué alianza obtuvo el 1°, 2° y 3° lugar de la misma.
            </p>
          </div>
        `}
      </div>

      <!-- ACTIVIDAD EN CURSO & PRÓXIMA (WIDGET COMPACTO) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div class="bg-slate-900/30 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
          <div class="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 shrink-0">
            <i data-lucide="play" class="w-4 h-4"></i>
          </div>
          <div class="min-w-0 flex-1">
            <span class="text-[10px] font-mono uppercase text-slate-500 block">En Cancha Ahora</span>
            <span class="font-semibold text-white block truncate text-sm mt-0.5">
              ${activeAct ? activeAct.name : 'En receso / preparación'}
            </span>
            <span class="text-[11px] text-slate-400 block truncate mt-0.5">
              ${activeAct ? `${activeAct.location} • ${activeAct.time}` : 'Esperando inicio de la siguiente actividad'}
            </span>
          </div>
        </div>

        <div class="bg-slate-900/30 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
          <div class="p-2.5 rounded-xl bg-blue-950/40 border border-blue-900/40 text-blue-400 shrink-0">
            <i data-lucide="fast-forward" class="w-4 h-4"></i>
          </div>
          <div class="min-w-0 flex-1">
            <span class="text-[10px] font-mono uppercase text-slate-500 block">Próxima en Programa</span>
            <span class="font-semibold text-white block truncate text-sm mt-0.5">
              ${nextAct ? nextAct.name : 'Todas las actividades completadas'}
            </span>
            <span class="text-[11px] text-slate-400 block truncate mt-0.5">
              ${nextAct ? `${nextAct.location} • ${nextAct.time}` : 'Jornada oficial finalizada'}
            </span>
          </div>
        </div>
      </div>

      <!-- LISTA DE TODAS LAS ACTIVIDADES Y SUS CLASIFICACIONES -->
      <div class="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div class="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 class="text-base font-bold font-heading text-white">Clasificación por Actividad</h3>
            <p class="text-xs text-slate-400">Revisa qué alianza quedó en 1°, 2° y 3° lugar en cada competencia finalizada.</p>
          </div>
          <span class="text-[11px] text-slate-500 font-mono">
            Haz clic en una fila para ver reglamento
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono tracking-wider border-b border-slate-800/80">
              <tr>
                <th class="py-3 px-4">Actividad</th>
                <th class="py-3 px-3 text-center">Estado</th>
                <th class="py-3 px-3">🥇 1° Lugar (Ganador)</th>
                <th class="py-3 px-3">🥈 2° Lugar</th>
                <th class="py-3 px-3">🥉 3° Lugar</th>
                <th class="py-3 px-3 text-center w-8"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/40">
              ${activities.map(act => {
                const podium = getActivityPodium(act);
                const isFinished = act.status === 'Terminada';
                const isLive = act.status === 'En curso';

                const statusBadge = isFinished 
                  ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-900/40' 
                  : (isLive ? 'text-amber-400 bg-amber-950/60 border border-amber-900/40 animate-pulse' : 'text-slate-500 bg-slate-900 border border-slate-800');

                const getBadge = (alName) => {
                  if (!alName || alName === '-') return '<span class="text-slate-600">-</span>';
                  const isT = alName.includes('Terror');
                  const isS = alName.includes('Shooter');
                  const isA = alName.includes('Action');
                  const color = isT ? 'text-red-400 bg-red-950/40 border-red-900/40' : (isS ? 'text-blue-400 bg-blue-950/40 border-blue-900/40' : (isA ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/40' : 'text-slate-300 bg-slate-900 border-slate-800'));
                  return `<span class="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold border ${color}">${alName}</span>`;
                };

                return `
                  <tr onclick="openActivityDetail('${act.id}')" class="hover:bg-slate-800/40 cursor-pointer transition">
                    <td class="py-3 px-4 font-medium text-white">
                      ${act.name}
                      <span class="block text-[10px] text-slate-500 font-mono">${act.location} • ${act.time}</span>
                    </td>
                    <td class="py-3 px-3 text-center">
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded ${statusBadge}">
                        ${act.status}
                      </span>
                    </td>
                    <td class="py-3 px-3">
                      ${isFinished ? getBadge(podium.first) : (isLive ? '<span class="text-amber-400 font-mono text-[11px]">En disputa en cancha</span>' : '<span class="text-slate-600 font-mono text-[11px]">Por disputarse</span>')}
                    </td>
                    <td class="py-3 px-3">
                      ${isFinished ? getBadge(podium.second) : (isLive ? '<span class="text-slate-600 font-mono text-[11px]">-</span>' : '<span class="text-slate-600 font-mono text-[11px]">-</span>')}
                    </td>
                    <td class="py-3 px-3">
                      ${isFinished ? getBadge(podium.third) : (isLive ? '<span class="text-slate-600 font-mono text-[11px]">-</span>' : '<span class="text-slate-600 font-mono text-[11px]">-</span>')}
                    </td>
                    <td class="py-3 px-3 text-center text-slate-500">
                      <i data-lucide="chevron-right" class="w-3.5 h-3.5 inline"></i>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}
// ==========================================
// 2. PANTALLA GRANDE / PROYECTOR (DISEÑO PROFESIONAL EN VIVO)
// ==========================================
function renderBigScreen() {
  const al = appData.alliances || {};
  const terror = al.Terror || { points: { total: 0 }, carrera: 'Informática (Ingeniería y Tec)' };
  const shooter = al.Shooter || { points: { total: 0 }, carrera: 'Informática (Ingeniería y Tec)' };
  const action = al.Action || { points: { total: 0 }, carrera: 'Diseño e Industria Digital' };

  const pT = terror.points?.total || 0;
  const pS = shooter.points?.total || 0;
  const pA = action.points?.total || 0;

  const MAX_EVENT_POINTS = 32000;
  const pMax = Math.max(pT, pS, pA);

  const alliancesList = [
    { 
      name: 'TERROR', 
      key: 'Terror',
      carrera: 'Informática',
      pts: pT, 
      dot: 'bg-red-500', 
      bar: 'bg-gradient-to-r from-red-700 via-red-600 to-red-500', 
      border: 'border-red-900/50', 
      tag: 'text-red-400 border-red-900/50 bg-red-950/40',
      textAccent: 'text-red-400'
    },
    { 
      name: 'SHOOTER', 
      key: 'Shooter',
      carrera: 'Informática',
      pts: pS, 
      dot: 'bg-blue-500', 
      bar: 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500', 
      border: 'border-blue-900/50', 
      tag: 'text-blue-400 border-blue-900/50 bg-blue-950/40',
      textAccent: 'text-blue-400'
    },
    { 
      name: 'ACTION', 
      key: 'Action',
      carrera: 'Diseño e Industria',
      pts: pA, 
      dot: 'bg-emerald-500', 
      bar: 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500', 
      border: 'border-emerald-900/50', 
      tag: 'text-emerald-400 border-emerald-900/50 bg-emerald-950/40',
      textAccent: 'text-emerald-400'
    }
  ];

  // Ordenar para ranking (1°, 2°, 3°)
  const sorted = [...alliancesList].sort((a, b) => b.pts - a.pts);
  const placesMap = {};
  sorted.forEach((item, idx) => {
    placesMap[item.name] = idx + 1;
  });

  const leader = sorted[0];
  const second = sorted[1];
  const diff12 = (leader.pts - second.pts);

  const actText = appData.activeActivity 
    ? `EN CANCHA: ${appData.activeActivity.name.toUpperCase()} • ${appData.activeActivity.location.toUpperCase()}` 
    : (appData.announcements && appData.announcements.length > 0 ? appData.announcements[0].text.toUpperCase() : 'SEMANA DE LAS CARRERAS 2026 • INFORMÁTICA, TELECOM & DISEÑO');

  return `
    <div class="fixed inset-0 bg-slate-950 text-white z-50 flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden">
      
      <!-- HEADER PROYECTOR -->
      <div class="flex items-center justify-between border-b border-slate-900 pb-4">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded-full bg-[#E30613] shadow-md shadow-red-600/40"></span>
            <span class="font-heading font-black text-white text-xl sm:text-2xl tracking-tight">TI & DISEÑO</span>
          </div>
          <div class="h-6 w-px bg-slate-800"></div>
          <div>
            <span class="text-xs font-mono font-bold text-slate-300 tracking-wider uppercase block">Marcador Oficial • En Vivo</span>
            <span class="text-[10px] font-mono text-slate-400 block">Informática • Analista • Telecom • Diseño Web</span>
          </div>
        </div>

        <!-- DUELO BANNER -->
        ${diff12 <= 800 && leader.pts > 0 ? `
          <div class="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/40 border border-amber-600/50 text-amber-300 font-mono text-xs">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Duelo al rojo: solo ${diff12.toLocaleString('es-CL')} pts separan el 1° y 2° puesto</span>
          </div>
        ` : ''}

        <div class="flex items-center gap-5">
          <div class="text-right">
            <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block" id="countdown-label-big">Cronómetro</span>
            <span class="text-xl sm:text-2xl font-mono font-bold text-white tracking-widest" id="countdown-timer-big">--:--:--</span>
          </div>
          <button onclick="navigate('inicio')" title="Salir del modo proyector" class="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-900 transition border border-slate-800">
            <i data-lucide="minimize-2" class="w-5 h-5"></i>
          </button>
        </div>
      </div>

      <!-- ZONA CENTRAL DE COMPETENCIA -->
      <div class="my-auto py-2 max-w-5xl mx-auto w-full">
        
        ${appData.activeSorpresa ? `
          <div class="bg-gradient-to-r from-red-950/80 via-amber-950/80 to-red-950/80 border-2 border-red-500 rounded-2xl py-3 px-6 text-center mb-6 shadow-2xl animate-pulse">
            <div class="flex items-center justify-center gap-3">
              <span class="text-xl">🚨</span>
              <span class="text-xs font-mono font-black text-amber-400 uppercase tracking-widest">¡PRUEBA SORPRESA EN CURSO!</span>
              <span class="text-xl">🚨</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-heading font-black text-white uppercase mt-0.5">${appData.activeSorpresa.name}</h2>
            <p class="text-xs text-slate-300 mt-0.5">${appData.activeSorpresa.description || ''}</p>
          </div>
        ` : `
          <!-- BANNER DE ACTIVIDAD -->
          <div class="bg-slate-900/60 border border-slate-800 rounded-2xl py-2.5 px-6 text-center mb-6 shadow-lg">
            <div class="flex items-center justify-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-sm sm:text-base font-mono font-bold tracking-wider text-slate-200 uppercase" id="bigscreen-alert-text">
                ${actText}
              </span>
            </div>
          </div>
        `}

        <!-- FILAS DEL MARCADOR VISUAL -->
        <div class="space-y-6">
          <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1 border-b border-slate-900 pb-2">
            <span>POSICIONES OFICIALES & PUNTAJE</span>
            <span class="flex items-center gap-1.5 text-slate-400">
              <i data-lucide="flag" class="w-3.5 h-3.5 text-red-500"></i>
              <span>META DEL EVENTO: 32.000 PTS</span>
            </span>
          </div>

          ${alliancesList.map(item => {
            const place = placesMap[item.name];
            const isLeader = place === 1 && item.pts > 0;
            const diffFromLeader = leader.pts - item.pts;
            const pct = Math.min(100, Math.round((item.pts / MAX_EVENT_POINTS) * 100));
            const visualWidth = Math.max(6, Math.min(100, (item.pts / MAX_EVENT_POINTS) * 100));

            let diffBadge = '';
            if (isLeader) {
              diffBadge = `<span class="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-md">LÍDER (+${diff12.toLocaleString('es-CL')} pts)</span>`;
            } else if (leader.pts > 0) {
              diffBadge = `<span class="text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">A ${diffFromLeader.toLocaleString('es-CL')} pts del líder</span>`;
            }

            return `
              <div class="bg-slate-900/30 border ${item.border} rounded-2xl p-4 sm:p-5 transition shadow-sm space-y-3">
                
                <!-- CABECERA DE LA FILA -->
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-3">
                    <span class="w-3 h-3 rounded-full ${item.dot}"></span>
                    <div>
                      <div class="flex items-center gap-2">
                        <h3 class="font-bold font-heading text-xl sm:text-2xl text-white tracking-wider">ALIANZA ${item.name}</h3>
                        <span class="text-xs uppercase font-semibold px-2 py-0.5 rounded border ${item.tag}">
                          ${place}° LUGAR
                        </span>
                      </div>
                      <span class="text-xs text-slate-400 font-mono">${item.carrera}</span>
                    </div>
                  </div>

                  <!-- PUNTAJE Y DIFERENCIA -->
                  <div class="flex items-center gap-4 text-right">
                    ${diffBadge}
                    <div>
                      <div class="flex items-baseline justify-end gap-1.5">
                        <span class="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight">
                          ${item.pts.toLocaleString('es-CL')}
                        </span>
                        <span class="text-xs font-mono text-slate-400">PTS</span>
                      </div>
                      <span class="text-[11px] font-mono text-slate-500 block">${pct}% hacia la meta</span>
                    </div>
                  </div>
                </div>

                <!-- PISTA DE CARRERA VISUAL CON META -->
                <div class="relative w-full bg-slate-950 h-7 sm:h-8 rounded-xl overflow-hidden border border-slate-800/90 p-1 flex items-center">
                  
                  <!-- Marcadores de escala sutiles (25%, 50%, 75%) -->
                  <div class="absolute left-[25%] top-0 bottom-0 w-px bg-slate-900/80 pointer-events-none"></div>
                  <div class="absolute left-[50%] top-0 bottom-0 w-px bg-slate-900/80 pointer-events-none"></div>
                  <div class="absolute left-[75%] top-0 bottom-0 w-px bg-slate-900/80 pointer-events-none"></div>
                  
                  <!-- Barra de avance de la alianza -->
                  <div 
                    class="${item.bar} h-full rounded-lg transition-all duration-1000 ease-out shadow-md relative flex items-center justify-end pr-2" 
                    style="width: ${visualWidth}%;"
                  >
                    ${visualWidth > 15 ? `<span class="text-[10px] font-mono font-bold text-white drop-shadow">${pct}%</span>` : ''}
                  </div>

                  <!-- Línea meta al final derecho -->
                  <div class="absolute right-2 top-0 bottom-0 flex items-center pointer-events-none">
                    <span class="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">META</span>
                  </div>
                </div>

              </div>
            `;
          }).join('')}
        </div>

      </div>

      <!-- FOOTER DEL PROYECTOR -->
      <div class="border-t border-slate-900 pt-3 flex items-center justify-between text-xs text-slate-500 font-mono">
        <div class="flex items-center gap-2 truncate max-w-3xl">
          <i data-lucide="radio" class="w-3.5 h-3.5 text-red-500 shrink-0"></i>
          <span id="bigscreen-marquee" class="truncate text-slate-400">
            ${appData.announcements && appData.announcements.length > 0 ? appData.announcements[0].text : 'Sigue los resultados en vivo y consulta el padrón en el portal de la carrera.'}
          </span>
        </div>
        <div class="text-[11px] shrink-0 text-slate-600 flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Sincronización en vivo</span>
        </div>
      </div>

    </div>
  `;
}
// 3. ACTIVIDADES DEL 19 (DISEÑO MINIMALISTA & LIMPIO)
// ==========================================
function renderActividades() {
  const acts = appData.activities || [];
  return `
    <div class="space-y-6 max-w-6xl mx-auto">
      <!-- HEADER MINIMAL -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-4">
        <div>
          <span class="text-[11px] font-mono uppercase tracking-wider text-slate-500">Jueves 19 de Noviembre • 09:30 a 13:00</span>
          <h2 class="text-2xl font-bold font-heading text-white tracking-tight mt-0.5">Actividades en Cancha</h2>
        </div>
        <span class="text-xs text-slate-400 font-mono bg-slate-900/60 border border-slate-800/60 px-3 py-1 rounded-lg">
          9 actividades oficiales
        </span>
      </div>

      <!-- GRID DE TARJETAS MINIMALISTAS -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${acts.map(act => {
          const statusBadge = act.status === 'Terminada' 
            ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/40' 
            : (act.status === 'En curso' ? 'text-amber-400 bg-amber-950/40 border border-amber-900/40 animate-pulse' : 'text-slate-500 bg-slate-900/40 border border-slate-800/40');
          
          const pT = act.pointsAwarded?.Terror || 0;
          const pS = act.pointsAwarded?.Shooter || 0;
          const pA = act.pointsAwarded?.Action || 0;
          const isFinished = act.status === 'Terminada';

          return `
            <div class="bg-slate-950 border border-slate-900 hover:border-slate-800 rounded-xl p-4 flex flex-col justify-between transition group">
              <div>
                <div class="flex items-center justify-between gap-2 mb-2.5">
                  <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded ${statusBadge}">
                    ${act.status}
                  </span>
                  <span class="text-[11px] font-mono text-slate-400">
                    Máx ${act.maxPoints.toLocaleString('es-CL')} pts
                  </span>
                </div>

                <h3 class="text-base font-bold font-heading text-white group-hover:text-slate-100 transition">
                  ${act.name}
                </h3>
                
                <div class="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1">
                  <span class="flex items-center gap-1">
                    <i data-lucide="map-pin" class="w-3 h-3 text-slate-400"></i> ${act.location}
                  </span>
                  <span>•</span>
                  <span>${act.time}</span>
                </div>

                <p class="text-xs text-slate-400 mt-2.5 leading-relaxed">
                  ${act.description}
                </p>

                <!-- DISTRIBUCIÓN OFICIAL DE PUNTOS -->
                <div class="mt-3.5 pt-3 border-t border-slate-900/80">
                  <span class="text-[10px] font-mono uppercase text-slate-500 block mb-1.5">Distribución reglamentaria:</span>
                  ${act.pointsDistribution ? `
                    <div class="grid grid-cols-3 gap-1.5 text-center font-mono text-xs">
                      <div class="bg-slate-900/50 border border-slate-900 py-1 px-1.5 rounded">
                        <span class="text-[10px] text-slate-500 block">1° (100%)</span>
                        <span class="font-bold text-slate-200">${act.pointsDistribution[0]}</span>
                      </div>
                      <div class="bg-slate-900/50 border border-slate-900 py-1 px-1.5 rounded">
                        <span class="text-[10px] text-slate-500 block">2° (60%)</span>
                        <span class="font-bold text-slate-300">${act.pointsDistribution[1]}</span>
                      </div>
                      <div class="bg-slate-900/50 border border-slate-900 py-1 px-1.5 rounded">
                        <span class="text-[10px] text-slate-500 block">3° (30%)</span>
                        <span class="font-bold text-slate-400">${act.pointsDistribution[2]}</span>
                      </div>
                    </div>
                  ` : `
                    <div class="bg-slate-900/40 border border-slate-900 py-1.5 px-2 rounded text-center text-[11px] font-mono text-slate-300">
                      3.000 × (Promedio / 8)
                    </div>
                  `}
                </div>
              </div>

              <!-- PUNTOS ENTREGADOS & BOTÓN DETALLE -->
              <div class="mt-4 pt-3 border-t border-slate-900">
                <div class="flex items-center justify-between text-[11px] font-mono mb-2">
                  <span class="text-slate-500">Puntos Asignados:</span>
                  ${isFinished ? '<span class="text-emerald-400 text-[10px]">Confirmado</span>' : '<span class="text-slate-600 text-[10px]">Pendiente</span>'}
                </div>

                <div class="grid grid-cols-3 gap-1.5 text-center text-xs font-mono">
                  <div class="bg-slate-900/30 border border-red-950/60 p-1 rounded">
                    <span class="text-[10px] text-red-400 block font-bold">Terror</span>
                    <span class="text-slate-200 font-semibold">${pT}</span>
                  </div>
                  <div class="bg-slate-900/30 border border-blue-950/60 p-1 rounded">
                    <span class="text-[10px] text-blue-400 block font-bold">Shooter</span>
                    <span class="text-slate-200 font-semibold">${pS}</span>
                  </div>
                  <div class="bg-slate-900/30 border border-emerald-950/60 p-1 rounded">
                    <span class="text-[10px] text-emerald-400 block font-bold">Action</span>
                    <span class="text-slate-200 font-semibold">${pA}</span>
                  </div>
                </div>

                <button onclick="openActivityDetail('${act.id}')" class="w-full mt-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-medium text-slate-300 hover:text-white transition flex items-center justify-center gap-1">
                  <span>Ver detalle de cálculo</span>
                  <i data-lucide="chevron-right" class="w-3 h-3"></i>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
// ==========================================
// 4. DESAFÍOS CREATIVOS (DISEÑO MINIMALISTA & LIMPIO)
// ==========================================
function renderDesafios() {
  const rubrics = appData.creativeChallenges?.rubrics || {};
  const status = appData.creativeChallenges?.status || {};
  const fav = appData.creativeChallenges?.favoriteAlliance;

  const challenges = [
    {
      key: 'Terror',
      alliance: 'Terror',
      color: 'border-red-900/40',
      dot: 'bg-red-500',
      text: 'text-red-400',
      title: 'Videojuego de Terror con IA',
      carrera: 'Informática (Ingeniería y Tecnólogo)',
      desc: 'Videojuego original jugable en navegador web con temática de terror, desarrollado con asistencia de inteligencia artificial.',
      requirements: [
        'Jugable directamente en navegador web sin instalaciones complejas.',
        'Temática de terror: atmósfera, sonido e historia.',
        'Uso evidente y documentado de herramientas de IA en código, arte o música.',
        'Video de gameplay de respaldo de 2 minutos.',
        'Ficha técnica con créditos de los integrantes de la alianza.'
      ],
      rubricKey: 'Terror'
    },
    {
      key: 'Shooter',
      alliance: 'Shooter',
      color: 'border-blue-900/40',
      dot: 'bg-blue-500',
      text: 'text-blue-400',
      title: 'Asistente con IA (Chatbot Sede)',
      carrera: 'Informática (Ingeniería y Tecnólogo)',
      desc: 'Chatbot conversacional con IA entrenado para responder consultas estudiantiles reales del Área TI y Diseño (trámites, ramos, vida estudiantil).',
      requirements: [
        'Cobertura de al menos 15 preguntas frecuentes de 3 áreas temáticas.',
        'Pruebas previas documentadas con un mínimo de 20 preguntas reales.',
        'Enlace web público funcional y video de respaldo de 2 minutos.',
        'Evaluación en vivo: responde 1 pregunta conocida, 1 libre y 1 trampa (no inventar datos).',
        'Ficha técnica de los integrantes participantes.'
      ],
      rubricKey: 'Shooter'
    },
    {
      key: 'Action',
      alliance: 'Action',
      color: 'border-emerald-900/40',
      dot: 'bg-emerald-500',
      text: 'text-emerald-400',
      title: 'Collage Digital Fotográfico Creativo',
      carrera: 'Diseño e Industria Digital',
      desc: 'Collage digital de gran formato que represente la identidad de las carreras de TI y Diseño mediante fotografías 100% originales.',
      requirements: [
        'Fotografías originales capturadas por la alianza durante la jornada.',
        'Composición armónica combinando imagen, texturas y tipografía institucional.',
        'Archivo digital final en alta resolución para impresión/pantalla.',
        'Carpeta digital con las fotografías originales sin editar como respaldo.',
        'Memoria breve que describa el concepto visual propuesto.'
      ],
      rubricKey: 'Action'
    }
  ];

  return `
    <div class="space-y-6 max-w-6xl mx-auto">
      <!-- HEADER MINIMAL -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-4">
        <div>
          <span class="text-[11px] font-mono uppercase tracking-wider text-slate-500">Obras Únicas por Alianza • Evaluación Docente</span>
          <h2 class="text-2xl font-bold font-heading text-white tracking-tight mt-0.5">Desafíos Creativos con IA</h2>
        </div>
        <span class="text-xs text-slate-400 font-mono bg-slate-900/60 border border-slate-800/60 px-3 py-1 rounded-lg">
          Hasta 4.000 pts por alianza
        </span>
      </div>

      <!-- DESGLOSE DE PUNTOS REGLAMENTARIO (MINIMAL) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="bg-slate-950 border border-slate-900 p-3.5 rounded-xl">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-white">Entrega en Plazo</span>
            <span class="text-xs font-mono font-bold text-slate-300">1.000 pts</span>
          </div>
          <p class="text-[11px] text-slate-500 leading-relaxed">
            Jueves 19 (hora por definir). Cumplimiento de requisitos mínimos y video/archivos de respaldo.
          </p>
        </div>

        <div class="bg-slate-950 border border-slate-900 p-3.5 rounded-xl">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-white">Evaluación Docente</span>
            <span class="text-xs font-mono font-bold text-slate-300">Hasta 2.500 pts</span>
          </div>
          <p class="text-[11px] text-slate-500 leading-relaxed">
            Promedio de 2 docentes sobre 100 puntos: Puntos = Nota × 25.
          </p>
        </div>

        <div class="bg-slate-950 border border-slate-900 p-3.5 rounded-xl">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-white">Obra Favorita</span>
            <span class="text-xs font-mono font-bold text-slate-300">500 pts</span>
          </div>
          <p class="text-[11px] text-slate-500 leading-relaxed">
            Asignados automáticamente a la obra que obtenga la mejor nota de las tres.
          </p>
        </div>
      </div>

      <!-- CARDS POR ALIANZA (MINIMALISTAS) -->
      <div class="space-y-4">
        ${challenges.map(item => {
          const st = status[item.key] || {};
          const rubric = rubrics[item.rubricKey] || {};
          const statusText = st.evaluated ? 'Evaluada' : (st.delivered ? 'Entregada • En Evaluación' : 'Sin Entregar');
          const statusBadge = st.evaluated 
            ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/40' 
            : (st.delivered ? 'text-blue-400 bg-blue-950/40 border-blue-900/40' : 'text-slate-500 bg-slate-900/40 border-slate-800/40');

          return `
            <div class="bg-slate-950 border ${item.color} rounded-xl p-5 hover:border-slate-800 transition">
              <!-- Titular y Alianza -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3 mb-4">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="w-2 h-2 rounded-full ${item.dot}"></span>
                    <span class="text-xs font-mono font-bold uppercase ${item.text}">Alianza ${item.alliance}</span>
                    <span class="text-slate-600">•</span>
                    <span class="text-xs text-slate-500">${item.carrera}</span>
                  </div>
                  <h3 class="text-lg font-bold font-heading text-white">${item.title}</h3>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded border ${statusBadge}">
                    ${statusText}
                  </span>
                </div>
              </div>

              <!-- Contenido en 2 columnas -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
                <!-- Requisitos -->
                <div>
                  <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-2">Requisitos y Entregables:</span>
                  <p class="text-slate-400 leading-relaxed mb-3">${item.desc}</p>
                  <ul class="space-y-1.5 text-slate-400">
                    ${item.requirements.map(r => `
                      <li class="flex items-start gap-2">
                        <span class="w-1 h-1 rounded-full bg-slate-600 mt-2 shrink-0"></span>
                        <span>${r}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>

                <!-- Criterios de Evaluación Docente -->
                <div>
                  <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-2">Rúbrica de Evaluación Docente:</span>
                  <div class="space-y-1.5 font-mono">
                    ${(rubric.criterios || []).map(c => `
                      <div class="bg-slate-900/40 border border-slate-900 p-2 rounded-lg flex items-center justify-between">
                        <div class="min-w-0 pr-2">
                          <span class="text-white font-medium block truncate">${c.nombre}</span>
                          <span class="text-[10px] text-slate-500 font-sans block truncate">${c.desc}</span>
                        </div>
                        <span class="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                          ${c.peso} pts
                        </span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
// ==========================================
// ==========================================
// 6. MI ALIANZA & NÓMINA OFICIAL (281 ESTUDIANTES)
// ==========================================

let allStudentsByAlliance = null;
let currentAllianceFilter = 'all';

async function loadAllStudentsByAlliance() {
  if (allStudentsByAlliance) return allStudentsByAlliance;

  try {
    const res = await fetch('/api/students/by-alliance');
    if (res.ok) {
      allStudentsByAlliance = await res.json();
    }
  } catch (err) {
    console.error('Error cargando estudiantes por alianza:', err);
  }
  return allStudentsByAlliance;
}

function renderMiAlianza() {
  // Asegurar carga de estudiantes si no están en memoria
  if (!allStudentsByAlliance) {
    loadAllStudentsByAlliance().then(() => {
      renderAlliancesRoster();
    });
  }

  return `
    <div class="max-w-6xl mx-auto space-y-8">
      
      <!-- ======================================================== -->
      <!-- 1. HEADER SYNTH-TECH / ESPORTS: MI ALIANZA               -->
      <!-- ======================================================== -->
      <div class="text-center space-y-2 relative">
        <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0A1333] border border-[#2D46B9] shadow-inner text-[11px] font-display font-bold uppercase tracking-wider text-[#7F9CF5]">
          <span class="w-2 h-2 rounded-full bg-[#E6194B] animate-pulse"></span>
          <span>Padrón Oficial • 281 Estudiantes Registrados</span>
        </div>

        <h2 class="esport-title text-3xl sm:text-5xl font-black italic tracking-tight text-white uppercase pt-1">
          MI ALIANZA & ESCUADRONES 2026
        </h2>

        <p class="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-body">
          Identifica tu escuadrón, conoce a tu mascota oficial y prepárate para disputar el torneo de la Semana de las Carreras.
        </p>

        <!-- Cinta Skew Decorativa -->
        <div class="pt-1 flex items-center justify-center gap-2">
          <span class="text-[#E6194B] font-display font-black text-base select-none">= =</span>
          <span class="px-4 py-1 bg-[#E6194B] text-white font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-[#E6194B]/40" style="transform: var(--banner-skew);">
            <span style="display:inline-block; transform: skewX(15deg);">¡CONOCE TUS COLORES Y DEFIENDE TU ALIANZA!</span>
          </span>
          <span class="text-[#E6194B] font-display font-black text-base select-none">= =</span>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- 2. TARJETAS DE ACCESO RÁPIDO A ESCUADRONES               -->
      <!-- ======================================================== -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
        
        <!-- CARD 1: ALIANZA TERROR -->
        <div onclick="setAllianceFilter('Terror')" class="cursor-pointer group relative bg-gradient-to-b from-[#0A1333] via-[#050C24] to-[#0A1333] border-2 border-[#E6194B]/70 hover:border-[#E6194B] rounded-2xl p-4 sm:p-5 shadow-xl transition duration-300 hover:scale-[1.02] flex flex-col justify-between overflow-hidden glow-crimson">
          <div class="absolute -top-12 -right-12 w-32 h-32 bg-[#E6194B]/15 blur-2xl rounded-full pointer-events-none"></div>
          
          <div>
            <div class="flex items-center justify-between gap-2 mb-2.5">
              <span class="px-3 py-1 rounded-md bg-[#E6194B] text-white font-display font-black text-xs uppercase tracking-wider shadow-md shadow-[#E6194B]/50" style="transform: var(--banner-skew);">
                <span style="display:inline-block; transform: skewX(15deg);">ALIANZA TERROR</span>
              </span>
              <span class="text-xs font-mono font-bold text-slate-300 bg-[#050C24] border border-[#E6194B]/50 px-2.5 py-0.5 rounded-full">
                126 Alumnos
              </span>
            </div>

            <h3 class="text-lg font-black font-display text-white tracking-tight mt-1">
              Informática & Analista
            </h3>
            <p class="text-xs text-slate-300 font-mono mt-1">
              Desafío: <strong class="text-[#E6194B]">Videojuego con IA</strong>
            </p>
          </div>

          <div class="mt-4 pt-3 border-t border-[#142252] flex items-center justify-between text-xs font-display font-bold">
            <span class="text-slate-400 group-hover:text-white transition">Explorar Escuadrón</span>
            <span class="text-[#E6194B] flex items-center gap-1 group-hover:translate-x-1 transition">
              <span>Ver Lista ↓</span>
              <i data-lucide="arrow-down" class="w-4 h-4"></i>
            </span>
          </div>
        </div>

        <!-- CARD 2: ALIANZA SHOOTER -->
        <div onclick="setAllianceFilter('Shooter')" class="cursor-pointer group relative bg-gradient-to-b from-[#0A1333] via-[#050C24] to-[#0A1333] border-2 border-[#2D46B9]/70 hover:border-[#2D46B9] rounded-2xl p-4 sm:p-5 shadow-xl transition duration-300 hover:scale-[1.02] flex flex-col justify-between overflow-hidden glow-electric">
          <div class="absolute -top-12 -right-12 w-32 h-32 bg-[#2D46B9]/20 blur-2xl rounded-full pointer-events-none"></div>

          <div>
            <div class="flex items-center justify-between gap-2 mb-2.5">
              <span class="px-3 py-1 rounded-md bg-[#2D46B9] text-white font-display font-black text-xs uppercase tracking-wider shadow-md shadow-[#2D46B9]/50" style="transform: var(--banner-skew);">
                <span style="display:inline-block; transform: skewX(15deg);">ALIANZA SHOOTER</span>
              </span>
              <span class="text-xs font-mono font-bold text-slate-300 bg-[#050C24] border border-[#2D46B9]/50 px-2.5 py-0.5 rounded-full">
                126 Alumnos
              </span>
            </div>

            <h3 class="text-lg font-black font-display text-white tracking-tight mt-1">
              Informática & Analista
            </h3>
            <p class="text-xs text-slate-300 font-mono mt-1">
              Desafío: <strong class="text-[#7F9CF5]">Asistente con IA</strong>
            </p>
          </div>

          <div class="mt-4 pt-3 border-t border-[#142252] flex items-center justify-between text-xs font-display font-bold">
            <span class="text-slate-400 group-hover:text-white transition">Explorar Escuadrón</span>
            <span class="text-[#7F9CF5] flex items-center gap-1 group-hover:translate-x-1 transition">
              <span>Ver Lista ↓</span>
              <i data-lucide="arrow-down" class="w-4 h-4"></i>
            </span>
          </div>
        </div>

        <!-- CARD 3: ALIANZA ACTION -->
        <div onclick="setAllianceFilter('Action')" class="cursor-pointer group relative bg-gradient-to-b from-[#0A1333] via-[#050C24] to-[#0A1333] border-2 border-[#7F9CF5]/60 hover:border-[#7F9CF5] rounded-2xl p-4 sm:p-5 shadow-xl transition duration-300 hover:scale-[1.02] flex flex-col justify-between overflow-hidden glow-rim">
          <div class="absolute -top-12 -right-12 w-32 h-32 bg-[#7F9CF5]/15 blur-2xl rounded-full pointer-events-none"></div>

          <div>
            <div class="flex items-center justify-between gap-2 mb-2.5">
              <span class="px-3 py-1 rounded-md bg-[#059669] text-white font-display font-black text-xs uppercase tracking-wider shadow-md shadow-[#059669]/50" style="transform: var(--banner-skew);">
                <span style="display:inline-block; transform: skewX(15deg);">ALIANZA ACTION</span>
              </span>
              <span class="text-xs font-mono font-bold text-slate-300 bg-[#050C24] border border-[#7F9CF5]/50 px-2.5 py-0.5 rounded-full">
                29 Alumnos
              </span>
            </div>

            <h3 class="text-lg font-black font-display text-white tracking-tight mt-1">
              Diseño e Industria Digital
            </h3>
            <p class="text-xs text-slate-300 font-mono mt-1">
              Desafío: <strong class="text-emerald-400">Collage / Identidad Visual</strong>
            </p>
          </div>

          <div class="mt-4 pt-3 border-t border-[#142252] flex items-center justify-between text-xs font-display font-bold">
            <span class="text-slate-400 group-hover:text-white transition">Explorar Escuadrón</span>
            <span class="text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition">
              <span>Ver Lista ↓</span>
              <i data-lucide="arrow-down" class="w-4 h-4"></i>
            </span>
          </div>
        </div>

      </div>

      <!-- ======================================================== -->
      <!-- 3. BUSCADOR DE JUGADORES ESPORTS                         -->
      <!-- ======================================================== -->
      <div class="bg-gradient-to-r from-[#0A1333] via-[#050C24] to-[#0A1333] border-2 border-[#2D46B9] rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden glow-electric">
        <div class="max-w-2xl mx-auto space-y-4">
          <div class="text-center space-y-1">
            <span class="text-[10px] font-display font-black uppercase tracking-widest text-[#E6194B]">
              /// VERIFICACIÓN DE ALUMNO
            </span>
            <h3 class="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
              Consulta tu Alianza Oficial & Carnet de Competidor
            </h3>
            <p class="text-xs text-slate-300">
              Ingresa tu nombre, apellido o RUT para desplegar tu tarjeta oficial de juego.
            </p>
          </div>

          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#E6194B]">
              <i data-lucide="search" class="w-5 h-5"></i>
            </div>
            <input 
              type="text" 
              id="student-search-input" 
              oninput="handleStudentSearch(this.value)"
              placeholder="Escribe tu nombre o apellido (ej. Sebastián, Aguilera...)" 
              class="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-[#050C24] border-2 border-[#142252] focus:border-[#E6194B] text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner font-sans font-medium"
            />
            <button 
              id="clear-search-btn"
              onclick="clearStudentSearch()" 
              class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white hidden transition"
              title="Limpiar búsqueda"
            >
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
        </div>

        <!-- CONTENEDOR DE RESULTADOS DE BÚSQUEDA PERSONAL (TARJETA DESTACADA) -->
        <div id="search-results-box" class="max-w-3xl mx-auto mt-6 space-y-4">
          <!-- Inyectado dinámicamente cuando el usuario escribe -->
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- 4. SECCIÓN DEL PADRÓN COMPLETO & FILTROS                -->
      <!-- ======================================================== -->
      <div class="pt-4 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#142252] pb-4">
          <div>
            <h3 class="text-lg font-black font-display text-white flex items-center gap-2">
              <i data-lucide="users" class="w-5 h-5 text-[#E6194B]"></i>
              <span>Nómina de Participantes por Alianza</span>
            </h3>
            <span class="text-xs text-slate-400">Padrón oficial distribuido equitativamente</span>
          </div>

          <!-- Filtro de Pestañas / Alianzas -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 font-display text-xs">
            <button 
              onclick="setAllianceFilter('all')" 
              id="filter-btn-all" 
              class="alliance-filter-btn px-4 py-2 rounded-xl text-xs font-bold ${currentAllianceFilter === 'all' ? 'bg-[#2D46B9] text-white shadow-lg shadow-[#2D46B9]/40 border border-white/30' : 'text-slate-300 hover:text-white bg-[#0A1333] border border-[#142252]'} transition"
            >
              Todas (281)
            </button>
            <button 
              onclick="setAllianceFilter('Terror')" 
              id="filter-btn-Terror" 
              class="alliance-filter-btn px-4 py-2 rounded-xl text-xs font-bold ${currentAllianceFilter === 'Terror' ? 'bg-[#E6194B] text-white shadow-lg shadow-[#E6194B]/40 border border-white/30' : 'text-slate-300 hover:text-white bg-[#0A1333] border border-[#142252]'} transition flex items-center gap-1.5"
            >
              <span class="w-2 h-2 rounded-full bg-white"></span>
              <span>Terror (126)</span>
            </button>
            <button 
              onclick="setAllianceFilter('Shooter')" 
              id="filter-btn-Shooter" 
              class="alliance-filter-btn px-4 py-2 rounded-xl text-xs font-bold ${currentAllianceFilter === 'Shooter' ? 'bg-[#2D46B9] text-white shadow-lg shadow-[#2D46B9]/40 border border-white/30' : 'text-slate-300 hover:text-white bg-[#0A1333] border border-[#142252]'} transition flex items-center gap-1.5"
            >
              <span class="w-2 h-2 rounded-full bg-white"></span>
              <span>Shooter (126)</span>
            </button>
            <button 
              onclick="setAllianceFilter('Action')" 
              id="filter-btn-Action" 
              class="alliance-filter-btn px-4 py-2 rounded-xl text-xs font-bold ${currentAllianceFilter === 'Action' ? 'bg-[#059669] text-white shadow-lg shadow-[#059669]/40 border border-white/30' : 'text-slate-300 hover:text-white bg-[#0A1333] border border-[#142252]'} transition flex items-center gap-1.5"
            >
              <span class="w-2 h-2 rounded-full bg-white"></span>
              <span>Action (29)</span>
            </button>
          </div>
        </div>

        <!-- CONTENEDOR DEL PADRÓN COMPLETO -->
        <div id="all-alliances-roster-box">
          ${renderAlliancesRosterContent()}
        </div>
      </div>

    </div>
  `;
}

function setAllianceFilter(filter) {
  currentAllianceFilter = filter;
  renderAlliancesRoster();
}

function renderAlliancesRoster() {
  const container = document.getElementById('all-alliances-roster-box');
  if (container) {
    container.innerHTML = renderAlliancesRosterContent();
    lucide.createIcons();
  }

  // Actualizar estilos de los botones de filtro
  document.querySelectorAll('.alliance-filter-btn').forEach(btn => {
    btn.className = 'alliance-filter-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-[#0A1333] border border-[#142252] transition';
  });

  const activeBtn = document.getElementById(`filter-btn-${currentAllianceFilter}`);
  if (activeBtn) {
    if (currentAllianceFilter === 'all') {
      activeBtn.className = 'alliance-filter-btn px-4 py-2 rounded-xl text-xs font-bold bg-[#2D46B9] text-white shadow-lg shadow-[#2D46B9]/40 border border-white/30 transition';
    } else if (currentAllianceFilter === 'Terror') {
      activeBtn.className = 'alliance-filter-btn px-4 py-2 rounded-xl text-xs font-bold bg-[#E6194B] text-white shadow-lg shadow-[#E6194B]/40 border border-white/30 transition flex items-center gap-1.5';
    } else if (currentAllianceFilter === 'Shooter') {
      activeBtn.className = 'alliance-filter-btn px-4 py-2 rounded-xl text-xs font-bold bg-[#2D46B9] text-white shadow-lg shadow-[#2D46B9]/40 border border-white/30 transition flex items-center gap-1.5';
    } else if (currentAllianceFilter === 'Action') {
      activeBtn.className = 'alliance-filter-btn px-4 py-2 rounded-xl text-xs font-bold bg-[#059669] text-white shadow-lg shadow-[#059669]/40 border border-white/30 transition flex items-center gap-1.5';
    }
  }
}

function renderAlliancesRosterContent() {
  if (!allStudentsByAlliance) {
    return `
      <div class="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-2 font-mono">
        <span class="w-4 h-4 border-2 border-[#E6194B] border-t-transparent rounded-full animate-spin"></span>
        <span>Cargando padrón oficial de las 3 alianzas...</span>
      </div>
    `;
  }

  const alInfo = {
    Terror: {
      name: 'Alianza Terror',
      mascotImg: '/img/mascota-terror.png',
      carrera: 'Informática (Ingeniería y Analista)',
      desafio: 'Videojuego con IA (Godot/Unity)',
      themeColor: '#E6194B',
      glow: 'glow-crimson',
      shadow: 'rgba(230,25,75,0.7)',
      dotColor: 'bg-[#E6194B]',
      badgeColor: 'text-[#E6194B] bg-[#E6194B]/10 border-[#E6194B]/40',
      borderColor: 'border-[#E6194B]/70 hover:border-[#E6194B]',
      hoverText: 'hover:border-[#E6194B]/70 group-hover:text-[#E6194B]',
      total: allStudentsByAlliance.Terror?.length || 126
    },
    Shooter: {
      name: 'Alianza Shooter',
      mascotImg: '/img/mascota-shooter.png',
      carrera: 'Informática (Ingeniería y Analista)',
      desafio: 'Asistente con IA (Local/API)',
      themeColor: '#2D46B9',
      glow: 'glow-electric',
      shadow: 'rgba(45,70,185,0.7)',
      dotColor: 'bg-[#2D46B9]',
      badgeColor: 'text-[#7F9CF5] bg-[#2D46B9]/15 border-[#2D46B9]/40',
      borderColor: 'border-[#2D46B9]/70 hover:border-[#2D46B9]',
      hoverText: 'hover:border-[#2D46B9]/70 group-hover:text-[#7F9CF5]',
      total: allStudentsByAlliance.Shooter?.length || 126
    },
    Action: {
      name: 'Alianza Action',
      mascotImg: '/img/mascota-action.png',
      carrera: 'Diseño e Industria Digital',
      desafio: 'Collage Digital / Identidad Visual',
      themeColor: '#059669',
      glow: 'glow-rim',
      shadow: 'rgba(5,150,105,0.7)',
      dotColor: 'bg-[#059669]',
      badgeColor: 'text-emerald-400 bg-[#059669]/15 border-[#059669]/40',
      borderColor: 'border-[#059669]/70 hover:border-[#059669]',
      hoverText: 'hover:border-[#059669]/70 group-hover:text-emerald-400',
      total: allStudentsByAlliance.Action?.length || 29
    }
  };

  // Si se seleccionó una sola alianza, mostrar vista expandida de esa alianza con la mascota PNG
  if (currentAllianceFilter !== 'all') {
    const alKey = currentAllianceFilter;
    const info = alInfo[alKey];
    const list = allStudentsByAlliance[alKey] || [];
    const pts = (appData.alliances?.[alKey]?.points?.total || 0).toLocaleString('es-CL');

    return `
      <div class="bg-gradient-to-b from-[#0A1333] via-[#050C24] to-[#0A1333] border-2 ${info.borderColor} rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden ${info.glow}">
        
        <!-- Resplandor de fondo -->
        <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-80 h-48 blur-3xl rounded-full opacity-30 pointer-events-none" style="background-color: ${info.themeColor};"></div>

        <!-- Header de la Alianza con Mascota PNG Grande y Transparente -->
        <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-[#142252] pb-6">
          <div class="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <!-- Mascota Grande Transparente (Sin caja ni borde de icono) -->
            <div class="h-44 sm:h-52 w-44 sm:w-52 shrink-0 flex items-center justify-center">
              <img 
                src="${info.mascotImg}" 
                alt="${info.name}" 
                class="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_30px_${info.shadow}] hover:scale-105 transition duration-300"
              />
            </div>
            <div>
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <span class="px-4 py-1 rounded-md text-white font-display font-black text-sm uppercase tracking-wider shadow-lg" style="background-color: ${info.themeColor}; transform: var(--banner-skew);">
                  <span style="display:inline-block; transform: skewX(15deg);">${info.name}</span>
                </span>
                <span class="text-xs font-display font-black px-3 py-1 rounded-md border ${info.badgeColor}">
                  ${list.length} Estudiantes
                </span>
              </div>
              <h4 class="text-xl sm:text-2xl font-black font-display text-white tracking-tight">${info.carrera}</h4>
              <p class="text-xs sm:text-sm text-slate-300 mt-1 font-mono">
                Desafío Oficial: <strong class="text-white font-semibold">${info.desafio}</strong>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <div class="bg-[#050C24] px-5 py-3 rounded-2xl border border-[#142252] text-center sm:text-right shadow-inner">
              <span class="text-[10px] text-slate-400 uppercase font-display block">Posición Oficial</span>
              <span class="text-xl font-black font-display text-white" style="color: ${info.themeColor};">#${appData.alliances?.[alKey]?.rank || '-'} Lugar</span>
            </div>
          </div>
        </div>

        <!-- Grid de Estudiantes en 2 a 3 Columnas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
          ${list.map((s, idx) => `
            <div 
              onclick="selectStudentForSearch('${s.name.replace(/'/g, "\\'")}')" 
              class="p-3 rounded-2xl bg-[#050C24]/80 border border-[#142252] hover:bg-[#0E1E48] ${info.hoverText} transition cursor-pointer flex items-center justify-between group"
            >
              <div class="min-w-0 flex-1 pr-2">
                <div class="flex items-center gap-2">
                  <span class="text-[11px] font-mono text-slate-500 font-bold shrink-0">${idx + 1}.</span>
                  <span class="text-xs sm:text-sm font-semibold text-slate-200 truncate group-hover:text-white">${s.name}</span>
                </div>
                <span class="text-[10px] text-slate-400 block truncate pl-5 mt-0.5">${s.carrera}</span>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-slate-500 group-hover:text-white shrink-0 transition"></i>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Vista "Todas las Alianzas": 3 columnas lado a lado en escritorio, cada una con su mascota grande y transparente arriba
  const alliancesKeys = ['Terror', 'Shooter', 'Action'];

  return `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      ${alliancesKeys.map(alKey => {
        const info = alInfo[alKey];
        const list = allStudentsByAlliance[alKey] || [];
        const pts = (appData.alliances?.[alKey]?.points?.total || 0).toLocaleString('es-CL');

        return `
          <div class="relative bg-gradient-to-b from-[#0A1333] via-[#050C24] to-[#0A1333] border-2 ${info.borderColor} rounded-3xl p-5 shadow-2xl flex flex-col transition hover:scale-[1.01] duration-300 overflow-hidden ${info.glow}">
            
            <!-- Resplandor de fondo superior -->
            <div class="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 blur-3xl rounded-full opacity-35 pointer-events-none" style="background-color: ${info.themeColor};"></div>

            <!-- MASCOTA GRANDE Y TRANSPARENTE ARRIBA DE LA TABLA -->
            <div class="relative z-10 -mt-2 mb-3 flex items-center justify-center h-48 sm:h-56 group cursor-pointer" onclick="setAllianceFilter('${alKey}')" title="Ver sólo Alianza ${info.name}">
              <img 
                src="${info.mascotImg}" 
                alt="${info.name}" 
                class="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_25px_${info.shadow}] group-hover:scale-105 transition duration-300"
              />
            </div>

            <!-- Header de la Alianza con Ribbon e Información Oficial -->
            <div class="border-b border-[#142252] pb-3 mb-3 relative z-10 text-center">
              <div class="flex items-center justify-center gap-2 mb-1.5">
                <span class="px-3.5 py-1 rounded-md text-white font-display font-black text-xs uppercase tracking-wider shadow-md" style="background-color: ${info.themeColor}; transform: var(--banner-skew);">
                  <span style="display:inline-block; transform: skewX(15deg);">${info.name}</span>
                </span>
                <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${info.badgeColor}">
                  ${list.length} alumnos
                </span>
              </div>
              
              <p class="text-[11px] text-slate-300 font-display font-bold leading-tight mt-1">
                ${info.carrera}
              </p>
              
              <div class="mt-2.5 text-[10px] text-slate-300 font-mono bg-[#050C24] p-2 rounded-xl border border-[#142252] flex items-center justify-between shadow-inner">
                <span class="truncate pr-1">Desafío: ${info.desafio}</span>
                <span class="text-white font-bold shrink-0" style="color: ${info.themeColor};">#${appData.alliances?.[alKey]?.rank || '-'} Lugar</span>
              </div>
            </div>

            <!-- Lista de Estudiantes con Scrollbar Elegante -->
            <div class="space-y-1.5 max-h-[500px] overflow-y-auto pr-1.5 custom-scrollbar relative z-10">
              ${list.map((s, idx) => `
                <div 
                  onclick="selectStudentForSearch('${s.name.replace(/'/g, "\\'")}')" 
                  class="p-2.5 rounded-xl bg-[#050C24]/70 border border-[#142252] hover:bg-[#0E1E48] ${info.hoverText} transition cursor-pointer flex items-center justify-between text-xs group"
                  title="Clic para ver ficha oficial de ${s.name}"
                >
                  <div class="min-w-0 flex-1 pr-2">
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] font-mono text-slate-500 font-bold shrink-0">${idx + 1}.</span>
                      <span class="text-xs font-medium text-slate-300 truncate group-hover:text-white">${s.name}</span>
                    </div>
                    <span class="text-[10px] text-slate-400 block truncate pl-5">${s.carrera}</span>
                  </div>
                  <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-500 group-hover:text-white shrink-0 transition"></i>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function selectStudentForSearch(name) {
  const input = document.getElementById('student-search-input');
  if (input) {
    input.value = name;
    handleStudentSearch(name);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }
}

function clearStudentSearch() {
  const input = document.getElementById('student-search-input');
  if (input) input.value = '';
  handleStudentSearch('');
}

let studentSearchDebounce = null;

function handleStudentSearch(val) {
  clearTimeout(studentSearchDebounce);
  const box = document.getElementById('search-results-box');
  const clearBtn = document.getElementById('clear-search-btn');

  const query = val.trim();

  if (clearBtn) {
    if (query.length > 0) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
  }

  if (!box) return;

  if (query.length < 2) {
    box.innerHTML = '';
    return;
  }

  studentSearchDebounce = setTimeout(async () => {
    box.innerHTML = `
      <div class="text-center py-6 text-slate-400 text-xs flex items-center justify-center gap-2 font-display font-bold">
        <span class="w-4 h-4 border-2 border-[#E6194B] border-t-transparent rounded-full animate-spin"></span>
        <span>Consultando credenciales en el padrón oficial...</span>
      </div>
    `;

    try {
      let list = [];
      try {
        const res = await fetch(`/api/students/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          list = await res.json();
        }
      } catch (e) {
        console.warn('Error en búsqueda de estudiantes:', e);
      }

      if (list.length === 0) {
        box.innerHTML = `
          <div class="bg-[#050C24] border-2 border-[#142252] rounded-2xl p-6 text-center text-slate-300 text-xs font-display">
            <i data-lucide="alert-circle" class="w-8 h-8 text-[#E6194B] mx-auto mb-2"></i>
            No se encontró ningún estudiante con "<strong>${query}</strong>". Verifica que el nombre o apellido esté bien escrito o consulta en la mesa de control en cancha.
          </div>
        `;
        lucide.createIcons();
        return;
      }

      box.innerHTML = list.map(s => {
        const isTerror = s.alliance === 'Terror';
        const isShooter = s.alliance === 'Shooter';
        const isAction = s.alliance === 'Action';
        
        const mascotImg = isTerror 
          ? '/img/mascota-terror.png' 
          : (isShooter ? '/img/mascota-shooter.png' : '/img/mascota-action.png');
          
        const themeColor = isTerror 
          ? '#E6194B' 
          : (isShooter ? '#2D46B9' : '#059669');

        const glowClass = isTerror 
          ? 'glow-crimson' 
          : (isShooter ? 'glow-electric' : 'glow-rim');
          
        const ribbonBg = isTerror 
          ? 'bg-[#E6194B]' 
          : (isShooter ? 'bg-[#2D46B9]' : 'bg-[#059669]');

        const alData = appData.alliances?.[s.alliance] || {};
        const pts = (alData.points?.total || 0).toLocaleString('es-CL');
        const rank = alData.rank || '-';
        const totalAlumnos = isTerror ? 126 : (isShooter ? 126 : 29);
        const desafio = alData.desafio || (isTerror ? 'Videojuego con IA' : (isShooter ? 'Asistente con IA' : 'Collage Digital / Identidad Visual'));

        return `
          <!-- CARNET DE COMPETIDOR ESPORTS CON MASCOTA PNG -->
          <div class="relative bg-gradient-to-r from-[#0A1333] via-[#050C24] to-[#0A1333] border-2 rounded-3xl p-5 sm:p-6 shadow-2xl transition overflow-hidden ${glowClass}" style="border-color: ${themeColor};">
            
            <!-- Resplandor de fondo temático -->
            <div class="absolute -top-12 -left-12 w-48 h-48 blur-3xl rounded-full opacity-30 pointer-events-none" style="background-color: ${themeColor};"></div>

            <div class="relative z-10 flex flex-col md:flex-row items-center gap-6">
              
              <!-- COLUMNA 1: MASCOTA OFICIAL DE LA ALIANZA -->
              <div class="w-full md:w-44 flex flex-col items-center shrink-0">
                <div class="relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl bg-[#050C24] border-2 border-white/20 p-2 flex items-center justify-center shadow-2xl" style="box-shadow: 0 0 25px ${themeColor}40;">
                  <img 
                    src="${mascotImg}" 
                    alt="Mascota ${s.alliance}" 
                    class="w-full h-full object-contain filter drop-shadow-[0_8px_16px_${themeColor}80] hover:scale-105 transition duration-300"
                  />
                </div>
                <span class="mt-2 text-[10px] font-display font-black tracking-widest text-slate-300 uppercase block">
                  Mascota de Alianza
                </span>
              </div>

              <!-- COLUMNA 2: FICHA OFICIAL DEL ALUMNO -->
              <div class="flex-1 w-full space-y-3">
                
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#142252] pb-3">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="px-3 py-0.5 rounded ${ribbonBg} text-white font-display font-black text-xs uppercase tracking-wider" style="transform: var(--banner-skew);">
                        <span style="display:inline-block; transform: skewX(15deg);">ALIANZA ${s.alliance.toUpperCase()}</span>
                      </span>
                      <span class="text-xs text-slate-400 font-mono hidden sm:inline">• ${s.carrera}</span>
                    </div>
                    <h3 class="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
                      ${s.name}
                    </h3>
                    <span class="text-xs text-slate-400 font-mono block sm:hidden mt-0.5">${s.carrera}</span>
                  </div>

                  <div class="text-left sm:text-right shrink-0 bg-[#050C24] px-3.5 py-1.5 rounded-xl border border-[#142252]">
                    <span class="text-[10px] font-display font-bold uppercase text-slate-400 block">Posición en Cancha</span>
                    <span class="text-lg font-black font-display text-white" style="color: ${themeColor};">#${rank} Lugar</span>
                  </div>
                </div>

                <!-- Datos Clave en Grid de 3 Columnas -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  <div class="bg-[#050C24] border border-[#142252] p-2.5 rounded-xl">
                    <span class="text-[10px] text-slate-400 uppercase font-display block">Escuadrón</span>
                    <span class="text-white font-bold mt-0.5 block">${totalAlumnos} integrantes</span>
                  </div>

                  <div class="bg-[#050C24] border border-[#142252] p-2.5 rounded-xl sm:col-span-2">
                    <span class="text-[10px] text-slate-400 uppercase font-display block">Desafío Creativo Asignado</span>
                    <span class="text-slate-200 font-semibold truncate block mt-0.5">${desafio}</span>
                  </div>
                </div>

                <!-- Footer del Carnet -->
                <div class="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span class="text-[11px] font-display font-bold text-slate-300 flex items-center gap-1.5">
                    <span class="text-[#E6194B] font-black">=</span>
                    <span>¡Viste la camiseta o accesorios de tu alianza el 19 de Noviembre!</span>
                  </span>
                  <button onclick="setAllianceFilter('${s.alliance}')" class="px-3 py-1.5 rounded-xl bg-[#0E1E48] hover:bg-[#142252] text-white border border-[#2D46B9] font-display font-bold text-xs transition flex items-center justify-center gap-1.5 shrink-0">
                    <span>Ver compañeros de alianza</span>
                    <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                  </button>
                </div>

              </div>

            </div>

          </div>
        `;
      }).join('');
      lucide.createIcons();
    } catch (err) {
      box.innerHTML = `<div class="text-xs text-[#E6194B] text-center font-display font-bold py-4">Error al consultar el padrón oficial</div>`;
    }
  }, 250);
}

// ==========================================
// ==========================================
// ==========================================
// 8. CÓMO SE GANAN LOS PUNTOS (DISEÑO MINIMALISTA Y SOBRIO)
// ==========================================
function renderReglas() {
  return `
    <div class="space-y-6 max-w-4xl mx-auto select-none">
      
      <!-- HEADER MINIMALISTA -->
      <div class="border-b border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span class="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
            Reglamento Oficial • Explicación en 1 minuto
          </span>
          <h2 class="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">
            Cómo se ganan los puntos
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Estructura transparente del sistema de puntuación para leer rápido desde el celular.
          </p>
        </div>
        <button 
          onclick="navigate('inicio')" 
          class="self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5"
        >
          <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
          <span>Volver</span>
        </button>
      </div>

      <!-- 1. LA IDEA EN UNA FRASE (ARRIBA, GRANDE) -->
      <div class="bg-slate-950 border border-slate-900 rounded-2xl p-5 sm:p-6 text-center shadow-sm">
        <span class="text-[10px] font-mono uppercase tracking-widest text-slate-500 block mb-2">
          Principio General
        </span>
        <h3 class="text-lg sm:text-2xl font-bold font-heading text-white tracking-tight leading-snug max-w-2xl mx-auto">
          “Cada actividad entrega puntos a tu alianza. La alianza con más puntos al final gana el premio.”
        </h3>
      </div>

      <!-- 2. LOS NÚMEROS CLAVE (TARJETAS) -->
      <div>
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-2">
          Números Clave
        </span>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div class="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span class="text-[10px] font-mono text-slate-500 uppercase block">Máximo Día 19</span>
              <span class="text-2xl font-mono font-bold text-white mt-1 block">25.000 pts</span>
            </div>
            <span class="text-[11px] text-slate-400 mt-2 block leading-relaxed">
              Tope acumulable por alianza en las actividades de cancha y salón del jueves 19.
            </span>
          </div>

          <div class="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span class="text-[10px] font-mono text-slate-500 uppercase block">Extras</span>
              <span class="text-2xl font-mono font-bold text-white mt-1 block">+7.000 pts</span>
            </div>
            <span class="text-[11px] text-slate-400 mt-2 block leading-relaxed">
              Hasta 3.000 por actividades sorpresa y hasta 4.000 por la Copa Tarreo del viernes.
            </span>
          </div>

          <div class="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span class="text-[10px] font-mono text-slate-500 uppercase block">Premios Académicos</span>
              <div class="mt-1 space-y-1 font-mono text-xs">
                <div class="flex justify-between items-center"><span class="text-slate-300 font-medium">1ª Alianza:</span><span class="text-white font-bold">+1,0 nota</span></div>
                <div class="flex justify-between items-center"><span class="text-slate-400">2ª Alianza:</span><span class="text-slate-300 font-bold">+0,5 nota</span></div>
                <div class="flex justify-between items-center"><span class="text-slate-500">3ª Alianza:</span><span class="text-slate-400 font-bold">+0,3 nota</span></div>
              </div>
            </div>
            <span class="text-[10px] text-slate-500 mt-2 block font-mono">Puntos directos a la nota final.</span>
          </div>

        </div>
      </div>

      <!-- 3. LOS CUATRO TIPOS DE ACTIVIDAD -->
      <div class="space-y-2.5">
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
          Los Cuatro Tipos de Actividad
        </span>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          <!-- Tipo 1 -->
          <div class="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-1.5">
                <span class="w-2 h-2 rounded-full bg-red-500"></span>
                <h4 class="font-bold text-white text-xs uppercase font-mono">1. Por Lugar (La mayoría)</h4>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                La alianza que queda 1ª se lleva el <strong>100%</strong> de los puntos, la 2ª el <strong>60%</strong> y la 3ª el <strong>30%</strong>.
              </p>
              <div class="mt-2.5 p-2 rounded-lg bg-slate-900/50 border border-slate-900 text-[11px] font-mono text-slate-300 space-y-0.5">
                <span class="text-slate-400 block text-[10px]">Ejemplo Baby fútbol (Vale 4.000):</span>
                <div>1ª: 4.000 pts (100%)</div>
                <div>2ª: 2.400 pts (60%)</div>
                <div>3ª: 1.200 pts (30%)</div>
              </div>
            </div>
            <span class="text-[10px] font-mono text-slate-500 mt-2 block">Baby fútbol, Quemadas, Trivia, Retro, Taca-taca, Ping pong, Canto, Barra.</span>
          </div>

          <!-- Tipo 2 -->
          <div class="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-1.5">
                <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                <h4 class="font-bold text-white text-xs uppercase font-mono">2. Por Promedio (Gymkanas)</h4>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                Cada persona suma hasta <strong>8 puntos</strong>: 1 por intentar cada puesto y 1 por resolverlo.
              </p>
              <div class="mt-2.5 p-2 rounded-lg bg-slate-900/50 border border-slate-900 text-[11px] font-mono text-slate-300 space-y-0.5">
                <span class="text-slate-400 block text-[10px]">Fórmula Oficial:</span>
                <div class="text-white font-semibold">3.000 × (Promedio / 8)</div>
                <div class="text-slate-400 text-[10px]">Si el promedio es 6 de 8, ganan 2.250 pts.</div>
              </div>
            </div>
            <span class="text-[10px] font-mono text-slate-500 mt-2 block">Todos los inscritos suman al promedio de su alianza.</span>
          </div>

          <!-- Tipo 3 -->
          <div class="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-1.5">
                <span class="w-2 h-2 rounded-full bg-purple-500"></span>
                <h4 class="font-bold text-white text-xs uppercase font-mono">3. Evaluación Docente (Desafíos IA)</h4>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                Hasta <strong>4.000 puntos</strong> por alianza evaluados por rúbrica técnica de los docentes:
              </p>
              <div class="mt-2.5 p-2 rounded-lg bg-slate-900/50 border border-slate-900 text-[11px] font-mono text-slate-300 space-y-0.5">
                <div><strong>1.000 pts:</strong> Entrega bien y a tiempo.</div>
                <div><strong>Hasta 2.500 pts:</strong> Nota docente (Nota × 25).</div>
                <div><strong>500 pts:</strong> Obra con mejor nota (Favorita).</div>
              </div>
            </div>
            <span class="text-[10px] font-mono text-slate-500 mt-2 block">Evaluación de 2 profesores independientes.</span>
          </div>

          <!-- Tipo 4 -->
          <div class="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <h4 class="font-bold text-white text-xs uppercase font-mono">4. Sorpresa y Copa Tarreo</h4>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                Actividades especiales que se anuncian durante la jornada y competencias nocturnas:
              </p>
              <div class="mt-2.5 p-2 rounded-lg bg-slate-900/50 border border-slate-900 text-[11px] font-mono text-slate-300 space-y-0.5">
                <div><strong>Sorpresas:</strong> Hasta 3.000 pts en cancha.</div>
                <div><strong>Copa Tarreo (Viernes):</strong> Cazatesoros, Just Dance y Mímica (hasta 4.000 pts).</div>
              </div>
            </div>
            <span class="text-[10px] font-mono text-slate-500 mt-2 block">Puntos extras con bases anunciadas en vivo.</span>
          </div>

        </div>
      </div>

      <!-- 4. QUÉ PASA SI HAY EMPATE -->
      <div class="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-2.5">
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
          4. ¿Qué pasa si hay empate?
        </span>
        <p class="text-xs text-slate-300 leading-relaxed">
          Si dos alianzas empatan en el 1º lugar, se suman los porcentajes de los dos puestos y se reparten en partes iguales:
        </p>

        <div class="p-3 bg-slate-900/60 border border-slate-900 rounded-lg text-xs font-mono text-center">
          <span class="text-slate-400 text-[11px] block mb-1">Cálculo: (100% + 60%) ÷ 2</span>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
            <div class="bg-slate-950 p-2 rounded border border-slate-800">
              <span class="text-slate-400 block">Alianza A (Empatada)</span>
              <strong class="text-white text-sm">80%</strong>
              <span class="text-slate-500 block text-[10px]">(ej: 3.200 pts)</span>
            </div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800">
              <span class="text-slate-400 block">Alianza B (Empatada)</span>
              <strong class="text-white text-sm">80%</strong>
              <span class="text-slate-500 block text-[10px]">(ej: 3.200 pts)</span>
            </div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800">
              <span class="text-slate-400 block">Tercera Alianza (3°)</span>
              <strong class="text-slate-300 text-sm">30%</strong>
              <span class="text-slate-500 block text-[10px]">(ej: 1.200 pts)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. QUÉ RESTA PUNTOS -->
      <div class="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-1.5">
        <span class="text-[10px] font-mono uppercase tracking-wider text-red-400 block">
          5. ¿Qué resta puntos? (Sanciones)
        </span>
        <p class="text-xs text-slate-300 leading-relaxed">
          Las sanciones por faltas de respeto o conducta antideportiva descuentan entre <strong>200 y 600 puntos</strong> del total general. Se anotan con motivo y firma en el registro oficial.
        </p>
      </div>

      <!-- 6. UN EJEMPLO COMPLETO -->
      <div class="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500">
            6. Un Ejemplo Completo
          </span>
          <span class="text-[10px] font-mono text-slate-600 uppercase">Valores simulados</span>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-mono">
            <thead class="border-b border-slate-900 text-slate-500 text-[10px] uppercase">
              <tr>
                <th class="py-1.5 px-2">Actividad</th>
                <th class="py-1.5 px-2 text-center text-red-400">Terror</th>
                <th class="py-1.5 px-2 text-center text-blue-400">Shooter</th>
                <th class="py-1.5 px-2 text-center text-emerald-400">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-900/60 text-slate-300">
              <tr>
                <td class="py-1.5 px-2 font-sans text-slate-400">Baby fútbol (4.000)</td>
                <td class="py-1.5 px-2 text-center font-bold text-white">4.000</td>
                <td class="py-1.5 px-2 text-center">2.400</td>
                <td class="py-1.5 px-2 text-center">1.200</td>
              </tr>
              <tr>
                <td class="py-1.5 px-2 font-sans text-slate-400">Gymkanas (3.000)</td>
                <td class="py-1.5 px-2 text-center">2.250</td>
                <td class="py-1.5 px-2 text-center font-bold text-white">2.625</td>
                <td class="py-1.5 px-2 text-center">1.500</td>
              </tr>
              <tr>
                <td class="py-1.5 px-2 font-sans text-slate-400">Desafíos IA (4.000)</td>
                <td class="py-1.5 px-2 text-center">3.500</td>
                <td class="py-1.5 px-2 text-center">3.100</td>
                <td class="py-1.5 px-2 text-center font-bold text-white">3.900</td>
              </tr>
              <tr class="text-red-400/90">
                <td class="py-1.5 px-2 font-sans">Sanción en cancha</td>
                <td class="py-1.5 px-2 text-center text-slate-600">0</td>
                <td class="py-1.5 px-2 text-center font-bold">-300</td>
                <td class="py-1.5 px-2 text-center text-slate-600">0</td>
              </tr>
              <tr class="border-t border-slate-800 font-bold text-white bg-slate-900/30">
                <td class="py-2 px-2 uppercase font-sans text-slate-300">Total</td>
                <td class="py-2 px-2 text-center text-white">9.750</td>
                <td class="py-2 px-2 text-center text-white">7.825</td>
                <td class="py-2 px-2 text-center text-white">6.600</td>
              </tr>
              <tr class="text-[11px] text-slate-400 bg-slate-900/50">
                <td class="py-1 px-2 font-sans">Posición ejemplo:</td>
                <td class="py-1 px-2 text-center font-bold text-slate-200">1° Lugar</td>
                <td class="py-1 px-2 text-center font-bold text-slate-300">2° Lugar</td>
                <td class="py-1 px-2 text-center font-bold text-slate-400">3° Lugar</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 7. PREGUNTAS RÁPIDAS -->
      <div class="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-2.5">
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
          7. Preguntas Rápidas
        </span>

        <div class="space-y-2 text-xs leading-relaxed">
          
          <!-- Cambio de Alianza Actualizado -->
          <div class="p-3 bg-slate-900/30 rounded-lg border border-slate-900 space-y-1">
            <strong class="text-white block font-medium">“¿Se puede cambiar de alianza?”</strong>
            <p class="text-slate-400">
              <strong>Sí</strong>, se puede solicitar cambio de alianza directamente en la mesa de control con la coordinación del evento hasta el <strong>17 de noviembre como plazo máximo</strong>. Luego de esa fecha, las nóminas quedan cerradas y ya no se podrá cambiar bajo ningún motivo.
            </p>
          </div>

          <div class="p-3 bg-slate-900/30 rounded-lg border border-slate-900 space-y-1">
            <strong class="text-white block font-medium">“¿Por qué ganó otra alianza si yo gané mi partido?”</strong>
            <p class="text-slate-400">
              Porque el campeonato suma los puntos de todas las actividades (deportes, salón, creatividad y tarreo), no de un solo partido.
            </p>
          </div>

          <div class="p-3 bg-slate-900/30 rounded-lg border border-slate-900 space-y-1">
            <strong class="text-white block font-medium">“¿Cuándo se sabe el resultado final?”</strong>
            <p class="text-slate-400">
              Entre el 24 y el 26 de noviembre, tras la validación final de la comisión y DAE.
            </p>
          </div>

          <div class="p-3 bg-slate-900/30 rounded-lg border border-slate-900 space-y-1">
            <strong class="text-white block font-medium">“¿Puedo reclamar?”</strong>
            <p class="text-slate-400">
              Sí, la capitanía puede presentar un reclamo en la mesa de control hasta 15 minutos después de finalizada la actividad.
            </p>
          </div>

        </div>
      </div>

    </div>
  `;
}

// 9. PREMIOS Y RESULTADOS (DISEÑO MINIMALISTA & LIMPIO)
// ==========================================
function renderPremios() {
  const al = appData.alliances || {};
  const sorted = ['Terror', 'Shooter', 'Action'].sort((a, b) => (al[b]?.points?.total || 0) - (al[a]?.points?.total || 0));

  const awards = [
    {
      place: '1° Lugar',
      bonus: '+1,0',
      label: 'Punto en Nota Final',
      desc: 'Para todos los integrantes de la alianza ganadora.',
      border: 'border-yellow-950/80',
      text: 'text-yellow-400',
      badge: 'bg-yellow-950/40 text-yellow-400 border-yellow-900/40'
    },
    {
      place: '2° Lugar',
      bonus: '+0,5',
      label: 'Puntos en Nota Final',
      desc: 'Para todos los integrantes de la alianza en segunda posición.',
      border: 'border-slate-800',
      text: 'text-slate-300',
      badge: 'bg-slate-900 text-slate-300 border-slate-800'
    },
    {
      place: '3° Lugar',
      bonus: '+0,3',
      label: 'Puntos en Nota Final',
      desc: 'Para todos los integrantes de la alianza en tercera posición.',
      border: 'border-amber-950/80',
      text: 'text-amber-500',
      badge: 'bg-amber-950/40 text-amber-500 border-amber-900/40'
    }
  ];

  return `
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- HEADER MINIMAL -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-4">
        <div>
          <span class="text-[11px] font-mono uppercase tracking-wider text-slate-500">Incentivo Académico Oficial</span>
          <h2 class="text-2xl font-bold font-heading text-white tracking-tight mt-0.5">Premios & Cuadro de Honor</h2>
        </div>
        <span class="text-xs text-slate-400 font-mono bg-slate-900/60 border border-slate-800/60 px-3 py-1 rounded-lg">
          Anuncio oficial: 24 al 26 de Noviembre
        </span>
      </div>

      <!-- CARDS DE PREMIOS EN NOTA (MINIMALISTAS) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        ${awards.map(item => `
          <div class="bg-slate-950 border ${item.border} rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded border ${item.badge}">
                  ${item.place}
                </span>
                <span class="text-[10px] text-slate-500 font-mono">Bases 2026</span>
              </div>
              <div class="text-3xl sm:text-4xl font-mono font-black ${item.text} tracking-tight">
                ${item.bonus}
              </div>
              <span class="text-xs font-semibold text-white block mt-1">${item.label}</span>
              <p class="text-[11px] text-slate-500 mt-2 leading-relaxed">${item.desc}</p>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- DESGLOSE ACUMULADO POR ALIANZA (TABLA MINIMALISTA) -->
      <div class="bg-slate-950 border border-slate-900 rounded-xl p-5 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-900 pb-3">
          <h3 class="text-base font-bold font-heading text-white">Consolidado General de Puntuaciones</h3>
          <span class="text-[11px] font-mono text-slate-500">Puntos acumulados al momento</span>
        </div>

        <div class="space-y-3">
          ${sorted.map((alKey, idx) => {
            const data = al[alKey] || {};
            const p = data.points || {};
            const isTerror = alKey === 'Terror';
            const isShooter = alKey === 'Shooter';
            const colorClass = isTerror ? 'text-red-400' : (isShooter ? 'text-blue-400' : 'text-emerald-400');
            const dotColor = isTerror ? 'bg-red-500' : (isShooter ? 'bg-blue-500' : 'bg-emerald-500');

            return `
              <div class="bg-slate-900/30 border border-slate-900 rounded-lg p-3.5 space-y-2.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <span class="text-xs font-mono font-bold text-slate-500">#${idx + 1}</span>
                    <span class="w-2 h-2 rounded-full ${dotColor}"></span>
                    <span class="text-sm font-bold text-white font-heading">Alianza ${alKey}</span>
                    <span class="text-xs text-slate-500 font-mono hidden sm:inline">(${data.carrera || ''})</span>
                  </div>
                  <span class="text-lg font-mono font-bold ${colorClass}">
                    ${(p.total || 0).toLocaleString('es-CL')} pts
                  </span>
                </div>

                <!-- Desglose por categoría -->
                <div class="grid grid-cols-4 gap-1.5 text-center text-xs font-mono pt-2 border-t border-slate-900/80">
                  <div class="bg-slate-950/80 border border-slate-900 py-1 rounded">
                    <span class="text-[10px] text-slate-500 block">Día 19</span>
                    <span class="text-slate-300 font-medium">${(p.day19 || 0).toLocaleString('es-CL')}</span>
                  </div>
                  <div class="bg-slate-950/80 border border-slate-900 py-1 rounded">
                    <span class="text-[10px] text-slate-500 block">Creativos</span>
                    <span class="text-slate-300 font-medium">${(p.creative || 0).toLocaleString('es-CL')}</span>
                  </div>
                  <div class="bg-slate-950/80 border border-slate-900 py-1 rounded">
                    <span class="text-[10px] text-slate-500 block">Sorpresas</span>
                    <span class="text-slate-300 font-medium">${(p.sorpresas || 0).toLocaleString('es-CL')}</span>
                  </div>
                  <div class="bg-slate-950/80 border border-slate-900 py-1 rounded">
                    <span class="text-[10px] text-red-400 block">Sanciones</span>
                    <span class="text-red-400 font-medium">-${(p.sanciones || 0).toLocaleString('es-CL')}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}



// Public Activity & Challenge Detail Modals
function openActivityDetail(id) {
  const act = (appData.activities || []).find(a => a.id === id);
  if (!act) return;

  const modal = document.getElementById('calc-modal');
  const content = document.getElementById('calc-modal-content');
  if (!modal || !content) return;

  const podium = getActivityPodium(act);
  const isFinished = act.status === 'Terminada';

  let activityCustomHtml = '';
  if (act.id === 'retro') {
    activityCustomHtml = `
    <!-- FICHA OFICIAL TORNEO RETRO: MORTAL KOMBAT -->
    <div class="bg-gradient-to-b from-red-950/30 to-slate-950 p-4 rounded-2xl border border-red-900/50 space-y-3.5">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        <span class="text-xs font-mono uppercase font-bold text-red-400">En una frase</span>
      </div>
      <p class="text-sm font-semibold text-white leading-snug">
        “Las tres alianzas se enfrentan entre sí en duelos uno contra uno, cada victoria suma 1 punto y gana la alianza con más victorias.”
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
        <div class="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <strong class="text-white block font-mono text-[11px] uppercase text-amber-400">👥 Quiénes Juegan</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            <strong>4 jugadores titulares + 1 suplente</strong> por alianza (12 titulares en total). Abierto a cualquier integrante de la alianza sin importar carrera ni año. Se inscribe antes en la mesa de registro.
          </p>
        </div>

        <div class="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <strong class="text-white block font-mono text-[11px] uppercase text-blue-400">⚔️ Cómo Funciona</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            3 enfrentamientos entre alianzas (Terror vs Shooter, Terror vs Action, Shooter vs Action). En cada cruce hay <strong>4 duelos 1v1 al mejor de 3 rondas</strong> (gana con 2 rondas). Cada jugador combate 2 veces (una contra cada rival).
          </p>
        </div>

        <div class="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <strong class="text-white block font-mono text-[11px] uppercase text-emerald-400">🏆 Cómo se Gana</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Cada duelo ganado suma <strong>1 punto/victoria</strong> (máximo 8 posibles). Gana la que logre más victorias. Desempate: <strong>1° rondas ganadas</strong>, 2° duelo extra sorteado.
          </p>
        </div>

        <div class="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <strong class="text-white block font-mono text-[11px] uppercase text-purple-400">🕹️ Controles y Reglas</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Controles arcade USB. La versión de Mortal Kombat se vota entre 2 o 3 opciones. Fatalities son opcionales (adorno). Si falta alguien entra el suplente.
          </p>
        </div>
      </div>

      <!-- PREGUNTAS RÁPIDAS MORTAL KOMBAT -->
      <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] space-y-1.5">
        <span class="font-bold text-slate-300 block font-mono uppercase text-[10px]">Preguntas Rápidas del Torneo:</span>
        <div class="text-slate-400"><strong class="text-slate-200">¿Tengo que ser bueno?</strong> No, hay 4 jugadores y se aprende viendo.</div>
        <div class="text-slate-400"><strong class="text-slate-200">¿Puedo jugar y hacer otras actividades?</strong> Sí, es la primera actividad del día.</div>
        <div class="text-slate-400"><strong class="text-slate-200">¿Me toca contra un compañero?</strong> Nunca: solo se enfrentan jugadores de alianzas rivales.</div>
      </div>
    </div>
    `;
  } else if (act.id === 'quemadas') {
    activityCustomHtml = `
    <!-- FICHA OFICIAL QUEMADAS (6.8) -->
    <div class="bg-gradient-to-b from-amber-950/20 to-slate-950 p-4 rounded-2xl border border-amber-900/40 space-y-3.5">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        <span class="text-xs font-mono uppercase font-bold text-amber-400">Reglamento Oficial • 6.8 Quemadas</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
        <div class="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <strong class="text-white block font-mono text-[11px] uppercase text-amber-400">👥 Participantes (8 vs 8)</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            <strong>8 contra 8 en cancha</strong>. En cada ronda juegan integrantes distintos para que roten todos.
          </p>
        </div>

        <div class="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <strong class="text-white block font-mono text-[11px] uppercase text-blue-400">⚔️ Enfrentamientos</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Todos contra todos, 3 partidos: <strong>Terror vs Shooter</strong>, <strong>Shooter vs Action</strong> y <strong>Action vs Terror</strong>. Cada alianza juega dos partidos.
          </p>
        </div>

        <div class="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1 sm:col-span-2">
          <strong class="text-white block font-mono text-[11px] uppercase text-emerald-400">⏱️ Formato de Rondas y Límite de Tiempo</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Cada partido tiene <strong>3 rondas</strong> y lo gana la alianza que gane más rondas. <strong>Una ronda parte sin límite de tiempo</strong> y termina cuando eliminan a todos los jugadores de una alianza. Si la ronda se alarga demasiado, quien anima o el equipo de la organización puede fijar un <strong>tiempo límite en el momento y avisarlo en voz alta</strong>. Al terminar ese tiempo, gana la ronda la alianza con más jugadores en pie, y si hay igual cantidad, la ronda empata.
          </p>
        </div>

        <div class="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1 sm:col-span-2">
          <strong class="text-white block font-mono text-[11px] uppercase text-red-400">🛡️ Reglas y Balón</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Balones blandos certificados, <strong>sin pegar a la cabeza</strong>. Si se atrapa la pelota en el aire, <strong>queda eliminado quien la lanzó</strong>. Un árbitro por partido.
          </p>
        </div>
      </div>

      <!-- TABLA Y DESEMPATE -->
      <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] space-y-1">
        <span class="font-bold text-slate-300 block font-mono uppercase text-[10px]">📊 Tabla y Criterios de Posición:</span>
        <div class="text-slate-300">
          Igual que en baby fútbol: <strong>Victoria 3 pts</strong>, <strong>Empate 1 pt</strong>, <strong>Derrota 0 pts</strong>.
        </div>
        <div class="text-slate-400">
          <strong>Criterio de Desempate:</strong> Más rondas ganadas $\rightarrow$ luego más jugadores en pie.
        </div>
      </div>
    </div>
    `;
  } else {
    activityCustomHtml = `
    <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
      <strong class="text-white block mb-1">Descripción y Reglamento:</strong>
      ${act.description || 'Competencia reglamentaria oficial de la Semana de las Carreras 2026.'}
    </div>
    `;
  }

  content.innerHTML = `
    <div class="space-y-4">
      <div class="border-b border-slate-800 pb-3">
        <span class="text-xs font-bold uppercase tracking-wider text-red-500">${act.group}</span>
        <h3 class="text-2xl font-black font-heading text-white mt-1">${act.name}</h3>
        <span class="text-xs text-slate-400">${act.location} • ${act.time}</span>
      </div>

      ${activityCustomHtml}

      <div>
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Posición Oficial en Cancha</h4>
        ${isFinished && podium ? `
          <div class="grid grid-cols-3 gap-3 text-center font-mono">
            <div class="bg-amber-950/40 border border-amber-800/60 p-3 rounded-xl">
              <span class="text-[10px] text-amber-400 font-bold block">🥇 1° Lugar</span>
              <span class="text-base font-bold text-white mt-1 block">${podium.first}</span>
            </div>
            <div class="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
              <span class="text-[10px] text-slate-400 font-bold block">🥈 2° Lugar</span>
              <span class="text-base font-bold text-slate-200 mt-1 block">${podium.second}</span>
            </div>
            <div class="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
              <span class="text-[10px] text-slate-500 font-bold block">🥉 3° Lugar</span>
              <span class="text-base font-bold text-slate-300 mt-1 block">${podium.third}</span>
            </div>
          </div>
        ` : `
          <div class="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-slate-400 text-xs font-mono">
            ${act.status === 'En curso' ? '🏃 Actividad en desarrollo en cancha' : '⏳ Actividad por disputarse'}
          </div>
        `}
      </div>

      <!-- BOTÓN DIRECTO: CÓMO SE CALCULÓ -->
      <div class="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <span class="text-[11px] text-slate-500 font-mono">Fórmula: 1° 100%, 2° 60%, 3° 30%</span>
        <button 
          onclick="document.getElementById('calc-modal').classList.add('hidden'); navigate('reglas')" 
          class="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/60 transition flex items-center justify-center gap-1.5"
        >
          <i data-lucide="calculator" class="w-3.5 h-3.5 text-amber-400"></i>
          <span>¿Cómo se calculó? Ver explicación en 1 min →</span>
        </button>
      </div>

    </div>
  `;

  modal.classList.remove('hidden');
  lucide.createIcons();
}

function openCreativeDetail() {
  const modal = document.getElementById('calc-modal');
  const content = document.getElementById('calc-modal-content');
  if (!modal || !content) return;

  const fav = appData.creativeChallenges?.favoriteAlliance;
  const status = appData.creativeChallenges?.status || {};

  content.innerHTML = `
    <div class="space-y-4">
      <div class="border-b border-slate-800 pb-3">
        <span class="text-xs font-bold uppercase text-indigo-400">Desafíos Creativos</span>
        <h3 class="text-2xl font-black font-heading text-white mt-1">Evaluación de Obras con IA</h3>
      </div>
      <p class="text-xs text-slate-300">
        Cada alianza presentó una obra exclusiva evaluada por la comisión docente en base a creatividad, originalidad técnica y pertinencia temática.
      </p>
      <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
        Obra con distinción de Favorita: <strong class="text-white">${fav ? `Alianza ${fav}` : 'En proceso de evaluación'}</strong>
      </div>
      <div class="grid grid-cols-3 gap-3 text-center font-mono">
        <div class="bg-slate-900/60 border border-red-900/40 p-3 rounded-xl">
          <span class="text-xs text-red-400 font-bold block">Terror</span>
          <span class="text-xs font-bold text-slate-200 mt-1 block">${status.Terror || 'Pendiente'}</span>
        </div>
        <div class="bg-slate-900/60 border border-blue-900/40 p-3 rounded-xl">
          <span class="text-xs text-blue-400 font-bold block">Shooter</span>
          <span class="text-xs font-bold text-slate-200 mt-1 block">${status.Shooter || 'Pendiente'}</span>
        </div>
        <div class="bg-slate-900/60 border border-emerald-900/40 p-3 rounded-xl">
          <span class="text-xs text-emerald-400 font-bold block">Action</span>
          <span class="text-xs font-bold text-slate-200 mt-1 block">${status.Action || 'Pendiente'}</span>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  lucide.createIcons();
}
