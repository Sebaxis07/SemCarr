// Gestion de filtros para actividades en cancha y listados de alianzas
import { setCurrentActFilter, getCurrentTab, setCurrentAllianceFilter } from '../estado/estado.js';
import { renderActividades } from '../ui/actividades.js';
import { renderAlliancesRoster } from '../ui/alianzas.js';

export function setActFilter(group) {
  setCurrentActFilter(group);
  const container = document.getElementById('app-container');
  if (container && getCurrentTab() === 'actividades') {
    container.innerHTML = renderActividades();
    lucide.createIcons();
  }
}

export function setAllianceFilter(filter) {
  setCurrentAllianceFilter(filter);
  renderAlliancesRoster();
}
