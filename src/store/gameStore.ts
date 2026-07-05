/**
 * Global game state: onboarding, gamification (hearts/XP/streak), the daily
 * free-word gate, premium entitlement, and the SRS card collection.
 *
 * Persisted to AsyncStorage via zustand's `persist` middleware so everything
 * survives app restarts. No server/accounts in v1.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CEFRLevel, Word } from '@/types';
import { todayKey, dayDiff } from '@/lib/date';
import { newCard, review, type SrsCard } from '@/lib/srs';

export const HEARTS_MAX = 5;
export const DEFAULT_DAILY_GOAL = 4; // free tier: 4 new words/day

type GameState = {
  _hasHydrated: boolean;

  // Onboarding / personalization
  onboarded: boolean;
  level: CEFRLevel;
  categories: string[]; // selected category ids
  dailyGoal: number;

  // Entitlement
  isPremium: boolean;

  // Gamification
  xp: number;
  streak: number;
  lastPlayedDate: string | null;
  hearts: number;
  heartsDate: string; // day the hearts count belongs to (for daily reset)

  // Daily free-word gate
  newWordsDate: string;
  newWordsToday: number;

  // Progress
  completedLessons: string[];
  srs: Record<string, SrsCard>;

  // --- actions ---
  setHydrated: () => void;
  ensureDailyReset: () => void;
  completeOnboarding: (input: { level: CEFRLevel; categories: string[]; dailyGoal?: number }) => void;
  setCategories: (categories: string[]) => void;
  setLevel: (level: CEFRLevel) => void;
  setPremium: (v: boolean) => void;

  canLearnNewWords: (count: number) => boolean;
  registerNewWords: (words: Word[]) => void;

  answer: (correct: boolean) => void; // XP + hearts side effects
  reviewWord: (wordId: string, correct: boolean) => void;
  completeLesson: (lessonId: string, xpReward: number) => void;

  resetAll: () => void;
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,

      onboarded: false,
      level: 'A1',
      categories: [],
      dailyGoal: DEFAULT_DAILY_GOAL,

      isPremium: false,

      xp: 0,
      streak: 0,
      lastPlayedDate: null,
      hearts: HEARTS_MAX,
      heartsDate: todayKey(),

      newWordsDate: todayKey(),
      newWordsToday: 0,

      completedLessons: [],
      srs: {},

      setHydrated: () => set({ _hasHydrated: true }),

      // Reset hearts and the daily word counter when a new day starts.
      ensureDailyReset: () => {
        const t = todayKey();
        const patch: Partial<GameState> = {};
        if (get().heartsDate !== t) {
          patch.hearts = HEARTS_MAX;
          patch.heartsDate = t;
        }
        if (get().newWordsDate !== t) {
          patch.newWordsToday = 0;
          patch.newWordsDate = t;
        }
        if (Object.keys(patch).length) set(patch);
      },

      completeOnboarding: ({ level, categories, dailyGoal }) =>
        set({ onboarded: true, level, categories, dailyGoal: dailyGoal ?? DEFAULT_DAILY_GOAL }),

      setCategories: (categories) => set({ categories }),
      setLevel: (level) => set({ level }),
      setPremium: (v) => set({ isPremium: v }),

      // Premium bypasses the cap; free users are limited to dailyGoal new words/day.
      canLearnNewWords: (count) => {
        const s = get();
        if (s.isPremium) return true;
        return s.newWordsToday + count <= s.dailyGoal;
      },

      // Add SRS cards for freshly learned words and count them against the daily gate.
      registerNewWords: (words) => {
        const s = get();
        const srs = { ...s.srs };
        let added = 0;
        for (const w of words) {
          if (!srs[w.id]) {
            srs[w.id] = newCard(w);
            added += 1;
          }
        }
        set({ srs, newWordsToday: s.newWordsToday + added, newWordsDate: todayKey() });
      },

      answer: (correct) => {
        const s = get();
        if (correct) {
          set({ xp: s.xp + 10 });
        } else if (!s.isPremium) {
          set({ hearts: Math.max(0, s.hearts - 1) });
        }
      },

      reviewWord: (wordId, correct) => {
        const s = get();
        const card = s.srs[wordId];
        if (!card) return;
        set({ srs: { ...s.srs, [wordId]: review(card, correct) } });
      },

      completeLesson: (lessonId, xpReward) => {
        const s = get();
        const t = todayKey();

        // Streak: +1 if the last play was yesterday, reset to 1 if a day was missed,
        // unchanged if already played today.
        let streak = s.streak;
        if (s.lastPlayedDate == null) streak = 1;
        else {
          const gap = dayDiff(s.lastPlayedDate, t);
          if (gap === 1) streak = s.streak + 1;
          else if (gap > 1) streak = 1;
        }

        const completed = s.completedLessons.includes(lessonId)
          ? s.completedLessons
          : [...s.completedLessons, lessonId];

        set({ xp: s.xp + xpReward, streak, lastPlayedDate: t, completedLessons: completed });
      },

      resetAll: () =>
        set({
          onboarded: false,
          level: 'A1',
          categories: [],
          dailyGoal: DEFAULT_DAILY_GOAL,
          isPremium: false,
          xp: 0,
          streak: 0,
          lastPlayedDate: null,
          hearts: HEARTS_MAX,
          heartsDate: todayKey(),
          newWordsDate: todayKey(),
          newWordsToday: 0,
          completedLessons: [],
          srs: {},
        }),
    }),
    {
      name: 'english-app-game-v1',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
      // Don't persist the hydration flag.
      partialize: ({ _hasHydrated, ...rest }) => rest,
    }
  )
);
