/**
 * Lesson runner — drives the pedagogical flow for one lesson:
 *
 *   LEARN    → hear each new word (TTS) + translation + example (input first)
 *   PRACTICE → escalating exercises (listen → choose → translate → context)
 *   REVIEW   → SRS-due words from previous lessons, interleaved
 *   → completeLesson → results
 *
 * Enforces the free daily word gate (redirect to paywall) and the hearts system.
 */

import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import type { Exercise, Lesson, Word } from '@/types';
import { loadLesson } from '@/lib/content';
import { dueCards } from '@/lib/srs';
import { useGameStore } from '@/store/gameStore';
import { theme } from '@/theme';
import { Button, ProgressBar, StatHud } from '@/components/ui';
import { Speaker, speak } from '@/components/Speaker';
import { ExerciseView } from '@/components/exercises/ExerciseView';

type Phase = 'loading' | 'learn' | 'practice' | 'review' | 'out';

export default function LessonRunner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const store = useGameStore();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [pos, setPos] = useState(0); // index within the current phase
  const [correctCount, setCorrectCount] = useState(0);

  // Load lesson content (cache → AI → sample).
  useEffect(() => {
    let alive = true;
    loadLesson(String(id), store.level, store.categories).then((l) => {
      if (!alive) return;
      setLesson(l);
      // Free daily gate: no allowance left and these are new words → paywall.
      const remaining = store.isPremium ? Infinity : store.dailyGoal - store.newWordsToday;
      const hasNew = l.words.some((w) => !store.srs[w.id]);
      if (remaining <= 0 && hasNew) {
        router.replace('/paywall');
        return;
      }
      setPhase('learn');
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Words to learn this session, capped by remaining daily allowance (free tier).
  const wordsToLearn: Word[] = useMemo(() => {
    if (!lesson) return [];
    const remaining = store.isPremium ? lesson.words.length : Math.max(0, store.dailyGoal - store.newWordsToday);
    return lesson.words.slice(0, Math.max(remaining, lesson.words.every((w) => store.srs[w.id]) ? lesson.words.length : remaining));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson]);

  // SRS review items from OTHER lessons, built as quick recognition checks.
  const reviewExercises: Exercise[] = useMemo(() => {
    if (!lesson) return [];
    const currentIds = new Set(lesson.words.map((w) => w.id));
    const cards = dueCards(Object.values(store.srs)).filter((c) => !currentIds.has(c.wordId));
    const allMeanings = Object.values(store.srs).map((c) => c.he);
    return cards.slice(0, 3).flatMap((card) => {
      const distractors = shuffle(allMeanings.filter((m) => m !== card.he)).slice(0, 2);
      if (distractors.length < 2) return [];
      return [
        {
          type: 'listen_choose',
          wordId: card.wordId,
          en: card.en,
          options: shuffle([card.he, ...distractors]),
          answer: card.he,
        } as Exercise,
      ];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, phase === 'review']);

  if (phase === 'loading' || !lesson) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.muted}>Preparing your lesson…</Text>
      </View>
    );
  }

  // Total steps for the progress bar.
  const totalSteps = wordsToLearn.length + lesson.exercises.length + reviewExercises.length;
  const doneSteps =
    (phase === 'learn' ? pos : wordsToLearn.length) +
    (phase === 'practice' ? pos : phase === 'review' || phase === 'out' ? lesson.exercises.length : 0) +
    (phase === 'review' ? pos : 0);

  // Takes the final correct count explicitly so it isn't read from stale state
  // (the last answer's setCorrectCount hasn't flushed when this runs).
  function finishLesson(finalCorrect: number) {
    store.completeLesson(lesson!.id, lesson!.xpReward);
    router.replace({
      pathname: '/results',
      params: { xp: String(finalCorrect * 10 + lesson!.xpReward), correct: String(finalCorrect), lesson: lesson!.title },
    });
  }

  // --- LEARN phase ---------------------------------------------------------
  if (phase === 'learn') {
    const word = wordsToLearn[pos];
    return (
      <LessonFrame streak={store.streak} hearts={store.hearts} xp={store.xp} progress={doneSteps / totalSteps} onClose={() => router.back()}>
        <WordCard word={word} />
        <Button
          label={pos + 1 < wordsToLearn.length ? 'Next word' : 'Start practice'}
          onPress={() => {
            if (pos + 1 < wordsToLearn.length) setPos(pos + 1);
            else {
              store.registerNewWords(wordsToLearn);
              setPos(0);
              setPhase('practice');
            }
          }}
        />
      </LessonFrame>
    );
  }

  // --- PRACTICE phase ------------------------------------------------------
  if (phase === 'practice') {
    const ex = lesson.exercises[pos];
    return (
      <LessonFrame streak={store.streak} hearts={store.hearts} xp={store.xp} progress={doneSteps / totalSteps} onClose={() => router.back()}>
        <ExerciseView
          key={`p-${pos}`}
          exercise={ex}
          onDone={(correct) => {
            store.answer(correct);
            store.reviewWord(ex.wordId, correct);
            const correctNow = correct ? correctCount + 1 : correctCount;
            if (correct) setCorrectCount(correctNow);

            const outOfHearts = !store.isPremium && useGameStore.getState().hearts <= 0;
            if (outOfHearts) {
              setPhase('out');
              return;
            }
            if (pos + 1 < lesson.exercises.length) setPos(pos + 1);
            else if (reviewExercises.length > 0) {
              setPos(0);
              setPhase('review');
            } else finishLesson(correctNow);
          }}
        />
      </LessonFrame>
    );
  }

  // --- REVIEW phase --------------------------------------------------------
  if (phase === 'review') {
    const ex = reviewExercises[pos];
    return (
      <LessonFrame streak={store.streak} hearts={store.hearts} xp={store.xp} progress={doneSteps / totalSteps} onClose={() => router.back()}>
        <Text style={styles.reviewTag}>🔁 Review</Text>
        <ExerciseView
          key={`r-${pos}`}
          exercise={ex}
          onDone={(correct) => {
            store.reviewWord(ex.wordId, correct);
            const correctNow = correct ? correctCount + 1 : correctCount;
            if (correct) setCorrectCount(correctNow);
            if (pos + 1 < reviewExercises.length) setPos(pos + 1);
            else finishLesson(correctNow);
          }}
        />
      </LessonFrame>
    );
  }

  // --- OUT OF HEARTS -------------------------------------------------------
  return (
    <View style={styles.centerFill}>
      <Text style={{ fontSize: 64 }}>💔</Text>
      <Text style={styles.outTitle}>Out of hearts</Text>
      <Text style={styles.muted}>Hearts refill tomorrow — or go Premium for unlimited.</Text>
      <View style={{ alignSelf: 'stretch', gap: theme.spacing(1.5), marginTop: theme.spacing(3), paddingHorizontal: theme.spacing(3) }}>
        <Button label="Go Premium" onPress={() => router.replace('/paywall')} />
        <Button label="Back home" variant="secondary" onPress={() => router.replace('/(tabs)')} />
      </View>
    </View>
  );
}

// --- shared frame ----------------------------------------------------------

function LessonFrame({
  children,
  streak,
  hearts,
  xp,
  progress,
  onClose,
}: {
  children: React.ReactNode;
  streak: number;
  hearts: number;
  xp: number;
  progress: number;
  onClose: () => void;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <ProgressBar value={progress} />
        </View>
      </View>
      <View style={styles.hudRow}>
        <StatHud streak={streak} hearts={hearts} xp={xp} />
      </View>
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

// --- LEARN word card -------------------------------------------------------

function WordCard({ word }: { word: Word }) {
  useEffect(() => {
    speak(word.en); // auto-play the word on show (comprehensible input first)
  }, [word.en]);

  return (
    <ScrollView contentContainerStyle={styles.wordCard} showsVerticalScrollIndicator={false}>
      <Speaker text={word.en} size="lg" />
      <Text style={styles.wordEn}>{word.en}</Text>
      <Text style={styles.wordHe}>{word.he}</Text>
      <View style={styles.exampleBox}>
        <Text style={styles.exampleText}>{word.example}</Text>
        <Pressable onPress={() => speak(word.example)} style={styles.exampleSpeak}>
          <Text style={{ fontSize: 18 }}>🔊</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing(1), backgroundColor: theme.colors.background },
  muted: { color: theme.colors.textMuted, fontSize: theme.font.md, textAlign: 'center', paddingHorizontal: theme.spacing(3) },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5), paddingHorizontal: theme.spacing(2), paddingTop: theme.spacing(1) },
  close: { fontSize: 22, color: theme.colors.textMuted, fontWeight: '700' },
  hudRow: { paddingHorizontal: theme.spacing(2), paddingVertical: theme.spacing(1) },
  body: { flex: 1, paddingHorizontal: theme.spacing(2.5), paddingBottom: theme.spacing(2) },

  wordCard: { alignItems: 'center', gap: theme.spacing(2), paddingTop: theme.spacing(4) },
  wordEn: { fontSize: 40, fontWeight: '900', color: theme.colors.text },
  wordHe: { fontSize: theme.font.xl, color: theme.colors.primary, fontWeight: '700' },
  exampleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
    backgroundColor: theme.colors.surface,
    padding: theme.spacing(2),
    borderRadius: theme.radius.md,
    marginTop: theme.spacing(2),
  },
  exampleText: { flex: 1, fontSize: theme.font.md, color: theme.colors.text, fontStyle: 'italic' },
  exampleSpeak: { padding: 6 },

  reviewTag: { fontSize: theme.font.sm, fontWeight: '800', color: theme.colors.streak, marginBottom: theme.spacing(1) },
  outTitle: { fontSize: theme.font.xl, fontWeight: '900', color: theme.colors.text },
});
