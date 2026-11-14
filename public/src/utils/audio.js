// Generador de efectos de sonido sinteticos con Web Audio API
import { proyectorState, getProyectorAudioCtx, setProyectorAudioCtx } from '../estado/estado.js';

export function playProyectorSound(type) {
  if (!proyectorState.soundEnabled) return;
  try {
    let proyectorAudioCtx = getProyectorAudioCtx();
    if (!proyectorAudioCtx) {
      proyectorAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      setProyectorAudioCtx(proyectorAudioCtx);
    }
    if (proyectorAudioCtx.state === 'suspended') {
      proyectorAudioCtx.resume();
    }
    const now = proyectorAudioCtx.currentTime;
    if (type === 'points') {
      const osc = proyectorAudioCtx.createOscillator();
      const gain = proyectorAudioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(proyectorAudioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'sorpresa') {
      const osc = proyectorAudioCtx.createOscillator();
      const gain = proyectorAudioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.15);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(proyectorAudioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {}
}
