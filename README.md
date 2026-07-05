<div align="center">

# Fluently

**An interactive English-learning app for Hebrew speakers — Bright-style.**

Short, science-backed lessons wrapped in addictive gamification. Built with Expo + React Native, with AI-generated content powered by Claude.

`Expo SDK 56` · `React Native 0.85` · `TypeScript` · `Expo Router`

</div>

---

## Overview

Fluently teaches English through bite-sized lessons grounded in second-language-acquisition research, not just quizzes. Every lesson introduces new words by **sound and meaning first**, then drives them into memory through escalating retrieval practice and spaced repetition. Progress is powered by a streak / XP / hearts loop that keeps learners coming back.

The app is **fully playable offline** with built-in sample content, and can generate unlimited personalized lessons on demand via the Claude API.

## Features

- **Adaptive onboarding** — learners self-rate, then a short placement quiz *verifies* their real CEFR level (A1–C1) and they pick the topics they care about.
- **Pedagogical lesson flow** — Listen + Translation → escalating practice (listen → choose → translate → use in context) → spaced review of earlier words.
- **Spaced repetition (SRS)** — a Leitner system schedules each learned word for review at the right time for long-term retention.
- **Gamification** — daily streak 🔥, XP ⭐, and hearts ❤️ with instant audio, animation, and haptic feedback.
- **AI-generated content** — lessons and placement quizzes tailored to the learner's level and interests (Claude Haiku 4.5), with local caching and an offline fallback.
- **Freemium** — 4 new words per day for free; Premium unlocks unlimited learning.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Expo (SDK 56), React Native 0.85, TypeScript |
| Navigation | Expo Router (file-based) + server API routes |
| State | Zustand, persisted to AsyncStorage |
| Audio / feedback | expo-speech (TTS), expo-haptics |
| AI | `@anthropic-ai/sdk` — server-side only |

## Getting started

**Prerequisites:** Node 18+ and the [Expo Go](https://expo.dev/go) app on your phone.

```bash
git clone https://github.com/ArielBY12/fluently.git
cd fluently
npm install
npx expo start          # scan the QR with Expo Go to run on your phone
```

Prefer the browser? `npx expo start --web`.

### Enabling AI content (optional)

The app ships with sample lessons and works with no setup. To generate content dynamically with Claude:

1. `cp .env.example .env` and set `ANTHROPIC_API_KEY`.
2. The key is used **only** by the server API routes (`src/app/api/`) — it is never bundled into the app.
3. To reach the AI routes from a physical device, also set `EXPO_PUBLIC_API_URL` to your machine's LAN address (see `.env.example`). On web it works automatically.

## Project structure

```
src/
├── app/                 # screens (Expo Router)
│   ├── (tabs)/          #   home learning path + profile
│   ├── onboarding.tsx   #   self-rate → placement quiz → categories → goal
│   ├── lesson/[id].tsx  #   Learn → Practice → Review runner
│   ├── results.tsx  paywall.tsx
│   └── api/             #   SERVER: Claude proxy (generate-lesson, placement-quiz)
├── components/          # UI kit, exercise renderer, TTS speaker
├── data/curriculum.ts   # categories, sample lessons, sample placement quiz
├── lib/                 # content (cache→AI→sample), srs, claude (prompts), date
├── store/gameStore.ts   # persisted game state (single source of truth)
├── types.ts             # Lesson / Word / Exercise contract
└── theme.ts             # design tokens
```

See [CLAUDE.md](CLAUDE.md) for a deeper architecture guide.

## Verification

```bash
npx tsc --noEmit         # type-check
npx expo export -p web   # full bundle incl. API routes
```

## Roadmap

- [ ] Real subscription billing (RevenueCat) — the Premium button is currently a dev stub
- [ ] Accounts + cloud sync (Supabase)
- [ ] Daily streak notifications & leaderboards
- [ ] Pronunciation practice (speech recognition)

## License

MIT — see [LICENSE](LICENSE).
