import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import * as pickupService from '../../services/pickupService';
import * as learnService from '../../services/learnService';
import type { PointsEntry, QuizResult } from '../../types/models';
import { wasteMeta } from '../../constants/waste';
import { GUIDES, QUIZZES, quizMaxPoints } from '../../constants/learn';
import { timeAgo } from '../../utils/datetime';

const PRIMARY = '#059669';
const AMBER   = '#F59E0B';
const BG      = '#F3F8F5';
const WHITE   = '#FFFFFF';
const TEXT    = '#0F172A';
const MUTED   = '#64748B';

export default function LearnEarnScreen({ navigation }: any) {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [ledger, setLedger] = useState<PointsEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      // same balance the Home impact tracker shows
      pickupService.getImpactStats(user.id).then((s) => setPoints(s.points));
      learnService.getQuizResults(user.id).then(setResults);
      learnService.getPointsLedger(user.id).then((entries) => setLedger(entries.slice(0, 5)));
    }, [user]),
  );

  const resultFor = (quizId: string) => results.find((r) => r.quizId === quizId);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Learn & Earn</Text>
        <Text style={styles.subtitle}>Sort smarter, quiz yourself, earn impact points</Text>

        {/* ── Points balance ── */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsIconBox}>
            <FontAwesome5 name="trophy" size={22} color={WHITE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pointsValue}>{points.toLocaleString('en-US')}</Text>
            <Text style={styles.pointsLabel}>Impact points · pickups + quizzes</Text>
          </View>
        </View>

        {/* ── Guides ── */}
        <Text style={styles.sectionTitle}>Sorting guides</Text>
        <View style={styles.card}>
          {GUIDES.map((guide, idx) => {
            const meta = wasteMeta(guide.type);
            return (
              <TouchableOpacity
                key={guide.type}
                style={[styles.row, idx < GUIDES.length - 1 && styles.rowBorder]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Guide', { wasteType: guide.type })}
              >
                <View style={[styles.rowIconBox, { backgroundColor: meta.colorSoft }]}>
                  <MaterialCommunityIcons name={meta.icon as any} size={20} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{guide.title}</Text>
                  <Text style={styles.rowSub}>{meta.label} · {guide.readMinutes} min read</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={MUTED} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Quizzes ── */}
        <Text style={styles.sectionTitle}>Quizzes</Text>
        <View style={styles.card}>
          {QUIZZES.map((quiz, idx) => {
            const meta = wasteMeta(quiz.id);
            const result = resultFor(quiz.id);
            const maxPts = quizMaxPoints(quiz);
            const perfect = result != null && result.bestScore === result.totalQuestions;
            return (
              <TouchableOpacity
                key={quiz.id}
                style={[styles.row, idx < QUIZZES.length - 1 && styles.rowBorder]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Quiz', { wasteType: quiz.id })}
              >
                <View style={[styles.rowIconBox, { backgroundColor: meta.colorSoft }]}>
                  <Ionicons name="help-circle-outline" size={20} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{quiz.title}</Text>
                  <Text style={styles.rowSub}>
                    {result
                      ? `Best ${result.bestScore}/${result.totalQuestions} · ${result.pointsEarned} pts banked`
                      : `${quiz.questions.length} questions · earn up to ${maxPts} pts`}
                  </Text>
                </View>
                {perfect ? (
                  <View style={styles.perfectBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                    <Text style={styles.perfectText}>Aced</Text>
                  </View>
                ) : (
                  <View style={styles.earnBadge}>
                    <Text style={styles.earnText}>
                      +{result ? maxPts - result.pointsEarned : maxPts}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Points history ── */}
        <Text style={styles.sectionTitle}>Points history</Text>
        <View style={styles.card}>
          {ledger.length === 0 ? (
            <View style={styles.emptyBox}>
              <FontAwesome5 name="coins" size={22} color={MUTED} />
              <Text style={styles.emptyText}>
                No points yet — complete a pickup or ace a quiz to start earning.
              </Text>
            </View>
          ) : (
            ledger.map((entry, idx) => {
              const meta = wasteMeta(entry.wasteType);
              const isPickup = entry.source === 'pickup';
              return (
                <View key={entry.id} style={[styles.row, idx < ledger.length - 1 && styles.rowBorder]}>
                  <View style={[styles.rowIconBox, { backgroundColor: isPickup ? '#D1FAE5' : '#DBEAFE' }]}>
                    {isPickup ? (
                      <MaterialCommunityIcons name="truck-fast-outline" size={19} color={PRIMARY} />
                    ) : (
                      <Ionicons name="school-outline" size={19} color="#3B82F6" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>
                      {isPickup ? `${meta.label} pickup` : `${meta.label} quiz`}
                    </Text>
                    <Text style={styles.rowSub}>{timeAgo(entry.at)}</Text>
                  </View>
                  <Text style={styles.ledgerPoints}>+{entry.points}</Text>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 26,
    color: TEXT,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: MUTED,
    marginBottom: 18,
  },

  // ── Points balance ──
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: AMBER,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: AMBER,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  pointsIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsValue: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 24,
    color: WHITE,
    lineHeight: 30,
  },
  pointsLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },

  // ── Sections ──
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: TEXT,
    marginBottom: 10,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: TEXT,
  },
  rowSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: MUTED,
    marginTop: 1,
  },

  // Quiz badges
  perfectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  perfectText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#16A34A',
  },
  earnBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  earnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#B45309',
  },

  // Ledger
  ledgerPoints: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: PRIMARY,
  },

  // Empty state
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 22,
    gap: 10,
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 18,
  },
});
