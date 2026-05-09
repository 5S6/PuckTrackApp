// Matches NHL API JSON shape from Models.swift

export interface LocalizedString {
  default: string;
}

// MARK: - Scoreboard / Live Game

export interface NHLScoreboard {
  currentDate?: string;
  games: NHLGame[];
}

export interface NHLGame {
  id: number;
  startTimeUTC?: string;
  gameState: string; // "LIVE" | "CRIT" | "FINAL" | "OVER" | "OFF" | "FUT" | "PRE"
  homeTeam: NHLGameTeam;
  awayTeam: NHLGameTeam;
  clock?: NHLClock;
  periodDescriptor?: NHLPeriodDescriptor;
  goals?: NHLGoal[];
  venue?: LocalizedString;
  situationCode?: string; // e.g. "5511" — away skaters, home skaters, away goalie, home goalie
}

export function isLive(game: NHLGame): boolean {
  return game.gameState === 'LIVE' || game.gameState === 'CRIT';
}
export function isFinal(game: NHLGame): boolean {
  return game.gameState === 'FINAL' || game.gameState === 'OVER' || game.gameState === 'OFF';
}
export function isFuture(game: NHLGame): boolean {
  return game.gameState === 'FUT' || game.gameState === 'PRE';
}

export function homePowerPlay(game: NHLGame): boolean {
  if (!isLive(game) || !game.situationCode || game.situationCode.length < 2) return false;
  const away = parseInt(game.situationCode[0], 10);
  const home = parseInt(game.situationCode[1], 10);
  return away < home && away >= 3;
}
export function awayPowerPlay(game: NHLGame): boolean {
  if (!isLive(game) || !game.situationCode || game.situationCode.length < 2) return false;
  const away = parseInt(game.situationCode[0], 10);
  const home = parseInt(game.situationCode[1], 10);
  return home < away && home >= 3;
}

export function goalsByPeriod(game: NHLGame): Record<number, { home: number; away: number }> {
  const result: Record<number, { home: number; away: number }> = {};
  for (const goal of game.goals ?? []) {
    const p = goal.period ?? 1;
    const entry = result[p] ?? { home: 0, away: 0 };
    if (goal.teamAbbrev === game.homeTeam.abbrev) {
      entry.home += 1;
    } else {
      entry.away += 1;
    }
    result[p] = entry;
  }
  return result;
}

export interface NHLGameTeam {
  id?: number;
  abbrev: string;
  score?: number;
  sog?: number;
  logo?: string;
  placeName?: LocalizedString;
  commonName?: LocalizedString;
}

export interface NHLClock {
  timeRemaining?: string;
  running?: boolean;
  inIntermission?: boolean;
}

export interface NHLPeriodDescriptor {
  number?: number;
  periodType?: string; // "REG" | "OT" | "SO"
}

export interface NHLGoal {
  period?: number;
  timeInPeriod?: string;
  teamAbbrev?: string;
  name?: LocalizedString;
  firstName?: LocalizedString;
  lastName?: LocalizedString;
  assists?: NHLGoalAssist[];
  goalsToDate?: number;
  strength?: string; // "EV" | "PP" | "SH"
}

export function goalId(goal: NHLGoal): string {
  return `${goal.period ?? 0}-${goal.timeInPeriod ?? '0'}-${goal.teamAbbrev ?? '?'}`;
}

export function scorerDisplay(goal: NHLGoal): string {
  const name = goal.name?.default;
  if (!name) return 'Unknown';
  if (goal.goalsToDate != null) return `${name} (${goal.goalsToDate})`;
  return name;
}

export function assistsDisplay(goal: NHLGoal): string {
  const names = (goal.assists ?? []).map((a) => a.name?.default).filter(Boolean) as string[];
  return names.length === 0 ? 'Unassisted' : names.join(', ');
}

export function periodLabel(goal: NHLGoal): string {
  const p = goal.period ?? 0;
  const t = goal.timeInPeriod ?? '0:00';
  return `P${p} ${t}`;
}

export interface NHLGoalAssist {
  name?: LocalizedString;
}

// MARK: - Club Schedule

export interface NHLClubSchedule {
  games?: NHLScheduledGame[];
}

export interface NHLScheduledGame {
  id: number;
  startTimeUTC: string;
  gameState?: string;
  homeTeam: NHLScheduleTeam;
  awayTeam: NHLScheduleTeam;
  tvBroadcasts?: NHLBroadcast[];
  venue?: LocalizedString;
}

export interface NHLScheduleTeam {
  abbrev: string;
  placeName?: LocalizedString;
  logo?: string;
}

export interface NHLBroadcast {
  network?: string;
  countryCode?: string;
  type?: string;
  sequenceNumber?: number;
}

// MARK: - Roster

export interface NHLRoster {
  forwards?: NHLRosterPlayer[];
  defensemen?: NHLRosterPlayer[];
  goalies?: NHLRosterPlayer[];
}

export interface NHLRosterPlayer {
  id: number;
  firstName: LocalizedString;
  lastName: LocalizedString;
  sweaterNumber?: number;
  positionCode: string;
  headshot?: string;
}

// MARK: - Club Stats

export interface NHLClubStats {
  skaters?: NHLSkaterStat[];
  goalies?: NHLGoalieStat[];
}

export interface NHLSkaterStat {
  playerId: number;
  firstName: LocalizedString;
  lastName: LocalizedString;
  positionCode: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points?: number;
  plusMinus?: number;
  headshot?: string;
  pim?: number;
  powerPlayGoals?: number;
  powerPlayPoints?: number;
  shorthandedGoals?: number;
  shots?: number;
  shootingPctg?: number;
  avgTimeOnIce?: string;
  gameWinningGoals?: number;
}

export function skaterTotalPoints(s: NHLSkaterStat): number {
  return s.points ?? s.goals + s.assists;
}

export function shootingPctgDisplay(s: NHLSkaterStat): string {
  if (s.shootingPctg == null) return '—';
  const pct = s.shootingPctg > 1 ? s.shootingPctg : s.shootingPctg * 100;
  return `${pct.toFixed(1)}%`;
}

export function plusMinusDisplay(s: NHLSkaterStat): string {
  if (s.plusMinus == null) return '—';
  return s.plusMinus >= 0 ? `+${s.plusMinus}` : `${s.plusMinus}`;
}

export interface NHLGoalieStat {
  playerId: number;
  firstName: LocalizedString;
  lastName: LocalizedString;
  gamesPlayed: number;
  wins?: number;
  losses?: number;
  savePctg?: number;
  goalsAgainstAvg?: number;
  headshot?: string;
  shutouts?: number;
  gamesStarted?: number;
  shotsAgainst?: number;
  goalsAgainst?: number;
}

export function savePctgDisplay(g: NHLGoalieStat): string {
  if (g.savePctg == null) return '—';
  return `.${Math.round(g.savePctg * 1000).toString().padStart(3, '0')}`;
}

export function gaaDisplay(g: NHLGoalieStat): string {
  if (g.goalsAgainstAvg == null) return '—';
  return g.goalsAgainstAvg.toFixed(2);
}

// MARK: - Standings

export interface NHLStandingsResponse {
  standings: NHLStanding[];
}

export interface NHLStanding {
  teamAbbrev: LocalizedString;
  teamName: LocalizedString;
  teamLogo?: string;
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  gamesPlayed: number;
  divisionName?: string;
  conferenceName?: string;
  streakCode?: string;
  streakCount?: number;
}

export function recordDisplay(s: NHLStanding): string {
  return `${s.wins}-${s.losses}-${s.otLosses}`;
}

export function streakDisplay(s: NHLStanding): string | undefined {
  if (!s.streakCode || s.streakCount == null) return undefined;
  return `${s.streakCode}${s.streakCount}`;
}

// MARK: - League Schedule

export interface NHLLeagueSchedule {
  gameWeek?: NHLGameWeekDay[];
}

export interface NHLGameWeekDay {
  date: string;
  dayAbbrev?: string;
  numberOfGames?: number;
  games: NHLScheduledGame[];
}

// MARK: - Playoff Bracket

export interface NHLPlayoffBracketResponse {
  series?: NHLPlayoffSeries[];
}

export interface NHLPlayoffSeries {
  seriesLetter?: string;
  seriesTitle?: string;
  playoffRound: number;
  topSeedWins?: number;
  bottomSeedWins?: number;
  topSeedTeam?: NHLPlayoffTeam;
  bottomSeedTeam?: NHLPlayoffTeam;
}

export interface NHLPlayoffTeam {
  abbrev?: string;
  name?: LocalizedString;
  logo?: string;
  darkLogo?: string;
}

export function seriesIsComplete(s: NHLPlayoffSeries): boolean {
  const t = s.topSeedWins ?? 0;
  const b = s.bottomSeedWins ?? 0;
  return t === 4 || b === 4;
}
