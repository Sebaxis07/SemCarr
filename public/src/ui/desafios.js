// Generador de la vista de desafios creativos con inteligencia artificial
import { appData } from '../estado/estado.js';

export function renderDesafios() {
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
      desc: 'Desarrollo de un prototipo interactivo o experiencia jugable que combine mecánicas clásicas de supervivencia con narrativa generada o enriquecida por IA.',
      docente: 'Prof. Eduardo (Evaluación)',
      statusKey: 'Terror',
      rubricList: rubrics.Terror || [
        { label: 'Uso de IA y creatividad técnica', points: 30 },
        { label: 'Jugabilidad y coherencia temática de terror', points: 30 },
        { label: 'Presentación y documentación', points: 40 }
      ]
    },
    {
      key: 'Shooter',
      alliance: 'Shooter',
      color: 'border-blue-900/40',
      dot: 'bg-blue-500',
      text: 'text-blue-400',
      title: 'Asistente Virtual con IA para Estudiantes',
      carrera: 'Telecomunicaciones y Conectividad',
      desc: 'Creación de un chatbot o asistente inteligente que resuelva dudas de la sede, horarios o consultas de redes de datos.',
      docente: 'Prof. Eduardo (Evaluación)',
      statusKey: 'Shooter',
      rubricList: rubrics.Shooter || [
        { label: 'Arquitectura técnica e integración IA', points: 35 },
        { label: 'Utilidad real y experiencia de usuario', points: 35 },
        { label: 'Prueba funcional en vivo', points: 30 }
      ]
    },
    {
      key: 'Action',
      alliance: 'Action',
      color: 'border-emerald-900/40',
      dot: 'bg-emerald-500',
      text: 'text-emerald-400',
      title: 'Identidad Visual & Collage Digital con IA',
      carrera: 'Diseño e Industria Digital',
      desc: 'Pieza gráfica de alto impacto que represente la energía de los videojuegos de acción, combinando arte vectorial y generación visual por IA.',
      docente: 'Prof. Natalia (Evaluación)',
      statusKey: 'Action',
      rubricList: rubrics.Action || [
        { label: 'Composición y estética visual', points: 35 },
        { label: 'Integración ética y técnica de herramientas IA', points: 35 },
        { label: 'Originalidad y concepto de alianza', points: 30 }
      ]
    }
  ];

  return `
    <div class="space-y-8 max-w-5xl mx-auto">
      
      <!-- ENCABEZADO -->
      <div class="border-b border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="text-xs font-mono uppercase tracking-wider text-slate-500">Reglamento 2026 • Evaluación Docente</span>
          <h2 class="text-3xl font-extrabold font-heading text-white tracking-tight mt-1">Desafíos Creativos con IA</h2>
          <p class="text-sm text-slate-400 mt-1">
            Cada alianza asegura <strong>4.000 puntos reglamentarios</strong> al entregar su obra. La evaluación docente define la <strong>Mención de Honor</strong> como distinción especial.
          </p>
        </div>
        <button 
          onclick="openCreativeDetail()"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-700 transition"
        >
          <i data-lucide="info" class="w-4 h-4 text-indigo-400"></i>
          <span>Detalle de entregas</span>
        </button>
      </div>

      <!-- BANNER DE MENCIÓN DE HONOR DOCENTE -->
      <div class="bg-gradient-to-r from-indigo-950/40 via-slate-950 to-slate-950 border border-indigo-900/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center shrink-0">
            <i data-lucide="award" class="w-5 h-5 text-indigo-400"></i>
          </div>
          <div>
            <span class="text-[11px] font-mono uppercase text-indigo-400 block font-semibold">Distinción Especial Docente</span>
            <span class="text-base font-bold text-white font-heading">
              ${fav ? `Mención de Honor: Alianza ${fav}` : 'Mención de Honor en Proceso de Evaluación'}
            </span>
            <span class="text-xs text-slate-400 block">
              ${fav ? 'Reconocimiento a la excelencia técnica e impacto creativo (sin alteración de puntaje reglamentario).' : 'Los docentes evaluadores están revisando las entregas técnicas de cada carrera.'}
            </span>
          </div>
        </div>
        ${fav ? `
          <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-900/60 border border-indigo-700 text-indigo-300 shrink-0">
            ★ Mención Ratificada
          </span>
        ` : `
          <span class="px-3 py-1 rounded-full text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 shrink-0">
            En deliberación
          </span>
        `}
      </div>

      <!-- TARJETAS DE DESAFÍOS POR ALIANZA -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        ${challenges.map(c => {
          const st = status[c.statusKey] || {};
          const isDelivered = (st.delivered === true || st === 'Entregado');
          const isPendingReview = (st.status === 'review_pending' || st.reviewPending);
          const hasHonor = fav === c.alliance;

          return `
            <div class="bg-slate-950 border ${c.color} rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full ${c.dot}"></span>
                    <span class="text-xs font-mono font-bold uppercase tracking-wider ${c.text}">
                      Alianza ${c.alliance}
                    </span>
                  </div>
                  <span class="text-xs font-mono font-bold ${isDelivered ? 'text-emerald-400' : 'text-slate-500'}">
                    ${isDelivered ? '4.000 pts' : '4.000 pts máx'}
                  </span>
                </div>

                <h3 class="text-lg font-bold font-heading text-white leading-snug">
                  ${c.title}
                </h3>
                
                <span class="text-xs text-slate-400 font-mono block">
                  ${c.carrera}
                </span>

                <p class="text-xs text-slate-300 leading-relaxed">
                  ${c.desc}
                </p>

                <!-- ESTADO DE ENTREGA -->
                <div class="pt-2">
                  <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span class="text-slate-400">Estado:</span>
                    ${isDelivered ? `
                      <span class="text-emerald-400 font-bold flex items-center gap-1">
                        <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
                        Entregado (4.000 pts)
                      </span>
                    ` : (isPendingReview ? `
                      <span class="text-amber-400 font-bold flex items-center gap-1">
                        <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                        Revisión Pendiente
                      </span>
                    ` : `
                      <span class="text-slate-400 flex items-center gap-1">
                        <i data-lucide="circle-dashed" class="w-3.5 h-3.5"></i>
                        En desarrollo
                      </span>
                    `)}
                  </div>
                </div>

                ${hasHonor ? `
                  <div class="p-2 rounded-xl bg-indigo-950/60 border border-indigo-800/80 text-xs font-mono text-indigo-300 flex items-center gap-2">
                    <i data-lucide="award" class="w-4 h-4 text-indigo-400 shrink-0"></i>
                    <span>Mención de Honor Docente</span>
                  </div>
                ` : ''}

                <!-- RÚBRICA Y DOCENTE -->
                <div class="border-t border-slate-900 pt-3 space-y-2">
                  <span class="text-[10px] font-mono uppercase text-slate-500 block">Rúbrica de Evaluación Docente:</span>
                  <div class="space-y-1.5">
                    ${c.rubricList.map(r => `
                      <div class="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span class="truncate pr-2">• ${r.label}</span>
                        <span class="text-slate-300 shrink-0">${r.points} pts</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>

              <div class="border-t border-slate-900 pt-3 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Evaluador: ${c.docente}</span>
                <span class="text-slate-400">Puntaje por entrega</span>
              </div>

            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;
}
