import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  NHLGame,
  NHLStanding,
  NHLRoster,
  NHLClubStats,
  NHLScheduledGame,
  NHLGameWeekDay,
  NHLPlayoffSeries,
} from '../types/nhl';
import {
  fetchTodayScore,
  fetchStanding,
  fetchAllStandings,
  fetchRosterFull,
  fetchClubStats,
  fetchSchedule,
  fetchLeagueSchedule,
  fetchPlayoffBracket,
} from '../services/nhlService';

const TEAM_KEY = 'pucktrack_tracked_team';

interface LoadingState {
  score: boolean;
  team: boolean;
  stats: boolean;
  schedule: boolean;
  standings: boolean;
  leagueSchedule: boolean;
  playoffs: boolean;
}

interface ErrorState {
  score: string | null;
  team: string | null;
  stats: string | null;
  schedule: string | null;
  standings: string | null;
  leagueSchedule: string | null;
  playoffs: string | null;
}

interface AppStore {
  // Data
  trackedTeam: string;
  trackedGame: NHLGame | null;
  standing: NHLStanding | null;
  allStandings: NHLStanding[];
  roster: NHLRoster | null;
  clubStats: NHLClubStats | null;
  upcomingGames: NHLScheduledGame[];
  leagueWeeks: NHLGameWeekDay[];
  playoffSeries: NHLPlayoffSeries[];
  favoritePlayerIds: Set<number>;

  // Loading/error
  isLoading: LoadingState;
  errors: ErrorState;

  // Actions
  setTrackedTeam: (abbrev: string) => void;
  refreshScore: () => Promise<void>;
  refreshTeam: () => Promise<void>;
  refreshStandings: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshSchedule: () => Promise<void>;
  refreshLeagueSchedule: () => Promise<void>;
  refreshPlayoffs: () => Promise<void>;
  toggleFavorite: (playerId: number) => void;
  loadPersistedTeam: () => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  trackedTeam: 'BOS',
  trackedGame: null,
  standing: null,
  allStandings: [],
  roster: null,
  clubStats: null,
  upcomingGames: [],
  leagueWeeks: [],
  playoffSeries: [],
  favoritePlayerIds: new Set(),

  isLoading: {
    score: false,
    team: false,
    stats: false,
    schedule: false,
    standings: false,
    leagueSchedule: false,
    playoffs: false,
  },
  errors: {
    score: null,
    team: null,
    stats: null,
    schedule: null,
    standings: null,
    leagueSchedule: null,
    playoffs: null,
  },

  setTrackedTeam: (abbrev: string) => {
    set({
      trackedTeam: abbrev,
      trackedGame: null,
      standing: null,
      roster: null,
      clubStats: null,
      upcomingGames: [],
    });
    AsyncStorage.setItem(TEAM_KEY, abbrev).catch(() => {});
  },

  loadPersistedTeam: async () => {
    try {
      const saved = await AsyncStorage.getItem(TEAM_KEY);
      if (saved) set({ trackedTeam: saved });
    } catch {}
  },

  refreshScore: async () => {
    const { trackedTeam } = get();
    set((s) => ({ isLoading: { ...s.isLoading, score: true }, errors: { ...s.errors, score: null } }));
    try {
      const game = await fetchTodayScore(trackedTeam);
      set((s) => ({ trackedGame: game, isLoading: { ...s.isLoading, score: false } }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load score';
      set((s) => ({ isLoading: { ...s.isLoading, score: false }, errors: { ...s.errors, score: msg } }));
    }
  },

  refreshTeam: async () => {
    const { trackedTeam } = get();
    set((s) => ({ isLoading: { ...s.isLoading, team: true }, errors: { ...s.errors, team: null } }));
    try {
      const [standing, roster] = await Promise.all([
        fetchStanding(trackedTeam),
        fetchRosterFull(trackedTeam).catch(() => null),
      ]);
      set((s) => ({ standing, roster, isLoading: { ...s.isLoading, team: false } }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load team';
      set((s) => ({ isLoading: { ...s.isLoading, team: false }, errors: { ...s.errors, team: msg } }));
    }
  },

  refreshStandings: async () => {
    set((s) => ({ isLoading: { ...s.isLoading, standings: true }, errors: { ...s.errors, standings: null } }));
    try {
      const allStandings = await fetchAllStandings();
      set((s) => ({ allStandings, isLoading: { ...s.isLoading, standings: false } }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load standings';
      set((s) => ({ isLoading: { ...s.isLoading, standings: false }, errors: { ...s.errors, standings: msg } }));
    }
  },

  refreshStats: async () => {
    const { trackedTeam } = get();
    set((s) => ({ isLoading: { ...s.isLoading, stats: true }, errors: { ...s.errors, stats: null } }));
    try {
      const clubStats = await fetchClubStats(trackedTeam);
      set((s) => ({ clubStats, isLoading: { ...s.isLoading, stats: false } }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load stats';
      set((s) => ({ isLoading: { ...s.isLoading, stats: false }, errors: { ...s.errors, stats: msg } }));
    }
  },

  refreshSchedule: async () => {
    const { trackedTeam } = get();
    set((s) => ({ isLoading: { ...s.isLoading, schedule: true }, errors: { ...s.errors, schedule: null } }));
    try {
      const upcomingGames = await fetchSchedule(trackedTeam);
      set((s) => ({ upcomingGames, isLoading: { ...s.isLoading, schedule: false } }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load schedule';
      set((s) => ({ isLoading: { ...s.isLoading, schedule: false }, errors: { ...s.errors, schedule: msg } }));
    }
  },

  refreshLeagueSchedule: async () => {
    set((s) => ({ isLoading: { ...s.isLoading, leagueSchedule: true }, errors: { ...s.errors, leagueSchedule: null } }));
    try {
      const data = await fetchLeagueSchedule();
      const leagueWeeks = data.gameWeek ?? [];
      set((s) => ({ leagueWeeks, isLoading: { ...s.isLoading, leagueSchedule: false } }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load league schedule';
      set((s) => ({ isLoading: { ...s.isLoading, leagueSchedule: false }, errors: { ...s.errors, leagueSchedule: msg } }));
    }
  },

  refreshPlayoffs: async () => {
    set((s) => ({ isLoading: { ...s.isLoading, playoffs: true }, errors: { ...s.errors, playoffs: null } }));
    try {
      const data = await fetchPlayoffBracket();
      const playoffSeries = data.series ?? [];
      set((s) => ({ playoffSeries, isLoading: { ...s.isLoading, playoffs: false } }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load playoff bracket';
      set((s) => ({ isLoading: { ...s.isLoading, playoffs: false }, errors: { ...s.errors, playoffs: msg } }));
    }
  },

  toggleFavorite: (playerId: number) => {
    set((s) => {
      const next = new Set(s.favoritePlayerIds);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return { favoritePlayerIds: next };
    });
  },
}));
