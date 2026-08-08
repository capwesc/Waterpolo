import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { GameState, Player, TeamSide } from '../types';

type PendingFlow = { kind: 'goal'; playerId: string } | { kind: 'exclusion'; playerId: string } | null;

const actionBtn =
  'px-2.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 active:scale-95 transition text-slate-200 disabled:opacity-30 disabled:pointer-events-none';

function sortedPlayers(players: Player[]): Player[] {
  return [...players].sort((a, b) => Number(a.cap) - Number(b.cap) || a.cap.localeCompare(b.cap));
}

function RosterEditPanel({ side, team }: { side: TeamSide; team: GameState['teams'][TeamSide] }) {
  const updatePlayer = useGameStore((s) => s.updatePlayer);
  const addPlayer = useGameStore((s) => s.addPlayer);
  const setGoalie = useGameStore((s) => s.setGoalie);
  const [newCap, setNewCap] = useState('');

  return (
    <div className="rounded-lg bg-slate-800/70 p-2.5 flex flex-col gap-2 border border-sky-600/40">
      <p className="text-xs text-sky-300 font-semibold">Edit roster — fill in real names any time</p>
      <div className="flex flex-col divide-y divide-slate-800 max-h-56 overflow-y-auto">
        {sortedPlayers(team.players).map((p) => (
          <div key={p.id} className="flex items-center gap-2 py-1.5 text-sm">
            <span className="tabular text-slate-400 w-8 shrink-0">#{p.cap}</span>
            <input
              value={p.name}
              onChange={(e) => updatePlayer(side, p.id, { name: e.target.value })}
              className="flex-1 min-w-0 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-sky-500 focus:outline-none text-slate-200 px-1 py-0.5"
            />
            <label className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
              <input type="checkbox" checked={!!p.isGoalie} onChange={() => setGoalie(side, p.id)} />
              GK
            </label>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={newCap}
          onChange={(e) => setNewCap(e.target.value)}
          placeholder="Cap #"
          inputMode="numeric"
          className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-100"
        />
        <button
          type="button"
          onClick={() => {
            if (!newCap.trim()) return;
            addPlayer(side, { cap: newCap.trim(), name: `Player ${newCap.trim()}` });
            setNewCap('');
          }}
          className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
        >
          Add player
        </button>
      </div>
    </div>
  );
}

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
  const [editingRoster, setEditingRoster] = useState(false);

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
        <button
          type="button"
          onClick={() => setEditingRoster((v) => !v)}
          className={`shrink-0 text-xs px-2 py-0.5 rounded ${editingRoster ? 'bg-sky-600 text-white' : 'text-slate-500 hover:text-slate-300'} ${selectedPlayer ? '' : 'ml-auto'}`}
        >
          ✎ Roster
        </button>
      </div>

      {editingRoster ? (
        <RosterEditPanel side={side} team={team} />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
