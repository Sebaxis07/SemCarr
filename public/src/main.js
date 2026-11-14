// Punto de entrada principal que inicializa la aplicacion y conecta los modulos
import { STATS_POLL_INTERVAL_MS } from './config/constantes.js';
import { setRefreshInterval } from './estado/estado.js';
import { loadStats } from './logica/sincronizacion.js';
import { navigate, renderCurrentTab } from './logica/navegacion.js';
import { setActFilter, setAllianceFilter } from './logica/filtros.js';
import { handleStudentSearch, selectStudentForSearch, clearStudentSearch } from './logica/estudiantes.js';
import { setProyectorView, toggleProyectorAutoCycle, toggleProyectorSound } from './logica/proyector.js';
import { toggleProyectorFullscreen } from './utils/pantalla.js';
import { updatePublicSorpresaCountdown } from './utils/cuenta_regresiva.js';
import { openActivityDetail, openCreativeDetail } from './ui/modales.js';
import { registrarAtajosTeclado } from './eventos/teclado.js';

// Exponer funciones en window para preservar compatibilidad con eventos inline del HTML
window.navigate = navigate;
window.renderCurrentTab = renderCurrentTab;
window.setActFilter = setActFilter;
window.setAllianceFilter = setAllianceFilter;
window.handleStudentSearch = handleStudentSearch;
window.selectStudentForSearch = selectStudentForSearch;
window.clearStudentSearch = clearStudentSearch;
window.setProyectorView = setProyectorView;
window.toggleProyectorAutoCycle = toggleProyectorAutoCycle;
window.toggleProyectorSound = toggleProyectorSound;
window.toggleProyectorFullscreen = toggleProyectorFullscreen;
window.openActivityDetail = openActivityDetail;
window.openCreativeDetail = openCreativeDetail;
window.loadStats = loadStats;

// Inicializacion al cargar el documento
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  const timer = setInterval(loadStats, STATS_POLL_INTERVAL_MS);
  setRefreshInterval(timer);
  if (window.lucide && window.lucide.createIcons) {
    window.lucide.createIcons();
  }
  registrarAtajosTeclado();
});

setInterval(updatePublicSorpresaCountdown, 1000);
