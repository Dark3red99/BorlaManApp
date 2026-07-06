import type { PointsEntry, QuizResult, WasteType } from '../types/models';
import { POINTS_PER_CORRECT } from '../constants/learn';
import { getRequests, pointsForPickup } from './pickupService';
import { StorageKeys, readJson, writeJson } from './storage';

// Mock Learn & Earn service — the contract for the future /learn endpoints
// (GET /me/quiz-results, POST /quizzes/:id/submit, GET /me/points). Quiz
// points land in the same balance the Home impact tracker shows: pickup
// points are derived from completed requests, quiz points from the results
// stored here, and pickupService.getImpactStats sums both.

export async function getQuizResults(userId: string): Promise<QuizResult[]> {
  const all = await readJson<QuizResult[]>(StorageKeys.quizResults, []);
  return all.filter((r) => r.userId === userId);
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
  userId: string,
  quizId: string,
  correct: number,
  totalQuestions: number,
): Promise<QuizSubmission> {
  const all = await readJson<QuizResult[]>(StorageKeys.quizResults, []);
  const existing = all.find((r) => r.userId === userId && r.quizId === quizId);
  const now = new Date().toISOString();

  if (!existing) {
    const result: QuizResult = {
      id: `qz_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      userId,
      quizId,
      bestScore: correct,
      totalQuestions,
      pointsEarned: correct * POINTS_PER_CORRECT,
      completedAt: now,
      updatedAt: now,
    };
    await writeJson(StorageKeys.quizResults, [...all, result]);
    return { result, pointsAwarded: result.pointsEarned };
  }

  const improvement = Math.max(0, correct - existing.bestScore);
  const pointsAwarded = improvement * POINTS_PER_CORRECT;
  const result: QuizResult = {
    ...existing,
    bestScore: Math.max(existing.bestScore, correct),
    pointsEarned: existing.pointsEarned + pointsAwarded,
    updatedAt: pointsAwarded > 0 ? now : existing.updatedAt,
  };
  await writeJson(
    StorageKeys.quizResults,
    all.map((r) => (r.id === result.id ? result : r)),
  );
  return { result, pointsAwarded };
}

/**
 * The unified points ledger (future GET /me/points), newest first.
 * Derived rather than stored in the mock: pickup lines come from completed
 * requests, quiz lines from quiz standings (retake improvements roll into
 * one line per quiz — the backend will keep discrete transactions).
 */
export async function getPointsLedger(userId: string): Promise<PointsEntry[]> {
  const completed = (await getRequests(userId)).filter((r) => r.status === 'completed');
  const pickupEntries: PointsEntry[] = completed.map((r) => ({
    id: `pl_${r.id}`,
    source: 'pickup',
    points: pointsForPickup(r.volumeKg),
    at: r.completedAt ?? r.createdAt,
    wasteType: r.wasteType,
  }));

  const results = await getQuizResults(userId);
  const quizEntries: PointsEntry[] = results
    .filter((r) => r.pointsEarned > 0)
    .map((r) => ({
      id: `ql_${r.id}`,
      source: 'quiz',
      points: r.pointsEarned,
      at: r.updatedAt,
      wasteType: r.quizId as WasteType,
    }));

  return [...pickupEntries, ...quizEntries].sort((a, b) => b.at.localeCompare(a.at));
}
