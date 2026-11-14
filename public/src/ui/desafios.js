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
      desc: 'Videojuego original jugable en navegador web con temática de terror, desarrollado con asistencia de inteligencia artificial.',
      requirements: [
        'Jugable directamente en navegador web sin instalaciones complejas.',
        'Temática de terror: atmósfera, sonido e historia.',
        'Uso evidente y documentado de herramientas de IA en código, arte o música.',
        'Video de gameplay de respaldo de 2 minutos.',
        'Ficha técnica con créditos de los integrantes de la alianza.'
      ],
      rubricKey: 'Terror'
    },
    {
      key: 'Shooter',
      alliance: 'Shooter',
      color: 'border-blue-900/40',
      dot: 'bg-blue-500',
      text: 'text-blue-400',
      title: 'Asistente con IA (Chatbot Sede)',
      carrera: 'Informática (Ingeniería y Tecnólogo)',
      desc: 'Chatbot conversacional con IA entrenado para responder consultas estudiantiles reales del Área TI y Diseño (trámites, ramos, vida estudiantil).',
      requirements: [
        'Cobertura de al menos 15 preguntas frecuentes de 3 áreas temáticas.',
        'Pruebas previas documentadas con un mínimo de 20 preguntas reales.',
        'Enlace web público funcional y video de respaldo de 2 minutos.',
        'Evaluación en vivo: responde 1 pregunta conocida, 1 libre y 1 trampa (no inventar datos).',
        'Ficha técnica de los integrantes participantes.'
      ],
      rubricKey: 'Shooter'
    },
    {
      key: 'Action',
      alliance: 'Action',
      color: 'border-emerald-900/40',
      dot: 'bg-emerald-500',
      text: 'text-emerald-400',
      title: 'Collage Digital Fotográfico Creativo',
      carrera: 'Diseño e Industria Digital',
      desc: 'Collage digital de gran formato que represente la identidad de las carreras de TI y Diseño mediante fotografías 100% originales.',
      requirements: [
        'Fotografías originales capturadas por la alianza durante la jornada.',
        'Composición armónica combinando imagen, texturas y tipografía institucional.',
        'Archivo digital final en alta resolución para impresión/pantalla.',
        'Carpeta digital con las fotografías originales sin editar como respaldo.',
        'Memoria breve que describa el concepto visual propuesto.'
      ],
      rubricKey: 'Action'
    }
  ];

  return `
    <div class="space-y-6 max-w-6xl mx-auto">
      <!-- HEADER MINIMAL -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-4">
        <div>
          <span class="text-[11px] font-mono uppercase tracking-wider text-slate-500">Obras Únicas por Alianza • Evaluación Docente</span>
          <h2 class="text-2xl font-bold font-heading text-white tracking-tight mt-0.5">Desafíos Creativos con IA</h2>
        </div>
        <span class="text-xs text-slate-400 font-mono bg-slate-900/60 border border-slate-800/60 px-3 py-1 rounded-lg">
          Hasta 4.000 pts por alianza
        </span>
      </div>

      <!-- DESGLOSE DE PUNTOS REGLAMENTARIO (MINIMAL) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="bg-slate-950 border border-slate-900 p-3.5 rounded-xl">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-white">Entrega Oficial de la Obra</span>
            <span class="text-xs font-mono font-bold text-emerald-400">4.000 pts</span>
          </div>
          <p class="text-[11px] text-slate-500 leading-relaxed">
            Solo al llevar y presentar la obra terminada con sus respaldos dentro del plazo, la alianza asegura los 4.000 puntos para la tabla general.
          </p>
        </div>

        <div class="bg-slate-950 border border-slate-900 p-3.5 rounded-xl">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-white">Evaluación Docente</span>
            <span class="text-xs font-mono font-bold text-slate-400">Rúbrica (0-100)</span>
          </div>
          <p class="text-[11px] text-slate-500 leading-relaxed">
            Dos docentes califican cada obra según la rúbrica oficial. No otorga puntos a la tabla: sirve para comparar la calidad técnica y formativa.
          </p>
        </div>

        <div class="bg-slate-950 border border-slate-900 p-3.5 rounded-xl">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-white">Mención de Honor</span>
            <span class="text-xs font-mono font-bold text-indigo-400">Distinción Honorífica</span>
          </div>
          <p class="text-[11px] text-slate-500 leading-relaxed">
            Reconocimiento oficial a la obra con la calificación docente más alta de la semana (distinción de honor, sin sumar puntos).
          </p>
        </div>
      </div>

      <!-- CARDS POR ALIANZA (MINIMALISTAS) -->
      <div class="space-y-4">
        ${challenges.map(item => {
          const st = status[item.key] || {};
          const rubric = rubrics[item.rubricKey] || {};
          const statusText = st.evaluated ? 'Evaluada' : (st.delivered ? 'Entregada • En Evaluación' : 'Sin Entregar');
          const statusBadge = st.evaluated 
            ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/40' 
            : (st.delivered ? 'text-blue-400 bg-blue-950/40 border-blue-900/40' : 'text-slate-500 bg-slate-900/40 border-slate-800/40');

          return `
            <div class="bg-slate-950 border ${item.color} rounded-xl p-5 hover:border-slate-800 transition">
              <!-- Titular y Alianza -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3 mb-4">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="w-2 h-2 rounded-full ${item.dot}"></span>
                    <span class="text-xs font-mono font-bold uppercase ${item.text}">Alianza ${item.alliance}</span>
                    <span class="text-slate-600">•</span>
                    <span class="text-xs text-slate-500">${item.carrera}</span>
                  </div>
                  <h3 class="text-lg font-bold font-heading text-white">${item.title}</h3>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded border ${statusBadge}">
                    ${statusText}
                  </span>
                </div>
              </div>

              <!-- Contenido en 2 columnas -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
                <!-- Requisitos -->
                <div>
                  <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-2">Requisitos y Entregables:</span>
                  <p class="text-slate-400 leading-relaxed mb-3">${item.desc}</p>
                  <ul class="space-y-1.5 text-slate-400">
                    ${item.requirements.map(r => `
                      <li class="flex items-start gap-2">
                        <span class="w-1 h-1 rounded-full bg-slate-600 mt-2 shrink-0"></span>
                        <span>${r}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>

                <!-- Criterios de Evaluación Docente -->
                <div>
                  <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-2">Rúbrica de Evaluación Docente:</span>
                  <div class="space-y-1.5 font-mono">
                    ${(rubric.criterios || []).map(c => `
                      <div class="bg-slate-900/40 border border-slate-900 p-2 rounded-lg flex items-center justify-between">
                        <div class="min-w-0 pr-2">
                          <span class="text-white font-medium block truncate">${c.nombre}</span>
                          <span class="text-[10px] text-slate-500 font-sans block truncate">${c.desc}</span>
                        </div>
                        <span class="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                          ${c.peso} pts
                        </span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
