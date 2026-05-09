import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/appStore';
import { IceBackground } from '../../src/components/IceBackground';
import { TeamLogo } from '../../src/components/TeamLogo';
import { getTeamColors, getTeamFullName, theme } from '../../src/theme';
import {
  isLive,
  isFinal,
  isFuture,
  homePowerPlay,
  awayPowerPlay,
  goalsByPeriod,
  scorerDisplay,
  assistsDisplay,
  periodLabel as goalPeriodLabel,
  type NHLGame,
  type NHLGoal,
} from '../../src/types/nhl';

// ─── Helpers ────────────────────────────────────────────────────────────────

function periodStatusLabel(game: NHLGame): string {
  const period = game.periodDescriptor?.number ?? 0;
  const type = game.periodDescriptor?.periodType ?? 'REG';
  const time = game.clock?.timeRemaining ?? '--:--';
  const inInt = game.clock?.inIntermission ?? false;

  if (isFinal(game)) return 'FINAL';
  if (inInt) return 'INTERMISSION';
  if (isFuture(game)) {
    if (game.startTimeUTC) {
      const d = new Date(game.startTimeUTC);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return 'TODAY';
  }
  if (type === 'OT') return `OT · ${time}`;
  if (type === 'SO') return 'SHOOTOUT';

  const suffixes = ['', 'ST', 'ND', 'RD'];
  const suffix = period <= 3 ? suffixes[period] ?? 'TH' : 'TH';
  return `${period}${suffix} · ${time}`;
}

function periodShortLabel(p: number): string {
  if (p === 1) return '1ST';
  if (p === 2) return '2ND';
  if (p === 3) return '3RD';
  return 'OT';
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function LiveDot({ pulsing }: { pulsing: Animated.Value }) {
  const scale = pulsing.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  return (
    <Animated.View style={[styles.liveDot, { transform: [{ scale }] }]} />
  );
}

function GoalRow({ goal, homeAbbrev }: { goal: NHLGoal; homeAbbrev: string }) {
  const abbrev = goal.teamAbbrev ?? '';
  const { primary } = getTeamColors(abbrev);
  const strength = goal.strength ?? 'EV';
  const isSpecial = strength !== 'EV';
  const strengthColor = strength === 'PP' ? '#FFD700' : '#00BFFF';

  return (
    <View style={styles.goalRow}>
      <TeamLogo abbrev={abbrev} size={36} />
      <View style={styles.goalInfo}>
        <View style={styles.goalScorerRow}>
          <Text style={styles.goalScorer}>{scorerDisplay(goal)}</Text>
          {isSpecial && (
            <View style={[styles.strengthBadge, { backgroundColor: `${strengthColor}22`, borderColor: `${strengthColor}55` }]}>
              <Text style={[styles.strengthText, { color: strengthColor }]}>{strength}</Text>
            </View>
          )}
        </View>
        <Text style={styles.goalAssists}>{assistsDisplay(goal)}</Text>
      </View>
      <View style={styles.goalTimeChip}>
        <Text style={styles.goalTimeText}>{goalPeriodLabel(goal)}</Text>
      </View>
    </View>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ScoreTab() {
  const insets = useSafeAreaInsets();
  const store = useAppStore();
  const { trackedTeam, trackedGame, isLoading, errors } = store;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { primary: homeColor } = getTeamColors(trackedGame?.homeTeam.abbrev ?? trackedTeam);
  const { primary: awayColor } = getTeamColors(trackedGame?.awayTeam.abbrev ?? '');

  // Pulsing dot animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const refresh = useCallback(async () => {
    await store.refreshScore();
  }, [store.trackedTeam]);

  // Initial load + poll every 30s when live
  useEffect(() => {
    store.loadPersistedTeam().then(() => store.refreshScore());
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (trackedGame && isLive(trackedGame)) {
      intervalRef.current = setInterval(() => {
        store.refreshScore();
      }, 30000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [trackedGame?.gameState, store.trackedTeam]);

  const game = trackedGame;
  const teamBg = getTeamColors(trackedTeam).primary;
  const bg2 = game ? getTeamColors(game.homeTeam.abbrev === trackedTeam ? game.awayTeam.abbrev : game.homeTeam.abbrev).primary : undefined;

  if (isLoading.score && !game) {
    return (
      <IceBackground teamColor={teamBg}>
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={theme.text} />
          <Text style={styles.loadingText}>Loading score…</Text>
        </View>
      </IceBackground>
    );
  }

  if (errors.score && !game) {
    return (
      <IceBackground teamColor={teamBg}>
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <Text style={styles.errorText}>{errors.score}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </IceBackground>
    );
  }

  if (!game) {
    return (
      <IceBackground teamColor={teamBg}>
        <View style={[styles.noGameContainer, { paddingTop: insets.top + 24, paddingBottom: insets.bottom }]}>
          <View style={styles.puckCircle}>
            <Text style={styles.puckEmoji}>🏒</Text>
          </View>
          <Text style={styles.noGameTitle}>No Game Tonight</Text>
          <Text style={styles.noGameSub}>{getTeamFullName(trackedTeam)} is off the ice</Text>
        </View>
      </IceBackground>
    );
  }

  const live = isLive(game);
  const final = isFinal(game);
  const ppHome = homePowerPlay(game);
  const ppAway = awayPowerPlay(game);
  const hasPP = ppHome || ppAway;
  const ppAbbrev = ppHome ? game.homeTeam.abbrev : game.awayTeam.abbrev;
  const { primary: ppColor } = getTeamColors(ppAbbrev);
  const goals = game.goals ?? [];
  const byPeriod = goalsByPeriod(game);
  const maxPeriod = Math.max(3, ...Object.keys(byPeriod).map(Number));
  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);
  const currentPeriod = game.periodDescriptor?.number ?? 0;
  const { primary: hColor } = getTeamColors(game.homeTeam.abbrev);
  const { primary: aColor } = getTeamColors(game.awayTeam.abbrev);
  const homeSog = game.homeTeam.sog;
  const awaySog = game.awayTeam.sog;

  return (
    <IceBackground teamColor={hColor} teamColor2={aColor}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading.score}
            onRefresh={refresh}
            tintColor={theme.text}
          />
        }
      >
        {/* Status pill */}
        <View style={styles.statusPill}>
          {live ? (
            <View style={styles.liveRow}>
              <LiveDot pulsing={pulseAnim} />
              <Text style={styles.liveLabel}>LIVE</Text>
            </View>
          ) : final ? (
            <Text style={styles.finalLabel}>FINAL</Text>
          ) : (
            <Text style={styles.todayLabel}>TODAY</Text>
          )}
          {game.venue?.default ? (
            <>
              <View style={styles.pillDivider} />
              <Text style={styles.venueText}>{game.venue.default}</Text>
            </>
          ) : null}
        </View>

        {/* Score card */}
        <View style={[styles.scoreCard, { borderColor: 'rgba(255,255,255,0.12)' }]}>
          {/* Gradient overlays */}
          <View style={[StyleSheet.absoluteFill, styles.scoreCardLeft, { backgroundColor: `${hColor}22` }]} />
          <View style={[StyleSheet.absoluteFill, styles.scoreCardRight, { backgroundColor: `${aColor}18` }]} />

          <Text style={styles.periodStatus}>{periodStatusLabel(game)}</Text>

          <View style={styles.teamsRow}>
            {/* Home team */}
            <View style={styles.teamCol}>
              <TeamLogo abbrev={game.homeTeam.abbrev} size={80} />
              <Text style={styles.scoreNum}>{game.homeTeam.score ?? 0}</Text>
              <Text style={styles.homeAwayLabel}>HOME</Text>
            </View>

            {/* VS divider */}
            <View style={styles.vsDivider}>
              <Text style={styles.vsText}>–</Text>
            </View>

            {/* Away team */}
            <View style={styles.teamCol}>
              <TeamLogo abbrev={game.awayTeam.abbrev} size={80} />
              <Text style={styles.scoreNum}>{game.awayTeam.score ?? 0}</Text>
              <Text style={styles.homeAwayLabel}>AWAY</Text>
            </View>
          </View>

          {/* Period dots */}
          <View style={styles.periodDots}>
            {[1, 2, 3].map((p) => (
              <View
                key={p}
                style={[
                  styles.periodDot,
                  { backgroundColor: p <= currentPeriod ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.14)' },
                ]}
              />
            ))}
          </View>

          {/* SOG row */}
          {(homeSog != null || awaySog != null) && (
            <View style={styles.sogRow}>
              <Text style={styles.sogNum}>{homeSog ?? 0}</Text>
              <Text style={styles.sogLabel}>SOG</Text>
              <Text style={styles.sogNum}>{awaySog ?? 0}</Text>
            </View>
          )}
        </View>

        {/* Power play banner */}
        {hasPP && (
          <View style={[styles.ppBanner, { backgroundColor: `${ppColor}22`, borderColor: '#FFD70055' }]}>
            <Text style={styles.ppIcon}>⚡</Text>
            <Text style={styles.ppText}>Power Play · {getTeamFullName(ppAbbrev)}</Text>
          </View>
        )}

        {/* Period breakdown */}
        {goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>BY PERIOD</Text>
            <View style={styles.periodTable}>
              <View style={styles.periodHeaderRow}>
                <View style={{ width: 56 }} />
                {periods.map((p) => (
                  <Text key={p} style={[styles.periodHeaderCell, { flex: 1 }]}>{periodShortLabel(p)}</Text>
                ))}
                <Text style={[styles.periodHeaderCell, { width: 40 }]}>TOT</Text>
              </View>
              <View style={styles.periodDivider} />
              {/* Home row */}
              <View style={styles.periodDataRow}>
                <View style={[styles.periodTeamCell, { width: 56 }]}>
                  <TeamLogo abbrev={game.homeTeam.abbrev} size={22} />
                  <Text style={styles.periodTeamAbbrev}>{game.homeTeam.abbrev}</Text>
                </View>
                {periods.map((p) => {
                  const count = byPeriod[p]?.home ?? 0;
                  return (
                    <Text key={p} style={[styles.periodCount, { flex: 1 }, count > 0 && styles.periodCountActive]}>
                      {count > 0 ? `${count}` : '–'}
                    </Text>
                  );
                })}
                <Text style={[styles.periodTotal, { width: 40 }]}>{game.homeTeam.score ?? 0}</Text>
              </View>
              <View style={styles.periodDivider} />
              {/* Away row */}
              <View style={styles.periodDataRow}>
                <View style={[styles.periodTeamCell, { width: 56 }]}>
                  <TeamLogo abbrev={game.awayTeam.abbrev} size={22} />
                  <Text style={styles.periodTeamAbbrev}>{game.awayTeam.abbrev}</Text>
                </View>
                {periods.map((p) => {
                  const count = byPeriod[p]?.away ?? 0;
                  return (
                    <Text key={p} style={[styles.periodCount, { flex: 1 }, count > 0 && styles.periodCountActive]}>
                      {count > 0 ? `${count}` : '–'}
                    </Text>
                  );
                })}
                <Text style={[styles.periodTotal, { width: 40 }]}>{game.awayTeam.score ?? 0}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Scoring plays */}
        {goals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>SCORING PLAYS</Text>
              <Text style={styles.sectionCount}>{goals.length} GOAL{goals.length === 1 ? '' : 'S'}</Text>
            </View>
            {[...goals].reverse().map((goal, i) => (
              <GoalRow key={`${goal.period}-${goal.timeInPeriod}-${i}`} goal={goal} homeAbbrev={game.homeTeam.abbrev} />
            ))}
          </View>
        )}
      </ScrollView>
    </IceBackground>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: theme.textMuted, fontSize: 14 },
  errorText: { color: '#FF6B6B', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: {
    marginTop: 12, paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  retryText: { color: theme.text, fontWeight: '600', fontSize: 14 },

  noGameContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  puckCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  puckEmoji: { fontSize: 40 },
  noGameTitle: { color: theme.text, fontSize: 22, fontWeight: '900' },
  noGameSub: { color: theme.textMuted, fontSize: 15 },

  scrollContent: { paddingHorizontal: 18, gap: 14 },

  statusPill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    alignSelf: 'center',
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF3B30' },
  liveLabel: { color: '#FF3B30', fontSize: 11, fontWeight: '900', letterSpacing: 2.5 },
  finalLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '900', letterSpacing: 2.5 },
  todayLabel: { color: '#00BFFF', fontSize: 11, fontWeight: '900', letterSpacing: 2.5 },
  pillDivider: { width: 1, height: 11, backgroundColor: 'rgba(255,255,255,0.18)' },
  venueText: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },

  scoreCard: {
    borderRadius: 28, borderWidth: 1.5,
    paddingVertical: 28, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden', gap: 16,
  },
  scoreCardLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', borderTopLeftRadius: 28, borderBottomLeftRadius: 28 },
  scoreCardRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', borderTopRightRadius: 28, borderBottomRightRadius: 28 },
  periodStatus: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '600', textAlign: 'center', letterSpacing: 0.3 },
  teamsRow: { flexDirection: 'row', alignItems: 'center' },
  teamCol: { flex: 1, alignItems: 'center', gap: 10 },
  scoreNum: { color: theme.text, fontSize: 80, fontWeight: '900', lineHeight: 88 },
  homeAwayLabel: { color: 'rgba(255,255,255,0.38)', fontSize: 9, fontWeight: '700', letterSpacing: 2.5 },
  vsDivider: { width: 44, alignItems: 'center' },
  vsText: { color: 'rgba(255,255,255,0.28)', fontSize: 36, fontWeight: '100' },
  periodDots: { flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  periodDot: { flex: 1, height: 4, borderRadius: 2 },
  sogRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  sogNum: { flex: 1, color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  sogLabel: { color: 'rgba(255,255,255,0.28)', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, width: 44, textAlign: 'center' },

  ppBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1,
  },
  ppIcon: { fontSize: 13 },
  ppText: { color: '#FFD700', fontSize: 13, fontWeight: '600' },

  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  sectionLabel: { color: 'rgba(255,255,255,0.38)', fontSize: 10, fontWeight: '700', letterSpacing: 2, paddingHorizontal: 4 },
  sectionCount: { color: 'rgba(255,255,255,0.28)', fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },

  periodTable: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  periodHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6 },
  periodHeaderCell: { color: 'rgba(255,255,255,0.38)', fontSize: 10, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
  periodDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  periodDataRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  periodTeamCell: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  periodTeamAbbrev: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700' },
  periodCount: { color: 'rgba(255,255,255,0.25)', fontSize: 14, textAlign: 'center' },
  periodCountActive: { color: theme.text, fontWeight: '700' },
  periodTotal: { color: theme.text, fontSize: 15, fontWeight: '900', textAlign: 'center' },

  goalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  goalInfo: { flex: 1, gap: 3 },
  goalScorerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goalScorer: { color: theme.text, fontSize: 15, fontWeight: '600' },
  strengthBadge: {
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 4, borderWidth: 1,
  },
  strengthText: { fontSize: 10, fontWeight: '900' },
  goalAssists: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  goalTimeChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 100,
  },
  goalTimeText: { color: 'rgba(255,255,255,0.40)', fontSize: 11, fontWeight: '500' },
});
