/**
 * Loads lesson content for the app.
 *
 * Order of preference:
 *   1. Local cache (AsyncStorage) — fast, free, works offline.
 *   2. AI generation via the /api/generate-lesson route (personalized to the
 *      learner's level + categories).
 *   3. Built-in SAMPLE_LESSONS fallback — so the app always works, even with no
 *      API key or no network.
 *
 * AI is only attempted when an API base URL is reachable (relative on web, or
 * EXPO_PUBLIC_API_URL on device). Otherwise we go straight to the sample.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CEFRLevel, Lesson, PlacementQuestion } from '@/types';
import { SAMPLE_LESSONS, SAMPLE_PLACEMENT_QUIZ } from '@/data/curriculum';

// On web, relative fetch hits the same dev server (which hosts the API routes).
// On device, set EXPO_PUBLIC_API_URL to your dev server URL to enable AI.
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'web' ? '' : null);

function cacheKey(lessonId: string, level: CEFRLevel, categories: string[]): string {
  return `lesson:${lessonId}:${level}:${[...categories].sort().join(',')}`;
}

/** Get a lesson: cache → AI → sample. Always resolves to a playable Lesson. */
export async function loadLesson(
  lessonId: string,
  level: CEFRLevel,
  categories: string[]
): Promise<Lesson> {
  const key = cacheKey(lessonId, level, categories);

  // 1. Cache
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) return JSON.parse(cached) as Lesson;
  } catch {
    // ignore cache read errors
  }

  // 2. AI generation (best effort)
  if (API_BASE !== null) {
    try {
      const res = await fetch(`${API_BASE}/api/generate-lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, level, categories }),
      });
      if (res.ok) {
        const lesson = (await res.json()) as Lesson;
        await AsyncStorage.setItem(key, JSON.stringify(lesson));
        return lesson;
      }
    } catch {
      // fall through to sample
    }
  }

  // 3. Sample fallback (never throws)
  const sample = SAMPLE_LESSONS[lessonId] ?? Object.values(SAMPLE_LESSONS)[0];
  return sample;
}

/** Get the placement quiz for a claimed level: AI if available, else sample. */
export async function loadPlacementQuiz(claimedLevel: CEFRLevel): Promise<PlacementQuestion[]> {
  if (API_BASE !== null) {
    try {
      const res = await fetch(`${API_BASE}/api/placement-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimedLevel }),
      });
      if (res.ok) {
        const data = (await res.json()) as { questions: PlacementQuestion[] };
        if (Array.isArray(data.questions) && data.questions.length) return data.questions;
      }
    } catch {
      // fall through
    }
  }
  return SAMPLE_PLACEMENT_QUIZ;
}
