// Generador de la vista de inicio y resumen de actividades
import { appData } from '../estado/estado.js';
import { getActivityPodium } from '../utils/podio.js';

export function renderInicio() {
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