import { useState } from 'react';
import { useGameStore } from './store/gameStore';
import { useClockTick } from './hooks/useClockTick';
import { GameList } from './components/GameList';
import { GameSetup } from './components/GameSetup';
import { Scoreboard } from './components/Scoreboard';
import { ExclusionBar } from './components/ExclusionBar';
import { TeamPanel } from './components/TeamPanel';
import { EventLog } from './components/EventLog';
import { StatsTable } from './components/StatsTable';

type View = 'home' | 'setup' | 'game';

function useSoundEnabled() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem('wp-sound') !== 'off');
  const toggle = () => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('wp-sound', next ? 'on' : 'off');
      return next;
    });
  };
  return [enabled, toggle] as const;
}

function GameView({ gameId, onHome }: { gameId: string; onHome: () => void }) {
  const game = useGameStore((s) => s.games[gameId]);
  const [tab, setTab] = useState<'log' | 'stats'>('log');
  const [soundEnabled, toggleSound] = useSoundEnabled();
  useClockTick(soundEnabled);

  if (!game) return null;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-3 p-2 sm:p-4 pb-8">
      <div className="flex items-center justify-between px-1">
        <button type="button" onClick={onHome} className="text-sm text-slate-400 hover:text-slate-200">
          ← All games
        </button>
        <h1 className="text-sm font-semibold text-slate-300 truncate max-w-[50%]">{game.name}</h1>
        <button
          type="button"
          onClick={toggleSound}
          className="text-sm text-slate-400 hover:text-slate-200"
          aria-label="Toggle sound"
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>

      <Scoreboard game={game} />
      <ExclusionBar game={game} />

      <div className="grid sm:grid-cols-2 gap-3">
        <TeamPanel side="home" game={game} />
        <TeamPanel side="away" game={game} />
      </div>

      <div className="flex gap-2 border-b border-slate-800 px-1">
        <button
          type="button"
          onClick={() => setTab('log')}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'log' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-500'
          }`}
        >
          Play-by-play
        </button>
        <button
          type="button"
          onClick={() => setTab('stats')}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'stats' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-500'
          }`}
        >
          Stats
        </button>
      </div>

      {tab === 'log' ? <EventLog game={game} /> : <StatsTable game={game} />}
    </div>
  );
}

export default function App() {
  const currentGameId = useGameStore((s) => s.currentGameId);
  const loadGame = useGameStore((s) => s.loadGame);
  const closeGame = useGameStore((s) => s.closeGame);
  const [view, setView] = useState<View>(currentGameId ? 'game' : 'home');

  const goHome = () => {
    closeGame();
    setView('home');
  };

  if (view === 'setup') {
    return <GameSetup onCancel={goHome} onCreated={() => setView('game')} />;
  }

  if (view === 'game' && currentGameId) {
    return <GameView gameId={currentGameId} onHome={goHome} />;
  }

  return (
    <GameList
      onNewGame={() => setView('setup')}
      onOpenGame={(id) => {
        loadGame(id);
        setView('game');
      }}
    />
  );
}
