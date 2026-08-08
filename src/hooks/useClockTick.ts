import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { playBuzzer, playShotClockWarning, playWhistle, vibrate } from '../utils/sound';

const TICK_MS = 100;
const MAX_DELTA_MS = 500;

export function useClockTick(soundEnabled: boolean) {
  const currentGameId = useGameStore((s) => s.currentGameId);
  const lastRef = useRef<number | null>(null);
  const lastBeepSecondRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentGameId) return;
    lastRef.current = performance.now();
    lastBeepSecondRef.current = null;

    const id = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min(MAX_DELTA_MS, now - (lastRef.current ?? now));
      lastRef.current = now;

      const store = useGameStore.getState();
      const before = store.games[store.currentGameId ?? ''];
      if (!before) return;

      const prevShotMs = before.shotClockMs;
      const prevClockMs = before.clockMs;
      const prevActiveExclusions = new Map(
        before.exclusions.filter((e) => e.status === 'active').map((e) => [e.id, e.remainingMs]),
      );
      const shotWasRunning = before.shotClockRunning;
      const clockWasRunning = before.clockRunning;

      store.tick(delta);

      if (!soundEnabled) return;

      const after = useGameStore.getState().games[currentGameId];
      if (!after) return;

      if (shotWasRunning) {
        const sec = Math.ceil(after.shotClockMs / 1000);
        if (after.shotClockMs === 0 && prevShotMs > 0) {
          playBuzzer();
          vibrate([120, 60, 120]);
        } else if (sec <= 5 && sec > 0 && lastBeepSecondRef.current !== sec) {
          lastBeepSecondRef.current = sec;
          playShotClockWarning();
        }
      }

      if (clockWasRunning && after.clockMs === 0 && prevClockMs > 0) {
        playBuzzer();
        vibrate([200, 100, 200, 100, 200]);
      }

      for (const ex of after.exclusions) {
        if (ex.status === 'expired' && prevActiveExclusions.has(ex.id)) {
          playWhistle();
          vibrate(150);
        }
      }
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [currentGameId, soundEnabled]);
}
