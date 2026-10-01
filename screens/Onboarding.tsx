import React, { useRef, useState } from 'react';
import type { ViewToken } from 'react-native';
import {
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Recycle, Truck, Award, ChevronRight } from 'lucide-react-native';
import { ScreenColors as D, Fonts } from '../constants/theme';

const { width } = Dimensions.get('window');

type Slide = {
  id: string;
  title: string;
  description: string;
  Icon: typeof Recycle;
};

const slides: Slide[] = [
  {
    id: '1',
    title: 'Sort Smarter',
    description: 'Easily categorize your waste with our intelligent sorting system. Every item counts.',
    Icon: Recycle,
  },
  {
    id: '2',
    title: 'Track in Real-Time',
    description: "Watch your collector's tricycle move toward you on the map — no guessing when they'll arrive.",
    Icon: Truck,
  },
  {
    id: '3',
    title: 'Make an Impact',
    description: 'Track your environmental contribution and earn rewards for every sustainable action.',
    Icon: Award,
  },
];

type SlideProps = {
  item: Slide;
  index: number;
  currentIndex: number;
  onNext: () => void;
  onSkip: () => void;
  onGetStarted: () => void;
  onSignIn: () => void;
};

function OnboardingSlide({ item, index, currentIndex, onNext, onSkip, onGetStarted, onSignIn }: SlideProps) {
  const isLast = index === slides.length - 1;
  const { Icon } = item;

  return (
    <View style={styles.slide}>
      {/* Illustration */}
      <View style={styles.illustrationWrap}>
        <View style={styles.iconBadge}>
          <Icon color={D.neon} size={68} strokeWidth={1.5} />
        </View>
      </View>

      {/* Floating bottom-sheet card */}
      <View style={styles.sheet}>
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, currentIndex === i && styles.dotActive]} />
          ))}
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>

        {isLast ? (
          <View style={styles.ctaGroup}>
            <TouchableOpacity style={styles.primaryBtn} onPress={onGetStarted} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Get Started</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onSignIn} activeOpacity={0.85}>
              <Text style={styles.secondaryBtnText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ctaGroup}>
            <TouchableOpacity style={styles.primaryBtn} onPress={onNext} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Continue</Text>
              <ChevronRight color={D.ink} size={20} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onSkip} activeOpacity={0.7} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export default function Onboarding({ navigation }: { navigation: any }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList<Slide> | null>(null);

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const skipToLast = () => {
    listRef.current?.scrollToIndex({ index: slides.length - 1, animated: true });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <LinearGradient colors={[D.bgTop, D.bgBottom]} style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={D.bgTop} />
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item, index }) => (
          <View style={{ width }}>
            <OnboardingSlide
              item={item}
              index={index}
              currentIndex={currentIndex}
              onNext={goToNext}
              onSkip={skipToLast}
              onGetStarted={() => navigation.navigate('Registration')}
              onSignIn={() => navigation.navigate('SignIn')}
            />
          </View>
        )}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  // ── Illustration ──
  illustrationWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: D.card,
    borderWidth: 1,
    borderColor: D.neonDim,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: D.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 8,
  },

  // ── Bottom sheet ──
  sheet: {
    backgroundColor: D.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: D.border,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: D.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: D.neon,
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 26,
    color: D.text,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  description: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: D.textMuted,
    lineHeight: 23,
    marginBottom: 32,
  },

  // ── CTAs (thumb zone) ──
  ctaGroup: {
    gap: 12,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: D.neon,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: D.neon,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryBtnText: {
    fontFamily: Fonts.bold,
    color: D.ink,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EEF5F1',
    borderWidth: 1,
    borderColor: D.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.3,
    color: D.text,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  skipText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: D.textFaint,
  },
});
