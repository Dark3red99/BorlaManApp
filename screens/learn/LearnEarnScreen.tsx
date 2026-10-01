import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BookOpen, CircleCheck, Coins, GraduationCap, Trophy, Truck } from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';
import * as pickupService from '../../services/pickupService';
import * as learnService from '../../services/learnService';
import type { PointsEntry, QuizResult } from '../../types/models';
import { wasteMeta } from '../../constants/waste';
import { GUIDES, QUIZZES, quizMaxPoints } from '../../constants/learn';
import { timeAgo } from '../../utils/datetime';
import { Fonts, ICON_STROKE, Radius, type Palette } from '../../constants/theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import {
  Card,
  IconTile,
  ListRow,
  Pill,
  Screen,
  ScreenHeader,
  SectionHeader,
  wasteIcon,
} from '../../components/ui';

export default function LearnEarnScreen({ navigation }: any) {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [ledger, setLedger] = useState<PointsEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      // same balance the Home impact rings show
      pickupService.getImpactStats(user.id).then((s) => setPoints(s.points));
      learnService.getQuizResults(user.id).then(setResults);
      learnService.getPointsLedger(user.id).then((entries) => setLedger(entries.slice(0, 5)));
    }, [user]),
  );

  const resultFor = (quizId: string) => results.find((r) => r.quizId === quizId);
  const aced = QUIZZES.filter((q) => {
    const r = resultFor(q.id);
    return r != null && r.bestScore === r.totalQuestions;
  }).length;

  return (
    <Screen>
      <ScreenHeader title="Learn & Earn" subtitle="Sort smarter, quiz yourself, earn points" />

      {/* Points balance: the one bold accent moment on this screen */}
      <Card variant="accent">
        <View style={styles.pointsTop}>
          <View style={styles.flex}>
            <Text style={styles.pointsLabel}>Impact points</Text>
            <Text style={styles.pointsValue}>{points.toLocaleString('en-US')}</Text>
          </View>
          <View style={styles.trophy}>
            <Trophy size={26} color={ui.onAccent} strokeWidth={ICON_STROKE} />
          </View>
        </View>
        <View style={styles.pointsStats}>
          <View style={styles.pointsStat}>
            <Text style={styles.statValue}>{aced}/{QUIZZES.length}</Text>
            <Text style={styles.statLabel}>Quizzes aced</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.pointsStat}>
            <Text style={styles.statValue}>{GUIDES.length}</Text>
            <Text style={styles.statLabel}>Sorting guides</Text>
          </View>
        </View>
      </Card>

      {/* Guides */}
      <SectionHeader title="Sorting guides" />
      <Card style={styles.listCard}>
        {GUIDES.map((guide, idx) => {
          const meta = wasteMeta(guide.type);
          return (
            <ListRow
              key={guide.type}
              left={<IconTile icon={wasteIcon(guide.type)} bg={soft(meta.color, meta.colorSoft)} fg={meta.color} size={42} />}
              title={guide.title}
              subtitle={`${meta.label} · ${guide.readMinutes} min read`}
              chevron
              onPress={() => navigation.navigate('Guide', { wasteType: guide.type })}
              divider={idx < GUIDES.length - 1}
            />
          );
        })}
      </Card>

      {/* Quizzes */}
      <SectionHeader title="Quizzes" />
      <Card style={styles.listCard}>
        {QUIZZES.map((quiz, idx) => {
          const result = resultFor(quiz.id);
          const maxPts = quizMaxPoints(quiz);
          const perfect = result != null && result.bestScore === result.totalQuestions;
          return (
            <ListRow
              key={quiz.id}
              left={<IconTile icon={GraduationCap} tone={perfect ? 'accent' : 'neutral'} size={42} />}
              title={quiz.title}
              subtitle={
                result
                  ? `Best ${result.bestScore}/${result.totalQuestions} · ${result.pointsEarned} pts banked`
                  : `${quiz.questions.length} questions · up to ${maxPts} pts`
              }
              right={
                perfect ? (
                  <View style={styles.acedPill}>
                    <CircleCheck size={13} color={ui.accent} strokeWidth={2} />
                    <Text style={styles.acedText}>Aced</Text>
                  </View>
                ) : (
                  <Pill
                    label={`+${result ? maxPts - result.pointsEarned : maxPts}`}
                    color={ui.amber}
                    bg={ui.amberSoft}
                  />
                )
              }
              onPress={() => navigation.navigate('Quiz', { wasteType: quiz.id })}
              divider={idx < QUIZZES.length - 1}
            />
          );
        })}
      </Card>

      {/* Points history */}
      <SectionHeader title="Points history" />
      <Card style={styles.listCard}>
        {ledger.length === 0 ? (
          <View style={styles.empty}>
            <IconTile icon={Coins} tone="neutral" round />
            <Text style={styles.emptyText}>
              No points yet. Complete a pickup or ace a quiz to start earning.
            </Text>
          </View>
        ) : (
          ledger.map((entry, idx) => {
            const meta = wasteMeta(entry.wasteType);
            const isPickup = entry.source === 'pickup';
            return (
              <ListRow
                key={entry.id}
                left={
                  <IconTile icon={isPickup ? Truck : BookOpen} tone={isPickup ? 'accent' : 'blue'} size={42} />
                }
                title={isPickup ? `${meta.label} pickup` : `${meta.label} quiz`}
                subtitle={timeAgo(entry.at)}
                right={<Text style={styles.ledgerPoints}>+{entry.points}</Text>}
                divider={idx < ledger.length - 1}
              />
            );
          })
        )}
      </Card>
    </Screen>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
  flex: { flex: 1 },

  // Points card
  pointsTop: { flexDirection: 'row', alignItems: 'center' },
  pointsLabel: { fontFamily: Fonts.medium, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  pointsValue: {
    fontFamily: Fonts.bold,
    fontSize: 34,
    lineHeight: 42,
    color: ui.onAccent,
    letterSpacing: -0.8,
  },
  trophy: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  pointsStat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.22)' },
  statValue: { fontFamily: Fonts.bold, fontSize: 16, color: ui.onAccent },
  statLabel: { fontFamily: Fonts.regular, fontSize: 11.5, color: 'rgba(255,255,255,0.8)', marginTop: 1 },

  // Lists
  listCard: { paddingVertical: 4, paddingHorizontal: 16 },
  acedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ui.accentSoft,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  acedText: { fontFamily: Fonts.semiBold, fontSize: 11.5, color: ui.accent },
  ledgerPoints: { fontFamily: Fonts.bold, fontSize: 14, color: ui.accent },

  // Empty
  empty: { alignItems: 'center', gap: 12, paddingVertical: 22 },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: ui.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 240,
  },
});
