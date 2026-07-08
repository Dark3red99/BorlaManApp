import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalSvg } from 'react-native-svg/css';
import { Colors } from '../constants/theme';
import WaveDivider from './WaveDivider';
import heroArt from '../assets/borla-flat-vector.svg';

interface AuthHeroProps {
  /** Wide layout renders a full-height left panel instead of a top band. */
  wide?: boolean;
  /** Illustration to show; defaults to the BorlaMan flat vector. */
  asset?: ImageSourcePropType;
  artWidth?: number;
  artHeight?: number;
}

// Flat illustration header for the auth screens: pale-green surface with a
// wavy seam flowing into the white form surface. Top band on phones,
// full-height left panel (vertical seam) on wide screens.
export default function AuthHero({
  wide = false,
  asset = heroArt,
  artWidth = 186,
  artHeight = 178,
}: AuthHeroProps) {
  const insets = useSafeAreaInsets();

  if (wide) {
    return (
      <View style={[styles.panel, { paddingTop: insets.top }]}>
        <View style={styles.panelArt}>
          <LocalSvg asset={asset} width="100%" height="100%" />
        </View>
        <WaveDivider
          orientation="vertical"
          fill={Colors.background}
          style={styles.panelWave}
        />
      </View>
    );
  }

  return (
    <View style={[styles.band, { paddingTop: insets.top + 12 }]}>
      <View style={[styles.bandArt, { height: artHeight }]}>
        <LocalSvg asset={asset} width={artWidth} height={artHeight} />
      </View>
      <WaveDivider fill={Colors.background} />
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: Colors.primarySofter,
  },
  // Fixed height (set inline) so the band doesn't jump when the SVG loads.
  bandArt: {
    alignItems: 'center',
    marginBottom: 4,
  },
  panel: {
    width: '45%',
    maxWidth: 560,
    backgroundColor: Colors.primarySofter,
    justifyContent: 'center',
  },
  panelArt: {
    height: '60%',
    marginHorizontal: 40,
    marginRight: 56,
  },
  panelWave: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
  },
});
