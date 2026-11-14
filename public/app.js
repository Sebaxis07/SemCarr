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
  // Poll for live score updates every 4 seconds (tiempo real para proyector y marcadores)
  refreshInterval = setInterval(loadStats, 4000);
  lucide.createIcons();

  // Atajos globales de teclado para modo proyector
  window.addEventListener('keydown', (e) => {
    // Si el usuario está escribiendo en un input o textarea, ignorar
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      navigate(currentTab === 'proyector' ? 'inicio' : 'proyector');
    } else if (currentTab === 'proyector') {
      if (e.key === '1') setProyectorView('leaderboard');
      else if (e.key === '2') setProyectorView('podium');
      else if (e.key === '3') setProyectorView('cancha');
      else if (e.key === 'r' || e.key === 'R') toggleProyectorAutoCycle();
      else if (e.key === 'm' || e.key === 'M') toggleProyectorSound();
      else if (e.key === 'f' || e.key === 'F') toggleProyectorFullscreen();
      else if (e.key === 'Escape') navigate('inicio');
    }
  });
});

// Estado reactivo del proyector
const proyectorState = {
  viewMode: 'leaderboard', // 'leaderboard' | 'podium' | 'cancha'
  autoCycle: false,
  autoCycleInterval: null,
  soundEnabled: false,
  lastTotals: { Terror: 0, Shooter: 0, Action: 0 }
};

let proyectorAudioCtx = null;
function playProyectorSound(type) {
  if (!proyectorState.soundEnabled) return;
  try {
    if (!proyectorAudioCtx) {
      proyectorAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (proyectorAudioCtx.state === 'suspended') {
      proyectorAudioCtx.resume();
    }
    const now = proyectorAudioCtx.currentTime;
    if (type === 'points') {
      // Chime synth-tech ascendente
      const osc = proyectorAudioCtx.createOscillator();
      const gain = proyectorAudioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(proyectorAudioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'sorpresa') {
      // Alerta arcade de emergencia
      const osc = proyectorAudioCtx.createOscillator();
      const gain = proyectorAudioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.15);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(proyectorAudioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {}
}

function setProyectorView(mode) {
  if (!['leaderboard', 'podium', 'cancha'].includes(mode)) return;
  proyectorState.viewMode = mode;
  if (currentTab === 'proyector') {
    const container = document.getElementById('app-container');
    if (container) {
      container.innerHTML = renderBigScreen();
      lucide.createIcons();
    }
  }
}

function toggleProyectorAutoCycle() {
  proyectorState.autoCycle = !proyectorState.autoCycle;
  if (proyectorState.autoCycleInterval) {
    clearInterval(proyectorState.autoCycleInterval);
    proyectorState.autoCycleInterval = null;
  }
  if (proyectorState.autoCycle) {
    const views = ['leaderboard', 'podium', 'cancha'];
    proyectorState.autoCycleInterval = setInterval(() => {
      if (currentTab !== 'proyector') {
        clearInterval(proyectorState.autoCycleInterval);
        proyectorState.autoCycle = false;
        return;
      }
      const curIdx = views.indexOf(proyectorState.viewMode);
      const nextIdx = (curIdx + 1) % views.length;
      setProyectorView(views[nextIdx]);
    }, 15000);
  }
  if (currentTab === 'proyector') {
    const container = document.getElementById('app-container');
    if (container) {
      container.innerHTML = renderBigScreen();
      lucide.createIcons();
    }
  }
}

function toggleProyectorSound() {
  proyectorState.soundEnabled = !proyectorState.soundEnabled;
  if (proyectorState.soundEnabled) {
    playProyectorSound('points');
  }
  if (currentTab === 'proyector') {
    const container = document.getElementById('app-container');
    if (container) {
      container.innerHTML = renderBigScreen();
      lucide.createIcons();
    }
  }
}

function toggleProyectorFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }
}

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Error al cargar datos');
    const fresh = await res.json();
    
    // Detección de cambio de puntos para alerta sonora y reactividad
    if (appData && appData.alliances && fresh.alliances) {
      const pT_old = appData.alliances?.Terror?.points?.total || 0;
      const pS_old = appData.alliances?.Shooter?.points?.total || 0;
      const pA_old = appData.alliances?.Action?.points?.total || 0;
      const pT_new = fresh.alliances?.Terror?.points?.total || 0;
      const pS_new = fresh.alliances?.Shooter?.points?.total || 0;
      const pA_new = fresh.alliances?.Action?.points?.total || 0;
      if (pT_old !== 0 && (pT_new !== pT_old || pS_new !== pS_old || pA_new !== pA_old)) {
        playProyectorSound('points');
      }
      if (!appData.activeSorpresa && fresh.activeSorpresa) {
        playProyectorSound('sorpresa');
      }
    }
    
    appData = fresh;
    
    // Re-renderizado reactivo en tiempo real
    if (currentTab === 'inicio') {
      renderCurrentTab();
    } else if (currentTab === 'proyector') {
      const container = document.getElementById('app-container');
      if (container) {
        container.innerHTML = renderBigScreen();
        lucide.createIcons();
      }
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
  const proyEl = document.getElementById('proyector-sorp-countdown');
  if (!appData.activeSorpresa || !appData.activeSorpresa.prepEndsAt) return;
  const diff = new Date(appData.activeSorpresa.prepEndsAt).getTime() - Date.now();
  let text = '';
  let cls = 'text-2xl font-mono font-bold text-amber-400 block';
  if (diff <= 0) {
    text = '¡Comenzó!';
    cls = 'text-2xl font-mono font-bold text-emerald-400 block animate-pulse';
  } else {
    const sec = Math.ceil(diff / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    text = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  if (el) {
    el.textContent = text;
    el.className = cls;
  }
  if (proyEl) {
    proyEl.textContent = text;
  }
}
setInterval(updatePublicSorpresaCountdown, 1000);

// Navigation Router
function navigate(tab) {
  // Soporte bidireccional para modo proyector
  if (tab === 'bigscreen') tab = 'proyector';
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
    const timerBigEl = document.getElementById('countdown-timer-big');
    const labelBigEl = document.getElementById('countdown-label-big');

    const now = Date.now();
    const diff = targetDate - now;

    let text = '';
    let lbl = 'Inicio del Evento';
    if (diff <= 0) {
      lbl = 'Estado del Evento';
      text = '¡En Desarrollo!';
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      text = `${days}d ${hours}h ${mins}m ${secs}s`;
    }

    if (labelEl) labelEl.textContent = lbl;
    if (timerEl) timerEl.textContent = text;
    if (labelBigEl) labelBigEl.textContent = lbl;
    if (timerBigEl) timerBigEl.textContent = text;
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

    case 'proyector':
    case 'bigscreen':
      container.innerHTML = renderBigScreen();
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

      <!-- ======================================================== -->
      <!-- WIDGETS EN CANCHA AHORA & PRÓXIMA EN CRONOGRAMA (ESPORTS)   -->
      <!-- ======================================================== -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        
        <!-- Widget: En Cancha Ahora -->
        <div class="bg-[#0A1333] border-2 ${activeAct ? 'border-emerald-500/80 shadow-emerald-950/40' : 'border-[#142252] hover:border-[#2D46B9]/60'} rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-xl relative overflow-hidden transition group">
          <div class="absolute -right-4 -bottom-4 w-20 h-20 ${activeAct ? 'bg-emerald-500/10' : 'bg-[#2D46B9]/10'} rounded-full blur-xl pointer-events-none"></div>
          
          <div class="w-12 h-12 rounded-xl ${activeAct ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 shadow-md shadow-emerald-500/30' : 'bg-[#050C24] border border-[#142252] text-slate-400'} flex items-center justify-center shrink-0 relative">
            ${activeAct ? `
              <span class="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute"></span>
              <i data-lucide="play" class="w-5 h-5 relative z-10 fill-emerald-400 stroke-none"></i>
            ` : `
              <i data-lucide="coffee" class="w-5 h-5 text-[#7F9CF5]"></i>
            `}
          </div>
          
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              ${activeAct ? `
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-[10px] font-display font-black uppercase tracking-wider text-emerald-400">EN CANCHA AHORA • EN VIVO</span>
              ` : `
                <span class="text-[10px] font-display font-black uppercase tracking-wider text-slate-400">ESTADO EN CANCHA</span>
              `}
            </div>
            
            <h4 class="font-display font-black text-white block truncate text-base sm:text-lg mt-0.5 tracking-tight group-hover:text-emerald-300 transition">
              ${activeAct ? activeAct.name : 'En receso / preparación'}
            </h4>
            
            <span class="text-[11px] text-slate-300 font-mono block truncate mt-1">
              ${activeAct ? `${activeAct.location} • <strong class="text-[#7F9CF5]">${activeAct.time}</strong>` : 'Esperando inicio de la siguiente actividad del programa'}
            </span>
          </div>
        </div>

        <!-- Widget: Próxima en Programa -->
        <div class="bg-[#0A1333] border-2 border-[#2D46B9]/80 hover:border-[#7F9CF5] rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-xl shadow-[#2D46B9]/15 relative overflow-hidden transition group">
          <div class="absolute -right-4 -bottom-4 w-20 h-20 bg-[#2D46B9]/15 rounded-full blur-xl pointer-events-none"></div>

          <div class="w-12 h-12 rounded-xl bg-[#0E1E48] border border-[#2D46B9] text-[#7F9CF5] flex items-center justify-center shrink-0 shadow-md shadow-[#2D46B9]/30 group-hover:scale-105 transition">
            <i data-lucide="fast-forward" class="w-5 h-5 fill-[#7F9CF5] stroke-none"></i>
          </div>

          <div class="min-w-0 flex-1">
            <span class="text-[10px] font-display font-black uppercase tracking-wider text-[#7F9CF5] block">
              PRÓXIMA EN PROGRAMA
            </span>

            <h4 class="font-display font-black text-white block truncate text-base sm:text-lg mt-0.5 tracking-tight group-hover:text-[#7F9CF5] transition">
              ${nextAct ? nextAct.name : 'Todas las actividades completadas'}
            </h4>

            <span class="text-[11px] text-slate-300 font-mono block truncate mt-1">
              ${nextAct ? `${nextAct.location} • <strong class="text-white">${nextAct.time}</strong>` : 'Jornada oficial del día finalizada'}
            </span>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- TABLA CLASIFICACIÓN POR ACTIVIDAD (ESTILO ESPORTS)       -->
      <!-- ======================================================== -->
      <div class="bg-[#0A1333] border-2 border-[#142252] rounded-2xl overflow-hidden shadow-2xl relative glow-electric">
        
        <!-- Header de la sección -->
        <div class="p-4 sm:p-5 border-b-2 border-[#142252] bg-[#050C24]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-sm bg-[#E6194B] rotate-45 shadow-sm shadow-[#E6194B]"></span>
              <span class="text-[10px] font-display font-black uppercase tracking-widest text-[#7F9CF5]">
                /// PROGRAMA & CLASIFICACIÓN OFICIAL
              </span>
            </div>
            <h3 class="text-lg sm:text-xl font-display font-black text-white tracking-tight">
              Clasificación por Actividad
            </h3>
            <p class="text-xs text-slate-400">
              Revisa qué alianza quedó en 1°, 2° y 3° lugar en cada competencia finalizada del 19 de noviembre.
            </p>
          </div>
          
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-[11px] text-[#7F9CF5] font-mono bg-[#0E1E48] border border-[#2D46B9] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-inner">
              <i data-lucide="info" class="w-3.5 h-3.5 text-[#7F9CF5]"></i>
              <span>Clic en una fila para ver reglamento</span>
            </span>
          </div>
        </div>

        <!-- Tabla Responsive -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#050C24] text-[#7F9CF5] text-[10px] uppercase font-display font-black tracking-wider border-b-2 border-[#142252]">
              <tr>
                <th class="py-3.5 px-4 sm:px-5">Actividad</th>
                <th class="py-3.5 px-3 text-center">Estado</th>
                <th class="py-3.5 px-3">🥇 1° Lugar (Ganador)</th>
                <th class="py-3.5 px-3">🥈 2° Lugar</th>
                <th class="py-3.5 px-3">🥉 3° Lugar</th>
                <th class="py-3.5 px-3 text-center w-10"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#142252]/70 bg-[#0A1333]/80">
              ${activities.map((act, idx) => {
                const podium = getActivityPodium(act);
                const isFinished = act.status === 'Terminada';
                const isLive = act.status === 'En curso';

                const statusBadge = isFinished 
                  ? 'text-emerald-400 bg-emerald-950/70 border border-emerald-500/60 shadow-sm shadow-emerald-500/20' 
                  : (isLive ? 'text-amber-300 bg-amber-950/70 border border-amber-500/80 animate-pulse shadow-sm shadow-amber-500/30' : 'text-slate-400 bg-[#050C24] border border-[#142252]');

                const getBadge = (alName) => {
                  if (!alName || alName === '-') return '<span class="text-slate-600 font-mono">-</span>';
                  const isT = alName.includes('Terror');
                  const isS = alName.includes('Shooter');
                  const isA = alName.includes('Action');
                  const badgeClass = isT 
                    ? 'text-white bg-[#E6194B]/25 border-[#E6194B] shadow-sm shadow-[#E6194B]/30' 
                    : (isS 
                        ? 'text-white bg-[#2D46B9]/30 border-[#2D46B9] shadow-sm shadow-[#2D46B9]/30' 
                        : (isA 
                            ? 'text-white bg-[#059669]/30 border-[#059669] shadow-sm shadow-[#059669]/30' 
                            : 'text-slate-300 bg-[#0E1E48] border-[#142252]'));
                  return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-display font-bold uppercase tracking-tight border ${badgeClass}">
                    <span class="w-1.5 h-1.5 rounded-full ${isT ? 'bg-[#E6194B]' : (isS ? 'bg-[#7F9CF5]' : (isA ? 'bg-emerald-400' : 'bg-slate-400'))}"></span>
                    <span>${alName}</span>
                  </span>`;
                };

                const groupColor = act.group === 'Deportes' ? 'text-amber-400' : (act.group === 'Juegos' ? 'text-[#7F9CF5]' : (act.group === 'Gymkanas' ? 'text-emerald-400' : (act.group === 'Música' ? 'text-purple-400' : 'text-rose-400')));

                return `
                  <tr onclick="openActivityDetail('${act.id}')" class="hover:bg-[#0E1E48]/80 cursor-pointer transition border-l-4 border-l-transparent hover:border-l-[#2D46B9] group">
                    <td class="py-3.5 px-4 sm:px-5">
                      <div class="flex items-center gap-2">
                        <span class="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-[#050C24] border border-[#142252] ${groupColor}">
                          ${act.group || 'Evento'}
                        </span>
                        <span class="font-display font-bold text-white text-xs sm:text-sm tracking-tight group-hover:text-[#7F9CF5] transition">
                          ${act.name}
                        </span>
                      </div>
                      <span class="block text-[10px] text-slate-400 font-mono mt-1">
                        ${act.location} • <strong class="text-slate-300">${act.time}</strong>
                      </span>
                    </td>
                    <td class="py-3.5 px-3 text-center whitespace-nowrap">
                      <span class="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-md ${statusBadge}">
                        ${isFinished ? '<i data-lucide="check-circle" class="w-3 h-3 text-emerald-400"></i>' : (isLive ? '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>' : '')}
                        <span>${act.status}</span>
                      </span>
                    </td>
                    <td class="py-3.5 px-3 whitespace-nowrap">
                      ${isFinished ? getBadge(podium.first) : (isLive ? '<span class="text-amber-400 font-mono text-[11px] font-semibold animate-pulse">⚡ En disputa en cancha</span>' : '<span class="text-slate-500 font-mono text-[11px]">Por disputarse</span>')}
                    </td>
                    <td class="py-3.5 px-3 whitespace-nowrap">
                      ${isFinished ? getBadge(podium.second) : (isLive ? '<span class="text-slate-600 font-mono text-[11px]">-</span>' : '<span class="text-slate-600 font-mono text-[11px]">-</span>')}
                    </td>
                    <td class="py-3.5 px-3 whitespace-nowrap">
                      ${isFinished ? getBadge(podium.third) : (isLive ? '<span class="text-slate-600 font-mono text-[11px]">-</span>' : '<span class="text-slate-600 font-mono text-[11px]">-</span>')}
                    </td>
                    <td class="py-3.5 px-3 text-center text-slate-400 group-hover:text-[#7F9CF5] transition">
                      <i data-lucide="chevron-right" class="w-4 h-4 inline group-hover:translate-x-0.5 transition-transform"></i>
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
// ==========================================
// 2. PANTALLA GRANDE / PROYECTOR (DISEÑO PROFESIONAL SYNTH-TECH / ESPORTS)
// ==========================================
function renderBigScreen() {
  const al = appData.alliances || {};
  const terror = al.Terror || { points: { total: 0 }, carrera: 'Informática & Telecomunicaciones' };
  const shooter = al.Shooter || { points: { total: 0 }, carrera: 'Informática & Telecomunicaciones' };
  const action = al.Action || { points: { total: 0 }, carrera: 'Diseño e Industria Digital' };

  const pT = terror.points?.total || 0;
  const pS = shooter.points?.total || 0;
  const pA = action.points?.total || 0;

  const MAX_EVENT_POINTS = 32000;
  const pMax = Math.max(pT, pS, pA, 1);

  const creativeData = appData.creativeChallenges || {};
  const favAlliance = creativeData.favoriteAlliance;

  const alliancesList = [
    { 
      name: 'TERROR', 
      key: 'Terror',
      carrera: 'Informática & Telecomunicaciones',
      colorName: 'Rojo Carmesí',
      themeColor: '#E6194B',
      pts: pT, 
      dot: 'bg-[#E6194B]', 
      bar: 'bg-gradient-to-r from-red-800 via-[#E6194B] to-red-400', 
      border: 'border-[#E6194B]/70', 
      glowBorder: 'border-[#E6194B] shadow-[0_0_35px_rgba(230,25,75,0.4)]',
      bgCard: 'bg-gradient-to-r from-red-950/40 via-[#0A1333] to-[#050C24]',
      tag: 'text-[#E6194B] border-red-700/80 bg-red-950/70',
      textAccent: 'text-[#E6194B]',
      mascot: '/img/mascota-terror.png',
      desafioName: 'Videojuego IA',
      delivered: Boolean(creativeData.status?.Terror?.delivered),
      isFav: favAlliance && (favAlliance === 'Terror' || favAlliance.includes('Terror'))
    },
    { 
      name: 'SHOOTER', 
      key: 'Shooter',
      carrera: 'Informática & Telecomunicaciones',
      colorName: 'Azul Eléctrico',
      themeColor: '#2D46B9',
      pts: pS, 
      dot: 'bg-[#2D46B9]', 
      bar: 'bg-gradient-to-r from-blue-900 via-[#2D46B9] to-[#7F9CF5]', 
      border: 'border-[#2D46B9]/70', 
      glowBorder: 'border-[#2D46B9] shadow-[0_0_35px_rgba(45,70,185,0.4)]',
      bgCard: 'bg-gradient-to-r from-blue-950/40 via-[#0A1333] to-[#050C24]',
      tag: 'text-[#7F9CF5] border-blue-700/80 bg-blue-950/70',
      textAccent: 'text-[#7F9CF5]',
      mascot: '/img/mascota-shooter.png',
      desafioName: 'Chatbot IA',
      delivered: Boolean(creativeData.status?.Shooter?.delivered),
      isFav: favAlliance && (favAlliance === 'Shooter' || favAlliance.includes('Shooter'))
    },
    { 
      name: 'ACTION', 
      key: 'Action',
      carrera: 'Diseño e Industria Digital',
      colorName: 'Verde Esmeralda',
      themeColor: '#059669',
      pts: pA, 
      dot: 'bg-emerald-500', 
      bar: 'bg-gradient-to-r from-emerald-900 via-emerald-600 to-emerald-400', 
      border: 'border-emerald-600/70', 
      glowBorder: 'border-emerald-500 shadow-[0_0_35px_rgba(5,150,105,0.4)]',
      bgCard: 'bg-gradient-to-r from-emerald-950/40 via-[#0A1333] to-[#050C24]',
      tag: 'text-emerald-400 border-emerald-700/80 bg-emerald-950/70',
      textAccent: 'text-emerald-400',
      mascot: '/img/mascota-action.png',
      desafioName: 'Collage Digital',
      delivered: Boolean(creativeData.status?.Action?.delivered),
      isFav: favAlliance && (favAlliance === 'Action' || favAlliance.includes('Action'))
    }
  ];

  // Ordenar para ranking (1°, 2°, 3°) según servidor oficial
  const sorted = [...alliancesList].sort((a, b) => {
    const rA = appData.alliances?.[a.key]?.rank || 99;
    const rB = appData.alliances?.[b.key]?.rank || 99;
    if (rA !== rB) return rA - rB;
    return b.pts - a.pts;
  });

  const placesMap = {};
  sorted.forEach((item, idx) => {
    placesMap[item.key] = appData.alliances?.[item.key]?.rank || (idx + 1);
  });

  const leader = sorted[0];
  const second = sorted[1];
  const third = sorted[2];
  const diff12 = Math.abs(leader.pts - second.pts);

  // Hora en vivo de Chile
  const chileTimeStr = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Actividad activa o última
  const activeAct = appData.activeActivity;
  const nextAct = appData.nextActivity;
  const currentView = proyectorState.viewMode || 'leaderboard';

  return `
    <div class="fixed inset-0 bg-[#050C24] text-white z-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none overflow-hidden">
      
      <!-- ENMARCADO DINÁMICO DE ESTADIO (SWOOSHES & DOT-MATRIX) -->
      <div class="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#0E1E48]/50 blur-[140px] rounded-full"></div>
        <div class="absolute bottom-5 left-5 w-[500px] h-[500px] bg-[#2D46B9]/15 blur-[120px] rounded-full"></div>
        <div class="absolute top-10 right-5 w-[500px] h-[500px] bg-[#E6194B]/15 blur-[130px] rounded-full"></div>
        
        <!-- Swoosh Superior Izquierdo -->
        <svg class="absolute -top-12 -left-12 w-80 h-80 opacity-60" viewBox="0 0 300 300" fill="none">
          <path d="M-50 180 C 40 180, 120 120, 150 -50" stroke="#2D46B9" stroke-width="26" stroke-linecap="round"/>
          <path d="M-50 130 C 50 130, 140 80, 190 -50" stroke="#E6194B" stroke-width="14" stroke-linecap="round"/>
        </svg>

        <!-- Swoosh Inferior Derecho -->
        <svg class="absolute -bottom-12 -right-12 w-80 h-80 opacity-60" viewBox="0 0 300 300" fill="none">
          <path d="M350 120 C 260 120, 180 180, 150 350" stroke="#E6194B" stroke-width="24" stroke-linecap="round"/>
          <path d="M350 170 C 250 170, 160 220, 110 350" stroke="#2D46B9" stroke-width="14" stroke-linecap="round"/>
        </svg>

        <div class="absolute top-3 right-6 w-48 h-48 dot-matrix opacity-25 [mask-image:linear-gradient(to_bottom_left,black,transparent)]"></div>
      </div>

      <!-- ======================================================== -->
      <!-- HEADER PROYECTOR: ESTADIO & TRANSMISIÓN EN VIVO         -->
      <!-- ======================================================== -->
      <div class="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#142252] pb-3 sm:pb-4 shrink-0">
        
        <!-- Marca Oficial + Hora + Sync -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded-sm bg-[#E6194B] shadow-lg shadow-[#E6194B]/60 rotate-45"></span>
            <div>
              <span class="font-display font-black text-white text-lg sm:text-2xl tracking-wider italic block leading-none">
                TI & DISEÑO DIGITAL
              </span>
              <span class="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mt-0.5">
                Semana de las Carreras 2026 • Marcador Oficial de Estadio
              </span>
            </div>
          </div>
          <div class="h-8 w-px bg-[#142252] hidden sm:block"></div>
          <div class="hidden sm:flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-xs font-mono font-bold text-white">${chileTimeStr}</span>
            <span class="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded uppercase">En Vivo</span>
          </div>
        </div>

        <!-- Alerta Duelo al Rojo o Selector de Vistas -->
        <div class="flex items-center gap-2">
          ${diff12 <= 800 && leader.pts > 0 ? `
            <div class="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/80 border-2 border-[#E6194B] text-white font-mono text-xs shadow-lg shadow-[#E6194B]/30 animate-pulse">
              <span class="w-2 h-2 rounded-full bg-[#E6194B]"></span>
              <span>⚔️ DUELO AL ROJO: solo <strong class="text-amber-400">${diff12.toLocaleString('es-CL')} pts</strong> entre 1° y 2° puesto</span>
            </div>
          ` : ''}

          <!-- Selector de Modo de Pantalla (Pestañas del Proyector) -->
          <div class="inline-flex p-1 bg-[#0A1333] border border-[#142252] rounded-xl gap-1 shrink-0">
            <button 
              type="button" 
              onclick="setProyectorView('leaderboard')" 
              class="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${currentView === 'leaderboard' ? 'bg-[#2D46B9] text-white shadow' : 'text-slate-400 hover:text-white'}"
            >
              <i data-lucide="bar-chart-2" class="w-3.5 h-3.5"></i>
              <span class="hidden sm:inline">Marcador</span>
            </button>
            <button 
              type="button" 
              onclick="setProyectorView('podium')" 
              class="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${currentView === 'podium' ? 'bg-[#2D46B9] text-white shadow' : 'text-slate-400 hover:text-white'}"
            >
              <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-400"></i>
              <span class="hidden sm:inline">Podio 3D</span>
            </button>
            <button 
              type="button" 
              onclick="setProyectorView('cancha')" 
              class="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${currentView === 'cancha' ? 'bg-[#2D46B9] text-white shadow' : 'text-slate-400 hover:text-white'}"
            >
              <i data-lucide="activity" class="w-3.5 h-3.5"></i>
              <span class="hidden sm:inline">En Cancha</span>
            </button>
          </div>
        </div>

        <!-- Controles Operativos: Cronómetro, Kiosco, Sonido, Fullscreen y Salir -->
        <div class="flex items-center gap-2 sm:gap-3">
          <div class="text-right hidden md:block">
            <span class="text-[9px] font-mono uppercase tracking-wider text-slate-400 block" id="countdown-label-big">Cronómetro</span>
            <span class="text-sm sm:text-base font-mono font-bold text-white tracking-wider" id="countdown-timer-big">--:--:--</span>
          </div>

          <!-- Botón Auto-Rotación (Kiosco) -->
          <button 
            type="button"
            onclick="toggleProyectorAutoCycle()" 
            title="Alternar rotación automática cada 15s (tecla R)"
            class="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-mono border transition flex items-center gap-1.5 cursor-pointer ${proyectorState.autoCycle ? 'bg-amber-950/80 text-amber-300 border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-[#0A1333] text-slate-400 border-[#142252] hover:text-white'}"
          >
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5 ${proyectorState.autoCycle ? 'animate-spin' : ''}"></i>
            <span class="hidden xl:inline text-[11px] font-bold">${proyectorState.autoCycle ? 'Kiosco Activo' : 'Kiosco'}</span>
          </button>

          <!-- Botón Sonido FX -->
          <button 
            type="button"
            onclick="toggleProyectorSound()" 
            title="Activar/Silenciar alertas sonoras (tecla M)"
            class="p-2 rounded-xl text-xs font-mono border transition cursor-pointer ${proyectorState.soundEnabled ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600' : 'bg-[#0A1333] text-slate-500 border-[#142252] hover:text-white'}"
          >
            <i data-lucide="${proyectorState.soundEnabled ? 'volume-2' : 'volume-x'}" class="w-4 h-4"></i>
          </button>

          <!-- Botón Pantalla Completa (F11 / API) -->
          <button 
            type="button"
            onclick="toggleProyectorFullscreen()" 
            title="Pantalla Completa F11"
            class="p-2 rounded-xl text-xs font-mono bg-[#0A1333] hover:bg-[#142252] text-slate-300 border border-[#142252] transition cursor-pointer"
          >
            <i data-lucide="maximize" class="w-4 h-4"></i>
          </button>

          <!-- Botón Salir -->
          <button 
            type="button"
            onclick="navigate('inicio')" 
            title="Salir del modo proyector (tecla Esc o P)"
            class="px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
            <span class="hidden sm:inline">Cerrar</span>
          </button>
        </div>

      </div>

      <!-- ======================================================== -->
      <!-- CUERPO CENTRAL SEGÚN EL MODO ACTIVO                     -->
      <!-- ======================================================== -->
      <div class="relative z-10 my-auto py-2 max-w-7xl mx-auto w-full overflow-y-auto">

        <!-- ALERTA DE PRUEBA SORPRESA EN CURSO (PRIORIDAD ALTA) -->
        ${appData.activeSorpresa ? `
          <div class="bg-gradient-to-r from-red-950/95 via-amber-950/95 to-red-950/95 border-2 border-red-500 rounded-3xl py-4 px-6 text-center mb-5 shadow-2xl shadow-red-600/40 animate-pulse">
            <div class="flex items-center justify-center gap-3">
              <span class="text-2xl animate-bounce">🚨</span>
              <span class="text-xs sm:text-sm font-mono font-black text-amber-400 uppercase tracking-widest">¡PRUEBA SORPRESA EN CURSO!</span>
              <span class="text-2xl animate-bounce">🚨</span>
            </div>
            <h2 class="text-2xl sm:text-4xl font-display font-black text-white uppercase tracking-tight mt-1">
              ${appData.activeSorpresa.name}
            </h2>
            <p class="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl mx-auto">
              ${appData.activeSorpresa.description || 'Presentar representantes ante mesa de control de inmediato.'}
            </p>
            <div class="mt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-mono">
              <span class="bg-black/40 px-3 py-1 rounded-xl border border-amber-600/60 text-amber-300">
                ⏱️ Tiempo restante: <strong id="proyector-sorp-countdown" class="font-bold text-white">01:00</strong>
              </span>
              <span class="bg-black/40 px-3 py-1 rounded-xl border border-amber-600/60 text-amber-300">
                🏆 1°: +${appData.activeSorpresa.points1st || 500} pts | 2°: +${appData.activeSorpresa.points2nd || 300} pts | 3°: +${appData.activeSorpresa.points3rd || 150} pts
              </span>
            </div>
          </div>
        ` : ''}

        ${currentView === 'leaderboard' ? `
          <!-- ======================================================== -->
          <!-- VISTA 1: MARCADOR GENERAL ESPORTS + MASCOTAS + PISTA 32K -->
          <!-- ======================================================== -->
          
          <!-- BANNER DE ESTADO EN CANCHA -->
          <div class="bg-[#0A1333]/80 border border-[#142252] rounded-2xl py-2 px-5 mb-4 flex items-center justify-between text-xs font-mono shadow-md">
            <div class="flex items-center gap-2 truncate">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span class="text-slate-300 truncate">
                ${activeAct ? `<strong class="text-white">EN CANCHA AHORA:</strong> ${activeAct.name.toUpperCase()} • ${activeAct.location.toUpperCase()}` : 'SEMANA DE LAS CARRERAS 2026 • COMPETENCIA OFICIAL DE SEDE'}
              </span>
            </div>
            <span class="text-slate-400 hidden sm:inline shrink-0 font-bold">META OFICIAL: 32.000 PTS</span>
          </div>

          <!-- TARJETAS DE ALIANZAS CON RENDERS DE MASCOTAS -->
          <div class="space-y-4">
            ${sorted.map(item => {
              const place = placesMap[item.key];
              const isLeader = place === 1 && item.pts > 0;
              const diffFromLeader = leader.pts - item.pts;
              const pct = Math.min(100, Math.round((item.pts / MAX_EVENT_POINTS) * 100));
              const visualWidth = Math.max(8, Math.min(100, (item.pts / MAX_EVENT_POINTS) * 100));

              return `
                <div class="${item.bgCard} border-2 ${isLeader ? item.glowBorder : item.border} rounded-3xl p-4 sm:p-5 transition-all duration-300 relative overflow-hidden group">
                  
                  <!-- Resplandor dinámico de esquina -->
                  <div class="absolute -right-16 -top-16 w-44 h-44 rounded-full pointer-events-none opacity-25" style="background-color: ${item.themeColor}; filter: blur(40px);"></div>

                  <!-- FILA SUPERIOR: MASCOTA, TÍTULOS Y PUNTAJE -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                    
                    <div class="flex items-center gap-3 sm:gap-4">
                      
                      <!-- Render de la Mascota Oficial en Alta Resolución -->
                      <div class="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center p-1 rounded-2xl bg-[#050C24]/80 border ${item.border}">
                        <img 
                          src="${item.mascot}" 
                          alt="Mascota Alianza ${item.name}" 
                          class="w-full h-full object-contain drop-shadow-xl transition-transform group-hover:scale-110"
                        >
                        ${isLeader ? `
                          <div class="absolute -top-2 -right-2 bg-amber-500 text-black p-1 rounded-full shadow-lg">
                            <i data-lucide="crown" class="w-3.5 h-3.5"></i>
                          </div>
                        ` : ''}
                      </div>

                      <!-- Nombre de Alianza y Categoría -->
                      <div>
                        <div class="flex items-center gap-2 flex-wrap">
                          <h3 class="font-display font-black text-2xl sm:text-3xl text-white tracking-wider italic">
                            ALIANZA ${item.name}
                          </h3>
                          <span class="text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${isLeader ? 'bg-amber-950/80 text-amber-300 border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : item.tag}">
                            ${isLeader ? '👑 1° LUGAR - LÍDER' : `${place}° LUGAR`}
                          </span>
                          ${item.isFav ? `
                            <span class="text-[10px] font-mono uppercase bg-amber-500 text-black font-black px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                              <i data-lucide="award" class="w-3 h-3"></i> Mención Honor IA
                            </span>
                          ` : ''}
                        </div>
                        
                        <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span class="text-xs text-slate-300 font-sans font-medium">${item.carrera}</span>
                          <span class="text-slate-500 font-mono text-[10px]">• Desafío: <strong class="text-white">${item.desafioName}</strong> ${item.delivered ? '<span class="text-emerald-400 font-bold">(✓ 4.000 pts)</span>' : '<span class="text-slate-500">(Pendiente)</span>'}</span>
                        </div>
                      </div>

                    </div>

                    <!-- Puntaje en Vivo & Margen de Ventaja -->
                    <div class="text-left sm:text-right shrink-0">
                      <div class="flex items-baseline sm:justify-end gap-2">
                        <span class="text-3xl sm:text-5xl font-mono font-black text-white tracking-tight ${isLeader ? 'text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]' : ''}">
                          ${item.pts.toLocaleString('es-CL')}
                        </span>
                        <span class="text-xs font-mono font-bold text-slate-400">PTS</span>
                      </div>
                      
                      <div class="flex items-center sm:justify-end gap-2 mt-0.5">
                        ${isLeader ? `
                          <span class="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                            +${diff12.toLocaleString('es-CL')} pts de ventaja
                          </span>
                        ` : `
                          <span class="text-[11px] font-mono text-slate-400 bg-[#050C24] px-2 py-0.5 rounded border border-[#142252]">
                            A ${diffFromLeader.toLocaleString('es-CL')} pts del líder
                          </span>
                        `}
                        <span class="text-[11px] font-mono text-slate-400">${pct}% hacia la meta</span>
                      </div>
                    </div>

                  </div>

                  <!-- PISTA DE CARRERA VISUAL HACIA LA META (32.000 PTS) -->
                  <div class="mt-3.5 relative w-full bg-[#050C24] h-8 sm:h-9 rounded-2xl overflow-hidden border border-[#142252] p-1 flex items-center shadow-inner">
                    
                    <!-- Hitos oficiales en la escala (8k, 16k, 24k) -->
                    <div class="absolute left-[25%] top-0 bottom-0 w-px bg-slate-800 pointer-events-none flex items-center justify-center">
                      <span class="text-[8px] font-mono text-slate-600 bg-[#050C24]/80 px-1 rounded -translate-y-2.5">8K</span>
                    </div>
                    <div class="absolute left-[50%] top-0 bottom-0 w-px bg-slate-800 pointer-events-none flex items-center justify-center">
                      <span class="text-[8px] font-mono text-slate-600 bg-[#050C24]/80 px-1 rounded -translate-y-2.5">16K</span>
                    </div>
                    <div class="absolute left-[75%] top-0 bottom-0 w-px bg-slate-800 pointer-events-none flex items-center justify-center">
                      <span class="text-[8px] font-mono text-slate-600 bg-[#050C24]/80 px-1 rounded -translate-y-2.5">24K</span>
                    </div>

                    <!-- Barra de Progreso Neón con Animación Suave -->
                    <div 
                      class="${item.bar} h-full rounded-xl transition-all duration-1000 ease-out shadow-lg relative flex items-center justify-end pr-3" 
                      style="width: ${visualWidth}%;"
                    >
                      ${visualWidth > 12 ? `<span class="text-[11px] font-mono font-black text-white drop-shadow">${pct}%</span>` : ''}
                    </div>

                    <!-- Marca Final de Meta -->
                    <div class="absolute right-3 top-0 bottom-0 flex items-center pointer-events-none">
                      <span class="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">META 32.000 PTS</span>
                    </div>

                  </div>

                </div>
              `;
            }).join('')}
          </div>

        ` : (currentView === 'podium' ? `
          <!-- ======================================================== -->
          <!-- VISTA 2: PODIO 3D SHOWDOWN (TOP 3 INTERACTIVO)          -->
          <!-- ======================================================== -->
          <div class="py-4">
            <div class="text-center mb-6">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-950/60 text-amber-300 border border-amber-600/60 mb-2">
                <i data-lucide="crown" class="w-3.5 h-3.5"></i>
                Podio Oficial de la Competencia
              </span>
              <h2 class="text-2xl sm:text-4xl font-display font-black text-white italic uppercase tracking-tight">
                Cuadro de Honor en Vivo
              </h2>
            </div>

            <!-- Estructura de Podio: 2° Puesto (Izq), 1° Puesto (Centro Elevado), 3° Puesto (Der) -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-5xl mx-auto pt-6">
              
              <!-- 2° LUGAR (PLATA) -->
              <div class="flex flex-col items-center order-2 md:order-1">
                <div class="relative w-28 h-28 sm:w-36 sm:h-36 -mb-4 z-10">
                  <img src="${second.mascot}" alt="${second.name}" class="w-full h-full object-contain drop-shadow-2xl">
                </div>
                <div class="w-full bg-[#0A1333] border-2 border-slate-400 rounded-3xl p-5 text-center shadow-xl space-y-2 relative pt-6">
                  <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-300 text-black px-3 py-0.5 rounded-full font-mono font-black text-xs uppercase shadow">
                    2° LUGAR
                  </div>
                  <h3 class="font-display font-black text-2xl text-white italic uppercase">${second.name}</h3>
                  <span class="text-xs text-slate-400 font-mono block">${second.carrera}</span>
                  <div class="pt-2 border-t border-[#142252]">
                    <span class="text-3xl font-mono font-black text-white block">${second.pts.toLocaleString('es-CL')}</span>
                    <span class="text-[10px] font-mono text-slate-400">A ${diff12.toLocaleString('es-CL')} pts del 1°</span>
                  </div>
                </div>
              </div>

              <!-- 1° LUGAR (ORO - ELEVADO) -->
              <div class="flex flex-col items-center order-1 md:order-2 -mt-6">
                <div class="relative w-36 h-36 sm:w-44 sm:h-44 -mb-4 z-20">
                  <img src="${leader.mascot}" alt="${leader.name}" class="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(245,158,11,0.6)]">
                  <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-black p-2 rounded-full shadow-2xl animate-bounce">
                    <i data-lucide="crown" class="w-5 h-5"></i>
                  </div>
                </div>
                <div class="w-full bg-gradient-to-b from-amber-950/60 via-[#0A1333] to-[#050C24] border-2 border-amber-500 rounded-3xl p-6 text-center shadow-2xl space-y-2 relative pt-8 podium-glow-gold">
                  <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-black px-4 py-1 rounded-full font-display font-black text-xs uppercase tracking-wider shadow-lg">
                    👑 LÍDER DEL TORNEO
                  </div>
                  <h3 class="font-display font-black text-3xl sm:text-4xl text-amber-300 italic uppercase drop-shadow">${leader.name}</h3>
                  <span class="text-xs text-slate-300 font-mono block">${leader.carrera}</span>
                  <div class="pt-3 border-t border-amber-600/40">
                    <span class="text-4xl sm:text-5xl font-mono font-black text-white block">${leader.pts.toLocaleString('es-CL')}</span>
                    <span class="text-xs font-mono font-bold text-emerald-400">+${diff12.toLocaleString('es-CL')} pts de ventaja</span>
                  </div>
                </div>
              </div>

              <!-- 3° LUGAR (BRONCE) -->
              <div class="flex flex-col items-center order-3 md:order-3">
                <div class="relative w-24 h-24 sm:w-32 sm:h-32 -mb-4 z-10">
                  <img src="${third.mascot}" alt="${third.name}" class="w-full h-full object-contain drop-shadow-xl">
                </div>
                <div class="w-full bg-[#0A1333] border-2 border-amber-800/80 rounded-3xl p-5 text-center shadow-xl space-y-2 relative pt-6">
                  <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-800 text-amber-200 px-3 py-0.5 rounded-full font-mono font-black text-xs uppercase shadow">
                    3° LUGAR
                  </div>
                  <h3 class="font-display font-black text-2xl text-white italic uppercase">${third.name}</h3>
                  <span class="text-xs text-slate-400 font-mono block">${third.carrera}</span>
                  <div class="pt-2 border-t border-[#142252]">
                    <span class="text-3xl font-mono font-black text-white block">${third.pts.toLocaleString('es-CL')}</span>
                    <span class="text-[10px] font-mono text-slate-400">A ${(leader.pts - third.pts).toLocaleString('es-CL')} pts del 1°</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        ` : `
          <!-- ======================================================== -->
          <!-- VISTA 3: EN CANCHA & DESAFÍOS CREATIVOS CON IA           -->
          <!-- ======================================================== -->
          <div class="space-y-4 max-w-5xl mx-auto py-2">
            
            <!-- TARJETA PRINCIPAL DE ACTIVIDAD EN CURSO -->
            <div class="bg-gradient-to-r from-[#0A1333] to-[#050C24] border-2 border-[#2D46B9] rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div class="flex items-center gap-2 mb-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-xs font-mono uppercase font-bold text-emerald-400 tracking-wider">Actividad en Vivo en Cancha</span>
              </div>
              <h3 class="text-2xl sm:text-3xl font-display font-black text-white italic uppercase">
                ${activeAct ? activeAct.name : 'Descanso / Preparación de Próxima Ronda'}
              </h3>
              <p class="text-xs sm:text-sm text-slate-300 mt-1">
                ${activeAct ? `Ubicación: <strong>${activeAct.location}</strong> • Horario: <strong>${activeAct.schedule || 'En desarrollo'}</strong>` : 'Revisa el cronograma en el portal o acércate a la mesa de control.'}
              </p>
              ${nextAct ? `
                <div class="mt-4 pt-3 border-t border-[#142252] flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Próxima actividad: <strong class="text-white">${nextAct.name}</strong></span>
                  <span>Lugar: <strong class="text-white">${nextAct.location}</strong></span>
                </div>
              ` : ''}
            </div>

            <!-- DESAFÍOS CREATIVOS IA -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              ${sorted.map(item => `
                <div class="bg-[#0A1333] border ${item.border} rounded-2xl p-4 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-display font-black uppercase ${item.textAccent}">${item.name}</span>
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded border ${item.delivered ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800' : 'text-slate-500 bg-slate-900 border-slate-800'}">
                      ${item.delivered ? '✓ Entregado (4.000 pts)' : 'Pendiente'}
                    </span>
                  </div>
                  <h4 class="text-sm font-bold text-white">${item.desafioName}</h4>
                  <p class="text-[11px] text-slate-400 leading-relaxed font-sans">
                    ${item.desafioDesc}
                  </p>
                  ${item.isFav ? `
                    <div class="mt-2 text-[10px] font-mono text-amber-300 bg-amber-950/50 border border-amber-800 p-1 rounded flex items-center gap-1 font-bold">
                      <i data-lucide="crown" class="w-3 h-3"></i> Mención de Honor Docente
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>

          </div>
        `)}

      </div>

      <!-- ======================================================== -->
      <!-- FOOTER PROYECTOR: RADIO TICKER Y GUÍA DE TECLADO        -->
      <!-- ======================================================== -->
      <div class="relative z-10 border-t border-[#142252] pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-mono shrink-0">
        
        <!-- Marquee de Avisos en Vivo -->
        <div class="flex items-center gap-2 overflow-hidden max-w-3xl w-full">
          <i data-lucide="radio" class="w-4 h-4 text-[#E6194B] shrink-0 animate-pulse"></i>
          <span class="text-slate-500 font-bold text-[10px] uppercase shrink-0">Avisos Oficiales:</span>
          <div class="overflow-hidden whitespace-nowrap w-full">
            <span id="bigscreen-marquee" class="animate-marquee font-medium text-slate-200">
              ${appData.announcements && appData.announcements.length > 0 ? appData.announcements.map(a => a.text).join(' ••• ') : 'Semana de las Carreras 2026 • TI & Diseño Digital • Sigue los resultados oficiales minuto a minuto.'}
            </span>
          </div>
        </div>

        <!-- Guía de Atajos Rápidos -->
        <div class="text-[10px] shrink-0 text-slate-500 hidden lg:flex items-center gap-2">
          <span>Atajos: <strong>[F11]</strong> Pantalla Completa</span>
          <span>•</span>
          <span><strong>[1/2/3]</strong> Vistas</span>
          <span>•</span>
          <span><strong>[R]</strong> Rotación</span>
          <span>•</span>
          <span><strong>[M]</strong> Audio</span>
          <span>•</span>
          <span><strong>[P / Esc]</strong> Salir</span>
        </div>

      </div>

    </div>
  `;
}

// 3. ACTIVIDADES DEL 19 (DISEÑO ESPORTS SYNTH-TECH POLISHED)
// ==========================================
let currentActFilter = 'all';

function setActFilter(group) {
  currentActFilter = group;
  const container = document.getElementById('app-container');
  if (container && currentTab === 'actividades') {
    container.innerHTML = renderActividades();
    lucide.createIcons();
  }
}

function renderActividades() {
  const allActs = appData.activities || [];
  
  // Conteo por categoría
  const counts = {
    all: allActs.length,
    Juegos: allActs.filter(a => a.group === 'Juegos').length,
    Deportes: allActs.filter(a => a.group === 'Deportes').length,
    Gymkanas: allActs.filter(a => a.group === 'Gymkanas').length,
    Música: allActs.filter(a => a.group === 'Música').length,
    Creativo: allActs.filter(a => a.group === 'Creativo').length
  };

  const acts = currentActFilter === 'all' 
    ? allActs 
    : allActs.filter(a => a.group === currentActFilter);

  return `
    <div class="space-y-6 max-w-6xl mx-auto">
      
      <!-- HEADER CON INFORMACIÓN CLAVE & FILTROS -->
      <div class="bg-[#0A1333] border-2 border-[#142252] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden glow-electric">
        <div class="absolute -right-10 -bottom-10 w-44 h-44 bg-[#2D46B9]/15 rounded-full blur-2xl pointer-events-none"></div>

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1.5">
              <span class="w-2.5 h-2.5 rounded-sm bg-[#E6194B] rotate-45 shadow-sm shadow-[#E6194B]"></span>
              <span class="text-[10px] font-display font-black uppercase tracking-widest text-[#7F9CF5]">
                JUEVES 19 DE NOVIEMBRE • 09:30 A 14:15 HRS
              </span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-display font-black text-white tracking-tight leading-none">
              Actividades en Cancha
            </h2>
            <p class="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
              Cronograma oficial de competencias por alianza • <strong>25.000 puntos reglamentarios</strong> en juego distribuidos en 8 bloques oficiales.
            </p>
          </div>

          <!-- Totalizador de Puntos -->
          <div class="flex items-center gap-3 shrink-0">
            <div class="bg-[#050C24] border border-[#142252] px-4 py-2.5 rounded-xl shadow-inner text-right">
              <span class="text-[10px] font-display font-bold uppercase text-slate-400 block leading-tight">Total en Juego</span>
              <span class="text-lg font-mono font-black text-white tracking-wide block">25.000 <span class="text-[#7F9CF5] text-xs">pts</span></span>
            </div>
          </div>
        </div>

        <!-- Barra de Filtros por Categoría -->
        <div class="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-[#142252]">
          <span class="text-[10px] font-display font-black uppercase text-slate-400 mr-1 hidden sm:inline">Filtrar:</span>
          
          <button onclick="setActFilter('all')" class="px-3 py-1.5 rounded-xl text-xs font-display font-bold transition flex items-center gap-1.5 ${currentActFilter === 'all' ? 'bg-[#2D46B9] text-white border border-[#7F9CF5] shadow-sm' : 'bg-[#050C24] text-slate-300 hover:text-white border border-[#142252] hover:border-[#2D46B9]'}">
            <span>Todas</span>
            <span class="text-[10px] font-mono px-1.5 py-0.2 rounded-full ${currentActFilter === 'all' ? 'bg-white/20 text-white' : 'bg-[#0A1333] text-slate-400'}">${counts.all}</span>
          </button>

          <button onclick="setActFilter('Juegos')" class="px-3 py-1.5 rounded-xl text-xs font-display font-bold transition flex items-center gap-1.5 ${currentActFilter === 'Juegos' ? 'bg-[#2D46B9] text-white border border-[#7F9CF5] shadow-sm' : 'bg-[#050C24] text-slate-300 hover:text-white border border-[#142252] hover:border-[#2D46B9]'}">
            <i data-lucide="gamepad-2" class="w-3.5 h-3.5 text-[#7F9CF5]"></i>
            <span>Juegos</span>
            <span class="text-[10px] font-mono px-1.5 py-0.2 rounded-full ${currentActFilter === 'Juegos' ? 'bg-white/20 text-white' : 'bg-[#0A1333] text-slate-400'}">${counts.Juegos}</span>
          </button>

          <button onclick="setActFilter('Deportes')" class="px-3 py-1.5 rounded-xl text-xs font-display font-bold transition flex items-center gap-1.5 ${currentActFilter === 'Deportes' ? 'bg-[#2D46B9] text-white border border-[#7F9CF5] shadow-sm' : 'bg-[#050C24] text-slate-300 hover:text-white border border-[#142252] hover:border-[#2D46B9]'}">
            <i data-lucide="trophy" class="w-3.5 h-3.5 text-amber-400"></i>
            <span>Deportes</span>
            <span class="text-[10px] font-mono px-1.5 py-0.2 rounded-full ${currentActFilter === 'Deportes' ? 'bg-white/20 text-white' : 'bg-[#0A1333] text-slate-400'}">${counts.Deportes}</span>
          </button>

          <button onclick="setActFilter('Gymkanas')" class="px-3 py-1.5 rounded-xl text-xs font-display font-bold transition flex items-center gap-1.5 ${currentActFilter === 'Gymkanas' ? 'bg-[#2D46B9] text-white border border-[#7F9CF5] shadow-sm' : 'bg-[#050C24] text-slate-300 hover:text-white border border-[#142252] hover:border-[#2D46B9]'}">
            <i data-lucide="flag" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>Gymkanas</span>
            <span class="text-[10px] font-mono px-1.5 py-0.2 rounded-full ${currentActFilter === 'Gymkanas' ? 'bg-white/20 text-white' : 'bg-[#0A1333] text-slate-400'}">${counts.Gymkanas}</span>
          </button>

          <button onclick="setActFilter('Música')" class="px-3 py-1.5 rounded-xl text-xs font-display font-bold transition flex items-center gap-1.5 ${currentActFilter === 'Música' ? 'bg-[#2D46B9] text-white border border-[#7F9CF5] shadow-sm' : 'bg-[#050C24] text-slate-300 hover:text-white border border-[#142252] hover:border-[#2D46B9]'}">
            <i data-lucide="music" class="w-3.5 h-3.5 text-purple-400"></i>
            <span>Música</span>
            <span class="text-[10px] font-mono px-1.5 py-0.2 rounded-full ${currentActFilter === 'Música' ? 'bg-white/20 text-white' : 'bg-[#0A1333] text-slate-400'}">${counts.Música}</span>
          </button>

          <button onclick="setActFilter('Creativo')" class="px-3 py-1.5 rounded-xl text-xs font-display font-bold transition flex items-center gap-1.5 ${currentActFilter === 'Creativo' ? 'bg-[#2D46B9] text-white border border-[#7F9CF5] shadow-sm' : 'bg-[#050C24] text-slate-300 hover:text-white border border-[#142252] hover:border-[#2D46B9]'}">
            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-rose-400"></i>
            <span>Creativo</span>
            <span class="text-[10px] font-mono px-1.5 py-0.2 rounded-full ${currentActFilter === 'Creativo' ? 'bg-white/20 text-white' : 'bg-[#0A1333] text-slate-400'}">${counts.Creativo}</span>
          </button>
        </div>

      </div>

      <!-- GRID DE TARJETAS ESPORTS SYNTH-TECH -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        ${acts.map(act => {
          const isFinished = act.status === 'Terminada';
          const isLive = act.status === 'En curso';

          const pT = act.pointsAwarded?.Terror || 0;
          const pS = act.pointsAwarded?.Shooter || 0;
          const pA = act.pointsAwarded?.Action || 0;

          // Franja de acento superior según grupo
          const accentGradient = act.group === 'Deportes' 
            ? 'from-amber-500/80 via-amber-400 to-amber-500/80' 
            : (act.group === 'Juegos' 
                ? 'from-[#2D46B9] via-[#7F9CF5] to-[#2D46B9]' 
                : (act.group === 'Gymkanas' 
                    ? 'from-emerald-500 via-teal-400 to-emerald-500' 
                    : (act.group === 'Música' 
                        ? 'from-purple-500 via-pink-500 to-purple-500' 
                        : 'from-[#E6194B] via-rose-400 to-[#E6194B]')));

          const groupIcon = act.group === 'Deportes' 
            ? '<i data-lucide="trophy" class="w-3 h-3 text-amber-400"></i>' 
            : (act.group === 'Juegos' 
                ? '<i data-lucide="gamepad-2" class="w-3 h-3 text-[#7F9CF5]"></i>' 
                : (act.group === 'Gymkanas' 
                    ? '<i data-lucide="flag" class="w-3 h-3 text-emerald-400"></i>' 
                    : (act.group === 'Música' 
                        ? '<i data-lucide="music" class="w-3 h-3 text-purple-400"></i>' 
                        : '<i data-lucide="sparkles" class="w-3 h-3 text-rose-400"></i>')));

          const groupColorText = act.group === 'Deportes' 
            ? 'text-amber-400' 
            : (act.group === 'Juegos' 
                ? 'text-[#7F9CF5]' 
                : (act.group === 'Gymkanas' 
                    ? 'text-emerald-400' 
                    : (act.group === 'Música' 
                        ? 'text-purple-400' 
                        : 'text-rose-400')));

          return `
            <div class="bg-[#0A1333] border-2 border-[#142252] hover:border-[#2D46B9] rounded-2xl p-5 flex flex-col justify-between transition group shadow-xl relative overflow-hidden hover:shadow-2xl hover:shadow-[#2D46B9]/15">
              
              <!-- Franja de acento superior sutil (Guía Esports) -->
              <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentGradient}"></div>

              <div>
                <!-- Barra superior de la tarjeta: Estado y Puntos Máximos -->
                <div class="flex items-center justify-between gap-2 mb-3 pt-1">
                  ${isFinished ? `
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-950/70 border border-emerald-500/60 text-emerald-400 shadow-sm">
                      <i data-lucide="check-circle-2" class="w-3 h-3 text-emerald-400"></i>
                      <span>Finalizada</span>
                    </span>
                  ` : (isLive ? `
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-amber-950/70 border border-amber-500/80 text-amber-300 animate-pulse shadow-sm shadow-amber-500/20">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                      <span>En Cancha</span>
                    </span>
                  ` : `
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold uppercase bg-[#050C24] border border-[#142252] text-slate-400">
                      <i data-lucide="clock" class="w-3 h-3 text-slate-500"></i>
                      <span>Pendiente</span>
                    </span>
                  `)}

                  <span class="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#050C24] text-[#7F9CF5] border border-[#142252] shadow-inner">
                    ${act.maxPoints.toLocaleString('es-CL')} pts
                  </span>
                </div>

                <!-- Categoría & Título -->
                <div>
                  <span class="inline-flex items-center gap-1.5 text-[10px] font-display font-black uppercase tracking-wider ${groupColorText} mb-1">
                    ${groupIcon}
                    <span>${act.group || 'Evento'}</span>
                  </span>
                  
                  <h3 class="text-base sm:text-lg font-display font-black text-white group-hover:text-[#7F9CF5] transition tracking-tight leading-snug">
                    ${act.name}
                  </h3>
                </div>

                <!-- Chips Separados de Horario y Ubicación (Sin solapamientos) -->
                <div class="flex flex-wrap items-center gap-2 mt-2.5">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#050C24] border border-[#142252] text-[11px] font-mono text-white font-semibold shadow-inner">
                    <i data-lucide="clock" class="w-3 h-3 text-[#7F9CF5]"></i>
                    <span>${act.time}</span>
                  </span>
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#050C24] border border-[#142252] text-[11px] font-mono text-slate-300 shadow-inner">
                    <i data-lucide="map-pin" class="w-3 h-3 text-[#7F9CF5]"></i>
                    <span class="truncate max-w-[200px]">${act.location}</span>
                  </span>
                </div>

                <!-- Descripción concisa -->
                <p class="text-xs text-slate-300 mt-3 leading-relaxed line-clamp-3">
                  ${act.description}
                </p>

                <!-- DISTRIBUCIÓN OFICIAL DE PUNTOS -->
                <div class="mt-4 pt-3.5 border-t border-[#142252]">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] font-display font-black uppercase tracking-wider text-slate-400">Distribución de Puntos</span>
                    <span class="text-[10px] font-mono text-slate-500 font-bold">100% / 60% / 30%</span>
                  </div>
                  
                  ${act.pointsDistribution ? `
                    <div class="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                      <div class="bg-[#050C24] border border-amber-500/40 py-1.5 px-2 rounded-xl shadow-inner">
                        <span class="text-[9px] text-amber-400 font-bold block uppercase font-display">🥇 1° Lugar</span>
                        <span class="font-black text-white text-xs mt-0.5 block">${act.pointsDistribution[0].toLocaleString('es-CL')} pts</span>
                      </div>
                      <div class="bg-[#050C24] border border-[#2D46B9]/50 py-1.5 px-2 rounded-xl shadow-inner">
                        <span class="text-[9px] text-[#7F9CF5] font-bold block uppercase font-display">🥈 2° Lugar</span>
                        <span class="font-bold text-slate-200 text-xs mt-0.5 block">${act.pointsDistribution[1].toLocaleString('es-CL')} pts</span>
                      </div>
                      <div class="bg-[#050C24] border border-[#142252] py-1.5 px-2 rounded-xl shadow-inner">
                        <span class="text-[9px] text-slate-400 font-bold block uppercase font-display">🥉 3° Lugar</span>
                        <span class="font-medium text-slate-300 text-xs mt-0.5 block">${act.pointsDistribution[2].toLocaleString('es-CL')} pts</span>
                      </div>
                    </div>
                  ` : `
                    <div class="bg-[#050C24] border border-emerald-500/40 py-2.5 px-3 rounded-xl flex items-center justify-between text-xs font-mono shadow-inner">
                      <span class="text-emerald-400 font-bold flex items-center gap-1.5"><i data-lucide="calculator" class="w-3.5 h-3.5"></i> Fórmula Oficial:</span>
                      <span class="text-white font-black">4.000 × (Promedio ÷ 6)</span>
                    </div>
                  `}
                </div>
              </div>

              <!-- ESTADO DE RESULTADOS / PUNTOS ASIGNADOS -->
              <div>
                ${isFinished ? `
                  <div class="mt-4 pt-3.5 border-t border-[#142252]">
                    <div class="flex items-center justify-between text-[11px] font-mono mb-2">
                      <span class="text-slate-400 font-display font-bold text-[10px] uppercase">Resultado Certificado:</span>
                      <span class="text-emerald-400 text-[10px] font-bold flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i> Validado</span>
                    </div>
                    <div class="grid grid-cols-3 gap-1.5 text-center text-xs font-mono">
                      <div class="bg-[#050C24] border border-[#E6194B]/70 py-1.5 px-1.5 rounded-lg">
                        <span class="text-[10px] text-red-400 block font-bold">Terror</span>
                        <span class="text-white font-black">${pT.toLocaleString('es-CL')}</span>
                      </div>
                      <div class="bg-[#050C24] border border-[#2D46B9]/70 py-1.5 px-1.5 rounded-lg">
                        <span class="text-[10px] text-blue-400 block font-bold">Shooter</span>
                        <span class="text-white font-black">${pS.toLocaleString('es-CL')}</span>
                      </div>
                      <div class="bg-[#050C24] border border-emerald-500/70 py-1.5 px-1.5 rounded-lg">
                        <span class="text-[10px] text-emerald-400 block font-bold">Action</span>
                        <span class="text-white font-black">${pA.toLocaleString('es-CL')}</span>
                      </div>
                    </div>
                  </div>
                ` : (isLive ? `
                  <div class="mt-4 pt-3.5 border-t border-[#142252]">
                    <div class="py-2.5 px-3 rounded-xl bg-amber-950/50 border border-amber-500/60 flex items-center justify-between text-xs font-mono text-amber-300 shadow-inner">
                      <span class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                        <span class="font-bold">Disputándose en Cancha</span>
                      </span>
                      <span class="text-[10px] text-amber-400 uppercase font-black tracking-wider bg-amber-900/60 px-2 py-0.5 rounded">En Vivo</span>
                    </div>
                  </div>
                ` : `
                  <div class="mt-4 pt-3.5 border-t border-[#142252]">
                    <div class="py-2 px-3 rounded-xl bg-[#050C24] border border-[#142252] flex items-center justify-between text-[11px] font-mono text-slate-400 shadow-inner">
                      <span class="flex items-center gap-1.5">
                        <i data-lucide="hourglass" class="w-3 h-3 text-[#7F9CF5]"></i>
                        <span>Puntos por disputarse</span>
                      </span>
                      <span class="text-[#7F9CF5] text-[10px] font-bold">19 de Noviembre</span>
                    </div>
                  </div>
                `)}

                <!-- BOTÓN ACCIÓN -->
                <button onclick="openActivityDetail('${act.id}')" class="w-full mt-3 py-2 rounded-xl bg-[#0E1E48] hover:bg-[#2D46B9] border border-[#2D46B9]/80 text-[#7F9CF5] hover:text-white text-xs font-display font-bold transition flex items-center justify-center gap-2 shadow-sm group-hover:border-[#7F9CF5]">
                  <i data-lucide="book-open" class="w-3.5 h-3.5 text-[#7F9CF5] group-hover:text-white transition"></i>
                  <span>Ver Ficha y Reglamento Oficial</span>
                  <i data-lucide="chevron-right" class="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform"></i>
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
            <span class="text-xs font-bold text-white">Entrega Oficial de la Obra</span>
            <span class="text-xs font-mono font-bold text-emerald-400">4.000 pts</span>
          </div>
          <p class="text-[11px] text-slate-500 leading-relaxed">
            Solo al llevar y presentar la obra terminada con sus respaldos dentro del plazo, la alianza asegura los 4.000 puntos para la tabla general.
          </p>
        </div>

        <div class="bg-slate-950 border border-slate-900 p-3.5 rounded-xl">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-white">Evaluación Docente</span>
            <span class="text-xs font-mono font-bold text-slate-400">Rúbrica (0-100)</span>
          </div>
          <p class="text-[11px] text-slate-500 leading-relaxed">
            Dos docentes califican cada obra según la rúbrica oficial. No otorga puntos a la tabla: sirve para comparar la calidad técnica y formativa.
          </p>
        </div>

        <div class="bg-slate-950 border border-slate-900 p-3.5 rounded-xl">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-white">Mención de Honor</span>
            <span class="text-xs font-mono font-bold text-indigo-400">Distinción Honorífica</span>
          </div>
          <p class="text-[11px] text-slate-500 leading-relaxed">
            Reconocimiento oficial a la obra con la calificación docente más alta de la semana (distinción de honor, sin sumar puntos).
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
              ${appData.alliances?.[alKey]?.tieBreak?.applied ? `
                <span class="text-[9px] text-amber-300 font-mono block mt-1 leading-tight">Desempate: ${appData.alliances[alKey].tieBreak.reason}</span>
              ` : ''}
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
              
              <div class="mt-2.5 text-[10px] text-slate-300 font-mono bg-[#050C24] p-2 rounded-xl border border-[#142252] shadow-inner">
                <div class="flex items-center justify-between">
                  <span class="truncate pr-1">Desafío: ${info.desafio}</span>
                  <span class="text-white font-bold shrink-0" style="color: ${info.themeColor};">#${appData.alliances?.[alKey]?.rank || '-'} Lugar</span>
                </div>
                ${appData.alliances?.[alKey]?.tieBreak?.applied ? `
                  <div class="text-[9px] text-amber-300 font-mono mt-1 pt-1 border-t border-[#142252] leading-tight">
                    Desempate: ${appData.alliances[alKey].tieBreak.reason}
                  </div>
                ` : ''}
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
                    ${alData.tieBreak?.applied ? `
                      <span class="text-[9px] text-amber-300 font-mono block mt-0.5 max-w-[160px] leading-tight">Desempate: ${alData.tieBreak.reason}</span>
                    ` : ''}
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
          <div class="bg-[#0A1333] border-2 border-[#142252] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#E6194B]"></span>
                <h4 class="font-bold text-white text-xs uppercase font-display">1. Por Lugar (Competencias Directas)</h4>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed">
                La alianza que queda 1ª se lleva el <strong>100%</strong> de los puntos, la 2ª el <strong>60%</strong> y la 3ª el <strong>30%</strong>.
              </p>
              <div class="mt-3 p-2.5 rounded-xl bg-[#050C24] border border-[#142252] text-[11px] font-mono text-slate-300 space-y-1">
                <span class="text-[#7F9CF5] block text-[10px] font-bold">Ejemplo Baby fútbol o Torneo Retro (Vale 4.000):</span>
                <div class="flex justify-between"><span>🥇 1ª Alianza:</span><strong class="text-white">4.000 pts (100%)</strong></div>
                <div class="flex justify-between"><span>🥈 2ª Alianza:</span><strong class="text-slate-300">2.400 pts (60%)</strong></div>
                <div class="flex justify-between"><span>🥉 3ª Alianza:</span><strong class="text-slate-400">1.200 pts (30%)</strong></div>
              </div>
            </div>
            <span class="text-[10px] font-mono text-slate-400 mt-2.5 block">Baby fútbol, Quemadas, Torneo retro, Taca-taca, Ping pong, Si te la sabes canta.</span>
          </div>

          <!-- Tipo 2 -->
          <div class="bg-[#0A1333] border-2 border-[#142252] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#2D46B9]"></span>
                <h4 class="font-bold text-white text-xs uppercase font-display">2. Por Promedio (Gymkanas)</h4>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed">
                Cada persona suma hasta <strong>6 puntos</strong>: 1 por intentar cada puesto y 1 por resolverlo (3 puestos de alternativas A, B, C y D).
              </p>
              <div class="mt-3 p-2.5 rounded-xl bg-[#050C24] border border-[#142252] text-[11px] font-mono text-slate-300 space-y-1">
                <span class="text-[#7F9CF5] block text-[10px] font-bold">Fórmula Oficial (Bases v2.3):</span>
                <div class="text-white font-bold text-xs">4.000 × (Promedio ÷ 6)</div>
                <div class="text-slate-400 text-[10px]">Ejemplo: Si el promedio es 4,5 de 6, la alianza recibe 3.000 pts.</div>
              </div>
            </div>
            <span class="text-[10px] font-mono text-slate-400 mt-2.5 block">No hay 1°, 2° ni 3° lugar: todas las alianzas suman según su rendimiento.</span>
          </div>

          <!-- Tipo 3 -->
          <div class="bg-[#0A1333] border-2 border-[#142252] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <h4 class="font-bold text-white text-xs uppercase font-display">3. Desafíos Creativos con IA</h4>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed">
                <strong>4.000 puntos</strong> para la alianza solo por llevar y entregar su obra única dentro del plazo reglamentario:
              </p>
              <div class="mt-3 p-2.5 rounded-xl bg-[#050C24] border border-[#142252] text-[11px] font-mono text-slate-300 space-y-1">
                <div><strong class="text-emerald-400">4.000 pts:</strong> Entrega a tiempo (hasta 10:15) y cumplimiento mínimo.</div>
                <div><strong class="text-[#7F9CF5]">Presentación Cancha:</strong> 13:15 a 14:15 hrs con 1 persona por alianza.</div>
                <div><strong class="text-amber-400">Mención de Honor:</strong> Mejor nota docente sobre 100 pts (sin puntos extra).</div>
              </div>
            </div>
            <span class="text-[10px] font-mono text-slate-400 mt-2.5 block">Una sola obra por alianza; evaluación técnica de dos docentes.</span>
          </div>

          <!-- Tipo 4 -->
          <div class="bg-[#0A1333] border-2 border-[#142252] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h4 class="font-bold text-white text-xs uppercase font-display">4. Sorpresa y Copa Tarreo</h4>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed">
                Actividades especiales que se anuncian durante la jornada y competencias nocturnas:
              </p>
              <div class="mt-3 p-2.5 rounded-xl bg-[#050C24] border border-[#142252] text-[11px] font-mono text-slate-300 space-y-1">
                <div><strong class="text-amber-400">Sorpresas en Cancha:</strong> Hasta 3.000 pts adicionales.</div>
                <div><strong class="text-[#7F9CF5]">Copa Tarreo (Viernes):</strong> Cazatesoros (1.500), Just Dance (1.500) y Mímica (1.000) = hasta 4.000 pts.</div>
              </div>
            </div>
            <span class="text-[10px] font-mono text-slate-400 mt-2.5 block">Los torneos individuales del tarreo tienen premios propios y no suman alianzas.</span>
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

      <!-- SECCIÓN OFICIAL DE PREMIOS DE NOTA AL CIERRE -->
      ${appData.eventClosed && appData.gradePrizes ? `
        <div class="bg-[#050C24] border-2 border-emerald-500/60 rounded-2xl p-5 space-y-4 shadow-xl">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#142252] pb-3">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">🎓</span>
              <div>
                <h3 class="font-bold font-display text-white text-base">Asignación Oficial de Premios de Nota</h3>
                <span class="text-xs text-emerald-400 font-mono">Evento cerrado y ratificado por: ${appData.eventClosedBy || 'Administración'}</span>
              </div>
            </div>
            <span class="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300">
              Veredicto Final
            </span>
          </div>

          <div class="space-y-4">
            ${['Terror', 'Shooter', 'Action'].map(alKey => {
              const prize = appData.gradePrizes[alKey] || {};
              const list = prize.beneficiaries || [];
              const colorMap = { Terror: 'text-red-400 border-red-900/60', Shooter: 'text-blue-400 border-blue-900/60', Action: 'text-emerald-400 border-emerald-900/60' };

              return `
                <div class="p-4 rounded-xl bg-[#0A1333]/40 border ${colorMap[alKey]} space-y-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span class="font-display font-bold text-white text-base">Alianza ${alKey}</span>
                      <span class="text-xs text-slate-400 font-mono block">Posición oficial: #${prize.rank}° Lugar • Bono: <strong>+${prize.gradeBonus} en nota</strong></span>
                    </div>
                    <span class="text-xs font-mono font-bold text-slate-300 px-2.5 py-1 rounded bg-[#050C24] border border-[#142252]">
                      ${prize.beneficiariesCount || 0} estudiantes con derecho a nota
                    </span>
                  </div>

                  <div class="pt-2 border-t border-[#142252]/80">
                    <span class="text-[11px] font-mono text-slate-400 block mb-2">Lista de participantes con asignación:</span>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                      ${list.length > 0 ? list.map((b, i) => `
                        <div class="p-2 rounded-lg bg-[#050C24] border border-[#142252] text-xs font-mono flex items-center justify-between">
                          <span class="text-slate-200 truncate pr-1">${i + 1}. ${b.name}</span>
                          <span class="text-emerald-400 font-bold shrink-0">+${b.gradeBonus}</span>
                        </div>
                      `).join('') : '<span class="text-xs text-slate-500 font-mono">Sin participantes registrados en cancha</span>'}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : `
        <div class="p-4 rounded-xl bg-[#0A1333]/30 border border-[#142252] text-xs text-slate-400 font-mono flex items-center gap-3">
          <i data-lucide="info" class="w-5 h-5 text-indigo-400 shrink-0"></i>
          <span>La asignación nominal de puntos de nota (+1,0, +0,5 y +0,3) se habilitará al cierre oficial del evento por decisión de Jefatura, para todos los estudiantes con participación efectiva registrada en al menos una actividad.</span>
        </div>
      `}

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
    <div class="bg-gradient-to-b from-red-950/40 via-[#0A1333] to-[#050C24] p-4 sm:p-5 rounded-2xl border-2 border-[#E6194B]/60 space-y-3.5 shadow-xl glow-crimson">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-[#E6194B] animate-pulse"></span>
        <span class="text-xs font-display font-black uppercase text-red-400">Reglamento Oficial • 6.3 Torneo Retro (Mortal Kombat)</span>
      </div>
      <p class="text-sm font-semibold text-white leading-snug">
        “Todas las alianzas juegan entre sí en duelos uno contra uno, cada victoria suma 1 punto y gana la alianza con más victorias acumuladas.”
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1">
          <strong class="text-white block font-display text-[11px] uppercase text-amber-400">👥 Quiénes Juegan</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            <strong>4 jugadores titulares + 1 suplente</strong> por alianza (12 en total). Cada jugador pelea 2 veces (una contra cada alianza rival).
          </p>
        </div>

        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1">
          <strong class="text-white block font-display text-[11px] uppercase text-[#7F9CF5]">⚔️ Enfrentamientos</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            3 cruces: Terror vs Shooter, Terror vs Action y Shooter vs Action. <strong>4 duelos 1v1 al mejor de 3 rondas</strong> por cruce.
          </p>
        </div>

        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1">
          <strong class="text-white block font-display text-[11px] uppercase text-emerald-400">🏆 Puntaje Reglamentario</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            <strong>1° 4.000 pts</strong>, <strong>2° 2.400 pts</strong>, <strong>3° 1.200 pts</strong>. Desempate: rondas ganadas, luego duelo extra sorteado.
          </p>
        </div>

        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1">
          <strong class="text-white block font-display text-[11px] uppercase text-purple-400">🕹️ Controles y Formato</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Controles arcade USB. Fatalities opcionales (adorno). Si falta un jugador, entra el suplente.
          </p>
        </div>
      </div>
    </div>
    `;
  } else if (act.id === 'tacataca') {
    activityCustomHtml = `
    <!-- FICHA OFICIAL TACA-TACA -->
    <div class="bg-gradient-to-b from-blue-950/40 via-[#0A1333] to-[#050C24] p-4 sm:p-5 rounded-2xl border-2 border-[#2D46B9]/60 space-y-3.5 shadow-xl glow-electric">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-[#7F9CF5] animate-pulse"></span>
        <span class="text-xs font-display font-black uppercase text-[#7F9CF5]">Reglamento Oficial • 6.4 Taca-taca</span>
      </div>
      <p class="text-sm font-semibold text-white leading-snug">
        “Partidos de duplas todos contra todos a 5 goles en simultáneo con ping pong y torneo retro.”
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1">
          <strong class="text-white block font-display text-[11px] uppercase text-amber-400">👥 Participantes</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            <strong>1 dupla titular + 1 suplente</strong> por alianza. Cada persona juega en una sola dupla.
          </p>
        </div>
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1">
          <strong class="text-white block font-display text-[11px] uppercase text-[#7F9CF5]">⚽ Formato</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Partidos a <strong>5 goles</strong>. 3 partidos en total (cada dupla juega 2). 1 victoria = 1 punto.
          </p>
        </div>
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1 sm:col-span-2">
          <strong class="text-white block font-display text-[11px] uppercase text-emerald-400">🏆 Puntos y Desempate</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            <strong>1° 1.500 pts</strong>, <strong>2° 900 pts</strong>, <strong>3° 450 pts</strong>. Desempate: mejor diferencia de goles, luego partido extra por sorteo.
          </p>
        </div>
      </div>
    </div>
    `;
  } else if (act.id === 'pingpong') {
    activityCustomHtml = `
    <!-- FICHA OFICIAL PING PONG -->
    <div class="bg-gradient-to-b from-blue-950/40 via-[#0A1333] to-[#050C24] p-4 sm:p-5 rounded-2xl border-2 border-[#2D46B9]/60 space-y-3.5 shadow-xl glow-electric">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-[#7F9CF5] animate-pulse"></span>
        <span class="text-xs font-display font-black uppercase text-[#7F9CF5]">Reglamento Oficial • 6.5 Ping Pong</span>
      </div>
      <p class="text-sm font-semibold text-white leading-snug">
        “Duelos individuales todos contra todos a 7 puntos en la pared de la cancha.”
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1">
          <strong class="text-white block font-display text-[11px] uppercase text-amber-400">👥 Participantes</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            <strong>1 jugador titular + 1 suplente</strong> por alianza. Cada alianza juega 2 partidos.
          </p>
        </div>
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1">
          <strong class="text-white block font-display text-[11px] uppercase text-[#7F9CF5]">🏓 Formato</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Partidos a <strong>7 puntos</strong>. 1 victoria = 1 punto para la alianza.
          </p>
        </div>
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1 sm:col-span-2">
          <strong class="text-white block font-display text-[11px] uppercase text-emerald-400">🏆 Puntos y Desempate</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            <strong>1° 1.500 pts</strong>, <strong>2° 900 pts</strong>, <strong>3° 450 pts</strong>. Desempate: mejor diferencia de puntos, luego partido extra por sorteo.
          </p>
        </div>
      </div>
    </div>
    `;
  } else if (act.id === 'gymkanas') {
    activityCustomHtml = `
    <!-- FICHA OFICIAL GYMKANAS -->
    <div class="bg-gradient-to-b from-emerald-950/40 via-[#0A1333] to-[#050C24] p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/60 space-y-3.5 shadow-xl">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="text-xs font-display font-black uppercase text-emerald-400">Reglamento Oficial • 6.6 Gymkanas (3 Puestos)</span>
      </div>
      <p class="text-sm font-semibold text-white leading-snug">
        “Dos gymkanas en paralelo (Informática y Diseño). Todas las alianzas suman según su promedio por persona.”
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1">
          <strong class="text-white block font-display text-[11px] uppercase text-amber-400">📍 3 Puestos de Preguntas</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Preguntas de alternativas (A, B, C y D). Si acierta pasa al siguiente; si falla vuelve a la fila con otra pregunta.
          </p>
        </div>
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1">
          <strong class="text-white block font-display text-[11px] uppercase text-blue-400">⏱️ Duración y Modalidad</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            De 10:30 a 11:00 (30 min) en toda la cancha. Entrada libre: solos o en pareja.
          </p>
        </div>
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1 sm:col-span-2">
          <strong class="text-white block font-display text-[11px] uppercase text-emerald-400">📊 Puntos y Fórmula</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            1 pt por intentar cada puesto y 1 extra por resolver (máx 6 pts por persona). <strong>Puntos = 4.000 × (Promedio ÷ 6)</strong>.
          </p>
        </div>
      </div>
    </div>
    `;
  } else if (act.id === 'babyfutbol') {
    activityCustomHtml = `
    <!-- FICHA OFICIAL BABY FÚTBOL -->
    <div class="bg-gradient-to-b from-blue-950/40 via-[#0A1333] to-[#050C24] p-4 sm:p-5 rounded-2xl border-2 border-[#2D46B9]/60 space-y-3.5 shadow-xl glow-electric">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-[#7F9CF5] animate-pulse"></span>
        <span class="text-xs font-display font-black uppercase text-[#7F9CF5]">Reglamento Oficial • 6.7 Baby Fútbol</span>
      </div>
      <p class="text-sm font-semibold text-white leading-snug">
        “5 contra 5 en el centro de la cancha, con equipo fijo en ambos partidos.”
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1">
          <strong class="text-white block font-display text-[11px] uppercase text-amber-400">👥 Equipo (5 vs 5)</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            5 titulares con arquero. Equipo fijo en sus dos partidos reglamentarios.
          </p>
        </div>
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1">
          <strong class="text-white block font-display text-[11px] uppercase text-blue-400">⏱️ Partidos</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Un tiempo de <strong>8 minutos por partido</strong>, sin tiempo extra. Árbitro oficial de la organización.
          </p>
        </div>
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1 sm:col-span-2">
          <strong class="text-white block font-display text-[11px] uppercase text-emerald-400">🏆 Puntos y Desempate</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Victoria 3 pts, empate 1, derrota 0. Puntos por lugar: <strong>1° 4.000, 2° 2.400, 3° 1.200</strong>. Desempate: dif. de goles, goles a favor, penales (3 lanzadores).
          </p>
        </div>
      </div>
    </div>
    `;
  } else if (act.id === 'quemadas') {
    activityCustomHtml = `
    <!-- FICHA OFICIAL QUEMADAS (6.8) -->
    <div class="bg-gradient-to-b from-amber-950/40 via-[#0A1333] to-[#050C24] p-4 sm:p-5 rounded-2xl border-2 border-amber-500/60 space-y-3.5 shadow-xl">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
        <span class="text-xs font-display font-black uppercase text-amber-400">Reglamento Oficial • 6.8 Quemadas</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1">
          <strong class="text-white block font-display text-[11px] uppercase text-amber-400">👥 Participantes (8 vs 8)</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            <strong>8 contra 8 en cancha</strong> con equipo fijo sin rotación en los dos partidos.
          </p>
        </div>

        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1">
          <strong class="text-white block font-display text-[11px] uppercase text-blue-400">⏱️ Rondas sin Límite</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            3 rondas por partido. Parte sin límite de tiempo (la animación puede fijar límite si se alarga).
          </p>
        </div>

        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1 sm:col-span-2">
          <strong class="text-white block font-display text-[11px] uppercase text-red-400">🛡️ Reglas y Balón</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Balones blandos certificados, <strong>sin pegar a la cabeza</strong>. Si se atrapa la pelota en el aire, <strong>queda eliminado quien la lanzó</strong>.
          </p>
        </div>

        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1 sm:col-span-2">
          <strong class="text-white block font-display text-[11px] uppercase text-emerald-400">🏆 Puntos y Criterios</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Victoria 3 pts, empate 1, derrota 0. Puntos por lugar: <strong>1° 4.000, 2° 2.400, 3° 1.200</strong>. Desempate: rondas ganadas, luego jugadores en pie.
          </p>
        </div>
      </div>
    </div>
    `;
  } else if (act.id === 'canto') {
    activityCustomHtml = `
    <!-- FICHA OFICIAL SI TE LA SABES, CANTA -->
    <div class="bg-gradient-to-b from-purple-950/40 via-[#0A1333] to-[#050C24] p-4 sm:p-5 rounded-2xl border-2 border-purple-500/60 space-y-3.5 shadow-xl">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse"></span>
        <span class="text-xs font-display font-black uppercase text-purple-400">Reglamento Oficial • 6.9 Si te la sabes, canta</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1">
          <strong class="text-white block font-display text-[11px] uppercase text-amber-400">👥 Fila de 5 Voluntarios</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Cada alianza arma una fila de <strong>5 personas</strong>. Nadie está obligado a cantar.
          </p>
        </div>
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1">
          <strong class="text-white block font-display text-[11px] uppercase text-blue-400">🎵 Dinámica</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Suena fragmento de 10-15s. Quien sale y canta las 2 frases siguientes sale de la fila.
          </p>
        </div>
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1 sm:col-span-2">
          <strong class="text-white block font-display text-[11px] uppercase text-emerald-400">🏆 Ganador y Puntos</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Gana la alianza que vacía primero su fila (tope 15 min con cronómetro). <strong>1° 2.000 pts, 2° 1.200 pts, 3° 600 pts</strong>. Desempate: canción extra.
          </p>
        </div>
      </div>
    </div>
    `;
  } else if (act.id === 'desafios') {
    activityCustomHtml = `
    <!-- FICHA OFICIAL PRESENTACIÓN DESAFÍOS -->
    <div class="bg-gradient-to-b from-rose-950/40 via-[#0A1333] to-[#050C24] p-4 sm:p-5 rounded-2xl border-2 border-rose-500/60 space-y-3.5 shadow-xl">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse"></span>
        <span class="text-xs font-display font-black uppercase text-rose-400">Reglamento Oficial • Sección 4 y 6.2 Presentación de Desafíos</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1">
          <strong class="text-white block font-display text-[11px] uppercase text-emerald-400">⏱️ Entrega Reglamentaria</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Jueves 19 hasta las <strong>10:15 hrs</strong>. Entregar la obra única da los <strong>4.000 puntos completos</strong> a la alianza.
          </p>
        </div>
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1">
          <strong class="text-white block font-display text-[11px] uppercase text-blue-400">🎤 Presentación en Cancha</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            De <strong>13:15 a 14:15 hrs</strong> en la cancha. 1 persona por alianza presenta la obra ante dos docentes evaluadores.
          </p>
        </div>
        <div class="p-3 bg-[#050C24] rounded-xl border border-[#142252] space-y-1 sm:col-span-2">
          <strong class="text-white block font-display text-[11px] uppercase text-amber-400">🎖️ Mención de Honor</strong>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Dos docentes califican sobre 100 pts con rúbrica técnica (Excelente 100%, Bueno 80%, Regular 50%, Básico 20%). La mejor nota recibe la Mención de Honor (sin sumar puntos adicionales).
          </p>
        </div>
      </div>
    </div>
    `;
  } else {
    activityCustomHtml = `
    <div class="bg-[#050C24] p-4 rounded-2xl border border-[#142252] text-xs text-slate-300 leading-relaxed">
      <strong class="text-white block mb-1">Descripción y Reglamento:</strong>
      ${act.description || 'Competencia reglamentaria oficial de la Semana de las Carreras 2026.'}
    </div>
    `;
  }

  content.innerHTML = `
    <div class="space-y-4">
      <div class="border-b-2 border-[#142252] pb-3.5">
        <span class="text-[10px] font-display font-black uppercase tracking-wider text-[#E6194B]">${act.group || 'Competencia'}</span>
        <h3 class="text-2xl font-black font-display text-white mt-1 tracking-tight">${act.name}</h3>
        <span class="text-xs text-slate-300 font-mono flex items-center gap-1.5 mt-1">
          <i data-lucide="map-pin" class="w-3.5 h-3.5 text-[#7F9CF5]"></i>
          <span>${act.location} • <strong class="text-white">${act.time}</strong></span>
        </span>
      </div>

      ${activityCustomHtml}

      <div>
        <h4 class="text-[10px] font-display font-black uppercase tracking-wider text-[#7F9CF5] mb-2.5">
          Posición Oficial en Cancha
        </h4>
        ${isFinished && podium ? `
          <div class="grid grid-cols-3 gap-3 text-center font-display">
            <div class="bg-[#050C24] border-2 border-amber-500/80 p-3 rounded-xl shadow-md">
              <span class="text-[10px] text-amber-400 font-black uppercase block">🥇 1° Lugar</span>
              <span class="text-sm sm:text-base font-black text-white mt-1 block">${podium.first}</span>
            </div>
            <div class="bg-[#050C24] border-2 border-[#2D46B9]/80 p-3 rounded-xl shadow-md">
              <span class="text-[10px] text-[#7F9CF5] font-black uppercase block">🥈 2° Lugar</span>
              <span class="text-sm sm:text-base font-black text-slate-200 mt-1 block">${podium.second}</span>
            </div>
            <div class="bg-[#050C24] border-2 border-[#142252] p-3 rounded-xl shadow-md">
              <span class="text-[10px] text-slate-400 font-black uppercase block">🥉 3° Lugar</span>
              <span class="text-sm sm:text-base font-black text-slate-300 mt-1 block">${podium.third}</span>
            </div>
          </div>
        ` : `
          <div class="p-4 bg-[#050C24] border border-[#142252] rounded-xl text-center text-slate-400 text-xs font-mono">
            ${act.status === 'En curso' ? '⚡ Competencia disputándose actualmente en la cancha' : '⏳ Competencia pendiente por disputarse según programa'}
          </div>
        `}
      </div>

      <!-- BOTÓN DIRECTO: CÓMO SE CALCULÓ -->
      <div class="pt-3.5 border-t border-[#142252] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span class="text-[11px] text-[#7F9CF5] font-mono">Fórmula: 1° 100%, 2° 60%, 3° 30%</span>
        <button 
          onclick="document.getElementById('calc-modal').classList.add('hidden'); navigate('reglas')" 
          class="px-3.5 py-1.5 rounded-xl text-xs font-display font-bold bg-[#0E1E48] hover:bg-[#142252] text-[#7F9CF5] hover:text-white border border-[#2D46B9] transition flex items-center justify-center gap-1.5 shadow-sm"
        >
          <i data-lucide="calculator" class="w-3.5 h-3.5 text-[#7F9CF5]"></i>
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
        <h3 class="text-2xl font-black font-heading text-white mt-1">Evaluación de Obras con IA (4.000 pts por Entrega)</h3>
      </div>
      <p class="text-xs text-slate-300">
        Cada alianza que entrega su obra exclusiva asegura los <strong>4.000 puntos</strong> reglamentarios. La comisión docente evalúa la calidad técnica para otorgar la <strong>Mención de Honor</strong> como distinción especial (sin sumar puntos adicionales a la competencia).
      </p>
      <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
        Mención de Honor Docente: <strong class="text-white">${fav ? `Alianza ${fav}` : 'En proceso de evaluación'}</strong>
      </div>
      <div class="grid grid-cols-3 gap-3 text-center font-mono">
        <div class="bg-slate-900/60 border border-red-900/40 p-3 rounded-xl">
          <span class="text-xs text-red-400 font-bold block">Terror</span>
          <span class="text-xs font-bold text-slate-200 mt-1 block">${(status.Terror && status.Terror.delivered) ? 'Entregado (4.000 pts)' : (status.Terror === 'Entregado' ? 'Entregado (4.000 pts)' : 'Sin Entregar (0 pts)')}</span>
        </div>
        <div class="bg-slate-900/60 border border-blue-900/40 p-3 rounded-xl">
          <span class="text-xs text-blue-400 font-bold block">Shooter</span>
          <span class="text-xs font-bold text-slate-200 mt-1 block">${(status.Shooter && status.Shooter.delivered) ? 'Entregado (4.000 pts)' : (status.Shooter === 'Entregado' ? 'Entregado (4.000 pts)' : 'Sin Entregar (0 pts)')}</span>
        </div>
        <div class="bg-slate-900/60 border border-emerald-900/40 p-3 rounded-xl">
          <span class="text-xs text-emerald-400 font-bold block">Action</span>
          <span class="text-xs font-bold text-slate-200 mt-1 block">${(status.Action && status.Action.delivered) ? 'Entregado (4.000 pts)' : (status.Action === 'Entregado' ? 'Entregado (4.000 pts)' : 'Sin Entregar (0 pts)')}</span>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  lucide.createIcons();
}
