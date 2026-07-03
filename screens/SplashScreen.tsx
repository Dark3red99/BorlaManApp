import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Leaf } from 'lucide-react-native';
import { Colors, Fonts } from '../constants/theme';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';

const MIN_SPLASH_MS = 2500;

export default function SplashScreen({ navigation }: RootStackScreenProps<'Splash'>) {
  const fade = useRef(new Animated.Value(0)).current;
  const mountedAt = useRef(Date.now());
  const { user, initializing } = useAuth();

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Once the persisted session is restored, route past the splash:
  // returning users go straight to the Dashboard, new ones to Onboarding.
  // The brand delay runs from mount so it overlaps (not stacks on) the restore.
  useEffect(() => {
    if (initializing) return;
    const remaining = Math.max(0, MIN_SPLASH_MS - (Date.now() - mountedAt.current));
    const timer = setTimeout(
      () => navigation.replace(user ? 'Dashboard' : 'Onboarding'),
      remaining,
    );
    return () => clearTimeout(timer);
  }, [initializing, user, navigation]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={StyleSheet.absoluteFill} />
      <Animated.View style={{ opacity: fade, alignItems: 'center' }}>
        <View style={styles.logoBadge}>
          {/* @ts-ignore */}
          <Leaf color={Colors.white} size={50} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>BorlaMan</Text>
        <Text style={styles.tagline}>Smart Waste, Better Future</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 20
  },
  title: { fontFamily: Fonts.extraBold, fontSize: 38, color: '#FFF', letterSpacing: 1 },
  tagline: { fontFamily: Fonts.medium, color: 'rgba(255, 255, 255, 0.82)', fontSize: 14, marginTop: 8, letterSpacing: 0.3 }
});