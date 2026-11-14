// Generador de la vista de alianzas, nominas oficiales y fichas de competidores
import { appData, getAllStudentsByAlliance, getCurrentAllianceFilter } from '../estado/estado.js';
import { loadAllStudentsByAlliance } from '../logica/estudiantes.js';

export function renderMiAlianza() {
  // Asegurar carga de estudiantes si no están en memoria
  if (!getAllStudentsByAlliance()) {
    loadAllStudentsByAlliance().then(() => {
      renderAlliancesRoster();
    });
  }

  const rosterData = getAllStudentsByAlliance() || {};
  const terrorCount = rosterData.Terror?.length || 0;
  const shooterCount = rosterData.Shooter?.length || 0;
  const actionCount = rosterData.Action?.length || 0;
  const totalCount = terrorCount + shooterCount + actionCount;
  const totalLabel = totalCount > 0 ? `${totalCount} Estudiantes Registrados` : 'Estudiantes Registrados';
  const terrorLabel = terrorCount > 0 ? `${terrorCount} Alumnos` : 'En Registro';
  const shooterLabel = shooterCount > 0 ? `${shooterCount} Alumnos` : 'En Registro';
  const actionLabel = actionCount > 0 ? `${actionCount} Alumnos` : 'En Registro';

  return `
    <div class="max-w-6xl mx-auto space-y-8">
      
      <!-- ======================================================== -->
      <!-- 1. HEADER SYNTH-TECH / ESPORTS: MI ALIANZA               -->
      <!-- ======================================================== -->
      <div class="text-center space-y-2 relative">
        <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0A1333] border border-[#2D46B9] shadow-inner text-[11px] font-display font-bold uppercase tracking-wider text-[#7F9CF5]">
          <span class="w-2 h-2 rounded-full bg-[#E6194B] animate-pulse"></span>
          <span>Padrón Oficial • ${totalLabel}</span>
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
                ${terrorLabel}
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
                ${shooterLabel}
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
                ${actionLabel}
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
              class="alliance-filter-btn px-4 py-2 rounded-xl text-xs font-bold ${getCurrentAllianceFilter() === 'all' ? 'bg-[#2D46B9] text-white shadow-lg shadow-[#2D46B9]/40 border border-white/30' : 'text-slate-300 hover:text-white bg-[#0A1333] border border-[#142252]'} transition"
            >
              Todas (${totalCount})
            </button>
            <button 
              onclick="setAllianceFilter('Terror')" 
              id="filter-btn-Terror" 
              class="alliance-filter-btn px-4 py-2 rounded-xl text-xs font-bold ${getCurrentAllianceFilter() === 'Terror' ? 'bg-[#E6194B] text-white shadow-lg shadow-[#E6194B]/40 border border-white/30' : 'text-slate-300 hover:text-white bg-[#0A1333] border border-[#142252]'} transition flex items-center gap-1.5"
            >
              <span class="w-2 h-2 rounded-full bg-white"></span>
              <span>Terror (${terrorCount})</span>
            </button>
            <button 
              onclick="setAllianceFilter('Shooter')" 
              id="filter-btn-Shooter" 
              class="alliance-filter-btn px-4 py-2 rounded-xl text-xs font-bold ${getCurrentAllianceFilter() === 'Shooter' ? 'bg-[#2D46B9] text-white shadow-lg shadow-[#2D46B9]/40 border border-white/30' : 'text-slate-300 hover:text-white bg-[#0A1333] border border-[#142252]'} transition flex items-center gap-1.5"
            >
              <span class="w-2 h-2 rounded-full bg-white"></span>
              <span>Shooter (${shooterCount})</span>
            </button>
            <button 
              onclick="setAllianceFilter('Action')" 
              id="filter-btn-Action" 
              class="alliance-filter-btn px-4 py-2 rounded-xl text-xs font-bold ${getCurrentAllianceFilter() === 'Action' ? 'bg-[#059669] text-white shadow-lg shadow-[#059669]/40 border border-white/30' : 'text-slate-300 hover:text-white bg-[#0A1333] border border-[#142252]'} transition flex items-center gap-1.5"
            >
              <span class="w-2 h-2 rounded-full bg-white"></span>
              <span>Action (${actionCount})</span>
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
  getCurrentAllianceFilter() = filter;
  renderAlliancesRoster();
}

export function renderAlliancesRoster() {
  const container = document.getElementById('all-alliances-roster-box');
  if (container) {
    container.innerHTML = renderAlliancesRosterContent();
    lucide.createIcons();
  }

  // Actualizar estilos de los botones de filtro
  document.querySelectorAll('.alliance-filter-btn').forEach(btn => {
    btn.className = 'alliance-filter-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-[#0A1333] border border-[#142252] transition';
  });

  const activeBtn = document.getElementById(`filter-btn-${getCurrentAllianceFilter()}`);
  if (activeBtn) {
    if (getCurrentAllianceFilter() === 'all') {
      activeBtn.className = 'alliance-filter-btn px-4 py-2 rounded-xl text-xs font-bold bg-[#2D46B9] text-white shadow-lg shadow-[#2D46B9]/40 border border-white/30 transition';
    } else if (getCurrentAllianceFilter() === 'Terror') {
      activeBtn.className = 'alliance-filter-btn px-4 py-2 rounded-xl text-xs font-bold bg-[#E6194B] text-white shadow-lg shadow-[#E6194B]/40 border border-white/30 transition flex items-center gap-1.5';
    } else if (getCurrentAllianceFilter() === 'Shooter') {
      activeBtn.className = 'alliance-filter-btn px-4 py-2 rounded-xl text-xs font-bold bg-[#2D46B9] text-white shadow-lg shadow-[#2D46B9]/40 border border-white/30 transition flex items-center gap-1.5';
    } else if (getCurrentAllianceFilter() === 'Action') {
      activeBtn.className = 'alliance-filter-btn px-4 py-2 rounded-xl text-xs font-bold bg-[#059669] text-white shadow-lg shadow-[#059669]/40 border border-white/30 transition flex items-center gap-1.5';
    }
  }
}

export function renderAlliancesRosterContent() {
  if (!getAllStudentsByAlliance()) {
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
      total: (getAllStudentsByAlliance() && getAllStudentsByAlliance().Terror?.length) || 0
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
      total: (getAllStudentsByAlliance() && getAllStudentsByAlliance().Shooter?.length) || 0
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
      total: (getAllStudentsByAlliance() && getAllStudentsByAlliance().Action?.length) || 0
    }
  };

  // Si se seleccionó una sola alianza, mostrar vista expandida de esa alianza con la mascota PNG
  if (getCurrentAllianceFilter() !== 'all') {
    const alKey = getCurrentAllianceFilter();
    const info = alInfo[alKey];
    const list = getAllStudentsByAlliance()[alKey] || [];
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
        const list = getAllStudentsByAlliance()[alKey] || [];
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