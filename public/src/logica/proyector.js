// Control de vistas, ciclo automatico y efectos de sonido del modo proyector
import { proyectorState, getCurrentTab } from '../estado/estado.js';
import { playProyectorSound } from '../utils/audio.js';
import { renderBigScreen } from '../ui/proyector.js';

export function setProyectorView(mode) {
  if (!['leaderboard', 'podium', 'cancha'].includes(mode)) return;
  proyectorState.viewMode = mode;
  if (getCurrentTab() === 'proyector') {
    const container = document.getElementById('app-container');
    if (container) {
      container.innerHTML = renderBigScreen();
      lucide.createIcons();
    }
  }
}

export function toggleProyectorAutoCycle() {
  proyectorState.autoCycle = !proyectorState.autoCycle;
  if (proyectorState.autoCycleInterval) {
    clearInterval(proyectorState.autoCycleInterval);
    proyectorState.autoCycleInterval = null;
  }
  if (proyectorState.autoCycle) {
    const views = ['leaderboard', 'podium', 'cancha'];
    proyectorState.autoCycleInterval = setInterval(() => {
      if (getCurrentTab() !== 'proyector') {
        clearInterval(proyectorState.autoCycleInterval);
        proyectorState.autoCycle = false;
        return;
      }
      const curIdx = views.indexOf(proyectorState.viewMode);
      const nextIdx = (curIdx + 1) % views.length;
      setProyectorView(views[nextIdx]);
    }, 15000);
  }
  if (getCurrentTab() === 'proyector') {
    const container = document.getElementById('app-container');
    if (container) {
      container.innerHTML = renderBigScreen();
      lucide.createIcons();
    }
  }
}

export function toggleProyectorSound() {
  proyectorState.soundEnabled = !proyectorState.soundEnabled;
  if (proyectorState.soundEnabled) {
    playProyectorSound('points');
  }
  if (getCurrentTab() === 'proyector') {
    const container = document.getElementById('app-container');
    if (container) {
      container.innerHTML = renderBigScreen();
      lucide.createIcons();
    }
  }
}
