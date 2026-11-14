// Generador de la vista de reglas del evento y calculo de puntajes
export function renderReglas() {
  return `
    <div class="space-y-6 max-w-4xl mx-auto select-none">
      
      <!-- HEADER MINIMALISTA -->
      <div class="border-b border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span class="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
            Reglamento Oficial • Explicación en 1 minuto
          </span>
          <h2 class="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">
            Cómo se ganan los puntos
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Estructura transparente del sistema de puntuación para leer rápido desde el celular.
          </p>
        </div>
        <button 
          onclick="navigate('inicio')" 
          class="self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5"
        >
          <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
          <span>Volver</span>
        </button>
      </div>

      <!-- 1. LA IDEA EN UNA FRASE (ARRIBA, GRANDE) -->
      <div class="bg-slate-950 border border-slate-900 rounded-2xl p-5 sm:p-6 text-center shadow-sm">
        <span class="text-[10px] font-mono uppercase tracking-widest text-slate-500 block mb-2">
          Principio General
        </span>
        <h3 class="text-lg sm:text-2xl font-bold font-heading text-white tracking-tight leading-snug max-w-2xl mx-auto">
          “Cada actividad entrega puntos a tu alianza. La alianza con más puntos al final gana el premio.”
        </h3>
      </div>

      <!-- 2. LOS NÚMEROS CLAVE (TARJETAS) -->
      <div>
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-2">
          Números Clave
        </span>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div class="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span class="text-[10px] font-mono text-slate-500 uppercase block">Máximo Día 19</span>
              <span class="text-2xl font-mono font-bold text-white mt-1 block">25.000 pts</span>
            </div>
            <span class="text-[11px] text-slate-400 mt-2 block leading-relaxed">
              Tope acumulable por alianza en las actividades de cancha y salón del jueves 19.
            </span>
          </div>

          <div class="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span class="text-[10px] font-mono text-slate-500 uppercase block">Extras</span>
              <span class="text-2xl font-mono font-bold text-white mt-1 block">+7.000 pts</span>
            </div>
            <span class="text-[11px] text-slate-400 mt-2 block leading-relaxed">
              Hasta 3.000 por actividades sorpresa y hasta 4.000 por la Copa Tarreo del viernes.
            </span>
          </div>

          <div class="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span class="text-[10px] font-mono text-slate-500 uppercase block">Premios Académicos</span>
              <div class="mt-1 space-y-1 font-mono text-xs">
                <div class="flex justify-between items-center"><span class="text-slate-300 font-medium">1ª Alianza:</span><span class="text-white font-bold">+1,0 nota</span></div>
                <div class="flex justify-between items-center"><span class="text-slate-400">2ª Alianza:</span><span class="text-slate-300 font-bold">+0,5 nota</span></div>
                <div class="flex justify-between items-center"><span class="text-slate-500">3ª Alianza:</span><span class="text-slate-400 font-bold">+0,3 nota</span></div>
              </div>
            </div>
            <span class="text-[10px] text-slate-500 mt-2 block font-mono">Puntos directos a la nota final.</span>
          </div>

        </div>
      </div>

      <!-- 3. LOS CUATRO TIPOS DE ACTIVIDAD -->
      <div class="space-y-2.5">
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
          Los Cuatro Tipos de Actividad
        </span>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          <!-- Tipo 1 -->
          <div class="bg-[#0A1333] border-2 border-[#142252] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#E6194B]"></span>
                <h4 class="font-bold text-white text-xs uppercase font-display">1. Por Lugar (Competencias Directas)</h4>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed">
                La alianza que queda 1ª se lleva el <strong>100%</strong> de los puntos, la 2ª el <strong>60%</strong> y la 3ª el <strong>30%</strong>.
              </p>
              <div class="mt-3 p-2.5 rounded-xl bg-[#050C24] border border-[#142252] text-[11px] font-mono text-slate-300 space-y-1">
                <span class="text-[#7F9CF5] block text-[10px] font-bold">Ejemplo Baby fútbol o Torneo Retro (Vale 4.000):</span>
                <div class="flex justify-between"><span>🥇 1ª Alianza:</span><strong class="text-white">4.000 pts (100%)</strong></div>
                <div class="flex justify-between"><span>🥈 2ª Alianza:</span><strong class="text-slate-300">2.400 pts (60%)</strong></div>
                <div class="flex justify-between"><span>🥉 3ª Alianza:</span><strong class="text-slate-400">1.200 pts (30%)</strong></div>
              </div>
            </div>
            <span class="text-[10px] font-mono text-slate-400 mt-2.5 block">Baby fútbol, Quemadas, Torneo retro, Taca-taca, Ping pong, Si te la sabes canta.</span>
          </div>

          <!-- Tipo 2 -->
          <div class="bg-[#0A1333] border-2 border-[#142252] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#2D46B9]"></span>
                <h4 class="font-bold text-white text-xs uppercase font-display">2. Por Promedio (Gymkanas)</h4>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed">
                Cada persona suma hasta <strong>6 puntos</strong>: 1 por intentar cada puesto y 1 por resolverlo (3 puestos de alternativas A, B, C y D).
              </p>
              <div class="mt-3 p-2.5 rounded-xl bg-[#050C24] border border-[#142252] text-[11px] font-mono text-slate-300 space-y-1">
                <span class="text-[#7F9CF5] block text-[10px] font-bold">Fórmula Oficial (Bases v2.3):</span>
                <div class="text-white font-bold text-xs">4.000 × (Promedio ÷ 6)</div>
                <div class="text-slate-400 text-[10px]">Ejemplo: Si el promedio es 4,5 de 6, la alianza recibe 3.000 pts.</div>
              </div>
            </div>
            <span class="text-[10px] font-mono text-slate-400 mt-2.5 block">No hay 1°, 2° ni 3° lugar: todas las alianzas suman según su rendimiento.</span>
          </div>

          <!-- Tipo 3 -->
          <div class="bg-[#0A1333] border-2 border-[#142252] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <h4 class="font-bold text-white text-xs uppercase font-display">3. Desafíos Creativos con IA</h4>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed">
                <strong>4.000 puntos</strong> para la alianza solo por llevar y entregar su obra única dentro del plazo reglamentario:
              </p>
              <div class="mt-3 p-2.5 rounded-xl bg-[#050C24] border border-[#142252] text-[11px] font-mono text-slate-300 space-y-1">
                <div><strong class="text-emerald-400">4.000 pts:</strong> Entrega a tiempo (hasta 10:15) y cumplimiento mínimo.</div>
                <div><strong class="text-[#7F9CF5]">Presentación Cancha:</strong> 13:15 a 14:15 hrs con 1 persona por alianza.</div>
                <div><strong class="text-amber-400">Mención de Honor:</strong> Mejor nota docente sobre 100 pts (sin puntos extra).</div>
              </div>
            </div>
            <span class="text-[10px] font-mono text-slate-400 mt-2.5 block">Una sola obra por alianza; evaluación técnica de dos docentes.</span>
          </div>

          <!-- Tipo 4 -->
          <div class="bg-[#0A1333] border-2 border-[#142252] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h4 class="font-bold text-white text-xs uppercase font-display">4. Sorpresa y Copa Tarreo</h4>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed">
                Actividades especiales que se anuncian durante la jornada y competencias nocturnas:
              </p>
              <div class="mt-3 p-2.5 rounded-xl bg-[#050C24] border border-[#142252] text-[11px] font-mono text-slate-300 space-y-1">
                <div><strong class="text-amber-400">Sorpresas en Cancha:</strong> Hasta 3.000 pts adicionales.</div>
                <div><strong class="text-[#7F9CF5]">Copa Tarreo (Viernes):</strong> Cazatesoros (1.500), Just Dance (1.500) y Mímica (1.000) = hasta 4.000 pts.</div>
              </div>
            </div>
            <span class="text-[10px] font-mono text-slate-400 mt-2.5 block">Los torneos individuales del tarreo tienen premios propios y no suman alianzas.</span>
          </div>

        </div>
      </div>

      <!-- 4. QUÉ PASA SI HAY EMPATE -->
      <div class="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-2.5">
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
          4. ¿Qué pasa si hay empate?
        </span>
        <p class="text-xs text-slate-300 leading-relaxed">
          Si dos alianzas empatan en el 1º lugar, se suman los porcentajes de los dos puestos y se reparten en partes iguales:
        </p>

        <div class="p-3 bg-slate-900/60 border border-slate-900 rounded-lg text-xs font-mono text-center">
          <span class="text-slate-400 text-[11px] block mb-1">Cálculo: (100% + 60%) ÷ 2</span>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
            <div class="bg-slate-950 p-2 rounded border border-slate-800">
              <span class="text-slate-400 block">Alianza A (Empatada)</span>
              <strong class="text-white text-sm">80%</strong>
              <span class="text-slate-500 block text-[10px]">(ej: 3.200 pts)</span>
            </div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800">
              <span class="text-slate-400 block">Alianza B (Empatada)</span>
              <strong class="text-white text-sm">80%</strong>
              <span class="text-slate-500 block text-[10px]">(ej: 3.200 pts)</span>
            </div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800">
              <span class="text-slate-400 block">Tercera Alianza (3°)</span>
              <strong class="text-slate-300 text-sm">30%</strong>
              <span class="text-slate-500 block text-[10px]">(ej: 1.200 pts)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. QUÉ RESTA PUNTOS -->
      <div class="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-1.5">
        <span class="text-[10px] font-mono uppercase tracking-wider text-red-400 block">
          5. ¿Qué resta puntos? (Sanciones)
        </span>
        <p class="text-xs text-slate-300 leading-relaxed">
          Las sanciones por faltas de respeto o conducta antideportiva descuentan entre <strong>200 y 600 puntos</strong> del total general. Se anotan con motivo y firma en el registro oficial.
        </p>
      </div>

      <!-- 6. UN EJEMPLO COMPLETO -->
      <div class="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500">
            6. Un Ejemplo Completo
          </span>
          <span class="text-[10px] font-mono text-slate-600 uppercase">Valores simulados</span>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-mono">
            <thead class="border-b border-slate-900 text-slate-500 text-[10px] uppercase">
              <tr>
                <th class="py-1.5 px-2">Actividad</th>
                <th class="py-1.5 px-2 text-center text-red-400">Terror</th>
                <th class="py-1.5 px-2 text-center text-blue-400">Shooter</th>
                <th class="py-1.5 px-2 text-center text-emerald-400">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-900/60 text-slate-300">
              <tr>
                <td class="py-1.5 px-2 font-sans text-slate-400">Baby fútbol (4.000)</td>
                <td class="py-1.5 px-2 text-center font-bold text-white">4.000</td>
                <td class="py-1.5 px-2 text-center">2.400</td>
                <td class="py-1.5 px-2 text-center">1.200</td>
              </tr>
              <tr>
                <td class="py-1.5 px-2 font-sans text-slate-400">Gymkanas (3.000)</td>
                <td class="py-1.5 px-2 text-center">2.250</td>
                <td class="py-1.5 px-2 text-center font-bold text-white">2.625</td>
                <td class="py-1.5 px-2 text-center">1.500</td>
              </tr>
              <tr>
                <td class="py-1.5 px-2 font-sans text-slate-400">Desafíos IA (4.000)</td>
                <td class="py-1.5 px-2 text-center">3.500</td>
                <td class="py-1.5 px-2 text-center">3.100</td>
                <td class="py-1.5 px-2 text-center font-bold text-white">3.900</td>
              </tr>
              <tr class="text-red-400/90">
                <td class="py-1.5 px-2 font-sans">Sanción en cancha</td>
                <td class="py-1.5 px-2 text-center text-slate-600">0</td>
                <td class="py-1.5 px-2 text-center font-bold">-300</td>
                <td class="py-1.5 px-2 text-center text-slate-600">0</td>
              </tr>
              <tr class="border-t border-slate-800 font-bold text-white bg-slate-900/30">
                <td class="py-2 px-2 uppercase font-sans text-slate-300">Total</td>
                <td class="py-2 px-2 text-center text-white">9.750</td>
                <td class="py-2 px-2 text-center text-white">7.825</td>
                <td class="py-2 px-2 text-center text-white">6.600</td>
              </tr>
              <tr class="text-[11px] text-slate-400 bg-slate-900/50">
                <td class="py-1 px-2 font-sans">Posición ejemplo:</td>
                <td class="py-1 px-2 text-center font-bold text-slate-200">1° Lugar</td>
                <td class="py-1 px-2 text-center font-bold text-slate-300">2° Lugar</td>
                <td class="py-1 px-2 text-center font-bold text-slate-400">3° Lugar</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 7. PREGUNTAS RÁPIDAS -->
      <div class="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-2.5">
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
          7. Preguntas Rápidas
        </span>

        <div class="space-y-2 text-xs leading-relaxed">
          
          <!-- Cambio de Alianza Actualizado -->
          <div class="p-3 bg-slate-900/30 rounded-lg border border-slate-900 space-y-1">
            <strong class="text-white block font-medium">“¿Se puede cambiar de alianza?”</strong>
            <p class="text-slate-400">
              <strong>Sí</strong>, se puede solicitar cambio de alianza directamente en la mesa de control con la coordinación del evento hasta el <strong>17 de noviembre como plazo máximo</strong>. Luego de esa fecha, las nóminas quedan cerradas y ya no se podrá cambiar bajo ningún motivo.
            </p>
          </div>

          <div class="p-3 bg-slate-900/30 rounded-lg border border-slate-900 space-y-1">
            <strong class="text-white block font-medium">“¿Por qué ganó otra alianza si yo gané mi partido?”</strong>
            <p class="text-slate-400">
              Porque el campeonato suma los puntos de todas las actividades (deportes, salón, creatividad y tarreo), no de un solo partido.
            </p>
          </div>

          <div class="p-3 bg-slate-900/30 rounded-lg border border-slate-900 space-y-1">
            <strong class="text-white block font-medium">“¿Cuándo se sabe el resultado final?”</strong>
            <p class="text-slate-400">
              Entre el 24 y el 26 de noviembre, tras la validación final de la comisión y DAE.
            </p>
          </div>

          <div class="p-3 bg-slate-900/30 rounded-lg border border-slate-900 space-y-1">
            <strong class="text-white block font-medium">“¿Puedo reclamar?”</strong>
            <p class="text-slate-400">
              Sí, la capitanía puede presentar un reclamo en la mesa de control hasta 15 minutos después de finalizada la actividad.
            </p>
          </div>

        </div>
      </div>

    </div>
  `;
}