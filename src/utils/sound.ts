let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function beep(freq: number, durationMs: number, startDelayMs = 0, volume = 0.3) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(c.destination);
  const start = c.currentTime + startDelayMs / 1000;
  const end = start + durationMs / 1000;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, end);
  osc.start(start);
  osc.stop(end + 0.02);
}

export function playShotClockWarning() {
  beep(880, 120);
}

export function playBuzzer() {
  beep(220, 550, 0, 0.5);
  beep(220, 550, 0, 0.5);
}

export function playWhistle() {
  beep(1600, 180, 0, 0.25);
  beep(1900, 180, 190, 0.25);
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* no-op */
    }
  }
}
