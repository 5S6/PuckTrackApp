import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { getTeamColors } from '../theme';

interface Props {
  abbrev: string;
  logoURL?: string | null;
  size: number;
}

function nhlLogoURL(abbrev: string): string {
  return `https://assets.nhle.com/logos/nhl/svg/${abbrev}_light.svg`;
}

export function TeamLogo({ abbrev, logoURL, size }: Props) {
  const { primary } = getTeamColors(abbrev);
  const fontSize = Math.max(8, Math.round(size * 0.32));
  const [failed, setFailed] = useState(false);

  const uri = logoURL ?? nhlLogoURL(abbrev);
  const isSvg = uri.toLowerCase().includes('.svg');

  if (!failed && isSvg) {
    return (
      <SvgUri
        uri={uri}
        width={size}
        height={size}
        onError={() => setFailed(true)}
      />
    );
  }

  if (!failed) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size }}
        resizeMode="contain"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${primary}33`,
          borderColor: `${primary}55`,
        },
      ]}
    >
      <Text style={[styles.abbrev, { fontSize, color: primary }]} numberOfLines={1}>
        {abbrev}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  abbrev: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
});
