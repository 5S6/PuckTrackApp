import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/appStore';
import { IceBackground } from '../../src/components/IceBackground';
import { TeamLogo } from '../../src/components/TeamLogo';
import { getTeamColors, getTeamFullName, theme } from '../../src/theme';
import { recordDisplay, streakDisplay, type NHLRosterPlayer, type NHLScheduledGame } from '../../src/types/nhl';

function positionLabel(code: string): string {
  switch (code) {
    case 'C': return 'Center';
    case 'L': return 'Left Wing';
    case 'R': return 'Right Wing';
    case 'D': return 'Defence';
    case 'G': return 'Goalie';
    default: return code;
  }
}

function positionColor(code: string): string {
  if (code === 'G') return '#FFD700';
  if (code === 'D') return '#00BFFF';
  return 'rgba(255,255,255,0.8)';
}

interface PlayerRowProps {
  player: NHLRosterPlayer;
  primary: string;
  isFav: boolean;
  onToggleFav: () => void;
}

function PlayerRow({ player, primary, isFav, onToggleFav }: PlayerRowProps) {
  const posColor = positionColor(player.positionCode);
  return (
    <View style={[styles.playerRow, isFav && styles.playerRowFav]}>
      {/* Headshot / number avatar */}
      {player.headshot ? (
        <Image
          source={{ uri: player.headshot }}
          style={[styles.headshot, { borderColor: `${primary}44` }]}
        />
      ) : (
        <View style={[styles.headshotFallback, { backgroundColor: `${primary}33`, borderColor: `${primary}44` }]}>
          <Text style={[styles.headshotNum, { color: primary }]}>
            {player.sweaterNumber != null ? `#${player.sweaterNumber}` : '—'}
          </Text>
        </View>
      )}

      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{`${player.firstName.default} ${player.lastName.default}`}</Text>
        <Text style={styles.playerPos}>{positionLabel(player.positionCode)}</Text>
      </View>

      <TouchableOpacity style={styles.favBtn} onPress={onToggleFav}>
        <Text style={{ fontSize: 18, color: isFav ? '#FFD700' : 'rgba(255,255,255,0.25)' }}>
          {isFav ? '★' : '☆'}
        </Text>
      </TouchableOpacity>

      <View style={[styles.posBadge, { backgroundColor: `${posColor}22`, borderColor: `${posColor}44` }]}>
        <Text style={[styles.posCode, { color: posColor }]}>{player.positionCode}</Text>
      </View>
    </View>
  );
}

interface GameCardProps {
  game: NHLScheduledGame;
  trackedTeam: string;
  isNext: boolean;
}

function UpcomingGameCard({ game, trackedTeam, isNext }: GameCardProps) {
  const isHome = game.homeTeam.abbrev === trackedTeam;
  const opponent = isHome ? game.awayTeam : game.homeTeam;
  const { primary: myColor } = getTeamColors(trackedTeam);
  const { primary: oppColor } = getTeamColors(opponent.abbrev);
  const network = game.tvBroadcasts?.[0]?.network ?? 'TBD';
  const startDate = new Date(game.startTimeUTC);
  const dateStr = startDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const timeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[
      styles.gameCard,
      isNext && { borderColor: `${myColor}99`, borderWidth: 1.5 },
    ]}>
      <View style={[StyleSheet.absoluteFill, {
        borderRadius: 18,
        overflow: 'hidden',
        opacity: 0.12,
      }]}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ flex: 1, backgroundColor: myColor }} />
          <View style={{ flex: 1, backgroundColor: oppColor }} />
        </View>
      </View>

      {/* My team */}
      <View style={styles.gameTeamCol}>
        <TeamLogo abbrev={trackedTeam} size={44} />
        <Text style={[styles.gameHALabel, { color: `${myColor}DD` }]}>{isHome ? 'HOME' : 'AWAY'}</Text>
      </View>

      {/* Center */}
      <View style={styles.gameCenterCol}>
        <Text style={styles.gameVsText}>{isHome ? 'vs' : '@'}</Text>
        <Text style={styles.gameDateText}>{dateStr}</Text>
        <Text style={styles.gameTimeText}>{timeStr}</Text>
        <Text style={styles.gameNetworkText}>{network}</Text>
      </View>

      {/* Opponent */}
      <View style={styles.gameTeamCol}>
        <TeamLogo abbrev={opponent.abbrev} logoURL={opponent.logo} size={44} />
        <Text style={styles.gameOppAbbrev}>{opponent.abbrev}</Text>
      </View>
    </View>
  );
}

export default function TeamTab() {
  const insets = useSafeAreaInsets();
  const store = useAppStore();
  const { trackedTeam, standing, roster, leagueWeeks, isLoading, errors, favoritePlayerIds } = store;
  const { primary } = getTeamColors(trackedTeam);

  const refresh = async () => {
    await Promise.all([store.refreshTeam(), store.refreshLeagueSchedule()]);
  };

  useEffect(() => {
    refresh();
  }, [trackedTeam]);

  const teamGames = leagueWeeks
    .flatMap((w) => w.games)
    .filter((g) => g.homeTeam.abbrev === trackedTeam || g.awayTeam.abbrev === trackedTeam);

  if (isLoading.team && !standing) {
    return (
      <IceBackground teamColor={primary}>
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={theme.text} />
        </View>
      </IceBackground>
    );
  }

  if (errors.team && !standing) {
    return (
      <IceBackground teamColor={primary}>
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <Text style={styles.errorText}>{errors.team}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </IceBackground>
    );
  }

  const chips = [
    { label: 'RECORD', value: standing ? recordDisplay(standing) : '—' },
    { label: 'PTS',    value: standing ? `${standing.points}` : '—' },
    { label: 'GP',     value: standing ? `${standing.gamesPlayed}` : '—' },
    { label: 'STREAK', value: (standing && streakDisplay(standing)) ?? '—' },
  ];

  const fwds = roster?.forwards ?? [];
  const defs = roster?.defensemen ?? [];
  const gols = roster?.goalies ?? [];

  return (
    <IceBackground teamColor={primary}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading.team} onRefresh={refresh} tintColor={theme.text} />
        }
      >
        {/* Hero */}
        <View style={styles.hero}>
          <TeamLogo abbrev={trackedTeam} size={120} />
          <Text style={styles.teamName}>{getTeamFullName(trackedTeam)}</Text>
        </View>

        {/* Record chips */}
        <View style={styles.chipsRow}>
          {chips.map((chip) => (
            <View key={chip.label} style={styles.chip}>
              <Text style={styles.chipValue}>{chip.value}</Text>
              <Text style={styles.chipLabel}>{chip.label}</Text>
            </View>
          ))}
        </View>

        {/* Upcoming games */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>UPCOMING GAMES</Text>
            <Text style={styles.sectionCount}>{teamGames.length} GAMES</Text>
          </View>
          {teamGames.length === 0 ? (
            <Text style={styles.emptyText}>
              {isLoading.leagueSchedule ? 'Loading…' : 'No upcoming games'}
            </Text>
          ) : (
            teamGames.map((game, idx) => (
              <UpcomingGameCard
                key={game.id}
                game={game}
                trackedTeam={trackedTeam}
                isNext={idx === 0}
              />
            ))
          )}
        </View>

        {/* Roster */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>ROSTER</Text>
            {roster && (
              <Text style={styles.sectionCount}>
                {(fwds.length + defs.length + gols.length)} PLAYERS
              </Text>
            )}
          </View>
          {!roster ? (
            <Text style={styles.emptyText}>No roster data</Text>
          ) : (
            <>
              {fwds.length > 0 && (
                <RosterGroup
                  title="FORWARDS"
                  players={fwds}
                  primary={primary}
                  favoritePlayerIds={favoritePlayerIds}
                  onToggleFav={(id) => store.toggleFavorite(id)}
                />
              )}
              {defs.length > 0 && (
                <RosterGroup
                  title="DEFENCE"
                  players={defs}
                  primary={primary}
                  favoritePlayerIds={favoritePlayerIds}
                  onToggleFav={(id) => store.toggleFavorite(id)}
                />
              )}
              {gols.length > 0 && (
                <RosterGroup
                  title="GOALIES"
                  players={gols}
                  primary={primary}
                  favoritePlayerIds={favoritePlayerIds}
                  onToggleFav={(id) => store.toggleFavorite(id)}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </IceBackground>
  );
}

interface RosterGroupProps {
  title: string;
  players: NHLRosterPlayer[];
  primary: string;
  favoritePlayerIds: Set<number>;
  onToggleFav: (id: number) => void;
}

function RosterGroup({ title, players, primary, favoritePlayerIds, onToggleFav }: RosterGroupProps) {
  const sorted = [...players].sort((a, b) =>
    (favoritePlayerIds.has(b.id) ? 1 : 0) - (favoritePlayerIds.has(a.id) ? 1 : 0)
  );
  return (
    <View style={styles.rosterGroup}>
      <Text style={styles.rosterGroupLabel}>{title}</Text>
      {sorted.map((player) => (
        <PlayerRow
          key={player.id}
          player={player}
          primary={primary}
          isFav={favoritePlayerIds.has(player.id)}
          onToggleFav={() => onToggleFav(player.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: '#FF6B6B', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: {
    marginTop: 12, paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  retryText: { color: theme.text, fontWeight: '600', fontSize: 14 },

  scrollContent: { paddingHorizontal: 18, gap: 16 },

  hero: { alignItems: 'center', gap: 14, paddingTop: 16, paddingBottom: 8 },
  teamName: { color: theme.text, fontSize: 26, fontWeight: '900' },

  chipsRow: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    gap: 4,
  },
  chipValue: { color: theme.text, fontSize: 18, fontWeight: '900' },
  chipLabel: { color: 'rgba(255,255,255,0.42)', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },

  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  sectionLabel: { color: 'rgba(255,255,255,0.38)', fontSize: 10, fontWeight: '700', letterSpacing: 2.5 },
  sectionCount: { color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },
  emptyText: { color: theme.textMuted, fontSize: 14, padding: 16 },

  gameCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  gameTeamCol: { flex: 1, alignItems: 'center', gap: 5 },
  gameCenterCol: { width: 96, alignItems: 'center', gap: 2 },
  gameHALabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  gameVsText: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.25)', letterSpacing: 1 },
  gameDateText: { fontSize: 13, fontWeight: '900', color: theme.text },
  gameTimeText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  gameNetworkText: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.35)' },
  gameOppAbbrev: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.85)' },

  rosterGroup: { gap: 8 },
  rosterGroupLabel: {
    color: 'rgba(255,255,255,0.28)', fontSize: 9, fontWeight: '700', letterSpacing: 2,
    paddingHorizontal: 4, paddingTop: 6,
  },

  playerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  playerRowFav: { borderColor: 'rgba(255,215,0,0.30)' },
  headshot: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1,
  },
  headshotFallback: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  headshotNum: { fontSize: 11, fontWeight: '900' },
  playerInfo: { flex: 1, gap: 2 },
  playerName: { color: theme.text, fontSize: 15, fontWeight: '600' },
  playerPos: { color: 'rgba(255,255,255,0.40)', fontSize: 12 },
  favBtn: { padding: 4 },
  posBadge: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  posCode: { fontSize: 11, fontWeight: '900' },
});
