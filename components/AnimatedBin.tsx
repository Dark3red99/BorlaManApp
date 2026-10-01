import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet, View } from 'react-native';

const BODY = require('../assets/illustrations/bin-body.png');
const LID = require('../assets/illustrations/bin-lid.png');

// Source art is 300×430. The lid layer (cap, rim band and handles) is
// full-size so it lines up with the body; it hinges on the rim's bottom-left
// corner, 11.6% across and 26% down.
const ASPECT = 430 / 300;
const HINGE = '11.6% 26%';
const OPEN_DEG = -22;

type Props = {
  /** Rendered width in points; height follows the artwork's aspect ratio. */
  width?: number;
  /** Change this value to play the open-and-close animation once. */
  playKey?: number;
};

/** Green recycling bin whose lid flips open and snaps shut. */
export default function AnimatedBin({ width = 56, playKey = 0 }: Props) {
  const open = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    let anim: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled || reduce) return;
        open.setValue(0);
        anim = Animated.sequence([
          Animated.delay(350),
          Animated.timing(open, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.back(1.6)),
            useNativeDriver: true,
          }),
          Animated.delay(550),
          Animated.spring(open, {
            toValue: 0,
            friction: 5,
            tension: 120,
            useNativeDriver: true,
          }),
        ]);
        anim.start();
      });

    return () => {
      cancelled = true;
      anim?.stop();
      open.setValue(0);
    };
  }, [playKey, open]);

  const height = Math.round(width * ASPECT);
  const rotate = open.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${OPEN_DEG}deg`],
    extrapolateLeft: 'clamp', // the closing spring's overshoot must not push the lid into the body
  });
  const lift = open.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -height * 0.02],
    extrapolateLeft: 'clamp',
  });

  return (
    <View
      style={{ width, height: height + 6 }}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Recycling bin"
    >
      {/* soft ground shadow so the bin rests on the card */}
      <View style={[styles.shadow, { width: width * 0.8, left: width * 0.1 }]} />
      <Image source={BODY} style={{ width, height }} resizeMode="contain" />
      <Animated.Image
        source={LID}
        resizeMode="contain"
        style={[
          { position: 'absolute', top: 0, left: 0, width, height },
          { transformOrigin: HINGE, transform: [{ translateY: lift }, { rotate }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    position: 'absolute',
    bottom: 0,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.12)',
    transform: [{ scaleY: 0.6 }],
  },
});
