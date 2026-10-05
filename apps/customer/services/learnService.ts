import type { PointsEntry, QuizResult, WasteType } from '@borlaman/shared/types/models';
import type { Tables } from '@borlaman/shared/types/database';
import { supabase } from './supabase';

// Learn & Earn on Supabase. Quiz scoring happens in the submit_quiz server
// function (10 points per correct answer, retakes bank only improvements);
// every point, from pickups or quizzes, is a row in points_entries.

function toResult(row: Tables<'quiz_results'>): QuizResult {
  return {
    id: row.id,
    userId: row.user_id,
    quizId: row.quiz_id,
    bestScore: row.best_score,
    totalQuestions: row.total_questions,
    pointsEarned: row.points_earned,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  };
}

export async function getQuizResults(_userId: string): Promise<QuizResult[]> {
  const { data, error } = await supabase.from('quiz_results').select('*');
  if (error) throw new Error(error.message);
  return (data ?? []).map(toResult);
}

export async function getQuizResult(userId: string, quizId: string): Promise<QuizResult | null> {
  const results = await getQuizResults(userId);
  return results.find((r) => r.quizId === quizId) ?? null;
}

export type QuizSubmission = {
  result: QuizResult;
  /** Points banked by THIS attempt: full score the first time, the
   *  improvement over the previous best on retakes, 0 otherwise. */
  pointsAwarded: number;
};

export async function submitQuiz(
  _userId: string,
  quizId: string,
  correct: number,
  totalQuestions: number,
): Promise<QuizSubmission> {
  const { data, error } = await supabase.rpc('submit_quiz', {
    p_quiz_id: quizId,
    p_correct: correct,
    p_total: totalQuestions,
  });
  const row = data?.[0];
  if (error || !row) throw new Error(error?.message ?? 'Could not save your quiz result.');
  return { result: toResult(row.result), pointsAwarded: row.points_awarded };
}

/** The unified points ledger, newest first. */
export async function getPointsLedger(_userId: string): Promise<PointsEntry[]> {
  const { data, error } = await supabase
    .from('points_entries')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((e) => ({
    id: e.id,
    source: e.source,
    points: e.points,
    at: e.created_at,
    wasteType: (e.waste_type ?? 'household') as WasteType,
  }));
}
