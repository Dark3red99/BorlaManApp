import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import * as learnService from '../../services/learnService';
import type { RootStackScreenProps } from '../../types/navigation';
import { wasteMeta } from '../../constants/waste';
import { quizFor, POINTS_PER_CORRECT } from '../../constants/learn';

const PRIMARY = '#059669';
const BG      = '#F3F8F5';
const WHITE   = '#FFFFFF';
const TEXT    = '#0F172A';
const MUTED   = '#64748B';
const BORDER  = '#DCE8E1';
const GREEN   = '#16A34A';
const RED     = '#DC2626';

export default function QuizScreen({ navigation, route }: RootStackScreenProps<'Quiz'>) {
  const { wasteType } = route.params;
  const { user } = useAuth();
  const quiz = quizFor(wasteType);
  const meta = wasteMeta(wasteType);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [submission, setSubmission] = useState<learnService.QuizSubmission | null>(null);

  const question = quiz.questions[index];
  const answered = selected != null;
  const isLast = index === quiz.questions.length - 1;

  const pickOption = (optionIdx: number) => {
    if (answered) return; // first tap locks the answer
    setSelected(optionIdx);
    if (optionIdx === question.answer) setCorrectCount((c) => c + 1);
  };

  const onNext = async () => {
    if (!isLast) {
      setIndex((i) => i + 1);
      setSelected(null);
      return;
    }
    setFinished(true);
    if (user) {
      const result = await learnService.submitQuiz(
        user.id,
        quiz.id,
        correctCount,
        quiz.questions.length,
      );
      setSubmission(result);
    }
  };

  // ── Results view ──
  if (finished) {
    const total = quiz.questions.length;
    const perfect = correctCount === total;
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <View style={styles.resultWrap}>
          <View style={[styles.scoreCircle, { backgroundColor: perfect ? PRIMARY : meta.color }]}>
            <Text style={styles.scoreBig}>{correctCount}/{total}</Text>
            <Text style={styles.scoreSub}>correct</Text>
          </View>
          <Text style={styles.resultTitle}>
            {perfect ? 'Perfect score!' : correctCount >= total / 2 ? 'Nice work!' : 'Keep learning!'}
          </Text>

          {submission ? (
            submission.pointsAwarded > 0 ? (
              <View style={styles.pointsPill}>
                <MaterialCommunityIcons name="leaf" size={14} color="#047857" />
                <Text style={styles.pointsPillText}>+{submission.pointsAwarded} impact points</Text>
              </View>
            ) : (
              <Text style={styles.noPointsText}>
                No new points — beat your best of {submission.result.bestScore}/{total} to earn more.
              </Text>
            )
          ) : (
            <ActivityIndicator color={PRIMARY} style={{ marginTop: 12 }} />
          )}

          {!perfect && (
            <TouchableOpacity
              style={styles.reviewLink}
              activeOpacity={0.7}
              onPress={() => navigation.replace('Guide', { wasteType })}
            >
              <Ionicons name="book-outline" size={15} color={PRIMARY} />
              <Text style={styles.reviewLinkText}>Review the {meta.label.toLowerCase()} guide</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.mainBtn}
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
            disabled={!!user && !submission}
          >
            <Text style={styles.mainBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Question view ──
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* Header + progress */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepCount}>
            Question {index + 1} of {quiz.questions.length} · {POINTS_PER_CORRECT} pts each
          </Text>
          <Text style={styles.stepTitle}>{quiz.title}</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${((index + (answered ? 1 : 0)) / quiz.questions.length) * 100}%`,
              backgroundColor: meta.color,
            },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.prompt}>{question.prompt}</Text>

        {question.options.map((option, optionIdx) => {
          const isPicked = selected === optionIdx;
          const isAnswer = optionIdx === question.answer;
          const showRight = answered && isAnswer;
          const showWrong = answered && isPicked && !isAnswer;
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.option,
                showRight && styles.optionRight,
                showWrong && styles.optionWrong,
              ]}
              onPress={() => pickOption(optionIdx)}
              disabled={answered}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.optionText,
                  showRight && { color: GREEN, fontFamily: 'Poppins_600SemiBold' },
                  showWrong && { color: RED, fontFamily: 'Poppins_600SemiBold' },
                ]}
              >
                {option}
              </Text>
              {showRight && <Ionicons name="checkmark-circle" size={20} color={GREEN} />}
              {showWrong && <Ionicons name="close-circle" size={20} color={RED} />}
            </TouchableOpacity>
          );
        })}

        {answered && (
          <View style={[styles.explainBox, { backgroundColor: meta.colorSoft }]}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={meta.color} />
            <Text style={styles.explainText}>{question.explanation}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.mainBtn, !answered && styles.mainBtnDisabled]}
          onPress={onNext}
          disabled={!answered}
          activeOpacity={0.85}
        >
          <Text style={styles.mainBtnText}>{isLast ? 'See results' : 'Next question'}</Text>
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
  stepCount: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: MUTED,
  },
  stepTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: TEXT,
    lineHeight: 24,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 20,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 4,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  prompt: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: TEXT,
    lineHeight: 25,
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  optionRight: {
    borderColor: GREEN,
    backgroundColor: '#F0FDF4',
  },
  optionWrong: {
    borderColor: RED,
    backgroundColor: '#FEF2F2',
  },
  optionText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    color: TEXT,
    lineHeight: 20,
  },
  explainBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
  },
  explainText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12.5,
    color: TEXT,
    lineHeight: 19,
  },

  // Results
  resultWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  scoreCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  scoreBig: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 32,
    color: WHITE,
    lineHeight: 40,
  },
  scoreSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  resultTitle: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 22,
    color: TEXT,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 12,
  },
  pointsPillText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#047857',
  },
  noPointsText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12.5,
    color: MUTED,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 19,
  },
  reviewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
  },
  reviewLinkText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: PRIMARY,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: BG,
  },
  mainBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#047857',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  mainBtnDisabled: {
    backgroundColor: '#A7CDBF',
    shadowOpacity: 0,
    elevation: 0,
  },
  mainBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: WHITE,
  },
});
