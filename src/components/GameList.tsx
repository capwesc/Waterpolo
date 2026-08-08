import { useGameStore } from '../store/gameStore';
import { computeStats } from '../utils/stats';

export function GameList({ onNewGame, onOpenGame }: { onNewGame: () => void; onOpenGame: (id: string) => void }) {
  const games = useGameStore((s) => s.games);
  const deleteGame = useGameStore((s) => s.deleteGame);

  const list = Object.values(games).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4 p-4 sm:p-8">
      <div className="flex flex-col items-center gap-2 text-center mb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">🤽 Water Polo Scoring Sheet</h1>
        <p className="text-sm text-slate-400">Game clock, shot clock, score, assists, exclusions, penalties &amp; extra-man stats.</p>
      </div>

      <button
        type="button"
        onClick={onNewGame}
        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-base"
      >
        + New Game
      </button>

      <div className="flex flex-col gap-2">
        {list.length === 0 && <p className="text-sm text-slate-500 text-center py-6">No saved games yet.</p>}
        {list.map((g) => {
          const { teams } = computeStats(g);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onOpenGame(g.id)}
              className="text-left bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-100 truncate">{g.name}</p>
                <p className="text-xs text-slate-500">
                  {g.teams.home.name} {teams.home.goals} — {teams.away.goals} {g.teams.away.name} ·{' '}
                  {g.finished ? 'Final' : `P${g.period}`} · {new Date(g.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${g.name}"? This cannot be undone.`)) deleteGame(g.id);
                }}
                role="button"
                className="text-slate-600 hover:text-red-400 text-sm px-2 shrink-0"
              >
                ✕
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-600 mt-4">
        Built for{' '}
        <a
          href="https://www.hopswaterpolo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-sky-400 underline"
        >
          HOPS Water Polo
        </a>{' '}
        · Houston, TX
      </p>
    </div>
  );
}
