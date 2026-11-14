// Gestion de cuentas regresivas para el inicio del evento y pruebas sorpresa
import { appData, getCountdownInterval, setCountdownInterval } from '../estado/estado.js';
import { EVENT_START_DATE } from '../config/constantes.js';

export function updatePublicSorpresaCountdown() {
  const el = document.getElementById('public-sorp-countdown');
  const proyEl = document.getElementById('proyector-sorp-countdown');
  if (!appData.activeSorpresa || !appData.activeSorpresa.prepEndsAt) return;
  const diff = new Date(appData.activeSorpresa.prepEndsAt).getTime() - Date.now();
  let text = '';
  let cls = 'text-2xl font-mono font-bold text-amber-400 block';
  if (diff <= 0) {
    text = '¡Comenzó!';
    cls = 'text-2xl font-mono font-bold text-emerald-400 block animate-pulse';
  } else {
    const sec = Math.ceil(diff / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    text = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  if (el) {
    el.textContent = text;
    el.className = cls;
  }
  if (proyEl) {
    proyEl.textContent = text;
  }
}

export function initCountdown() {
  let interval = getCountdownInterval();
  if (interval) clearInterval(interval);
  const targetDate = new Date(EVENT_START_DATE).getTime();

  function update() {
    const timerEl = document.getElementById('countdown-timer');
    const labelEl = document.getElementById('countdown-label');
    const timerBigEl = document.getElementById('countdown-timer-big');
    const labelBigEl = document.getElementById('countdown-label-big');

    const now = Date.now();
    const diff = targetDate - now;

    let text = '';
    let lbl = 'Inicio del Evento';
    if (diff <= 0) {
      lbl = 'Estado del Evento';
      text = '¡En Desarrollo!';
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      text = `${days}d ${hours}h ${mins}m ${secs}s`;
    }

    if (labelEl) labelEl.textContent = lbl;
    if (timerEl) timerEl.textContent = text;
    if (labelBigEl) labelBigEl.textContent = lbl;
    if (timerBigEl) timerBigEl.textContent = text;
  }

  update();
  interval = setInterval(update, 1000);
  setCountdownInterval(interval);
}
