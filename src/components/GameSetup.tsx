import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { GameConfig, Player, TeamConfig } from '../types';
import { DEFAULT_CONFIG, makeId } from '../types';

interface DraftTeam {
  name: string;
  color: string;
  players: Player[];
}

function RosterEditor({
  team,
  setTeam,
}: {
  team: DraftTeam;
  setTeam: (t: DraftTeam) => void;
}) {
  const [cap, setCap] = useState('');
  const [name, setName] = useState('');

  const addPlayer = () => {
    if (!cap.trim()) return;
    setTeam({
      ...team,
      players: [...team.players, { id: makeId(), cap: cap.trim(), name: name.trim() || `Player ${cap.trim()}` }],
    });
    setCap('');
    setName('');
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={team.name}
          onChange={(e) => setTeam({ ...team, name: e.target.value })}
          placeholder="Team name"
          className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100"
        />
        <input
          type="color"
          value={team.color}
          onChange={(e) => setTeam({ ...team, color: e.target.value })}
          className="w-10 h-9 bg-slate-800 border border-slate-700 rounded cursor-pointer"
        />
      </div>

      <div className="flex gap-2">
        <input
          value={cap}
          onChange={(e) => setCap(e.target.value)}
          placeholder="Cap #"
          inputMode="numeric"
          className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name (optional)"
          onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
          className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100"
        />
        <button type="button" onClick={addPlayer} className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold">
          Add
        </button>
      </div>

      <div className="flex flex-col divide-y divide-slate-800 rounded border border-slate-800 max-h-56 overflow-y-auto">
        {team.players.length === 0 && <p className="text-xs text-slate-500 px-2 py-2">No players added yet.</p>}
        {team.players.map((p) => (
          <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 text-sm">
            <span className="tabular text-slate-400 w-8">#{p.cap}</span>
            <span className="flex-1 text-slate-200 truncate">{p.name}</span>
            <label className="flex items-center gap-1 text-[11px] text-slate-400">
              <input
                type="checkbox"
                checked={!!p.isGoalie}
                onChange={() =>
                  setTeam({
                    ...team,
                    players: team.players.map((pl) => (pl.id === p.id ? { ...pl, isGoalie: !pl.isGoalie } : pl)),
                  })
                }
              />
              GK
            </label>
            <button
              type="button"
              onClick={() => setTeam({ ...team, players: team.players.filter((pl) => pl.id !== p.id) })}
              className="text-slate-500 hover:text-red-400 px-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GameSetup({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const createGame = useGameStore((s) => s.createGame);
  const [gameName, setGameName] = useState('');
  const [home, setHome] = useState<DraftTeam>({ name: 'Home', color: '#0ea5e9', players: [] });
  const [away, setAway] = useState<DraftTeam>({ name: 'Away', color: '#f97316', players: [] });
  const [config, setConfig] = useState<GameConfig>({ ...DEFAULT_CONFIG });

  const numField = (label: string, value: number, onChange: (v: number) => void, unit: string) => (
    <label className="flex flex-col gap-1 text-xs text-slate-400">
      {label}
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-100"
        />
        <span>{unit}</span>
      </div>
    </label>
  );

  const canCreate = home.players.length > 0 && away.players.length > 0;

  const handleCreate = () => {
    const homeTeam: TeamConfig = { name: home.name || 'Home', color: home.color, players: home.players };
    const awayTeam: TeamConfig = { name: away.name || 'Away', color: away.color, players: away.players };
    createGame(gameName || `${homeTeam.name} vs ${awayTeam.name}`, homeTeam, awayTeam, config);
    onCreated();
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4 p-3 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">New Game</h1>
        <button type="button" onClick={onCancel} className="text-sm text-slate-400 hover:text-slate-200">
          Cancel
        </button>
      </div>

      <input
        value={gameName}
        onChange={(e) => setGameName(e.target.value)}
        placeholder="Game title (optional, e.g. League Match Day 4)"
        className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <h2 className="text-sm font-semibold text-slate-300 mb-2">Home team</h2>
          <RosterEditor team={home} setTeam={setHome} />
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <h2 className="text-sm font-semibold text-slate-300 mb-2">Away team</h2>
          <RosterEditor team={away} setTeam={setAway} />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Game settings</h2>
        <div className="flex flex-wrap gap-4">
          {numField('Period length', config.periodLengthMs / 60000, (v) => setConfig({ ...config, periodLengthMs: v * 60000 }), 'min')}
          {numField('Periods', config.periodCount, (v) => setConfig({ ...config, periodCount: v }), '')}
          {numField('Shot clock', config.shotClockMs / 1000, (v) => setConfig({ ...config, shotClockMs: v * 1000 }), 'sec')}
          {numField('Exclusion length', config.exclusionMs / 1000, (v) => setConfig({ ...config, exclusionMs: v * 1000 }), 'sec')}
          {numField('Timeouts / team', config.timeoutsPerTeam, (v) => setConfig({ ...config, timeoutsPerTeam: v }), '')}
        </div>
      </div>

      <button
        type="button"
        onClick={handleCreate}
        disabled={!canCreate}
        className="self-end px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:pointer-events-none text-slate-900 font-semibold"
      >
        Start Game
      </button>
      {!canCreate && <p className="text-xs text-slate-500 self-end">Add at least one player to each roster.</p>}
    </div>
  );
}
