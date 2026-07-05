/** A tappable speaker button that reads English text aloud via device TTS. */

import { Pressable, Text, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { theme } from '@/theme';

export function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: 'en-US', rate: 0.9 });
}

export function Speaker({ text, size = 'md' }: { text: string; size?: 'md' | 'lg' }) {
  const dim = size === 'lg' ? 72 : 48;
  return (
    <Pressable
      onPress={() => speak(text)}
      style={({ pressed }) => [
        styles.btn,
        { width: dim, height: dim, borderRadius: dim / 2, opacity: pressed ? 0.8 : 1 },
      ]}>
      <Text style={{ fontSize: size === 'lg' ? 34 : 22 }}>🔊</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
