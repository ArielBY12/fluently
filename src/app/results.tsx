/** Lesson summary — celebrates XP earned and the current streak. */

import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useGameStore } from '@/store/gameStore';
import { theme } from '@/theme';
import { Button } from '@/components/ui';

export default function Results() {
  const router = useRouter();
  const { xp, correct, lesson } = useLocalSearchParams<{ xp: string; correct: string; lesson: string }>();
  const streak = useGameStore((s) => s.streak);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>Lesson complete!</Text>
        <Text style={styles.subtitle}>{lesson}</Text>

        <View style={styles.statsRow}>
          <Stat icon="⭐" value={`+${xp ?? 0}`} label="XP earned" color={theme.colors.accent} />
          <Stat icon="✓" value={correct ?? '0'} label="Correct" color={theme.colors.correct} />
          <Stat icon="🔥" value={String(streak)} label="Day streak" color={theme.colors.streak} />
        </View>
      </View>

      <View style={styles.footer}>
        <Button label="Continue" onPress={() => router.replace('/(tabs)')} />
      </View>
    </SafeAreaView>
  );
}

function Stat({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={{ fontSize: 26 }}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing(1), paddingHorizontal: theme.spacing(3) },
  emoji: { fontSize: 80 },
  title: { fontSize: theme.font.xxl, fontWeight: '900', color: theme.colors.text },
  subtitle: { fontSize: theme.font.md, color: theme.colors.textMuted, marginBottom: theme.spacing(3) },

  statsRow: { flexDirection: 'row', gap: theme.spacing(2), marginTop: theme.spacing(2) },
  stat: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing(2),
    minWidth: 96,
  },
  statValue: { fontSize: theme.font.xl, fontWeight: '900' },
  statLabel: { fontSize: theme.font.xs, color: theme.colors.textMuted },

  footer: { padding: theme.spacing(2.5) },
});
