/**
 * Home / learning path. Shows the HUD (streak/hearts/XP), the daily free-word
 * goal, and a vertical path of lessons that unlock as you complete them.
 * Redirects to onboarding on first run.
 */

import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';

import { useGameStore } from '@/store/gameStore';
import { LESSON_PATH } from '@/data/curriculum';
import { theme } from '@/theme';
import { StatHud, ProgressBar } from '@/components/ui';

export default function HomeScreen() {
  const router = useRouter();
  const onboarded = useGameStore((s) => s.onboarded);
  const { streak, hearts, xp, newWordsToday, dailyGoal, isPremium, completedLessons } = useGameStore();

  if (!onboarded) return <Redirect href="/onboarding" />;

  function isUnlocked(index: number): boolean {
    if (index === 0) return true;
    return completedLessons.includes(LESSON_PATH[index - 1].id);
  }

  const goalPct = isPremium ? 1 : Math.min(1, newWordsToday / dailyGoal);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.brand}>Fluently</Text>
        <StatHud streak={streak} hearts={hearts} xp={xp} />
      </View>

      <View style={styles.goalCard}>
        <View style={styles.goalRow}>
          <Text style={styles.goalTitle}>Daily goal</Text>
          <Text style={styles.goalCount}>
            {isPremium ? 'Unlimited ✨' : `${newWordsToday}/${dailyGoal} words`}
          </Text>
        </View>
        <ProgressBar value={goalPct} />
      </View>

      <ScrollView contentContainerStyle={styles.path} showsVerticalScrollIndicator={false}>
        {LESSON_PATH.map((lesson, i) => {
          const unlocked = isUnlocked(i);
          const done = completedLessons.includes(lesson.id);
          return (
            <View key={lesson.id} style={styles.node}>
              <Pressable
                disabled={!unlocked}
                onPress={() => router.push(`/lesson/${lesson.id}`)}
                style={[
                  styles.bubble,
                  { backgroundColor: done ? theme.colors.correct : unlocked ? theme.colors.primary : theme.colors.locked },
                ]}>
                <Text style={styles.bubbleIcon}>{done ? '✓' : lesson.icon}</Text>
              </Pressable>
              <View style={styles.nodeText}>
                <Text style={[styles.nodeTitle, !unlocked && { color: theme.colors.locked }]}>{lesson.title}</Text>
                <Text style={styles.nodeSub}>{unlocked ? (done ? 'Completed' : 'Tap to start') : 'Locked'}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.5),
  },
  brand: { fontSize: theme.font.xl, fontWeight: '900', color: theme.colors.primary },

  goalCard: {
    marginHorizontal: theme.spacing(2),
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1.5),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
  },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing(1) },
  goalTitle: { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.text },
  goalCount: { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.textMuted },

  path: { padding: theme.spacing(2), gap: theme.spacing(2) },
  node: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) },
  bubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  bubbleIcon: { fontSize: 32, color: theme.colors.textOnPrimary },
  nodeText: { flex: 1 },
  nodeTitle: { fontSize: theme.font.lg, fontWeight: '800', color: theme.colors.text },
  nodeSub: { fontSize: theme.font.sm, color: theme.colors.textMuted, marginTop: 2 },
});
