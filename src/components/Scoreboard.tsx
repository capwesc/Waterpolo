import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import type { GameState, TeamSide } from '../types';
import { computeStats } from '../utils/stats';
import { formatClock, formatShotClock, ordinal } from '../utils/format';

function TimeoutDots({ used, allowed }: { used: number; allowed: number }) {
  return (
    <div className="flex gap-1 justify-center">
      {Array.from({ length: allowed }).map((_, i) => (
        <span
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${i < used ? 'bg-slate-600' : 'bg-emerald-400'}`}
        />
      ))}
    </div>
  );
}

export function Scoreboard({ game }: { game: GameState }) {
  const setClockRunning = useGameStore((s) => s.setClockRunning);
  const setShotClockRunning = useGameStore((s) => s.setShotClockRunning);
  const resetShotClock = useGameStore((s) => s.resetShotClock);
  const adjustClock = useGameStore((s) => s.adjustClock);
  const adjustShotClock = useGameStore((s) => s.adjustShotClock);
  const nextPeriod = useGameStore((s) => s.nextPeriod);
  const prevPeriod = useGameStore((s) => s.prevPeriod);
  const addTimeout = useGameStore((s) => s.addTimeout);
  const undo = useGameStore((s) => s.undo);
  const historyLen = useGameStore((s) => s.history.length);

  const stats = useMemo(() => computeStats(game), [game]);

  const clockLow = game.clockMs > 0 && game.clockMs <= 10000;
  const shotLow = game.shotClockMs > 0 && game.shotClockMs <= 5000;
  const shotExpired = game.shotClockMs === 0;

  const renderTeamHeader = (side: TeamSide) => {
    const team = game.teams[side];
    return (
      <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
        <span
          className="text-xs sm:text-sm font-semibold uppercase tracking-wide truncate max-w-full px-2 py-0.5 rounded"
          style={{ backgroundColor: team.color, color: '#0b1420' }}
        >
          {team.name}
        </span>
        <span className="text-5xl sm:text-6xl font-bold tabular text-white">{stats.teams[side].goals}</span>
        <TimeoutDots used={game.timeoutsUsed[side]} allowed={game.config.timeoutsPerTeam} />
        <button
          type="button"
          onClick={() => addTimeout(side)}
          disabled={game.timeoutsUsed[side] >= game.config.timeoutsPerTeam}
          className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
        >
          Timeout
        </button>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 rounded-xl p-3 sm:p-4 shadow-lg border border-slate-800">
      <div className="flex items-start justify-between gap-2">
        {renderTeamHeader('home')}

        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevPeriod}
              className="text-slate-500 hover:text-slate-300 px-1"
              aria-label="Previous period"
            >
              ‹
            </button>
            <span className="text-xs sm:text-sm font-medium text-slate-400">
              {game.finished ? 'FINAL' : `${ordinal(game.period)} Period`}
            </span>
            <button
              type="button"
              onClick={nextPeriod}
              className="text-slate-500 hover:text-slate-300 px-1"
              aria-label="Next period"
            >
              ›
            </button>
          </div>

          <div
            className={`tabular text-4xl sm:text-6xl font-bold text-white rounded-lg px-3 py-1 ${clockLow ? 'text-red-400 flash-danger' : ''}`}
          >
            {formatClock(game.clockMs)}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustClock(-1000)}
              className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              −1s
            </button>
            <button
              type="button"
              onClick={() => setClockRunning(!game.clockRunning)}
              className={`px-4 py-1.5 rounded-lg font-semibold text-sm sm:text-base ${
                game.clockRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-900'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'
              }`}
            >
              {game.clockRunning ? 'Pause' : 'Start'}
            </button>
            <button
              type="button"
              onClick={() => adjustClock(1000)}
              className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              +1s
            </button>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <div
              className={`relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 ${
                shotExpired
                  ? 'border-red-500 pulse-danger'
                  : shotLow
                    ? 'border-red-400'
                    : 'border-sky-500'
              } bg-slate-950`}
            >
              <span className={`tabular text-2xl sm:text-3xl font-bold ${shotLow || shotExpired ? 'text-red-400' : 'text-white'}`}>
                {formatShotClock(game.shotClockMs)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setShotClockRunning(!game.shotClockRunning)}
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    game.shotClockRunning ? 'bg-amber-500 text-slate-900' : 'bg-sky-500 text-slate-900'
                  }`}
                >
                  {game.shotClockRunning ? 'Pause SC' : 'Start SC'}
                </button>
                <button
                  type="button"
                  onClick={() => resetShotClock(30000)}
                  className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  30
                </button>
                <button
                  type="button"
                  onClick={() => resetShotClock(20000)}
                  className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  20
                </button>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => adjustShotClock(-1000)}
                  className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  −1s
                </button>
                <button
                  type="button"
                  onClick={() => adjustShotClock(1000)}
                  className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  +1s
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={undo}
            disabled={historyLen === 0}
            className="mt-1 text-xs px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
          >
            ↩ Undo last action
          </button>
        </div>

        {renderTeamHeader('away')}
      </div>
    </div>
  );
}
