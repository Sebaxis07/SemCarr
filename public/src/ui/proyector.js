// Generador de la vista de pantalla grande para modo proyector en vivo
import { appData, proyectorState } from '../estado/estado.js';

export function renderBigScreen() {
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