/**
 * Claude prompt building + response validation. SERVER-SIDE ONLY.
 *
 * Imported exclusively by the API routes under app/api/. Never import this from
 * a screen/component — it must not run on the device (it would risk exposing the
 * prompt/model wiring and pulls in the server SDK).
 *
 * Model: Claude Haiku 4.5 — fast + cheap, ideal for structured content generation.
 */

import type { CEFRLevel, Lesson, PlacementQuestion } from '@/types';
import { LESSON_PATH, CATEGORIES } from '@/data/curriculum';

export const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

function categoryLabels(ids: string[]): string {
  const labels = ids
    .map((id) => CATEGORIES.find((c) => c.id === id)?.label)
    .filter(Boolean);
  return labels.length ? labels.join(', ') : 'Everyday Conversation';
}

// ---------------------------------------------------------------------------
// Lesson generation
// ---------------------------------------------------------------------------

export function buildLessonPrompt(lessonId: string, level: CEFRLevel, categories: string[]) {
  const meta = LESSON_PATH.find((l) => l.id === lessonId);
  const topic = meta?.title ?? 'Everyday vocabulary';
  const cats = categoryLabels(categories);

  const system = [
    'You are an expert English teacher and curriculum designer for native Hebrew speakers.',
    'You create short, motivating vocabulary lessons grounded in second-language-acquisition research:',
    'comprehensible input first, recognition before production, and clear examples.',
    'You ALWAYS respond with a single valid JSON object and nothing else — no prose, no markdown fences.',
  ].join(' ');

  const user = `Create one English lesson as JSON with this EXACT shape:
{
  "id": "${lessonId}",
  "title": "${topic}",
  "level": "${level}",
  "category": "${meta?.category ?? 'everyday'}",
  "xpReward": 20,
  "words": [ { "id": "kebab-id", "en": "word", "he": "תרגום לעברית", "example": "English sentence using the word" } ],
  "exercises": [ /* see rules */ ]
}

Requirements:
- Exactly 4 words appropriate for CEFR level ${level}, themed around: ${topic} (learner interests: ${cats}).
- "he" is the Hebrew translation; "example" is a natural English sentence using the word.
- Exactly 5 exercises, ordered easy → hard, each referencing a word via "wordId":
  1) {"type":"listen_choose","wordId","en","options":[3 Hebrew meanings],"answer"}
  2) {"type":"listen_choose","wordId","en","options":[3 Hebrew meanings],"answer"}
  3) {"type":"multiple_choice","wordId","prompt","options":[3 strings],"answerIndex"}
  4) {"type":"fill_blank","wordId","sentence":"... ___ ...","options":[3 English words],"answer"}
  5) {"type":"translate","wordId","prompt":"תרגם: <Hebrew>","answer":"<English>","hints":["p__tial"]}
- Every "answer" must be present in its "options".
- Respond with ONLY the JSON object.`;

  return { system, user };
}

/** Validate + coerce a parsed object into a Lesson. Throws on bad shape. */
export function validateLesson(obj: any): Lesson {
  if (!obj || typeof obj !== 'object') throw new Error('not an object');
  if (!Array.isArray(obj.words) || obj.words.length === 0) throw new Error('missing words');
  if (!Array.isArray(obj.exercises) || obj.exercises.length === 0) throw new Error('missing exercises');
  for (const w of obj.words) {
    if (!w.id || !w.en || !w.he || !w.example) throw new Error('bad word');
  }
  for (const e of obj.exercises) {
    if (!e.type || !e.wordId) throw new Error('bad exercise');
  }
  return obj as Lesson;
}

// ---------------------------------------------------------------------------
// Placement quiz generation
// ---------------------------------------------------------------------------

export function buildQuizPrompt(claimedLevel: CEFRLevel) {
  const system =
    'You are an English placement-test author. You output ONLY a single valid JSON object, no prose or markdown.';

  const user = `Create an adaptive placement quiz to verify a learner who claims CEFR level "${claimedLevel}".
Return JSON: { "questions": [ { "level": "A1|A2|B1|B2|C1", "prompt": "...", "options": ["a","b","c"], "answerIndex": 0 } ] }
Rules:
- Exactly 8 questions of INCREASING difficulty, spanning from one band below the claimed level up to one band above.
- Each question has exactly 3 options and one correct answerIndex (0-2).
- Test grammar and vocabulary usage. Keep prompts short.
- Respond with ONLY the JSON object.`;

  return { system, user };
}

export function validateQuiz(obj: any): PlacementQuestion[] {
  if (!obj || !Array.isArray(obj.questions) || obj.questions.length === 0) {
    throw new Error('missing questions');
  }
  for (const q of obj.questions) {
    if (!q.prompt || !Array.isArray(q.options) || typeof q.answerIndex !== 'number') {
      throw new Error('bad question');
    }
  }
  return obj.questions as PlacementQuestion[];
}

/** Pull the first JSON object out of a model response (in case of stray text). */
export function extractJson(text: string): any {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON found');
  return JSON.parse(text.slice(start, end + 1));
}
