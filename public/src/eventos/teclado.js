// Manejador de atajos globales de teclado para el modo proyector
import { getCurrentTab } from '../estado/estado.js';
import { navigate } from '../logica/navegacion.js';
import { setProyectorView, toggleProyectorAutoCycle, toggleProyectorSound } from '../logica/proyector.js';
import { toggleProyectorFullscreen } from '../utils/pantalla.js';

export function registrarAtajosTeclado() {
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    const currentTab = getCurrentTab();
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      navigate(currentTab === 'proyector' ? 'inicio' : 'proyector');
    } else if (currentTab === 'proyector') {
      if (e.key === '1') setProyectorView('leaderboard');
      else if (e.key === '2') setProyectorView('podium');
      else if (e.key === '3') setProyectorView('cancha');
      else if (e.key === 'r' || e.key === 'R') toggleProyectorAutoCycle();
      else if (e.key === 'm' || e.key === 'M') toggleProyectorSound();
      else if (e.key === 'f' || e.key === 'F') toggleProyectorFullscreen();
      else if (e.key === 'Escape') navigate('inicio');
    }
  });
}
