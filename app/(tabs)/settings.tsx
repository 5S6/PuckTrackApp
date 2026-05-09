import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/appStore';
import { IceBackground } from '../../src/components/IceBackground';
import { TeamLogo } from '../../src/components/TeamLogo';
import { getTeamColors, getTeamFullName, getTeamCity, getAllTeamAbbrevs, theme } from '../../src/theme';

const SORTED_TEAMS = getAllTeamAbbrevs().sort((a, b) =>
  getTeamCity(a).localeCompare(getTeamCity(b))
);

export default function SettingsTab() {
  const insets = useSafeAreaInsets();
  const store = useAppStore();
  const { trackedTeam, setTrackedTeam } = store;
  const { primary } = getTeamColors(trackedTeam);

  return (
    <IceBackground teamColor={primary}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Current team hero */}
        <View style={[styles.heroCard, { borderColor: `${primary}88` }]}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: primary, opacity: 0.10, borderRadius: 24 }]} />
          <Text style={styles.heroLabel}>MY TEAM</Text>
          <TeamLogo abbrev={trackedTeam} size={90} />
          <View style={styles.heroTextGroup}>
            <Text style={styles.heroName}>{getTeamFullName(trackedTeam)}</Text>
            <Text style={styles.heroAbbrev}>{trackedTeam}</Text>
          </View>
        </View>

        {/* Team picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CHANGE TEAM</Text>
          <View style={styles.grid}>
            {SORTED_TEAMS.map((abbrev) => {
              const { primary: teamPrimary } = getTeamColors(abbrev);
              const selected = abbrev === trackedTeam;
              return (
                <TouchableOpacity
                  key={abbrev}
                  style={[
                    styles.teamCell,
                    selected && { borderColor: `${teamPrimary}CC`, borderWidth: 2 },
                  ]}
                  onPress={() => setTrackedTeam(abbrev)}
                  activeOpacity={0.7}
                >
                  {selected && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: `${teamPrimary}18`, borderRadius: 18 }]} />
                  )}
                  <TeamLogo abbrev={abbrev} size={48} />
                  <Text style={styles.teamCellAbbrev}>{abbrev}</Text>
                  <Text style={styles.teamCellCity} numberOfLines={1}>
                    {getTeamCity(abbrev)}
                  </Text>
                  {selected && (
                    <View style={[styles.checkBadge, { backgroundColor: teamPrimary }]}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* About */}
        <View style={styles.about}>
          <Text style={styles.aboutIcon}>🏒</Text>
          <Text style={styles.aboutName}>PuckTrack</Text>
          <Text style={styles.aboutSub}>NHL live scores &amp; stats</Text>
        </View>
      </ScrollView>
    </IceBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, gap: 24 },

  heroCard: {
    alignItems: 'center', gap: 14,
    paddingVertical: 28,
    borderRadius: 24, borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.38)', fontSize: 10, fontWeight: '700', letterSpacing: 2.5,
  },
  heroTextGroup: { alignItems: 'center', gap: 4 },
  heroName: { color: theme.text, fontSize: 22, fontWeight: '900' },
  heroAbbrev: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '700', letterSpacing: 3 },

  section: { gap: 12 },
  sectionLabel: {
    color: 'rgba(255,255,255,0.38)', fontSize: 10, fontWeight: '700', letterSpacing: 2.5,
    paddingHorizontal: 4,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  teamCell: {
    width: '30%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    gap: 6,
    overflow: 'hidden',
  },
  teamCellAbbrev: { color: theme.text, fontSize: 12, fontWeight: '900' },
  teamCellCity: { color: 'rgba(255,255,255,0.50)', fontSize: 9, fontWeight: '500' },
  checkBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: '#fff', fontSize: 10, fontWeight: '900' },

  about: { alignItems: 'center', gap: 4, paddingVertical: 16 },
  aboutIcon: { fontSize: 24, opacity: 0.2 },
  aboutName: { color: 'rgba(255,255,255,0.28)', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  aboutSub: { color: 'rgba(255,255,255,0.18)', fontSize: 11 },
});
