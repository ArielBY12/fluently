/**
 * Premium upsell — shown when a free user exceeds the daily 4-word limit or runs
 * out of hearts. In v1 the "subscribe" button just flips the local isPremium
 * flag (dev stub). Real billing (RevenueCat) is a later milestone — see the plan.
 */

import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useGameStore } from '@/store/gameStore';
import { theme } from '@/theme';
import { Button } from '@/components/ui';

const PERKS = [
  { icon: '♾️', text: 'Unlimited new words every day' },
  { icon: '❤️', text: 'Unlimited hearts — never wait' },
  { icon: '🎯', text: 'All exercise types & topics' },
  { icon: '📊', text: 'Detailed progress stats' },
];

export default function Paywall() {
  const router = useRouter();
  const setPremium = useGameStore((s) => s.setPremium);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🚀</Text>
        <Text style={styles.title}>Go Premium</Text>
        <Text style={styles.subtitle}>You've hit today's free limit of 4 words.</Text>

        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p.text} style={styles.perk}>
              <Text style={{ fontSize: 22 }}>{p.icon}</Text>
              <Text style={styles.perkText}>{p.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          label="Unlock Premium"
          onPress={() => {
            setPremium(true); // dev stub — replace with RevenueCat purchase
            router.replace('/(tabs)');
          }}
        />
        <Button label="Maybe later" variant="ghost" onPress={() => router.replace('/(tabs)')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing(3) },
  emoji: { fontSize: 72 },
  title: { fontSize: theme.font.xxl, fontWeight: '900', color: theme.colors.text },
  subtitle: { fontSize: theme.font.md, color: theme.colors.textMuted, marginTop: theme.spacing(1), textAlign: 'center' },

  perks: { alignSelf: 'stretch', gap: theme.spacing(1.5), marginTop: theme.spacing(4) },
  perk: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5), backgroundColor: theme.colors.surface, padding: theme.spacing(2), borderRadius: theme.radius.md },
  perkText: { fontSize: theme.font.md, fontWeight: '600', color: theme.colors.text, flex: 1 },

  footer: { padding: theme.spacing(2.5), gap: theme.spacing(1) },
});
