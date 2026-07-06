import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import type { RootStackScreenProps } from '../../types/navigation';
import { wasteMeta } from '../../constants/waste';
import { guideFor, quizFor, quizMaxPoints } from '../../constants/learn';

const BG    = '#F3F8F5';
const WHITE = '#FFFFFF';
const TEXT  = '#0F172A';
const MUTED = '#64748B';

export default function GuideScreen({ navigation, route }: RootStackScreenProps<'Guide'>) {
  const { wasteType } = route.params;
  const guide = guideFor(wasteType);
  const meta = wasteMeta(wasteType);
  const quiz = quizFor(wasteType);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerKicker}>{meta.label} · {guide.readMinutes} min read</Text>
          <Text style={styles.headerTitle}>{guide.title}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Hero ── */}
        <View style={[styles.heroCard, { backgroundColor: meta.color }]}>
          <View style={styles.heroIconBox}>
            <MaterialCommunityIcons name={meta.icon as any} size={30} color={WHITE} />
          </View>
          <Text style={styles.heroText}>{guide.intro}</Text>
        </View>

        {/* ── Do ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Do</Text>
          {guide.dos.map((item) => (
            <View key={item} style={styles.pointRow}>
              <View style={[styles.pointIcon, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="checkmark" size={14} color="#16A34A" />
              </View>
              <Text style={styles.pointText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* ── Don't ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Don't</Text>
          {guide.donts.map((item) => (
            <View key={item} style={styles.pointRow}>
              <View style={[styles.pointIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="close" size={14} color="#DC2626" />
              </View>
              <Text style={styles.pointText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* ── Tip ── */}
        <View style={[styles.tipCard, { backgroundColor: meta.colorSoft }]}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={meta.color} />
          <Text style={[styles.tipText, { color: TEXT }]}>{guide.tip}</Text>
        </View>

        <View style={{ height: 4 }} />
      </ScrollView>

      {/* ── Quiz CTA ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.quizBtn, { backgroundColor: meta.color }]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Quiz', { wasteType })}
        >
          <Ionicons name="help-circle-outline" size={20} color={WHITE} />
          <Text style={styles.quizBtnText}>
            Take the quiz · earn up to {quizMaxPoints(quiz)} pts
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerKicker: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: MUTED,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: TEXT,
    lineHeight: 23,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  // Hero
  heroCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroIconBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12.5,
    color: WHITE,
    lineHeight: 19,
  },

  // Do / Don't cards
  card: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: TEXT,
    marginBottom: 10,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
  },
  pointIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  pointText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: TEXT,
    lineHeight: 20,
  },

  // Tip
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 16,
  },
  tipText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12.5,
    lineHeight: 19,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: BG,
  },
  quizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  quizBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: WHITE,
  },
});
