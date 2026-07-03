import React, { useState, useRef } from 'react';
import type { ViewToken } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// ─── Color Palette ────────────────────────────────────────────────
const COLORS = {
  primary: '#059669',
  primaryDark: '#047857',
  primaryLight: '#10B981',
  accent: '#F59E0B',
  white: '#FFFFFF',
  lightGray: '#F6FAF8',
  textDark: '#0F172A',
  textMid: '#5B6B63',
  textLight: '#94A89E',
  buttonSecondary: '#E3F3EA',
};

const FONTS = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
};

// ─── Slide Data ────────────────────────────────────────────────────
type Slide = {
  id: string;
  type: string;
  title: string;
  description: string;
  image: string | null;
  imageEmoji: string;
  isLast?: boolean;
};

type OnboardingSlideProps = {
  item: Slide;
  currentIndex: number;
  onNext: () => void;
  onSkip: () => void;
  onGetStarted: () => void;
  onSignIn: () => void;
};

const slides: Slide[] = [
  {
    id: '1',
    type: 'onboarding',
    title: 'Sort Smarter',
    description:
      'Easily categorize your waste with our intelligent sorting system. Every item counts.',
    // Replace with your actual asset: require('./assets/sort.png')
    image: null,
    imageEmoji: '♻️',
  },
  {
    id: '2',
    type: 'onboarding',
    title: 'Track in Real-Time',
    description:
      'Monitor your pickup status live. Know exactly when we\'ll arrive at your doorstep.',
    image: null,
    imageEmoji: '🚚',
  },
  {
    id: '3',
    type: 'onboarding',
    title: 'Make an Impact',
    description:
      'Track your environmental contribution and earn rewards for every sustainable action.',
    image: null,
    imageEmoji: '🌱',
    isLast: true,
  },
];

// ─── Splash Screen ─────────────────────────────────────────────────
const SplashSlide = () => (
  <View style={styles.splashContainer}>
    {/* Decorative blobs */}
    <View style={[styles.blob, styles.blobTopRight]} />
    <View style={[styles.blob, styles.blobBottomLeft]} />

    {/* Logo */}
    <View style={styles.logoWrapper}>
      <View style={styles.logoBox}>
        <Text style={styles.logoIcon}>🗑️</Text>
      </View>
    </View>

    <Text style={styles.splashTitle}>BorlaMan</Text>
    <Text style={styles.splashSubtitle}>Clean-Tech Waste Management</Text>

    {/* Dot indicators */}
    <View style={styles.splashDots}>
      <View style={[styles.dot, styles.dotActive]} />
      <View style={styles.dot} />
    </View>
  </View>
);

// ─── Onboarding Slide ──────────────────────────────────────────────
const OnboardingSlide = ({ item, currentIndex, onNext, onSkip, onGetStarted, onSignIn }: OnboardingSlideProps) => {
  const isLast = item.isLast ?? false;

  return (
    <View style={styles.onboardingContainer}>
      {/* Illustration Card */}
      <View style={styles.illustrationCard}>
        <View style={styles.illustrationInner}>
          <Text style={styles.illustrationEmoji}>{item.imageEmoji}</Text>
        </View>
      </View>

      {/* Text Block */}
      <View style={styles.textBlock}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
      </View>

      {/* Dot Progress */}
      <View style={styles.dotsRow}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              currentIndex === i ? styles.progressDotActive : styles.progressDotInactive,
            ]}
          />
        ))}
      </View>

      {/* CTAs */}
      {isLast ? (
        <View style={styles.lastCTAWrapper}>
          <TouchableOpacity style={styles.primaryButton} onPress={onGetStarted} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onSignIn} activeOpacity={0.85}>
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.ctaWrapper}>
          <TouchableOpacity style={styles.primaryButton} onPress={onNext} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ─── Main Component ────────────────────────────────────────────────
export default function BorlaManOnboarding({ navigation }: { navigation: any }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide> | null>(null);

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const skipToLast = () => {
    flatListRef.current?.scrollToIndex({ index: slides.length - 1, animated: true });
  };

  const handleGetStarted = () => {
    navigation.navigate('Registration');
  };

  const handleSignIn = () => {
   navigation.navigate('SignIn');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }: { item: Slide }) => {
          return (
            <View style={{ width }}>
              <OnboardingSlide
                item={item}
                currentIndex={currentIndex}
                onNext={goToNext}
                onSkip={skipToLast}
                onGetStarted={handleGetStarted}
                onSignIn={handleSignIn}
              />
            </View>
          );
        }}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },

  // ── Splash ──
  splashContainer: {
    width,
    height,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  blobTopRight: {
    top: -60,
    right: -80,
  },
  blobBottomLeft: {
    bottom: 60,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  logoWrapper: {
    marginBottom: 24,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  logoIcon: {
    fontSize: 36,
  },
  splashTitle: {
    fontFamily: FONTS.extraBold,
    fontSize: 36,
    color: COLORS.white,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  splashSubtitle: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  splashDots: {
    flexDirection: 'row',
    marginTop: 48,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: COLORS.white,
    width: 24,
    borderRadius: 4,
  },

  // ── Onboarding ──
  onboardingContainer: {
    width,
    height,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 48,
    paddingTop: height * 0.08,
  },
  illustrationCard: {
    width: width - 56,
    height: (width - 56) * 0.65,
    borderRadius: 24,
    backgroundColor: '#EEF6F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    overflow: 'hidden',
  },
  illustrationInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationEmoji: {
    fontSize: 80,
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  slideTitle: {
    fontFamily: FONTS.extraBold,
    fontSize: 26,
    color: COLORS.textDark,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  slideDescription: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.textMid,
    textAlign: 'center',
    lineHeight: 23,
  },

  // ── Dots ──
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 32,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  progressDotActive: {
    width: 28,
    backgroundColor: COLORS.primary,
  },
  progressDotInactive: {
    width: 8,
    backgroundColor: '#C8DDD0',
  },

  // ── Buttons ──
  ctaWrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  lastCTAWrapper: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    fontFamily: FONTS.bold,
    color: COLORS.white,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.buttonSecondary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  skipText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textLight,
    paddingVertical: 4,
  },
});