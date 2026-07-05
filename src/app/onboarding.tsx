/**
 * First-run onboarding wizard:
 *   1. Self-rate level  →  2. Adaptive placement quiz (verifies real level)
 *   3. Pick word categories  →  4. Confirm daily goal  →  start learning.
 *
 * The placement quiz adjusts the claimed level: we place the learner at the
 * highest CEFR band they actually answer correctly (so over-claiming is caught).
 */

import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import type { CEFRLevel, PlacementQuestion } from '@/types';
import { CATEGORIES } from '@/data/curriculum';
import { loadPlacementQuiz } from '@/lib/content';
import { useGameStore } from '@/store/gameStore';
import { theme } from '@/theme';
import { Button, ProgressBar } from '@/components/ui';

const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

const SELF_RATINGS: { label: string; sub: string; claimed: CEFRLevel }[] = [
  { label: 'Beginner', sub: 'Just starting out', claimed: 'A1' },
  { label: 'Intermediate', sub: 'I can hold a basic conversation', claimed: 'B1' },
  { label: 'Advanced', sub: 'I speak comfortably', claimed: 'B2' },
];

type Step = 'level' | 'quiz' | 'categories' | 'goal';

export default function Onboarding() {
  const router = useRouter();
  const completeOnboarding = useGameStore((s) => s.completeOnboarding);

  const [step, setStep] = useState<Step>('level');
  const [claimed, setClaimed] = useState<CEFRLevel>('A1');
  const [placed, setPlaced] = useState<CEFRLevel>('A1');
  const [categories, setCategories] = useState<string[]>([]);

  const stepIndex = ['level', 'quiz', 'categories', 'goal'].indexOf(step);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.progressWrap}>
        <ProgressBar value={(stepIndex + 1) / 4} />
      </View>

      {step === 'level' && (
        <LevelStep
          onPick={(claimedLevel) => {
            setClaimed(claimedLevel);
            setStep('quiz');
          }}
        />
      )}

      {step === 'quiz' && (
        <QuizStep
          claimed={claimed}
          onDone={(placedLevel) => {
            setPlaced(placedLevel);
            setStep('categories');
          }}
        />
      )}

      {step === 'categories' && (
        <CategoriesStep
          selected={categories}
          onToggle={(id) =>
            setCategories((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
          }
          onNext={() => setStep('goal')}
        />
      )}

      {step === 'goal' && (
        <GoalStep
          placed={placed}
          onStart={() => {
            completeOnboarding({
              level: placed,
              categories: categories.length ? categories : ['everyday'],
            });
            router.replace('/(tabs)');
          }}
        />
      )}
    </SafeAreaView>
  );
}

// --- Step 1: self-rated level ---------------------------------------------

function LevelStep({ onPick }: { onPick: (claimed: CEFRLevel) => void }) {
  return (
    <View style={styles.step}>
      <Text style={styles.title}>What's your English level?</Text>
      <Text style={styles.subtitle}>We'll double-check with a quick quiz.</Text>
      <View style={{ gap: theme.spacing(1.5), marginTop: theme.spacing(3) }}>
        {SELF_RATINGS.map((r) => (
          <Pressable key={r.claimed} style={styles.bigOption} onPress={() => onPick(r.claimed)}>
            <Text style={styles.bigOptionTitle}>{r.label}</Text>
            <Text style={styles.bigOptionSub}>{r.sub}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// --- Step 2: placement quiz ------------------------------------------------

function QuizStep({ claimed, onDone }: { claimed: CEFRLevel; onDone: (placed: CEFRLevel) => void }) {
  const [questions, setQuestions] = useState<PlacementQuestion[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [correctLevels, setCorrectLevels] = useState<CEFRLevel[]>([]);
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    loadPlacementQuiz(claimed).then((q) => {
      if (alive) setQuestions(q);
    });
    return () => {
      alive = false;
    };
  }, [claimed]);

  if (!questions) {
    return (
      <View style={[styles.step, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.subtitle}>Building your quiz…</Text>
      </View>
    );
  }

  const q = questions[idx];

  function submit() {
    if (picked == null) return;
    const nextCorrect = picked === q.answerIndex ? [...correctLevels, q.level] : correctLevels;
    setCorrectLevels(nextCorrect);

    if (idx + 1 < questions!.length) {
      setIdx(idx + 1);
      setPicked(null);
    } else {
      onDone(placementResult(nextCorrect));
    }
  }

  return (
    <View style={styles.step}>
      <Text style={styles.stepTag}>
        Question {idx + 1}/{questions.length}
      </Text>
      <Text style={styles.title}>{q.prompt}</Text>
      <View style={{ gap: theme.spacing(1.5), marginTop: theme.spacing(2) }}>
        {q.options.map((opt, i) => (
          <Pressable
            key={i}
            onPress={() => setPicked(i)}
            style={[styles.quizOption, picked === i && { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceAlt }]}>
            <Text style={styles.quizOptionText}>{opt}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ marginTop: 'auto' }}>
        <Button label={idx + 1 < questions.length ? 'Next' : 'See my level'} onPress={submit} disabled={picked == null} />
      </View>
    </View>
  );
}

/** Place the learner at the highest CEFR band they answered correctly. */
function placementResult(correctLevels: CEFRLevel[]): CEFRLevel {
  if (correctLevels.length === 0) return 'A1';
  return correctLevels.reduce((best, lvl) => (LEVELS.indexOf(lvl) > LEVELS.indexOf(best) ? lvl : best), 'A1');
}

// --- Step 3: categories ----------------------------------------------------

function CategoriesStep({
  selected,
  onToggle,
  onNext,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.step}>
      <Text style={styles.title}>What do you want to learn?</Text>
      <Text style={styles.subtitle}>Pick the topics you care about most.</Text>
      <ScrollView contentContainerStyle={styles.catGrid} showsVerticalScrollIndicator={false}>
        {CATEGORIES.map((c) => {
          const on = selected.includes(c.id);
          return (
            <Pressable
              key={c.id}
              onPress={() => onToggle(c.id)}
              style={[styles.catCard, on && { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceAlt }]}>
              <Text style={styles.catIcon}>{c.icon}</Text>
              <Text style={styles.catLabel}>{c.label}</Text>
              {on && <Text style={styles.catCheck}>✓</Text>}
            </Pressable>
          );
        })}
      </ScrollView>
      <Button label="Continue" onPress={onNext} disabled={selected.length === 0} />
    </View>
  );
}

// --- Step 4: daily goal ----------------------------------------------------

function GoalStep({ placed, onStart }: { placed: CEFRLevel; onStart: () => void }) {
  return (
    <View style={[styles.step, styles.center]}>
      <Text style={styles.emoji}>🎯</Text>
      <Text style={styles.title}>You're all set!</Text>
      <Text style={styles.subtitle}>
        Your level: <Text style={{ fontWeight: '900', color: theme.colors.primary }}>{placed}</Text>
      </Text>
      <Text style={[styles.subtitle, { marginTop: theme.spacing(2) }]}>
        Learn <Text style={{ fontWeight: '900' }}>4 new words a day</Text> for free. Go Premium anytime for unlimited learning.
      </Text>
      <View style={{ alignSelf: 'stretch', marginTop: theme.spacing(4) }}>
        <Button label="Start learning" onPress={onStart} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  progressWrap: { padding: theme.spacing(2) },
  step: { flex: 1, paddingHorizontal: theme.spacing(2.5), paddingBottom: theme.spacing(2) },
  center: { alignItems: 'center', justifyContent: 'center', gap: theme.spacing(1) },

  stepTag: { fontSize: theme.font.sm, fontWeight: '800', color: theme.colors.primary, marginBottom: theme.spacing(1) },
  title: { fontSize: theme.font.xxl, fontWeight: '900', color: theme.colors.text },
  subtitle: { fontSize: theme.font.md, color: theme.colors.textMuted, marginTop: theme.spacing(1), textAlign: 'center' },
  emoji: { fontSize: 64 },

  bigOption: {
    padding: theme.spacing(2.5),
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  bigOptionTitle: { fontSize: theme.font.lg, fontWeight: '800', color: theme.colors.text },
  bigOptionSub: { fontSize: theme.font.sm, color: theme.colors.textMuted, marginTop: 4 },

  quizOption: { padding: 18, borderRadius: theme.radius.md, borderWidth: 2, borderColor: theme.colors.border },
  quizOptionText: { fontSize: theme.font.md, fontWeight: '600', color: theme.colors.text },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1.5), paddingVertical: theme.spacing(3) },
  catCard: {
    width: '47%',
    padding: theme.spacing(2),
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 6,
  },
  catIcon: { fontSize: 34 },
  catLabel: { fontSize: theme.font.sm, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
  catCheck: { position: 'absolute', top: 8, right: 10, color: theme.colors.primary, fontWeight: '900' },
});
