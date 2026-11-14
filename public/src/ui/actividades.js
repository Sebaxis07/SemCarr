// Generador del catalogo de actividades en cancha y filtros
import { appData, getCurrentActFilter } from '../estado/estado.js';

export function renderActividades() {
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

  const currentActFilter = getCurrentActFilter();
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