import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface Props {
  teamColor: string;
  teamColor2?: string;
  children: React.ReactNode;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function IceBackground({ teamColor, teamColor2, children }: Props) {
  // Use hexToRgba(color, 0) instead of 'transparent' — prevents React Native
  // from interpolating through rgba(0,0,0,0) which creates visible grey banding.
  const c1 = hexToRgba(teamColor, 0.26);
  const c1off = hexToRgba(teamColor, 0);
  const c2 = teamColor2 ? hexToRgba(teamColor2, 0.18) : null;
  const c2off = teamColor2 ? hexToRgba(teamColor2, 0) : null;

  return (
    <View style={styles.root}>
      <View style={[StyleSheet.absoluteFill, styles.base]} />

      <LinearGradient
        colors={[c1, c1off] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {c2 && c2off && (
        <LinearGradient
          colors={[c2off, c2] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  base: { backgroundColor: '#070810' },
});
