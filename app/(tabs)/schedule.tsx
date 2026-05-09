import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../src/store/appStore';
import { IceBackground } from '../../src/components/IceBackground';
import { TeamLogo } from '../../src/components/TeamLogo';
import { getTeamColors, getTeamFullName, theme } from '../../src/theme';
import { recordDisplay, type NHLScheduledGame, type NHLScheduleTeam } from '../../src/types/nhl';

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

type ScheduleFilter = 'myTeam' | 'allGames';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function networkDisplay(game: NHLScheduledGame): string {
  return game.tvBroadcasts?.[0]?.network ?? 'TBD';
}

function isPlayoffGame(game: NHLScheduledGame): boolean {
  return Math.floor(game.id / 10000) % 100 === 3;
}

function playoffRound(game: NHLScheduledGame): number {
  return Math.floor(game.id % 10000) / 100;
}

function gameDate(game: NHLScheduledGame): Date {
  return new Date(game.startTimeUTC);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDateFull(date: Date): string {
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString([], { month: 'short' }).toUpperCase();
}

function formatDay(date: Date): string {
  return date.getDate().toString();
}

function formatWeekday(date: Date): string {
  return date.toLocaleDateString([], { weekday: 'short' }).toUpperCase();
}

function formatWeekDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FilterPicker({
  filter,
  onChange,
}: {
  filter: ScheduleFilter;
  onChange: (f: ScheduleFilter) => void;
}) {
  const tabs: { key: ScheduleFilter; label: string }[] = [
    { key: 'myTeam', label: 'My Team' },
    { key: 'allGames', label: 'All Games' },
  ];
  return (
    <View style={styles.filterRow}>
      {tabs.map((tab) => {
        const active = filter === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, active && styles.filterTabActive]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function HomeAwayBadge({ isHome }: { isHome: boolean }) {
  const color = isHome ? '#00BFFF' : '#FF9500';
  return (
    <View style={[styles.haBadge, { backgroundColor: `${color}22`, borderColor: `${color}44` }]}>
      <Text style={[styles.haBadgeText, { color }]}>{isHome ? 'HOME' : 'AWAY'}</Text>
    </View>
  );
}

function DateBlock({ date }: { date: Date | null }) {
  if (!date) return <View style={styles.dateBlock}><Text style={styles.dateBlockTBD}>TBD</Text></View>;
  return (
    <View style={styles.dateBlock}>
      <Text style={styles.dateBlockMonth}>{formatMonth(date)}</Text>
      <Text style={styles.dateBlockDay}>{formatDay(date)}</Text>
      <Text style={styles.dateBlockWday}>{formatWeekday(date)}</Text>
    </View>
  );
}

function NextGameHero({
  game,
  trackedTeam,
  primary,
  onPress,
}: {
  game: NHLScheduledGame;
  trackedTeam: string;
  primary: string;
  onPress: () => void;
}) {
  const isHome = game.homeTeam.abbrev === trackedTeam;
  const opponent = isHome ? game.awayTeam : game.homeTeam;
  const oppColor = getTeamColors(opponent.abbrev).primary;
  const date = gameDate(game);

  return (
    <TouchableOpacity style={styles.heroCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[hexToRgba(primary, 0.22), hexToRgba(oppColor, 0.16)] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
      />

      {/* Top label */}
      <View style={styles.heroTopRow}>
        <Text style={styles.heroLabel}>⭐ NEXT GAME</Text>
        <HomeAwayBadge isHome={isHome} />
      </View>

      {/* Teams row */}
      <View style={styles.heroTeamsRow}>
        <View style={styles.heroTeamCol}>
          <TeamLogo abbrev={trackedTeam} size={72} />
          <Text style={styles.heroTeamAbbrev}>{trackedTeam}</Text>
        </View>

        <View style={styles.heroCenterCol}>
          <Text style={styles.heroVs}>VS</Text>
          <Text style={styles.heroTime}>{formatTime(date)}</Text>
        </View>

        <View style={styles.heroTeamCol}>
          <TeamLogo abbrev={opponent.abbrev} logoURL={opponent.logo} size={72} />
          <Text style={styles.heroTeamAbbrev}>{opponent.abbrev}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.heroFooter}>
        <Text style={styles.heroFooterText}>📅 {formatDateFull(date)}</Text>
        <Text style={styles.heroFooterText}>📺 {networkDisplay(game)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function GameCard({
  game,
  trackedTeam,
  onPress,
}: {
  game: NHLScheduledGame;
  trackedTeam: string;
  onPress: () => void;
}) {
  const isHome = game.homeTeam.abbrev === trackedTeam;
  const opponent = isHome ? game.awayTeam : game.homeTeam;
  const date = gameDate(game);

  return (
    <TouchableOpacity style={styles.gameCard} onPress={onPress} activeOpacity={0.8}>
      <DateBlock date={date} />
      <View style={styles.gameCardDivider} />
      <View style={{ flex: 1, gap: 5 }}>
        <View style={styles.gameCardTop}>
          <HomeAwayBadge isHome={isHome} />
          <Text style={styles.gameCardOpponent} numberOfLines={1}>
            {getTeamFullName(opponent.abbrev)}
          </Text>
        </View>
        <View style={styles.gameCardMeta}>
          <Text style={styles.gameCardMetaText}>🕐 {formatTime(date)}</Text>
          <Text style={styles.gameCardMetaDot}>·</Text>
          <Text style={styles.gameCardMetaText}>📺 {networkDisplay(game)}</Text>
        </View>
      </View>
      <TeamLogo abbrev={opponent.abbrev} logoURL={opponent.logo} size={46} />
    </TouchableOpacity>
  );
}

function LeagueGameCard({
  game,
  trackedTeam,
  onPress,
}: {
  game: NHLScheduledGame;
  trackedTeam: string;
  onPress: () => void;
}) {
  const isTracked =
    game.homeTeam.abbrev === trackedTeam || game.awayTeam.abbrev === trackedTeam;
  const awayColor = getTeamColors(game.awayTeam.abbrev).primary;
  const homeColor = getTeamColors(game.homeTeam.abbrev).primary;
  const date = gameDate(game);

  return (
    <TouchableOpacity
      style={[
        styles.leagueCard,
        isTracked && { borderColor: `${awayColor}66`, borderWidth: 1.5 },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[
          hexToRgba(awayColor, isTracked ? 0.22 : 0.10),
          hexToRgba(homeColor, isTracked ? 0.22 : 0.10),
        ] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
      />

      {/* Away team */}
      <View style={styles.leagueTeamCol}>
        <TeamLogo abbrev={game.awayTeam.abbrev} logoURL={game.awayTeam.logo} size={44} />
        <Text style={styles.leagueTeamAbbrev}>{game.awayTeam.abbrev}</Text>
      </View>

      {/* Center */}
      <View style={styles.leagueCenterCol}>
        <Text style={styles.leagueAt}>@</Text>
        <Text style={styles.leagueTime}>{formatTime(date)}</Text>
        <Text style={styles.leagueNetwork}>{networkDisplay(game)}</Text>
      </View>

      {/* Home team */}
      <View style={styles.leagueTeamCol}>
        <TeamLogo abbrev={game.homeTeam.abbrev} logoURL={game.homeTeam.logo} size={44} />
        <Text style={styles.leagueTeamAbbrev}>{game.homeTeam.abbrev}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Game detail modal ───────────────────────────────────────────────────────

function GameDetailModal({
  game,
  trackedTeam,
  visible,
  onClose,
}: {
  game: NHLScheduledGame | null;
  trackedTeam: string;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const store = useAppStore();

  if (!game) return null;

  const playoffs = isPlayoffGame(game);
  const round = playoffRound(game);
  const date = gameDate(game);
  const awayColor = getTeamColors(game.awayTeam.abbrev).primary;
  const homeColor = getTeamColors(game.homeTeam.abbrev).primary;

  const awayRecord = store.allStandings.find(
    (s) => s.teamAbbrev.default === game.awayTeam.abbrev,
  );
  const homeRecord = store.allStandings.find(
    (s) => s.teamAbbrev.default === game.homeTeam.abbrev,
  );

  function TeamCol({ team, isHome, record }: { team: NHLScheduleTeam; isHome: boolean; record?: string }) {
    return (
      <View style={styles.detailTeamCol}>
        <TeamLogo abbrev={team.abbrev} logoURL={team.logo} size={68} />
        <Text style={styles.detailTeamName} numberOfLines={2}>
          {getTeamFullName(team.abbrev)}
        </Text>
        {record && <Text style={styles.detailTeamRecord}>{record}</Text>}
        <View style={[styles.haBadge, { backgroundColor: isHome ? '#00BFFF22' : '#FF950022', borderColor: isHome ? '#00BFFF44' : '#FF950044' }]}>
          <Text style={[styles.haBadgeText, { color: isHome ? '#00BFFF' : '#FF9500' }]}>
            {isHome ? 'HOME' : 'AWAY'}
          </Text>
        </View>
      </View>
    );
  }

  function InfoCell({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
      <View style={styles.infoCell}>
        <Text style={styles.infoCellIcon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoCellLabel}>{label}</Text>
          <Text style={styles.infoCellValue} numberOfLines={1}>{value}</Text>
        </View>
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
          {/* Background gradient */}
          <View style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#080C15' }]} />
            <LinearGradient
              colors={[hexToRgba(awayColor, 0.30), hexToRgba(homeColor, 0.22)] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>

          <View style={styles.dragHandle} />

          {/* Context badge */}
          <View style={styles.contextBadge}>
            <Text style={[styles.contextBadgeText, { color: playoffs ? '#FFD700' : 'rgba(255,255,255,0.55)' }]}>
              {playoffs
                ? round > 0
                  ? `🏆 PLAYOFFS · ROUND ${round}`
                  : '🏆 PLAYOFFS'
                : '🏒 REGULAR SEASON'}
            </Text>
          </View>

          {/* Teams matchup */}
          <View style={styles.detailTeamsRow}>
            <TeamCol team={game.awayTeam} isHome={false} record={awayRecord ? recordDisplay(awayRecord) : undefined} />
            <View style={styles.detailCenter}>
              <Text style={styles.detailAt}>@</Text>
              <Text style={styles.detailTime}>{formatTime(date)}</Text>
            </View>
            <TeamCol team={game.homeTeam} isHome={true} record={homeRecord ? recordDisplay(homeRecord) : undefined} />
          </View>

          {/* Info grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <InfoCell icon="📅" label="DATE" value={formatDateFull(date)} />
              <InfoCell icon="📺" label="NETWORK" value={networkDisplay(game)} />
            </View>
            <View style={styles.infoRow}>
              <InfoCell icon="📍" label="VENUE" value={game.venue?.default ?? 'TBD'} />
              <InfoCell icon="🕐" label="TIME" value={formatTime(date)} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ScheduleTab() {
  const insets = useSafeAreaInsets();
  const store = useAppStore();
  const { trackedTeam, upcomingGames, leagueWeeks, isLoading, errors } = store;
  const { primary } = getTeamColors(trackedTeam);

  const [filter, setFilter] = useState<ScheduleFilter>('myTeam');
  const [selectedGame, setSelectedGame] = useState<NHLScheduledGame | null>(null);

  const refresh = async () => {
    if (filter === 'myTeam') {
      await Promise.all([store.refreshSchedule(), store.refreshLeagueSchedule()]);
    } else {
      await store.refreshLeagueSchedule();
    }
  };

  useEffect(() => {
    store.refreshSchedule();
    store.refreshLeagueSchedule();
    store.refreshStandings();
  }, [trackedTeam]);

  const isRefreshing =
    filter === 'myTeam' ? isLoading.schedule : isLoading.leagueSchedule;

  const myTeamGames = upcomingGames.length > 0
    ? upcomingGames
    : leagueWeeks
        .flatMap((w) => w.games)
        .filter((g) => g.homeTeam.abbrev === trackedTeam || g.awayTeam.abbrev === trackedTeam);

  return (
    <IceBackground teamColor={primary}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={theme.text} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Schedule</Text>
            <Text style={styles.headerSub}>
              {filter === 'myTeam' ? getTeamFullName(trackedTeam) : 'Around the League'}
            </Text>
          </View>
          {filter === 'myTeam' ? (
            <TeamLogo abbrev={trackedTeam} size={52} />
          ) : (
            <Text style={{ fontSize: 28, opacity: 0.35 }}>🏒</Text>
          )}
        </View>

        {/* Filter */}
        <FilterPicker filter={filter} onChange={setFilter} />

        {/* My Team games */}
        {filter === 'myTeam' && (
          isLoading.schedule && myTeamGames.length === 0 ? (
            <ActivityIndicator color={theme.text} style={{ marginTop: 60 }} />
          ) : myTeamGames.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40 }}>📅</Text>
              <Text style={styles.emptyTitle}>No Upcoming Games</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {myTeamGames.map((game, idx) =>
                idx === 0 ? (
                  <NextGameHero
                    key={game.id}
                    game={game}
                    trackedTeam={trackedTeam}
                    primary={primary}
                    onPress={() => setSelectedGame(game)}
                  />
                ) : (
                  <GameCard
                    key={game.id}
                    game={game}
                    trackedTeam={trackedTeam}
                    onPress={() => setSelectedGame(game)}
                  />
                )
              )}
            </View>
          )
        )}

        {/* All games */}
        {filter === 'allGames' && (
          isLoading.leagueSchedule && leagueWeeks.length === 0 ? (
            <ActivityIndicator color={theme.text} style={{ marginTop: 60 }} />
          ) : leagueWeeks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40 }}>📅</Text>
              <Text style={styles.emptyTitle}>No Games Scheduled</Text>
            </View>
          ) : (
            <View style={{ gap: 20 }}>
              {leagueWeeks
                .filter((w) => w.games.length > 0)
                .map((week) => (
                  <View key={week.date} style={{ gap: 8 }}>
                    <Text style={styles.dayLabel}>{formatWeekDate(week.date)}</Text>
                    {week.games.map((game) => (
                      <LeagueGameCard
                        key={game.id}
                        game={game}
                        trackedTeam={trackedTeam}
                        onPress={() => setSelectedGame(game)}
                      />
                    ))}
                  </View>
                ))}
            </View>
          )
        )}
      </ScrollView>

      <GameDetailModal
        game={selectedGame}
        trackedTeam={trackedTeam}
        visible={selectedGame !== null}
        onClose={() => setSelectedGame(null)}
      />
    </IceBackground>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 18, gap: 14 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  headerTitle: { color: theme.text, fontSize: 32, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },

  filterRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  filterTab: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 12 },
  filterTabActive: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  filterTabText: { color: 'rgba(255,255,255,0.40)', fontSize: 14, fontWeight: '600' },
  filterTabTextActive: { color: theme.text },

  haBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 100, borderWidth: 1,
  },
  haBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  // Hero card
  heroCard: {
    borderRadius: 24, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5, borderColor: 'rgba(0,191,255,0.45)',
    gap: 0,
  },
  heroTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12,
  },
  heroLabel: { color: '#00BFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  heroTeamsRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 4 },
  heroTeamCol: { flex: 1, alignItems: 'center', gap: 8 },
  heroTeamAbbrev: { color: theme.text, fontSize: 13, fontWeight: '900' },
  heroCenterCol: { width: 90, alignItems: 'center', gap: 4 },
  heroVs: { color: 'rgba(255,255,255,0.30)', fontSize: 11, fontWeight: '900', letterSpacing: 3 },
  heroTime: { color: theme.text, fontSize: 22, fontWeight: '900' },
  heroFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 12, paddingBottom: 18,
  },
  heroFooterText: { color: 'rgba(255,255,255,0.50)', fontSize: 12 },

  // Regular game card
  gameCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  gameCardDivider: { width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.08)' },
  dateBlock: { width: 44, alignItems: 'center', gap: 0 },
  dateBlockMonth: { color: 'rgba(255,255,255,0.40)', fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },
  dateBlockDay: { color: theme.text, fontSize: 24, fontWeight: '900' },
  dateBlockWday: { color: 'rgba(255,255,255,0.40)', fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },
  dateBlockTBD: { color: 'rgba(255,255,255,0.40)', fontSize: 11, fontWeight: '600' },
  gameCardTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  gameCardOpponent: { color: theme.text, fontSize: 14, fontWeight: '600', flex: 1 },
  gameCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gameCardMetaText: { color: 'rgba(255,255,255,0.42)', fontSize: 12 },
  gameCardMetaDot: { color: 'rgba(255,255,255,0.25)', fontSize: 12 },

  // League game card
  leagueCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  leagueTeamCol: { flex: 1, alignItems: 'center', gap: 5 },
  leagueTeamAbbrev: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '900' },
  leagueCenterCol: { width: 88, alignItems: 'center', gap: 2 },
  leagueAt: { color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  leagueTime: { color: theme.text, fontSize: 17, fontWeight: '900' },
  leagueNetwork: { color: 'rgba(255,255,255,0.38)', fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },

  dayLabel: { color: 'rgba(255,255,255,0.40)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, paddingHorizontal: 4 },

  emptyState: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyTitle: { color: theme.textMuted, fontSize: 18, fontWeight: '900' },

  // Modal
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalSheet: {
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingTop: 12, overflow: 'hidden', gap: 18,
  },
  dragHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
  },

  contextBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  contextBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },

  detailTeamsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  detailTeamCol: { flex: 1, alignItems: 'center', gap: 6 },
  detailTeamName: { color: 'rgba(255,255,255,0.70)', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  detailTeamRecord: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '700' },
  detailCenter: { width: 80, alignItems: 'center', gap: 4 },
  detailAt: { color: 'rgba(255,255,255,0.30)', fontSize: 14, fontWeight: '900' },
  detailTime: { color: theme.text, fontSize: 20, fontWeight: '900' },

  infoGrid: { gap: 10, paddingHorizontal: 20 },
  infoRow: { flexDirection: 'row', gap: 10 },
  infoCell: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  infoCellIcon: { fontSize: 16 },
  infoCellLabel: { color: 'rgba(255,255,255,0.32)', fontSize: 8, fontWeight: '700', letterSpacing: 1.2 },
  infoCellValue: { color: theme.text, fontSize: 13, fontWeight: '600' },
});
