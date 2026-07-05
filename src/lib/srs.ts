/**
 * Spaced-Repetition scheduling (a simplified Leitner / SM-2 system).
 *
 * Each learned word has a "card" tracking how well it's known. Correct answers
 * push the review further out; a mistake resets it to be seen again soon.
 * This is the core of long-term retention (see the pedagogy section of the plan).
 */

import { addDays, todayKey, dayDiff } from './date';
import type { Word } from '@/types';

export type SrsCard = {
  wordId: string;
  en: string;
  he: string;
  example: string;
  box: number; // Leitner box 0..5 — higher = better known
  due: string; // YYYY-MM-DD next review date
  reps: number; // total review count
  lapses: number; // times forgotten
};

// Interval (in days) for each Leitner box.
const BOX_INTERVALS = [0, 1, 2, 4, 8, 16, 32];
const MAX_BOX = BOX_INTERVALS.length - 1;

/** Create a fresh card for a newly learned word (due today so it enters review). */
export function newCard(word: Word, today = todayKey()): SrsCard {
  return { wordId: word.id, en: word.en, he: word.he, example: word.example, box: 0, due: today, reps: 0, lapses: 0 };
}

/** Update a card after a review. Correct → promote a box; wrong → drop to box 0. */
export function review(card: SrsCard, correct: boolean, today = todayKey()): SrsCard {
  const box = correct ? Math.min(card.box + 1, MAX_BOX) : 0;
  return {
    ...card,
    box,
    reps: card.reps + 1,
    lapses: card.lapses + (correct ? 0 : 1),
    due: addDays(today, BOX_INTERVALS[box]),
  };
}

/** Cards whose review date is today or earlier. */
export function dueCards(cards: SrsCard[], today = todayKey()): SrsCard[] {
  return cards.filter((c) => dayDiff(c.due, today) >= 0);
}

/** A word is considered "mastered" once it reaches the top box. */
export function isMastered(card: SrsCard): boolean {
  return card.box >= MAX_BOX;
}

export function masteredCount(cards: SrsCard[]): number {
  return cards.filter(isMastered).length;
}
