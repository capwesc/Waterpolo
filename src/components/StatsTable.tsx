import { useMemo } from 'react';
import type { GameState, TeamSide } from '../types';
import { computeStats } from '../utils/stats';
import { exportEventLogCsv, exportGameSheetText, exportStatsCsv } from '../utils/csvExport';

function TeamTable({ game, side }: { game: GameState; side: TeamSide }) {
  const { players, teams } = useMemo(() => computeStats(game), [game]);
  const team = game.teams[side];
  const t = teams[side];

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.color }} />
          <h3 className="text-sm font-semibold text-slate-200">{team.name}</h3>
        </div>
        <span className="text-xs text-slate-400">
          EMO {t.emo} · EM {t.emGoals}/{t.emo || 0} · Pen {t.penaltyGoals}/{t.penaltyAttempts}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="text-slate-500 text-left">
              <th className="px-2 py-1 font-medium">#</th>
              <th className="px-2 py-1 font-medium">Name</th>
              <th className="px-2 py-1 font-medium text-center">G</th>
              <th className="px-2 py-1 font-medium text-center">A</th>
              <th className="px-2 py-1 font-medium text-center">Sh</th>
              <th className="px-2 py-1 font-medium text-center">Sv</th>
              <th className="px-2 py-1 font-medium text-center">St</th>
              <th className="px-2 py-1 font-medium text-center">Bl</th>
              <th className="px-2 py-1 font-medium text-center">TO</th>
              <th className="px-2 py-1 font-medium text-center">Ex</th>
            </tr>
          </thead>
          <tbody>
            {team.players.map((p) => {
              const s = players[p.id];
              return (
                <tr key={p.id} className="border-t border-slate-800/60 text-slate-200">
                  <td className="px-2 py-1 tabular">{p.cap}</td>
                  <td className="px-2 py-1 truncate max-w-[8rem]">
                    {p.name}
                    {p.isGoalie && <span className="ml-1 text-[10px] text-sky-400">GK</span>}
                  </td>
                  <td className="px-2 py-1 text-center tabular font-semibold">{s?.goals ?? 0}</td>
                  <td className="px-2 py-1 text-center tabular">{s?.assists ?? 0}</td>
                  <td className="px-2 py-1 text-center tabular">{s?.shotsTotal ?? 0}</td>
                  <td className="px-2 py-1 text-center tabular">{s?.saves ?? 0}</td>
                  <td className="px-2 py-1 text-center tabular">{s?.steals ?? 0}</td>
                  <td className="px-2 py-1 text-center tabular">{s?.blocks ?? 0}</td>
                  <td className="px-2 py-1 text-center tabular">{s?.turnovers ?? 0}</td>
                  <td className="px-2 py-1 text-center tabular">{s?.exclusionsCommitted ?? 0}</td>
                </tr>
              );
            })}
            {team.players.length === 0 && (
              <tr>
                <td colSpan={10} className="px-2 py-3 text-slate-500 text-center">
                  No players.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatsTable({ game }: { game: GameState }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 justify-end">
        <button
          type="button"
          onClick={() => exportStatsCsv(game)}
          className="text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
        >
          ⬇ Stats CSV
        </button>
        <button
          type="button"
          onClick={() => exportEventLogCsv(game)}
          className="text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
        >
          ⬇ Play-by-play CSV
        </button>
        <button
          type="button"
          onClick={() => exportGameSheetText(game)}
          className="text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
        >
          ⬇ Game sheet (.txt)
        </button>
      </div>
      <TeamTable game={game} side="home" />
      <TeamTable game={game} side="away" />
    </div>
  );
}
