export type TeamSide = 'home' | 'away';

export interface Player {
  id: string;
  cap: string;
  name: string;
  isGoalie?: boolean;
}

export interface TeamConfig {
  name: string;
  color: string;
  players: Player[];
}

export type EventType =
  | 'goal'
  | 'shot_saved'
  | 'shot_missed'
  | 'shot_blocked'
  | 'shot_post'
  | 'steal'
  | 'block'
  | 'turnover'
  | 'sprint_won'
  | 'exclusion'
  | 'exclusion_return'
  | 'penalty_awarded'
  | 'penalty_goal'
  | 'penalty_missed'
  | 'timeout'
  | 'period_start'
  | 'period_end'
  | 'note';

export const SHOT_EVENT_TYPES: EventType[] = [
  'goal',
  'shot_saved',
  'shot_missed',
  'shot_blocked',
  'shot_post',
];

export interface GameEvent {
  id: string;
  type: EventType;
  team?: TeamSide;
  playerId?: string;
  assistPlayerId?: string;
  drawnByPlayerId?: string;
  period: number;
  clockMs: number;
  manUp?: boolean;
  manDown?: boolean;
  note?: string;
  timestamp: number;
}

export type ExclusionStatus = 'active' | 'expired' | 'returned' | 'offset';

export interface ExclusionState {
  id: string;
  team: TeamSide;
  playerId: string;
  drawnByPlayerId?: string;
  period: number;
  durationMs: number;
  remainingMs: number;
  status: ExclusionStatus;
  eventId: string;
}

export interface GameConfig {
  periodLengthMs: number;
  periodCount: number;
  shotClockMs: number;
  exclusionMs: number;
  timeoutsPerTeam: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  periodLengthMs: 8 * 60 * 1000,
  periodCount: 4,
  shotClockMs: 30 * 1000,
  exclusionMs: 20 * 1000,
  timeoutsPerTeam: 3,
};

export interface GameState {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  config: GameConfig;
  teams: Record<TeamSide, TeamConfig>;
  period: number;
  clockMs: number;
  clockRunning: boolean;
  shotClockMs: number;
  shotClockRunning: boolean;
  exclusions: ExclusionState[];
  events: GameEvent[];
  timeoutsUsed: Record<TeamSide, number>;
  finished: boolean;
}

export function makeId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function emptyTeam(name: string, color: string): TeamConfig {
  return { name, color, players: [] };
}

export function defaultRoster(size = 15): Player[] {
  return Array.from({ length: size }, (_, i) => {
    const cap = String(i + 1);
    return { id: makeId(), cap, name: `Player ${cap}`, isGoalie: cap === '1' };
  });
}

export function newGame(
  name: string,
  home: TeamConfig,
  away: TeamConfig,
  config: GameConfig = DEFAULT_CONFIG,
): GameState {
  const now = Date.now();
  return {
    id: makeId(),
    name,
    createdAt: now,
    updatedAt: now,
    config,
    teams: { home, away },
    period: 1,
    clockMs: config.periodLengthMs,
    clockRunning: false,
    shotClockMs: config.shotClockMs,
    shotClockRunning: false,
    exclusions: [],
    events: [],
    timeoutsUsed: { home: 0, away: 0 },
    finished: false,
  };
}
