---
name: add-lesson
description: Add a new lesson (and optionally a new category) to Fluently's curriculum. Handles the path node, the sample lesson content following the exact schema, and correct exercise ordering. Use when asked to add lessons, topics, or vocabulary sets.
---

# Add a lesson — Fluently

All curriculum lives in `src/data/curriculum.ts`. A lesson needs two additions.

## 1. Add a path node → `LESSON_PATH`
```ts
{ id: 'travel-2', title: 'Hotels & Stays', category: 'travel', icon: '🏨' }
```
- `id` is `<category>-<n>`, unique. `category` must be a `CATEGORIES` id. `icon` is one emoji (shown on the home path).
- Order in the array = order on the path; each lesson unlocks when the previous one is completed.

## 2. Add the content → `SAMPLE_LESSONS[id]`
Follow the schema in `src/types.ts` exactly (the app and the AI generator share it). A lesson has **4 words** and **5 exercises ordered easy → hard**:

```ts
'travel-2': {
  id: 'travel-2', title: 'Hotels & Stays', level: 'A2', category: 'travel', xpReward: 20,
  words: [
    { id: 't2-room', en: 'room', he: 'חדר', example: 'I booked a room for two nights.' },
    // ...4 total
  ],
  exercises: [
    { type: 'listen_choose',   wordId: 't2-room', en: 'room', options: ['חדר','מפתח','מגבת'], answer: 'חדר' },
    { type: 'listen_choose',   wordId: 't2-key',  en: 'key',  options: ['מפתח','חדר','חשבון'], answer: 'מפתח' },
    { type: 'multiple_choice', wordId: 't2-towel', prompt: 'Which word means "מגבת"?', options: ['key','towel','room'], answerIndex: 1 },
    { type: 'fill_blank',      wordId: 't2-book', sentence: 'I want to ___ a room.', options: ['book','key','room'], answer: 'book' },
    { type: 'translate',       wordId: 't2-room', prompt: 'תרגם: חדר', answer: 'room', hints: ['r__m'] },
  ],
},
```

## Rules
- `wordId` on every exercise must match a `words[].id` in the same lesson.
- Every `answer` must appear in its `options`. `answerIndex` must point at the correct `options` entry.
- Keep the recognition-before-production order: two `listen_choose` first, then `multiple_choice`/`fill_blank`, then `translate` (production) last.
- Pick `level` (A1–C1) to match the vocabulary difficulty; the home path shows lessons regardless of the learner's level, but AI-generated versions use it.
- Hebrew goes in `he`/`prompt`/`answer` as appropriate; English in `en`/`example`/`sentence`.

## Adding a new category (optional)
Add to `CATEGORIES` (`{ id, label, icon }`), then add at least one lesson with that `category`. The category id becomes selectable in onboarding and the profile.

## Verify
`npx tsc --noEmit`, then `npx expo start --web`, complete the lesson, and confirm it unlocks the next node.
