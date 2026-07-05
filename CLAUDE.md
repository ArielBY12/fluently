# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

/ IMPORTANT: Expo has changed a lot. Read the versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing Expo-specific code.

## What this is

**Fluently** — an interactive English-learning mobile app (Bright-style) for native Hebrew speakers. Expo (SDK 56) + Expo Router + TypeScript. Short lessons built on second-language-acquisition principles (comprehensible input → recognition → production → spaced review), wrapped in gamification (hearts / XP / streak) and a freemium gate.

The primary maintainer is a **beginner developer** — favor simple, readable code, few dependencies, and keep every change runnable on-device via Expo Go.

## Commands

```bash
npx expo start            # dev server; scan QR with Expo Go to run on a phone
npx expo start --web      # run in the browser (fastest to click through)
npx tsc --noEmit          # type-check (the main correctness gate — keep it green)
npx expo export -p web    # full production bundle incl. server API routes; catches bundling errors
npx expo lint             # lint
```

There is **no unit-test runner configured yet**. Type-checking + the web export are the current verification gates. When adding tests, wire up `jest-expo` and expose an `npm test` script.

## Architecture

### Content pipeline (the core idea)
Lesson content has three sources, tried in order by `src/lib/content.ts`:
1. **AsyncStorage cache** — keyed by `lessonId:level:categories`; fast, free, offline.
2. **AI generation** — POST to the Expo Router API route `/api/generate-lesson`, which calls Claude (Haiku 4.5) server-side. Personalized to the learner's placed CEFR level + chosen categories.
3. **Built-in samples** — `src/data/curriculum.ts` (`SAMPLE_LESSONS`). Guarantees the app is fully playable with **no API key and no network**.

**Security invariant:** `ANTHROPIC_API_KEY` lives only in the server API routes (`src/app/api/*+api.ts`) via `process.env`. It must never be imported into a screen/component or exposed to the client. `src/lib/claude.ts` (prompt building + validation) is **server-only** for the same reason — never import it from the app. Enabling AI requires `web.output: "server"` in `app.json` (already set).

On a physical device, relative `fetch('/api/...')` has no origin, so AI is only attempted when `EXPO_PUBLIC_API_URL` is set (see `.env.example`); otherwise the app falls back to samples. On web, relative fetch hits the dev server automatically.

### State — one store, persisted
`src/store/gameStore.ts` (Zustand + `persist` → AsyncStorage) is the single source of truth for everything durable: onboarding status, placed level, categories, hearts/XP/streak, the daily new-word counter, `isPremium`, completed lessons, and the SRS card map. Screens read/write only through this store. Key rules encoded here:
- **Daily reset:** `ensureDailyReset()` (called from the root layout on hydrate) refills hearts and zeroes the new-word counter when the local day changes.
- **Freemium gate:** `canLearnNewWords()` — premium bypasses; free users are capped at `dailyGoal` (4) new words/day.
- **Streak:** computed in `completeLesson()` from `lastPlayedDate` (yesterday → +1, gap → reset to 1).
- Hydration is gated: `_hasHydrated` flips via `onRehydrateStorage`; the root layout shows a spinner until then so the onboarding redirect and stats are correct on first paint.

### Spaced repetition
`src/lib/srs.ts` — a simplified Leitner system. Each learned word is a card with a `box` (0–5) and a `due` date; correct answers promote the box (longer interval), mistakes reset to box 0. `dueCards()` selects what to review; top box = "mastered". This is a first-class retention feature, not decoration.

### Navigation & the lesson flow
Expo Router, file-based, rooted at `src/app`. Root `_layout.tsx` is a Stack (hydration gate + daily reset). The `(tabs)` group is the home path + profile; `(tabs)/index.tsx` redirects to `/onboarding` until `onboarded` is true.

`src/app/lesson/[id].tsx` is the heart of the app — a phase state machine that must preserve this pedagogical order:
**LEARN** (hear each new word + translation + example, input first) → **PRACTICE** (escalating exercises: `listen_choose` → `multiple_choice` → `translate` → `fill_blank`) → **REVIEW** (SRS-due words from *other* lessons, interleaved) → `completeLesson` → `/results`. It also enforces the daily gate (redirect to `/paywall`) and the hearts system (0 hearts → out-of-hearts screen).
- Gotcha: when finishing, pass the running correct-count *explicitly* to `finishLesson(finalCorrect)` — reading `correctCount` from state there is stale (the last `setCorrectCount` hasn't flushed).

### Data contract
`src/types.ts` defines the `Lesson` / `Word` / `Exercise` / `PlacementQuestion` shapes. This is the contract between the AI generator and the app: the API route validates Claude's JSON against it (`validateLesson` in `src/lib/claude.ts`) before returning, so the renderer (`src/components/exercises/ExerciseView.tsx`) can trust the shape. **Adding an exercise type means updating all three:** the union in `types.ts`, the generation prompt + validator in `claude.ts`, and the render/answer logic in `ExerciseView.tsx`.

### Onboarding & placement
`src/app/onboarding.tsx` is a single-file wizard: self-rate → adaptive placement quiz (via `/api/placement-quiz`, sample fallback) → categories → goal. The quiz *verifies* the claimed level — the learner is placed at the **highest CEFR band they answer correctly** (`placementResult`), so over-claiming is caught.

## Conventions
- Path alias `@/*` → `src/*` (see `tsconfig.json`).
- Styling is plain `StyleSheet` + tokens from `src/theme.ts` (colors/spacing/radius/font). No NativeWind/CSS. `theme.spacing(n)` = `n * 8`.
- Premium purchase is currently a **dev stub** (`setPremium(true)` in `paywall.tsx`). Real billing (RevenueCat) is a later milestone.
- The full design/plan lives at `~/.claude/plans/jolly-jingling-aurora.md`.
