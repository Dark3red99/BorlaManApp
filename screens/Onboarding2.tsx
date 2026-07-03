import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Truck, ChevronRight } from 'lucide-react-native';
import { Colors } from '../constants/theme';

export default function Onboarding2({ navigation }: any) {
  return (
    <SafeAreaView style={styles.onboardingSlide}>
      <View style={styles.illustrationContainer}>
        <BlurView intensity={20} style={styles.glassIconCard}>
          <Truck color={Colors.primary} size={60} />
        </BlurView>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>Track Your Impact</Text>
        <Text style={styles.description}>Monitor your recycling progress and see the difference you're making for the environment.</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Onboarding3')}>
          <Text style={styles.btnText}>Continue</Text>
          <ChevronRight color="#FFF" size={20} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  onboardingSlide: { flex: 1, padding: 24, alignItems: 'center', backgroundColor: '#FAFAFA' },
  illustrationContainer: { flex: 1, justifyContent: 'center' },
  glassIconCard: { width: 180, height: 180, borderRadius: 40, backgroundColor: 'rgba(30, 107, 60, 0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(30, 107, 60, 0.1)' },
  textContainer: { flex: 0.5, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  description: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 15, lineHeight: 24 },
  footer: { width: '100%', paddingBottom: 40, alignItems: 'center' },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 30 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#DDD' },
  activeDot: { width: 24, backgroundColor: Colors.primary },
  primaryBtn: { backgroundColor: Colors.primary, width: '100%', height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '700' }
});