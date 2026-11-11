/**
 * MÓDULO PÚBLICO "MI ALIANZA 2026" - SEMANA DE LAS CARRERAS
 * Área Tecnologías de la Información & Diseño Digital - Sede Antofagasta
 * 
 * Privacidad Estricta:
 * - El RUT solo se usa para autenticación y NUNCA se muestra en pantalla.
 * - Toda solicitud es revisada y aprobada manualmente por la coordinación.
 */

// Metadatos de Alianzas según Libro de Estilo Synth-Tech / Esports
const ALLIANCE_META = {
  Terror: {
    name: 'Alianza Terror',
    carrera: 'Informática & Analista Programador',
    desafio: 'Videojuego con IA (Godot/Unity)',
    mascotImg: 'img/mascota-terror.png',
    themeColor: '#E6194B',
    glowClass: 'glow-crimson',
    shadowColor: 'rgba(230,25,75,0.7)',
    badgeColor: 'text-[#E6194B] bg-[#E6194B]/10 border-[#E6194B]/40',
    ribbonBg: 'bg-[#E6194B]',
    borderColor: 'border-[#E6194B]'
  },
  Shooter: {
    name: 'Alianza Shooter',
    carrera: 'Informática & Analista Programador',
    desafio: 'Asistente con IA (Local/API)',
    mascotImg: 'img/mascota-shooter.png',
    themeColor: '#2D46B9',
    glowClass: 'glow-electric',
    shadowColor: 'rgba(45,70,185,0.7)',
    badgeColor: 'text-[#7F9CF5] bg-[#2D46B9]/15 border-[#2D46B9]/40',
    ribbonBg: 'bg-[#2D46B9]',
    borderColor: 'border-[#2D46B9]'
  },
  Action: {
    name: 'Alianza Action',
    carrera: 'Diseño e Industria Digital',
    desafio: 'Collage Digital / Identidad Visual',
    mascotImg: 'img/mascota-action.png',
    themeColor: '#059669',
    glowClass: 'glow-rim',
    shadowColor: 'rgba(5,150,105,0.7)',
    badgeColor: 'text-emerald-400 bg-[#059669]/15 border-[#059669]/40',
    ribbonBg: 'bg-[#059669]',
    borderColor: 'border-[#059669]'
  }
};

// Estado en memoria (CERO RUTs en variables o almacenamiento)
let currentUser = null; // { id, name, carrera, alliance }
let currentRequest = null; // { id, currentAlliance, targetAlliance, status, reason, rejectReason, createdAt, ... }
let sessionToken = null;
let sessionInterval = null;
let sessionSecondsRemaining = 15 * 60;
let globalStats = null;
let termsAccepted = false;

// Configuración dinámica de endpoint base (Soporte dual: Vercel en la nube y archivo local file://)
function getApiBase() {
  if (typeof window !== 'undefined' && (window.location.protocol === 'file:' || !window.location.host)) {
    return 'https://semanacarr.vercel.app';
  }
  return '';
}
let API_BASE = getApiBase();

async function detectApiBase() {
  if (typeof window !== 'undefined' && (window.location.protocol === 'file:' || !window.location.host)) {
    for (const port of [5173, 3000]) {
      try {
        const localTest = await fetch(`http://localhost:${port}/api/public/alliance/stats`, { signal: AbortSignal.timeout(300) });
        if (localTest.ok) {
          API_BASE = `http://localhost:${port}`;
          return;
        }
      } catch (_) {}
    }
    API_BASE = 'https://semanacarr.vercel.app';
  }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  await detectApiBase();
  loadGlobalStats();
  checkExistingSession();
  if (window.lucide) lucide.createIcons();
});

// ==========================================
// FORMATEO Y VALIDACIÓN DE RUT (CLIENTE)
// ==========================================
function cleanRut(rut) {
  return (rut || '').toString().toUpperCase().replace(/[^0-9K]/g, '');
}

function formatRutInput(input) {
  let val = cleanRut(input.value);
  if (val.length === 0) {
    input.value = '';
    return;
  }
  let dv = val.slice(-1);
  let cuerpo = val.slice(0, -1);

  if (cuerpo.length === 0) {
    input.value = dv;
    return;
  }

  // Formatear cuerpo con puntos
  let cuerpoPuntos = '';
  while (cuerpo.length > 3) {
    cuerpoPuntos = '.' + cuerpo.slice(-3) + cuerpoPuntos;
    cuerpo = cuerpo.slice(0, -3);
  }
  cuerpoPuntos = cuerpo + cuerpoPuntos;
  input.value = `${cuerpoPuntos}-${dv}`;
}

function validateClientRut(rawRut) {
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

// ==========================================
// ESTADÍSTICAS GLOBALES
// ==========================================
async function loadGlobalStats() {
  try {
    const res = await fetch(`${API_BASE}/api/public/alliance/stats`);
    if (!res.ok) return;
    const data = await res.json();
    globalStats = data;

    const t = data.counts?.Terror || 126;
    const s = data.counts?.Shooter || 126;
    const a = data.counts?.Action || 29;
    const total = t + s + a;

    const bT = document.getElementById('count-terror-badge');
    const bS = document.getElementById('count-shooter-badge');
    const bA = document.getElementById('count-action-badge');
    const bTotal = document.getElementById('global-registered-count-badge');

    if (bT) bT.textContent = `${t} alumnos`;
    if (bS) bS.textContent = `${s} alumnos`;
    if (bA) bA.textContent = `${a} alumnos`;
    if (bTotal) bTotal.textContent = `Padrón Oficial • ${total} Estudiantes Registrados`;

    // Actualizar indicador de topbar
    const statusText = document.getElementById('topbar-status-text');
    if (statusText) {
      if (!data.config?.open) {
        statusText.textContent = 'Recepción Cerrada';
      } else {
        statusText.textContent = 'Portal Oficial Activo';
      }
    }
  } catch (err) {
    console.warn('No se pudieron obtener estadísticas en tiempo real:', err);
  }
}

// ==========================================
// SESIÓN Y AUTENTICACIÓN SEGURA
// ==========================================
function checkExistingSession() {
  const savedToken = sessionStorage.getItem('pub_session_token');
  const savedExpires = sessionStorage.getItem('pub_session_expires');

  if (savedToken && savedExpires) {
    const expTime = parseInt(savedExpires, 10);
    const now = Date.now();
    if (now < expTime) {
      sessionToken = savedToken;
      sessionSecondsRemaining = Math.max(10, Math.floor((expTime - now) / 1000));
      fetchMyProfile();
      return;
    }
  }
  // Si no hay sesión válida
  showPublicHome();
}

async function fetchMyProfile() {
  try {
    const res = await fetch(`${API_BASE}/api/public/alliance/my-request`, {
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    });
    if (!res.ok) {
      logout();
      return;
    }
    const data = await res.json();
    currentUser = data.student;
    currentRequest = data.request;
    startSessionTimer();
    renderStudentPortal();
  } catch (err) {
    console.error('Error al restaurar sesión:', err);
    logout();
  }
}

function startSessionTimer() {
  if (sessionInterval) clearInterval(sessionInterval);

  sessionInterval = setInterval(() => {
    sessionSecondsRemaining--;
    updateSessionDisplay();

    if (sessionSecondsRemaining <= 0) {
      clearInterval(sessionInterval);
      alert('Tu sesión ha expirado por inactividad (15 minutos). Por seguridad, vuelve a ingresar tu RUT.');
      logout();
    }
  }, 1000);

  updateSessionDisplay();
}

function updateSessionDisplay() {
  const mins = Math.floor(sessionSecondsRemaining / 60);
  const secs = sessionSecondsRemaining % 60;
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const topbar = document.getElementById('topbar-session-container');
  if (topbar && currentUser) {
    topbar.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-[#0A1333] border border-[#2D46B9] text-[#7F9CF5]">
          <i data-lucide="clock" class="w-3 h-3 text-[#7F9CF5]"></i>
          <span>Sesión: ${timeStr}</span>
        </span>
        <button 
          onclick="logout()" 
          class="px-2.5 py-1 rounded-md text-[10px] font-display font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-[#050C24] hover:bg-[#E6194B]/20 border border-[#142252] hover:border-[#E6194B] transition flex items-center gap-1"
          title="Cerrar Sesión Segura"
        >
          <i data-lucide="log-out" class="w-3 h-3 text-[#E6194B]"></i>
          <span class="hidden sm:inline">Salir</span>
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }
}

// ==========================================
// MODAL DE LOGIN CON RUT
// ==========================================
function openRutModal() {
  const modal = document.getElementById('rut-modal');
  const errorBox = document.getElementById('login-error-box');
  const input = document.getElementById('rut-input');
  if (errorBox) errorBox.classList.add('hidden');
  if (input) {
    input.value = '';
    setTimeout(() => input.focus(), 150);
  }
  if (modal) modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeRutModal() {
  const modal = document.getElementById('rut-modal');
  if (modal) modal.classList.add('hidden');
}

async function handleRutLogin(event) {
  event.preventDefault();
  const input = document.getElementById('rut-input');
  const errorBox = document.getElementById('login-error-box');
  const errorText = document.getElementById('login-error-text');
  const submitBtn = document.getElementById('submit-rut-btn');

  const rawRut = input.value.trim();

  // Validación básica de formato y DV en el navegador
  if (!validateClientRut(rawRut)) {
    if (errorBox && errorText) {
      errorText.textContent = 'El RUT ingresado no es válido o el dígito verificador es incorrecto.';
      errorBox.classList.remove('hidden');
    }
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      <span>Consultando padrón oficial...</span>
    `;
  }
  if (errorBox) errorBox.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE}/api/public/alliance/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rut: rawRut })
    });

    const data = await res.json();

    if (!res.ok) {
      if (errorBox && errorText) {
        errorText.textContent = data.error || 'RUT no registrado en el padrón oficial o datos incorrectos.';
        errorBox.classList.remove('hidden');
      }
      return;
    }

    // Login Exitoso: Guardar token temporal de 15 minutos (NUNCA EL RUT)
    sessionToken = data.token;
    currentUser = data.student;
    currentRequest = data.request;

    const expiresAt = Date.now() + 15 * 60 * 1000;
    sessionStorage.setItem('pub_session_token', sessionToken);
    sessionStorage.setItem('pub_session_expires', expiresAt.toString());

    sessionSecondsRemaining = 15 * 60;
    startSessionTimer();

    closeRutModal();
    renderStudentPortal();
  } catch (err) {
    if (errorBox && errorText) {
      errorText.textContent = 'Error de conexión con el servidor. Intente nuevamente.';
      errorBox.classList.remove('hidden');
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span>Ingresar y Ver Mi Alianza</span>
        <i data-lucide="arrow-right" class="w-4 h-4"></i>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }
}

// ==========================================
// NAVEGACIÓN Y VISTAS
// ==========================================
function goToHome() {
  if (currentUser) {
    renderStudentPortal();
  } else {
    showPublicHome();
  }
}

function showPublicHome() {
  const homeView = document.getElementById('public-home-view');
  const portalView = document.getElementById('student-portal-view');
  const topbar = document.getElementById('topbar-session-container');

  if (homeView) homeView.classList.remove('hidden');
  if (portalView) portalView.classList.add('hidden');

  if (topbar) {
    topbar.innerHTML = `
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-[#0E1E48] border border-[#2D46B9] text-[#7F9CF5]">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span id="topbar-status-text">${globalStats?.config?.open ? 'Portal Oficial Activo' : 'Recepción Cerrada'}</span>
      </span>
    `;
    if (window.lucide) lucide.createIcons();
  }
}

function logout() {
  sessionToken = null;
  currentUser = null;
  currentRequest = null;
  sessionStorage.removeItem('pub_session_token');
  sessionStorage.removeItem('pub_session_expires');
  if (sessionInterval) clearInterval(sessionInterval);

  showPublicHome();
}

// ==========================================
// RENDERIZADO DEL PORTAL DEL ESTUDIANTE
// (CERO RUTS MOSTRADOS)
// ==========================================
function renderStudentPortal() {
  const homeView = document.getElementById('public-home-view');
  const portalView = document.getElementById('student-portal-view');
  if (!portalView || !currentUser) return;

  if (homeView) homeView.classList.add('hidden');
  portalView.classList.remove('hidden');

  const meta = ALLIANCE_META[currentUser.alliance] || ALLIANCE_META.Terror;
  const isAction = currentUser.alliance === 'Action';
  const isOpen = globalStats?.config?.open !== false;

  // Determinar la alianza de destino si solicita cambio
  const targetAlliance = currentUser.alliance === 'Terror' ? 'Shooter' : (currentUser.alliance === 'Shooter' ? 'Terror' : null);
  const targetMeta = targetAlliance ? ALLIANCE_META[targetAlliance] : null;

  portalView.innerHTML = `
    <!-- HEADER DE BIENVENIDA -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#142252] pb-4">
      <div>
        <div class="inline-flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
          <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i>
          <span>Acreditación Oficial • Semana de las Carreras 2026</span>
        </div>
        <h2 class="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
          Tu Ficha de Jugador
        </h2>
      </div>

      <div class="flex items-center gap-2">
        <button 
          onclick="logout()" 
          class="px-3.5 py-1.5 rounded-xl bg-[#0A1333] hover:bg-[#142252] text-xs font-display font-bold text-slate-300 hover:text-white border border-[#142252] transition flex items-center gap-1.5"
        >
          <i data-lucide="log-out" class="w-3.5 h-3.5 text-[#E6194B]"></i>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>

    <!-- CARNET DE COMPETIDOR ESPORTS (CERO RUTS MOSTRADOS) -->
    <div class="relative bg-gradient-to-r from-[#0A1333] via-[#050C24] to-[#0A1333] border-2 rounded-3xl p-6 sm:p-8 shadow-2xl transition overflow-hidden ${meta.glowClass}" style="border-color: ${meta.themeColor};">
      
      <!-- Resplandor temático de fondo -->
      <div class="absolute -top-12 -left-12 w-64 h-64 blur-3xl rounded-full opacity-30 pointer-events-none" style="background-color: ${meta.themeColor};"></div>

      <div class="relative z-10 flex flex-col md:flex-row items-center gap-8">
        
        <!-- COLUMNA 1: MASCOTA OFICIAL TRANSPARENTE -->
        <div class="w-full md:w-52 flex flex-col items-center shrink-0">
          <div class="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
            <img 
              src="${meta.mascotImg}" 
              alt="${meta.name}" 
              class="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_25px_${meta.shadowColor}] hover:scale-105 transition duration-300"
            />
          </div>
          <span class="mt-2 text-[10px] font-display font-black tracking-widest text-slate-300 uppercase block">
            Mascota Oficial
          </span>
        </div>

        <!-- COLUMNA 2: DATOS DEL ESTUDIANTE (CERO RUTS) -->
        <div class="flex-1 w-full space-y-4">
          
          <div class="border-b border-[#142252] pb-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-3.5 py-1 rounded ${meta.ribbonBg} text-white font-display font-black text-xs uppercase tracking-wider shadow-md" style="transform: var(--banner-skew);">
                <span style="display:inline-block; transform: skewX(15deg);">${meta.name.toUpperCase()}</span>
              </span>
              <span class="text-xs font-mono font-bold text-slate-300 bg-[#050C24] border border-[#142252] px-2.5 py-0.5 rounded-full">
                Sede Antofagasta
              </span>
            </div>

            <h3 class="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              ${currentUser.name}
            </h3>

            <p class="text-xs sm:text-sm text-slate-300 font-mono mt-1">
              Carrera: <strong class="text-white">${currentUser.carrera}</strong>
            </p>
          </div>

          <!-- Datos de la Alianza y Desafío -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div class="bg-[#050C24] border border-[#142252] p-3 rounded-2xl">
              <span class="text-[10px] text-slate-400 uppercase font-display block">Desafío Oficial con IA</span>
              <span class="text-white font-bold mt-1 block truncate">${meta.desafio}</span>
            </div>

            <div class="bg-[#050C24] border border-[#142252] p-3 rounded-2xl">
              <span class="text-[10px] text-slate-400 uppercase font-display block">Acreditación</span>
              <span class="text-emerald-400 font-bold mt-1 flex items-center gap-1.5">
                <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                Estudiante Habilitado en Nómina
              </span>
            </div>
          </div>

          <div class="pt-1 flex items-center justify-between text-xs text-slate-400 font-display">
            <span>¡Viste los colores de tu alianza el 19 de Noviembre en cancha!</span>
          </div>

        </div>

      </div>
    </div>

    <!-- SECCIÓN DE GESTIÓN DE SOLICITUD DE CAMBIO -->
    <div class="pt-2">
      ${renderRequestSection(isAction, isOpen, targetAlliance, targetMeta)}
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

function renderRequestSection(isAction, isOpen, targetAlliance, targetMeta) {
  // CASO 1: Si el alumno es de Diseño (Action) -> Bloqueado por regla
  if (isAction) {
    return `
      <div class="bg-[#0A1333] border-2 border-[#059669]/60 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <i data-lucide="lock" class="w-4 h-4 text-emerald-400"></i>
            <span class="font-display font-black text-sm text-white uppercase">Alianza Action (Diseño e Industria Digital)</span>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed max-w-xl">
            La Alianza Action es exclusiva para la carrera de Diseño e Industria Digital y se encuentra cerrada. No admite solicitudes de cambio para resguardar la identidad del torneo.
          </p>
        </div>
        <span class="px-4 py-2 rounded-xl bg-[#059669]/20 border border-[#059669]/50 text-emerald-300 text-xs font-mono font-bold shrink-0 text-center">
          Alianza Cerrada
        </span>
      </div>
    `;
  }

  // CASO 2: Si el alumno YA tiene una solicitud registrada -> Mostrar Stepper de Estado
  if (currentRequest) {
    return renderRequestTimeline(currentRequest);
  }

  // CASO 3: Si el periodo está cerrado
  if (!isOpen) {
    return `
      <div class="bg-[#0A1333] border-2 border-[#142252] rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <i data-lucide="calendar-x" class="w-4 h-4 text-[#E6194B]"></i>
            <span class="font-display font-black text-sm text-white uppercase">Periodo de Solicitudes Finalizado</span>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed max-w-xl">
            El plazo oficial para solicitar cambios de alianza ha finalizado. A partir de este momento, cualquier ajuste extraordinario solo puede ser gestionado en persona en la mesa de control de la sede.
          </p>
        </div>
        <span class="px-4 py-2 rounded-xl bg-[#050C24] border border-[#142252] text-slate-400 text-xs font-mono font-bold shrink-0 text-center">
          Recepción Cerrada
        </span>
      </div>
    `;
  }

  // CASO 4: Habilitado para solicitar cambio entre Terror y Shooter
  return `
    <div class="bg-gradient-to-r from-[#0A1333] via-[#050C24] to-[#0A1333] border-2 border-[#2D46B9] rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 glow-electric">
      <div class="space-y-1.5">
        <span class="text-[10px] font-display font-black uppercase tracking-widest text-[#E6194B]">
          /// REASIGNACIÓN DE ESCUADRÓN
        </span>
        <h4 class="text-lg sm:text-xl font-black font-display text-white tracking-tight">
          ¿Deseas solicitar cambio a ${targetMeta?.name}?
        </h4>
        <p class="text-xs text-slate-300 max-w-xl leading-relaxed">
          Puedes solicitar traslado voluntario a <strong class="text-white">${targetMeta?.name}</strong>. Tu solicitud quedará sujeta al balance de cupos y requerirá aprobación oficial de la coordinación en la mesa de control.
        </p>
      </div>

      <button 
        onclick="openTermsModal()"
        class="py-3.5 px-6 rounded-2xl bg-[#E6194B] hover:bg-[#c81440] text-white font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-[#E6194B]/40 transition flex items-center justify-center gap-2 shrink-0"
      >
        <span>Solicitar Cambio a ${targetAlliance}</span>
        <i data-lucide="arrow-right" class="w-4 h-4"></i>
      </button>
    </div>
  `;
}

// ==========================================
// STEPPER / LÍNEA DE TIEMPO DEL ESTADO
// ==========================================
function renderRequestTimeline(req) {
  const isPending = req.status === 'pending';
  const isWaiting = req.status === 'waiting_list';
  const isApproved = req.status === 'approved';
  const isRejected = req.status === 'rejected';

  let statusTitle = '';
  let statusBadge = '';
  let statusDesc = '';

  if (isPending) {
    statusTitle = 'En Revisión por Coordinación';
    statusBadge = 'text-amber-400 bg-amber-950/40 border-amber-900/60';
    statusDesc = 'Tu solicitud cumple con las reglas y cupos. Está a la espera de aprobación oficial por el equipo administrador en la mesa de control.';
  } else if (isWaiting) {
    statusTitle = 'En Lista de Espera';
    statusBadge = 'text-blue-400 bg-blue-950/40 border-blue-900/60';
    statusDesc = 'Por balance de cupos, tu solicitud ha quedado en lista de espera por orden de llegada. En cuanto se libere un cupo o se empareje una permuta, pasará a revisión.';
  } else if (isApproved) {
    statusTitle = '¡Solicitud Aprobada!';
    statusBadge = 'text-emerald-400 bg-emerald-950/40 border-emerald-900/60';
    statusDesc = `Tu traslado a ${req.targetAlliance} ha sido aprobado oficialmente por la coordinación. Tu nueva alianza oficial es ${req.targetAlliance}.`;
  } else if (isRejected) {
    statusTitle = 'Solicitud No Aprobada';
    statusBadge = 'text-red-400 bg-red-950/40 border-red-900/60';
    statusDesc = `Motivo de la resolución: ${req.rejectReason || 'No cumple con las condiciones o límites de balance de la jornada.'}`;
  }

  const dateStr = new Date(req.createdAt).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return `
    <div class="bg-gradient-to-b from-[#0A1333] via-[#050C24] to-[#0A1333] border-2 border-[#142252] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
      
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#142252] pb-4">
        <div>
          <span class="text-[10px] font-display font-black uppercase tracking-widest text-[#E6194B]">
            /// SEGUIMIENTO EN VIVO
          </span>
          <h4 class="text-xl font-black font-display text-white tracking-tight mt-0.5">
            Estado de tu Solicitud de Cambio
          </h4>
        </div>
        <span class="px-3.5 py-1.5 rounded-xl border text-xs font-display font-black uppercase tracking-wider ${statusBadge} shrink-0 text-center">
          ${statusTitle}
        </span>
      </div>

      <!-- Resumen del Traslado -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <div class="bg-[#050C24] p-3 rounded-2xl border border-[#142252]">
          <span class="text-[10px] text-slate-400 block uppercase font-display">Alianza Origen</span>
          <span class="text-white font-bold mt-0.5 block">${req.currentAlliance}</span>
        </div>
        <div class="bg-[#050C24] p-3 rounded-2xl border border-[#142252]">
          <span class="text-[10px] text-slate-400 block uppercase font-display">Alianza Solicitada</span>
          <span class="text-[#7F9CF5] font-bold mt-0.5 block">${req.targetAlliance}</span>
        </div>
        <div class="bg-[#050C24] p-3 rounded-2xl border border-[#142252]">
          <span class="text-[10px] text-slate-400 block uppercase font-display">Fecha de Envío</span>
          <span class="text-slate-300 font-bold mt-0.5 block">${dateStr}</span>
        </div>
      </div>

      <!-- Stepper Gráfico -->
      <div class="py-2">
        <div class="grid grid-cols-3 gap-2 text-center text-xs font-display">
          
          <!-- Paso 1 -->
          <div class="space-y-1.5">
            <div class="w-8 h-8 rounded-full bg-emerald-500 text-white font-black flex items-center justify-center mx-auto shadow-md shadow-emerald-500/40">
              <i data-lucide="check" class="w-4 h-4"></i>
            </div>
            <span class="font-bold text-white block">1. Enviada</span>
            <span class="text-[10px] text-slate-400 block font-mono">Registrada</span>
          </div>

          <!-- Paso 2 -->
          <div class="space-y-1.5">
            <div class="w-8 h-8 rounded-full ${isApproved ? 'bg-emerald-500 text-white' : (isRejected ? 'bg-red-500 text-white' : 'bg-[#2D46B9] text-white animate-pulse')} font-black flex items-center justify-center mx-auto shadow-md">
              ${isApproved ? '<i data-lucide="check" class="w-4 h-4"></i>' : (isRejected ? '<i data-lucide="x" class="w-4 h-4"></i>' : '<i data-lucide="hourglass" class="w-4 h-4"></i>')}
            </div>
            <span class="font-bold text-white block">2. Evaluación</span>
            <span class="text-[10px] ${isWaiting ? 'text-blue-400' : 'text-amber-400'} block font-mono">${isWaiting ? 'Lista de Espera' : (isPending ? 'En Revisión' : 'Evaluada')}</span>
          </div>

          <!-- Paso 3 -->
          <div class="space-y-1.5">
            <div class="w-8 h-8 rounded-full ${isApproved ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50' : (isRejected ? 'bg-red-500 text-white' : 'bg-[#050C24] border border-[#142252] text-slate-500')} font-black flex items-center justify-center mx-auto">
              ${isApproved ? '<i data-lucide="check-check" class="w-4 h-4"></i>' : (isRejected ? '<i data-lucide="alert-circle" class="w-4 h-4"></i>' : '3')}
            </div>
            <span class="font-bold ${isApproved ? 'text-emerald-400' : (isRejected ? 'text-red-400' : 'text-slate-500')} block">3. Resolución</span>
            <span class="text-[10px] text-slate-400 block font-mono">${isApproved ? 'Aprobada' : (isRejected ? 'Rechazada' : 'Pendiente')}</span>
          </div>

        </div>
      </div>

      <!-- Explicación de la resolución -->
      <div class="p-3.5 rounded-2xl bg-[#050C24] border border-[#142252] text-xs leading-relaxed text-slate-300">
        ${statusDesc}
      </div>

      ${req.isSwap ? `
        <div class="p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 text-xs text-blue-200 flex items-center gap-2">
          <i data-lucide="refresh-cw" class="w-4 h-4 text-blue-400 shrink-0"></i>
          <span><strong>Permuta Automática Emparejada:</strong> El sistema ha detectado a un compañero en la otra alianza que solicitó el cambio inverso, por lo que no altera el balance neto de cupos.</span>
        </div>
      ` : ''}

    </div>
  `;
}

// ==========================================
// MODAL DE TÉRMINOS Y CONDICIONES
// ==========================================
function openTermsModal() {
  if (!currentUser) return;
  if (currentUser.alliance === 'Action') return;

  const modal = document.getElementById('terms-modal');
  const checkbox = document.getElementById('terms-checkbox');

  if (checkbox) checkbox.checked = termsAccepted;
  updateTermsContinueButton(termsAccepted);

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeTermsModal() {
  const modal = document.getElementById('terms-modal');
  if (modal) modal.classList.add('hidden');
}

function handleTermsCheckboxChange(isChecked) {
  termsAccepted = isChecked;
  updateTermsContinueButton(isChecked);
}

function updateTermsContinueButton(isChecked) {
  const btn = document.getElementById('terms-continue-btn');
  if (!btn) return;
  if (isChecked) {
    btn.disabled = false;
    btn.className = 'flex-1 py-3 px-4 rounded-xl bg-[#E6194B] hover:bg-[#c81440] text-xs font-display font-black uppercase tracking-wider text-white transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#E6194B]/40 hover:scale-[1.01]';
  } else {
    btn.disabled = true;
    btn.className = 'flex-1 py-3 px-4 rounded-xl bg-[#2D46B9] opacity-40 cursor-not-allowed text-xs font-display font-black uppercase tracking-wider text-white transition flex items-center justify-center gap-1.5 shadow-lg';
  }
}

function proceedToChangeRequestModal() {
  if (!termsAccepted) {
    alert('Debes leer y aceptar el reglamento y condiciones de traslado para continuar.');
    return;
  }
  closeTermsModal();
  openChangeRequestModal();
}

// ==========================================
// MODAL DE SOLICITUD DE CAMBIO
// ==========================================
function openChangeRequestModal() {
  if (!currentUser) return;
  if (!termsAccepted) {
    openTermsModal();
    return;
  }
  const targetAlliance = currentUser.alliance === 'Terror' ? 'Shooter' : 'Terror';

  const modal = document.getElementById('change-request-modal');
  const fromEl = document.getElementById('modal-from-alliance');
  const toEl = document.getElementById('modal-to-alliance');
  const quotaText = document.getElementById('modal-quota-text');
  const errorBox = document.getElementById('request-error-box');
  const reasonInput = document.getElementById('request-reason');

  if (fromEl) fromEl.textContent = currentUser.alliance;
  if (toEl) toEl.textContent = targetAlliance;
  if (reasonInput) reasonInput.value = '';
  if (errorBox) errorBox.classList.add('hidden');

  // Estado de cupos
  if (quotaText) {
    const canAccept = targetAlliance === 'Terror' 
      ? globalStats?.slots?.terrorCanAccept 
      : globalStats?.slots?.shooterCanAccept;

    if (canAccept) {
      quotaText.innerHTML = `<span class="text-emerald-400 font-bold">Cupo Disponible:</span> La alianza ${targetAlliance} tiene capacidad de balance. Tu solicitud pasará a revisión directa.`;
    } else {
      quotaText.innerHTML = `<span class="text-amber-400 font-bold">Sin Cupo Inmediato:</span> Por límite de balance (máx. 4 alumnos de diferencia), tu solicitud pasará a <strong class="text-white">Lista de Espera</strong> hasta que se libere un cupo o se empareje una permuta.`;
    }
  }

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeChangeRequestModal() {
  const modal = document.getElementById('change-request-modal');
  if (modal) modal.classList.add('hidden');
}

async function submitAllianceChangeRequest(event) {
  event.preventDefault();
  if (!currentUser || !sessionToken) return;

  if (!termsAccepted) {
    openTermsModal();
    return;
  }

  const targetAlliance = currentUser.alliance === 'Terror' ? 'Shooter' : 'Terror';
  const reason = document.getElementById('request-reason')?.value || '';
  const errorBox = document.getElementById('request-error-box');
  const btn = document.getElementById('confirm-change-btn');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `
      <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      <span>Enviando...</span>
    `;
  }
  if (errorBox) errorBox.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE}/api/public/alliance/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ targetAlliance, reason, termsAccepted: true })
    });

    const data = await res.json();

    if (!res.ok) {
      if (errorBox) {
        errorBox.textContent = data.error || 'No fue posible registrar la solicitud.';
        errorBox.classList.remove('hidden');
      }
      return;
    }

    currentRequest = data.request;
    closeChangeRequestModal();
    renderStudentPortal();
    loadGlobalStats();
  } catch (err) {
    if (errorBox) {
      errorBox.textContent = 'Error de conexión al enviar la solicitud.';
      errorBox.classList.remove('hidden');
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <span>Confirmar Envío</span>
        <i data-lucide="send" class="w-4 h-4"></i>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }
}
