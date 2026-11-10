
function fillCreds(u, p) {
  const uInput = document.getElementById('login-username');
  const pInput = document.getElementById('login-password');
  if (uInput) uInput.value = u;
  if (pInput) pInput.value = p;
  const alertEl = document.getElementById('login-alert');
  if (alertEl) alertEl.classList.add('hidden');
}

// =========================================================================
// CONSOLA ADMINISTRATIVA Y MESA DE CONTROL - SEMANA DE LA CARRERA 2026
// INACAP SEDE ANTOFAGASTA - IMPLEMENTACIÓN OWASP ASVS & RBAC
// =========================================================================

let adminToken = sessionStorage.getItem('inacap_admin_token') || null;
let currentUser = JSON.parse(sessionStorage.getItem('inacap_admin_user') || 'null');
let currentAdminSection = 'dashboard';
let appData = { alliances: {}, activities: [], announcements: [] };
let sessionTimerInterval = null;
var pendingReasonCallback = null;

// Definición de Secciones Permitidas por Rol (RBAC)
const ALL_SECTIONS = [
  { id: 'dashboard', name: 'Dashboard Ejecutivo', icon: 'bar-chart-3', desc: 'Resumen directivo, padrón, tiempos y auditoría' },
  { id: 'asistencia', name: 'Asistencia del Evento', icon: 'clipboard-check', desc: 'Asistencia real consolidada, alianzas y actividades de cada alumno' },
  { id: 'participantes', name: 'Participantes por Actividad', icon: 'user-check', desc: 'Nómina, cupos y asistencia en cancha' },
  { id: 'traslados', name: 'Cambio de Alianzas', icon: 'arrow-left-right', desc: 'Traslado individual y permutas 1 a 1' },
  { id: 'puntos', name: 'Registro de Puntos', icon: 'check-circle-2', desc: 'Puestos, deportes triangular y gymkanas' },
  { id: 'docentes', name: 'Evaluación Docente', icon: 'sparkles', desc: 'Rúbricas de desafíos y obra favorita' },
  { id: 'disciplina', name: 'Sanciones y Sorpresas', icon: 'alert-triangle', desc: 'Sanciones (200-600) y puntos extra' },
  { id: 'avisos', name: 'Barra de Avisos', icon: 'radio', desc: 'Anuncios en vivo para proyector e inicio' },
  { id: 'seguridad', name: 'Auditoría de Seguridad', icon: 'shield-alert', desc: 'Bitácora de accesos, bloqueos y sesiones' }
];

const ROLE_PERMISSIONS = {
  admin: ['dashboard', 'asistencia', 'participantes', 'traslados', 'puntos', 'docentes', 'disciplina', 'avisos', 'seguridad'],
  coordinacion: ['dashboard', 'asistencia', 'participantes', 'traslados', 'puntos', 'docentes', 'disciplina', 'avisos'],
  mesa: ['asistencia', 'participantes', 'puntos', 'avisos'],
  staff: ['participantes', 'puntos', 'traslados'],
  docente: ['docentes']
};

document.addEventListener('DOMContentLoaded', () => {
  initAdminApp();
});

async function initAdminApp() {
  if (!adminToken || !currentUser) {
    showLoginView();
    return;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!res.ok) {
      logoutAdmin();
      return;
    }

    const data = await res.json();
    currentUser = data.user;
    sessionStorage.setItem('inacap_admin_user', JSON.stringify(currentUser));
    showAdminView();
  } catch (err) {
    console.error('Error al validar sesión:', err);
    logoutAdmin();
  }
}

function showLoginView() {
  const loginView = document.getElementById('login-view');
  const adminView = document.getElementById('admin-view');
  if (loginView) loginView.classList.remove('hidden');
  if (adminView) adminView.classList.add('hidden');
  if (sessionTimerInterval) clearInterval(sessionTimerInterval);
  lucide.createIcons();
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const alertEl = document.getElementById('login-alert');
  const alertText = document.getElementById('login-alert-text');
  const submitBtn = document.getElementById('login-submit-btn');

  const username = usernameInput ? usernameInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!username || !password) return;

  submitBtn.disabled = true;
  submitBtn.classList.add('opacity-75');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      adminToken = data.token;
      currentUser = data.user;
      sessionStorage.setItem('inacap_admin_token', adminToken);
      sessionStorage.setItem('inacap_admin_user', JSON.stringify(currentUser));
      
      if (alertEl) alertEl.classList.add('hidden');
      if (passwordInput) passwordInput.value = '';

      showAdminView();
    } else {
      if (alertEl && alertText) {
        alertEl.className = 'mb-5 p-3 rounded-xl text-xs font-medium border flex items-start gap-2.5 bg-red-950/70 border-red-800 text-red-200';
        if (res.status === 429) {
          alertText.innerHTML = `<strong>Acceso Bloqueado (OWASP):</strong> ${data.error}`;
        } else {
          alertText.innerHTML = `<strong>Error de Acceso:</strong> ${data.error || 'Credenciales no válidas.'} ${data.attemptsLeft !== undefined ? `(Intentos restantes: ${data.attemptsLeft})` : ''}`;
        }
        alertEl.classList.remove('hidden');
        lucide.createIcons();
      }
    }
  } catch (err) {
    if (alertEl && alertText) {
      alertEl.className = 'mb-5 p-3 rounded-xl text-xs font-medium border flex items-start gap-2.5 bg-red-950/70 border-red-800 text-red-200';
      alertText.textContent = 'Error de conexión con el servidor de autenticación.';
      alertEl.classList.remove('hidden');
      lucide.createIcons();
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-75');
  }
}

async function logoutAdmin() {
  if (adminToken) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
    } catch (e) {}
  }

  adminToken = null;
  currentUser = null;
  sessionStorage.removeItem('inacap_admin_token');
  sessionStorage.removeItem('inacap_admin_user');
  showLoginView();
}

function showAdminView() {
  const loginView = document.getElementById('login-view');
  const adminView = document.getElementById('admin-view');
  if (loginView) loginView.classList.add('hidden');
  if (adminView) adminView.classList.remove('hidden');

  const nameEl = document.getElementById('user-display-name');
  const roleBadge = document.getElementById('role-badge');
  const sidebarRole = document.getElementById('sidebar-role-indicator');

  if (nameEl) nameEl.textContent = currentUser.name || currentUser.username;
  if (sidebarRole) sidebarRole.textContent = currentUser.role;

  if (roleBadge) {
    const roleColors = {
      admin: 'bg-red-950 text-red-400 border-red-800',
      coordinacion: 'bg-purple-950 text-purple-400 border-purple-800',
      mesa: 'bg-blue-950 text-blue-400 border-blue-800',
      staff: 'bg-emerald-950 text-emerald-400 border-emerald-800',
      docente: 'bg-amber-950 text-amber-400 border-amber-800'
    };
    const roleNames = {
      admin: 'Superadmin',
      coordinacion: 'Coordinación',
      mesa: 'Mesa de Cancha',
      staff: 'Staff Cancha / Puntos',
      docente: 'Docente Evaluador'
    };
    roleBadge.className = `px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${roleColors[currentUser.role] || 'bg-slate-900 text-slate-300'}`;
    roleBadge.textContent = roleNames[currentUser.role] || currentUser.role;
  }

  renderRoleSidebar();
  startSessionTimer();
  loadStats();

  const allowed = ROLE_PERMISSIONS[currentUser.role] || ['puntos'];
  if (!allowed.includes(currentAdminSection)) {
    currentAdminSection = allowed[0];
  }

  switchAdminSection(currentAdminSection);
}

function toggleMobileAdminMenu(forceClose) {
  const drawer = document.getElementById('mobile-modules-drawer');
  const chevron = document.getElementById('mobile-menu-chevron');
  const label = document.getElementById('mobile-menu-btn-label');
  if (!drawer) return;

  const isCurrentlyOpen = !drawer.classList.contains('hidden');
  const shouldClose = forceClose !== undefined ? forceClose : isCurrentlyOpen;
  if (shouldClose) {
    drawer.classList.add('hidden');
    if (chevron) chevron.style.transform = 'rotate(0deg)';
    if (label) label.textContent = 'Todos';
  } else {
    drawer.classList.remove('hidden');
    if (chevron) chevron.style.transform = 'rotate(180deg)';
    if (label) label.textContent = 'Cerrar';
  }
}

function renderRoleSidebar() {
  const container = document.getElementById('sidebar-nav-container');
  const mobileNav = document.getElementById('mobile-horizontal-nav');
  const drawerNav = document.getElementById('mobile-drawer-nav-container');

  const allowed = ROLE_PERMISSIONS[currentUser.role] || [];
  const permittedSections = ALL_SECTIONS.filter(s => allowed.includes(s.id));

  // 1. Desktop Sidebar (md:block)
  if (container) {
    container.innerHTML = permittedSections.map(s => `
      <button 
        onclick="switchAdminSection('${s.id}')" 
        id="side-btn-${s.id}"
        class="w-full text-left px-3 py-2.5 rounded-xl text-xs transition flex items-center gap-2.5 ${currentAdminSection === s.id ? 'bg-slate-900 text-white font-semibold border border-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'}"
      >
        <i data-lucide="${s.icon}" class="w-4 h-4 shrink-0 ${currentAdminSection === s.id ? 'text-white' : 'text-slate-500'}"></i>
        <span class="truncate">${s.name}</span>
      </button>
    `).join('');
  }

  // 2. Mobile Horizontal Swipeable Pills
  if (mobileNav) {
    mobileNav.innerHTML = permittedSections.map(s => {
      const isSel = currentAdminSection === s.id;
      return `
        <button
          onclick="switchAdminSection('${s.id}')"
          id="mob-pill-${s.id}"
          class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition ${isSel ? 'bg-red-600 border-red-500 text-white font-bold shadow-md shadow-red-950/60' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'}"
        >
          <i data-lucide="${s.icon}" class="w-3.5 h-3.5"></i>
          <span>${s.name}</span>
        </button>
      `;
    }).join('');
  }

  // 3. Mobile Drawer List
  if (drawerNav) {
    drawerNav.innerHTML = permittedSections.map(s => {
      const isSel = currentAdminSection === s.id;
      return `
        <button
          onclick="switchAdminSection('${s.id}')"
          id="mob-drawer-btn-${s.id}"
          class="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${isSel ? 'bg-slate-900 text-white font-bold border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'}"
        >
          <div class="flex items-center gap-2.5 truncate">
            <i data-lucide="${s.icon}" class="w-4 h-4 shrink-0 ${isSel ? 'text-red-400' : 'text-slate-500'}"></i>
            <span class="truncate">${s.name}</span>
          </div>
          ${isSel ? '<span class="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>' : ''}
        </button>
      `;
    }).join('');
  }

  // Update mobile active module title
  const currentSecObj = ALL_SECTIONS.find(s => s.id === currentAdminSection);
  const mobTitle = document.getElementById('mobile-active-module-title');
  if (mobTitle && currentSecObj) {
    mobTitle.textContent = currentSecObj.name;
  }

  lucide.createIcons();
}

function startSessionTimer() {
  if (sessionTimerInterval) clearInterval(sessionTimerInterval);

  function tick() {
    const timerEl = document.getElementById('session-timer');
    if (!timerEl || !currentUser?.expiresAt) return;

    const diff = new Date(currentUser.expiresAt).getTime() - Date.now();
    if (diff <= 0) {
      alert('Tu sesión ha finalizado. Por seguridad ingresa nuevamente.');
      logoutAdmin();
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    timerEl.textContent = `Sesión: ${hours}h ${mins}m restantes`;
  }

  tick();
  sessionTimerInterval = setInterval(tick, 30000);
}

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    if (res.ok) {
      appData = await res.json();
    }
  } catch (err) {
    console.error('Error al cargar stats:', err);
  }
}

function switchAdminSection(secId) {
  const allowed = ROLE_PERMISSIONS[currentUser.role] || [];
  if (!allowed.includes(secId)) {
    secId = allowed[0] || 'puntos';
  }

  currentAdminSection = secId;

  // Actualizar sidebar desktop
  document.querySelectorAll('#sidebar-nav-container button').forEach(btn => {
    btn.className = 'w-full text-left px-3 py-2.5 rounded-xl text-xs transition flex items-center gap-2.5 text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent';
  });
  const activeBtn = document.getElementById(`side-btn-${secId}`);
  if (activeBtn) {
    activeBtn.className = 'w-full text-left px-3 py-2.5 rounded-xl text-xs transition flex items-center gap-2.5 bg-slate-900 text-white font-semibold border border-slate-800';
  }

  // Actualizar píldoras móviles
  document.querySelectorAll('#mobile-horizontal-nav button').forEach(btn => {
    btn.className = 'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900';
  });
  const activePill = document.getElementById(`mob-pill-${secId}`);
  if (activePill) {
    activePill.className = 'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition bg-red-600 border-red-500 text-white font-bold shadow-md shadow-red-950/60';
    activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  // Actualizar título de módulo activo en móvil
  const currentSecObj = ALL_SECTIONS.find(s => s.id === secId);
  const mobTitle = document.getElementById('mobile-active-module-title');
  if (mobTitle && currentSecObj) {
    mobTitle.textContent = currentSecObj.name;
  }

  // Cerrar cajón desplegable móvil si estaba abierto
  toggleMobileAdminMenu(true);

  // En móvil, hacer scroll suave al contenido principal
  if (window.innerWidth < 768) {
    const mainView = document.getElementById('admin-main-view');
    if (mainView) {
      setTimeout(() => {
        mainView.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }

  const mainView = document.getElementById('admin-main-view');
  if (!mainView) return;

  if (secId === 'seguridad') {
    renderSeguridadPanelAsync(mainView);
  } else {
    mainView.innerHTML = renderAdminSectionContent(secId);
    lucide.createIcons();

    if (secId === 'dashboard') {
      initDashboardModule();
    } else if (secId === 'asistencia') {
      initAsistenciaModule();
    } else if (secId === 'participantes') {
      initParticipantesModule();
    } else if (secId === 'traslados') {
      initTrasladosModule();
    } else if (secId === 'puntos') {
      initPuntosModule();
    } else if (secId === 'docentes') {
      renderDocenteRubricForm();
    }
  }
}

function renderAdminSectionContent(secId) {
  if (secId === 'dashboard') {
    return renderDashboardPanel();
  }
  if (secId === 'asistencia') {
    return renderAsistenciaPanel();
  }
  if (secId === 'participantes') {
    return renderParticipantesPanel();
  }
  if (secId === 'traslados') {
    return renderTrasladosPanel();
  }
  if (secId === 'puntos') {
    return renderPuntosPanel();
  }
  return renderCoreAdminSectionContent(secId);
}

async function renderSeguridadPanelAsync(mainView) {
  mainView.innerHTML = `
    <div class="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
      <i data-lucide="loader" class="w-4 h-4 animate-spin text-red-500"></i> Cargando auditoría de seguridad...
    </div>
  `;
  lucide.createIcons();

  try {
    const res = await fetch('/api/admin/security/audit', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!res.ok) {
      mainView.innerHTML = `<div class="p-6 text-xs text-red-400">Error al cargar bitácora de seguridad (${res.status}).</div>`;
      return;
    }

    const data = await res.json();
    const logs = data.securityLogs || [];

    mainView.innerHTML = `
      <div class="space-y-5">
        <div class="border-b border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span class="text-[11px] font-mono uppercase text-red-500 font-bold">OWASP ASVS • Auditoría Activa</span>
            <h3 class="text-base font-bold font-heading text-white">Registro de Seguridad y Control de Acceso</h3>
            <p class="text-xs text-slate-400 mt-0.5">Monitoreo en tiempo real de inicios de sesión, intentos bloqueados e IPs auditadas.</p>
          </div>
          <button onclick="switchAdminSection('seguridad')" class="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-800 transition flex items-center gap-1.5 self-start sm:self-auto">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Actualizar Bitácora
          </button>
        </div>

        <div class="space-y-2">
          ${logs.length === 0 ? `
            <div class="p-8 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-900">
              No hay incidentes ni eventos de seguridad registrados recientemente.
            </div>
          ` : logs.map(log => `
            <div class="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div class="space-y-0.5 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white truncate">${log.action}</span>
                  ${log.details?.ip ? `<span class="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">IP: ${log.details.ip}</span>` : ''}
                </div>
                ${log.details?.reason ? `<span class="text-red-400 block text-[11px]">Motivo: ${log.details.reason}</span>` : ''}
              </div>
              <div class="text-[11px] text-slate-500 font-mono shrink-0">
                <span class="text-slate-400 font-semibold">${log.user}</span> • <span>${new Date(log.timestamp).toLocaleString('es-CL')}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (err) {
    mainView.innerHTML = `<div class="p-6 text-xs text-red-400">Error de conexión al cargar auditoría.</div>`;
  }
}


function renderCoreAdminSectionContent(secId) {

  if (secId === 'docentes') {
    return `
      <div class="space-y-5">
        <div class="border-b border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span class="text-[11px] font-mono uppercase text-slate-500">Módulo 2</span>
            <h3 class="text-base font-bold font-heading text-white">Evaluación Docente de Desafíos Creativos</h3>
            <p class="text-xs text-slate-400 mt-0.5">Rúbricas oficiales con botones cuadrados interactivos. Alerta automática si la discrepancia supera 20 puntos.</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-mono uppercase text-emerald-400 bg-emerald-950/50 border border-emerald-900/60 px-2 py-0.5 rounded-full">
              Formato Oficial Docente
            </span>
          </div>
        </div>

        <!-- FILTROS Y SELECCIÓN DE EVALUACIÓN -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
          <div>
            <label class="text-[11px] text-slate-400 font-mono block mb-1.5">Alianza a Evaluar</label>
            <select id="docente-al-select" onchange="renderDocenteRubricForm()" class="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-semibold focus:border-red-500 focus:outline-none">
              <option value="Terror">Terror: Videojuego con IA</option>
              <option value="Shooter">Shooter: Asistente con IA</option>
              <option value="Action">Action: Collage Digital</option>
            </select>
          </div>
          <div>
            <label class="text-[11px] text-slate-400 font-mono block mb-1.5">Docente Juez</label>
            <select id="docente-num-select" onchange="renderDocenteRubricForm()" class="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-semibold focus:border-red-500 focus:outline-none">
              <option value="1">Docente 1</option>
              <option value="2">Docente 2</option>
            </select>
          </div>
          <div class="flex items-center gap-3 pt-6 sm:pt-5">
            <input type="checkbox" id="docente-delivered" onchange="recalculateRubricLiveScore()" class="w-4 h-4 rounded text-red-600 bg-slate-900 border-slate-700 cursor-pointer">
            <label for="docente-delivered" class="text-xs text-slate-200 font-semibold cursor-pointer select-none">Entrega en plazo (+1.000 pts)</label>
          </div>
        </div>

        <!-- MARCADOR EN VIVO DE CALIFICACIÓN -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
          <div class="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80 text-center">
            <span class="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">Nota Docente (0-100)</span>
            <div class="flex items-baseline justify-center gap-1">
              <span id="rubric-live-score" class="text-xl font-bold font-mono text-emerald-400">0</span>
              <span class="text-[10px] font-mono text-slate-500">/ 100</span>
            </div>
          </div>
          <div class="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80 text-center">
            <span class="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">Puntos por Nota (×25)</span>
            <div class="flex items-baseline justify-center gap-1">
              <span id="rubric-live-pts" class="text-xl font-bold font-mono text-white">0</span>
              <span class="text-[10px] font-mono text-slate-500">/ 2.500</span>
            </div>
          </div>
          <div class="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80 text-center">
            <span class="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">Bono Entrega Plazo</span>
            <span id="rubric-live-bono" class="text-xl font-bold font-mono text-amber-400 block">+1.000 pts</span>
          </div>
          <div class="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80 text-center">
            <span class="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">Total Estimado Alianza</span>
            <span id="rubric-live-total" class="text-xl font-bold font-mono text-amber-300 block">0 pts</span>
          </div>
        </div>

        <!-- CONTENEDOR DE LA RÚBRICA CON BOTONES CUADRADOS (ESTILO EVALUACIÓN DOCENTE) -->
        <div id="docente-rubric-container" class="space-y-3">
          <!-- Rendered dynamically -->
        </div>

        <div class="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button onclick="submitDocenteEval()" class="py-2.5 px-6 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-red-950/60 transition flex items-center justify-center gap-2">
            <i data-lucide="save" class="w-4 h-4"></i>
            <span>Guardar Calificación Docente</span>
          </button>
          <span class="text-[11px] text-slate-500 font-mono text-center sm:text-right">Guarda la evaluación del docente seleccionado y verifica discrepancias (> 20 pts).</span>
        </div>
      </div>
    `;
  }

  if (secId === 'disciplina') {
    return `
      <div class="space-y-6">
        <div class="border-b border-slate-900 pb-3">
          <span class="text-[11px] font-mono uppercase text-slate-500">Módulo 3</span>
          <h3 class="text-base font-bold font-heading text-white">Sanciones Disciplinarias y Puntos Sorpresa</h3>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <!-- Sanción -->
          <div class="bg-slate-900/30 border border-red-950/60 p-4 rounded-xl space-y-3">
            <h4 class="text-xs font-bold text-red-400 uppercase font-mono tracking-wider">Aplicar Sanción (-200 a -600 pts)</h4>
            <div>
              <label class="text-[11px] text-slate-500 block mb-1">Alianza</label>
              <select id="sancion-al" class="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 text-xs">
                <option value="Terror">Terror</option>
                <option value="Shooter">Shooter</option>
                <option value="Action">Action</option>
              </select>
            </div>
            <div>
              <label class="text-[11px] text-slate-500 block mb-1">Puntos a Descontar (200 - 600)</label>
              <input type="number" id="sancion-pts" min="200" max="600" step="50" value="200" class="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 text-xs font-mono">
            </div>
            <div>
              <label class="text-[11px] text-slate-500 block mb-1">Motivo Reglamentario</label>
              <textarea id="sancion-motivo" placeholder="Descripción de la falta..." class="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 text-xs h-16"></textarea>
            </div>
            <button onclick="submitSancion()" class="w-full py-2 bg-red-950/50 hover:bg-red-900/60 text-red-300 text-xs font-semibold rounded-lg border border-red-900/50 transition">
              Registrar Descuento
            </button>
          </div>

          <!-- Sorpresa -->
          <div class="bg-slate-900/30 border border-amber-950/60 p-4 rounded-xl space-y-3">
            <h4 class="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider">Sumar Actividad Sorpresa</h4>
            <div>
              <label class="text-[11px] text-slate-500 block mb-1">Nombre de la Actividad</label>
              <input type="text" id="sorp-name" placeholder="Ej: Trivia relámpago" class="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 text-xs">
            </div>
            <div class="grid grid-cols-3 gap-2 font-mono">
              <div>
                <label class="text-[10px] text-red-400 block mb-1">Terror</label>
                <input type="number" id="sorp-terror" placeholder="0" class="w-full bg-slate-950 border border-slate-800 text-white rounded p-1.5 text-xs text-center">
              </div>
              <div>
                <label class="text-[10px] text-blue-400 block mb-1">Shooter</label>
                <input type="number" id="sorp-shooter" placeholder="0" class="w-full bg-slate-950 border border-slate-800 text-white rounded p-1.5 text-xs text-center">
              </div>
              <div>
                <label class="text-[10px] text-emerald-400 block mb-1">Action</label>
                <input type="number" id="sorp-action" placeholder="0" class="w-full bg-slate-950 border border-slate-800 text-white rounded p-1.5 text-xs text-center">
              </div>
            </div>
            <button onclick="submitSorpresa()" class="w-full py-2 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 text-xs font-semibold rounded-lg border border-amber-900/50 transition">
              Asignar Puntos Sorpresa
            </button>
          </div>
        </div>
      </div>
    `;
  }

  if (secId === 'avisos') {
    return `
      <div class="space-y-4">
        <div class="border-b border-slate-900 pb-3">
          <span class="text-[11px] font-mono uppercase text-slate-500">Módulo 4</span>
          <h3 class="text-base font-bold font-heading text-white">Barra de Avisos y Anuncios en Directo</h3>
          <p class="text-xs text-slate-400 mt-0.5">Mensajes emitidos instantáneamente al banner del portal y a la pantalla grande del proyector.</p>
        </div>

        <div class="flex flex-col sm:flex-row gap-2.5">
          <input type="text" id="ann-input-text" placeholder="Ej: Quemadas parte en 5 minutos en cancha central" class="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white">
          <button onclick="submitNewAnnouncement()" class="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg border border-slate-700 transition">
            Publicar Aviso
          </button>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-900">
          <span class="text-[11px] font-mono uppercase text-slate-500 block mb-2">Avisos activos actualmente:</span>
          <div class="space-y-2">
            ${(appData.announcements || []).map(a => `
              <div class="p-2.5 bg-slate-900/40 border border-slate-900 rounded-lg flex items-center justify-between text-xs">
                <span class="text-slate-300 truncate pr-3">${a.text}</span>
                <button onclick="deleteAnnouncement(${a.id})" class="text-red-400 hover:text-red-300 font-mono text-[10px] shrink-0">Eliminar</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  return '';
}



// Submits and actions
async function submitAdminPlaces() {
  const actId = document.getElementById('admin-act-select').value;
  const pT = document.getElementById('admin-place-terror').value;
  const pS = document.getElementById('admin-place-shooter').value;
  const pA = document.getElementById('admin-place-action').value;
  try {
    const res = await fetch('/api/admin/activity/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        activityId: actId,
        results: { Terror: pT, Shooter: pS, Action: pA },
        loggedBy: (currentUser?.name || 'Staff')
      })
    });
    if (res.ok) {
      alert('Resultados calculados y guardados con éxito.');
      loadStats();
    } else {
      alert('Error al guardar');
    }
  } catch (e) {
    alert('Error de conexión');
  }
}

async function submitAdminMatches() {
  const sport = document.getElementById('admin-sport-select').value;
  const m1s1 = document.getElementById('match1-s1').value;
  const m1s2 = document.getElementById('match1-s2').value;
  const m2s1 = document.getElementById('match2-s1').value;
  const m2s2 = document.getElementById('match2-s2').value;
  const m3s1 = document.getElementById('match3-s1').value;
  const m3s2 = document.getElementById('match3-s2').value;

  const matches = [
    { team1: 'Terror', team2: 'Shooter', score1: m1s1 === '' ? null : Number(m1s1), score2: m1s2 === '' ? null : Number(m1s2) },
    { team1: 'Shooter', team2: 'Action', score1: m2s1 === '' ? null : Number(m2s1), score2: m2s2 === '' ? null : Number(m2s2) },
    { team1: 'Action', team2: 'Terror', score1: m3s1 === '' ? null : Number(m3s1), score2: m3s2 === '' ? null : Number(m3s2) }
  ];

  try {
    const res = await fetch('/api/admin/activity/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        activityId: sport,
        matches,
        loggedBy: (currentUser?.name || 'Staff')
      })
    });
    if (res.ok) {
      alert(`Tabla de ${sport} actualizada con éxito.`);
      loadStats();
    }
  } catch (e) {
    alert('Error de conexión');
  }
}

async function submitAdminGymkanas() {
  const tScores = (document.getElementById('gym-terror').value || '').split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
  const sScores = (document.getElementById('gym-shooter').value || '').split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
  const aScores = (document.getElementById('gym-action').value || '').split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));

  try {
    const res = await fetch('/api/admin/activity/gymkanas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        participantScores: { Terror: tScores, Shooter: sScores, Action: aScores },
        loggedBy: (currentUser?.name || 'Staff')
      })
    });
    if (res.ok) {
      alert('Puntos de Gymkanas calculados con la fórmula 3.000 × (Promedio / 8).');
      loadStats();
    }
  } catch (e) {
    alert('Error');
  }
}

const CRITERIOS_MAP = {
  Terror: [
    { id: 'c1', code: '2.1.1', nombre: 'Jugabilidad y diversión', peso: 25, desc: 'Reglas claras, controles que responden con fluidez, objetivo definido y curva de dificultad adecuada. Se entiende rápido y motiva a jugar otra vez.' },
    { id: 'c2', code: '2.1.2', nombre: 'Historia y ambientación de terror', peso: 20, desc: 'Hilo conductor, personajes o contexto narrativo, atmósfera envolvente y coherencia audiovisual de terror (imagen, iluminación y sonido).' },
    { id: 'c3', code: '2.1.3', nombre: 'Profundidad y mecánicas', peso: 20, desc: 'Variedad de mecánicas jugables, progresión de desafíos, decisiones del jugador y rejugabilidad que invite a repetir la experiencia.' },
    { id: 'c4', code: '2.1.4', nombre: 'Creatividad e integración de IA', peso: 15, desc: 'Idea propia u original, uso inteligente de herramientas de IA generativa para assets, diálogos, lógica o narrativa.' },
    { id: 'c5', code: '2.1.5', nombre: 'Calidad técnica y presentación', peso: 20, desc: 'Estabilidad de ejecución sin caídas, interfaz legible, acabado cuidado, con pantalla de inicio y cierre claros.' }
  ],
  Shooter: [
    { id: 'c1', code: '2.2.1', nombre: 'Respuestas correctas e información útil', peso: 30, desc: 'Responde correctamente preguntas sobre la sede, ramos, trámites y vida estudiantil con datos reales y precisos.' },
    { id: 'c2', code: '2.2.2', nombre: 'Honestidad y manejo de preguntas trampa', peso: 25, desc: 'Reconoce con transparencia lo que no sabe y no inventa datos erróneos. Ante la pregunta trampa sugiere canales oficiales.' },
    { id: 'c3', code: '2.2.3', nombre: 'Claridad, concisión y tono', peso: 20, desc: 'Respuestas breves, ordenadas, empáticas y con excelente redacción. Se entiende a la primera lectura.' },
    { id: 'c4', code: '2.2.4', nombre: 'Experiencia de uso y velocidad', peso: 25, desc: 'Interfaz accesible y rápida, carga sin trabas, buena disposición visual y personalidad adecuada para soporte estudiantil.' }
  ],
  Action: [
    { id: 'c1', code: '2.3.1', nombre: 'Calidad fotográfica original', peso: 15, desc: 'Nitidez, iluminación, variedad de ángulos y encuadres de fotografías 100% originales capturadas en la sede.' },
    { id: 'c2', code: '2.3.2', nombre: 'Composición y creatividad visual', peso: 25, desc: 'Integración armónica de fotografías, equilibrio, contraste, manejo tipográfico, texturas y recursos gráficos.' },
    { id: 'c3', code: '2.3.3', nombre: 'Concepto e identidad de sede', peso: 20, desc: 'Claridad del concepto visual, transmisión de la vida estudiantil y propuesta estética con identidad propia.' },
    { id: 'c4', code: '2.3.4', nombre: 'Técnica digital y software de diseño', peso: 20, desc: 'Dominio de herramientas de edición y montaje digital, recortes limpios, tratamiento de color y resolución óptima.' },
    { id: 'c5', code: '2.3.5', nombre: 'Organización y archivos editables', peso: 20, desc: 'Estructura organizada de capas y grupos, nombres claros y entrega de archivos fuente editables (PSD/AI) y exportación final.' }
  ]
};

function recalculateRubricLiveScore() {
  const al = document.getElementById('docente-al-select')?.value;
  const rubric = appData.creativeChallenges?.rubrics?.[al];
  const criterios = (rubric && rubric.criterios && rubric.criterios.length > 0) ? rubric.criterios : (CRITERIOS_MAP[al] || []);

  const multipliers = {
    'Excelente': 1.0,
    'Bueno': 0.8,
    'Regular': 0.5,
    'Básico': 0.2,
    'Insatisfactorio': 0.0
  };

  let totalScore = 0;
  criterios.forEach(c => {
    const val = document.getElementById(`rubric-crit-${c.id}`)?.value || 'Bueno';
    const mult = multipliers[val] !== undefined ? multipliers[val] : 0.8;
    totalScore += c.peso * mult;
  });

  totalScore = Math.round(totalScore);
  const ptsPonderados = Math.round((totalScore / 100) * 2500);
  const isDelivered = document.getElementById('docente-delivered')?.checked || false;
  const bonoEntrega = isDelivered ? 1000 : 0;
  const totalFinal = ptsPonderados + bonoEntrega;

  const scoreEl = document.getElementById('rubric-live-score');
  const ptsEl = document.getElementById('rubric-live-pts');
  const bonoEl = document.getElementById('rubric-live-bono');
  const totalEl = document.getElementById('rubric-live-total');

  if (scoreEl) scoreEl.textContent = totalScore;
  if (ptsEl) ptsEl.textContent = ptsPonderados.toLocaleString('es-CL');
  if (bonoEl) bonoEl.textContent = isDelivered ? '+1.000 pts' : '0 pts';
  if (totalEl) totalEl.textContent = totalFinal.toLocaleString('es-CL') + ' pts';
}

function setRubricCritScore(critId, levelName) {
  const input = document.getElementById(`rubric-crit-${critId}`);
  if (input) input.value = levelName;

  const levels = ['Excelente', 'Bueno', 'Regular', 'Insatisfactorio'];
  levels.forEach(lvl => {
    const btn = document.getElementById(`btn-crit-${critId}-${lvl}`);
    if (!btn) return;
    const ptsSpan = btn.querySelector('.rubric-pts-text');
    const labelSpan = btn.querySelector('.rubric-lbl-text');
    
    if (lvl === levelName) {
      btn.className = 'rubric-btn p-2 sm:p-2.5 rounded-xl border border-emerald-500 bg-emerald-950/80 ring-2 ring-emerald-500/50 text-white shadow-md transition flex flex-col items-center justify-center min-w-0 w-full sm:min-w-[75px] cursor-pointer';
      if (labelSpan) labelSpan.className = 'rubric-lbl-text text-xs font-bold text-emerald-200 block text-center leading-tight';
      if (ptsSpan) ptsSpan.className = 'rubric-pts-text text-[11px] font-mono italic font-black text-emerald-400 mt-1 block text-center';
    } else {
      btn.className = 'rubric-btn p-2 sm:p-2.5 rounded-xl border border-slate-800 bg-slate-950/90 text-slate-400 hover:bg-slate-900 hover:border-slate-700 hover:text-slate-200 transition flex flex-col items-center justify-center min-w-[70px] sm:min-w-[85px] cursor-pointer';
      if (labelSpan) labelSpan.className = 'rubric-lbl-text text-xs font-medium text-slate-300 block text-center leading-tight';
      if (ptsSpan) ptsSpan.className = 'rubric-pts-text text-[11px] font-mono italic text-slate-500 mt-1 block text-center';
    }
  });

  recalculateRubricLiveScore();
}

function renderDocenteRubricForm() {
  const alSelect = document.getElementById('docente-al-select');
  const docSelect = document.getElementById('docente-num-select');
  const deliveredCheck = document.getElementById('docente-delivered');
  const container = document.getElementById('docente-rubric-container');
  if (!alSelect || !container) return;

  const al = alSelect.value;
  const docNum = docSelect ? Number(docSelect.value) : 1;
  const rubric = appData.creativeChallenges?.rubrics?.[al];
  const criterios = (rubric && rubric.criterios && rubric.criterios.length > 0) ? rubric.criterios : (CRITERIOS_MAP[al] || []);

  const savedScores = (docNum === 1 ? rubric?.docente1 : rubric?.docente2) || {};
  const statusInfo = appData.creativeChallenges?.status?.[al];
  if (deliveredCheck && statusInfo && statusInfo.delivered !== undefined) {
    deliveredCheck.checked = Boolean(statusInfo.delivered);
  }

  const levels = [
    { key: 'Excelente', mult: 1.0 },
    { key: 'Bueno', mult: 0.8 },
    { key: 'Regular', mult: 0.5 },
    { key: 'Insatisfactorio', mult: 0.0 }
  ];

  container.innerHTML = `
    <!-- TABLA DE RÚBRICA CON BOTONES CUADRADOS (FORMATO EVALUACIÓN DOCENTE) -->
    <div class="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 shadow-sm divide-y divide-slate-800/80">
      ${criterios.map((c, idx) => {
        const currentVal = savedScores[c.id] || 'Bueno';
        return `
          <div class="p-3.5 sm:p-4.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 hover:bg-slate-900/30 transition">
            <!-- Columna Izquierda: Criterio y Aspectos Evaluados -->
            <div class="flex-1 pr-2">
              <input type="hidden" id="rubric-crit-${c.id}" value="${currentVal}">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-mono font-bold text-red-400 bg-red-950/50 border border-red-900/60 px-1.5 py-0.5 rounded">
                  ${c.code || `2.${idx+1}`}
                </span>
                <span class="text-xs sm:text-sm font-bold text-white leading-tight">
                  ${c.nombre}
                </span>
                <span class="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 ml-auto lg:ml-0 shrink-0">
                  ${c.peso} pts máx
                </span>
              </div>
              <p class="text-[11px] text-slate-400 leading-relaxed font-sans mt-1">
                ${c.desc}
              </p>
            </div>

            <!-- Columna Derecha: Botones Cuadrados de Niveles de Desempeño -->
            <div class="grid grid-cols-2 min-[480px]:grid-cols-4 gap-1.5 sm:gap-2 shrink-0 w-full lg:w-auto">
              ${levels.map(lvl => {
                const isSel = currentVal === lvl.key;
                const ptsValue = Math.round((c.peso * lvl.mult) * 10) / 10;
                return `
                  <button 
                    type="button"
                    onclick="setRubricCritScore('${c.id}', '${lvl.key}')"
                    id="btn-crit-${c.id}-${lvl.key}"
                    class="rubric-btn p-2 sm:p-2.5 rounded-xl border text-center flex flex-col items-center justify-center transition min-w-[70px] sm:min-w-[85px] cursor-pointer select-none ${isSel ? 'border-emerald-500 bg-emerald-950/80 ring-2 ring-emerald-500/50 text-white shadow-md' : 'border-slate-800 bg-slate-950/90 text-slate-400 hover:bg-slate-900 hover:border-slate-700 hover:text-slate-200'}"
                  >
                    <span class="rubric-lbl-text text-xs font-bold ${isSel ? 'text-emerald-200' : 'text-slate-300'} block text-center leading-tight">
                      ${lvl.key}
                    </span>
                    <span class="rubric-pts-text text-[11px] font-mono italic mt-1 block text-center ${isSel ? 'text-emerald-400 font-black' : 'text-slate-500'}">
                      ${ptsValue} puntos
                    </span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  recalculateRubricLiveScore();
}

async function submitDocenteEval() {
  const alSelect = document.getElementById('docente-al-select');
  const docSelect = document.getElementById('docente-num-select');
  const deliveredCheck = document.getElementById('docente-delivered');
  if (!alSelect) return;

  const al = alSelect.value;
  const docNum = docSelect ? Number(docSelect.value) : 1;
  const delivered = deliveredCheck ? deliveredCheck.checked : false;
  const rubric = appData.creativeChallenges?.rubrics?.[al];
  const criterios = (rubric && rubric.criterios && rubric.criterios.length > 0) ? rubric.criterios : (CRITERIOS_MAP[al] || []);

  const scores = {};
  criterios.forEach(c => {
    const el = document.getElementById(`rubric-crit-${c.id}`);
    if (el) scores[c.id] = el.value;
  });

  try {
    const res = await fetch('/api/admin/docentes/evaluar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        alliance: al,
        docenteNum: docNum,
        scores,
        delivered,
        loggedBy: `Docente ${docNum}`
      })
    });
    const result = await res.json();
    if (result.success) {
      if (result.discrepancyAlert) {
        showPuntosToast('⚠ ATENCIÓN: La diferencia de notas entre ambos docentes supera los 20 puntos. Se requiere revisión conjunta.');
      } else {
        showPuntosToast(`✓ Calificación de Docente ${docNum} para ${al} guardada con éxito (${result.totalScore || ''} pts).`);
      }
      await loadStats();
      renderDocenteRubricForm();
    } else {
      showPuntosToast(result.error || 'Error al guardar la evaluación');
    }
  } catch (e) {
    showPuntosToast('Error de conexión al guardar evaluación docente');
  }
}

async function submitSancion() {
  const al = document.getElementById('sancion-al').value;
  const pts = document.getElementById('sancion-pts').value;
  const motivo = document.getElementById('sancion-motivo').value;

  try {
    const res = await fetch('/api/admin/sanciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        alliance: al,
        pointsDeducted: pts,
        reason: motivo,
        authorizedBy: (currentUser?.name || 'Staff')
      })
    });
    if (res.ok) {
      alert(`Sanción de -${pts} pts aplicada a ${al}.`);
      loadStats();
    }
  } catch (e) {
    alert('Error');
  }
}

async function submitSorpresa() {
  const name = document.getElementById('sorp-name').value;
  const pT = document.getElementById('sorp-terror').value;
  const pS = document.getElementById('sorp-shooter').value;
  const pA = document.getElementById('sorp-action').value;

  try {
    const res = await fetch('/api/admin/sorpresas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        name,
        pointsAwarded: { Terror: pT, Shooter: pS, Action: pA },
        loggedBy: (currentUser?.name || 'Staff')
      })
    });
    if (res.ok) {
      alert('Puntos sorpresa sumados exitosamente.');
      loadStats();
    }
  } catch (e) {
    alert('Error');
  }
}

async function submitTarreoSignup() {
  const game = document.getElementById('tarreo-game').value;
  const name = document.getElementById('tarreo-student-name').value;
  const al = document.getElementById('tarreo-student-al').value;

  if (!name.trim()) return alert('Escribe el nombre del estudiante');

  try {
    const res = await fetch('/api/admin/tarreo/inscribir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, studentName: name, alliance: al })
    });
    const result = await res.json();
    if (result.success) {
      if (result.status === 'Lista de Espera') {
        alert(`Cupos completos (12). El estudiante quedó en LISTA DE ESPERA en la posición #${result.posicion}.`);
      } else {
        alert(`Inscrito exitosamente en ${game.toUpperCase()}`);
      }
      document.getElementById('tarreo-student-name').value = '';
    }
  } catch (e) {
    alert('Error');
  }
}

async function deleteAnnouncement(id) {
  try {
    const res = await fetch(`/api/admin/announcements/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.ok) {
      loadStats();
      setTimeout(() => switchAdminSection('avisos'), 100);
    }
  } catch (err) {
    console.error(err);
  }
}

async function submitNewAnnouncement() {
  const txt = document.getElementById('ann-input-text').value;
  if (!txt.trim()) return;

  try {
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ text: txt, target: 'all', loggedBy: (currentUser?.name || 'Staff') })
    });
    if (res.ok) {
      alert('Aviso publicado en tiempo real.');
      document.getElementById('ann-input-text').value = '';
      loadStats();
    }
  } catch (e) {
    alert('Error');
  }
}

// Modal handling
function openActivityDetail(id) {
  const act = (appData.activities || []).find(a => a.id === id);
  if (!act) return;

  const modal = document.getElementById('calc-modal');
  const content = document.getElementById('calc-modal-content');
  if (!modal || !content) return;

  content.innerHTML = `
    <div class="space-y-4">
      <div class="border-b border-slate-800 pb-3">
        <span class="text-xs font-bold uppercase tracking-wider text-red-500">${act.group}</span>
        <h3 class="text-2xl font-black font-heading text-white mt-1">${act.name}</h3>
        <span class="text-xs text-slate-400">${act.location} • Máximo ${act.maxPoints} pts</span>
      </div>

      <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
        <strong class="text-white block mb-1">Regla de Cálculo Oficial:</strong>
        ${act.type === 'gymkana' ? 
          'Puntaje Alianza = 3.000 × (Promedio de puntos por participante / 8). Cada participante suma 1 pt por intentar y 1 pt si resuelve cada uno de los 4 puestos.' : 
          (act.type === 'match_table' ? 
            'Torneo triangular: Victoria 3 pts, Empate 1 pt, Derrota 0 pts. Las posiciones de la tabla determinan el 1er lugar (4.000 pts), 2do lugar (2.400 pts) y 3er lugar (1.200 pts). En caso de empate en la tabla se reparten equitativamente.' : 
            `1er lugar: ${act.pointsDistribution[0]} pts (100%) | 2do lugar: ${act.pointsDistribution[1]} pts (60%) | 3er lugar: ${act.pointsDistribution[2]} pts (30%). Si hay empate se promedian los puntos.`
          )
        }
      </div>

      <div>
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Puntos Asignados</h4>
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="bg-red-950/40 border border-red-800/60 p-3 rounded-xl">
            <span class="text-xs text-red-400 font-bold block">Terror</span>
            <span class="text-xl font-mono font-black text-white">${act.pointsAwarded?.Terror || 0}</span>
          </div>
          <div class="bg-blue-950/40 border border-blue-800/60 p-3 rounded-xl">
            <span class="text-xs text-blue-400 font-bold block">Shooter</span>
            <span class="text-xl font-mono font-black text-white">${act.pointsAwarded?.Shooter || 0}</span>
          </div>
          <div class="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-xl">
            <span class="text-xs text-emerald-400 font-bold block">Action</span>
            <span class="text-xl font-mono font-black text-white">${act.pointsAwarded?.Action || 0}</span>
          </div>
        </div>
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

  const pts = appData.creativeChallenges?.pointsAwarded || {};
  const fav = appData.creativeChallenges?.favoriteAlliance;

  content.innerHTML = `
    <div class="space-y-4">
      <div class="border-b border-slate-800 pb-3">
        <span class="text-xs font-bold uppercase text-indigo-400">Desafíos Creativos</span>
        <h3 class="text-2xl font-black font-heading text-white mt-1">Cálculo de Desafíos (Máx 4.000 pts)</h3>
      </div>
      <p class="text-xs text-slate-300">
        Fórmula: 1.000 pts (entrega en plazo) + hasta 2.500 pts (nota promedio docente sobre 100 × 25) + 500 pts (mejor nota de las tres).
      </p>
      <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
        Obra con mejor nota docente actual: <strong class="text-white">${fav || 'Pendiente de evaluación'}</strong>
      </div>
      <div class="grid grid-cols-3 gap-3 text-center">
        <div class="bg-red-950/40 border border-red-800/60 p-3 rounded-xl">
          <span class="text-xs text-red-400 font-bold block">Terror</span>
          <span class="text-xl font-mono font-black text-white">${pts.Terror || 0}</span>
        </div>
        <div class="bg-blue-950/40 border border-blue-800/60 p-3 rounded-xl">
          <span class="text-xs text-blue-400 font-bold block">Shooter</span>
          <span class="text-xl font-mono font-black text-white">${pts.Shooter || 0}</span>
        </div>
        <div class="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-xl">
          <span class="text-xs text-emerald-400 font-bold block">Action</span>
          <span class="text-xl font-mono font-black text-white">${pts.Action || 0}</span>
        </div>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeCalcModal() {
  const modal = document.getElementById('calc-modal');
  if (modal) modal.classList.add('hidden');
}

// Staff Modal & Auth
function openStaffModal() {
  const modal = document.getElementById('staff-auth-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeStaffModal() {
  const modal = document.getElementById('staff-auth-modal');
  if (modal) modal.classList.add('hidden');
}

function handleStaffAuth(e) {
  e.preventDefault();
  const pin = document.getElementById('staff-pin-input').value.trim();
  const err = document.getElementById('auth-error-msg');

  if (pin === '2026') {
    adminToken = '2026';
    sessionStorage.setItem('adminToken', '2026');
    closeStaffModal();
    navigate('admin');
  } else {
    err.textContent = 'PIN incorrecto. Consulta con la mesa de coordinación.';
    err.classList.remove('hidden');
  }
}

function logoutStaff() {
  adminToken = null;
  sessionStorage.removeItem('adminToken');
  navigate('inicio');
}

// Countdown timer
function initCountdown() {
  const targetDate = new Date('2026-11-19T09:30:00').getTime();

  function update() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    const timerEl = document.getElementById('countdown-timer');
    const timerBig = document.getElementById('countdown-timer-big');
    const labelBig = document.getElementById('countdown-label-big');

    if (diff <= 0) {
      if (timerEl) timerEl.textContent = '¡EVENTO EN VIVO!';
      if (timerBig) timerBig.textContent = 'EN CURSO';
      if (labelBig) labelBig.textContent = 'ESTADO DE LA JORNADA';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60));
    const minutes = Math.floor((diff % (1000 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const str = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (timerEl) timerEl.textContent = str;
    if (timerBig) timerBig.textContent = `${hours}h ${minutes}m ${seconds}s`;
  }

  update();
  setInterval(update, 1000);
}

// =========================================================================
// MÓDULO 17: DASHBOARD EJECUTIVO Y AUDITORÍA (MESA DE CONTROL)

// =========================================================================
// MÓDULO 17: DASHBOARD EJECUTIVO Y AUDITORÍA (MESA DE CONTROL)
// =========================================================================
let currentDashboardSubTab = 'resumen';
let dashboardStatsData = null;

function renderDashboardPanel() {
  const tabs = [
    { id: 'resumen', label: '1. Resumen Ejecutivo', icon: 'layout-dashboard' },
    { id: 'participacion', label: '2. Participación (281)', icon: 'users' },
    { id: 'dia19', label: '3. Día 19 (En Cancha)', icon: 'clock' },
    { id: 'creativos', label: '4. Desafíos Creativos', icon: 'sparkles' },
    { id: 'tarreo', label: '5. Tarreo & Torneos', icon: 'gamepad-2' },
    { id: 'logistica', label: '6. Logística & Soporte', icon: 'shield-check' }
  ];

  return `
    <div class="space-y-5">
      <!-- HEADER DASHBOARD -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-900/40 px-2 py-0.5 rounded">
              Auditoría y Cierre Directivo
            </span>
            <span class="text-[11px] text-slate-500 font-mono">Semana de la Carrera 2026</span>
          </div>
          <h3 class="text-xl font-bold font-heading text-white tracking-tight">Dashboard Ejecutivo</h3>
          <p class="text-xs text-slate-400 mt-0.5">
            Informe oficial de gestión para el Jefe de Carrera y la Coordinadora. Resumen en una pantalla, padrón, cumplimiento horario, calibración docente y seguridad.
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="window.print()" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center gap-1.5 transition">
            <i data-lucide="printer" class="w-3.5 h-3.5 text-slate-400"></i>
            <span>Imprimir / PDF</span>
          </button>
          <button onclick="initDashboardModule()" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center gap-1.5 transition">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-slate-400"></i>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <!-- SUB-NAVBAR CON LOS 6 MÓDULOS -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-900/80">
        ${tabs.map(t => `
          <button 
            onclick="switchDashboardSubTab('${t.id}')"
            id="dash-tab-btn-${t.id}"
            class="px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${currentDashboardSubTab === t.id ? 'bg-slate-900 text-white border border-slate-700 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'}"
          >
            <i data-lucide="${t.icon}" class="w-3.5 h-3.5 ${currentDashboardSubTab === t.id ? 'text-white' : 'text-slate-500'}"></i>
            <span>${t.label}</span>
          </button>
        `).join('')}
      </div>

      <!-- ÁREA DE CONTENIDO DINÁMICO DEL DASHBOARD -->
      <div id="dashboard-content-area" class="min-h-[400px]">
        ${dashboardStatsData ? renderDashboardSubTabContent() : `
          <div class="py-16 text-center text-slate-500 text-xs font-mono">
            <div class="w-6 h-6 border-2 border-slate-700 border-t-white rounded-full animate-spin mx-auto mb-3"></div>
            Cargando indicadores ejecutivos y auditoría...
          </div>
        `}
      </div>
    </div>
  `;
}

async function initDashboardModule() {
  try {
    const res = await fetch('/api/dashboard/stats', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!res.ok) throw new Error('Error al cargar datos del dashboard');
    dashboardStatsData = await res.json();
    const area = document.getElementById('dashboard-content-area');
    if (area) {
      area.innerHTML = renderDashboardSubTabContent();
      lucide.createIcons();
    }
  } catch (err) {
    const area = document.getElementById('dashboard-content-area');
    if (area) {
      area.innerHTML = `<div class="p-6 text-center text-xs text-red-400 font-mono">Error al conectar con la API de auditoría.</div>`;
    }
  }
}

function switchDashboardSubTab(subTab) {
  currentDashboardSubTab = subTab;
  const area = document.getElementById('dashboard-content-area');
  if (area && dashboardStatsData) {
    area.innerHTML = renderDashboardSubTabContent();
    lucide.createIcons();
  }
  // Actualizar estilos de tabs
  const tabIds = ['resumen', 'participacion', 'dia19', 'creativos', 'tarreo', 'logistica'];
  tabIds.forEach(id => {
    const btn = document.getElementById(`dash-tab-btn-${id}`);
    if (btn) {
      if (id === subTab) {
        btn.className = 'px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 bg-slate-900 text-white border border-slate-700 shadow-sm';
      } else {
        btn.className = 'px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent';
      }
    }
  });
}

function renderDashboardSubTabContent() {
  if (!dashboardStatsData) return '';
  switch (currentDashboardSubTab) {
    case 'resumen': return renderDashboardResumenView(dashboardStatsData);
    case 'participacion': return renderDashboardParticipacionView(dashboardStatsData);
    case 'dia19': return renderDashboardDia19View(dashboardStatsData);
    case 'creativos': return renderDashboardCreativosView(dashboardStatsData);
    case 'tarreo': return renderDashboardTarreoView(dashboardStatsData);
    case 'logistica': return renderDashboardLogisticaView(dashboardStatsData);
    default: return renderDashboardResumenView(dashboardStatsData);
  }
}

// ----------------- SUB-VISTA 1: RESUMEN DEL EVENTO (1 PANTALLA) -----------------
function renderDashboardResumenView(data) {
  const s = data.summary;
  const colorMap = { Terror: 'text-red-400', Shooter: 'text-blue-400', Action: 'text-emerald-400' };
  const bgMap = { Terror: 'bg-red-950/40 border-red-900/60', Shooter: 'bg-blue-950/40 border-blue-900/60', Action: 'bg-emerald-950/40 border-emerald-900/60' };

  return `
    <div class="space-y-4">
      <!-- BANNER DE VEREDICTO DE JEFATURA DE CARRERA -->
      <div class="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-900/50 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0">
            <i data-lucide="check-circle-2" class="w-5 h-5"></i>
          </div>
          <div>
            <span class="text-[10px] font-mono uppercase text-emerald-400 font-bold block">Veredicto Oficial para Jefatura de Carrera</span>
            <span class="text-xs font-semibold text-white block mt-0.5">${s.verdict}</span>
          </div>
        </div>
        <div class="text-right sm:border-l sm:border-emerald-900/60 sm:pl-4 shrink-0">
          <span class="text-[10px] font-mono text-slate-400 block">Margen de Victoria</span>
          <span class="text-sm font-mono font-black text-emerald-400">+${(s.leaderMargin || 0).toLocaleString('es-CL')} pts</span>
        </div>
      </div>

      <!-- 4 TARJETAS DE INDICADORES CLAVE (1 SOLA PANTALLA) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        <!-- CARD 1: PODIO Y LÍDER -->
        <div class="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl space-y-2">
          <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">1. Marcador & Podio</span>
          <div class="flex items-baseline justify-between">
            <span class="text-2xl font-black font-heading ${colorMap[s.leader] || 'text-white'}">${s.leader}</span>
            <span class="text-xs font-mono font-bold text-slate-300">${(s.leaderPoints || 0).toLocaleString('es-CL')} pts</span>
          </div>
          <div class="space-y-1 pt-1 text-[11px] font-mono border-t border-slate-900">
            <div class="flex justify-between text-slate-400">
              <span>2° ${s.sortedAlliances[1]}:</span>
              <span class="text-white">${(s.totals[s.sortedAlliances[1]]?.total || 0).toLocaleString('es-CL')}</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>3° ${s.sortedAlliances[2]}:</span>
              <span class="text-white">${(s.totals[s.sortedAlliances[2]]?.total || 0).toLocaleString('es-CL')}</span>
            </div>
          </div>
        </div>

        <!-- CARD 2: ASISTENCIA MULTI-DÍA -->
        <div class="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl space-y-2">
          <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">2. Asistencia por Jornada</span>
          <div class="flex items-baseline justify-between">
            <span class="text-2xl font-black font-mono text-white">${s.attendancePerDay.day19}</span>
            <span class="text-[11px] text-slate-400">Día 19 (Cancha)</span>
          </div>
          <div class="space-y-1 pt-1 text-[11px] font-mono border-t border-slate-900">
            <div class="flex justify-between text-slate-400">
              <span>Día 20 (Tarreo presencial):</span>
              <span class="text-white">${s.attendancePerDay.day20_tarreo_attended} / ${s.attendancePerDay.day20_tarreo_registered || 48}</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Día 21 (Cierre & Premiación):</span>
              <span class="text-white">${s.attendancePerDay.day21_closing}</span>
            </div>
          </div>
        </div>

        <!-- CARD 3: TASA DE EJECUCIÓN -->
        <div class="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl space-y-2">
          <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">3. Tasa de Ejecución</span>
          <div class="flex items-baseline justify-between">
            <span class="text-2xl font-black font-mono text-emerald-400">${s.executionRate}%</span>
            <span class="text-[11px] text-slate-400">${s.completedActivities}/${s.totalActivities} Actividades</span>
          </div>
          <div class="space-y-1 pt-1 text-[11px] font-mono border-t border-slate-900">
            <div class="flex justify-between text-slate-400">
              <span>Desafíos evaluados:</span>
              <span class="text-white">3 de 3 (100%)</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Torneos ejecutados:</span>
              <span class="text-white">4 de 4 (100%)</span>
            </div>
          </div>
        </div>

        <!-- CARD 4: RECLAMOS Y SANCIONES -->
        <div class="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl space-y-2">
          <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">4. Gobernanza y Control</span>
          <div class="flex items-baseline justify-between">
            <span class="text-2xl font-black font-mono text-white">${s.reclamosSummary.total}</span>
            <span class="text-[11px] text-slate-400">Reclamos Ingresados</span>
          </div>
          <div class="space-y-1 pt-1 text-[11px] font-mono border-t border-slate-900">
            <div class="flex justify-between text-slate-400">
              <span>Resueltos formalmente:</span>
              <span class="text-emerald-400">${s.reclamosSummary.resueltos}</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Sanciones aplicadas:</span>
              <span class="text-amber-400">${s.sancionesCount} (-${s.totalSancionesPoints} pts)</span>
            </div>
          </div>
        </div>

      </div>

      <!-- COMPARADOR VISUAL DE BARRAS DE PUNTOS TOTALES -->
      <div class="p-5 bg-slate-900/30 border border-slate-900 rounded-2xl space-y-3">
        <div class="flex items-center justify-between border-b border-slate-900 pb-2">
          <span class="text-xs font-bold font-mono uppercase text-slate-400">Comparación Final de Rendimiento</span>
          <span class="text-[11px] text-slate-500 font-mono">Puntos Totales Acumulados</span>
        </div>
        <div class="space-y-2.5">
          ${s.sortedAlliances.map((al, idx) => {
            const pts = s.totals[al]?.total || 0;
            const maxPts = s.leaderPoints || 1;
            const pct = Math.max(8, Math.round((pts / maxPts) * 100));
            const barBg = al === 'Terror' ? 'bg-red-600' : (al === 'Shooter' ? 'bg-blue-600' : 'bg-emerald-600');
            return `
              <div>
                <div class="flex justify-between text-xs mb-1 font-mono">
                  <span class="font-bold text-white">${idx + 1}° Lugar: Alianza ${al}</span>
                  <span class="text-slate-300 font-bold">${pts.toLocaleString('es-CL')} pts</span>
                </div>
                <div class="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-900">
                  <div class="${barBg} h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

// ----------------- SUB-VISTA 2: PARTICIPACIÓN & PADRÓN (281) -----------------
function renderDashboardParticipacionView(data) {
  const p = data.participation;

  return `
    <div class="space-y-5">
      <!-- COBERTURA GENERAL DEL PADRÓN -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div class="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl">
          <span class="text-[10px] font-mono uppercase text-slate-500 block mb-1">Padrón Oficial Total</span>
          <span class="text-3xl font-black font-mono text-white">${p.totalRegistered}</span>
          <span class="text-xs text-slate-400 block mt-1">Estudiantes inscritos en nóminas</span>
        </div>
        <div class="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl">
          <span class="text-[10px] font-mono uppercase text-slate-500 block mb-1">Participantes Únicos en Cancha</span>
          <span class="text-3xl font-black font-mono text-emerald-400">${p.uniqueCount}</span>
          <span class="text-xs text-slate-400 block mt-1">${p.participationRate}% de cobertura activa</span>
        </div>
        <div class="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl">
          <span class="text-[10px] font-mono uppercase text-slate-500 block mb-1">Sin Participación en Cancha</span>
          <span class="text-3xl font-black font-mono text-slate-400">${p.nonParticipantsCount}</span>
          <span class="text-xs text-slate-500 block mt-1">Espectadores o apoyo logístico</span>
        </div>
      </div>

      <!-- PARTICIPACIÓN POR CARRERA Y POR ALIANZA -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        <!-- POR CARRERA -->
        <div class="bg-slate-900/30 border border-slate-900 p-4 rounded-2xl space-y-3">
          <h4 class="text-xs font-bold uppercase font-mono text-slate-300">Participación por Carrera</h4>
          <div class="space-y-2">
            ${Object.entries(p.careerStats).map(([career, c]) => {
              const pct = c.total > 0 ? Math.round((c.participated / c.total) * 100) : 0;
              return `
                <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div class="min-w-0 pr-2">
                    <span class="font-bold text-white block truncate">${career}</span>
                    <span class="text-[10px] text-slate-400">${c.participated} de ${c.total} estudiantes</span>
                  </div>
                  <div class="text-right shrink-0">
                    <span class="font-mono font-bold text-emerald-400 text-sm">${pct}%</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- POR ALIANZA -->
        <div class="bg-slate-900/30 border border-slate-900 p-4 rounded-2xl space-y-3">
          <h4 class="text-xs font-bold uppercase font-mono text-slate-300">Participación por Alianza</h4>
          <div class="space-y-2">
            ${Object.entries(p.allianceParticipation).map(([al, a]) => {
              const pct = a.total > 0 ? Math.round((a.participated / a.total) * 100) : 0;
              const badgeBg = al === 'Terror' ? 'bg-red-950 text-red-400 border-red-800' : (al === 'Shooter' ? 'bg-blue-950 text-blue-400 border-blue-800' : 'bg-emerald-950 text-emerald-400 border-emerald-800');
              return `
                <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeBg}">${al}</span>
                    <span class="text-slate-300">${a.participated} de ${a.total} integrantes</span>
                  </div>
                  <span class="font-mono font-bold text-white">${pct}%</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>

      <!-- RANKING DE CONVOCATORIA POR ACTIVIDAD -->
      <div class="bg-slate-900/30 border border-slate-900 p-4 rounded-2xl space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold uppercase font-mono text-slate-300">Ranking de Convocatoria por Actividad</h4>
          <span class="text-[11px] text-slate-500 font-mono">De mayor a menor cantidad de participantes</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          ${p.activitiesRanked.map((act, idx) => `
            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span class="text-[10px] font-mono text-slate-500 font-bold mb-1">#${idx + 1}</span>
              <span class="text-xs font-bold text-white block mb-2 truncate">${act.name}</span>
              <div class="flex items-center justify-between text-[11px] font-mono border-t border-slate-900 pt-1.5">
                <span class="text-slate-400">En cancha:</span>
                <span class="text-emerald-400 font-bold">${act.totalParticipants}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ----------------- SUB-VISTA 3: DÍA 19 (PUNTOS Y CUMPLIMIENTO HORARIO) -----------------
function renderDashboardDia19View(data) {
  const d = data.day19;

  return `
    <div class="space-y-5">
      <!-- CUMPLIMIENTO DE HORARIOS (PLANIFICADO VS REAL) -->
      <div class="bg-slate-900/30 border border-slate-900 p-4 rounded-2xl space-y-3">
        <div class="flex items-center justify-between border-b border-slate-900 pb-2">
          <div>
            <h4 class="text-xs font-bold uppercase font-mono text-slate-300">Auditoría de Cumplimiento de Horarios</h4>
            <p class="text-[11px] text-slate-500">Comparativa de tiempos de ejecución de las actividades del Día 19 en cancha</p>
          </div>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
            100% en Plazo
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-sans">
            <thead>
              <tr class="border-b border-slate-900 text-slate-500 font-mono text-[10px] uppercase">
                <th class="py-2 pr-4">Actividad</th>
                <th class="py-2 px-3">Horario Plan</th>
                <th class="py-2 px-3">Inicio Real</th>
                <th class="py-2 px-3">Término Real</th>
                <th class="py-2 px-3">Duración</th>
                <th class="py-2 px-3 text-right">Estatus</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-900 font-mono text-[11px]">
              ${Object.entries(d.scheduleLogs).map(([id, s]) => `
                <tr class="hover:bg-slate-900/20">
                  <td class="py-2.5 pr-4 font-sans font-bold text-white">${s.name}</td>
                  <td class="py-2.5 px-3 text-slate-400">${s.planned}</td>
                  <td class="py-2.5 px-3 text-slate-300">${s.actualStart}</td>
                  <td class="py-2.5 px-3 text-slate-300">${s.actualEnd}</td>
                  <td class="py-2.5 px-3 text-slate-300">${s.durationMin} min</td>
                  <td class="py-2.5 px-3 text-right">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                      ${s.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- CRONOLOGÍA DE CAMBIO DE LIDERAZGO -->
      <div class="bg-slate-900/30 border border-slate-900 p-4 rounded-2xl space-y-3">
        <h4 class="text-xs font-bold uppercase font-mono text-slate-300">Evolución Cronológica del Liderazgo</h4>
        <div class="space-y-2 text-xs">
          <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
            <span class="text-xs font-mono font-bold text-slate-500 shrink-0">10:00</span>
            <div>
              <span class="font-bold text-red-400 block">Torneo Retro Arcade</span>
              <p class="text-slate-400 text-[11px]">Alianza Terror toma la primera ventaja del día con 3.000 pts en Mortal Kombat.</p>
            </div>
          </div>
          <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
            <span class="text-xs font-mono font-bold text-slate-500 shrink-0">11:30</span>
            <div>
              <span class="font-bold text-blue-400 block">Gymkanas y Tarjetas de Destreza</span>
              <p class="text-slate-400 text-[11px]">Alianza Shooter acorta distancias con alto promedio en los 4 puestos de destreza.</p>
            </div>
          </div>
          <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
            <span class="text-xs font-mono font-bold text-slate-500 shrink-0">12:45</span>
            <div>
              <span class="font-bold text-white block">Triangulares de Baby Fútbol y Quemadas</span>
              <p class="text-slate-400 text-[11px]">Los deportes con 4.000 pts máx consolidan el podio definitivo de la jornada.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ----------------- SUB-VISTA 4: DESAFÍOS CREATIVOS (RÚBRICAS DOCENTES) -----------------
function renderDashboardCreativosView(data) {
  const c = data.creative;

  return `
    <div class="space-y-5">
      <!-- ESTADO DE ENTREGAS -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        ${['Terror', 'Shooter', 'Action'].map(al => {
          const st = c.status[al] || {};
          const rub = c.rubrics[al] || {};
          const pts = c.pointsAwarded[al] || 0;
          return `
            <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-mono font-bold text-white">Alianza ${al}</span>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded ${st.delivered ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-400'}">
                  ${st.delivered ? 'Entregado en Plazo' : 'Pendiente'}
                </span>
              </div>
              <span class="text-xs text-slate-300 font-semibold block">${rub.name || 'Desafío oficial'}</span>
              <div class="pt-2 border-t border-slate-900 flex items-center justify-between text-xs font-mono">
                <span class="text-slate-500">Puntos Totales:</span>
                <span class="text-emerald-400 font-bold">${pts.toLocaleString('es-CL')} pts</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- DESGLOSE DE RÚBRICAS DOCENTES Y CONTROL DE DISCREPANCIAS -->
      <div class="bg-slate-900/30 border border-slate-900 p-4 rounded-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-900 pb-2">
          <div>
            <h4 class="text-xs font-bold uppercase font-mono text-slate-300">Calibración Docente & Discrepancias</h4>
            <p class="text-[11px] text-slate-500">Auditoría de evaluación entre Docente 1 y Docente 2 (Límite de discrepancia: 20 pts)</p>
          </div>
          <span class="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800">
            Obra Favorita: <strong class="text-white">${c.favoriteAlliance || 'En evaluación'}</strong>
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          ${['Terror', 'Shooter', 'Action'].map(al => {
            const rub = c.rubrics[al] || {};
            const d1 = rub.docente1Nota !== null ? rub.docente1Nota : '-';
            const d2 = rub.docente2Nota !== null ? rub.docente2Nota : '-';
            const prom = rub.notaPromedio !== null ? rub.notaPromedio : '-';
            const hasAlert = rub.discrepancyAlert;

            return `
              <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-white">${al}</span>
                  ${hasAlert ? `
                    <span class="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">Alerta Discrepancia</span>
                  ` : `
                    <span class="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">Concordancia OK</span>
                  `}
                </div>
                <div class="space-y-1 font-mono text-[11px]">
                  <div class="flex justify-between text-slate-400">
                    <span>Docente 1:</span>
                    <span class="text-white">${d1}/100</span>
                  </div>
                  <div class="flex justify-between text-slate-400">
                    <span>Docente 2:</span>
                    <span class="text-white">${d2}/100</span>
                  </div>
                  <div class="flex justify-between text-slate-300 font-bold border-t border-slate-900 pt-1">
                    <span>Nota Promedio:</span>
                    <span class="text-emerald-400">${prom}/100</span>
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

// ----------------- SUB-VISTA 5: TARREO & TORNEOS NOCTURNOS -----------------
function renderDashboardTarreoView(data) {
  const t = data.tarreo.results;
  const copa = data.tarreo.copa;

  return `
    <div class="space-y-5">
      <!-- KPI DE ASISTENCIA Y CONVOCATORIA -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div class="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl">
          <span class="text-[10px] font-mono uppercase text-slate-500 block mb-1">Inscritos Oficiales</span>
          <span class="text-3xl font-black font-mono text-white">${t.attendance?.day20_tarreo_registered || 48}</span>
          <span class="text-xs text-slate-400 block mt-1">Capacidad de salas completa</span>
        </div>
        <div class="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl">
          <span class="text-[10px] font-mono uppercase text-slate-500 block mb-1">Asistentes Presenciales</span>
          <span class="text-3xl font-black font-mono text-emerald-400">${t.attendance?.day20_tarreo_attended || 45}</span>
          <span class="text-xs text-slate-400 block mt-1">93.8% de asistencia real</span>
        </div>
        <div class="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl">
          <span class="text-[10px] font-mono uppercase text-slate-500 block mb-1">Seguridad & Expulsiones</span>
          <span class="text-3xl font-black font-mono text-white">${t.security?.expulsions || 0}</span>
          <span class="text-xs text-emerald-400 block mt-1">Cero incidentes graves</span>
        </div>
      </div>

      <!-- TORNEOS INDIVIDUALES & MVP -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        <!-- CUADRO DE TORNEOS -->
        <div class="lg:col-span-2 bg-slate-900/30 border border-slate-900 p-4 rounded-2xl space-y-3">
          <h4 class="text-xs font-bold uppercase font-mono text-slate-300">Resultados de Torneos Individuales</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            ${(t.individualTournaments || []).map(tor => `
              <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <span class="font-bold text-white block">${tor.game}</span>
                <div class="font-mono text-[11px] space-y-0.5">
                  <div class="text-emerald-400">1° Campeón: ${tor.champion}</div>
                  <div class="text-slate-400">2° Subcampeón: ${tor.runnerUp}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- MVP DE LA NOCHE -->
        <div class="bg-slate-950 p-4 rounded-2xl border border-amber-900/40 space-y-3 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-1.5 text-amber-400 text-xs font-bold font-mono uppercase mb-2">
              <i data-lucide="crown" class="w-4 h-4"></i>
              <span>MVP de la Noche Gamer</span>
            </div>
            <span class="text-lg font-black font-heading text-white block">${t.mvp?.studentName}</span>
            <span class="text-xs text-slate-400 block">${t.mvp?.carrera} • Alianza ${t.mvp?.alliance}</span>
            <p class="text-xs text-slate-300 mt-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
              "${t.mvp?.achievement}"
            </p>
          </div>
          <div class="text-[10px] font-mono text-slate-500">
            Elegido por votación del staff de jueces y delegados.
          </div>
        </div>

      </div>
    </div>
  `;
}

// ----------------- SUB-VISTA 6: LOGÍSTICA & SOPORTE TÉCNICO -----------------
function renderDashboardLogisticaView(data) {
  const l = data.logistics;

  return `
    <div class="space-y-5">
      <!-- INVENTARIO DE RECURSOS POR PROVEEDOR -->
      <div class="bg-slate-900/30 border border-slate-900 p-4 rounded-2xl space-y-3">
        <div class="flex items-center justify-between border-b border-slate-900 pb-2">
          <div>
            <h4 class="text-xs font-bold uppercase font-mono text-slate-300">Recursos y Apoyos Institucionales Utilizados</h4>
            <p class="text-[11px] text-slate-500">Inventario oficial provisto por DAE, Jefatura de Carrera, Delegación y Sede</p>
          </div>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-bold">
            ${l.resources.length} Recursos Registrados
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          ${l.resources.map(r => `
            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-mono uppercase font-bold text-slate-500">${r.provider}</span>
                <span class="text-[10px] font-mono text-emerald-400">${r.status}</span>
              </div>
              <span class="font-bold text-white block">${r.item}</span>
              <span class="text-[10px] text-slate-400 block">${r.responsible || ''}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- BITÁCORA DE INCIDENTES TÉCNICOS RESUELTOS -->
      <div class="bg-slate-900/30 border border-slate-900 p-4 rounded-2xl space-y-3">
        <h4 class="text-xs font-bold uppercase font-mono text-slate-300">Bitácora de Incidentes Técnicos y Resolución</h4>
        <div class="space-y-2">
          ${l.incidents.map(inc => `
            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-[10px] font-mono font-bold text-slate-500">${inc.timestamp}</span>
                  <span class="font-bold text-white">${inc.description}</span>
                </div>
                <p class="text-[11px] text-emerald-400">Solución: ${inc.resolution}</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                ${inc.status}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// =========================================================================
// MÓDULO 16: CAMBIO E INTERCAMBIO DE ALIANZAS (MESA DE CONTROL)
// =========================================================================

// =========================================================================
// MÓDULO 16: CAMBIO E INTERCAMBIO DE ALIANZAS (MESA DE CONTROL)
// =========================================================================
let trasladosTab = 'individual'; // 'individual' | 'swap'
let selectedMoveStudent = null;
let selectedSwapStudent1 = null;
let selectedSwapStudent2 = null;
let trasladosHistoryData = [];
let moveSearchTimeout = null;
let swapSearchTimeout1 = null;
let swapSearchTimeout2 = null;

function renderTrasladosPanel() {
  return `
    <div class="space-y-6">
      <!-- HEADER DEL MÓDULO -->
      <div class="border-b border-slate-900 pb-4">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-[10px] font-mono uppercase tracking-wider text-amber-500 bg-amber-950/60 border border-amber-900/40 px-2 py-0.5 rounded">
            Módulo Oficial
          </span>
          <span class="text-[11px] text-slate-500 font-mono">Gestión de Nóminas</span>
        </div>
        <h3 class="text-xl font-bold font-heading text-white tracking-tight">Cambio e Intercambio de Alianzas</h3>
        <p class="text-xs text-slate-400 mt-1">
          Reasignación oficial de nóminas previa al evento. Permite reubicar a un estudiante individualmente o permutar 1 a 1 entre dos alianzas, con registro obligatorio de motivo en la bitácora de auditoría.
        </p>
      </div>

      <!-- TABS MINIMALISTAS: TRASLADO INDIVIDUAL VS PERMUTA 1 A 1 -->
      <div class="flex items-center gap-2 p-1 bg-slate-900/40 border border-slate-900 rounded-xl w-fit">
        <button 
          onclick="switchTrasladosTab('individual')"
          class="px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${trasladosTab === 'individual' ? 'bg-slate-900 text-white border border-slate-700 shadow-sm' : 'text-slate-400 hover:text-white border border-transparent'}"
        >
          <i data-lucide="user-minus" class="w-3.5 h-3.5"></i>
          <span>Traslado Individual</span>
        </button>
        <button 
          onclick="switchTrasladosTab('swap')"
          class="px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${trasladosTab === 'swap' ? 'bg-slate-900 text-white border border-slate-700 shadow-sm' : 'text-slate-400 hover:text-white border border-transparent'}"
        >
          <i data-lucide="arrow-left-right" class="w-3.5 h-3.5"></i>
          <span>Intercambio 1 a 1 (Permuta)</span>
        </button>
      </div>

      <!-- VISTA SEGÚN TAB ACTIVO -->
      <div id="traslados-tab-content">
        ${trasladosTab === 'individual' ? renderTrasladoIndividualView() : renderPermutaSwapView()}
      </div>

      <!-- HISTORIAL RECIENTE DE TRASLADOS Y PERMUTAS -->
      <div class="pt-4 border-t border-slate-900">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <i data-lucide="history" class="w-4 h-4 text-slate-500"></i>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Historial de Reasignaciones</h4>
          </div>
          <button onclick="loadTrasladosHistory()" class="text-[11px] text-slate-500 hover:text-slate-300 font-mono flex items-center gap-1 transition">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i>
            <span>Actualizar</span>
          </button>
        </div>
        <div id="traslados-history-list" class="space-y-2">
          <!-- Inyectado por renderTrasladosHistory() -->
          <div class="p-3 text-center text-xs text-slate-600 bg-slate-900/20 rounded-xl border border-slate-900 font-mono">
            Cargando historial...
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderTrasladoIndividualView() {
  const s = selectedMoveStudent;
  const validTargets = ['Terror', 'Shooter', 'Action'].filter(al => !s || al !== s.alliance);

  return `
    <div class="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 space-y-4">
      <div>
        <span class="text-[10px] font-mono uppercase text-slate-500 block mb-1">Paso 1: Localizar al estudiante</span>
        <div class="relative">
          <input 
            type="text" 
            id="move-search-input"
            placeholder="Buscar por Nombre, Apellido o RUT (ej: Sebastián o 21661083)..."
            oninput="handleMoveSearch(this.value)"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 font-sans"
            autocomplete="off"
          />
          <div id="move-autocomplete-dropdown" class="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-20 hidden max-h-52 overflow-y-auto divide-y divide-slate-800/60"></div>
        </div>
      </div>

      <!-- TARJETA DEL ESTUDIANTE SELECCIONADO -->
      ${s ? `
        <div class="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <div class="flex items-start justify-between gap-3 border-b border-slate-900 pb-3">
            <div>
              <span class="text-[10px] font-mono text-slate-500 block">Estudiante Seleccionado</span>
              <span class="text-sm font-bold text-white block mt-0.5">${s.name}</span>
              <span class="text-[11px] text-slate-400 block">${s.carrera || 'Carrera no informada'}</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] font-mono text-slate-500 block mb-1">Alianza Actual</span>
              <span class="px-2.5 py-1 rounded text-xs font-mono font-bold ${s.alliance === 'Terror' ? 'bg-red-950 text-red-400 border border-red-800/80' : (s.alliance === 'Shooter' ? 'bg-blue-950 text-blue-400 border border-blue-800/80' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/80')}">
                ${s.alliance}
              </span>
            </div>
          </div>

          <!-- SELECCIONAR NUEVA ALIANZA -->
          <div>
            <label class="text-[11px] text-slate-400 block mb-1.5 font-medium">Paso 2: Seleccionar Alianza de Destino</label>
            <div class="grid grid-cols-2 gap-2">
              ${validTargets.map(al => `
                <label class="flex items-center gap-2.5 p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition">
                  <input type="radio" name="target-alliance-move" value="${al}" class="text-white bg-slate-950 border-slate-700 focus:ring-0" checked>
                  <span class="text-xs font-semibold text-slate-200">${al}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- MOTIVO OBLIGATORIO -->
          <div>
            <label class="text-[11px] text-slate-400 block mb-1.5 font-medium">Paso 3: Motivo Oficial del Traslado (Obligatorio para auditoría)</label>
            <textarea 
              id="move-reason-input"
              rows="2"
              placeholder="Ej: Solicitud formal de coordinación por afinidad de horario / consentimiento de encargados..."
              class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button onclick="clearMoveSelection()" class="px-3.5 py-2 text-xs text-slate-400 hover:text-white font-mono bg-slate-900 rounded-lg border border-slate-800 transition">
              Cancelar
            </button>
            <button onclick="executeConfirmMove()" class="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition flex items-center gap-1.5 shadow-sm">
              <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span>Confirmar Traslado</span>
            </button>
          </div>
        </div>
      ` : `
        <div class="p-6 text-center border border-dashed border-slate-800/80 rounded-xl text-slate-500 text-xs font-mono">
          Escribe el nombre o RUT del estudiante arriba para preparar su traslado.
        </div>
      `}
    </div>
  `;
}

function renderPermutaSwapView() {
  const s1 = selectedSwapStudent1;
  const s2 = selectedSwapStudent2;

  const isSameStudent = s1 && s2 && s1.id === s2.id;
  const isSameAlliance = s1 && s2 && s1.alliance === s2.alliance;

  return `
    <div class="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 space-y-4">
      <div class="text-xs text-slate-400 leading-relaxed">
        <strong class="text-slate-200">Permuta Equilibrada:</strong> Selecciona a dos estudiantes pertenecientes a distintas alianzas. El sistema intercambiará sus alianzas en una única operación atómica, conservando exactamente el conteo original de integrantes.
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <!-- ESTUDIANTE 1 -->
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase text-slate-500 font-bold">Estudiante 1</span>
            ${s1 ? `<button onclick="clearSwapStudent(1)" class="text-[10px] text-slate-500 hover:text-red-400 font-mono">Cambiar</button>` : ''}
          </div>

          ${s1 ? `
            <div>
              <span class="text-sm font-bold text-white block">${s1.name}</span>
              <span class="text-[11px] text-slate-400 block">${s1.carrera || 'Carrera no informada'}</span>
              <div class="mt-2 flex items-center gap-2">
                <span class="text-[10px] text-slate-500 font-mono">Alianza:</span>
                <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold ${s1.alliance === 'Terror' ? 'bg-red-950 text-red-400 border border-red-800/80' : (s1.alliance === 'Shooter' ? 'bg-blue-950 text-blue-400 border border-blue-800/80' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/80')}">
                  ${s1.alliance}
                </span>
              </div>
            </div>
          ` : `
            <div class="relative">
              <input 
                type="text" 
                id="swap-search-1"
                placeholder="Buscar Estudiante 1 (Nombre o RUT)..."
                oninput="handleSwapSearch(1, this.value)"
                class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 font-sans"
                autocomplete="off"
              />
              <div id="swap-autocomplete-1" class="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-20 hidden max-h-44 overflow-y-auto divide-y divide-slate-800/60"></div>
            </div>
          `}
        </div>

        <!-- ESTUDIANTE 2 -->
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase text-slate-500 font-bold">Estudiante 2</span>
            ${s2 ? `<button onclick="clearSwapStudent(2)" class="text-[10px] text-slate-500 hover:text-red-400 font-mono">Cambiar</button>` : ''}
          </div>

          ${s2 ? `
            <div>
              <span class="text-sm font-bold text-white block">${s2.name}</span>
              <span class="text-[11px] text-slate-400 block">${s2.carrera || 'Carrera no informada'}</span>
              <div class="mt-2 flex items-center gap-2">
                <span class="text-[10px] text-slate-500 font-mono">Alianza:</span>
                <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold ${s2.alliance === 'Terror' ? 'bg-red-950 text-red-400 border border-red-800/80' : (s2.alliance === 'Shooter' ? 'bg-blue-950 text-blue-400 border border-blue-800/80' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/80')}">
                  ${s2.alliance}
                </span>
              </div>
            </div>
          ` : `
            <div class="relative">
              <input 
                type="text" 
                id="swap-search-2"
                placeholder="Buscar Estudiante 2 (Nombre o RUT)..."
                oninput="handleSwapSearch(2, this.value)"
                class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 font-sans"
                autocomplete="off"
              />
              <div id="swap-autocomplete-2" class="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-20 hidden max-h-44 overflow-y-auto divide-y divide-slate-800/60"></div>
            </div>
          `}
        </div>
      </div>

      <!-- PREVIEW Y CONFIRMACIÓN DE LA PERMUTA -->
      ${s1 && s2 ? `
        <div class="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          ${isSameStudent ? `
            <div class="p-3 bg-red-950/40 border border-red-900/60 rounded-lg text-xs text-red-300 font-mono">
              <i data-lucide="alert-circle" class="w-4 h-4 inline mr-1"></i> No puedes permutar al mismo estudiante consigo mismo.
            </div>
          ` : (isSameAlliance ? `
            <div class="p-3 bg-amber-950/40 border border-amber-900/60 rounded-lg text-xs text-amber-300 font-mono">
              <i data-lucide="alert-triangle" class="w-4 h-4 inline mr-1"></i> Ambos estudiantes ya pertenecen a la misma alianza (${s1.alliance}). La permuta debe realizarse entre alianzas distintas.
            </div>
          ` : `
            <div class="space-y-2">
              <span class="text-[10px] font-mono uppercase text-slate-500 block font-bold">Vista Previa de la Permuta</span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div class="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                  <span class="font-bold text-white block truncate">${s1.name}</span>
                  <div class="flex items-center gap-1.5 mt-1 font-mono text-[11px]">
                    <span class="text-slate-400">${s1.alliance}</span>
                    <i data-lucide="arrow-right" class="w-3 h-3 text-emerald-400"></i>
                    <span class="text-emerald-400 font-bold">${s2.alliance}</span>
                  </div>
                </div>
                <div class="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                  <span class="font-bold text-white block truncate">${s2.name}</span>
                  <div class="flex items-center gap-1.5 mt-1 font-mono text-[11px]">
                    <span class="text-slate-400">${s2.alliance}</span>
                    <i data-lucide="arrow-right" class="w-3 h-3 text-emerald-400"></i>
                    <span class="text-emerald-400 font-bold">${s1.alliance}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label class="text-[11px] text-slate-400 block mb-1.5 font-medium">Motivo Oficial de la Permuta (Obligatorio para auditoría)</label>
              <textarea 
                id="swap-reason-input"
                rows="2"
                placeholder="Ej: Permuta mutua acordada y firmada por ambos estudiantes por motivo de compatibilidad..."
                class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700"
              ></textarea>
            </div>

            <div class="flex items-center justify-end gap-2 pt-1">
              <button onclick="clearSwapSelection()" class="px-3.5 py-2 text-xs text-slate-400 hover:text-white font-mono bg-slate-900 rounded-lg border border-slate-800 transition">
                Limpiar Selección
              </button>
              <button onclick="executeConfirmSwap()" class="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition flex items-center gap-1.5 shadow-sm">
                <i data-lucide="arrow-left-right" class="w-3.5 h-3.5 text-emerald-400"></i>
                <span>Confirmar Permuta Atómica</span>
              </button>
            </div>
          `)}
        </div>
      ` : ''}
    </div>
  `;
}

function initTrasladosModule() {
  loadTrasladosHistory();
}

function switchTrasladosTab(tab) {
  trasladosTab = tab;
  const content = document.getElementById('traslados-tab-content');
  if (content) {
    content.innerHTML = tab === 'individual' ? renderTrasladoIndividualView() : renderPermutaSwapView();
    const tabButtons = document.querySelectorAll('[onclick^="switchTrasladosTab"]');
    tabButtons.forEach(btn => {
      const isInd = btn.getAttribute('onclick').includes('individual');
      if ((isInd && tab === 'individual') || (!isInd && tab === 'swap')) {
        btn.className = 'px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 bg-slate-900 text-white border border-slate-700 shadow-sm';
      } else {
        btn.className = 'px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 text-slate-400 hover:text-white border border-transparent';
      }
    });
    lucide.createIcons();
  } else {
    renderCurrentTab();
  }
}

async function handleMoveSearch(query) {
  clearTimeout(moveSearchTimeout);
  const q = (query || '').trim();
  const box = document.getElementById('move-autocomplete-dropdown');
  if (!box) return;

  if (q.length < 2) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }

  moveSearchTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`/api/students/search?q=${encodeURIComponent(q)}`);
      const students = await res.json();
      if (students.length === 0) {
        box.innerHTML = `<div class="p-3 text-xs text-slate-500 text-center font-mono">No se encontraron estudiantes con "${q}".</div>`;
        box.classList.remove('hidden');
        return;
      }

      box.innerHTML = students.map(s => `
        <div onmousedown="event.preventDefault(); selectMoveStudent(${JSON.stringify(s).replace(/"/g, '&quot;')})" class="p-2.5 hover:bg-slate-800 cursor-pointer text-xs flex items-center justify-between transition">
          <div class="min-w-0 pr-2">
            <span class="font-bold text-white block truncate">${s.name}</span>
            <span class="text-[10px] text-slate-400 block truncate">${s.carrera}</span>
          </div>
          <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${s.alliance === 'Terror' ? 'bg-red-950 text-red-400 border border-red-800/80' : (s.alliance === 'Shooter' ? 'bg-blue-950 text-blue-400 border border-blue-800/80' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/80')}">
            ${s.alliance}
          </span>
        </div>
      `).join('');
      box.classList.remove('hidden');
    } catch (e) {
      console.error(e);
    }
  }, 150);
}

function selectMoveStudent(student) {
  selectedMoveStudent = student;
  const box = document.getElementById('move-autocomplete-dropdown');
  if (box) box.classList.add('hidden');
  const content = document.getElementById('traslados-tab-content');
  if (content) {
    content.innerHTML = renderTrasladoIndividualView();
    lucide.createIcons();
  }
}

function clearMoveSelection() {
  selectedMoveStudent = null;
  const content = document.getElementById('traslados-tab-content');
  if (content) {
    content.innerHTML = renderTrasladoIndividualView();
    lucide.createIcons();
  }
}

async function executeConfirmMove() {
  if (!selectedMoveStudent) return;
  const radio = document.querySelector('input[name="target-alliance-move"]:checked');
  if (!radio) {
    alert('Seleccione la alianza de destino');
    return;
  }
  const targetAlliance = radio.value;
  const reasonInput = document.getElementById('move-reason-input');
  const reason = (reasonInput?.value || '').trim();

  if (!reason) {
    alert('El motivo del traslado es obligatorio para fines de auditoría.');
    if (reasonInput) reasonInput.focus();
    return;
  }

  try {
    const res = await fetch('/api/admin/students/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        studentId: selectedMoveStudent.id,
        targetAlliance,
        reason,
        loggedBy: (currentUser?.name || 'Staff')
      })
    });

    const result = await res.json();
    if (!res.ok) {
      alert(result.error || 'Error al realizar el traslado');
      return;
    }

    alert(`Traslado confirmado: ${result.student.name} ahora forma parte de la Alianza ${targetAlliance}.`);
    selectedMoveStudent = null;
    const content = document.getElementById('traslados-tab-content');
    if (content) {
      content.innerHTML = renderTrasladoIndividualView();
      lucide.createIcons();
    }
    loadStats();
    loadTrasladosHistory();
  } catch (e) {
    alert('Error de conexión al realizar el traslado');
  }
}

async function handleSwapSearch(slot, query) {
  const timeoutVar = slot === 1 ? swapSearchTimeout1 : swapSearchTimeout2;
  clearTimeout(timeoutVar);
  const q = (query || '').trim();
  const box = document.getElementById(`swap-autocomplete-${slot}`);
  if (!box) return;

  if (q.length < 2) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }

  const newTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`/api/students/search?q=${encodeURIComponent(q)}`);
      const students = await res.json();
      if (students.length === 0) {
        box.innerHTML = `<div class="p-3 text-xs text-slate-500 text-center font-mono">No se encontraron estudiantes con "${q}".</div>`;
        box.classList.remove('hidden');
        return;
      }

      box.innerHTML = students.map(s => `
        <div onmousedown="event.preventDefault(); selectSwapStudent(${slot}, ${JSON.stringify(s).replace(/"/g, '&quot;')})" class="p-2.5 hover:bg-slate-800 cursor-pointer text-xs flex items-center justify-between transition">
          <div class="min-w-0 pr-2">
            <span class="font-bold text-white block truncate">${s.name}</span>
            <span class="text-[10px] text-slate-400 block truncate">${s.carrera}</span>
          </div>
          <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${s.alliance === 'Terror' ? 'bg-red-950 text-red-400 border border-red-800/80' : (s.alliance === 'Shooter' ? 'bg-blue-950 text-blue-400 border border-blue-800/80' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/80')}">
            ${s.alliance}
          </span>
        </div>
      `).join('');
      box.classList.remove('hidden');
    } catch (e) {
      console.error(e);
    }
  }, 150);

  if (slot === 1) swapSearchTimeout1 = newTimeout;
  else swapSearchTimeout2 = newTimeout;
}

function selectSwapStudent(slot, student) {
  if (slot === 1) selectedSwapStudent1 = student;
  else selectedSwapStudent2 = student;

  const box = document.getElementById(`swap-autocomplete-${slot}`);
  if (box) box.classList.add('hidden');
  const content = document.getElementById('traslados-tab-content');
  if (content) {
    content.innerHTML = renderPermutaSwapView();
    lucide.createIcons();
  }
}

function clearSwapStudent(slot) {
  if (slot === 1) selectedSwapStudent1 = null;
  else selectedSwapStudent2 = null;

  const content = document.getElementById('traslados-tab-content');
  if (content) {
    content.innerHTML = renderPermutaSwapView();
    lucide.createIcons();
  }
}

function clearSwapSelection() {
  selectedSwapStudent1 = null;
  selectedSwapStudent2 = null;
  const content = document.getElementById('traslados-tab-content');
  if (content) {
    content.innerHTML = renderPermutaSwapView();
    lucide.createIcons();
  }
}

async function executeConfirmSwap() {
  if (!selectedSwapStudent1 || !selectedSwapStudent2) return;
  const reasonInput = document.getElementById('swap-reason-input');
  const reason = (reasonInput?.value || '').trim();

  if (!reason) {
    alert('El motivo de la permuta es obligatorio para fines de auditoría.');
    if (reasonInput) reasonInput.focus();
    return;
  }

  try {
    const res = await fetch('/api/admin/students/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        student1Id: selectedSwapStudent1.id,
        student2Id: selectedSwapStudent2.id,
        reason,
        loggedBy: (currentUser?.name || 'Staff')
      })
    });

    const result = await res.json();
    if (!res.ok) {
      alert(result.error || 'Error al realizar la permuta');
      return;
    }

    alert(`Permuta exitosa:\n• ${result.student1.name} pasa a Alianza ${result.student1.alliance}\n• ${result.student2.name} pasa a Alianza ${result.student2.alliance}`);
    selectedSwapStudent1 = null;
    selectedSwapStudent2 = null;
    const content = document.getElementById('traslados-tab-content');
    if (content) {
      content.innerHTML = renderPermutaSwapView();
      lucide.createIcons();
    }
    loadStats();
    loadTrasladosHistory();
  } catch (e) {
    alert('Error de conexión al realizar la permuta');
  }
}

async function loadTrasladosHistory() {
  const container = document.getElementById('traslados-history-list');
  if (!container) return;

  try {
    const res = await fetch('/api/admin/students/transfers-history', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!res.ok) throw new Error('Error al cargar historial');
    const logs = await res.json();
    trasladosHistoryData = logs;

    if (logs.length === 0) {
      container.innerHTML = `
        <div class="p-4 text-center text-xs text-slate-500 bg-slate-900/20 rounded-xl border border-slate-900 font-mono">
          No hay registros de traslados ni permutas todavía.
        </div>
      `;
      return;
    }

    container.innerHTML = logs.slice(0, 15).map(l => {
      const isSwap = l.details?.type === 'swap';
      return `
        <div class="p-3 bg-slate-900/40 border border-slate-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isSwap ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60' : 'bg-blue-950/80 text-blue-300 border border-blue-800/60'}">
                ${isSwap ? 'Permuta 1 a 1' : 'Traslado'}
              </span>
              <span class="font-bold text-white truncate">${l.action}</span>
            </div>
            ${l.details?.reason ? `
              <p class="text-[11px] text-slate-400 italic">Motivo: "${l.details.reason}"</p>
            ` : ''}
          </div>
          <div class="text-right text-[10px] font-mono text-slate-500 shrink-0">
            <span class="block">${l.user || 'Staff'}</span>
            <span class="block text-slate-600">${new Date(l.timestamp).toLocaleString('es-CL')}</span>
          </div>
        </div>
      `;
    }).join('');
    lucide.createIcons();
  } catch (e) {
    container.innerHTML = `<div class="p-3 text-center text-xs text-red-400 font-mono">Error al cargar historial de traslados.</div>`;
  }
}

// =========================================================================
// MÓDULO 15: PARTICIPANTES POR ACTIVIDAD (ORGANIZACIÓN / MESA DE CONTROL)
// =========================================================================

// Countdown timer
function initCountdown() {
  const targetDate = new Date('2026-11-19T09:30:00').getTime();

  function update() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    const timerEl = document.getElementById('countdown-timer');
    const timerBig = document.getElementById('countdown-timer-big');
    const labelBig = document.getElementById('countdown-label-big');

    if (diff <= 0) {
      if (timerEl) timerEl.textContent = '¡EVENTO EN VIVO!';
      if (timerBig) timerBig.textContent = 'EN CURSO';
      if (labelBig) labelBig.textContent = 'ESTADO DE LA JORNADA';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60));
    const minutes = Math.floor((diff % (1000 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const str = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (timerEl) timerEl.textContent = str;
    if (timerBig) timerBig.textContent = `${hours}h ${minutes}m ${seconds}s`;
  }

  update();
  setInterval(update, 1000);
}

// =========================================================================
// MÓDULO 15: PARTICIPANTES POR ACTIVIDAD (ORGANIZACIÓN / MESA DE CONTROL)
// =========================================================================
let currentSelectedActivityId = 'retro';
let activeActivityParticipantsData = null;
var pendingReasonCallback = null;

function renderParticipantesPanel() {
  const activities = (appData.activities || []).map(a => ({
    id: a.id,
    name: a.name,
    status: a.status
  }));

  return `
    <div class="space-y-4">
      
      <!-- HEADER MINIMALISTA DE LA NÓMINA EN CANCHA -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-3">
        <div>
          <div class="flex items-center gap-2 mb-0.5">
            <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500">Mando de Cancha</span>
            <span class="text-slate-700">•</span>
            <span class="text-[10px] font-mono text-slate-400">Cupos y Asistencia</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold font-heading text-white tracking-tight">Participantes por Actividad</h2>
        </div>

        <!-- ACCIONES RÁPIDAS (EXCEL, IMPRIMIR, BUSCADOR) -->
        <div class="flex items-center gap-2 shrink-0">
          <button 
            onclick="exportCurrentActivityCSV()" 
            title="Descargar lista oficial en Excel / CSV"
            class="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition flex items-center gap-1.5 font-mono"
          >
            <i data-lucide="download" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span class="hidden sm:inline">CSV</span>
          </button>
          
          <button 
            onclick="window.print()" 
            title="Imprimir hoja de control de cancha"
            class="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition flex items-center gap-1.5 font-mono"
          >
            <i data-lucide="printer" class="w-3.5 h-3.5 text-blue-400"></i>
            <span class="hidden sm:inline">Imprimir</span>
          </button>
          
          <button 
            onclick="openStudentSearchModal()" 
            title="Buscar ficha individual de estudiante"
            class="py-1.5 px-3 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 text-xs font-medium border border-amber-800/40 transition flex items-center gap-1.5 font-mono"
          >
            <i data-lucide="user" class="w-3.5 h-3.5 text-amber-400"></i>
            <span>Ficha Alumno</span>
          </button>
        </div>
      </div>

      <!-- SELECTOR DE ACTIVIDAD Y ESTADO DE LISTA (STRIP COMPACTO) -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 border border-slate-900 rounded-xl p-3">
        <div class="flex items-center gap-2 flex-1 max-w-md">
          <label for="part-act-select" class="text-xs text-slate-500 font-medium shrink-0 font-mono">Actividad:</label>
          <select 
            id="part-act-select" 
            onchange="switchActivityParticipants(this.value)" 
            class="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-slate-700 font-sans"
          >
            ${activities.map(a => `
              <option value="${a.id}" ${a.id === currentSelectedActivityId ? 'selected' : ''}>
                ${a.name} (${a.status})
              </option>
            `).join('')}
          </select>
        </div>

        <!-- ESTADO DE LA LISTA: ABIERTA VS CERRADA -->
        <div id="part-list-status-container" class="flex items-center gap-2">
          <!-- Inyectado dinámicamente -->
        </div>
      </div>

      <!-- STRIP DE REGLA Y CUPO OFICIAL -->
      <div id="part-rule-banner" class="bg-slate-950/60 border border-slate-900/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <!-- Inyectado dinámicamente -->
      </div>

      <!-- SELECTOR DE ALIANZA EN MÓVIL (< md) -->
      <div class="block md:hidden bg-slate-950 border border-slate-900 rounded-xl p-1.5 mb-3">
        <div class="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button 
            type="button" 
            onclick="filterMobileAllianceCols('all')" 
            id="tab-al-col-all" 
            class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition bg-slate-800 text-white border border-slate-700 shadow-sm"
          >
            Todas
          </button>
          <button 
            type="button" 
            onclick="filterMobileAllianceCols('Terror')" 
            id="tab-al-col-Terror" 
            class="px-3 py-1.5 rounded-lg text-xs font-mono transition text-red-400 hover:text-white border border-transparent"
          >
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1"></span>Terror
          </button>
          <button 
            type="button" 
            onclick="filterMobileAllianceCols('Shooter')" 
            id="tab-al-col-Shooter" 
            class="px-3 py-1.5 rounded-lg text-xs font-mono transition text-blue-400 hover:text-white border border-transparent"
          >
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-1"></span>Shooter
          </button>
          <button 
            type="button" 
            onclick="filterMobileAllianceCols('Action')" 
            id="tab-al-col-Action" 
            class="px-3 py-1.5 rounded-lg text-xs font-mono transition text-emerald-400 hover:text-white border border-transparent"
          >
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>Action
          </button>
        </div>
      </div>

      <!-- VISTA EN 3 COLUMNAS: TERROR (ROJO), SHOOTER (AZUL), ACTION (VERDE) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="three-columns-container">
        
        <!-- COLUMNA TERROR -->
        <div id="col-alliance-terror" class="bg-slate-950 border border-slate-900 hover:border-red-950/80 rounded-xl p-3.5 flex flex-col justify-between transition shadow-sm">
          <div>
            <div class="flex items-center justify-between border-b border-slate-900 pb-2.5 mb-3">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-red-500"></span>
                <h3 class="text-xs font-bold font-mono uppercase tracking-wider text-white">Alianza Terror</h3>
              </div>
              <span id="counter-terror" class="text-[11px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                0 de -
              </span>
            </div>

            <!-- BUSCADOR CON AUTOCOMPLETADO TERROR -->
            <div class="relative mb-2.5">
              <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-600">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              </div>
              <input 
                type="text" 
                id="search-input-terror" 
                placeholder="Anotar estudiante de Terror..." 
                onfocus="handleParticipantAutocomplete('Terror', this.value)" oninput="handleParticipantAutocomplete('Terror', this.value)"
                class="w-full bg-slate-900/70 border border-slate-800/90 rounded-lg text-xs py-1.5 pl-8 pr-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-700/60 transition"
              />
              <div id="autocomplete-terror" class="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-20 hidden max-h-56 overflow-y-auto"></div>
            </div>

            <!-- LISTA DE ESTUDIANTES AGREGADOS TERROR -->
            <div id="list-terror" class="space-y-1.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
              <!-- Inyectado dinámicamente -->
            </div>
          </div>
        </div>

        <!-- COLUMNA SHOOTER -->
        <div id="col-alliance-shooter" class="bg-slate-950 border border-slate-900 hover:border-blue-950/80 rounded-xl p-3.5 flex flex-col justify-between transition shadow-sm">
          <div>
            <div class="flex items-center justify-between border-b border-slate-900 pb-2.5 mb-3">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                <h3 class="text-xs font-bold font-mono uppercase tracking-wider text-white">Alianza Shooter</h3>
              </div>
              <span id="counter-shooter" class="text-[11px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                0 de -
              </span>
            </div>

            <!-- BUSCADOR CON AUTOCOMPLETADO SHOOTER -->
            <div class="relative mb-2.5">
              <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-600">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              </div>
              <input 
                type="text" 
                id="search-input-shooter" 
                placeholder="Anotar estudiante de Shooter..." 
                onfocus="handleParticipantAutocomplete('Shooter', this.value)" oninput="handleParticipantAutocomplete('Shooter', this.value)"
                class="w-full bg-slate-900/70 border border-slate-800/90 rounded-lg text-xs py-1.5 pl-8 pr-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-700/60 transition"
              />
              <div id="autocomplete-shooter" class="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-20 hidden max-h-56 overflow-y-auto"></div>
            </div>

            <!-- LISTA DE ESTUDIANTES AGREGADOS SHOOTER -->
            <div id="list-shooter" class="space-y-1.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
              <!-- Inyectado dinámicamente -->
            </div>
          </div>
        </div>

        <!-- COLUMNA ACTION -->
        <div id="col-alliance-action" class="bg-slate-950 border border-slate-900 hover:border-emerald-950/80 rounded-xl p-3.5 flex flex-col justify-between transition shadow-sm">
          <div>
            <div class="flex items-center justify-between border-b border-slate-900 pb-2.5 mb-3">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <h3 class="text-xs font-bold font-mono uppercase tracking-wider text-white">Alianza Action</h3>
              </div>
              <span id="counter-action" class="text-[11px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                0 de -
              </span>
            </div>

            <!-- BUSCADOR CON AUTOCOMPLETADO ACTION -->
            <div class="relative mb-2.5">
              <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-600">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              </div>
              <input 
                type="text" 
                id="search-input-action" 
                placeholder="Anotar estudiante de Action..." 
                onfocus="handleParticipantAutocomplete('Action', this.value)" oninput="handleParticipantAutocomplete('Action', this.value)"
                class="w-full bg-slate-900/70 border border-slate-800/90 rounded-lg text-xs py-1.5 pl-8 pr-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-700/60 transition"
              />
              <div id="autocomplete-action" class="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-20 hidden max-h-56 overflow-y-auto"></div>
            </div>

            <!-- LISTA DE ESTUDIANTES AGREGADOS ACTION -->
            <div id="list-action" class="space-y-1.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
              <!-- Inyectado dinámicamente -->
            </div>
          </div>
        </div>

      </div>

      <!-- BITÁCORA DE AUDITORÍA Y TRAZABILIDAD (MINIMALISTA) -->
      <div class="bg-slate-950 border border-slate-900 rounded-xl p-3.5 mt-2">
        <div class="flex items-center justify-between border-b border-slate-900 pb-2 mb-2">
          <span class="text-xs font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
            <i data-lucide="history" class="w-3.5 h-3.5 text-slate-500"></i> Bitácora de Auditoría en Cancha
          </span>
          <span class="text-[10px] text-slate-400 font-mono">Trazabilidad oficial de cambios y reaperturas</span>
        </div>
        <div id="part-audit-log" class="space-y-1 text-xs text-slate-400 max-h-36 overflow-y-auto custom-scrollbar">
          <!-- Inyectado dinámicamente -->
        </div>
      </div>

    </div>
  `;
}

function renderActivityParticipantsView() {
  const data = activeActivityParticipantsData;
  if (!data) return;

  // 1. Status Container (Cerrar / Reabrir) - Minimalist
  const statusEl = document.getElementById('part-list-status-container');
  if (statusEl) {
    if (data.isClosed) {
      statusEl.innerHTML = `
        <span class="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-red-400 bg-red-950/40 border border-red-900/60 px-2.5 py-1 rounded-lg">
          <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Lista Oficial Cerrada
        </span>
        <button onclick="requestReopenActivityList()" class="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium py-1 px-2.5 rounded-lg border border-slate-800 transition">
          Reabrir
        </button>
      `;
    } else {
      statusEl.innerHTML = `
        <span class="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2.5 py-1 rounded-lg">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Lista Abierta
        </span>
        <button onclick="closeCurrentActivityList()" class="text-xs bg-slate-900 hover:bg-red-950/60 text-slate-300 hover:text-red-300 font-medium py-1 px-2.5 rounded-lg border border-slate-800 hover:border-red-900/60 transition">
          Cerrar Lista
        </button>
      `;
    }
  }

  // 2. Banner de Reglas - Minimalist Single Line
  const bannerEl = document.getElementById('part-rule-banner');
  if (bannerEl) {
    const quotaText = data.quotaPerAlliance !== null ? `${data.quotaPerAlliance} estudiantes por alianza` : 'Entrada libre (sin límite estricto)';
    let ruleDetail = '';
    if (data.activityId === 'retro') ruleDetail = '4 titulares + 1 suplente por alianza. 3 enfrentamientos de 4 duelos 1v1 al mejor de 3 rondas. Gana la alianza con más victorias (máx 8). Desempate por rondas a favor.';
    else if (data.activityId === 'tacataca') ruleDetail = 'Duplas. Partidos a 5 goles. Máximo 2 partidos por persona para garantizar rotación.';
    else if (data.activityId === 'pingpong') ruleDetail = 'Partidos a 7 puntos. Máximo 2 partidos por persona para garantizar rotación.';
    else if (data.activityId === 'tacapingpong') ruleDetail = 'Duplas. Máximo 2 partidos por persona para garantizar rotación.';
    else if (data.activityId === 'babyfutbol') ruleDetail = '5 por equipo (con arquero). Rotar integrantes entre partidos.';
    else if (data.activityId === 'quemadas') ruleDetail = '8 vs 8. Rotar integrantes en cada ronda. Sin límite de tiempo (salvo aviso por alargue). Balones blandos sin golpes a la cabeza. Si se atrapa la pelota, sale el lanzador.';
    else if (data.activityId === 'trivia') ruleDetail = '3 representantes por alianza respondiendo con paletas.';
    else if (data.activityId === 'canto') ruleDetail = 'Fila de 8 cantantes por alianza frente al escenario.';
    else if (data.activityId === 'gymkanas') ruleDetail = 'Anotar puntaje individual (0 a 8 pts) por estudiante.';
    else if (data.activityId === 'barra') ruleDetail = 'Participación comunitaria masiva. No requiere nómina individual.';

    bannerEl.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-slate-300 font-medium">Cupo oficial:</span>
        <span class="text-white font-mono font-semibold">${quotaText}</span>
      </div>
      <div class="text-[11px] text-slate-400 truncate">
        ${ruleDetail}
      </div>
    `;
  }

  // 3. Renderizar cada columna
  ['Terror', 'Shooter', 'Action'].forEach(al => {
    const list = data.lists[al] || [];
    const quota = data.quotaPerAlliance;
    const counterEl = document.getElementById(`counter-${al.toLowerCase()}`);
    if (counterEl) {
      if (quota !== null) {
        counterEl.textContent = `${list.length} de ${quota}`;
        if (list.length >= quota) {
          counterEl.className = 'text-[11px] font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded';
        } else {
          counterEl.className = 'text-[11px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded';
        }
      } else {
        counterEl.textContent = `${list.length} inscritos`;
      }
    }

    const listEl = document.getElementById(`list-${al.toLowerCase()}`);
    if (listEl) {
      if (list.length === 0) {
        listEl.innerHTML = `
          <div class="text-center py-8 text-slate-600 text-xs font-mono">
            Sin participantes anotados
          </div>
        `;
      } else {
        listEl.innerHTML = list.map((p, idx) => {
          const isGymkana = data.activityId === 'gymkanas';

          return `
            <div class="bg-slate-900/40 hover:bg-slate-900/90 p-2 rounded-lg border border-slate-900 hover:border-slate-800 flex items-center justify-between gap-2 transition group">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] font-mono text-slate-600 font-bold shrink-0">${idx + 1}.</span>
                  <span class="text-xs font-medium text-slate-200 truncate cursor-pointer hover:text-white" onclick="openStudentProfileModalById('${p.studentId}')">
                    ${p.name}
                  </span>
                </div>
                <div class="text-[10px] text-slate-400 flex items-center gap-1.5 pl-4 mt-0.5 font-mono">
                  <span class="truncate">${p.carrera || ''}</span>
                  <span>•</span>
                  <span class="text-slate-400 shrink-0">${new Date(p.addedAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <!-- SI ES GYMKANA: CONTROL DE PUNTOS (0 A 8) -->
              ${isGymkana ? `
                <div class="flex items-center gap-1 shrink-0">
                  <select onchange="handleGymkanaScoreChange('${p.studentId}', '${al}', this.value)" class="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-amber-300 font-mono font-bold focus:outline-none">
                    ${[0,1,2,3,4,5,6,7,8].map(s => `
                      <option value="${s}" ${p.score === s ? 'selected' : ''}>${s} pts</option>
                    `).join('')}
                  </select>
                </div>
              ` : ''}

              <!-- BOTÓN ELIMINAR SUTIL -->
              <button onclick="requestRemoveParticipant('${p.studentId}', '${al}', '${p.name}')" title="Quitar participante" class="p-1 text-slate-600 hover:text-red-400 rounded transition shrink-0">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          `;
        }).join('');
      }
    }
  });

  // 4. Bitácora de Auditoría
  const auditEl = document.getElementById('part-audit-log');
  if (auditEl) {
    if (!data.audit || data.audit.length === 0) {
      auditEl.innerHTML = `<div class="text-center py-2 text-slate-600 text-xs font-mono">Sin registros de auditoría aún.</div>`;
    } else {
      auditEl.innerHTML = data.audit.map(log => `
        <div class="p-1.5 rounded-lg bg-slate-900/30 border border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
          <div>
            <span class="text-slate-300 font-medium">${log.action}</span>
            ${log.reason ? `<span class="text-amber-400/90 ml-1.5">"${log.reason}"</span>` : ''}
          </div>
          <div class="text-slate-400 font-mono text-[10px] shrink-0">
            <span>${log.user}</span> • <span>${new Date(log.timestamp).toLocaleTimeString('es-CL')}</span>
          </div>
        </div>
      `).join('');
    }
  }

  lucide.createIcons();
}

function initParticipantesModule() {
  loadActivityParticipants(currentSelectedActivityId);
}

function switchActivityParticipants(actId) {
  currentSelectedActivityId = actId;
  loadActivityParticipants(actId);
}

async function loadActivityParticipants(actId) {
  try {
    const res = await fetch(`/api/admin/participants/${actId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!res.ok) throw new Error('No se pudo cargar la actividad');
    activeActivityParticipantsData = await res.json();
    renderActivityParticipantsView();
  } catch (err) {
    console.error(err);
  }
}

function renderActivityParticipantsView() {
  const data = activeActivityParticipantsData;
  if (!data) return;

  // 1. Status Container (Cerrar / Reabrir)
  const statusEl = document.getElementById('part-list-status-container');
  if (statusEl) {
    if (data.isClosed) {
      statusEl.innerHTML = `
        <span class="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-950/80 border border-red-800/60 px-3 py-1.5 rounded-xl">
          <i data-lucide="lock" class="w-3.5 h-3.5"></i> Lista Oficial CERRADA
        </span>
        <button onclick="requestReopenActivityList()" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-1.5 px-3 rounded-xl border border-slate-700 transition">
          Reabrir con motivo
        </button>
      `;
    } else {
      statusEl.innerHTML = `
        <span class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-3 py-1.5 rounded-xl">
          <i data-lucide="unlock" class="w-3.5 h-3.5"></i> Lista Abierta
        </span>
        <button onclick="closeCurrentActivityList()" class="text-xs bg-inacap-red hover:bg-red-700 text-white font-bold py-1.5 px-3.5 rounded-xl shadow transition">
          Cerrar Lista Oficial
        </button>
      `;
    }
  }

  // 2. Banner de Reglas
  const bannerEl = document.getElementById('part-rule-banner');
  if (bannerEl) {
    const quotaText = data.quotaPerAlliance !== null ? `${data.quotaPerAlliance} personas por alianza` : 'Entrada libre (sin límite estricto)';
    let ruleDetail = '';
    if (data.activityId === 'retro') ruleDetail = '4 titulares + 1 suplente por alianza. 3 enfrentamientos de 4 duelos 1v1 al mejor de 3 rondas. Gana la alianza con más victorias (máx 8). Desempate por rondas a favor.';
    else if (data.activityId === 'tacataca') ruleDetail = 'Duplas. Partidos a 5 goles. Máximo 2 partidos por persona para garantizar rotación.';
    else if (data.activityId === 'pingpong') ruleDetail = 'Partidos a 7 puntos. Máximo 2 partidos por persona para garantizar rotación.';
    else if (data.activityId === 'tacapingpong') ruleDetail = 'Duplas. Máximo 2 partidos por persona para garantizar rotación.';
    else if (data.activityId === 'babyfutbol') ruleDetail = '5 por equipo (con arquero). Rotar integrantes entre partidos.';
    else if (data.activityId === 'quemadas') ruleDetail = '8 vs 8. Rotar integrantes en cada ronda. Sin límite de tiempo (salvo aviso por alargue). Balones blandos sin golpes a la cabeza. Si se atrapa la pelota, sale el lanzador.';
    else if (data.activityId === 'trivia') ruleDetail = '3 representantes por alianza respondiendo con paletas.';
    else if (data.activityId === 'canto') ruleDetail = 'Fila de 8 cantantes por alianza frente al escenario.';
    else if (data.activityId === 'gymkanas') ruleDetail = 'Imprescindible anotar puntos (0 a 8) por estudiante para la fórmula 3.000 × (Promedio / 8).';
    else if (data.activityId === 'barra') ruleDetail = 'Participación comunitaria masiva. No requiere nómina individual.';

    bannerEl.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="p-2 bg-slate-950 rounded-lg text-amber-400 shrink-0">
          <i data-lucide="info" class="w-4 h-4"></i>
        </div>
        <div>
          <span class="font-bold text-white block">Cupo Oficial: ${quotaText}</span>
          <span class="text-slate-400">${ruleDetail}</span>
        </div>
      </div>
    `;
  }

  // 3. Renderizar cada columna
  ['Terror', 'Shooter', 'Action'].forEach(al => {
    const list = data.lists[al] || [];
    const quota = data.quotaPerAlliance;
    const counterEl = document.getElementById(`counter-${al.toLowerCase()}`);
    if (counterEl) {
      if (quota !== null) {
        counterEl.textContent = `${list.length} de ${quota}`;
        if (list.length >= quota) {
          counterEl.className = 'text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-lg';
        } else {
          counterEl.className = 'text-xs font-mono font-bold bg-slate-950 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-lg';
        }
      } else {
        counterEl.textContent = `${list.length} participantes`;
      }
    }

    const listEl = document.getElementById(`list-${al.toLowerCase()}`);
    if (listEl) {
      if (list.length === 0) {
        listEl.innerHTML = `
          <div class="text-center py-8 text-slate-600 text-xs">
            Sin participantes anotados aún.
          </div>
        `;
      } else {
        listEl.innerHTML = list.map((p, idx) => {
          const isGymkana = data.activityId === 'gymkanas';

          return `
            <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2 transition hover:border-slate-700">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] font-mono text-slate-500 font-bold">${idx + 1}.</span>
                  <span class="text-xs font-semibold text-white truncate block cursor-pointer hover:text-amber-400" onclick="openStudentProfileModalById('${p.studentId}')">
                    ${p.name}
                  </span>
                </div>
                <div class="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>${p.carrera || ''}</span>
                  <span>•</span>
                  <span>${new Date(p.addedAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <!-- SI ES GYMKANA: CONTROL TÁCTIL DE PUNTOS (0 A 8) -->
              ${isGymkana ? `
                <div class="flex items-center gap-1 shrink-0 bg-slate-900 border border-amber-900/60 px-2 py-1 rounded-xl shadow-sm">
                  <button 
                    onclick="changeGymkanaScoreStep('${p.studentId}', '${al}', -1)"
                    class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold font-mono text-xs flex items-center justify-center transition"
                    title="Restar 1 punto"
                  >-</button>
                  <span class="font-mono font-bold text-amber-300 text-xs px-1 min-w-[2.2rem] text-center">
                    ${p.score !== null && p.score !== undefined ? p.score : 0} <span class="text-[9px] text-amber-500 font-normal">pts</span>
                  </span>
                  <button 
                    onclick="changeGymkanaScoreStep('${p.studentId}', '${al}', 1)"
                    class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold font-mono text-xs flex items-center justify-center transition"
                    title="Sumar 1 punto"
                  >+</button>
                </div>
              ` : ''}

              <!-- BOTÓN ELIMINAR -->
              <button onclick="requestRemoveParticipant('${p.studentId}', '${al}', '${p.name}')" class="p-1 hover:text-red-400 text-slate-500 rounded transition shrink-0">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          `;
        }).join('');
      }
    }
  });

  // 4. Audit Log
  const auditEl = document.getElementById('part-audit-log');
  if (auditEl) {
    if (!data.audit || data.audit.length === 0) {
      auditEl.innerHTML = `<div>No hay registros de trazabilidad todavía para esta actividad.</div>`;
    } else {
      auditEl.innerHTML = data.audit.map(log => `
        <div class="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
          <div>
            <span class="font-semibold text-slate-300">${log.action}</span>
            ${log.reason ? `<span class="text-amber-400 block sm:inline sm:ml-2">Motivo: "${log.reason}"</span>` : ''}
          </div>
          <div class="text-slate-500 shrink-0 font-mono text-[10px]">
            <span>${log.user}</span> • <span>${new Date(log.timestamp).toLocaleTimeString('es-CL')}</span>
          </div>
        </div>
      `).join('');
    }
  }

  lucide.createIcons();
}

// Autocompletado desde el padrón oficial (281 estudiantes)
async function handleParticipantAutocomplete(alliance, val) {
  const box = document.getElementById(`autocomplete-${alliance.toLowerCase()}`);
  if (!box) return;

  const query = (val || '').trim();
  const currentActId = currentSelectedActivityId || '';

  try {
    const url = `/api/students/search?q=${encodeURIComponent(query)}&alliance=${encodeURIComponent(alliance)}&excludeActivity=${encodeURIComponent(currentActId)}`;
    const res = await fetch(url);
    let students = await res.json();

    // Filtro estricto en cliente: excluir los ya inscritos en la actividad actual
    const enrolledIds = new Set();
    if (activeActivityParticipantsData && activeActivityParticipantsData.lists) {
      Object.values(activeActivityParticipantsData.lists).forEach(list => {
        (list || []).forEach(p => enrolledIds.add(p.studentId));
      });
    }

    students = students.filter(s => {
      const matchAlliance = (s.alliance || '').toLowerCase() === alliance.toLowerCase();
      const notEnrolled = !enrolledIds.has(s.id);
      return matchAlliance && notEnrolled;
    });

    if (students.length === 0) {
      const msg = query.length > 0 
        ? `No hay estudiantes de ${alliance} que coincidan o ya están anotados.`
        : `No hay estudiantes disponibles para anotar en ${alliance}.`;
      box.innerHTML = `<div class="p-3 text-[11px] text-slate-500 font-mono text-center">${msg}</div>`;
      box.classList.remove('hidden');
      return;
    }

    box.innerHTML = students.map(s => {
      if (currentActId === 'gymkanas') {
        return `
          <div class="p-2.5 hover:bg-slate-800/90 text-xs border-b border-slate-800/60 last:border-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition group">
            <div class="min-w-0 pr-2">
              <span class="font-semibold text-white block group-hover:text-amber-400 transition">${s.name}</span>
              <span class="block text-[10px] text-slate-400 truncate font-mono">${s.carrera || ''}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0" onclick="event.stopPropagation()">
              <span class="text-[10px] font-mono text-amber-400 font-bold mr-1">Puntos:</span>
              ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(pts => `
                <button 
                  onclick="selectStudentForGymkanaWithScore('${s.id}', '${alliance}', ${pts})"
                  class="w-6 h-6 rounded bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-mono font-bold text-xs border border-slate-700 transition flex items-center justify-center shadow-sm"
                  title="Anotar con ${pts} pts"
                >${pts}</button>
              `).join('')}
            </div>
          </div>
        `;
      }

      return `
        <div onclick="selectStudentForActivity('${s.id}', '${alliance}')" class="p-2.5 hover:bg-slate-800/80 cursor-pointer text-xs border-b border-slate-800/60 last:border-0 flex items-center justify-between transition group">
          <div class="min-w-0 pr-2">
            <span class="font-semibold text-white block group-hover:text-emerald-400 transition">${s.name}</span>
            <span class="block text-[10px] text-slate-400 truncate">${s.carrera || ''}</span>
          </div>
          <span class="text-[10px] font-mono text-slate-400 group-hover:text-white border border-slate-700 group-hover:border-slate-500 rounded px-1.5 py-0.5 shrink-0 transition">
            + Anotar
          </span>
        </div>
      `;
    }).join('');

    box.classList.remove('hidden');
  } catch (err) {
    console.error(err);
  }
}

async function selectStudentForActivity(studentId, targetAlliance) {
  const box = document.getElementById(`autocomplete-${targetAlliance.toLowerCase()}`);
  if (box) {
    box.classList.add('hidden');
    box.innerHTML = '';
  }
  const input = document.getElementById(`search-input-${targetAlliance.toLowerCase()}`);
  if (input) input.value = '';

  const actPart = activeActivityParticipantsData;
  if (!actPart) return;

  // Si la lista está cerrada, pedir motivo
  if (actPart.isClosed) {
    promptReasonModal('Agregar participante con Lista Cerrada', (reason) => {
      doAddParticipant(studentId, targetAlliance, reason);
    });
    return;
  }

  // Si no está cerrada, intentar agregar directo
  doAddParticipant(studentId, targetAlliance, null);
}

async function selectStudentForGymkanaWithScore(studentId, targetAlliance, score) {
  const box = document.getElementById(`autocomplete-${targetAlliance.toLowerCase()}`);
  if (box) {
    box.classList.add('hidden');
    box.innerHTML = '';
  }
  const input = document.getElementById(`search-input-${targetAlliance.toLowerCase()}`);
  if (input) input.value = '';

  const actPart = activeActivityParticipantsData;
  if (!actPart) return;

  if (actPart.isClosed) {
    promptReasonModal('Agregar participante con Lista Cerrada', (reason) => {
      doAddParticipant(studentId, targetAlliance, reason, score);
    });
    return;
  }

  doAddParticipant(studentId, targetAlliance, null, score);
}

async function changeGymkanaScoreStep(studentId, alliance, delta) {
  const actPart = activeActivityParticipantsData;
  if (!actPart) return;
  const p = actPart.lists[alliance]?.find(item => item.studentId === studentId);
  if (!p) return;

  const currentScore = p.score !== null && p.score !== undefined ? Number(p.score) : 0;
  const newScore = Math.min(8, Math.max(0, currentScore + delta));
  if (newScore === currentScore) return;

  await handleGymkanaScoreChange(studentId, alliance, newScore);
}

async function doAddParticipant(studentId, targetAlliance, reason, score = null) {
  try {
    const res = await fetch('/api/admin/participants/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        activityId: currentSelectedActivityId,
        studentId,
        alliance: targetAlliance,
        score: score !== null && score !== undefined ? Number(score) : undefined,
        loggedBy: (currentUser?.name || 'Staff'),
        reason
      })
    });

    const result = await res.json();
    if (!res.ok) {
      alert(`⚠️ ${result.error}`);
      return;
    }

    loadActivityParticipants(currentSelectedActivityId);
    loadStats(); // refresca los cálculos si fue gymkanas
  } catch (err) {
    alert('Error al agregar participante');
  }
}

function requestRemoveParticipant(studentId, alliance, name) {
  const actPart = activeActivityParticipantsData;
  if (!actPart) return;

  if (actPart.isClosed) {
    promptReasonModal(`Eliminar a ${name} (Lista Cerrada)`, (reason) => {
      doRemoveParticipant(studentId, alliance, reason);
    });
    return;
  }

  if (confirm(`¿Eliminar a ${name} de la lista de ${alliance}?`)) {
    doRemoveParticipant(studentId, alliance, null);
  }
}

async function doRemoveParticipant(studentId, alliance, reason) {
  try {
    const res = await fetch('/api/admin/participants/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        activityId: currentSelectedActivityId,
        studentId,
        alliance,
        loggedBy: (currentUser?.name || 'Staff'),
        reason
      })
    });

    const result = await res.json();
    if (!res.ok) {
      alert(`⚠️ ${result.error}`);
      return;
    }

    loadActivityParticipants(currentSelectedActivityId);
    loadStats();
  } catch (err) {
    alert('Error al eliminar');
  }
}

async function handleGymkanaScoreChange(studentId, alliance, scoreVal) {
  try {
    const res = await fetch('/api/admin/participants/gymkana-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        studentId,
        alliance,
        score: scoreVal,
        loggedBy: (currentUser?.name || 'Staff'),
        reason: 'Ajuste en tarjeta de gymkana'
      })
    });

    if (res.ok) {
      loadActivityParticipants('gymkanas');
      loadStats();
    }
  } catch (err) {
    console.error(err);
  }
}

async function closeCurrentActivityList() {
  if (!confirm(`¿Confirmas el CIERRE OFICIAL de la lista de participantes de "${activeActivityParticipantsData?.name}"? A partir de ahora cualquier cambio exigirá motivo obligatorio de auditoría.`)) {
    return;
  }

  try {
    const res = await fetch('/api/admin/participants/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        activityId: currentSelectedActivityId,
        loggedBy: (currentUser?.name || 'Staff')
      })
    });

    if (res.ok) {
      loadActivityParticipants(currentSelectedActivityId);
    }
  } catch (err) {
    alert('Error al cerrar lista');
  }
}

function requestReopenActivityList() {
  promptReasonModal(`Reapertura de lista "${activeActivityParticipantsData?.name}"`, async (reason) => {
    try {
      const res = await fetch('/api/admin/participants/reopen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({
          activityId: currentSelectedActivityId,
          reason,
          loggedBy: (currentUser?.name || 'Staff')
        })
      });

      if (res.ok) {
        loadActivityParticipants(currentSelectedActivityId);
      }
    } catch (err) {
      alert('Error al reabrir');
    }
  });
}

function exportCurrentActivityCSV() {
  window.open(`/api/admin/participants/export/${currentSelectedActivityId}?pin=${adminToken}`, '_blank');
}

// Modal de Motivo de Corrección
function promptReasonModal(title, callback) {
  const modal = document.getElementById('reason-modal');
  const desc = document.getElementById('reason-modal-desc');
  const input = document.getElementById('reason-modal-input');
  if (!modal || !desc || !input) return;

  desc.textContent = `${title}: Ingresa una justificación clara que quedará guardada en la bitácora oficial.`;
  input.value = '';
  pendingReasonCallback = callback;
  modal.classList.remove('hidden');
  input.focus();
}

function closeReasonModal() {
  const modal = document.getElementById('reason-modal');
  if (modal) modal.classList.add('hidden');
  pendingReasonCallback = null;
}

function confirmReasonAction(e) {
  e.preventDefault();
  const input = document.getElementById('reason-modal-input');
  const reason = input ? input.value.trim() : '';
  if (!reason) return;

  closeReasonModal();
  if (typeof pendingReasonCallback === 'function') {
    pendingReasonCallback(reason);
  }
}

// Ficha de Participación por Persona
function openStudentSearchModal() {
  const query = prompt('Ingresa el nombre o apellido del estudiante para ver su ficha de participación:');
  if (!query || query.trim().length < 2) return;

  fetch(`/api/students/search?q=${encodeURIComponent(query.trim())}`)
    .then(r => r.json())
    .then(list => {
      if (list.length === 0) {
        alert('Estudiante no encontrado');
        return;
      }
      openStudentProfileModalById(list[0].id);
    });
}

async function openStudentProfileModalById(studentId) {
  try {
    const res = await fetch(`/api/admin/participants/student/${studentId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!res.ok) throw new Error('Error al cargar ficha');
    const data = await res.json();

    const modal = document.getElementById('student-profile-modal');
    const content = document.getElementById('student-profile-content');
    if (!modal || !content) return;

    const s = data.student;
    content.innerHTML = `
      <div class="space-y-4 text-left">
        <div class="border-b border-slate-800 pb-3">
          <span class="text-xs font-bold uppercase tracking-wider text-amber-400">Ficha Oficial de Participación</span>
          <h3 class="text-2xl font-black font-heading text-white mt-1">${s.name}</h3>
          <span class="text-xs text-slate-400">${s.carrera} • Alianza ${s.alliance}</span>
        </div>

        <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <span class="text-xs text-slate-400 font-semibold">Total de Actividades Disputadas</span>
          <span class="text-2xl font-mono font-black text-amber-400">${data.totalParticipations}</span>
        </div>

        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Detalle de Participaciones</h4>
          ${data.activities.length === 0 ? `
            <div class="p-4 text-center text-xs text-slate-500 bg-slate-950 rounded-xl">Sin participaciones registradas en cancha.</div>
          ` : `
            <div class="space-y-2">
              ${data.activities.map(a => `
                <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span class="font-bold text-white block">${a.activityName}</span>
                    <span class="text-[10px] text-slate-400 font-mono">Registrado por ${a.addedBy} a las ${new Date(a.addedAt).toLocaleTimeString('es-CL')}</span>
                  </div>
                  ${a.score !== null ? `
                    <span class="font-mono font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                      ${a.score} pts
                    </span>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    lucide.createIcons();
  } catch (err) {
    alert('Error al abrir la ficha del estudiante');
  }
}

function closeStudentProfileModal() {
  const modal = document.getElementById('student-profile-modal');
  if (modal) modal.classList.add('hidden');
}



// Modal Helpers for Admin Portal
function promptReasonModal(title, callback) {
  const modal = document.getElementById('reason-modal');
  const desc = document.getElementById('reason-modal-desc');
  const input = document.getElementById('reason-modal-input');
  if (!modal || !desc || !input) return;

  desc.textContent = `${title}: Justificación requerida para la bitácora oficial.`;
  input.value = '';
  pendingReasonCallback = callback;
  modal.classList.remove('hidden');
  input.focus();
}

function closeReasonModal() {
  const modal = document.getElementById('reason-modal');
  if (modal) modal.classList.add('hidden');
  pendingReasonCallback = null;
}

function confirmReasonAction(e) {
  e.preventDefault();
  const input = document.getElementById('reason-modal-input');
  const reason = input ? input.value.trim() : '';
  if (!reason) return;

  closeReasonModal();
  if (typeof pendingReasonCallback === 'function') {
    pendingReasonCallback(reason);
  }
}

async function openStudentProfileModalById(studentId) {
  try {
    const res = await fetch(`/api/admin/participants/student/${studentId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!res.ok) throw new Error('Error al cargar ficha');
    const data = await res.json();

    const modal = document.getElementById('student-profile-modal');
    const content = document.getElementById('student-profile-content');
    if (!modal || !content) return;

    const s = data.student;
    content.innerHTML = `
      <div class="space-y-4 text-left">
        <div class="border-b border-slate-800 pb-3">
          <span class="text-xs font-bold uppercase tracking-wider text-amber-400">Ficha Oficial de Participación</span>
          <h3 class="text-2xl font-black font-heading text-white mt-1">${s.name}</h3>
          <span class="text-xs text-slate-400">${s.carrera} • Alianza ${s.alliance}</span>
        </div>

        <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <span class="text-xs text-slate-400 font-semibold">Total de Actividades Disputadas</span>
          <span class="text-2xl font-mono font-black text-amber-400">${data.totalParticipations}</span>
        </div>

        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Detalle de Participaciones</h4>
          ${data.activities.length === 0 ? `
            <div class="p-4 text-center text-xs text-slate-500 bg-slate-950 rounded-xl">Sin participaciones registradas en cancha.</div>
          ` : `
            <div class="space-y-2">
              ${data.activities.map(a => `
                <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span class="font-bold text-white block">${a.activityName}</span>
                    <span class="text-[10px] text-slate-400 font-mono">Registrado por ${a.addedBy} a las ${new Date(a.addedAt).toLocaleTimeString('es-CL')}</span>
                  </div>
                  ${a.score !== null ? `
                    <span class="font-mono font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                      ${a.score} pts
                    </span>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    lucide.createIcons();
  } catch (err) {
    alert('Error al abrir la ficha del estudiante');
  }
}

function closeStudentProfileModal() {
  const modal = document.getElementById('student-profile-modal');
  if (modal) modal.classList.add('hidden');
}

function openActivityDetail(id) {
  const act = (appData.activities || []).find(a => a.id === id);
  if (!act) return;

  const modal = document.getElementById('calc-modal');
  const content = document.getElementById('calc-modal-content');
  if (!modal || !content) return;

  content.innerHTML = `
    <div class="space-y-4">
      <div class="border-b border-slate-800 pb-3">
        <span class="text-xs font-bold uppercase tracking-wider text-red-500">${act.group}</span>
        <h3 class="text-2xl font-black font-heading text-white mt-1">${act.name}</h3>
        <span class="text-xs text-slate-400">${act.location} • Máximo ${act.maxPoints} pts</span>
      </div>

      <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
        <strong class="text-white block mb-1">Regla de Cálculo Oficial:</strong>
        ${act.type === 'gymkana' ? 
          'Puntaje Alianza = 3.000 × (Promedio de puntos por participante / 8).' : 
          (act.type === 'match_table' ? 
            'Torneo triangular: Victoria 3 pts, Empate 1 pt, Derrota 0 pts.' : 
            `1er lugar: ${act.pointsDistribution[0]} pts | 2do lugar: ${act.pointsDistribution[1]} pts | 3er lugar: ${act.pointsDistribution[2]} pts.`
          )
        }
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeCalcModal() {
  const modal = document.getElementById('calc-modal');
  if (modal) modal.classList.add('hidden');
}



// Cerrar menús de autocompletado al hacer clic fuera
document.addEventListener('click', (e) => {
  ['terror', 'shooter', 'action'].forEach(al => {
    const box = document.getElementById(`autocomplete-${al}`);
    const input = document.getElementById(`search-input-${al}`);
    if (box && input && !box.contains(e.target) && e.target !== input) {
      box.classList.add('hidden');
    }
  });
});

// ==========================================
// MÓDULO: ASISTENCIA CONSOLIDADA DEL EVENTO
// ==========================================
let globalAttendanceData = null;
let currentAttendanceAllianceFilter = 'ALL';
let currentAttendanceActivityFilter = 'ALL';
let currentAttendanceOnlyAttended = true;

function renderAsistenciaPanel() {
  return `
    <div class="space-y-6">
      
      <!-- HEADER DEL MÓDULO -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 class="text-xl sm:text-2xl font-bold font-heading text-white tracking-tight">Asistencia del Evento</h2>
            <span id="attendance-total-badge" class="ml-2 text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
              Cargando...
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            Registro consolidado de estudiantes que efectivamente asistieron y compitieron en cancha en las actividades oficiales.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button 
            onclick="exportConsolidatedAttendanceCSV()" 
            class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center gap-2 transition"
            title="Descargar nómina consolidada en formato Excel / CSV"
          >
            <i data-lucide="download" class="w-4 h-4 text-emerald-400"></i>
            <span>Exportar CSV</span>
          </button>
          <button 
            onclick="loadAttendanceData()" 
            class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-900 transition"
            title="Recargar asistencia"
          >
            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- KPI METRICS DE ASISTENCIA -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <!-- Total Asistentes -->
        <div class="bg-slate-950 border border-slate-900 rounded-2xl p-4 transition shadow-sm">
          <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">Asistencia Real Total</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-mono font-black text-white" id="asist-kpi-total">0</span>
            <span class="text-xs font-mono text-slate-400" id="asist-kpi-padron">/ 281 alumnos</span>
          </div>
          <div class="mt-2 flex items-center gap-2">
            <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div id="asist-bar-total" class="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style="width: 0%"></div>
            </div>
            <span class="text-[10px] font-mono text-emerald-400 font-bold shrink-0" id="asist-pct-total">0%</span>
          </div>
        </div>

        <!-- Terror -->
        <div class="bg-slate-950 border border-slate-900 hover:border-red-950/80 rounded-2xl p-4 transition shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500">Alianza Terror</span>
            <span class="w-2 h-2 rounded-full bg-red-500"></span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-mono font-black text-red-400" id="asist-kpi-terror">0</span>
            <span class="text-xs font-mono text-slate-500">/ 126</span>
          </div>
          <div class="mt-2 flex items-center gap-2">
            <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div id="asist-bar-terror" class="bg-red-500 h-1.5 rounded-full transition-all duration-500" style="width: 0%"></div>
            </div>
            <span class="text-[10px] font-mono text-red-400 font-bold shrink-0" id="asist-pct-terror">0%</span>
          </div>
        </div>

        <!-- Shooter -->
        <div class="bg-slate-950 border border-slate-900 hover:border-blue-950/80 rounded-2xl p-4 transition shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500">Alianza Shooter</span>
            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-mono font-black text-blue-400" id="asist-kpi-shooter">0</span>
            <span class="text-xs font-mono text-slate-500">/ 126</span>
          </div>
          <div class="mt-2 flex items-center gap-2">
            <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div id="asist-bar-shooter" class="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style="width: 0%"></div>
            </div>
            <span class="text-[10px] font-mono text-blue-400 font-bold shrink-0" id="asist-pct-shooter">0%</span>
          </div>
        </div>

        <!-- Action -->
        <div class="bg-slate-950 border border-slate-900 hover:border-emerald-950/80 rounded-2xl p-4 transition shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500">Alianza Action</span>
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-mono font-black text-emerald-400" id="asist-kpi-action">0</span>
            <span class="text-xs font-mono text-slate-500">/ 29</span>
          </div>
          <div class="mt-2 flex items-center gap-2">
            <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div id="asist-bar-action" class="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style="width: 0%"></div>
            </div>
            <span class="text-[10px] font-mono text-emerald-400 font-bold shrink-0" id="asist-pct-action">0%</span>
          </div>
        </div>

      </div>

      <!-- BARRA DE FILTROS Y BÚSQUEDA -->
      <div class="bg-slate-950 border border-slate-900 rounded-2xl p-4 space-y-3">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <!-- Buscador por Texto -->
          <div class="relative flex-1">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <i data-lucide="search" class="w-4 h-4"></i>
            </div>
            <input 
              type="text" 
              id="search-attendance-input" 
              oninput="handleAttendanceFilterChange()"
              placeholder="Buscar por nombre, RUT o carrera..." 
              class="w-full bg-slate-900/80 border border-slate-800 rounded-xl text-xs py-2 pl-9 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 transition"
            />
          </div>

          <!-- Selector de Actividad -->
          <div class="sm:w-64">
            <select 
              id="select-attendance-activity" 
              onchange="handleAttendanceFilterChange()"
              class="w-full bg-slate-900 border border-slate-800 rounded-xl text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-slate-600 font-mono"
            >
              <option value="ALL">Todas las actividades</option>
            </select>
          </div>

        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-900/80 text-xs">
          
          <!-- Filtro de Alianza Pills -->
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] font-mono uppercase text-slate-500 mr-1">Alianza:</span>
            <button 
              onclick="setAttendanceAllianceFilter('ALL')" 
              id="filter-al-all"
              class="px-2.5 py-1 rounded-lg text-xs font-mono transition bg-slate-900 text-white font-semibold border border-slate-800"
            >
              Todas
            </button>
            <button 
              onclick="setAttendanceAllianceFilter('Terror')" 
              id="filter-al-terror"
              class="px-2.5 py-1 rounded-lg text-xs font-mono transition text-slate-400 hover:text-white border border-transparent hover:border-slate-800"
            >
              Terror
            </button>
            <button 
              onclick="setAttendanceAllianceFilter('Shooter')" 
              id="filter-al-shooter"
              class="px-2.5 py-1 rounded-lg text-xs font-mono transition text-slate-400 hover:text-white border border-transparent hover:border-slate-800"
            >
              Shooter
            </button>
            <button 
              onclick="setAttendanceAllianceFilter('Action')" 
              id="filter-al-action"
              class="px-2.5 py-1 rounded-lg text-xs font-mono transition text-slate-400 hover:text-white border border-transparent hover:border-slate-800"
            >
              Action
            </button>
          </div>

          <!-- Toggle Mostrar Padrón Completo vs Solo Asistentes -->
          <div class="flex items-center gap-2">
            <label class="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-slate-200 font-mono text-[11px]">
              <input 
                type="checkbox" 
                id="toggle-attendance-only-attended" 
                checked 
                onchange="handleAttendanceToggleAttended(this.checked)"
                class="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0"
              />
              <span>Mostrar solo quienes asistieron</span>
            </label>
          </div>

        </div>
      </div>

      <!-- TABLA DE ASISTENCIA CONSOLIDADA -->
      <div class="bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-900/60 border-b border-slate-900 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              <tr>
                <th class="py-3 px-3.5 w-12 text-center">#</th>
                <th class="py-3 px-3.5">Estudiante</th>
                <th class="py-3 px-3.5 w-28">Alianza</th>
                <th class="py-3 px-3.5">Carrera</th>
                <th class="py-3 px-3.5">Actividades en Cancha</th>
                <th class="py-3 px-3.5 w-24 text-right">Total</th>
              </tr>
            </thead>
            <tbody id="attendance-table-body" class="divide-y divide-slate-900">
              <tr>
                <td colspan="6" class="py-12 text-center text-slate-500 font-mono">
                  <div class="flex items-center justify-center gap-2">
                    <i data-lucide="loader" class="w-4 h-4 animate-spin text-emerald-400"></i>
                    <span>Cargando nómina oficial...</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer con conteo -->
        <div class="p-3 bg-slate-900/40 border-t border-slate-900 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span id="attendance-count-indicator">Mostrando 0 estudiantes</span>
          <span>Actualizado en tiempo real</span>
        </div>
      </div>

    </div>
  `;
}

async function initAsistenciaModule() {
  await loadAttendanceData();
}

async function loadAttendanceData() {
  try {
    const res = await fetch('/api/admin/attendance', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!res.ok) {
      console.error('Error al cargar asistencia:', res.status);
      return;
    }

    const data = await res.json();
    globalAttendanceData = data;

    // Poblar selector de actividades
    const actSelect = document.getElementById('select-attendance-activity');
    if (actSelect && data.activities) {
      actSelect.innerHTML = `<option value="ALL">Todas las actividades</option>` + 
        data.activities.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
      actSelect.value = currentAttendanceActivityFilter;
    }

    renderAttendanceKPIs(data.stats);
    renderAttendanceTable();
    lucide.createIcons();
  } catch (err) {
    console.error('Error al consultar asistencia:', err);
  }
}

function renderAttendanceKPIs(stats) {
  if (!stats) return;

  const totalEl = document.getElementById('asist-kpi-total');
  const padronEl = document.getElementById('asist-kpi-padron');
  const pctEl = document.getElementById('asist-pct-total');
  const barTotal = document.getElementById('asist-bar-total');
  const badgeEl = document.getElementById('attendance-total-badge');

  if (totalEl) totalEl.textContent = stats.totalAsistentes;
  if (padronEl) padronEl.textContent = `/ ${stats.totalPadron} alumnos`;
  if (pctEl) pctEl.textContent = `${stats.porcentajeAsistencia}%`;
  if (barTotal) barTotal.style.width = `${stats.porcentajeAsistencia}%`;
  if (badgeEl) badgeEl.textContent = `${stats.totalAsistentes} de ${stats.totalPadron} presentes`;

  ['Terror', 'Shooter', 'Action'].forEach(al => {
    const alData = stats.alianzas?.[al];
    if (alData) {
      const kpi = document.getElementById(`asist-kpi-${al.toLowerCase()}`);
      const pct = document.getElementById(`asist-pct-${al.toLowerCase()}`);
      const bar = document.getElementById(`asist-bar-${al.toLowerCase()}`);
      const alPct = alData.total > 0 ? ((alData.asistentes / alData.total) * 100).toFixed(0) : 0;

      if (kpi) kpi.textContent = alData.asistentes;
      if (pct) pct.textContent = `${alPct}%`;
      if (bar) bar.style.width = `${alPct}%`;
    }
  });
}

function setAttendanceAllianceFilter(alliance) {
  currentAttendanceAllianceFilter = alliance;
  ['all', 'terror', 'shooter', 'action'].forEach(a => {
    const btn = document.getElementById(`filter-al-${a}`);
    if (btn) {
      if (a === alliance.toLowerCase()) {
        btn.className = 'px-2.5 py-1 rounded-lg text-xs font-mono transition bg-slate-900 text-white font-semibold border border-slate-800';
      } else {
        btn.className = 'px-2.5 py-1 rounded-lg text-xs font-mono transition text-slate-400 hover:text-white border border-transparent hover:border-slate-800';
      }
    }
  });
  renderAttendanceTable();
}

function handleAttendanceToggleAttended(checked) {
  currentAttendanceOnlyAttended = checked;
  renderAttendanceTable();
}

function handleAttendanceFilterChange() {
  const actSelect = document.getElementById('select-attendance-activity');
  if (actSelect) {
    currentAttendanceActivityFilter = actSelect.value;
  }
  renderAttendanceTable();
}

function renderAttendanceTable() {
  if (!globalAttendanceData) return;

  const tbody = document.getElementById('attendance-table-body');
  const countEl = document.getElementById('attendance-count-indicator');
  if (!tbody) return;

  const searchInput = document.getElementById('search-attendance-input');
  const query = (searchInput ? searchInput.value : '').trim().toLowerCase();

  const dataset = currentAttendanceOnlyAttended 
    ? globalAttendanceData.attendees 
    : globalAttendanceData.allStudents;

  // Filtrado
  const filtered = dataset.filter(s => {
    // 1. Filtro por Alianza
    if (currentAttendanceAllianceFilter !== 'ALL' && s.alliance !== currentAttendanceAllianceFilter) {
      return false;
    }

    // 2. Filtro por Actividad
    if (currentAttendanceActivityFilter !== 'ALL') {
      const hasAct = (s.activities || []).some(a => a.activityId === currentAttendanceActivityFilter);
      if (!hasAct) return false;
    }

    // 3. Filtro por Búsqueda de texto (Nombre, RUT, Carrera)
    if (query) {
      const name = (s.name || '').toLowerCase();
      const rut = (s.rut || '').toLowerCase();
      const car = (s.carrera || '').toLowerCase();
      if (!name.includes(query) && !rut.includes(query) && !car.includes(query)) {
        return false;
      }
    }

    return true;
  });

  if (countEl) {
    countEl.textContent = `Mostrando ${filtered.length} estudiante(s) filtrados`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center text-slate-500 font-mono text-xs">
          No se encontraron estudiantes con los filtros seleccionados.
        </td>
      </tr>
    `;
    return;
  }

  const allianceBadgeStyles = {
    Terror: 'bg-red-950/70 text-red-400 border-red-900/50',
    Shooter: 'bg-blue-950/70 text-blue-400 border-blue-900/50',
    Action: 'bg-emerald-950/70 text-emerald-400 border-emerald-900/50'
  };

  tbody.innerHTML = filtered.map((s, idx) => {
    const badgeStyle = allianceBadgeStyles[s.alliance] || 'bg-slate-900 text-slate-400 border-slate-800';
    const acts = s.activities || [];
    const hasAttended = acts.length > 0;

    return `
      <tr class="hover:bg-slate-900/40 transition group">
        <td class="py-3 px-3.5 text-center font-mono text-slate-600 text-[11px]">
          ${idx + 1}
        </td>
        <td class="py-3 px-3.5">
          <div class="font-semibold text-white group-hover:text-amber-400 cursor-pointer transition" onclick="openStudentProfileModalById('${s.id}')">
            ${s.name}
          </div>
          <div class="text-[10px] font-mono text-slate-500">
            ${s.rut ? s.rut : 'RUT no informado'}
          </div>
        </td>
        <td class="py-3 px-3.5">
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${badgeStyle}">
            <span class="w-1.5 h-1.5 rounded-full ${s.alliance === 'Terror' ? 'bg-red-500' : s.alliance === 'Shooter' ? 'bg-blue-500' : 'bg-emerald-500'}"></span>
            ${s.alliance}
          </span>
        </td>
        <td class="py-3 px-3.5 text-slate-400 text-[11px]">
          ${s.carrera || 'General'}
        </td>
        <td class="py-3 px-3.5">
          ${hasAttended ? `
            <div class="flex flex-wrap items-center gap-1.5">
              ${acts.map(a => `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 transition" title="Registrado: ${new Date(a.addedAt).toLocaleTimeString('es-CL')}">
                  <span>${a.activityName}</span>
                  ${a.score !== null ? `<span class="text-amber-400 font-bold">(${a.score} pts)</span>` : ''}
                </span>
              `).join('')}
            </div>
          ` : `
            <span class="text-slate-600 italic text-[11px]">Sin participación registrada</span>
          `}
        </td>
        <td class="py-3 px-3.5 text-right font-mono font-bold ${hasAttended ? 'text-emerald-400' : 'text-slate-600'}">
          ${acts.length} ${acts.length === 1 ? 'actividad' : 'actividades'}
        </td>
      </tr>
    `;
  }).join('');
}

function exportConsolidatedAttendanceCSV() {
  if (!adminToken) return;
  window.open(`/api/admin/attendance/export?token=${encodeURIComponent(adminToken)}`, '_blank');
}

// ==========================================
// MODO PROYECTOR DEDICADO PARA ADMINISTRACIÓN
// ==========================================
async function openAdminProyector() {
  const overlay = document.getElementById('admin-proyector-overlay');
  if (!overlay) return;

  try {
    const res = await fetch('/api/stats');
    const statsData = await res.json();
    appData = statsData;

    overlay.innerHTML = renderAdminProyectorView(statsData);
    overlay.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    lucide.createIcons();
  } catch (err) {
    console.error('Error al abrir proyector:', err);
  }
}

function closeAdminProyector() {
  const overlay = document.getElementById('admin-proyector-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
  }
  document.body.classList.remove('overflow-hidden');
}

function renderAdminProyectorView(statsData) {
  const al = statsData.alliances || {};
  const terror = al.Terror || { points: { total: 0 }, carrera: 'Informática (Ingeniería y Tec)' };
  const shooter = al.Shooter || { points: { total: 0 }, carrera: 'Informática (Ingeniería y Tec)' };
  const action = al.Action || { points: { total: 0 }, carrera: 'Diseño e Industria Digital' };

  const pT = terror.points?.total || 0;
  const pS = shooter.points?.total || 0;
  const pA = action.points?.total || 0;

  const MAX_EVENT_POINTS = 32000;
  const alliancesList = [
    { name: 'TERROR', carrera: 'Informática', pts: pT, dot: 'bg-red-500', bar: 'bg-gradient-to-r from-red-700 via-red-600 to-red-500', border: 'border-red-900/50', tag: 'text-red-400 border-red-900/50 bg-red-950/40' },
    { name: 'SHOOTER', carrera: 'Informática', pts: pS, dot: 'bg-blue-500', bar: 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500', border: 'border-blue-900/50', tag: 'text-blue-400 border-blue-900/50 bg-blue-950/40' },
    { name: 'ACTION', carrera: 'Diseño e Industria', pts: pA, dot: 'bg-emerald-500', bar: 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500', border: 'border-emerald-900/50', tag: 'text-emerald-400 border-emerald-900/50 bg-emerald-950/40' }
  ];

  const sorted = [...alliancesList].sort((a, b) => b.pts - a.pts);
  const placesMap = {};
  sorted.forEach((item, idx) => { placesMap[item.name] = idx + 1; });

  const leader = sorted[0];
  const second = sorted[1];
  const diff12 = Math.abs(leader.pts - second.pts);

  return `
    <div class="h-screen w-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden">
      <!-- HEADER PROYECTOR -->
      <div class="flex items-center justify-between border-b border-slate-900 pb-4">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded-full bg-[#E30613] shadow-md shadow-red-600/40"></span>
            <span class="font-heading font-black text-white text-xl sm:text-2xl tracking-tight">TI & DISEÑO</span>
          </div>
          <div class="h-6 w-px bg-slate-800"></div>
          <div>
            <span class="text-xs font-mono font-bold text-slate-300 tracking-wider uppercase block">Marcador Oficial de Cancha</span>
            <span class="text-[10px] font-mono text-slate-400 block">Informática • Telecomunicaciones • Analista • Diseño Web</span>
          </div>
        </div>

        ${diff12 <= 800 && leader.pts > 0 ? `
          <div class="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/40 border border-amber-600/50 text-amber-300 font-mono text-xs">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Duelo al rojo: solo ${diff12.toLocaleString('es-CL')} pts de diferencia</span>
          </div>
        ` : ''}

        <div class="flex items-center gap-4">
          <button onclick="closeAdminProyector()" class="px-3 py-1.5 rounded-xl text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition">
            <i data-lucide="x" class="w-4 h-4"></i>
            <span>Cerrar Proyector</span>
          </button>
        </div>
      </div>

      <!-- ZONA DE BARRAS DE PROYECTOR -->
      <div class="my-auto max-w-5xl mx-auto w-full space-y-6">
        ${statsData.activeSorpresa ? `
          <div class="bg-gradient-to-r from-red-950/80 via-amber-950/80 to-red-950/80 border-2 border-red-500 rounded-2xl py-3 px-6 text-center mb-4 shadow-2xl animate-pulse">
            <div class="flex items-center justify-center gap-3">
              <span class="text-xl">🚨</span>
              <span class="text-xs font-mono font-black text-amber-400 uppercase tracking-widest">¡PRUEBA SORPRESA EN CURSO!</span>
              <span class="text-xl">🚨</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-heading font-black text-white uppercase mt-0.5">${statsData.activeSorpresa.name}</h2>
            <p class="text-xs text-slate-300 mt-0.5">${statsData.activeSorpresa.description || ''}</p>
            <div class="mt-2 flex items-center justify-center gap-4 text-xs font-mono text-amber-300">
              <span>⏱️ Duración: ${statsData.activeSorpresa.durationMin || 3} min</span>
              <span>⚖️ ${statsData.activeSorpresa.decisionType === 'jurado' ? 'Jurado de 3' : 'Medición directa'}</span>
              <span>🏆 1°: ${statsData.activeSorpresa.points1st || 500} pts | 2°: ${statsData.activeSorpresa.points2nd || 300} pts | 3°: ${statsData.activeSorpresa.points3rd || 150} pts</span>
            </div>
          </div>
        ` : ''}

        <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1 border-b border-slate-900 pb-2">
          <span>POSICIONES OFICIALES & PUNTAJE EN VIVO</span>
          <span>META DEL EVENTO: 32.000 PTS</span>
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

              <!-- PISTA VISUAL -->
              <div class="relative w-full bg-slate-950 h-7 sm:h-8 rounded-xl overflow-hidden border border-slate-800/90 p-1 flex items-center">
                <div class="absolute left-[25%] top-0 bottom-0 w-px bg-slate-900/80 pointer-events-none"></div>
                <div class="absolute left-[50%] top-0 bottom-0 w-px bg-slate-900/80 pointer-events-none"></div>
                <div class="absolute left-[75%] top-0 bottom-0 w-px bg-slate-900/80 pointer-events-none"></div>
                
                <div class="${item.bar} h-full rounded-lg transition-all duration-1000 ease-out shadow-md relative flex items-center justify-end pr-2" style="width: ${visualWidth}%;">
                  ${visualWidth > 15 ? `<span class="text-[10px] font-mono font-bold text-white drop-shadow">${pct}%</span>` : ''}
                </div>
                <div class="absolute right-2 top-0 bottom-0 flex items-center pointer-events-none">
                  <span class="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">META 32K</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="border-t border-slate-900 pt-3 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>Pantalla Oficial de Competencia • Semana Carrera 2026</span>
        <span>Controlado desde Panel de Administración</span>
      </div>
    </div>
  `;
}


// =========================================================================
// MÓDULO REDISEÑADO: CONSOLA DE REGISTRO Y ARBITRAJE DE PUNTOS
// =========================================================================

let puntosState = {
  activeTab: 'places', // 'places' | 'triangular' | 'gymkanas' | 'tarreo'
  selectedPlaceActId: 'retro',
  placeSelection: { Terror: null, Shooter: null, Action: null },
  placeNotes: '',
  selectedSport: 'babyfutbol',
  localMatches: {},
  gymkanaScores: { Terror: [], Shooter: [], Action: [] },
  tarreoTab: 'cazatesoros',
  cazatesoros: { Terror: 0, Shooter: 0, Action: 0 },
  tarreoPlaces: {
    justdance: { Terror: null, Shooter: null, Action: null },
    mimica: { Terror: null, Shooter: null, Action: null }
  },
  sorpresasState: {
    activeSubView: 'banco',
    bank: [],
    activeSorpresa: null,
    completedSorpresas: [],
    accumulatedPoints: { Terror: 0, Shooter: 0, Action: 0 },
    judges: {
      judge1: { Terror: 1, Shooter: 2, Action: 3 },
      judge2: { Terror: 1, Shooter: 2, Action: 3 },
      judge3: { Terror: 1, Shooter: 2, Action: 3 }
    },
    metrics: { Terror: 0, Shooter: 0, Action: 0 },
    customForm: {
      name: '',
      description: '',
      duration: 3,
      decisionType: 'jurado',
      metricLabel: 'Rondas ganadas (máx 5)',
      metricDirection: 'desc',
      material: '',
      careNotes: '',
      p1: 500,
      p2: 300,
      p3: 150,
      checklist: {
        voluntaria: false,
        sinRiesgo: false,
        sinContacto: false,
        sinHumillacion: false
      }
    }
  }
};

function initPuntosModule() {
  if (!appData || !appData.activities) return;

  // 1. Inicializar Actividades por Puestos
  const placesActs = appData.activities.filter(a => a.type === 'places');
  if (placesActs.length > 0) {
    if (!puntosState.selectedPlaceActId || !placesActs.find(a => a.id === puntosState.selectedPlaceActId)) {
      puntosState.selectedPlaceActId = placesActs[0].id;
    }
    const currentAct = placesActs.find(a => a.id === puntosState.selectedPlaceActId);
    if (currentAct) {
      puntosState.placeSelection = {
        Terror: currentAct.results?.Terror ? Number(currentAct.results.Terror) : null,
        Shooter: currentAct.results?.Shooter ? Number(currentAct.results.Shooter) : null,
        Action: currentAct.results?.Action ? Number(currentAct.results.Action) : null
      };
      puntosState.placeNotes = currentAct.notes || '';
    }
  }

  // 2. Inicializar Deportes Triangular (Baby Fútbol & Quemadas)
  ['babyfutbol', 'quemadas'].forEach(sportId => {
    const act = appData.activities.find(a => a.id === sportId);
    if (act && act.matches) {
      puntosState.localMatches[sportId] = JSON.parse(JSON.stringify(act.matches));
    } else {
      puntosState.localMatches[sportId] = [
        { team1: 'Terror', team2: 'Shooter', score1: null, score2: null },
        { team1: 'Shooter', team2: 'Action', score1: null, score2: null },
        { team1: 'Action', team2: 'Terror', score1: null, score2: null }
      ];
    }
  });

  // 3. Inicializar Gymkanas
  const gymAct = appData.activities.find(a => a.id === 'gymkanas');
  if (gymAct && gymAct.participantCards) {
    puntosState.gymkanaScores = {
      Terror: [...(gymAct.participantCards.Terror || [])],
      Shooter: [...(gymAct.participantCards.Shooter || [])],
      Action: [...(gymAct.participantCards.Action || [])]
    };
  }

  // 4. Inicializar Copa Tarreo
  if (appData.tarreoCopa) {
    if (appData.tarreoCopa.cazatesoros) {
      puntosState.cazatesoros = {
        Terror: Number(appData.tarreoCopa.cazatesoros.tesoros?.Terror || 0),
        Shooter: Number(appData.tarreoCopa.cazatesoros.tesoros?.Shooter || 0),
        Action: Number(appData.tarreoCopa.cazatesoros.tesoros?.Action || 0)
      };
    }
    if (appData.tarreoCopa.justdance) {
      puntosState.tarreoPlaces.justdance = {
        Terror: appData.tarreoCopa.justdance.places?.Terror ? Number(appData.tarreoCopa.justdance.places.Terror) : null,
        Shooter: appData.tarreoCopa.justdance.places?.Shooter ? Number(appData.tarreoCopa.justdance.places.Shooter) : null,
        Action: appData.tarreoCopa.justdance.places?.Action ? Number(appData.tarreoCopa.justdance.places.Action) : null
      };
    }
    if (appData.tarreoCopa.mimica) {
      puntosState.tarreoPlaces.mimica = {
        Terror: appData.tarreoCopa.mimica.places?.Terror ? Number(appData.tarreoCopa.mimica.places.Terror) : null,
        Shooter: appData.tarreoCopa.mimica.places?.Shooter ? Number(appData.tarreoCopa.mimica.places.Shooter) : null,
        Action: appData.tarreoCopa.mimica.places?.Action ? Number(appData.tarreoCopa.mimica.places.Action) : null
      };
    }
  }

  // 5. Cargar Banco de Sorpresas en segundo plano
  loadSorpresasBankData().then(() => {
    if (puntosState.activeTab === 'sorpresas') {
      renderPuntosSubTab();
    }
  });

  renderPuntosSubTab();
}

function renderPuntosPanel() {
  return `
    <div class="space-y-6">
      <!-- HEADER CONSOLA -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              Mesa de Puntos & Arbitraje
            </span>
            <span class="text-xs text-slate-500 font-mono">Reglamento 2026</span>
          </div>
          <h2 class="text-xl font-bold font-heading text-white flex items-center gap-2">
            Consola Oficial de Registro de Puntos
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Ingreso dinámico de puestos, goles, promedios de gymkanas y empates con cálculo instantáneo y auditoría criptográfica.
          </p>
        </div>

        <!-- SUBTABS DE NAVEGACIÓN -->
        <div class="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto shrink-0">
          <button 
            id="tab-btn-places"
            onclick="setPuntosSubTab('places')" 
            class="px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${puntosState.activeTab === 'places' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}"
          >
            <i data-lucide="trophy" class="w-3.5 h-3.5 text-amber-400"></i>
            <span>Por Puestos</span>
          </button>
          <button 
            id="tab-btn-triangular"
            onclick="setPuntosSubTab('triangular')" 
            class="px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${puntosState.activeTab === 'triangular' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}"
          >
            <i data-lucide="swords" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>Torneo Triangular</span>
          </button>
          <button 
            id="tab-btn-gymkanas"
            onclick="setPuntosSubTab('gymkanas')" 
            class="px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${puntosState.activeTab === 'gymkanas' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}"
          >
            <i data-lucide="target" class="w-3.5 h-3.5 text-blue-400"></i>
            <span>Gymkanas</span>
          </button>
          <button 
            id="tab-btn-tarreo"
            onclick="setPuntosSubTab('tarreo')" 
            class="px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${puntosState.activeTab === 'tarreo' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}"
          >
            <i data-lucide="gamepad-2" class="w-3.5 h-3.5 text-purple-400"></i>
            <span>Copa Tarreo</span>
          </button>
          <button 
            id="tab-btn-sorpresas"
            onclick="setPuntosSubTab('sorpresas')" 
            class="px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${puntosState.activeTab === 'sorpresas' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}"
          >
            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-400"></i>
            <span>Pruebas Sorpresa</span>
          </button>
        </div>
      </div>

      <!-- TOAST DE NOTIFICACIÓN FLOTANTE -->
      <div id="puntos-toast" class="hidden transition-all duration-300"></div>

      <!-- CONTENEDOR DINÁMICO DE SUBTAB -->
      <div id="puntos-subview-container">
        <!-- RENDERIZADO POR JS -->
      </div>
    </div>
  `;
}

async function setPuntosSubTab(tab) {
  puntosState.activeTab = tab;
  ['places', 'triangular', 'gymkanas', 'tarreo', 'sorpresas'].forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    if (btn) {
      if (t === tab) {
        btn.className = 'px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 bg-slate-800 text-white shadow-sm';
      } else {
        btn.className = 'px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 text-slate-400 hover:text-slate-200';
      }
    }
  });

  if (tab === 'sorpresas') {
    if (!puntosState.sorpresasState.bank || puntosState.sorpresasState.bank.length === 0) {
      renderPuntosSubTab();
      await loadSorpresasBankData();
    } else {
      loadSorpresasBankData().then(() => renderPuntosSubTab());
    }
  }

  renderPuntosSubTab();
}

function renderPuntosSubTab() {
  const container = document.getElementById('puntos-subview-container');
  if (!container) return;

  if (puntosState.activeTab === 'places') {
    container.innerHTML = renderPuntosPlacesTab();
  } else if (puntosState.activeTab === 'triangular') {
    container.innerHTML = renderPuntosTriangularTab();
  } else if (puntosState.activeTab === 'gymkanas') {
    container.innerHTML = renderPuntosGymkanasTab();
  } else if (puntosState.activeTab === 'tarreo') {
    container.innerHTML = renderPuntosTarreoTab();
  } else if (puntosState.activeTab === 'sorpresas') {
    container.innerHTML = renderPuntosSorpresasTab();
  }

  lucide.createIcons();
}

// -------------------------------------------------------------------------
// 1. SUBTAB: ACTIVIDADES POR PUESTOS
// -------------------------------------------------------------------------

function calculatePlacesPreview(act, selection) {
  if (!act || !act.pointsDistribution) {
    return { Terror: 0, Shooter: 0, Action: 0, breakdown: 'Sin distribución configurada' };
  }
  const [p1, p2, p3] = act.pointsDistribution;
  const placeMap = { 1: [], 2: [], 3: [] };

  ['Terror', 'Shooter', 'Action'].forEach(al => {
    const pl = selection[al];
    if (pl && placeMap[pl]) placeMap[pl].push(al);
  });

  const awarded = { Terror: 0, Shooter: 0, Action: 0 };
  let breakdown = '';

  if (placeMap[1].length === 3) {
    const split = Math.round((p1 + p2 + p3) / 3);
    awarded.Terror = split; awarded.Shooter = split; awarded.Action = split;
    breakdown = `Triple Empate en 1° Lugar: (${p1} + ${p2} + ${p3}) / 3 = ${split.toLocaleString('es-CL')} pts para cada alianza.`;
  } else if (placeMap[1].length === 2) {
    const split = Math.round((p1 + p2) / 2);
    placeMap[1].forEach(al => awarded[al] = split);
    if (placeMap[3].length === 1) awarded[placeMap[3][0]] = p3;
    breakdown = `Empate en 1° Lugar (${placeMap[1].join(' y ')}): (${p1} + ${p2}) / 2 = ${split.toLocaleString('es-CL')} pts c/u. ${placeMap[3][0] || 'Tercera'}: ${p3.toLocaleString('es-CL')} pts.`;
  } else if (placeMap[1].length === 1) {
    awarded[placeMap[1][0]] = p1;
    if (placeMap[2].length === 2) {
      const split = Math.round((p2 + p3) / 2);
      placeMap[2].forEach(al => awarded[al] = split);
      breakdown = `1° ${placeMap[1][0]}: ${p1.toLocaleString('es-CL')} pts. Empate 2° (${placeMap[2].join(' y ')}): (${p2} + ${p3}) / 2 = ${split.toLocaleString('es-CL')} pts c/u.`;
    } else if (placeMap[2].length === 1) {
      awarded[placeMap[2][0]] = p2;
      if (placeMap[3].length >= 1) awarded[placeMap[3][0]] = p3;
      breakdown = `Distribución oficial directa: 1° (${p1.toLocaleString('es-CL')} pts), 2° (${p2.toLocaleString('es-CL')} pts), 3° (${p3.toLocaleString('es-CL')} pts).`;
    } else {
      breakdown = 'Seleccione los puestos de las demás alianzas para completar el podio.';
    }
  } else {
    breakdown = 'Seleccione al menos el 1° lugar para iniciar el cálculo automático.';
  }

  return { awarded, breakdown };
}

function renderPuntosPlacesTab() {
  const placesActs = (appData.activities || []).filter(a => a.type === 'places');
  const act = placesActs.find(a => a.id === puntosState.selectedPlaceActId) || placesActs[0];
  if (!act) return '<div class="p-6 text-slate-500">No hay actividades de puestos configuradas.</div>';

  const preview = calculatePlacesPreview(act, puntosState.placeSelection);

  const allianceThemes = {
    Terror: { name: 'Terror', border: 'border-red-800/80', bg: 'bg-red-950/20', text: 'text-red-400', badge: 'bg-red-900/60 text-red-200 border-red-700' },
    Shooter: { name: 'Shooter', border: 'border-blue-800/80', bg: 'bg-blue-950/20', text: 'text-blue-400', badge: 'bg-blue-900/60 text-blue-200 border-blue-700' },
    Action: { name: 'Action', border: 'border-emerald-800/80', bg: 'bg-emerald-950/20', text: 'text-emerald-400', badge: 'bg-emerald-900/60 text-emerald-200 border-emerald-700' }
  };

  const statusBadges = {
    'Pendiente': 'bg-slate-900 text-slate-400 border-slate-800',
    'En curso': 'bg-amber-950 text-amber-400 border-amber-800 animate-pulse',
    'Terminada': 'bg-emerald-950 text-emerald-400 border-emerald-800'
  };

  return `
    <div class="space-y-6">
      <!-- SELECTOR DINÁMICO DE ACTIVIDAD -->
      <div>
        <label class="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
          Seleccionar Actividad de Competencia
        </label>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          ${placesActs.map(a => {
            const isSel = a.id === act.id;
            const isDone = a.status === 'Terminada';
            return `
              <button 
                onclick="selectPlacesActivity('${a.id}')"
                class="text-left p-3 rounded-xl border transition relative ${isSel ? 'bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/50' : 'bg-slate-950 border-slate-800/80 hover:bg-slate-900/50 hover:border-slate-700'}"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[10px] font-mono font-bold uppercase ${isDone ? 'text-emerald-400' : (a.status === 'En curso' ? 'text-amber-400' : 'text-slate-500')}">
                    ${a.status}
                  </span>
                  <span class="text-[10px] font-mono text-slate-400">${a.maxPoints} pts</span>
                </div>
                <div class="font-bold text-xs text-white line-clamp-1">${a.name}</div>
                <div class="text-[10px] text-slate-500 truncate mt-0.5">${a.location || 'Cancha'}</div>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- TARJETA ACTIVA Y CONTROL DE ESTADO -->
      <div class="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-mono uppercase px-2 py-0.5 rounded-full border ${statusBadges[act.status] || 'bg-slate-900 text-slate-400'}">
              Estado: ${act.status}
            </span>
            <span class="text-xs text-slate-500 font-mono">${act.time}</span>
          </div>
          <h3 class="text-lg font-bold font-heading text-white">${act.name}</h3>
          <p class="text-xs text-slate-400 mt-0.5">${act.description || 'Puntajes: 1° (100%), 2° (60%), 3° (30%) de ' + act.maxPoints + ' pts.'}</p>
        </div>

        <!-- ACCIONES RÁPIDAS DE ESTADO -->
        <div class="flex items-center gap-2 shrink-0">
          <button 
            onclick="setActivityStatusQuick('${act.id}', 'En curso')"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${act.status === 'En curso' ? 'bg-amber-950 border-amber-800 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}"
          >
            <i data-lucide="play" class="w-3.5 h-3.5"></i> En Curso
          </button>
          <button 
            onclick="setActivityStatusQuick('${act.id}', 'Pendiente')"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${act.status === 'Pendiente' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}"
          >
            <i data-lucide="clock" class="w-3.5 h-3.5"></i> Pendiente
          </button>
        </div>
      </div>

      <!-- SELECTORES INTERACTIVOS DE PODIO POR ALIANZA -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${['Terror', 'Shooter', 'Action'].map(al => {
          const theme = allianceThemes[al];
          const currentPlace = puntosState.placeSelection[al];
          const ptsAwarded = preview.awarded[al] || 0;
          const maxPts = act.maxPoints || 3000;
          const pct = maxPts > 0 ? Math.round((ptsAwarded / maxPts) * 100) : 0;

          return `
            <div class="p-5 rounded-2xl border ${theme.border} ${theme.bg} flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full ${al === 'Terror' ? 'bg-red-500' : (al === 'Shooter' ? 'bg-blue-500' : 'bg-emerald-500')}"></div>
                  <h4 class="font-bold font-heading text-base text-white">Alianza ${theme.name}</h4>
                </div>
                <span class="text-xs font-mono font-bold ${theme.text}">
                  ${currentPlace ? currentPlace + '° Lugar' : 'Sin asignar'}
                </span>
              </div>

              <!-- BOTONES DE PUESTO RÁPIDO -->
              <div class="space-y-1.5">
                <label class="text-[10px] font-mono uppercase text-slate-400">Puesto Oficial en la Actividad:</label>
                <div class="grid grid-cols-3 gap-1.5">
                  <button 
                    onclick="setActivityPlace('${al}', 1)"
                    class="py-2.5 rounded-xl text-xs font-bold font-mono transition border ${currentPlace === 1 ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400' : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'}"
                  >
                    🥇 1°
                  </button>
                  <button 
                    onclick="setActivityPlace('${al}', 2)"
                    class="py-2.5 rounded-xl text-xs font-bold font-mono transition border ${currentPlace === 2 ? 'bg-slate-300 border-white text-slate-950 shadow-lg ring-2 ring-slate-300' : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'}"
                  >
                    🥈 2°
                  </button>
                  <button 
                    onclick="setActivityPlace('${al}', 3)"
                    class="py-2.5 rounded-xl text-xs font-bold font-mono transition border ${currentPlace === 3 ? 'bg-amber-800 border-amber-700 text-amber-100 shadow-lg ring-2 ring-amber-700' : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'}"
                  >
                    🥉 3°
                  </button>
                </div>
              </div>

              <!-- TARJETA DE PUNTOS EN VIVO -->
              <div class="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-400 font-mono">Puntos proyectados:</span>
                  <span class="font-mono font-bold text-white text-sm">+${ptsAwarded.toLocaleString('es-CL')} pts</span>
                </div>
                <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500 ${al === 'Terror' ? 'bg-red-500' : (al === 'Shooter' ? 'bg-blue-500' : 'bg-emerald-500')}" style="width: ${pct}%;"></div>
                </div>
                <div class="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Rendimiento</span>
                  <span>${pct}% del máx</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- ATAJOS DE EMPATES DIRECTOS -->
      <div class="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i data-lucide="split" class="w-4 h-4 text-indigo-400"></i>
            <span class="text-xs font-bold text-white font-heading">Atajos Reglamentarios de Empate (Reparto Proporcional)</span>
          </div>
          <span class="text-[11px] text-slate-500 font-mono">1 clic para configurar podio compartido</span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button 
            onclick="applyTiePreset('1-1-3_TS')"
            class="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-mono border border-slate-800 transition"
          >
            Empate 1°: Terror + Shooter (80% c/u)
          </button>
          <button 
            onclick="applyTiePreset('1-1-3_TA')"
            class="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-mono border border-slate-800 transition"
          >
            Empate 1°: Terror + Action (80% c/u)
          </button>
          <button 
            onclick="applyTiePreset('1-1-3_SA')"
            class="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-mono border border-slate-800 transition"
          >
            Empate 1°: Shooter + Action (80% c/u)
          </button>
          <button 
            onclick="applyTiePreset('1-2-2_SA')"
            class="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-mono border border-slate-800 transition"
          >
            Empate 2°: Shooter + Action (45% c/u)
          </button>
          <button 
            onclick="applyTiePreset('1-1-1')"
            class="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg text-xs font-mono border border-amber-900/60 transition"
          >
            Triple Empate: 1° = 2° = 3° (63.3% c/u)
          </button>
          <button 
            onclick="applyTiePreset('reset')"
            class="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 rounded-lg text-xs font-mono border border-red-900/80 transition ml-auto"
          >
            Limpiar Podio
          </button>
        </div>
      </div>

      <!-- EXPLICACIÓN MATEMÁTICA EN VIVO & NOTAS -->
      <div class="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-start gap-3">
          <div class="p-2 bg-indigo-950/60 border border-indigo-800 rounded-xl text-indigo-400 mt-0.5 shrink-0">
            <i data-lucide="calculator" class="w-4 h-4"></i>
          </div>
          <div>
            <span class="text-[10px] font-mono uppercase text-indigo-400 font-bold">Fórmula y Desglose en Vivo</span>
            <p class="text-xs text-white font-medium mt-0.5">${preview.breakdown}</p>
          </div>
        </div>

        <div class="w-full md:w-72 shrink-0">
          <input 
            type="text" 
            id="places-notes-input"
            value="${puntosState.placeNotes}"
            placeholder="Observación (ej: definido a penales)"
            onchange="puntosState.placeNotes = this.value"
            class="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
          >
        </div>
      </div>

      <!-- BOTÓN PRINCIPAL DE GUARDADO -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <button 
          id="btn-save-places"
          onclick="savePlacesResults()"
          class="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold font-heading rounded-xl shadow-lg shadow-indigo-600/20 border border-indigo-500 transition flex items-center justify-center gap-2"
        >
          <i data-lucide="check-circle-2" class="w-4 h-4"></i>
          <span>Calcular y Guardar Resultados Oficiales</span>
        </button>
      </div>
    </div>
  `;
}

function selectPlacesActivity(actId) {
  puntosState.selectedPlaceActId = actId;
  const act = (appData.activities || []).find(a => a.id === actId);
  if (act) {
    puntosState.placeSelection = {
      Terror: act.results?.Terror ? Number(act.results.Terror) : null,
      Shooter: act.results?.Shooter ? Number(act.results.Shooter) : null,
      Action: act.results?.Action ? Number(act.results.Action) : null
    };
    puntosState.placeNotes = act.notes || '';
  }
  renderPuntosSubTab();
}

function setActivityPlace(alliance, place) {
  puntosState.placeSelection[alliance] = place;
  renderPuntosSubTab();
}

function applyTiePreset(preset) {
  if (preset === '1-1-3_TS') {
    puntosState.placeSelection = { Terror: 1, Shooter: 1, Action: 3 };
  } else if (preset === '1-1-3_TA') {
    puntosState.placeSelection = { Terror: 1, Shooter: 3, Action: 1 };
  } else if (preset === '1-1-3_SA') {
    puntosState.placeSelection = { Terror: 3, Shooter: 1, Action: 1 };
  } else if (preset === '1-2-2_SA') {
    puntosState.placeSelection = { Terror: 1, Shooter: 2, Action: 2 };
  } else if (preset === '1-1-1') {
    puntosState.placeSelection = { Terror: 1, Shooter: 1, Action: 1 };
  } else if (preset === 'reset') {
    puntosState.placeSelection = { Terror: null, Shooter: null, Action: null };
  }
  renderPuntosSubTab();
}

async function setActivityStatusQuick(actId, newStatus) {
  try {
    const res = await fetch('/api/admin/activity/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        activityId: actId,
        status: newStatus,
        loggedBy: currentUser?.name || 'Staff'
      })
    });
    if (res.ok) {
      await loadStats();
      showPuntosToast(`Estado de la actividad actualizado a: ${newStatus}`, false);
      renderPuntosSubTab();
    } else {
      showPuntosToast('Error al actualizar estado de la actividad', true);
    }
  } catch (err) {
    showPuntosToast('Error de red al actualizar estado', true);
  }
}

async function savePlacesResults() {
  const act = (appData.activities || []).find(a => a.id === puntosState.selectedPlaceActId);
  if (!act) return;

  const notesInput = document.getElementById('places-notes-input');
  if (notesInput) puntosState.placeNotes = notesInput.value;

  const saveBtn = document.getElementById('btn-save-places');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Guardando...';
    lucide.createIcons();
  }

  try {
    const res = await fetch('/api/admin/activity/places', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        activityId: act.id,
        results: puntosState.placeSelection,
        notes: puntosState.placeNotes,
        loggedBy: currentUser?.name || 'Staff'
      })
    });

    if (res.ok) {
      const data = await res.json();
      await loadStats();
      showPuntosToast(`✓ Resultados de "${act.name}" guardados y publicados exitosamente.`, false);
      renderPuntosSubTab();
    } else {
      const err = await res.json();
      showPuntosToast(`Error al guardar: ${err.error || 'Intente nuevamente'}`, true);
    }
  } catch (e) {
    showPuntosToast('Error de conexión con el servidor', true);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i data-lucide="check-circle-2" class="w-4 h-4"></i><span>Calcular y Guardar Resultados Oficiales</span>';
      lucide.createIcons();
    }
  }
}


// -------------------------------------------------------------------------
// 2. SUBTAB: TORNEO TRIANGULAR (BABY FÚTBOL & QUEMADAS)
// -------------------------------------------------------------------------

function calculateTriangularStandings(matches) {
  const table = {
    Terror: { pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0 },
    Shooter: { pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0 },
    Action: { pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0 }
  };

  (matches || []).forEach(m => {
    if (m.score1 !== null && m.score2 !== null && m.score1 !== '' && m.score2 !== '') {
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

  const sorted = ['Terror', 'Shooter', 'Action'].sort((a, b) => {
    if (table[b].pts !== table[a].pts) return table[b].pts - table[a].pts;
    if (table[b].dg !== table[a].dg) return table[b].dg - table[a].dg;
    return table[b].gf - table[a].gf;
  });

  const p1 = 4000;
  const p2 = 2400;
  const p3 = 1200;

  const t0 = table[sorted[0]];
  const t1 = table[sorted[1]];
  const t2 = table[sorted[2]];

  const tie01 = (t0.pts === t1.pts && t0.dg === t1.dg && t0.gf === t1.gf);
  const tie12 = (t1.pts === t2.pts && t1.dg === t2.dg && t1.gf === t2.gf);

  const awarded = { Terror: 0, Shooter: 0, Action: 0 };

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

  return { table, sorted, awarded };
}

function renderPuntosTriangularTab() {
  const sportId = puntosState.selectedSport || 'babyfutbol';
  const matches = puntosState.localMatches[sportId] || [];
  const standings = calculateTriangularStandings(matches);

  const sportNames = {
    babyfutbol: { name: 'Baby Fútbol', unit: 'Goles', icon: 'futbol', max: 4000 },
    quemadas: { name: 'Quemadas', unit: 'Rondas', icon: 'zap', max: 4000 }
  };

  const currentSport = sportNames[sportId] || sportNames.babyfutbol;

  return `
    <div class="space-y-6">
      <!-- SELECTOR DE DEPORTE -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <label class="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Modalidad Triangular (3 Partidos de 8 min)
          </label>
          <div class="flex items-center gap-2">
            <button 
              onclick="selectTriangularSport('babyfutbol')"
              class="px-4 py-2 rounded-xl text-xs font-bold font-heading transition border flex items-center gap-2 ${sportId === 'babyfutbol' ? 'bg-emerald-950 border-emerald-700 text-emerald-300 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}"
            >
              <span>⚽ Baby Fútbol</span>
              <span class="text-[10px] font-mono opacity-70">4.000 pts</span>
            </button>
            <button 
              onclick="selectTriangularSport('quemadas')"
              class="px-4 py-2 rounded-xl text-xs font-bold font-heading transition border flex items-center gap-2 ${sportId === 'quemadas' ? 'bg-amber-950 border-amber-700 text-amber-300 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}"
            >
              <span>🔥 Quemadas</span>
              <span class="text-[10px] font-mono opacity-70">4.000 pts</span>
            </button>
          </div>
        </div>

        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono">
          <span>Regla: Victoria 3 pts • Empate 1 pt • Derrota 0 pts. ${sportId === 'quemadas' ? 'Desempate: Más rondas ganadas > Más jugadores en pie.' : 'Desempate: DIF > GF > Penales.'}</span>
        </div>
      </div>

      <!-- TARJETAS DE PARTIDOS INTERACTIVAS -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${matches.map((m, idx) => {
          const s1 = m.score1 !== null && m.score1 !== '' ? Number(m.score1) : null;
          const s2 = m.score2 !== null && m.score2 !== '' ? Number(m.score2) : null;

          let statusBadge = '<span class="text-[10px] font-mono text-slate-500">Pendiente</span>';
          if (s1 !== null && s2 !== null) {
            if (s1 > s2) {
              statusBadge = `<span class="text-[10px] font-mono font-bold text-emerald-400">Gana ${m.team1} (+3 pts)</span>`;
            } else if (s2 > s1) {
              statusBadge = `<span class="text-[10px] font-mono font-bold text-emerald-400">Gana ${m.team2} (+3 pts)</span>`;
            } else {
              statusBadge = '<span class="text-[10px] font-mono font-bold text-amber-400">Empate (+1 pt c/u)</span>';
            }
          }

          const teamColors = {
            Terror: 'text-red-400',
            Shooter: 'text-blue-400',
            Action: 'text-emerald-400'
          };

          return `
            <div class="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <div class="flex items-center justify-between border-b border-slate-900 pb-2">
                <span class="text-[11px] font-mono font-bold text-slate-400 uppercase">Partido ${idx + 1}</span>
                ${statusBadge}
              </div>

              <!-- MARCADOR CON STEPPERS (+ / -) -->
              <div class="flex items-center justify-between gap-2">
                <!-- EQUIPO 1 -->
                <div class="text-center flex-1 space-y-2">
                  <span class="font-bold font-heading text-sm ${teamColors[m.team1]} block truncate">${m.team1}</span>
                  <div class="flex items-center justify-center gap-1">
                    <button 
                      onclick="adjustMatchScore(${idx}, 1, -1)"
                      class="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold transition flex items-center justify-center"
                    >-</button>
                    <input 
                      type="number" 
                      min="0"
                      value="${s1 !== null ? s1 : ''}" 
                      placeholder="0"
                      onchange="updateMatchScoreDirect(${idx}, 1, this.value)"
                      class="w-12 h-8 text-center bg-slate-900 border border-slate-800 rounded-lg text-white font-mono font-bold text-base focus:outline-none focus:border-indigo-500"
                    >
                    <button 
                      onclick="adjustMatchScore(${idx}, 1, 1)"
                      class="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold transition flex items-center justify-center"
                    >+</button>
                  </div>
                </div>

                <div class="font-mono font-bold text-xs text-slate-600">VS</div>

                <!-- EQUIPO 2 -->
                <div class="text-center flex-1 space-y-2">
                  <span class="font-bold font-heading text-sm ${teamColors[m.team2]} block truncate">${m.team2}</span>
                  <div class="flex items-center justify-center gap-1">
                    <button 
                      onclick="adjustMatchScore(${idx}, 2, -1)"
                      class="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold transition flex items-center justify-center"
                    >-</button>
                    <input 
                      type="number" 
                      min="0"
                      value="${s2 !== null ? s2 : ''}" 
                      placeholder="0"
                      onchange="updateMatchScoreDirect(${idx}, 2, this.value)"
                      class="w-12 h-8 text-center bg-slate-900 border border-slate-800 rounded-lg text-white font-mono font-bold text-base focus:outline-none focus:border-indigo-500"
                    >
                    <button 
                      onclick="adjustMatchScore(${idx}, 2, 1)"
                      class="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold transition flex items-center justify-center"
                    >+</button>
                  </div>
                </div>
              </div>

              <!-- PRESETS RÁPIDOS DE RESULTADO -->
              <div class="flex items-center justify-center gap-1 pt-1">
                <button onclick="setMatchPreset(${idx}, 1, 0)" class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 hover:text-white border border-slate-800">1-0</button>
                <button onclick="setMatchPreset(${idx}, 2, 1)" class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 hover:text-white border border-slate-800">2-1</button>
                <button onclick="setMatchPreset(${idx}, 0, 0)" class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 hover:text-white border border-slate-800">0-0</button>
                <button onclick="setMatchPreset(${idx}, 2, 2)" class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 hover:text-white border border-slate-800">2-2</button>
                <button onclick="setMatchPreset(${idx}, 0, 1)" class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 hover:text-white border border-slate-800">0-1</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- TABLA DE POSICIONES EN VIVO Y PUNTOS OFICIALES -->
      <div class="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden space-y-4 p-5">
        <div class="flex items-center justify-between border-b border-slate-900 pb-3">
          <div>
            <h4 class="font-bold font-heading text-white text-base">Tabla de Posiciones Dinámica en Vivo</h4>
            <p class="text-xs text-slate-400 mt-0.5">Se actualiza en tiempo real al modificar los marcadores arriba.</p>
          </div>
          <span class="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800">
            Cálculo Automático
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="text-[10px] font-mono uppercase text-slate-400 border-b border-slate-900 bg-slate-900/40">
              <tr>
                <th class="py-2.5 px-3">Lugar</th>
                <th class="py-2.5 px-3">Alianza</th>
                <th class="py-2.5 px-3 text-center">PJ</th>
                <th class="py-2.5 px-3 text-center">PG</th>
                <th class="py-2.5 px-3 text-center">PE</th>
                <th class="py-2.5 px-3 text-center">PP</th>
                <th class="py-2.5 px-3 text-center">GF</th>
                <th class="py-2.5 px-3 text-center">GC</th>
                <th class="py-2.5 px-3 text-center">DIF</th>
                <th class="py-2.5 px-3 text-center font-bold text-white">PTS Torneo</th>
                <th class="py-2.5 px-3 text-right font-bold text-emerald-400">Puntos Semana Carrera</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-900 font-mono">
              ${standings.sorted.map((al, idx) => {
                const row = standings.table[al];
                const ptsWeek = standings.awarded[al] || 0;
                const posBadge = idx === 0 ? '🥇 1°' : (idx === 1 ? '🥈 2°' : '🥉 3°');

                const allianceColors = {
                  Terror: 'text-red-400',
                  Shooter: 'text-blue-400',
                  Action: 'text-emerald-400'
                };

                return `
                  <tr class="hover:bg-slate-900/30 transition">
                    <td class="py-3 px-3 font-bold text-white">${posBadge}</td>
                    <td class="py-3 px-3 font-heading font-bold ${allianceColors[al]}">${al}</td>
                    <td class="py-3 px-3 text-center text-slate-300">${row.pj}</td>
                    <td class="py-3 px-3 text-center text-emerald-400">${row.pg}</td>
                    <td class="py-3 px-3 text-center text-amber-400">${row.pe}</td>
                    <td class="py-3 px-3 text-center text-red-400">${row.pp}</td>
                    <td class="py-3 px-3 text-center text-slate-300">${row.gf}</td>
                    <td class="py-3 px-3 text-center text-slate-300">${row.gc}</td>
                    <td class="py-3 px-3 text-center font-bold ${row.dg > 0 ? 'text-emerald-400' : (row.dg < 0 ? 'text-red-400' : 'text-slate-400')}">
                      ${row.dg > 0 ? '+' + row.dg : row.dg}
                    </td>
                    <td class="py-3 px-3 text-center font-bold text-white text-sm bg-slate-900/60">${row.pts}</td>
                    <td class="py-3 px-3 text-right font-bold text-emerald-400 text-sm">
                      +${ptsWeek.toLocaleString('es-CL')} pts
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- BOTÓN DE GUARDADO TRIANGULAR -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <button 
          id="btn-save-triangular"
          onclick="saveTriangularResults()"
          class="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold font-heading rounded-xl shadow-lg shadow-emerald-600/20 border border-emerald-500 transition flex items-center justify-center gap-2"
        >
          <i data-lucide="check-circle-2" class="w-4 h-4"></i>
          <span>Guardar Partidos y Asignar Puntos de ${currentSport.name}</span>
        </button>
      </div>
    </div>
  `;
}

function selectTriangularSport(sport) {
  puntosState.selectedSport = sport;
  renderPuntosSubTab();
}

function adjustMatchScore(matchIndex, teamSlot, delta) {
  const sportId = puntosState.selectedSport || 'babyfutbol';
  const match = puntosState.localMatches[sportId][matchIndex];
  if (!match) return;

  const currentScore = teamSlot === 1 ? (match.score1 || 0) : (match.score2 || 0);
  const newScore = Math.max(0, Number(currentScore) + delta);

  if (teamSlot === 1) match.score1 = newScore;
  else match.score2 = newScore;

  renderPuntosSubTab();
}

function updateMatchScoreDirect(matchIndex, teamSlot, val) {
  const sportId = puntosState.selectedSport || 'babyfutbol';
  const match = puntosState.localMatches[sportId][matchIndex];
  if (!match) return;

  const num = val === '' ? null : Math.max(0, Number(val));
  if (teamSlot === 1) match.score1 = num;
  else match.score2 = num;

  renderPuntosSubTab();
}

function setMatchPreset(matchIndex, s1, s2) {
  const sportId = puntosState.selectedSport || 'babyfutbol';
  const match = puntosState.localMatches[sportId][matchIndex];
  if (!match) return;

  match.score1 = s1;
  match.score2 = s2;
  renderPuntosSubTab();
}

async function saveTriangularResults() {
  const sportId = puntosState.selectedSport || 'babyfutbol';
  const matches = puntosState.localMatches[sportId] || [];

  const saveBtn = document.getElementById('btn-save-triangular');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Guardando...';
    lucide.createIcons();
  }

  try {
    const res = await fetch('/api/admin/activity/matches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        activityId: sportId,
        matches,
        loggedBy: currentUser?.name || 'Staff'
      })
    });

    if (res.ok) {
      await loadStats();
      showPuntosToast(`✓ Tabla de ${sportId === 'babyfutbol' ? 'Baby Fútbol' : 'Quemadas'} guardada y puntos asignados.`, false);
      renderPuntosSubTab();
    } else {
      const err = await res.json();
      showPuntosToast(`Error al guardar: ${err.error || 'Intente nuevamente'}`, true);
    }
  } catch (e) {
    showPuntosToast('Error de conexión con el servidor', true);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i data-lucide="check-circle-2" class="w-4 h-4"></i><span>Guardar Partidos y Asignar Puntos</span>';
      lucide.createIcons();
    }
  }
}


// -------------------------------------------------------------------------
// 3. SUBTAB: GYMKANAS TÉCNICAS (ANOTACIÓN DE ESTUDIANTES Y PUNTAJES)
// -------------------------------------------------------------------------

let gymkanasTabParticipantsData = null;

async function loadGymkanasTabData() {
  try {
    const res = await fetch('/api/admin/participants/gymkanas', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.ok) {
      gymkanasTabParticipantsData = await res.json();
    }
  } catch (e) {
    console.error('Error loading gymkanas tab data:', e);
  }
}

function calculateGymkanaResultsFromList(lists) {
  const results = {
    Terror: { avg: 0, pts: 0, count: 0 },
    Shooter: { avg: 0, pts: 0, count: 0 },
    Action: { avg: 0, pts: 0, count: 0 }
  };

  ['Terror', 'Shooter', 'Action'].forEach(al => {
    const list = lists?.[al] || [];
    results[al].count = list.length;
    if (list.length > 0) {
      const sum = list.reduce((a, b) => a + Number(b.score !== null && b.score !== undefined ? b.score : 0), 0);
      const avg = sum / list.length;
      results[al].avg = Number(avg.toFixed(2));
      let pts = Math.round(3000 * (avg / 8));
      if (pts > 3000) pts = 3000;
      results[al].pts = pts;
    }
  });

  return results;
}

function renderPuntosGymkanasTab() {
  // Si no se han cargado los participantes de gymkanas, cargarlos en segundo plano
  if (!gymkanasTabParticipantsData) {
    loadGymkanasTabData().then(() => {
      const container = document.getElementById('puntos-subview-container');
      if (container && puntosState.activeTab === 'gymkanas') {
        container.innerHTML = renderPuntosGymkanasTab();
        lucide.createIcons();
      }
    });
  }

  const lists = gymkanasTabParticipantsData?.lists || { Terror: [], Shooter: [], Action: [] };
  const results = calculateGymkanaResultsFromList(lists);

  const allianceThemes = {
    Terror: { name: 'Terror', border: 'border-red-800/80', bg: 'bg-red-950/20', text: 'text-red-400', bar: 'bg-red-500' },
    Shooter: { name: 'Shooter', border: 'border-blue-800/80', bg: 'bg-blue-950/20', text: 'text-blue-400', bar: 'bg-blue-500' },
    Action: { name: 'Action', border: 'border-emerald-800/80', bg: 'bg-emerald-950/20', text: 'text-emerald-400', bar: 'bg-emerald-500' }
  };

  return `
    <div class="space-y-6">
      <!-- BANNER FÓRMULA OFICIAL Y GUÍA RÁPIDA -->
      <div class="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-start gap-3.5">
          <div class="p-2.5 bg-amber-950/60 border border-amber-800 rounded-xl text-amber-400 mt-0.5 shrink-0">
            <i data-lucide="target" class="w-5 h-5"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-mono uppercase text-amber-400 font-bold bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800">
                Punto de Control de Gymkanas
              </span>
              <span class="text-xs font-mono text-slate-500">Puestos 1 al 4</span>
            </div>
            <h3 class="text-base font-bold font-heading text-white mt-1">Anotar Estudiantes y Asignar Puntos en Cancha</h3>
            <p class="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Escribe el nombre del alumno en su alianza y presiona directamente los puntos que obtuvo (0 a 8 pts). 
              La fórmula <strong>Puntos = 3.000 × (Promedio / 8)</strong> se calcula en tiempo real.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button 
            onclick="switchAdminSection('participantes'); setTimeout(() => switchActivityParticipants('gymkanas'), 50);"
            class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 transition flex items-center gap-1.5"
            title="Abrir en Participantes por Actividad"
          >
            <i data-lucide="external-link" class="w-3.5 h-3.5 text-blue-400"></i>
            <span>Ver Nómina Completa</span>
          </button>
        </div>
      </div>

      <!-- 3 COLUMNAS INTERACTIVAS DE ANOTACIÓN POR ALIANZA -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        ${['Terror', 'Shooter', 'Action'].map(al => {
          const theme = allianceThemes[al];
          const students = lists[al] || [];
          const res = results[al];
          const pct = Math.round((res.pts / 3000) * 100);

          return `
            <div class="p-5 rounded-2xl border ${theme.border} ${theme.bg} space-y-4 flex flex-col justify-between">
              <div>
                <!-- HEADER DE ALIANZA -->
                <div class="flex items-center justify-between border-b border-slate-900 pb-2.5 mb-3">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full ${theme.bar}"></div>
                    <h4 class="font-bold font-heading text-base text-white">Alianza ${theme.name}</h4>
                  </div>
                  <span class="text-xs font-mono font-bold bg-slate-900 text-slate-300 border border-slate-800 px-2.5 py-0.5 rounded-lg">
                    ${students.length} anotados
                  </span>
                </div>

                <!-- BUSCADOR DIRECTO PARA ANOTAR ALUMNO CON BOTONES DE PUNTAJE (0 A 8) -->
                <div class="relative mb-3">
                  <label class="text-[10px] font-mono uppercase text-slate-400 block mb-1 font-bold">
                    Anotar estudiante de ${al}:
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                      <i data-lucide="search" class="w-3.5 h-3.5"></i>
                    </div>
                    <input 
                      type="text" 
                      id="gymtab-search-${al.toLowerCase()}" 
                      placeholder="Escribe nombre o apellido..." 
                      onfocus="handleGymkanasTabSearch('${al}', this.value)" 
                      oninput="handleGymkanasTabSearch('${al}', this.value)"
                      class="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs py-2 pl-8 pr-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition shadow-inner font-sans"
                    />
                  </div>
                  <!-- DROPDOWN DE AUTOCOMPLETADO CON BOTONES 0..8 -->
                  <div 
                    id="gymtab-autocomplete-${al.toLowerCase()}" 
                    class="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 hidden max-h-60 overflow-y-auto"
                  ></div>
                </div>

                <!-- LISTA DE ESTUDIANTES ANOTADOS EN GYMKANA -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-[10px] font-mono text-slate-500 pb-1">
                    <span>Estudiantes registrados:</span>
                    <span>Puntaje (0 - 8)</span>
                  </div>

                  <div class="p-2.5 bg-slate-950/90 border border-slate-800/90 rounded-xl min-h-[160px] max-h-64 overflow-y-auto space-y-1.5">
                    ${students.length === 0 ? `
                      <div class="text-center py-10 text-slate-500 text-xs font-mono space-y-1">
                        <i data-lucide="user-plus" class="w-7 h-7 mx-auto text-slate-700"></i>
                        <p>No hay alumnos anotados en ${al}.</p>
                        <p class="text-[10px] text-slate-600">Busca el nombre arriba para registrarlo.</p>
                      </div>
                    ` : students.map((p, pIdx) => `
                      <div class="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/90 flex items-center justify-between gap-2 hover:border-slate-700 transition">
                        <div class="min-w-0 flex-1">
                          <div class="flex items-center gap-1.5">
                            <span class="text-[10px] font-mono text-slate-500 font-bold">${pIdx + 1}.</span>
                            <span class="text-xs font-semibold text-white truncate block cursor-pointer hover:text-amber-400" onclick="openStudentProfileModalById('${p.studentId}')">
                              ${p.name}
                            </span>
                          </div>
                          <div class="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                            <span class="truncate">${p.carrera || ''}</span>
                            <span>•</span>
                            <span>${new Date(p.addedAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        <!-- CONTROLES TÁCTILES STEPPERS (- y +) -->
                        <div class="flex items-center gap-1 shrink-0 bg-slate-950 border border-slate-800 px-2 py-1 rounded-xl shadow-sm">
                          <button 
                            onclick="changeGymkanaTabScore('${p.studentId}', '${al}', -1)"
                            class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold font-mono text-xs flex items-center justify-center transition"
                            title="Restar 1 punto"
                          >-</button>
                          <span class="font-mono font-bold text-amber-300 text-xs px-1 min-w-[2.2rem] text-center">
                            ${p.score !== null && p.score !== undefined ? p.score : 0} <span class="text-[9px] text-amber-500 font-normal">pts</span>
                          </span>
                          <button 
                            onclick="changeGymkanaTabScore('${p.studentId}', '${al}', 1)"
                            class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold font-mono text-xs flex items-center justify-center transition"
                            title="Sumar 1 punto"
                          >+</button>
                        </div>

                        <!-- BOTÓN ELIMINAR -->
                        <button 
                          onclick="removeGymkanaTabStudent('${p.studentId}', '${al}', '${p.name}')" 
                          class="p-1 hover:text-red-400 text-slate-500 rounded transition shrink-0" 
                          title="Eliminar de gymkana"
                        >
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>

              <!-- RESUMEN EN VIVO DE PROMEDIO Y PUNTOS DE ALIANZA -->
              <div class="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 mt-3">
                <div class="flex items-center justify-between text-xs font-mono">
                  <span class="text-slate-400">Promedio de Alianza:</span>
                  <span class="font-bold text-white text-sm">${res.avg} / 8.0 pts</span>
                </div>
                <div class="flex items-center justify-between text-xs font-mono">
                  <span class="text-slate-400">Puntos Asignados:</span>
                  <span class="font-bold ${theme.text} text-base">+${res.pts.toLocaleString('es-CL')} pts</span>
                </div>
                <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500 ${theme.bar}" style="width: ${pct}%;"></div>
                </div>
                <div class="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                  <span>3.000 × (${res.avg} / 8)</span>
                  <span>${pct}% del máximo</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- BOTÓN DE GUARDADO Y CONSOLIDACIÓN -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-900">
        <div class="text-xs text-slate-500 font-mono">
          ✓ Los puntajes se guardan automáticamente al anotar o modificar cada alumno.
        </div>
        <button 
          id="btn-save-gymkanas"
          onclick="consolidateGymkanasOfficial()"
          class="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-bold font-heading rounded-xl shadow-lg shadow-amber-600/20 border border-amber-500 transition flex items-center justify-center gap-2"
        >
          <i data-lucide="check-circle-2" class="w-4 h-4 text-slate-950"></i>
          <span>Consolidar Puntos Oficiales en el Marcador</span>
        </button>
      </div>
    </div>
  `;
}

// Búsqueda interactiva en el tab de Gymkanas
async function handleGymkanasTabSearch(alliance, val) {
  const box = document.getElementById(`gymtab-autocomplete-${alliance.toLowerCase()}`);
  if (!box) return;

  const query = (val || '').trim();

  try {
    const url = `/api/students/search?q=${encodeURIComponent(query)}&alliance=${encodeURIComponent(alliance)}&excludeActivity=gymkanas`;
    const res = await fetch(url);
    let students = await res.json();

    // Excluir estudiantes ya anotados en gymkanas
    const enrolledIds = new Set();
    const lists = gymkanasTabParticipantsData?.lists || {};
    Object.values(lists).forEach(list => {
      (list || []).forEach(p => enrolledIds.add(p.studentId));
    });

    students = students.filter(s => {
      const matchAlliance = (s.alliance || '').toLowerCase() === alliance.toLowerCase();
      const notEnrolled = !enrolledIds.has(s.id);
      return matchAlliance && notEnrolled;
    });

    if (students.length === 0) {
      const msg = query.length > 0 
        ? `No hay estudiantes de ${alliance} que coincidan o ya están anotados.`
        : `Escribe un nombre para buscar estudiantes de ${alliance}.`;
      box.innerHTML = `<div class="p-3 text-[11px] text-slate-500 font-mono text-center">${msg}</div>`;
      box.classList.remove('hidden');
      return;
    }

    box.innerHTML = students.map(s => `
      <div class="p-2.5 hover:bg-slate-800/90 text-xs border-b border-slate-800/60 last:border-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition group">
        <div class="min-w-0 pr-2">
          <span class="font-semibold text-white block group-hover:text-amber-400 transition">${s.name}</span>
          <span class="block text-[10px] text-slate-400 truncate font-mono">${s.carrera || ''}</span>
        </div>
        <div class="flex items-center gap-1 shrink-0" onclick="event.stopPropagation()">
          <span class="text-[10px] font-mono text-amber-400 font-bold mr-1">Puntos:</span>
          ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(pts => `
            <button 
              onclick="addStudentToGymkanasTab('${s.id}', '${alliance}', ${pts})"
              class="w-6 h-6 rounded bg-slate-950 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-mono font-bold text-xs border border-slate-700 transition flex items-center justify-center shadow-sm"
              title="Anotar a ${s.name} con ${pts} pts"
            >${pts}</button>
          `).join('')}
        </div>
      </div>
    `).join('');

    box.classList.remove('hidden');
  } catch (err) {
    console.error(err);
  }
}

// Agregar alumno desde el tab de Gymkanas
async function addStudentToGymkanasTab(studentId, targetAlliance, score) {
  const box = document.getElementById(`gymtab-autocomplete-${targetAlliance.toLowerCase()}`);
  if (box) {
    box.classList.add('hidden');
    box.innerHTML = '';
  }
  const input = document.getElementById(`gymtab-search-${targetAlliance.toLowerCase()}`);
  if (input) input.value = '';

  try {
    const res = await fetch('/api/admin/participants/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        activityId: 'gymkanas',
        studentId,
        alliance: targetAlliance,
        score: Number(score),
        loggedBy: (currentUser?.name || 'Staff')
      })
    });

    const result = await res.json();
    if (!res.ok) {
      alert(`⚠️ ${result.error}`);
      return;
    }

    showPuntosToast(`✓ Estudiante registrado en Gymkanas con ${score} pts.`, false);
    await loadGymkanasTabData();
    await loadStats();
    renderPuntosSubTab();
  } catch (err) {
    alert('Error al registrar estudiante en Gymkanas');
  }
}

// Modificar score de estudiante en el tab de Gymkanas (+ o -)
async function changeGymkanaTabScore(studentId, alliance, delta) {
  const list = gymkanasTabParticipantsData?.lists?.[alliance] || [];
  const p = list.find(item => item.studentId === studentId);
  if (!p) return;

  const currentScore = p.score !== null && p.score !== undefined ? Number(p.score) : 0;
  const newScore = Math.min(8, Math.max(0, currentScore + delta));
  if (newScore === currentScore) return;

  try {
    const res = await fetch('/api/admin/participants/gymkana-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        studentId,
        alliance,
        score: newScore,
        loggedBy: (currentUser?.name || 'Staff'),
        reason: 'Ajuste de puntos en puesto de cancha'
      })
    });

    if (res.ok) {
      await loadGymkanasTabData();
      await loadStats();
      renderPuntosSubTab();
    }
  } catch (err) {
    console.error(err);
  }
}

// Eliminar estudiante de Gymkanas
async function removeGymkanaTabStudent(studentId, alliance, studentName) {
  if (!confirm(`¿Eliminar a ${studentName} de la lista de Gymkanas?`)) return;

  try {
    const res = await fetch('/api/admin/participants/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        activityId: 'gymkanas',
        studentId,
        alliance,
        loggedBy: (currentUser?.name || 'Staff'),
        reason: 'Eliminación desde mesa de control'
      })
    });

    if (res.ok) {
      showPuntosToast(`Estudiante eliminado de Gymkanas.`, false);
      await loadGymkanasTabData();
      await loadStats();
      renderPuntosSubTab();
    }
  } catch (err) {
    alert('Error al eliminar estudiante');
  }
}

// Consolidación oficial de puntos de Gymkana en el marcador general
async function consolidateGymkanasOfficial() {
  const saveBtn = document.getElementById('btn-save-gymkanas');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin text-slate-950"></i> Guardando...';
    lucide.createIcons();
  }

  try {
    const lists = gymkanasTabParticipantsData?.lists || { Terror: [], Shooter: [], Action: [] };
    const participantScores = {
      Terror: (lists.Terror || []).map(p => Number(p.score || 0)),
      Shooter: (lists.Shooter || []).map(p => Number(p.score || 0)),
      Action: (lists.Action || []).map(p => Number(p.score || 0))
    };

    const res = await fetch('/api/admin/activity/gymkanas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        participantScores,
        loggedBy: currentUser?.name || 'Staff'
      })
    });

    if (res.ok) {
      await loadStats();
      showPuntosToast('✓ Puntos oficiales de Gymkanas consolidados en el marcador general.', false);
      renderPuntosSubTab();
    } else {
      const err = await res.json();
      showPuntosToast(`Error al guardar: ${err.error || 'Intente nuevamente'}`, true);
    }
  } catch (e) {
    showPuntosToast('Error de conexión', true);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i data-lucide="check-circle-2" class="w-4 h-4 text-slate-950"></i><span>Consolidar Puntos Oficiales en el Marcador</span>';
      lucide.createIcons();
    }
  }
}

// -------------------------------------------------------------------------
// 4. SUBTAB: COPA TARREO & CAZATESOROS
// -------------------------------------------------------------------------

function renderPuntosTarreoTab() {
  const tTab = puntosState.tarreoTab || 'cazatesoros';

  const tT = Number(puntosState.cazatesoros.Terror || 0);
  const tS = Number(puntosState.cazatesoros.Shooter || 0);
  const tA = Number(puntosState.cazatesoros.Action || 0);
  const allZero = (tT === 0 && tS === 0 && tA === 0);

  return `
    <div class="space-y-6">
      <!-- SUBSELECTOR TARREO -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <label class="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Copa de Alianzas del Tarreo (Viernes Noche)
          </label>
          <div class="flex items-center gap-2">
            <button 
              onclick="puntosState.tarreoTab = 'cazatesoros'; renderPuntosSubTab();"
              class="px-3.5 py-2 rounded-xl text-xs font-bold font-heading transition border flex items-center gap-2 ${tTab === 'cazatesoros' ? 'bg-purple-950 border-purple-700 text-purple-300 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}"
            >
              <span>🗝️ Cazatesoros</span>
              <span class="text-[10px] font-mono opacity-70">1.500 pts</span>
            </button>
            <button 
              onclick="puntosState.tarreoTab = 'justdance'; renderPuntosSubTab();"
              class="px-3.5 py-2 rounded-xl text-xs font-bold font-heading transition border flex items-center gap-2 ${tTab === 'justdance' ? 'bg-pink-950 border-pink-700 text-pink-300 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}"
            >
              <span>💃 Just Dance</span>
              <span class="text-[10px] font-mono opacity-70">1.500 pts</span>
            </button>
            <button 
              onclick="puntosState.tarreoTab = 'mimica'; renderPuntosSubTab();"
              class="px-3.5 py-2 rounded-xl text-xs font-bold font-heading transition border flex items-center gap-2 ${tTab === 'mimica' ? 'bg-amber-950 border-amber-700 text-amber-300 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}"
            >
              <span>🎭 Mímica Gamer</span>
              <span class="text-[10px] font-mono opacity-70">1.000 pts</span>
            </button>
          </div>
        </div>

        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono">
          <span>Hasta 4.000 pts extra para la alianza que sume más en la noche gamer.</span>
        </div>
      </div>

      ${tTab === 'cazatesoros' ? `
        <!-- VISTA CAZATESOROS -->
        <div class="space-y-5">
          ${allZero ? `
            <div class="p-4 bg-amber-950/40 border border-amber-800/80 rounded-2xl flex items-center gap-3 text-xs text-amber-200 font-mono">
              <i data-lucide="info" class="w-5 h-5 text-amber-400 shrink-0"></i>
              <span><strong>Regla Oficial de Cazatesoros:</strong> Si ninguna alianza encuentra tesoros (0 - 0 - 0), se asignan <strong>950 pts</strong> de manera automática y equitativa a cada alianza.</span>
            </div>
          ` : `
            <div class="p-4 bg-purple-950/40 border border-purple-800/80 rounded-2xl flex items-center gap-3 text-xs text-purple-200 font-mono">
              <i data-lucide="check" class="w-5 h-5 text-purple-400 shrink-0"></i>
              <span>Reparto oficial por tesoros encontrados: 1° 1.500 pts (100%), 2° 900 pts (60%), 3° 450 pts (30%).</span>
            </div>
          `}

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${['Terror', 'Shooter', 'Action'].map(al => {
              const count = Number(puntosState.cazatesoros[al] || 0);
              const teamColors = { Terror: 'text-red-400', Shooter: 'text-blue-400', Action: 'text-emerald-400' };

              return `
                <div class="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="font-bold font-heading text-sm ${teamColors[al]}">Alianza ${al}</span>
                    <span class="text-xs font-mono text-slate-500">Tesoros</span>
                  </div>
                  <div class="flex items-center justify-center gap-3 py-2">
                    <button 
                      onclick="puntosState.cazatesoros['${al}'] = Math.max(0, ${count} - 1); renderPuntosSubTab();"
                      class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold text-lg transition flex items-center justify-center"
                    >-</button>
                    <input 
                      type="number" 
                      min="0"
                      value="${count}"
                      onchange="puntosState.cazatesoros['${al}'] = Math.max(0, Number(this.value)); renderPuntosSubTab();"
                      class="w-16 h-10 text-center bg-slate-900 border border-slate-800 rounded-xl text-white font-mono font-bold text-lg focus:outline-none focus:border-purple-500"
                    >
                    <button 
                      onclick="puntosState.cazatesoros['${al}'] = ${count} + 1; renderPuntosSubTab();"
                      class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold text-lg transition flex items-center justify-center"
                    >+</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button 
              id="btn-save-cazatesoros"
              onclick="saveTarreoCazatesoros()"
              class="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-xs font-bold font-heading rounded-xl shadow-lg shadow-purple-600/20 border border-purple-500 transition flex items-center justify-center gap-2"
            >
              <i data-lucide="check-circle-2" class="w-4 h-4"></i>
              <span>Guardar Cazatesoros Tarreo</span>
            </button>
          </div>
        </div>
      ` : `
        <!-- VISTA JUST DANCE O MÍMICA -->
        <div class="space-y-5">
          <div class="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Puntajes: ${tTab === 'justdance' ? '1° (1.500 pts) • 2° (900 pts) • 3° (450 pts)' : '1° (1.000 pts) • 2° (600 pts) • 3° (300 pts)'}</span>
            <span class="text-white font-bold">Asignación por Podio</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${['Terror', 'Shooter', 'Action'].map(al => {
              const currentPlace = puntosState.tarreoPlaces[tTab]?.[al];
              const teamColors = { Terror: 'text-red-400', Shooter: 'text-blue-400', Action: 'text-emerald-400' };

              return `
                <div class="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="font-bold font-heading text-sm ${teamColors[al]}">Alianza ${al}</span>
                    <span class="text-xs font-mono font-bold text-white">${currentPlace ? currentPlace + '° Lugar' : 'Sin asignar'}</span>
                  </div>
                  <div class="grid grid-cols-3 gap-1.5 pt-2">
                    <button 
                      onclick="puntosState.tarreoPlaces['${tTab}']['${al}'] = 1; renderPuntosSubTab();"
                      class="py-2.5 rounded-xl text-xs font-mono font-bold border transition ${currentPlace === 1 ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold' : 'bg-slate-900 border-slate-800 text-slate-300'}"
                    >🥇 1°</button>
                    <button 
                      onclick="puntosState.tarreoPlaces['${tTab}']['${al}'] = 2; renderPuntosSubTab();"
                      class="py-2.5 rounded-xl text-xs font-mono font-bold border transition ${currentPlace === 2 ? 'bg-slate-300 border-white text-slate-950 font-bold' : 'bg-slate-900 border-slate-800 text-slate-300'}"
                    >🥈 2°</button>
                    <button 
                      onclick="puntosState.tarreoPlaces['${tTab}']['${al}'] = 3; renderPuntosSubTab();"
                      class="py-2.5 rounded-xl text-xs font-mono font-bold border transition ${currentPlace === 3 ? 'bg-amber-800 border-amber-700 text-white font-bold' : 'bg-slate-900 border-slate-800 text-slate-300'}"
                    >🥉 3°</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button 
              id="btn-save-tarreo-places"
              onclick="saveTarreoPlaces('${tTab}')"
              class="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 text-white text-xs font-bold font-heading rounded-xl shadow-lg shadow-pink-600/20 border border-pink-500 transition flex items-center justify-center gap-2"
            >
              <i data-lucide="check-circle-2" class="w-4 h-4"></i>
              <span>Guardar Resultados de ${tTab === 'justdance' ? 'Just Dance' : 'Mímica Gamer'}</span>
            </button>
          </div>
        </div>
      `}
    </div>
  `;
}

async function saveTarreoCazatesoros() {
  const saveBtn = document.getElementById('btn-save-cazatesoros');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Guardando...';
    lucide.createIcons();
  }

  try {
    const res = await fetch('/api/admin/tarreo/cazatesoros', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        tesoros: puntosState.cazatesoros,
        loggedBy: currentUser?.name || 'Staff'
      })
    });

    if (res.ok) {
      await loadStats();
      showPuntosToast('✓ Puntos de Cazatesoros Copa Tarreo guardados exitosamente.', false);
      renderPuntosSubTab();
    } else {
      const err = await res.json();
      showPuntosToast(`Error al guardar: ${err.error || 'Intente nuevamente'}`, true);
    }
  } catch (e) {
    showPuntosToast('Error de conexión', true);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i data-lucide="check-circle-2" class="w-4 h-4"></i><span>Guardar Cazatesoros Tarreo</span>';
      lucide.createIcons();
    }
  }
}

async function saveTarreoPlaces(eventId) {
  const saveBtn = document.getElementById('btn-save-tarreo-places');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Guardando...';
    lucide.createIcons();
  }

  try {
    const res = await fetch('/api/admin/tarreo/copa-places', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        eventId,
        places: puntosState.tarreoPlaces[eventId],
        loggedBy: currentUser?.name || 'Staff'
      })
    });

    if (res.ok) {
      await loadStats();
      showPuntosToast(`✓ Resultados de ${eventId === 'justdance' ? 'Just Dance' : 'Mímica Gamer'} guardados exitosamente.`, false);
      renderPuntosSubTab();
    } else {
      const err = await res.json();
      showPuntosToast(`Error al guardar: ${err.error || 'Intente nuevamente'}`, true);
    }
  } catch (e) {
    showPuntosToast('Error de conexión', true);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i data-lucide="check-circle-2" class="w-4 h-4"></i><span>Guardar Resultados</span>';
      lucide.createIcons();
    }
  }
}


// -------------------------------------------------------------------------
// TOAST NOTIFICACIÓN FLOTANTE PARA PUNTOS
// -------------------------------------------------------------------------

function showPuntosToast(message, isError = false) {
  const toast = document.getElementById('puntos-toast');
  if (!toast) return;

  toast.className = `p-3.5 rounded-xl text-xs font-semibold border flex items-center gap-2.5 transition-all duration-300 ${isError ? 'bg-red-950/90 border-red-800 text-red-200' : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'}`;
  toast.innerHTML = `
    <i data-lucide="${isError ? 'alert-circle' : 'check-circle'}" class="w-4 h-4 shrink-0 ${isError ? 'text-red-400' : 'text-emerald-400'}"></i>
    <span>${message}</span>
  `;
  toast.classList.remove('hidden');
  lucide.createIcons();

  setTimeout(() => {
    if (toast) toast.classList.add('hidden');
  }, 4500);
}


// =========================================================================
// MÓDULO: PRUEBAS SORPRESA (BANCO DE 7, LANZADOR, ARBITRAJE Y TOPES)
// =========================================================================

let sorpresaCountdownTimer = null;

async function loadSorpresasBankData() {
  try {
    const res = await fetch('/api/admin/sorpresas/bank', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      puntosState.sorpresasState.bank = data.bank || [];
      puntosState.sorpresasState.activeSorpresa = data.activeSorpresa || null;
      puntosState.sorpresasState.completedSorpresas = data.completedSorpresas || [];
      puntosState.sorpresasState.accumulatedPoints = data.accumulatedPoints || { Terror: 0, Shooter: 0, Action: 0 };
    }
  } catch (err) {
    console.error('Error al cargar banco de sorpresas:', err);
  }
}

function calculateActiveSorpresaPreview() {
  const sorp = puntosState.sorpresasState.activeSorpresa;
  if (!sorp) return { placeMap: { 1: [], 2: [], 3: [] }, awarded: { Terror: 0, Shooter: 0, Action: 0 }, sums: {} };

  const [p1, p2, p3] = sorp.pointsDistribution || [500, 300, 150];
  const placeMap = { 1: [], 2: [], 3: [] };
  let sums = { Terror: 0, Shooter: 0, Action: 0 };

  if (sorp.decisionType === 'jurado') {
    const j = puntosState.sorpresasState.judges;
    [j.judge1, j.judge2, j.judge3].forEach(judge => {
      ['Terror', 'Shooter', 'Action'].forEach(al => {
        sums[al] += Number(judge[al] || 3);
      });
    });

    const sorted = ['Terror', 'Shooter', 'Action'].sort((a, b) => sums[a] - sums[b]);
    const s0 = sums[sorted[0]];
    const s1 = sums[sorted[1]];
    const s2 = sums[sorted[2]];

    if (s0 === s1 && s1 === s2) {
      placeMap[1] = ['Terror', 'Shooter', 'Action'];
    } else if (s0 === s1) {
      placeMap[1] = [sorted[0], sorted[1]];
      placeMap[3] = [sorted[2]];
    } else if (s1 === s2) {
      placeMap[1] = [sorted[0]];
      placeMap[2] = [sorted[1], sorted[2]];
    } else {
      placeMap[1] = [sorted[0]];
      placeMap[2] = [sorted[1]];
      placeMap[3] = [sorted[2]];
    }
  } else {
    // Medición
    const m = puntosState.sorpresasState.metrics;
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
  }

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

  return { placeMap, awarded, sums };
}

function renderPuntosSorpresasTab() {
  const sState = puntosState.sorpresasState;
  const activeSorp = sState.activeSorpresa;
  const bank = sState.bank || [];
  const completed = sState.completedSorpresas || [];
  const accPts = sState.accumulatedPoints || { Terror: 0, Shooter: 0, Action: 0 };

  // Iniciar timer si hay prueba activa
  if (activeSorp && !sorpresaCountdownTimer) {
    startSorpresaCountdown();
  } else if (!activeSorp && sorpresaCountdownTimer) {
    clearInterval(sorpresaCountdownTimer);
    sorpresaCountdownTimer = null;
  }

  const allianceColors = {
    Terror: { text: 'text-red-400', bar: 'bg-red-500', border: 'border-red-900/60', bg: 'bg-red-950/20' },
    Shooter: { text: 'text-blue-400', bar: 'bg-blue-500', border: 'border-blue-900/60', bg: 'bg-blue-950/20' },
    Action: { text: 'text-emerald-400', bar: 'bg-emerald-500', border: 'border-emerald-900/60', bg: 'bg-emerald-950/20' }
  };

  return `
    <div class="space-y-6">
      <!-- HEADER CON LÍMITES Y TOPES DE LAS BASES -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <!-- ESTADO DE PRUEBAS REALIZADAS -->
        <div class="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span class="text-[10px] font-mono uppercase text-slate-500 block">Cupo de Pruebas</span>
            <span class="text-xl font-bold font-mono text-white">${completed.length} <span class="text-xs text-slate-500 font-normal">de 6 máx</span></span>
            <span class="text-[10px] text-amber-400 block mt-0.5">1 en reserva oficial</span>
          </div>
          <div class="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-400">
            <i data-lucide="sparkles" class="w-5 h-5"></i>
          </div>
        </div>

        <!-- ACUMULADO TERROR (MÁX 3000) -->
        <div class="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold font-mono text-red-400">Terror</span>
            <span class="font-mono text-white font-bold">${accPts.Terror.toLocaleString('es-CL')} / 3.000 pts</span>
          </div>
          <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div class="h-full bg-red-500 rounded-full transition-all duration-500" style="width: ${Math.min(100, (accPts.Terror / 3000) * 100)}%;"></div>
          </div>
          <span class="text-[9px] font-mono text-slate-500 block">Tope máximo: 3.000 pts extra</span>
        </div>

        <!-- ACUMULADO SHOOTER (MÁX 3000) -->
        <div class="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold font-mono text-blue-400">Shooter</span>
            <span class="font-mono text-white font-bold">${accPts.Shooter.toLocaleString('es-CL')} / 3.000 pts</span>
          </div>
          <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div class="h-full bg-blue-500 rounded-full transition-all duration-500" style="width: ${Math.min(100, (accPts.Shooter / 3000) * 100)}%;"></div>
          </div>
          <span class="text-[9px] font-mono text-slate-500 block">Tope máximo: 3.000 pts extra</span>
        </div>

        <!-- ACUMULADO ACTION (MÁX 3000) -->
        <div class="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold font-mono text-emerald-400">Action</span>
            <span class="font-mono text-white font-bold">${accPts.Action.toLocaleString('es-CL')} / 3.000 pts</span>
          </div>
          <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" style="width: ${Math.min(100, (accPts.Action / 3000) * 100)}%;"></div>
          </div>
          <span class="text-[9px] font-mono text-slate-500 block">Tope máximo: 3.000 pts extra</span>
        </div>
      </div>

      ${activeSorp ? renderActiveSorpresaConsole(activeSorp) : renderNoActiveSorpresaView()}
    </div>
  `;
}

// Subvista: Cuando hay prueba sorpresa en curso
function renderActiveSorpresaConsole(sorp) {
  const preview = calculateActiveSorpresaPreview();
  const [p1, p2, p3] = sorp.pointsDistribution || [500, 300, 150];

  return `
    <!-- CONSOLA DE PRUEBA EN CURSO -->
    <div class="p-5 bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950 border-2 border-amber-600/80 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-900/60 pb-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-slate-950 uppercase animate-pulse">
              🚨 PRUEBA SORPRESA EN CURSO
            </span>
            <span class="text-xs font-mono text-amber-300">${sorp.duration} minutos oficiales</span>
          </div>
          <h3 class="text-2xl font-bold font-heading text-white">${sorp.name}</h3>
          <p class="text-xs text-slate-300 mt-1 max-w-2xl">${sorp.criteria || sorp.description || ''}</p>
          <div class="flex flex-wrap items-center gap-3 mt-2 text-xs font-mono text-slate-400">
            <span>Material: <strong class="text-slate-200">${sorp.material || 'Ninguno'}</strong></span>
            <span>•</span>
            <span class="text-amber-300 font-semibold">${sorp.careNotes || ''}</span>
          </div>
        </div>

        <!-- RELOJ CUENTA REGRESIVA 1 MINUTO -->
        <div class="p-4 bg-slate-950 border border-amber-700/80 rounded-2xl text-center min-w-[160px] shrink-0 shadow-lg">
          <span class="text-[10px] font-mono uppercase text-amber-400 block font-bold">Tiempo de Preparación</span>
          <span id="sorpresa-countdown-display" class="text-3xl font-mono font-bold text-white block my-0.5">01:00</span>
          <span id="sorpresa-countdown-status" class="text-[10px] font-mono text-slate-400">En aviso público y pantalla</span>
        </div>
      </div>

      <!-- ARBITRAJE EN CALIENTE: JURADO O MEDICIÓN -->
      ${sorp.decisionType === 'jurado' ? renderJuradoConsole(preview) : renderMedicionConsole(sorp, preview)}

      <!-- RESUMEN PREVIO DE PUNTOS Y REGLA DE EMPATE -->
      <div class="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="p-2.5 bg-indigo-950 border border-indigo-800 rounded-xl text-indigo-400 shrink-0">
            <i data-lucide="calculator" class="w-5 h-5"></i>
          </div>
          <div>
            <span class="text-[10px] font-mono uppercase text-indigo-400 font-bold">Puntos Oficiales a Otorgar</span>
            <div class="flex items-center gap-4 text-xs font-mono font-bold mt-0.5">
              <span class="text-red-400">Terror: +${preview.awarded.Terror} pts</span>
              <span class="text-blue-400">Shooter: +${preview.awarded.Shooter} pts</span>
              <span class="text-emerald-400">Action: +${preview.awarded.Action} pts</span>
            </div>
            <span class="text-[10px] text-slate-400 font-mono">Bases oficiales: 1° ${p1} pts • 2° ${p2} pts • 3° ${p3} pts (empates promediados).</span>
          </div>
        </div>

        <div class="flex items-center gap-2.5 shrink-0">
          <button 
            onclick="cancelActiveSorpresa()"
            class="px-4 py-2.5 bg-red-950/80 hover:bg-red-900 text-red-200 text-xs font-semibold rounded-xl border border-red-800 transition flex items-center gap-1.5"
          >
            <i data-lucide="x" class="w-4 h-4"></i>
            <span>Cancelar Prueba</span>
          </button>
          <button 
            id="btn-confirm-sorpresa"
            onclick="recordActiveSorpresaResult()"
            class="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold font-heading rounded-xl shadow-lg shadow-emerald-600/20 border border-emerald-500 transition flex items-center gap-2"
          >
            <i data-lucide="check-circle-2" class="w-4 h-4"></i>
            <span>Confirmar y Sumar Puntos al Marcador</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Arbitraje por 3 Jueces (Suma de Rangos)
function renderJuradoConsole(preview) {
  const judges = puntosState.sorpresasState.judges;

  return `
    <div class="space-y-4">
      <div class="flex items-center justify-between border-b border-slate-900 pb-2">
        <h4 class="font-bold font-heading text-base text-white flex items-center gap-2">
          <span>Evaluación de los 3 Jueces de Cancha</span>
          <span class="text-xs font-mono font-normal text-slate-400">(Suma de posiciones: quien sume menos rango, gana 1°)</span>
        </h4>
        <span class="text-xs font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900">Votación en Vivo</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${[1, 2, 3].map(jNum => {
          const jKey = 'judge' + jNum;
          const currentVote = judges[jKey];

          return `
            <div class="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <span class="text-xs font-bold font-mono text-white block uppercase border-b border-slate-900 pb-1.5">
                👨‍⚖️ Juez ${jNum}
              </span>

              ${['Terror', 'Shooter', 'Action'].map(al => {
                const teamColor = al === 'Terror' ? 'text-red-400' : (al === 'Shooter' ? 'text-blue-400' : 'text-emerald-400');
                const val = currentVote[al] || 3;

                return `
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-bold font-heading ${teamColor}">${al}</span>
                    <div class="grid grid-cols-3 gap-1">
                      <button 
                        onclick="updateJudgePlace('${jKey}', '${al}', 1)"
                        class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition border ${val === 1 ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}"
                      >1°</button>
                      <button 
                        onclick="updateJudgePlace('${jKey}', '${al}', 2)"
                        class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition border ${val === 2 ? 'bg-slate-300 border-white text-slate-950 shadow-md font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}"
                      >2°</button>
                      <button 
                        onclick="updateJudgePlace('${jKey}', '${al}', 3)"
                        class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition border ${val === 3 ? 'bg-amber-800 border-amber-700 text-white shadow-md font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}"
                      >3°</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }).join('')}
      </div>

      <!-- TABLA DE SUMAS DE JUECES -->
      <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
        <span class="text-slate-400">Suma total de puestos otorgados por jueces:</span>
        <div class="flex items-center gap-4 font-bold">
          <span class="text-red-400">Terror: ${preview.sums.Terror} pts suma</span>
          <span class="text-blue-400">Shooter: ${preview.sums.Shooter} pts suma</span>
          <span class="text-emerald-400">Action: ${preview.sums.Action} pts suma</span>
        </div>
      </div>
    </div>
  `;
}

// Arbitraje por Medición Cuantitativa
function renderMedicionConsole(sorp, preview) {
  const m = puntosState.sorpresasState.metrics;

  return `
    <div class="space-y-4">
      <div class="flex items-center justify-between border-b border-slate-900 pb-2">
        <div>
          <h4 class="font-bold font-heading text-base text-white">Medición Cuantitativa en Cancha</h4>
          <p class="text-xs text-slate-400 mt-0.5">${sorp.metricLabel || 'Registro de datos'}</p>
        </div>
        <span class="text-xs font-mono text-blue-400 bg-blue-950 px-2.5 py-0.5 rounded border border-blue-900">
          Orden: ${sorp.metricDirection === 'asc' ? 'Menor valor gana 1°' : 'Mayor valor gana 1°'}
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${['Terror', 'Shooter', 'Action'].map(al => {
          const val = Number(m[al] || 0);
          const teamColor = al === 'Terror' ? 'text-red-400' : (al === 'Shooter' ? 'text-blue-400' : 'text-emerald-400');

          return `
            <div class="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-bold font-heading text-sm ${teamColor}">Alianza ${al}</span>
                <span class="text-[10px] font-mono text-slate-500">${sorp.metricLabel || 'Valor'}</span>
              </div>
              <div class="flex items-center justify-center gap-3 py-2">
                <button 
                  onclick="updateMetricValue('${al}', -1)"
                  class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold text-lg transition flex items-center justify-center"
                >-</button>
                <input 
                  type="number" 
                  value="${val}"
                  onchange="puntosState.sorpresasState.metrics['${al}'] = Math.max(0, Number(this.value)); renderPuntosSubTab();"
                  class="w-20 h-10 text-center bg-slate-900 border border-slate-800 rounded-xl text-white font-mono font-bold text-lg focus:outline-none focus:border-indigo-500"
                >
                <button 
                  onclick="updateMetricValue('${al}', 1)"
                  class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold text-lg transition flex items-center justify-center"
                >+</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Subvista: Cuando NO hay prueba activa (Banco, Crear, Historial)
function renderNoActiveSorpresaView() {
  const sState = puntosState.sorpresasState;
  const currentSub = sState.activeSubView || 'banco';

  return `
    <div class="space-y-6">
      <!-- SUBBARRA DE MODOS DE SORPRESAS -->
      <div class="flex items-center justify-between border-b border-slate-900 pb-3">
        <div class="flex items-center gap-2">
          <button 
            onclick="setSorpresasSubView('banco')"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${currentSub === 'banco' ? 'bg-amber-950 border-amber-700 text-amber-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}"
          >
            <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
            <span>Banco Oficial (7 Sorpresas)</span>
          </button>
          <button 
            onclick="setSorpresasSubView('crear')"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${currentSub === 'crear' ? 'bg-indigo-950 border-indigo-700 text-indigo-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}"
          >
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>Crear Prueba en Caliente</span>
          </button>
          <button 
            onclick="setSorpresasSubView('historial')"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${currentSub === 'historial' ? 'bg-slate-800 border-slate-700 text-white font-bold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}"
          >
            <i data-lucide="history" class="w-3.5 h-3.5"></i>
            <span>Historial Realizado</span>
          </button>
        </div>

        <span class="text-xs text-slate-500 font-mono hidden sm:inline">
          El público no ve el banco hasta el lanzamiento oficial.
        </span>
      </div>

      ${currentSub === 'banco' ? renderSorpresasBankCards() : (currentSub === 'crear' ? renderCreateSorpresaForm() : renderSorpresasHistoryTable())}
    </div>
  `;
}

// Renderizado de las 7 Fichas del Banco Oficial
function renderSorpresasBankCards() {
  const bank = puntosState.sorpresasState.bank || [];

  if (bank.length === 0) {
    if (!puntosState.sorpresasState.isLoadingBank) {
      puntosState.sorpresasState.isLoadingBank = true;
      loadSorpresasBankData().then(() => {
        puntosState.sorpresasState.isLoadingBank = false;
        renderPuntosSubTab();
      });
    }

    return `
      <div class="py-12 text-center text-slate-400 border border-slate-800/80 rounded-2xl bg-slate-950/60 p-8 space-y-3">
        <i data-lucide="loader-2" class="w-8 h-8 mx-auto text-amber-500 animate-spin"></i>
        <p class="text-sm font-medium text-slate-300">Cargando banco oficial de pruebas sorpresa...</p>
        <button onclick="loadSorpresasBankData().then(() => renderPuntosSubTab())" class="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs text-amber-300 border border-amber-800/60 rounded-xl transition">
          Recargar Banco
        </button>
      </div>
    `;
  }

  return `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${bank.map(sorp => {
        const isReserve = sorp.isReserve;
        const [p1, p2, p3] = sorp.pointsDistribution || [500, 300, 150];

        return `
          <div class="p-5 rounded-2xl border ${isReserve ? 'border-amber-700/80 bg-amber-950/20' : 'border-slate-800 bg-slate-950'} flex flex-col justify-between space-y-4 hover:border-slate-700 transition relative">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${isReserve ? 'bg-amber-900 text-amber-200' : 'bg-slate-900 text-slate-400 border border-slate-800'}">
                  ${sorp.suggestedSlot || 'Sorpresa'}
                </span>
                <span class="text-[10px] font-mono text-slate-400 font-bold">${sorp.duration} min oficiales</span>
              </div>

              <h4 class="text-base font-bold font-heading text-white mb-1">${sorp.name}</h4>
              <p class="text-xs text-slate-400 line-clamp-2 mb-3">${sorp.criteria}</p>

              <div class="space-y-1.5 text-[11px] font-mono text-slate-400 border-t border-slate-900 pt-2.5">
                <div class="flex items-center justify-between">
                  <span class="text-slate-500">Decisión:</span>
                  <span class="text-slate-300 font-bold uppercase">${sorp.decisionType === 'jurado' ? '👨‍⚖️ Jurado (3 jueces)' : '📊 Medición (' + (sorp.metricLabel || 'Métrica') + ')'}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-500">Material:</span>
                  <span class="text-slate-300 truncate max-w-[180px]">${sorp.material || 'Ninguno'}</span>
                </div>
                <div class="flex items-center justify-between text-emerald-400 font-bold">
                  <span>Puntos:</span>
                  <span>1° ${p1} • 2° ${p2} • 3° ${p3}</span>
                </div>
              </div>

              <!-- ALERTA DE CUIDADOS -->
              ${isReserve ? `
                <div class="mt-3 p-2.5 rounded-xl bg-amber-950/80 border border-amber-800 text-[10px] text-amber-200 font-mono flex items-start gap-1.5">
                  <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-400 shrink-0 mt-0.5"></i>
                  <span>${sorp.careNotes}</span>
                </div>
              ` : `
                <div class="mt-3 text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                  <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-400 shrink-0"></i>
                  <span class="truncate">${sorp.careNotes}</span>
                </div>
              `}
            </div>

            <!-- BOTÓN LANZAR -->
            <button 
              onclick="launchSorpresaFromBank('${sorp.id}')"
              class="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-bold font-heading rounded-xl shadow-lg shadow-amber-600/20 border border-amber-500 transition flex items-center justify-center gap-2"
            >
              <i data-lucide="play" class="w-4 h-4 fill-current"></i>
              <span>Lanzar Sorpresa (1 min prep)</span>
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Formulario de Creación de Prueba Propia con Checklist Obligatorio
function renderCreateSorpresaForm() {
  const form = puntosState.sorpresasState.customForm;
  const ch = form.checklist;
  const allChecked = ch.voluntaria && ch.sinRiesgo && ch.sinContacto && ch.sinHumillacion;

  return `
    <div class="p-6 bg-slate-950 border border-slate-800 rounded-3xl max-w-3xl mx-auto space-y-6">
      <div class="border-b border-slate-900 pb-3">
        <span class="text-[10px] font-mono uppercase text-indigo-400 font-bold bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-800">
          Formulario Oficial en Caliente
        </span>
        <h3 class="text-lg font-bold font-heading text-white mt-1">Crear Prueba Sorpresa en el Momento</h3>
        <p class="text-xs text-slate-400 mt-0.5">
          Configuración rápida con límites reglamentarios y verificación de cuidados obligatoria.
        </p>
      </div>

      <div class="space-y-4 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="sm:col-span-2 space-y-1">
            <label class="font-mono text-slate-400 block font-bold">Nombre de la prueba:</label>
            <input 
              type="text" 
              id="custom-sorp-name"
              placeholder="Ej: Adivina la canción al revés" 
              value="${form.name}"
              oninput="puntosState.sorpresasState.customForm.name = this.value"
              class="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>
          <div class="space-y-1">
            <label class="font-mono text-slate-400 block font-bold">Duración (1 a 5 min):</label>
            <input 
              type="number" 
              min="1" 
              max="5" 
              id="custom-sorp-duration"
              value="${form.duration}"
              oninput="puntosState.sorpresasState.customForm.duration = Number(this.value)"
              class="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label class="font-mono text-slate-400 block font-bold">Descripción y criterio de evaluación:</label>
          <textarea 
            id="custom-sorp-desc"
            rows="2" 
            placeholder="Qué deben hacer los integrantes y cómo se evalúa..."
            oninput="puntosState.sorpresasState.customForm.description = this.value"
            class="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500 font-sans"
          >${form.description}</textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="font-mono text-slate-400 block font-bold">Cómo se decide el ganador:</label>
            <select 
              id="custom-sorp-type"
              onchange="puntosState.sorpresasState.customForm.decisionType = this.value; setSorpresasSubView('crear');"
              class="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs font-sans focus:outline-none focus:border-indigo-500"
            >
              <option value="jurado" ${form.decisionType === 'jurado' ? 'selected' : ''}>👨‍⚖️ Jurado de 3 (Suma de lugares)</option>
              <option value="medicion" ${form.decisionType === 'medicion' ? 'selected' : ''}>📊 Medición Cuantitativa</option>
            </select>
          </div>

          ${form.decisionType === 'medicion' ? `
            <div class="space-y-1">
              <label class="font-mono text-slate-400 block font-bold">Métrica a medir:</label>
              <input 
                type="text" 
                id="custom-sorp-metric"
                placeholder="Ej: Rondas ganadas, Ruidos o Segundos"
                value="${form.metricLabel}"
                oninput="puntosState.sorpresasState.customForm.metricLabel = this.value"
                class="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>
          ` : `
            <div class="space-y-1">
              <label class="font-mono text-slate-400 block font-bold">Material necesario:</label>
              <input 
                type="text" 
                id="custom-sorp-material"
                placeholder="Ej: Celular, cronómetro, parlante..."
                value="${form.material}"
                oninput="puntosState.sorpresasState.customForm.material = this.value"
                class="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>
          `}
        </div>

        <!-- PUNTOS POR LUGAR (TOPES REGLAMENTARIOS) -->
        <div class="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <label class="font-mono text-slate-400 block font-bold">Puntos por lugar (1° máx 500 y decreciente 1° > 2° > 3°):</label>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <span class="text-[10px] text-amber-400 font-mono block">1° Lugar:</span>
              <input 
                type="number" 
                max="500" 
                value="${form.p1}" 
                onchange="updateCustomP1(this.value)"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white font-mono text-xs text-center"
              />
            </div>
            <div>
              <span class="text-[10px] text-slate-400 font-mono block">2° Lugar (60%):</span>
              <input 
                type="number" 
                value="${form.p2}" 
                onchange="puntosState.sorpresasState.customForm.p2 = Number(this.value)"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white font-mono text-xs text-center"
              />
            </div>
            <div>
              <span class="text-[10px] text-amber-600 font-mono block">3° Lugar (30%):</span>
              <input 
                type="number" 
                value="${form.p3}" 
                onchange="puntosState.sorpresasState.customForm.p3 = Number(this.value)"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white font-mono text-xs text-center"
              />
            </div>
          </div>
        </div>

        <!-- CHECKLIST OBLIGATORIO DE CUIDADOS Y SEGURIDAD -->
        <div class="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/60 space-y-2.5">
          <div class="flex items-center gap-2 text-amber-400 font-bold font-mono text-xs">
            <i data-lucide="shield-alert" class="w-4 h-4"></i>
            <span>Lista de Comprobación de Seguridad Obligatoria</span>
          </div>
          <p class="text-[11px] text-slate-400">
            De acuerdo a las bases, debes validar todos los cuidados para habilitar el lanzamiento:
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-xs">
            <label class="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                ${ch.voluntaria ? 'checked' : ''} 
                onchange="toggleCustomChecklist('voluntaria')"
                class="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
              />
              <span>100% Voluntaria</span>
            </label>
            <label class="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                ${ch.sinRiesgo ? 'checked' : ''} 
                onchange="toggleCustomChecklist('sinRiesgo')"
                class="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
              />
              <span>Sin riesgo físico ni caídas</span>
            </label>
            <label class="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                ${ch.sinContacto ? 'checked' : ''} 
                onchange="toggleCustomChecklist('sinContacto')"
                class="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
              />
              <span>Sin contacto forzado</span>
            </label>
            <label class="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                ${ch.sinHumillacion ? 'checked' : ''} 
                onchange="toggleCustomChecklist('sinHumillacion')"
                class="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
              />
              <span>Sin humillación a nadie</span>
            </label>
          </div>
        </div>
      </div>

      <!-- BOTONES ACCIÓN FORMULARIO -->
      <div class="flex items-center justify-end gap-3 pt-2 border-t border-slate-900">
        ${currentUser?.role === 'admin' ? `
          <button 
            onclick="saveCustomSorpresaToBank()"
            class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 transition"
          >
            Guardar en Banco
          </button>
        ` : ''}
        <button 
          onclick="launchCustomSorpresa()"
          ${!allChecked ? 'disabled' : ''}
          class="px-6 py-2.5 text-xs font-bold font-heading rounded-xl shadow-lg transition flex items-center gap-2 ${allChecked ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 border border-amber-500 shadow-amber-600/20 cursor-pointer' : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-60'}"
        >
          <i data-lucide="play" class="w-4 h-4 fill-current"></i>
          <span>Lanzar Inmediatamente (1 min prep)</span>
        </button>
      </div>
    </div>
  `;
}

// Historial de Sorpresas Completadas
function renderSorpresasHistoryTable() {
  const completed = puntosState.sorpresasState.completedSorpresas || [];

  return `
    <div class="p-5 bg-slate-950 border border-slate-800 rounded-3xl space-y-4">
      <div class="flex items-center justify-between border-b border-slate-900 pb-3">
        <h4 class="font-bold font-heading text-white text-base">Historial Oficial de Pruebas Sorpresa Realizadas</h4>
        <span class="text-xs font-mono text-slate-400">${completed.length} registradas</span>
      </div>

      ${completed.length === 0 ? `
        <div class="py-12 text-center text-slate-500 text-xs font-mono">
          Aún no se ha completado ninguna prueba sorpresa oficial.
        </div>
      ` : `
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="text-[10px] font-mono uppercase text-slate-400 border-b border-slate-900 bg-slate-900/40">
              <tr>
                <th class="py-2.5 px-3">Prueba</th>
                <th class="py-2.5 px-3">Tipo</th>
                <th class="py-2.5 px-3 text-center text-red-400">Terror</th>
                <th class="py-2.5 px-3 text-center text-blue-400">Shooter</th>
                <th class="py-2.5 px-3 text-center text-emerald-400">Action</th>
                <th class="py-2.5 px-3 text-right">Registrado Por</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-900 font-mono">
              ${completed.map(s => `
                <tr class="hover:bg-slate-900/40 transition">
                  <td class="py-3 px-3 font-bold text-white">${s.name}</td>
                  <td class="py-3 px-3 text-slate-400 uppercase text-[10px]">${s.decisionType || 'Jurado'}</td>
                  <td class="py-3 px-3 text-center font-bold text-red-400">+${s.pointsAwarded?.Terror || 0} pts</td>
                  <td class="py-3 px-3 text-center font-bold text-blue-400">+${s.pointsAwarded?.Shooter || 0} pts</td>
                  <td class="py-3 px-3 text-center font-bold text-emerald-400">+${s.pointsAwarded?.Action || 0} pts</td>
                  <td class="py-3 px-3 text-right text-[10px] text-slate-500">
                    <span>${s.loggedBy || 'Staff'}</span> • <span>${new Date(s.timestamp).toLocaleTimeString('es-CL')}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

// -------------------------------------------------------------------------
// CONTROLADORES Y ACCIONES DE PRUEBAS SORPRESA
// -------------------------------------------------------------------------

function setSorpresasSubView(view) {
  puntosState.sorpresasState.activeSubView = view;
  if (view === 'banco' && (!puntosState.sorpresasState.bank || puntosState.sorpresasState.bank.length === 0)) {
    loadSorpresasBankData().then(() => renderPuntosSubTab());
  }
  renderPuntosSubTab();
}

function updateJudgePlace(judgeKey, alliance, place) {
  puntosState.sorpresasState.judges[judgeKey][alliance] = place;
  renderPuntosSubTab();
}

function updateMetricValue(alliance, delta) {
  const current = Number(puntosState.sorpresasState.metrics[alliance] || 0);
  puntosState.sorpresasState.metrics[alliance] = Math.max(0, current + delta);
  renderPuntosSubTab();
}

function updateCustomP1(val) {
  const p1 = Math.min(500, Math.max(100, Number(val)));
  puntosState.sorpresasState.customForm.p1 = p1;
  puntosState.sorpresasState.customForm.p2 = Math.round(p1 * 0.6);
  puntosState.sorpresasState.customForm.p3 = Math.round(p1 * 0.3);
  renderPuntosSubTab();
}

function toggleCustomChecklist(item) {
  const ch = puntosState.sorpresasState.customForm.checklist;
  ch[item] = !ch[item];
  renderPuntosSubTab();
}

function startSorpresaCountdown() {
  if (sorpresaCountdownTimer) clearInterval(sorpresaCountdownTimer);

  function tick() {
    const sorp = puntosState.sorpresasState.activeSorpresa;
    const display = document.getElementById('sorpresa-countdown-display');
    const status = document.getElementById('sorpresa-countdown-status');
    if (!sorp || !sorp.prepEndsAt) {
      if (sorpresaCountdownTimer) clearInterval(sorpresaCountdownTimer);
      return;
    }

    const diff = new Date(sorp.prepEndsAt).getTime() - Date.now();
    if (diff <= 0) {
      if (display) {
        display.textContent = '00:00';
        display.className = 'text-3xl font-mono font-bold text-emerald-400 block my-0.5 animate-pulse';
      }
      if (status) {
        status.textContent = '¡Tiempo cumplido! En ejecución';
        status.className = 'text-[10px] font-mono text-emerald-400 font-bold';
      }
    } else {
      const sec = Math.ceil(diff / 1000);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      if (display) display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  }

  tick();
  sorpresaCountdownTimer = setInterval(tick, 1000);
}

// Lanzar prueba desde el banco
async function launchSorpresaFromBank(sorpId) {
  try {
    const res = await fetch('/api/admin/sorpresas/launch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        sorpresaId: sorpId,
        loggedBy: currentUser?.name || 'Staff'
      })
    });

    const data = await res.json();
    if (res.ok) {
      showPuntosToast('🚀 ¡Prueba Sorpresa lanzada! Cuenta de 1 min activada en pantalla.', false);
      puntosState.sorpresasState.activeSorpresa = data.activeSorpresa;
      await loadStats();
      renderPuntosSubTab();
    } else {
      showPuntosToast(`⚠️ ${data.error}`, true);
    }
  } catch (err) {
    showPuntosToast('Error al lanzar prueba sorpresa', true);
  }
}

// Lanzar prueba creada en el momento
async function launchCustomSorpresa() {
  const form = puntosState.sorpresasState.customForm;
  if (!form.name || !form.name.trim()) {
    alert('Ingresa el nombre de la prueba.');
    return;
  }

  try {
    const res = await fetch('/api/admin/sorpresas/launch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        customSorpresa: {
          name: form.name,
          description: form.description,
          duration: form.duration,
          decisionType: form.decisionType,
          metricLabel: form.metricLabel,
          metricDirection: form.metricDirection,
          material: form.material,
          careNotes: 'Verificada con lista de cuidados oficial',
          pointsDistribution: [form.p1, form.p2, form.p3],
          checklist: form.checklist
        },
        loggedBy: currentUser?.name || 'Staff'
      })
    });

    const data = await res.json();
    if (res.ok) {
      showPuntosToast('🚀 ¡Prueba Sorpresa en caliente lanzada con éxito!', false);
      puntosState.sorpresasState.activeSorpresa = data.activeSorpresa;
      await loadStats();
      renderPuntosSubTab();
    } else {
      showPuntosToast(`⚠️ ${data.error}`, true);
    }
  } catch (err) {
    showPuntosToast('Error al lanzar prueba', true);
  }
}

// Guardar prueba propia en el banco
async function saveCustomSorpresaToBank() {
  const form = puntosState.sorpresasState.customForm;
  if (!form.name || !form.name.trim()) {
    alert('Ingresa el nombre de la prueba.');
    return;
  }

  try {
    const res = await fetch('/api/admin/sorpresas/bank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        duration: form.duration,
        decisionType: form.decisionType,
        metricLabel: form.metricLabel,
        metricDirection: form.metricDirection,
        material: form.material,
        careNotes: 'Verificada con lista de cuidados oficial',
        pointsDistribution: [form.p1, form.p2, form.p3],
        checklist: form.checklist,
        isReserve: false
      })
    });

    const data = await res.json();
    if (res.ok) {
      showPuntosToast('✓ Prueba guardada en el Banco Oficial.', false);
      await loadSorpresasBankData();
      setSorpresasSubView('banco');
    } else {
      showPuntosToast(`⚠️ ${data.error}`, true);
    }
  } catch (err) {
    showPuntosToast('Error al guardar en el banco', true);
  }
}

// Cancelar prueba activa
async function cancelActiveSorpresa() {
  if (!confirm('¿Estás seguro de cancelar la prueba sorpresa activa? Se quitará de la pantalla y el aviso público.')) {
    return;
  }

  try {
    const res = await fetch('/api/admin/sorpresas/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        loggedBy: currentUser?.name || 'Staff',
        reason: 'Cancelación solicitada por operador'
      })
    });

    if (res.ok) {
      showPuntosToast('Prueba sorpresa cancelada.', false);
      puntosState.sorpresasState.activeSorpresa = null;
      await loadStats();
      renderPuntosSubTab();
    }
  } catch (err) {
    showPuntosToast('Error al cancelar prueba', true);
  }
}

// Registrar resultado final y sumar puntos al marcador
async function recordActiveSorpresaResult() {
  const sorp = puntosState.sorpresasState.activeSorpresa;
  if (!sorp) return;

  const preview = calculateActiveSorpresaPreview();
  const btn = document.getElementById('btn-confirm-sorpresa');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Registrando...';
    lucide.createIcons();
  }

  try {
    const res = await fetch('/api/admin/sorpresas/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        details: {
          judges: sorp.decisionType === 'jurado' ? puntosState.sorpresasState.judges : null,
          metrics: sorp.decisionType === 'medicion' ? puntosState.sorpresasState.metrics : null
        },
        loggedBy: currentUser?.name || 'Staff'
      })
    });

    const data = await res.json();
    if (res.ok) {
      showPuntosToast(`✓ Resultados de "${sorp.name}" registrados. Puntos sumados al marcador.`, false);
      puntosState.sorpresasState.activeSorpresa = null;
      await loadSorpresasBankData();
      await loadStats();
      renderPuntosSubTab();
    } else {
      showPuntosToast(`⚠️ ${data.error}`, true);
    }
  } catch (err) {
    showPuntosToast('Error al registrar resultado de la prueba', true);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="check-circle-2" class="w-4 h-4"></i><span>Confirmar y Sumar Puntos al Marcador</span>';
      lucide.createIcons();
    }
  }
}



function filterMobileAllianceCols(alliance) {
  const cols = {
    Terror: document.getElementById('col-alliance-terror'),
    Shooter: document.getElementById('col-alliance-shooter'),
    Action: document.getElementById('col-alliance-action')
  };
  const btns = {
    all: document.getElementById('tab-al-col-all'),
    Terror: document.getElementById('tab-al-col-Terror'),
    Shooter: document.getElementById('tab-al-col-Shooter'),
    Action: document.getElementById('tab-al-col-Action')
  };

  Object.keys(cols).forEach(k => {
    if (!cols[k]) return;
    if (alliance === 'all' || alliance === k) {
      cols[k].classList.remove('hidden');
    } else {
      cols[k].classList.add('hidden');
    }
  });

  Object.keys(btns).forEach(k => {
    if (!btns[k]) return;
    if (k === alliance) {
      btns[k].className = 'px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition bg-slate-800 text-white border border-slate-700 shadow-sm';
    } else {
      btns[k].className = 'px-3 py-1.5 rounded-lg text-xs font-mono transition text-slate-400 hover:text-white border border-transparent';
    }
  });
}
