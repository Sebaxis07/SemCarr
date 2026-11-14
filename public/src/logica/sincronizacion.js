// Sincronizacion periodica de datos y notificaciones en vivo
import { appData, setAppData, getCurrentTab } from '../estado/estado.js';
import { playProyectorSound } from '../utils/audio.js';
import { renderBigScreen } from '../ui/proyector.js';
import { renderCurrentTab } from './navegacion.js';

export async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Error al cargar datos');
    const fresh = await res.json();
    
    if (appData && appData.alliances && fresh.alliances) {
      const pT_old = appData.alliances?.Terror?.points?.total || 0;
      const pS_old = appData.alliances?.Shooter?.points?.total || 0;
      const pA_old = appData.alliances?.Action?.points?.total || 0;
      const pT_new = fresh.alliances?.Terror?.points?.total || 0;
      const pS_new = fresh.alliances?.Shooter?.points?.total || 0;
      const pA_new = fresh.alliances?.Action?.points?.total || 0;
      if (pT_old !== 0 && (pT_new !== pT_old || pS_new !== pS_old || pA_new !== pA_old)) {
        playProyectorSound('points');
      }
      if (!appData.activeSorpresa && fresh.activeSorpresa) {
        playProyectorSound('sorpresa');
      }
    }
    
    setAppData(fresh);
    
    const currentTab = getCurrentTab();
    if (currentTab === 'inicio') {
      renderCurrentTab();
    } else if (currentTab === 'proyector') {
      const container = document.getElementById('app-container');
      if (container) {
        container.innerHTML = renderBigScreen();
        lucide.createIcons();
      }
    }
    updateLiveAnnouncement();
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
}

export function updateLiveAnnouncement() {
  const annEl = document.getElementById('announcement-text');
  if (!annEl) return;
  if (appData.activeSorpresa) {
    annEl.innerHTML = `<span class="text-amber-400 font-bold uppercase animate-pulse">🚨 ¡PRUEBA SORPRESA EN VIVO!: ${appData.activeSorpresa.name} • 1 min de preparación</span>`;
  } else if (appData.announcements && appData.announcements.length > 0) {
    annEl.textContent = appData.announcements[0].text;
  } else {
    annEl.textContent = 'Semana de las Carreras 2026: Torneos, Gymkanas, Desafíos y Tarreo Gamer • Informática, Telecom & Diseño.';
  }
}
