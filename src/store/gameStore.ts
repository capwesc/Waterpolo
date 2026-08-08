import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { current } from 'immer';
import type {
  ExclusionState,
  GameConfig,
  GameState,
  Player,
  TeamConfig,
  TeamSide,
} from '../types';
import { makeId, newGame } from '../types';

const opponent = (t: TeamSide): TeamSide => (t === 'home' ? 'away' : 'home');

const HISTORY_LIMIT = 40;

type ShotResult = 'shot_saved' | 'shot_missed' | 'shot_blocked' | 'shot_post';
type QuickAction = 'steal' | 'block' | 'turnover' | 'sprint_won';

interface Store {
  games: Record<string, GameState>;
  currentGameId: string | null;
  history: GameState[];

  createGame: (name: string, home: TeamConfig, away: TeamConfig, config?: GameConfig) => string;
  loadGame: (id: string) => void;
  closeGame: () => void;
  deleteGame: (id: string) => void;
  renameGame: (id: string, name: string) => void;

  updateTeam: (side: TeamSide, patch: Partial<Omit<TeamConfig, 'players'>>) => void;
  addPlayer: (side: TeamSide, player: Omit<Player, 'id'>) => void;
  removePlayer: (side: TeamSide, playerId: string) => void;
  updatePlayer: (side: TeamSide, playerId: string, patch: Partial<Player>) => void;
  setGoalie: (side: TeamSide, playerId: string) => void;
  updateConfig: (patch: Partial<GameConfig>) => void;

  setClockRunning: (running: boolean) => void;
  setShotClockRunning: (running: boolean) => void;
  tick: (deltaMs: number) => void;
  adjustClock: (deltaMs: number) => void;
  adjustShotClock: (deltaMs: number) => void;
  resetShotClock: (ms?: number) => void;
  nextPeriod: () => void;
  prevPeriod: () => void;

  addGoal: (team: TeamSide, playerId: string, assistPlayerId?: string, manUp?: boolean) => void;
  addShot: (team: TeamSide, playerId: string, result: ShotResult) => void;
  addAction: (type: QuickAction, team: TeamSide, playerId: string) => void;
  addExclusion: (team: TeamSide, playerId: string, drawnByPlayerId?: string) => void;
  returnExclusion: (exclusionId: string) => void;
  addPenalty: (team: TeamSide, playerId: string, made: boolean) => void;
  addTimeout: (team: TeamSide) => void;
  addNote: (text: string) => void;
  removeEvent: (eventId: string) => void;

  isManUp: (team: TeamSide) => boolean;

  undo: () => void;
  canUndo: () => boolean;
  finishGame: () => void;
}

function pushHistory(state: { games: Record<string, GameState>; currentGameId: string | null; history: GameState[] }) {
  if (!state.currentGameId) return;
  const g = state.games[state.currentGameId];
  if (!g) return;
  state.history.push(structuredClone(current(g)));
  if (state.history.length > HISTORY_LIMIT) state.history.shift();
}

export const useGameStore = create<Store>()(
  persist(
    immer((set, get) => ({
      games: {},
      currentGameId: null,
      history: [],

      createGame: (name, home, away, config) => {
        const g = newGame(name, home, away, config);
        set((state) => {
          state.games[g.id] = g;
          state.currentGameId = g.id;
          state.history = [];
        });
        return g.id;
      },

      loadGame: (id) =>
        set((state) => {
          if (state.games[id]) {
            state.currentGameId = id;
            state.history = [];
          }
        }),

      closeGame: () =>
        set((state) => {
          state.currentGameId = null;
          state.history = [];
        }),

      deleteGame: (id) =>
        set((state) => {
          delete state.games[id];
          if (state.currentGameId === id) {
            state.currentGameId = null;
            state.history = [];
          }
        }),

      renameGame: (id, name) =>
        set((state) => {
          const g = state.games[id];
          if (g) g.name = name;
        }),

      updateTeam: (side, patch) =>
        set((state) => {
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          Object.assign(g.teams[side], patch);
        }),

      addPlayer: (side, player) =>
        set((state) => {
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          g.teams[side].players.push({ ...player, id: makeId() });
        }),

      removePlayer: (side, playerId) =>
        set((state) => {
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          g.teams[side].players = g.teams[side].players.filter((p) => p.id !== playerId);
        }),

      updatePlayer: (side, playerId, patch) =>
        set((state) => {
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          const p = g.teams[side].players.find((pl) => pl.id === playerId);
          if (p) Object.assign(p, patch);
        }),

      setGoalie: (side, playerId) =>
        set((state) => {
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          g.teams[side].players.forEach((p) => {
            p.isGoalie = p.id === playerId ? !p.isGoalie : p.isGoalie;
          });
        }),

      updateConfig: (patch) =>
        set((state) => {
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          Object.assign(g.config, patch);
        }),

      setClockRunning: (running) =>
        set((state) => {
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          g.clockRunning = running;
          if (!running) g.shotClockRunning = false;
        }),

      setShotClockRunning: (running) =>
        set((state) => {
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          g.shotClockRunning = running;
        }),

      tick: (deltaMs) =>
        set((state) => {
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          if (g.clockRunning) {
            g.clockMs = Math.max(0, g.clockMs - deltaMs);
            if (g.clockMs === 0) {
              g.clockRunning = false;
              g.shotClockRunning = false;
            }
            for (const ex of g.exclusions) {
              if (ex.status === 'active') {
                ex.remainingMs = Math.max(0, ex.remainingMs - deltaMs);
                if (ex.remainingMs === 0) ex.status = 'expired';
              }
            }
          }
          if (g.shotClockRunning) {
            g.shotClockMs = Math.max(0, g.shotClockMs - deltaMs);
            if (g.shotClockMs === 0) g.shotClockRunning = false;
          }
          g.updatedAt = Date.now();
        }),

      adjustClock: (deltaMs) =>
        set((state) => {
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          g.clockMs = Math.min(g.config.periodLengthMs, Math.max(0, g.clockMs + deltaMs));
        }),

      adjustShotClock: (deltaMs) =>
        set((state) => {
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          g.shotClockMs = Math.min(g.config.shotClockMs, Math.max(0, g.shotClockMs + deltaMs));
        }),

      resetShotClock: (ms) =>
        set((state) => {
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          g.shotClockMs = ms ?? g.config.shotClockMs;
        }),

      nextPeriod: () =>
        set((state) => {
          pushHistory(state);
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          g.events.push({
            id: makeId(),
            type: 'period_end',
            period: g.period,
            clockMs: g.clockMs,
            timestamp: Date.now(),
          });
          if (g.period >= g.config.periodCount) {
            g.finished = true;
            g.clockRunning = false;
            g.shotClockRunning = false;
            return;
          }
          g.period += 1;
          g.clockMs = g.config.periodLengthMs;
          g.shotClockMs = g.config.shotClockMs;
          g.clockRunning = false;
          g.shotClockRunning = false;
          g.exclusions.forEach((ex) => {
            if (ex.status === 'active') ex.status = 'expired';
          });
          g.events.push({
            id: makeId(),
            type: 'period_start',
            period: g.period,
            clockMs: g.clockMs,
            timestamp: Date.now(),
          });
        }),

      prevPeriod: () =>
        set((state) => {
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          if (g.period > 1) {
            g.period -= 1;
            g.clockMs = g.config.periodLengthMs;
            g.shotClockMs = g.config.shotClockMs;
            g.clockRunning = false;
            g.shotClockRunning = false;
            g.finished = false;
          }
        }),

      addGoal: (team, playerId, assistPlayerId, manUp) =>
        set((state) => {
          pushHistory(state);
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          g.events.push({
            id: makeId(),
            type: 'goal',
            team,
            playerId,
            assistPlayerId,
            manUp,
            period: g.period,
            clockMs: g.clockMs,
            timestamp: Date.now(),
          });
          g.shotClockMs = g.config.shotClockMs;
          g.shotClockRunning = false;
        }),

      addShot: (team, playerId, result) =>
        set((state) => {
          pushHistory(state);
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          g.events.push({
            id: makeId(),
            type: result,
            team,
            playerId,
            period: g.period,
            clockMs: g.clockMs,
            timestamp: Date.now(),
          });
          g.shotClockMs = g.config.shotClockMs;
          g.shotClockRunning = false;
        }),

      addAction: (type, team, playerId) =>
        set((state) => {
          pushHistory(state);
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          g.events.push({
            id: makeId(),
            type,
            team,
            playerId,
            period: g.period,
            clockMs: g.clockMs,
            timestamp: Date.now(),
          });
        }),

      addExclusion: (team, playerId, drawnByPlayerId) =>
        set((state) => {
          pushHistory(state);
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          const eventId = makeId();
          g.events.push({
            id: eventId,
            type: 'exclusion',
            team,
            playerId,
            drawnByPlayerId,
            period: g.period,
            clockMs: g.clockMs,
            timestamp: Date.now(),
          });
          const ex: ExclusionState = {
            id: makeId(),
            team,
            playerId,
            drawnByPlayerId,
            period: g.period,
            durationMs: g.config.exclusionMs,
            remainingMs: g.config.exclusionMs,
            status: 'active',
            eventId,
          };
          g.exclusions.push(ex);
        }),

      returnExclusion: (exclusionId) =>
        set((state) => {
          pushHistory(state);
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          const ex = g.exclusions.find((e) => e.id === exclusionId);
          if (!ex || ex.status !== 'active') return;
          ex.status = 'returned';
          g.events.push({
            id: makeId(),
            type: 'exclusion_return',
            team: ex.team,
            playerId: ex.playerId,
            period: g.period,
            clockMs: g.clockMs,
            timestamp: Date.now(),
          });
        }),

      addPenalty: (team, playerId, made) =>
        set((state) => {
          pushHistory(state);
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          g.events.push({
            id: makeId(),
            type: made ? 'penalty_goal' : 'penalty_missed',
            team,
            playerId,
            period: g.period,
            clockMs: g.clockMs,
            timestamp: Date.now(),
          });
        }),

      addTimeout: (team) =>
        set((state) => {
          pushHistory(state);
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          g.timeoutsUsed[team] += 1;
          g.clockRunning = false;
          g.shotClockRunning = false;
          g.events.push({
            id: makeId(),
            type: 'timeout',
            team,
            period: g.period,
            clockMs: g.clockMs,
            timestamp: Date.now(),
          });
        }),

      addNote: (text) =>
        set((state) => {
          pushHistory(state);
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          g.events.push({
            id: makeId(),
            type: 'note',
            note: text,
            period: g.period,
            clockMs: g.clockMs,
            timestamp: Date.now(),
          });
        }),

      removeEvent: (eventId) =>
        set((state) => {
          pushHistory(state);
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          g.events = g.events.filter((e) => e.id !== eventId);
          g.exclusions = g.exclusions.filter((e) => e.eventId !== eventId);
        }),

      isManUp: (team) => {
        const g = get().games[get().currentGameId ?? ''];
        if (!g) return false;
        return g.exclusions.some((ex) => ex.status === 'active' && ex.team === opponent(team));
      },

      undo: () =>
        set((state) => {
          const id = state.currentGameId;
          if (!id) return;
          const prev = state.history.pop();
          if (prev) state.games[id] = prev;
        }),

      canUndo: () => get().history.length > 0,

      finishGame: () =>
        set((state) => {
          const g = state.games[state.currentGameId ?? ''];
          if (!g) return;
          g.finished = true;
          g.clockRunning = false;
          g.shotClockRunning = false;
        }),
    })),
    {
      name: 'wp-scoresheet',
      partialize: (state) => ({ games: state.games, currentGameId: state.currentGameId }),
    },
  ),
);
