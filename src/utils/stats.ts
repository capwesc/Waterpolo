import type { GameEvent, GameState, Player, TeamSide } from '../types';

export interface PlayerStats {
  playerId: string;
  goals: number;
  assists: number;
  shotsTotal: number;
  shotsOnTarget: number;
  saves: number;
  steals: number;
  blocks: number;
  turnovers: number;
  exclusionsDrawn: number; // opponent excluded because of this player
  exclusionsCommitted: number; // this player was excluded
  penaltiesWon: number;
  penaltyGoals: number;
  penaltyAttempts: number;
  manUpGoals: number;
}

function blankPlayerStats(playerId: string): PlayerStats {
  return {
    playerId,
    goals: 0,
    assists: 0,
    shotsTotal: 0,
    shotsOnTarget: 0,
    saves: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    exclusionsDrawn: 0,
    exclusionsCommitted: 0,
    penaltiesWon: 0,
    penaltyGoals: 0,
    penaltyAttempts: 0,
    manUpGoals: 0,
  };
}

export interface TeamStats {
  team: TeamSide;
  goals: number;
  shotsTotal: number;
  shotsOnTarget: number;
  emo: number; // extra man opportunities (opponent excluded)
  emGoals: number; // goals scored during extra man
  penaltyAttempts: number;
  penaltyGoals: number;
  timeoutsUsed: number;
  exclusionsCommitted: number;
}

function blankTeamStats(team: TeamSide): TeamStats {
  return {
    team,
    goals: 0,
    shotsTotal: 0,
    shotsOnTarget: 0,
    emo: 0,
    emGoals: 0,
    penaltyAttempts: 0,
    penaltyGoals: 0,
    timeoutsUsed: 0,
    exclusionsCommitted: 0,
  };
}

const opponent = (t: TeamSide): TeamSide => (t === 'home' ? 'away' : 'home');

export function computeStats(game: GameState) {
  const players: Record<string, PlayerStats> = {};
  const teams: Record<TeamSide, TeamStats> = {
    home: blankTeamStats('home'),
    away: blankTeamStats('away'),
  };

  const ensure = (id: string) => {
    if (!players[id]) players[id] = blankPlayerStats(id);
    return players[id];
  };

  for (const side of ['home', 'away'] as TeamSide[]) {
    for (const p of game.teams[side].players) ensure(p.id);
  }

  for (const ev of game.events) {
    switch (ev.type) {
      case 'goal': {
        if (ev.team) {
          teams[ev.team].goals += 1;
          teams[ev.team].shotsTotal += 1;
          teams[ev.team].shotsOnTarget += 1;
          if (ev.manUp) teams[ev.team].emGoals += 1;
        }
        if (ev.playerId) {
          const s = ensure(ev.playerId);
          s.goals += 1;
          s.shotsTotal += 1;
          s.shotsOnTarget += 1;
          if (ev.manUp) s.manUpGoals += 1;
        }
        if (ev.assistPlayerId) ensure(ev.assistPlayerId).assists += 1;
        break;
      }
      case 'shot_saved':
      case 'shot_missed':
      case 'shot_blocked':
      case 'shot_post': {
        if (ev.team) {
          teams[ev.team].shotsTotal += 1;
          if (ev.type === 'shot_saved') teams[ev.team].shotsOnTarget += 1;
        }
        if (ev.playerId) {
          const s = ensure(ev.playerId);
          s.shotsTotal += 1;
          if (ev.type === 'shot_saved') s.shotsOnTarget += 1;
        }
        break;
      }
      case 'steal':
        if (ev.playerId) ensure(ev.playerId).steals += 1;
        break;
      case 'block':
        if (ev.playerId) ensure(ev.playerId).blocks += 1;
        break;
      case 'turnover':
        if (ev.playerId) ensure(ev.playerId).turnovers += 1;
        break;
      case 'exclusion': {
        if (ev.team) teams[ev.team].exclusionsCommitted += 1;
        if (ev.team) teams[opponent(ev.team)].emo += 1;
        if (ev.playerId) ensure(ev.playerId).exclusionsCommitted += 1;
        if (ev.drawnByPlayerId) ensure(ev.drawnByPlayerId).exclusionsDrawn += 1;
        break;
      }
      case 'penalty_goal':
      case 'penalty_missed': {
        if (ev.team) {
          teams[ev.team].penaltyAttempts += 1;
          if (ev.type === 'penalty_goal') {
            teams[ev.team].penaltyGoals += 1;
            teams[ev.team].goals += 1;
          }
        }
        if (ev.playerId) {
          const s = ensure(ev.playerId);
          s.penaltyAttempts += 1;
          if (ev.type === 'penalty_goal') {
            s.penaltyGoals += 1;
            s.goals += 1;
          }
        }
        break;
      }
      case 'timeout':
        if (ev.team) teams[ev.team].timeoutsUsed += 1;
        break;
      default:
        break;
    }
  }

  // saves credited to goalies from opponents' missed-on-target shots
  for (const ev of game.events) {
    if (ev.type === 'shot_saved' && ev.team) {
      const defendingSide = opponent(ev.team);
      const goalie = game.teams[defendingSide].players.find((p) => p.isGoalie);
      if (goalie) ensure(goalie.id).saves += 1;
    }
  }

  return { players, teams };
}

export function playerName(teams: GameState['teams'], id?: string): string {
  if (!id) return '';
  for (const side of ['home', 'away'] as TeamSide[]) {
    const p = teams[side].players.find((pl) => pl.id === id);
    if (p) return `#${p.cap} ${p.name}`;
  }
  return '';
}

export function findPlayer(teams: GameState['teams'], id?: string): Player | undefined {
  if (!id) return undefined;
  for (const side of ['home', 'away'] as TeamSide[]) {
    const p = teams[side].players.find((pl) => pl.id === id);
    if (p) return p;
  }
  return undefined;
}

export function eventLabel(ev: GameEvent, teams: GameState['teams']): string {
  const p = playerName(teams, ev.playerId);
  switch (ev.type) {
    case 'goal':
      return `GOAL ${p}${ev.assistPlayerId ? ` (assist: ${playerName(teams, ev.assistPlayerId)})` : ''}${ev.manUp ? ' [Man-Up]' : ''}`;
    case 'shot_saved':
      return `Shot saved — ${p}`;
    case 'shot_missed':
      return `Shot missed — ${p}`;
    case 'shot_blocked':
      return `Shot blocked — ${p}`;
    case 'shot_post':
      return `Shot off post/bar — ${p}`;
    case 'steal':
      return `Steal — ${p}`;
    case 'block':
      return `Block — ${p}`;
    case 'turnover':
      return `Turnover — ${p}`;
    case 'sprint_won':
      return `Sprint won — ${p}`;
    case 'exclusion':
      return `Exclusion (20s) — ${p}${ev.drawnByPlayerId ? ` drawn by ${playerName(teams, ev.drawnByPlayerId)}` : ''}`;
    case 'exclusion_return':
      return `Returns from exclusion — ${p}`;
    case 'penalty_awarded':
      return `Penalty awarded — ${p}`;
    case 'penalty_goal':
      return `Penalty GOAL — ${p}`;
    case 'penalty_missed':
      return `Penalty missed — ${p}`;
    case 'timeout':
      return `Timeout — ${ev.team}`;
    case 'period_start':
      return `Period ${ev.period} start`;
    case 'period_end':
      return `Period ${ev.period} end`;
    case 'note':
      return ev.note ?? 'Note';
    default:
      return ev.type;
  }
}
