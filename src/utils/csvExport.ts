import type { GameState, TeamSide } from '../types';
import { computeStats, eventLabel, playerName } from './stats';
import { formatClock, ordinal } from './format';

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(v: string | number): string {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportEventLogCsv(game: GameState) {
  const rows = [['Period', 'Clock', 'Team', 'Event', 'Player', 'Assist/Drawn By', 'Man-Up', 'Note']];
  for (const ev of game.events) {
    rows.push([
      String(ev.period),
      formatClock(ev.clockMs),
      ev.team ? game.teams[ev.team].name : '',
      ev.type,
      playerName(game.teams, ev.playerId),
      playerName(game.teams, ev.assistPlayerId ?? ev.drawnByPlayerId),
      ev.manUp ? 'Y' : '',
      ev.note ?? '',
    ]);
  }
  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
  download(`${game.name || 'game'}-log.csv`, csv, 'text/csv');
}

export function exportStatsCsv(game: GameState) {
  const { players } = computeStats(game);
  const rows = [
    [
      'Team',
      'Cap',
      'Name',
      'Goals',
      'Assists',
      'Shots',
      'Shot %',
      'Saves',
      'Steals',
      'Blocks',
      'Turnovers',
      'Exclusions Drawn',
      'Exclusions Committed',
      'Penalty Goals',
      'Penalty Attempts',
      'Man-Up Goals',
    ],
  ];
  for (const side of ['home', 'away'] as TeamSide[]) {
    for (const p of game.teams[side].players) {
      const s = players[p.id];
      if (!s) continue;
      const pct = s.shotsTotal ? ((s.goals / s.shotsTotal) * 100).toFixed(0) + '%' : '-';
      rows.push([
        game.teams[side].name,
        p.cap,
        p.name,
        String(s.goals),
        String(s.assists),
        String(s.shotsTotal),
        pct,
        String(s.saves),
        String(s.steals),
        String(s.blocks),
        String(s.turnovers),
        String(s.exclusionsDrawn),
        String(s.exclusionsCommitted),
        String(s.penaltyGoals),
        String(s.penaltyAttempts),
        String(s.manUpGoals),
      ]);
    }
  }
  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
  download(`${game.name || 'game'}-stats.csv`, csv, 'text/csv');
}

export function exportGameSheetText(game: GameState) {
  const { teams } = computeStats(game);
  const lines: string[] = [];
  lines.push(`WATER POLO GAME SHEET`);
  lines.push(game.name);
  lines.push(new Date(game.createdAt).toLocaleString());
  lines.push('');
  lines.push(`${game.teams.home.name} ${teams.home.goals} — ${teams.away.goals} ${game.teams.away.name}`);
  lines.push(game.finished ? 'FINAL' : `In progress — ${ordinal(game.period)} period, ${formatClock(game.clockMs)} remaining`);
  lines.push('');
  for (const side of ['home', 'away'] as TeamSide[]) {
    lines.push(`--- ${teams[side].team.toUpperCase()}: ${game.teams[side].name} ---`);
    lines.push(
      `Goals ${teams[side].goals} | Shots ${teams[side].shotsTotal} | EMO ${teams[side].emo} | EM Goals ${teams[side].emGoals} | Penalties ${teams[side].penaltyGoals}/${teams[side].penaltyAttempts} | Timeouts used ${teams[side].timeoutsUsed}`,
    );
    lines.push('');
  }
  lines.push('--- PLAY-BY-PLAY ---');
  for (const ev of game.events) {
    lines.push(`P${ev.period} ${formatClock(ev.clockMs)}  ${eventLabel(ev, game.teams)}`);
  }
  download(`${game.name || 'game'}-sheet.txt`, lines.join('\n'), 'text/plain');
}
