import { useGameStore } from '../store/gameStore';
import type { GameState } from '../types';
import { playerName } from '../utils/stats';
import { formatShotClock } from '../utils/format';

export function ExclusionBar({ game }: { game: GameState }) {
  const returnExclusion = useGameStore((s) => s.returnExclusion);
  const active = game.exclusions.filter((e) => e.status === 'active' || e.status === 'expired');
  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-1">
      {active.map((ex) => {
        const team = game.teams[ex.team];
        const low = ex.remainingMs <= 5000;
        return (
          <button
            key={ex.id}
            type="button"
            onClick={() => returnExclusion(ex.id)}
            title="Tap to return player to the game"
            className={`flex items-center gap-2 rounded-full pl-2 pr-3 py-1 text-xs font-semibold border ${
              ex.status === 'expired'
                ? 'bg-slate-800 border-slate-600 text-slate-300'
                : low
                  ? 'bg-red-500/20 border-red-500 text-red-300 pulse-danger'
                  : 'bg-amber-500/20 border-amber-500 text-amber-300'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: team.color }}
            />
            EX {playerName(game.teams, ex.playerId)}
            <span className="tabular">
              {ex.status === 'expired' ? 'IN' : formatShotClock(ex.remainingMs)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
