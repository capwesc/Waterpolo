import { useGameStore } from '../store/gameStore';
import type { GameState } from '../types';
import { eventLabel } from '../utils/stats';
import { formatClock, ordinal } from '../utils/format';

export function EventLog({ game }: { game: GameState }) {
  const removeEvent = useGameStore((s) => s.removeEvent);
  const events = [...game.events].reverse();

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 flex flex-col max-h-[420px]">
      <h2 className="text-sm font-semibold text-slate-300 px-3 py-2 border-b border-slate-800">
        Play-by-play
      </h2>
      <div className="overflow-y-auto flex-1 divide-y divide-slate-800/60">
        {events.length === 0 && <p className="text-xs text-slate-500 px-3 py-3">No events logged yet.</p>}
        {events.map((ev) => (
          <div key={ev.id} className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm group">
            <span className="text-slate-500 tabular shrink-0 w-16">
              P{ordinal(ev.period).replace(/\D/g, '')} {formatClock(ev.clockMs)}
            </span>
            <span
              className={`flex-1 truncate ${
                ev.type === 'goal' || ev.type === 'penalty_goal' ? 'text-emerald-300 font-medium' : 'text-slate-200'
              }`}
            >
              {eventLabel(ev, game.teams)}
            </span>
            <button
              type="button"
              onClick={() => removeEvent(ev.id)}
              className="text-slate-600 hover:text-red-400 shrink-0 px-1"
              aria-label="Delete event"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
