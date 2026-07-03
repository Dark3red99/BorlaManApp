import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';

const { width, height } = Dimensions.get('window');
const PRIMARY     = '#059669';
const MID_GREEN   = '#10B981';
const LIGHT_GREEN = '#ECFDF5';
const TEXT        = '#0F172A';
const WHITE       = '#FFFFFF';

// ─── Animated SVG components ───────────────────────────────────────────
const AnimatedPath = Animated.createAnimatedComponent(Path);

// ─── Confetti config ───────────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#059669', '#6EE7B7', '#F59E0B',
  '#60A5FA', '#FDE68A', '#A7F3D0',
  '#FCA5A5', '#C4B5FD',
];
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 20) + 10,
  startY: -30 - Math.random() * 80,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: Math.random() * 9 + 5,
  delay: Math.random() * 700,
  duration: Math.random() * 900 + 1600,
  isRect: i % 3 === 0,
  rotate: Math.random() * 360,
}));

// ─── ConfettiPiece ─────────────────────────────────────────────────────
function ConfettiPiece({ item }: { item: typeof CONFETTI[0] }) {
  const translateY = useRef(new Animated.Value(item.startY)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const rotate     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(item.delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1, duration: 200,
          useNativeDriver: true, easing: Easing.out(Easing.ease),
        }),
        Animated.timing(translateY, {
          toValue: height * 0.75,
          duration: item.duration,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
        Animated.timing(rotate, {
          toValue: 1, duration: item.duration,
          useNativeDriver: true, easing: Easing.linear,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0, duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: [`${item.rotate}deg`, `${item.rotate + 360}deg`] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: item.x,
        top: 0,
        width: item.size,
        height: item.isRect ? item.size * 1.6 : item.size,
        borderRadius: item.isRect ? 2 : item.size / 2,
        backgroundColor: item.color,
        opacity,
        transform: [{ translateY }, { rotate: spin }],
      }}
    />
  );
}

// ─── Animated Checkmark Circle ─────────────────────────────────────────
// Flat solid circle (no gradient/"orb" look) + a single soft shadow for
// depth, with the checkmark stroke drawing in after a spring pop-in.
const CHECK_PATH_LEN = 46; // length of the checkmark path below

function CheckmarkCircle() {
  const checkProgress = useRef(new Animated.Value(CHECK_PATH_LEN)).current;
  const scaleAnim      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1, useNativeDriver: true,
        damping: 9, stiffness: 170, delay: 150,
      }),
      Animated.timing(checkProgress, {
        toValue: 0, duration: 380,
        useNativeDriver: false, easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
      <Svg width={56} height={56} viewBox="0 0 56 56">
        <AnimatedPath
          d="M 12 29 L 23 40 L 44 16"
          stroke={WHITE}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={CHECK_PATH_LEN}
          strokeDashoffset={checkProgress}
        />
      </Svg>
    </Animated.View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────
export default function RegistrationSuccess({ navigation, route }: RootStackScreenProps<'RegistrationSuccess'>) {
  const userName = route.params?.name ?? 'there';

  // Staggered entrance anims
  const logoAnim    = useRef(new Animated.Value(0)).current;
  const titleAnim   = useRef(new Animated.Value(0)).current;
  const subAnim     = useRef(new Animated.Value(0)).current;
  const cardsAnim   = useRef(new Animated.Value(0)).current;
  const btnAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const stagger = (anim: Animated.Value, delay: number) =>
      Animated.timing(anim, {
        toValue: 1, duration: 500, delay,
        useNativeDriver: true, easing: Easing.out(Easing.back(1.4)),
      });

    Animated.stagger(180, [
      stagger(logoAnim,  400),
      stagger(titleAnim, 600),
      stagger(subAnim,   750),
      stagger(cardsAnim, 900),
      stagger(btnAnim,   1100),
    ]).start();
  }, []);

  const fadeSlide = (anim: Animated.Value, fromY = 24) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [fromY, 0] }) }],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* ── Confetti layer ── */}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        {CONFETTI.map((item) => <ConfettiPiece key={item.id} item={item} />)}
      </View>

      <View style={styles.container}>

        {/* ── Top decoration strip ── */}
        <View style={styles.topStrip}>
          <View style={styles.stripDot} />
          <View style={[styles.stripDot, { backgroundColor: MID_GREEN, width: 32, borderRadius: 4 }]} />
          <View style={styles.stripDot} />
        </View>

        {/* ── Checkmark ── */}
        <View style={styles.checkWrapper}>
          <CheckmarkCircle />
        </View>

        {/* ── Heading ── */}
        <Animated.Text style={[styles.heading, fadeSlide(titleAnim)]}>
          You're All Set! 🎉
        </Animated.Text>

        <Animated.Text style={[styles.subHeading, fadeSlide(subAnim)]}>
          Welcome to BorlaMan,{'\n'}
          <Text style={styles.nameHighlight}>{userName}</Text>
          {' '}— your account is ready.
        </Animated.Text>

        {/* ── Info cards ── */}
        <Animated.View style={[styles.infoCards, fadeSlide(cardsAnim)]}>
          {[
            { icon: 'calendar-outline',   color: '#3B82F6', bg: '#EFF6FF', text: 'Schedule waste pickups' },
            { icon: 'leaf-outline',        color: '#16A34A', bg: '#F0FDF4', text: 'Track your eco impact'   },
            { icon: 'trophy-outline',      color: '#F59E0B', bg: '#FFFBEB', text: 'Earn impact points'      },
          ].map((item, i) => (
            <View key={i} style={styles.infoCard}>
              <View style={[styles.infoIconBox, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.infoText}>{item.text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── CTA Button ── */}
        <Animated.View style={[styles.btnWrapper, fadeSlide(btnAnim, 16)]}>
          <TouchableOpacity
            style={styles.dashBtn}
            activeOpacity={0.85}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] })}
          >
            <Text style={styles.dashBtnText}>Go to Dashboard</Text>
            <Ionicons name="arrow-forward" size={18} color={WHITE} />
          </TouchableOpacity>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: WHITE,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 24,
  },

  // Top decorative dots
  topStrip: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
    alignItems: 'center',
  },
  stripDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A7F3D0',
  },

  // Checkmark area
  checkWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  // Text
  heading: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 28,
    color: TEXT,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 36,
  },
  subHeading: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#5B6B63',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  nameHighlight: {
    fontFamily: 'Poppins_700Bold',
    color: PRIMARY,
  },

  // Info cards
  infoCards: {
    width: '100%',
    gap: 10,
    marginBottom: 36,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: LIGHT_GREEN,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#D7EFE2',
  },
  infoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: TEXT,
  },

  // Button
  btnWrapper: {
    width: '100%',
  },
  dashBtn: {
    height: 58,
    backgroundColor: PRIMARY,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: PRIMARY,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  dashBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: WHITE,
    letterSpacing: 0.2,
  },
});