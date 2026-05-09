import type {
  NHLScoreboard,
  NHLGame,
  NHLClubSchedule,
  NHLScheduledGame,
  NHLStandingsResponse,
  NHLStanding,
  NHLRoster,
  NHLRosterPlayer,
  NHLClubStats,
  NHLLeagueSchedule,
  NHLPlayoffBracketResponse,
} from '../types/nhl';

const BASE = 'https://api-web.nhle.com/v1';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`NHL API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// Returns current season ID like "20252026"
function currentSeasonID(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based
  return month >= 10 ? `${year}${year + 1}` : `${year - 1}${year}`;
}

// Returns the season-end year for the playoff bracket endpoint
function playoffYear(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 10 ? year + 1 : year;
}

function nextMonthSlug(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

const COMPLETED_STATES = new Set(['OFF', 'FINAL', 'OVER']);

async function fetchMonthSchedule(teamAbbrev: string, month: string): Promise<NHLScheduledGame[]> {
  const data = await get<NHLClubSchedule>(`/club-schedule/${teamAbbrev}/month/${month}`);
  return data.games ?? [];
}

// MARK: - Public API

export async function fetchTodayScore(teamAbbrev: string): Promise<NHLGame | null> {
  try {
    const data = await get<NHLScoreboard>('/score/now');
    const game = data.games.find(
      (g) =>
        g.homeTeam.abbrev === teamAbbrev || g.awayTeam.abbrev === teamAbbrev
    );
    return game ?? null;
  } catch {
    return null;
  }
}

export async function fetchStanding(teamAbbrev: string): Promise<NHLStanding | null> {
  try {
    const standings = await fetchAllStandings();
    return standings.find((s) => s.teamAbbrev.default === teamAbbrev) ?? null;
  } catch {
    return null;
  }
}

export async function fetchAllStandings(): Promise<NHLStanding[]> {
  const data = await get<NHLStandingsResponse>('/standings/now');
  return data.standings;
}

export async function fetchRoster(teamAbbrev: string): Promise<NHLRosterPlayer[]> {
  const data = await get<NHLRoster>(`/roster/${teamAbbrev}/current`);
  return [
    ...(data.forwards ?? []),
    ...(data.defensemen ?? []),
    ...(data.goalies ?? []),
  ];
}

export async function fetchRosterFull(teamAbbrev: string): Promise<NHLRoster> {
  return get<NHLRoster>(`/roster/${teamAbbrev}/current`);
}

export async function fetchClubStats(teamAbbrev: string): Promise<NHLClubStats | null> {
  try {
    const season = currentSeasonID();
    return await get<NHLClubStats>(`/club-stats/${teamAbbrev}/${season}/2`);
  } catch {
    return null;
  }
}

export async function fetchSchedule(teamAbbrev: string): Promise<NHLScheduledGame[]> {
  const cur = await fetchMonthSchedule(teamAbbrev, 'now');
  const next = await fetchMonthSchedule(teamAbbrev, nextMonthSlug()).catch(() => []);
  return [...cur, ...next]
    .filter((g) => !COMPLETED_STATES.has(g.gameState ?? ''))
    .sort((a, b) => a.startTimeUTC.localeCompare(b.startTimeUTC));
}

export async function fetchLeagueSchedule(): Promise<NHLLeagueSchedule> {
  return get<NHLLeagueSchedule>('/schedule/now');
}

export async function fetchPlayoffBracket(): Promise<NHLPlayoffBracketResponse> {
  return get<NHLPlayoffBracketResponse>(`/playoff-bracket/${playoffYear()}`);
}
