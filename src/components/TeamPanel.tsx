import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { GameState, Player, TeamSide } from '../types';

type PendingFlow = { kind: 'goal'; playerId: string } | { kind: 'exclusion'; playerId: string } | null;

const actionBtn =
  'px-2.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 active:scale-95 transition text-slate-200 disabled:opacity-30 disabled:pointer-events-none';

export function TeamPanel({ side, game }: { side: TeamSide; game: GameState }) {
  const team = game.teams[side];
  const opponentSide: TeamSide = side === 'home' ? 'away' : 'home';
  const opponentPlayers = game.teams[opponentSide].players;

  const addGoal = useGameStore((s) => s.addGoal);
  const addShot = useGameStore((s) => s.addShot);
  const addAction = useGameStore((s) => s.addAction);
  const addExclusion = useGameStore((s) => s.addExclusion);
  const addPenalty = useGameStore((s) => s.addPenalty);
  const isManUp = useGameStore((s) => s.isManUp);

  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingFlow>(null);
  const [manUpToggle, setManUpToggle] = useState(false);

  const selectedPlayer = team.players.find((p) => p.id === selected);

  const startGoalFlow = (playerId: string) => {
    setPending({ kind: 'goal', playerId });
    setManUpToggle(isManUp(side));
  };

  const confirmGoal = (assistPlayerId?: string) => {
    if (pending?.kind !== 'goal') return;
    addGoal(side, pending.playerId, assistPlayerId, manUpToggle);
    setPending(null);
    setSelected(null);
  };

  const startExclusionFlow = (playerId: string) => setPending({ kind: 'exclusion', playerId });

  const confirmExclusion = (drawnByPlayerId?: string) => {
    if (pending?.kind !== 'exclusion') return;
    addExclusion(side, pending.playerId, drawnByPlayerId);
    setPending(null);
    setSelected(null);
  };

  const cancelPending = () => setPending(null);

  const rosterGrid = (
    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
      {team.players.map((p: Player) => (
        <button
          key={p.id}
          type="button"
          onClick={() => setSelected(selected === p.id ? null : p.id)}
          className={`relative rounded-lg py-2 text-xs sm:text-sm font-bold border transition ${
            selected === p.id
              ? 'text-slate-900 border-transparent'
              : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
          }`}
          style={selected === p.id ? { backgroundColor: team.color } : undefined}
        >
          {p.cap}
          {p.isGoalie && <span className="absolute -top-1 -right-1 text-[9px] bg-slate-950 rounded-full px-1 border border-slate-600">GK</span>}
        </button>
      ))}
      {team.players.length === 0 && (
        <p className="col-span-full text-xs text-slate-500 py-2">No players yet — add roster in setup.</p>
      )}
    </div>
  );

  return (
    <div
      className="bg-slate-900 rounded-xl p-3 border border-slate-800 flex flex-col gap-3"
    >
      <div className="flex items-center gap-2 self-stretch">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
        <h2 className="font-semibold text-slate-100 truncate">{team.name}</h2>
        {selectedPlayer && (
          <span className="ml-auto text-xs text-slate-400 truncate">
            Selected: #{selectedPlayer.cap} {selectedPlayer.name}
          </span>
        )}
      </div>

      {rosterGrid}

      {pending?.kind === 'goal' && (
        <div className="rounded-lg bg-slate-800/70 p-2.5 flex flex-col gap-2 border border-emerald-600/40">
          <p className="text-xs text-emerald-300 font-semibold">
            Goal by #{team.players.find((p) => p.id === pending.playerId)?.cap} — assist?
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={actionBtn} onClick={() => confirmGoal(undefined)}>
              No assist
            </button>
            {team.players
              .filter((p) => p.id !== pending.playerId)
              .map((p) => (
                <button key={p.id} type="button" className={actionBtn} onClick={() => confirmGoal(p.id)}>
                  #{p.cap} assist
                </button>
              ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={manUpToggle} onChange={(e) => setManUpToggle(e.target.checked)} />
            Scored on extra-man (man-up)
          </label>
          <button type="button" onClick={cancelPending} className="text-xs text-slate-500 self-start">
            Cancel
          </button>
        </div>
      )}

      {pending?.kind === 'exclusion' && (
        <div className="rounded-lg bg-slate-800/70 p-2.5 flex flex-col gap-2 border border-amber-600/40">
          <p className="text-xs text-amber-300 font-semibold">
            Exclusion on #{team.players.find((p) => p.id === pending.playerId)?.cap} — drawn by (optional)?
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={actionBtn} onClick={() => confirmExclusion(undefined)}>
              Skip
            </button>
            {opponentPlayers.map((p) => (
              <button key={p.id} type="button" className={actionBtn} onClick={() => confirmExclusion(p.id)}>
                #{p.cap} {p.name}
              </button>
            ))}
          </div>
          <button type="button" onClick={cancelPending} className="text-xs text-slate-500 self-start">
            Cancel
          </button>
        </div>
      )}

      {!pending && (
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            <button type="button" disabled={!selected} className={actionBtn} onClick={() => selected && startGoalFlow(selected)}>
              ⚽ Goal
            </button>
            <button type="button" disabled={!selected} className={actionBtn} onClick={() => selected && addShot(side, selected, 'shot_saved')}>
              Saved
            </button>
            <button type="button" disabled={!selected} className={actionBtn} onClick={() => selected && addShot(side, selected, 'shot_missed')}>
              Missed
            </button>
            <button type="button" disabled={!selected} className={actionBtn} onClick={() => selected && addShot(side, selected, 'shot_blocked')}>
              Blocked
            </button>
            <button type="button" disabled={!selected} className={actionBtn} onClick={() => selected && addShot(side, selected, 'shot_post')}>
              Post
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" disabled={!selected} className={actionBtn} onClick={() => selected && addAction('steal', side, selected)}>
              Steal
            </button>
            <button type="button" disabled={!selected} className={actionBtn} onClick={() => selected && addAction('turnover', side, selected)}>
              Turnover
            </button>
            <button type="button" disabled={!selected} className={actionBtn} onClick={() => selected && addAction('sprint_won', side, selected)}>
              Sprint won
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={!selected}
              className={`${actionBtn} bg-amber-900/60 hover:bg-amber-800/60`}
              onClick={() => selected && startExclusionFlow(selected)}
            >
              🟡 Exclusion
            </button>
            <button type="button" disabled={!selected} className={actionBtn} onClick={() => selected && addPenalty(side, selected, true)}>
              Penalty ✓
            </button>
            <button type="button" disabled={!selected} className={actionBtn} onClick={() => selected && addPenalty(side, selected, false)}>
              Penalty ✗
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
