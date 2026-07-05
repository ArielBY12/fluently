/**
 * Renders a single exercise and manages its answer → feedback → continue flow.
 * Supports all four exercise types. Calls onDone(correct) when the learner
 * taps Continue after checking their answer.
 */

import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

import type { Exercise } from '@/types';
import { theme } from '@/theme';
import { Button } from '@/components/ui';
import { Speaker } from '@/components/Speaker';

type Props = { exercise: Exercise; onDone: (correct: boolean) => void };

export function ExerciseView({ exercise, onDone }: Props) {
  // A single selection model works for all option-based types; translate uses text.
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [checked, setChecked] = useState(false);

  const correctValue = getCorrectValue(exercise);
  const chosen = exercise.type === 'translate' ? text.trim() : selected;
  const isCorrect = normalize(chosen ?? '') === normalize(correctValue);
  const canCheck = exercise.type === 'translate' ? text.trim().length > 0 : selected != null;

  function check() {
    setChecked(true);
    Haptics.notificationAsync(
      isCorrect ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.prompt}>{renderPrompt(exercise)}</View>

      <View style={styles.options}>
        {exercise.type === 'translate' ? (
          <TextInput
            value={text}
            onChangeText={setText}
            editable={!checked}
            placeholder="Type in English…"
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              checked && { borderColor: isCorrect ? theme.colors.correct : theme.colors.wrong },
            ]}
          />
        ) : (
          getOptions(exercise).map((opt) => (
            <OptionButton
              key={opt}
              label={opt}
              selected={selected === opt}
              state={checked ? optionState(opt, selected, correctValue) : 'idle'}
              disabled={checked}
              onPress={() => setSelected(opt)}
            />
          ))
        )}
      </View>

      {exercise.type === 'translate' && exercise.hints?.length && !checked ? (
        <Text style={styles.hint}>Hint: {exercise.hints[0]}</Text>
      ) : null}

      {checked && (
        <View style={[styles.feedback, { backgroundColor: isCorrect ? theme.colors.correctBg : theme.colors.wrongBg }]}>
          <Text style={[styles.feedbackTitle, { color: isCorrect ? theme.colors.correct : theme.colors.wrong }]}>
            {isCorrect ? '✓ Correct!' : '✗ Not quite'}
          </Text>
          {!isCorrect && <Text style={styles.feedbackAnswer}>Answer: {correctValue}</Text>}
        </View>
      )}

      <View style={styles.footer}>
        {!checked ? (
          <Button label="Check" onPress={check} disabled={!canCheck} />
        ) : (
          <Button
            label="Continue"
            variant={isCorrect ? 'success' : 'danger'}
            onPress={() => onDone(isCorrect)}
          />
        )}
      </View>
    </View>
  );
}

// --- option button ---------------------------------------------------------

function OptionButton({
  label,
  selected,
  state,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  state: 'idle' | 'correct' | 'wrong' | 'muted';
  disabled: boolean;
  onPress: () => void;
}) {
  const border =
    state === 'correct' ? theme.colors.correct : state === 'wrong' ? theme.colors.wrong : selected ? theme.colors.primary : theme.colors.border;
  const bg =
    state === 'correct' ? theme.colors.correctBg : state === 'wrong' ? theme.colors.wrongBg : selected ? theme.colors.surfaceAlt : theme.colors.background;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.option, { borderColor: border, backgroundColor: bg, opacity: state === 'muted' ? 0.5 : 1 }]}>
      <Text style={styles.optionText}>{label}</Text>
    </Pressable>
  );
}

// --- helpers ---------------------------------------------------------------

function renderPrompt(ex: Exercise) {
  switch (ex.type) {
    case 'listen_choose':
      return (
        <View style={styles.listen}>
          <Speaker text={ex.en} size="lg" />
          <Text style={styles.listenHint}>Tap to hear · choose the meaning</Text>
        </View>
      );
    case 'multiple_choice':
      return <Text style={styles.promptText}>{ex.prompt}</Text>;
    case 'fill_blank':
      return <Text style={styles.promptText}>{ex.sentence}</Text>;
    case 'translate':
      return <Text style={styles.promptText}>{ex.prompt}</Text>;
  }
}

function getOptions(ex: Exercise): string[] {
  switch (ex.type) {
    case 'listen_choose':
      return ex.options;
    case 'multiple_choice':
      return ex.options;
    case 'fill_blank':
      return ex.options;
    default:
      return [];
  }
}

function getCorrectValue(ex: Exercise): string {
  switch (ex.type) {
    case 'listen_choose':
      return ex.answer;
    case 'multiple_choice':
      return ex.options[ex.answerIndex];
    case 'fill_blank':
      return ex.answer;
    case 'translate':
      return ex.answer;
  }
}

function optionState(opt: string, selected: string | null, correct: string): 'correct' | 'wrong' | 'muted' {
  if (normalize(opt) === normalize(correct)) return 'correct';
  if (opt === selected) return 'wrong';
  return 'muted';
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between' },
  prompt: { minHeight: 120, justifyContent: 'center', alignItems: 'center', paddingVertical: theme.spacing(2) },
  promptText: { fontSize: theme.font.xl, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
  listen: { alignItems: 'center', gap: theme.spacing(1.5) },
  listenHint: { fontSize: theme.font.sm, color: theme.colors.textMuted },

  options: { gap: theme.spacing(1.5) },
  option: { paddingVertical: 18, paddingHorizontal: 16, borderRadius: theme.radius.md, borderWidth: 2 },
  optionText: { fontSize: theme.font.lg, fontWeight: '600', color: theme.colors.text, textAlign: 'center' },

  input: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 16,
    fontSize: theme.font.lg,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  hint: { marginTop: theme.spacing(1), color: theme.colors.textMuted, fontSize: theme.font.sm },

  feedback: { marginTop: theme.spacing(2), padding: theme.spacing(1.5), borderRadius: theme.radius.md },
  feedbackTitle: { fontSize: theme.font.lg, fontWeight: '800' },
  feedbackAnswer: { marginTop: 4, fontSize: theme.font.md, color: theme.colors.text },

  footer: { paddingTop: theme.spacing(2) },
});
