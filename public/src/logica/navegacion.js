// Enrutamiento y conmutacion entre pantallas de la aplicacion
import { getCurrentTab, setCurrentTab } from '../estado/estado.js';
import { renderInicio } from '../ui/inicio.js';
import { renderBigScreen } from '../ui/proyector.js';
import { renderActividades } from '../ui/actividades.js';
import { renderDesafios } from '../ui/desafios.js';
import { renderMiAlianza } from '../ui/alianzas.js';
import { renderReglas } from '../ui/reglas.js';
import { renderPremios } from '../ui/premios.js';
import { initCountdown } from '../utils/cuenta_regresiva.js';

export function navigate(tab) {
  if (tab === 'bigscreen') tab = 'proyector';
  setCurrentTab(tab);
  
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('text-white', 'bg-[#E6194B]', 'bg-slate-800', 'font-bold', 'shadow-lg', 'shadow-[#E6194B]/40', 'border', 'border-white/30', 'border-slate-700/60');
    btn.classList.add('text-slate-300');
  });
  
  const activeBtn = document.getElementById(`nav-${tab}`);
  if (activeBtn) {
    activeBtn.classList.remove('text-slate-300');
    activeBtn.classList.add('text-white', 'bg-[#E6194B]', 'font-bold', 'shadow-lg', 'shadow-[#E6194B]/40', 'border', 'border-white/30');
  }

  renderCurrentTab();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function renderCurrentTab() {
  const container = document.getElementById('app-container');
  if (!container) return;

  const currentTab = getCurrentTab();
  switch (currentTab) {
    case 'inicio':
      container.innerHTML = renderInicio();
      initCountdown();
      break;

    case 'proyector':
    case 'bigscreen':
      container.innerHTML = renderBigScreen();
      initCountdown();
      break;

    case 'actividades':
      container.innerHTML = renderActividades();
      break;
    case 'desafios':
      container.innerHTML = renderDesafios();
      break;
    case 'mialianza':
      container.innerHTML = renderMiAlianza();
      break;
    case 'reglas':
      container.innerHTML = renderReglas();
      break;
    case 'premios':
      container.innerHTML = renderPremios();
      break;

    default:
      container.innerHTML = renderInicio();
  }

  lucide.createIcons();
}
