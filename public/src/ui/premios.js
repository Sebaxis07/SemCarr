// Generador de la vista de premios oficiales y cuadro de honor
import { appData } from '../estado/estado.js';

export function renderPremios() {
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