// Logica de busqueda de alumnos, autocompletado y carga de nominas
import { 
  appData, 
  getAllStudentsByAlliance, 
  setAllStudentsByAlliance, 
  getStudentSearchDebounce, 
  setStudentSearchDebounce 
} from '../estado/estado.js';

export async function loadAllStudentsByAlliance() {
  let allStudentsByAlliance = getAllStudentsByAlliance();
  if (allStudentsByAlliance) return allStudentsByAlliance;

  try {
    const res = await fetch('/api/students/by-alliance');
    if (res.ok) {
      allStudentsByAlliance = await res.json();
      setAllStudentsByAlliance(allStudentsByAlliance);
    }
  } catch (err) {
    console.error('Error cargando estudiantes por alianza:', err);
  }
  return allStudentsByAlliance;
}

export function selectStudentForSearch(name) {
  const input = document.getElementById('student-search-input');
  if (input) {
    input.value = name;
    handleStudentSearch(name);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }
}

export function clearStudentSearch() {
  const input = document.getElementById('student-search-input');
  if (input) input.value = '';
  handleStudentSearch('');
}

export function handleStudentSearch(val) {
  let studentSearchDebounce = getStudentSearchDebounce();
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
        const roster = getAllStudentsByAlliance() || {};
        const totalAlumnos = roster[s.alliance]?.length || 0;
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
  setStudentSearchDebounce(studentSearchDebounce);
}
