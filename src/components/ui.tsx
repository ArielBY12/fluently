/** Small reusable UI primitives shared across screens. */

import { Pressable, Text, View, StyleSheet, type ViewStyle } from 'react-native';
import { theme } from '@/theme';

type BtnProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = 'primary', disabled, style }: BtnProps) {
  const bg = {
    primary: theme.colors.primary,
    secondary: theme.colors.surfaceAlt,
    success: theme.colors.correct,
    danger: theme.colors.wrong,
    ghost: 'transparent',
  }[variant];
  const fg = variant === 'secondary' || variant === 'ghost' ? theme.colors.text : theme.colors.textOnPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        variant === 'ghost' && styles.ghostBorder,
        style,
      ]}>
      <Text style={[styles.btnLabel, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(1, value)) * 100}%` }]} />
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Top HUD showing streak / hearts / XP. */
export function StatHud({ streak, hearts, xp }: { streak: number; hearts: number; xp: number }) {
  return (
    <View style={styles.hud}>
      <View style={styles.stat}>
        <Text style={styles.statIcon}>🔥</Text>
        <Text style={[styles.statText, { color: theme.colors.streak }]}>{streak}</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statIcon}>❤️</Text>
        <Text style={[styles.statText, { color: theme.colors.heart }]}>{hearts}</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statIcon}>⭐</Text>
        <Text style={[styles.statText, { color: theme.colors.accent }]}>{xp}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBorder: { borderWidth: 2, borderColor: theme.colors.border },
  btnLabel: { fontSize: theme.font.md, fontWeight: '700' },

  progressTrack: {
    height: 12,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: theme.colors.correct, borderRadius: theme.radius.pill },

  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(2),
  },

  hud: { flexDirection: 'row', gap: theme.spacing(2), alignItems: 'center' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statIcon: { fontSize: 18 },
  statText: { fontSize: theme.font.md, fontWeight: '800' },
});
