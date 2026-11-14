// Ventanas modales informativas con reglamentos detallados y rubricadas
import { appData } from '../estado/estado.js';
import { getActivityPodium } from '../utils/podio.js';

export function openActivityDetail(id) {
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

export function openCreativeDetail() {
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