---
name: add-exercise-type
description: Add a new interactive exercise type to Fluently (e.g. word ordering, matching pairs, dictation). Walks the required three-place change to the shared data contract so the AI generator, validator, and renderer stay in sync. Use when asked to add or change an exercise/question format.
---

# Add an exercise type — Fluently

An exercise type is defined once as a data shape and consumed in three places. Change **all three** or it breaks.

## 1. The shape → `src/types.ts`
Add a variant to the `Exercise` union. Every variant carries `wordId` (ties it to a word for SRS). Example — a "match pairs" type:
```ts
| { type: 'match_pairs'; wordId: string; pairs: { en: string; he: string }[] }
```

## 2. Generation + validation → `src/lib/claude.ts` (server-only)
- Add the new type to the exercise rules in `buildLessonPrompt` (describe the exact JSON shape and any constraints, e.g. "every answer must be in options").
- Extend `validateLesson` so a malformed instance of the new type is rejected before it reaches the client.

## 3. Render + grade → `src/components/exercises/ExerciseView.tsx`
`ExerciseView` manages the answer → check → feedback → continue flow and calls `onDone(correct)`. To support a new type, update:
- `renderPrompt` — how the question is shown (reuse `<Speaker>` for audio types).
- Answer capture — the current model is a single `selected` string (option types) or `text` (translate). For a fundamentally different interaction (ordering, multi-select, drag), add its own local state branch and compute correctness for it.
- `getOptions` / `getCorrectValue` / `optionState` — extend for option-based types; for non-option types, branch earlier and render a custom body while still ending in the shared Check/Continue footer.

## Rules
- Keep the contract tight: the renderer must be able to fully trust a validated exercise — no runtime shape-guessing.
- Preserve the flow: answer → **Check** (with haptic feedback) → **Continue** → `onDone(correct)`. Don't auto-advance.
- Difficulty ordering still applies — decide where the new type sits on the easy→hard scale and reflect that in the generation prompt and in `add-lesson`.
- If the type introduces new fields, make sure sample lessons in `src/data/curriculum.ts` that use it are valid.

## Verify
`npx tsc --noEmit` (the union change will surface every place that must handle the new type), then add one instance to a sample lesson and play it via `npx expo start --web`.
