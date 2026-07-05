---
name: review-app
description: Code-review the current diff against Fluently's specific invariants — the server-only API key, the Lesson/Exercise data contract, the lesson-phase order, the freemium/hearts gate, SRS correctness, and project conventions. Use before committing or opening a PR on this Expo English-learning app.
---

# Review the change — Fluently

Review the current working-tree diff (`git diff` + untracked) for correctness and for the project-specific invariants below. Report findings grouped as **Blocking / Should-fix / Nit**, each with `file:line` and a concrete fix. End by running `npx tsc --noEmit` and reporting the result.

## Project-specific invariants (check every diff)

1. **API key stays server-side.** `ANTHROPIC_API_KEY` and `src/lib/claude.ts` may only be used inside `src/app/api/*+api.ts`. Flag any import of `@/lib/claude`, `@anthropic-ai/sdk`, or `process.env.ANTHROPIC_*` from a screen/component/store. The client reaches AI only via `fetch` in `src/lib/content.ts`.

2. **The data contract moves together.** The `Exercise`/`Lesson` shapes in `src/types.ts`, the generation prompt + `validateLesson`/`validateQuiz` in `src/lib/claude.ts`, and the render/answer logic in `src/components/exercises/ExerciseView.tsx` must stay in sync. A new field or exercise type touching only one is a bug.

3. **Lesson phase order is sacred.** `src/app/lesson/[id].tsx` must keep LEARN → PRACTICE → REVIEW. Learning a word (audio + translation + example) must come before any test of it. New words register via `registerNewWords` only after the LEARN phase.

4. **Freemium & hearts gate.** New-word learning must route through `canLearnNewWords`/`registerNewWords` and respect `dailyGoal`; premium bypasses. Exceeding the free cap → `/paywall`. Hearts reaching 0 (non-premium) → out-of-hearts, never a silent continue. Verify `ensureDailyReset` still governs daily refill.

5. **No stale-state reads at lesson end.** `finishLesson(finalCorrect)` must receive the count explicitly; reading `correctCount` from state inside the completion handler is stale by one.

6. **SRS integrity** (`src/lib/srs.ts`): correct → promote box (longer interval), wrong → box 0. Review must pull `dueCards` from *other* lessons, not the words just learned.

7. **Persistence.** Durable state lives only in `src/store/gameStore.ts` (Zustand + AsyncStorage). Flag component-local state that should survive restarts, and any new persisted field not added to `resetAll`.

## Conventions
- Styling: `StyleSheet` + tokens from `src/theme.ts` only (no inline hex, no NativeWind). `theme.spacing(n)` = `n*8`.
- Path alias `@/*`. Keep it beginner-readable: clear names, small components, comments only where intent isn't obvious.
- `npx tsc --noEmit` must stay green — it's the primary gate (no test runner yet).

## Output
Concise. Lead with the single most important issue. If the diff is clean against all of the above, say so plainly and note the tsc result.
