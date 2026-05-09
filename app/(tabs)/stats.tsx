import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
  Share,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/appStore';
import { IceBackground } from '../../src/components/IceBackground';
import { TeamLogo } from '../../src/components/TeamLogo';
import { getTeamColors, getTeamFullName, theme } from '../../src/theme';
import {
  skaterTotalPoints,
  shootingPctgDisplay,
  plusMinusDisplay,
  savePctgDisplay,
  gaaDisplay,
  recordDisplay,
  streakDisplay,
  seriesIsComplete,
  type NHLSkaterStat,
  type NHLGoalieStat,
  type NHLStanding,
  type NHLPlayoffSeries,
} from '../../src/types/nhl';

type StatsFilter = 'skaters' | 'goalies' | 'standings' | 'playoffs';

type PlayerDetail =
  | { type: 'skater'; player: NHLSkaterStat; rank: number }
  | { type: 'goalie'; player: NHLGoalieStat; rank: number };

// ─── Playoff position helpers ────────────────────────────────────────────────

function buildPlayoffSet(allStandings: NHLStanding[]): Set<string> {
  const set = new Set<string>();
  const conferences: string[][] = [
    ['Atlantic', 'Metropolitan'],
    ['Central', 'Pacific'],
  ];
  for (const conf of conferences) {
    const wildcards: { abbrev: string; pts: number }[] = [];
    for (const div of conf) {
      const divTeams = allStandings
        .filter((t) => t.divisionName === div)
        .sort((a, b) => b.points - a.points);
      divTeams.forEach((t, i) => {
        if (i < 3) set.add(t.teamAbbrev.default);
        else wildcards.push({ abbrev: t.teamAbbrev.default, pts: t.points });
      });
    }
    wildcards
      .sort((a, b) => b.pts - a.pts)
      .slice(0, 2)
      .forEach((w) => set.add(w.abbrev));
  }
  return set;
}

function pointsBack(team: NHLStanding, allStandings: NHLStanding[]): number | null {
  const confDivs = ['Atlantic', 'Metropolitan'].includes(team.divisionName ?? '')
    ? ['Atlantic', 'Metropolitan']
    : ['Central', 'Pacific'];
  const confTeams = allStandings
    .filter((t) => confDivs.includes(t.divisionName ?? ''))
    .sort((a, b) => b.points - a.points);
  const lastSpot = confTeams[7];
  if (!lastSpot) return null;
  const diff = lastSpot.points - team.points;
  return diff >= 0 ? diff + 1 : null;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FilterPicker({
  filter,
  onChange,
}: {
  filter: StatsFilter;
  onChange: (f: StatsFilter) => void;
}) {
  const tabs: { key: StatsFilter; label: string }[] = [
    { key: 'skaters', label: 'Skaters' },
    { key: 'goalies', label: 'Goalies' },
    { key: 'standings', label: 'Standings' },
    { key: 'playoffs', label: 'Playoffs' },
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

function ColumnHeader({ labels }: { labels: string[] }) {
  return (
    <View style={styles.colHeaderRow}>
      <View style={{ width: 38 }} />
      {labels.map((label, i) => (
        <Text
          key={i}
          style={[
            styles.colHeaderText,
            i === 0 ? { flex: 1, textAlign: 'left' } : { width: i < labels.length - 1 ? 36 : 44, textAlign: 'center' },
          ]}
        >
          {label}
        </Text>
      ))}
    </View>
  );
}

function PointsBar({ points, maxPoints, isTop, primary }: {
  points: number;
  maxPoints: number;
  isTop: boolean;
  primary: string;
}) {
  const pct = maxPoints > 0 ? Math.max(0.03, points / maxPoints) : 0.03;
  const color = isTop ? '#FFD700' : primary;
  return (
    <View style={styles.pointsBarBg}>
      <View style={[styles.pointsBarFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function SkaterRow({
  player,
  rank,
  maxPoints,
  primary,
  isFav,
  onToggleFav,
  onPress,
}: {
  player: NHLSkaterStat;
  rank: number;
  maxPoints: number;
  primary: string;
  isFav: boolean;
  onToggleFav: () => void;
  onPress: () => void;
}) {
  const pts = skaterTotalPoints(player);
  const isTop = rank === 1;

  return (
    <TouchableOpacity
      style={[
        styles.playerRow,
        isFav && styles.playerRowFav,
        isTop && !isFav && styles.playerRowTop,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.rankCircle}>
        {player.headshot ? (
          <Image source={{ uri: player.headshot }} style={styles.headshot} />
        ) : (
          <View style={[styles.headshotFallback, { backgroundColor: `${primary}22` }]}>
            <Text style={[styles.rankText, { color: primary }]}>{rank}</Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.skaterTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.playerName} numberOfLines={1}>
              {player.firstName.default} {player.lastName.default}
            </Text>
            <Text style={styles.playerPos}>{player.positionCode}</Text>
          </View>
          <Text style={[styles.statNum, { width: 36, textAlign: 'center' }]}>{player.goals}</Text>
          <Text style={[styles.statNum, { width: 36, textAlign: 'center' }]}>{player.assists}</Text>
          <Text style={[styles.statNumBig, { width: 40, textAlign: 'center', color: isTop ? '#FFD700' : theme.text }]}>
            {pts}
          </Text>
          <TouchableOpacity style={styles.favBtn} onPress={onToggleFav}>
            <Text style={{ fontSize: 14, color: isFav ? '#FFD700' : 'rgba(255,255,255,0.22)' }}>
              {isFav ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        </View>
        <PointsBar points={pts} maxPoints={maxPoints} isTop={isTop} primary={primary} />
      </View>
    </TouchableOpacity>
  );
}

function GoalieRow({
  player,
  rank,
  isFav,
  onToggleFav,
  onPress,
}: {
  player: NHLGoalieStat;
  rank: number;
  isFav: boolean;
  onToggleFav: () => void;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.playerRow, isFav && styles.playerRowFav]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {player.headshot ? (
        <Image source={{ uri: player.headshot }} style={styles.headshot} />
      ) : (
        <View style={[styles.headshotFallback, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={styles.playerName} numberOfLines={1}>
          {player.firstName.default} {player.lastName.default}
        </Text>
        <Text style={styles.playerPos}>G · {player.gamesPlayed} GP</Text>
      </View>

      <Text style={[styles.statNum, { width: 36, textAlign: 'center' }]}>
        {player.wins ?? '—'}
      </Text>
      <Text style={[styles.statNum, { width: 44, textAlign: 'center' }]}>
        {savePctgDisplay(player)}
      </Text>
      <Text style={[styles.statNum, { width: 44, textAlign: 'center' }]}>
        {gaaDisplay(player)}
      </Text>
      <TouchableOpacity style={styles.favBtn} onPress={onToggleFav}>
        <Text style={{ fontSize: 14, color: isFav ? '#FFD700' : 'rgba(255,255,255,0.22)' }}>
          {isFav ? '★' : '☆'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function StandingRow({
  team,
  rank,
  isTracked,
  inPlayoffs,
  ptsBack,
  primary,
}: {
  team: NHLStanding;
  rank: number;
  isTracked: boolean;
  inPlayoffs: boolean;
  ptsBack: number | null;
  primary: string;
}) {
  const streak = streakDisplay(team);
  const isWin = streak?.startsWith('W');
  const showIndicator = isTracked && (inPlayoffs || ptsBack != null);
  return (
    <View style={[styles.standingRow, isTracked && { borderColor: `${primary}88`, borderWidth: 1.5 }]}>
      <View style={styles.standingMainRow}>
        <Text style={styles.standingRank}>{rank}</Text>
        <TeamLogo abbrev={team.teamAbbrev.default} size={28} />
        <Text style={[styles.standingAbbrev, { flex: 1 }]}>{team.teamAbbrev.default}</Text>
        {streak ? (
          <Text style={[styles.standingStreak, { color: isWin ? '#4cd964' : '#ff3b30' }]}>
            {streak}
          </Text>
        ) : (
          <View style={{ width: 30 }} />
        )}
        <Text style={styles.standingRecord}>{recordDisplay(team)}</Text>
        <Text style={[styles.standingPts, { color: isTracked ? primary : theme.text }]}>{team.points}</Text>
      </View>
      {showIndicator && (
        <View style={styles.playoffIndicator}>
          {inPlayoffs ? (
            <Text style={styles.playoffIn}>✓ In playoff position</Text>
          ) : (
            <Text style={styles.playoffOut}>↑ {ptsBack} pt{ptsBack === 1 ? '' : 's'} back of playoffs</Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Player detail modal ─────────────────────────────────────────────────────

function posLabel(code: string): string {
  switch (code) {
    case 'C': return 'Center';
    case 'L': return 'Left Wing';
    case 'R': return 'Right Wing';
    case 'D': return 'Defense';
    default: return code;
  }
}

function PlayerDetailModal({
  detail,
  teamAbbrev,
  visible,
  onClose,
}: {
  detail: PlayerDetail | null;
  teamAbbrev: string;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { primary } = getTeamColors(teamAbbrev);

  if (!detail) return null;

  const isSkater = detail.type === 'skater';
  const player = detail.player;
  const name = `${player.firstName.default} ${player.lastName.default}`;
  const pos = isSkater ? posLabel((player as NHLSkaterStat).positionCode) : 'Goalie';
  const headshot = player.headshot;
  const rankColor =
    detail.rank === 1 ? '#FFD700'
    : detail.rank === 2 ? '#C8C8C8'
    : detail.rank === 3 ? '#CD853F'
    : 'rgba(255,255,255,0.35)';

  let statItems: { label: string; value: string }[];
  if (isSkater) {
    const s = player as NHLSkaterStat;
    const pts = skaterTotalPoints(s);
    const ppg = s.gamesPlayed > 0 ? (pts / s.gamesPlayed).toFixed(2) : '—';
    statItems = [
      { label: 'GOALS',   value: `${s.goals}` },
      { label: 'ASSISTS', value: `${s.assists}` },
      { label: 'POINTS',  value: `${pts}` },
      { label: 'GAMES',   value: `${s.gamesPlayed}` },
      { label: '+/-',     value: plusMinusDisplay(s) },
      { label: 'S%',      value: shootingPctgDisplay(s) },
      { label: 'PPG',     value: ppg },
      { label: 'GWG',     value: `${s.gameWinningGoals ?? 0}` },
    ];
  } else {
    const g = player as NHLGoalieStat;
    statItems = [
      { label: 'WINS',   value: g.wins   != null ? `${g.wins}`   : '—' },
      { label: 'SV%',    value: savePctgDisplay(g) },
      { label: 'GAA',    value: gaaDisplay(g) },
      { label: 'GAMES',  value: `${g.gamesPlayed}` },
      { label: 'LOSSES', value: g.losses   != null ? `${g.losses}`   : '—' },
      { label: 'SO',     value: g.shutouts != null ? `${g.shutouts}` : '—' },
    ];
  }

  // Pair stats into rows of 2 for a compact grid
  const pairs: [typeof statItems[0], typeof statItems[0] | null][] = [];
  for (let i = 0; i < statItems.length; i += 2) {
    pairs.push([statItems[i], statItems[i + 1] ?? null]);
  }

  const handleShare = async () => {
    const lines = statItems.map((s) => `${s.label}: ${s.value}`).join('\n');
    await Share.share({
      message: `${name} · ${getTeamFullName(teamAbbrev)}\n${pos}\n\n${lines}\n\n📱 via PuckTrack`,
      title: `${name} Stats`,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
          {/* Background */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#070810', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: primary, opacity: 0.13 }]} />
          </View>

          {/* Drag handle */}
          <View style={styles.dragHandle} />

          {/* Header row: headshot left, name+pos right */}
          <View style={styles.detailHeader}>
            <View style={styles.detailHeadshotWrap}>
              {headshot ? (
                <Image source={{ uri: headshot }} style={[styles.detailHeadshot, { borderColor: primary }]} />
              ) : (
                <View style={[styles.detailHeadshotFallback, { backgroundColor: `${primary}22`, borderColor: primary }]}>
                  <Text style={[styles.detailRankText, { color: primary }]}>{detail.rank}</Text>
                </View>
              )}
              <View style={[styles.detailRankBadge, { backgroundColor: rankColor }]}>
                <Text style={[styles.detailRankBadgeText, { color: detail.rank <= 3 ? '#000' : '#fff' }]}>
                  {detail.rank}
                </Text>
              </View>
            </View>
            <View style={styles.detailNameGroup}>
              <Text style={styles.detailName} numberOfLines={1}>{name}</Text>
              <Text style={styles.detailPos}>{pos.toUpperCase()}</Text>
            </View>
          </View>

          {/* 2-column stats grid */}
          <View style={styles.detailGrid}>
            {pairs.map(([a, b], rowIdx) => (
              <View key={a.label} style={styles.detailGridRow}>
                <View style={[styles.detailCell, { backgroundColor: `rgba(255,255,255,${rowIdx % 2 === 0 ? 0.08 : 0.04})` }]}>
                  <Text style={styles.detailCellLabel}>{a.label}</Text>
                  <Text style={styles.detailCellValue}>{a.value}</Text>
                </View>
                {b ? (
                  <View style={[styles.detailCell, { backgroundColor: `rgba(255,255,255,${rowIdx % 2 === 0 ? 0.05 : 0.02})` }]}>
                    <Text style={styles.detailCellLabel}>{b.label}</Text>
                    <Text style={styles.detailCellValue}>{b.value}</Text>
                  </View>
                ) : (
                  <View style={styles.detailCell} />
                )}
              </View>
            ))}
          </View>

          {/* Share button */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={styles.shareBtnText}>Share Stats</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Playoff bracket ─────────────────────────────────────────────────────────

function PlayoffSeriesCard({ series, primary }: { series: NHLPlayoffSeries; primary: string }) {
  const topAbbrev = series.topSeedTeam?.abbrev ?? '?';
  const botAbbrev = series.bottomSeedTeam?.abbrev ?? '?';
  const topName = series.topSeedTeam?.name?.default ?? topAbbrev;
  const botName = series.bottomSeedTeam?.name?.default ?? botAbbrev;
  const topWins = series.topSeedWins ?? 0;
  const botWins = series.bottomSeedWins ?? 0;
  const complete = seriesIsComplete(series);
  const topWon = complete && topWins === 4;
  const botWon = complete && botWins === 4;

  return (
    <View style={styles.seriesCard}>
      {/* Top seed */}
      <View style={styles.seriesTeamRow}>
        <TeamLogo abbrev={topAbbrev} size={32} />
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={[styles.seriesAbbrev, topWon && { color: '#FFD700' }]}>{topAbbrev}</Text>
          <Text style={styles.seriesName} numberOfLines={1}>{topName}</Text>
        </View>
        <Text style={[styles.seriesWins, topWon && { color: primary }]}>{topWins}</Text>
      </View>

      <View style={styles.seriesDivider} />

      {/* Bottom seed */}
      <View style={styles.seriesTeamRow}>
        <TeamLogo abbrev={botAbbrev} size={32} />
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={[styles.seriesAbbrev, botWon && { color: '#FFD700' }]}>{botAbbrev}</Text>
          <Text style={styles.seriesName} numberOfLines={1}>{botName}</Text>
        </View>
        <Text style={[styles.seriesWins, botWon && { color: primary }]}>{botWins}</Text>
      </View>

      {complete && (
        <View style={styles.seriesFinalBadge}>
          <Text style={styles.seriesFinalText}>FINAL</Text>
        </View>
      )}
    </View>
  );
}

function PlayoffBracket({ series, primary }: { series: NHLPlayoffSeries[]; primary: string }) {
  // Group by round, sort rounds ascending, sort series within round by letter
  const byRound = new Map<number, NHLPlayoffSeries[]>();
  for (const s of series) {
    const arr = byRound.get(s.playoffRound) ?? [];
    arr.push(s);
    byRound.set(s.playoffRound, arr);
  }
  const rounds = [...byRound.keys()].sort((a, b) => a - b);

  const roundLabel = (round: number, firstSeries: NHLPlayoffSeries): string => {
    if (firstSeries.seriesTitle) return firstSeries.seriesTitle;
    const labels: Record<number, string> = { 1: 'First Round', 2: 'Second Round', 3: 'Conference Finals', 4: 'Stanley Cup Final' };
    return labels[round] ?? `Round ${round}`;
  };

  return (
    <View style={{ gap: 24 }}>
      {rounds.map((round) => {
        const roundSeries = (byRound.get(round) ?? []).sort((a, b) =>
          (a.seriesLetter ?? '').localeCompare(b.seriesLetter ?? '')
        );
        const label = roundLabel(round, roundSeries[0]);
        return (
          <View key={round} style={{ gap: 10 }}>
            <Text style={styles.roundLabel}>{label.toUpperCase()}</Text>
            {roundSeries.map((s, i) => (
              <PlayoffSeriesCard
                key={s.seriesLetter ?? i}
                series={s}
                primary={primary}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function StatsTab() {
  const insets = useSafeAreaInsets();
  const store = useAppStore();
  const { trackedTeam, clubStats, allStandings, playoffSeries, isLoading, errors, favoritePlayerIds } = store;
  const { primary } = getTeamColors(trackedTeam);

  const [filter, setFilter] = useState<StatsFilter>('skaters');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDetail | null>(null);

  const refresh = async () => {
    if (filter === 'standings') {
      await store.refreshStandings();
    } else if (filter === 'playoffs') {
      await store.refreshPlayoffs();
    } else {
      await Promise.all([store.refreshStats(), store.refreshStandings()]);
    }
  };

  useEffect(() => {
    store.refreshStats();
    store.refreshStandings();
    store.refreshPlayoffs();
  }, [trackedTeam]);

  const skaters = [...(clubStats?.skaters ?? [])].sort((a, b) => {
    const af = favoritePlayerIds.has(a.playerId) ? 1 : 0;
    const bf = favoritePlayerIds.has(b.playerId) ? 1 : 0;
    if (af !== bf) return bf - af;
    return skaterTotalPoints(b) - skaterTotalPoints(a);
  });

  const goalies = [...(clubStats?.goalies ?? [])].sort((a, b) => {
    const af = favoritePlayerIds.has(a.playerId) ? 1 : 0;
    const bf = favoritePlayerIds.has(b.playerId) ? 1 : 0;
    if (af !== bf) return bf - af;
    return (b.wins ?? 0) - (a.wins ?? 0);
  });

  const maxPoints = Math.max(1, ...skaters.map((s) => skaterTotalPoints(s)));

  const divisionOrder = ['Atlantic', 'Metropolitan', 'Central', 'Pacific'];
  const byDivision = divisionOrder.map((div) => ({
    division: div,
    teams: allStandings
      .filter((t) => t.divisionName === div)
      .sort((a, b) => b.points - a.points),
  })).filter((d) => d.teams.length > 0);

  const playoffSet = buildPlayoffSet(allStandings);

  const isRefreshing =
    filter === 'standings' ? isLoading.standings : isLoading.stats;

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
            <Text style={styles.headerTitle}>Stats</Text>
            <Text style={styles.headerSub}>{getTeamFullName(trackedTeam)}</Text>
          </View>
          <TeamLogo abbrev={trackedTeam} size={52} />
        </View>

        {/* Filter picker */}
        <FilterPicker filter={filter} onChange={setFilter} />

        {/* Content */}
        {filter === 'skaters' && (
          isLoading.stats && !clubStats ? (
            <ActivityIndicator color={theme.text} style={{ marginTop: 60 }} />
          ) : errors.stats && !clubStats ? (
            <View style={styles.errorState}>
              <Text style={styles.errorText}>{errors.stats}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <ColumnHeader labels={['PLAYER', 'G', 'A', 'PTS']} />
              {skaters.map((player, idx) => (
                <SkaterRow
                  key={player.playerId}
                  player={player}
                  rank={idx + 1}
                  maxPoints={maxPoints}
                  primary={primary}
                  isFav={favoritePlayerIds.has(player.playerId)}
                  onToggleFav={() => store.toggleFavorite(player.playerId)}
                  onPress={() => setSelectedPlayer({ type: 'skater', player, rank: idx + 1 })}
                />
              ))}
              {skaters.length === 0 && (
                <Text style={styles.emptyText}>No skater data available</Text>
              )}
            </View>
          )
        )}

        {filter === 'goalies' && (
          isLoading.stats && !clubStats ? (
            <ActivityIndicator color={theme.text} style={{ marginTop: 60 }} />
          ) : errors.stats && !clubStats ? (
            <View style={styles.errorState}>
              <Text style={styles.errorText}>{errors.stats}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <ColumnHeader labels={['GOALIE', 'W', 'SV%', 'GAA']} />
              {goalies.map((player, idx) => (
                <GoalieRow
                  key={player.playerId}
                  player={player}
                  rank={idx + 1}
                  isFav={favoritePlayerIds.has(player.playerId)}
                  onToggleFav={() => store.toggleFavorite(player.playerId)}
                  onPress={() => setSelectedPlayer({ type: 'goalie', player, rank: idx + 1 })}
                />
              ))}
              {goalies.length === 0 && (
                <Text style={styles.emptyText}>No goalie data available</Text>
              )}
            </View>
          )
        )}

        {filter === 'standings' && (
          isLoading.standings && allStandings.length === 0 ? (
            <ActivityIndicator color={theme.text} style={{ marginTop: 60 }} />
          ) : (
            <View style={{ gap: 20 }}>
              {byDivision.map(({ division, teams }) => (
                <View key={division} style={{ gap: 6 }}>
                  <View style={styles.divisionHeader}>
                    <Text style={styles.divisionLabel}>{division.toUpperCase()}</Text>
                    <View style={styles.divisionHeaderRight}>
                      <Text style={styles.divisionColLabel}>W-L-OT</Text>
                      <Text style={[styles.divisionColLabel, { width: 34, textAlign: 'center' }]}>PTS</Text>
                    </View>
                  </View>
                  {teams.map((team, idx) => (
                    <StandingRow
                      key={team.teamAbbrev.default}
                      team={team}
                      rank={idx + 1}
                      isTracked={team.teamAbbrev.default === trackedTeam}
                      inPlayoffs={playoffSet.has(team.teamAbbrev.default)}
                      ptsBack={pointsBack(team, allStandings)}
                      primary={primary}
                    />
                  ))}
                </View>
              ))}
              {byDivision.length === 0 && (
                <Text style={styles.emptyText}>No standings data</Text>
              )}
            </View>
          )
        )}

        {filter === 'playoffs' && (
          isLoading.playoffs && playoffSeries.length === 0 ? (
            <ActivityIndicator color={theme.text} style={{ marginTop: 60 }} />
          ) : errors.playoffs && playoffSeries.length === 0 ? (
            <View style={styles.errorState}>
              <Text style={styles.errorText}>{errors.playoffs}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : playoffSeries.length === 0 ? (
            <View style={styles.playoffPlaceholder}>
              <Text style={{ fontSize: 40 }}>🏆</Text>
              <Text style={styles.playoffTitle}>Playoffs Unavailable</Text>
              <Text style={styles.playoffSub}>Check back during playoff season</Text>
            </View>
          ) : (
            <PlayoffBracket series={playoffSeries} primary={primary} />
          )
        )}
      </ScrollView>

      <PlayerDetailModal
        detail={selectedPlayer}
        teamAbbrev={trackedTeam}
        visible={selectedPlayer !== null}
        onClose={() => setSelectedPlayer(null)}
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
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  filterTabActive: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  filterTabText: { color: 'rgba(255,255,255,0.40)', fontSize: 11, fontWeight: '600' },
  filterTabTextActive: { color: theme.text },

  colHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 4,
  },
  colHeaderText: {
    color: 'rgba(255,255,255,0.32)', fontSize: 9, fontWeight: '700', letterSpacing: 1.5,
  },

  playerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  playerRowFav: { borderColor: 'rgba(255,215,0,0.35)', borderWidth: 1.5 },
  playerRowTop: {
    borderColor: 'rgba(255,215,0,0.30)',
    borderWidth: 1.5,
  },
  rankCircle: { width: 38, height: 38 },
  headshot: { width: 38, height: 38, borderRadius: 19 },
  headshotFallback: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  rankText: { fontSize: 12, fontWeight: '900', color: 'rgba(255,255,255,0.5)' },

  skaterTopRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  playerName: { color: theme.text, fontSize: 14, fontWeight: '600' },
  playerPos: { color: 'rgba(255,255,255,0.38)', fontSize: 11 },
  statNum: { color: 'rgba(255,255,255,0.80)', fontSize: 14, fontWeight: '700' },
  statNumBig: { color: theme.text, fontSize: 16, fontWeight: '900' },
  favBtn: { padding: 4, marginLeft: 4 },

  pointsBarBg: {
    height: 3, backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 2, overflow: 'hidden',
  },
  pointsBarFill: { height: 3, borderRadius: 2 },

  // Standings
  divisionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 4,
  },
  divisionHeaderRight: { flexDirection: 'row', gap: 0 },
  divisionLabel: { color: 'rgba(255,255,255,0.32)', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  divisionColLabel: { color: 'rgba(255,255,255,0.32)', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },

  standingRow: {
    padding: 10, paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    gap: 6,
  },
  standingMainRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  standingRank: { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '700', width: 18, textAlign: 'center' },
  standingAbbrev: { color: theme.text, fontSize: 14, fontWeight: '600' },
  standingStreak: { fontSize: 11, fontWeight: '600', width: 30, textAlign: 'center' },
  standingRecord: { color: 'rgba(255,255,255,0.70)', fontSize: 12, fontWeight: '500' },
  standingPts: { fontSize: 15, fontWeight: '900', width: 34, textAlign: 'center' },
  playoffIndicator: { paddingLeft: 56 },
  playoffIn: { color: '#4cd964', fontSize: 10, fontWeight: '600' },
  playoffOut: { color: '#FF9500', fontSize: 10, fontWeight: '600' },

  errorState: { alignItems: 'center', gap: 12, paddingTop: 40 },
  errorText: { color: '#FF6B6B', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: {
    paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  retryText: { color: theme.text, fontWeight: '600', fontSize: 14 },
  emptyText: { color: theme.textMuted, fontSize: 14, paddingTop: 24, textAlign: 'center' },

  playoffPlaceholder: { alignItems: 'center', gap: 12, paddingTop: 60 },
  playoffTitle: { color: theme.text, fontSize: 22, fontWeight: '900' },
  playoffSub: { color: theme.textMuted, fontSize: 15 },

  // Playoff bracket
  roundLabel: {
    color: 'rgba(255,255,255,0.38)', fontSize: 9, fontWeight: '700', letterSpacing: 2,
    paddingHorizontal: 4,
  },
  seriesCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    overflow: 'hidden',
  },
  seriesTeamRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  seriesAbbrev: { color: theme.text, fontSize: 14, fontWeight: '700' },
  seriesName: { color: 'rgba(255,255,255,0.40)', fontSize: 11 },
  seriesWins: { color: 'rgba(255,255,255,0.55)', fontSize: 22, fontWeight: '900', width: 28, textAlign: 'center' },
  seriesDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginHorizontal: 14 },
  seriesFinalBadge: {
    alignSelf: 'center', marginBottom: 10, marginTop: 4,
    paddingHorizontal: 10, paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 100,
  },
  seriesFinalText: { color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },

  // Modal
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalSheet: {
    backgroundColor: 'transparent',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    overflow: 'hidden',
    gap: 14,
  },
  dragHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
  },

  // Header: side-by-side headshot + name
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 20,
  },
  detailHeadshotWrap: { position: 'relative' },
  detailHeadshot: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2.5,
  },
  detailHeadshotFallback: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2.5, alignItems: 'center', justifyContent: 'center',
  },
  detailRankText: { fontSize: 20, fontWeight: '900' },
  detailRankBadge: {
    position: 'absolute', bottom: -2, right: -2,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 100,
  },
  detailRankBadgeText: { fontSize: 10, fontWeight: '900' },
  detailNameGroup: { flex: 1, gap: 4 },
  detailName: { color: theme.text, fontSize: 20, fontWeight: '900' },
  detailPos: { color: 'rgba(255,255,255,0.48)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },

  // 2-column stat grid
  detailGrid: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  detailGridRow: { flexDirection: 'row' },
  detailCell: {
    flex: 1, paddingVertical: 14, paddingHorizontal: 16, gap: 4,
  },
  detailCellLabel: {
    color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
  },
  detailCellValue: { color: theme.text, fontSize: 26, fontWeight: '900' },

  shareBtn: {
    marginHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: theme.text,
    borderRadius: 14, alignItems: 'center',
  },
  shareBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
});
