---
name: write-tests
description: Write or scaffold tests for Fluently. Sets up jest-expo on first use, then adds focused unit tests for the pure logic (SRS, dates, gameStore reducers, placement scoring, Claude validators). Use when asked to test a module, cover a bug fix, or add regression tests.
---

# Write tests — Fluently

The repo has **no test runner yet**. Prioritize the pure, high-value logic; skip pixel-level UI tests.

## First-time setup (only if `jest` isn't configured)
Check `package.json` for a `test` script / jest config. If absent:

```bash
npx expo install jest-expo jest @types/jest
```

Add to `package.json`:
```json
"scripts": { "test": "jest", "test:watch": "jest --watch" },
"jest": { "preset": "jest-expo" }
```

Put tests in `__tests__/` or alongside code as `*.test.ts`. The `@/*` alias resolves via `jest-expo` + tsconfig paths; if a test can't resolve `@/`, add `moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" }` to the jest config.

## What to cover (in priority order)
These are pure and deterministic — ideal first targets:

1. **`src/lib/srs.ts`** — `newCard` starts due today at box 0; `review(correct)` promotes the box and pushes `due` out by the box interval; `review(false)` resets to box 0 and bumps `lapses`; `dueCards` selects only due/overdue; `isMastered`/`masteredCount` at the top box.
2. **`src/lib/date.ts`** — `todayKey`, `addDays`, `dayDiff` across month/year boundaries. Pass explicit dates; never rely on the real clock.
3. **`src/store/gameStore.ts`** — drive actions on the store directly: `answer(true)` adds XP, `answer(false)` costs a heart (and does NOT when premium); `completeLesson` streak math (first play, +1 next day, reset after a gap); `canLearnNewWords`/`registerNewWords` respect `dailyGoal` and premium; `ensureDailyReset` refills on a new day. Call `resetAll()` in `beforeEach`.
4. **`src/app/onboarding.tsx` → `placementResult`** — extract or import the helper: places at the highest correctly-answered CEFR band; empty → A1. (If it's not exported, export it for testability.)
5. **`src/lib/claude.ts` validators** — `validateLesson`/`validateQuiz` accept well-formed objects and throw on missing words/exercises/questions; `extractJson` pulls a JSON object out of noisy text.

## Rules
- Determinism: inject dates (the SRS/date/store APIs already accept a `today` arg or use the store clock — pass fixed values). Don't test wall-clock behavior.
- One behavior per test, named after the behavior. Cover the bug you're fixing with a test that fails before the fix.
- Mock AsyncStorage if needed via `jest-expo` (it ships a mock); the store's `persist` should no-op in tests.
- After writing, run `npm test` and report pass/fail. Keep `npx tsc --noEmit` green.
