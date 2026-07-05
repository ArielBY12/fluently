/** Profile: stats + editable level & category preferences + dev reset. */

import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CEFRLevel } from '@/types';
import { CATEGORIES } from '@/data/curriculum';
import { masteredCount } from '@/lib/srs';
import { useGameStore } from '@/store/gameStore';
import { theme } from '@/theme';
import { Button } from '@/components/ui';

const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

export default function Profile() {
  const store = useGameStore();
  const mastered = masteredCount(Object.values(store.srs));
  const learned = Object.keys(store.srs).length;

  function toggleCategory(id: string) {
    const next = store.categories.includes(id)
      ? store.categories.filter((c) => c !== id)
      : [...store.categories, id];
    store.setCategories(next.length ? next : ['everyday']);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Your progress</Text>

        <View style={styles.grid}>
          <StatBox icon="🔥" value={String(store.streak)} label="Day streak" />
          <StatBox icon="⭐" value={String(store.xp)} label="Total XP" />
          <StatBox icon="✅" value={String(store.completedLessons.length)} label="Lessons done" />
          <StatBox icon="🏆" value={`${mastered}/${learned}`} label="Words mastered" />
        </View>

        {store.isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>✨ Premium member</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Level</Text>
        <View style={styles.chipRow}>
          {LEVELS.map((lvl) => (
            <Pressable
              key={lvl}
              onPress={() => store.setLevel(lvl)}
              style={[styles.chip, store.level === lvl && styles.chipOn]}>
              <Text style={[styles.chipText, store.level === lvl && styles.chipTextOn]}>{lvl}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Topics</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((c) => {
            const on = store.categories.includes(c.id);
            return (
              <Pressable key={c.id} onPress={() => toggleCategory(c.id)} style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {c.icon} {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: theme.spacing(4) }}>
          <Button label="Reset all progress" variant="ghost" onPress={() => store.resetAll()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={{ fontSize: 26 }}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing(2.5), paddingBottom: theme.spacing(6) },
  heading: { fontSize: theme.font.xxl, fontWeight: '900', color: theme.colors.text, marginBottom: theme.spacing(2) },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1.5) },
  statBox: {
    width: '47%',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing(2),
  },
  statValue: { fontSize: theme.font.xl, fontWeight: '900', color: theme.colors.text },
  statLabel: { fontSize: theme.font.xs, color: theme.colors.textMuted },

  premiumBadge: {
    marginTop: theme.spacing(2),
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    padding: theme.spacing(1.5),
    alignItems: 'center',
  },
  premiumText: { fontWeight: '900', color: theme.colors.text },

  sectionTitle: { fontSize: theme.font.lg, fontWeight: '800', color: theme.colors.text, marginTop: theme.spacing(3), marginBottom: theme.spacing(1) },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1) },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: theme.radius.pill, borderWidth: 2, borderColor: theme.colors.border },
  chipOn: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceAlt },
  chipText: { fontSize: theme.font.sm, fontWeight: '700', color: theme.colors.textMuted },
  chipTextOn: { color: theme.colors.primary },
});
