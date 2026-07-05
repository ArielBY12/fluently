/**
 * Central design tokens for the app — colors, spacing, radii, font sizes.
 * Kept as plain values (no CSS/global.css) so it's easy to read and tweak.
 * Bright-inspired: friendly, rounded, high-contrast, playful accents.
 */

export const theme = {
  colors: {
    // Brand
    primary: '#5B5FEF', // indigo — main actions
    primaryDark: '#4548C7',
    accent: '#FFB020', // warm yellow — XP / highlights
    streak: '#FF7A1A', // flame orange — streaks

    // Feedback
    correct: '#2FBF71',
    correctBg: '#E4F7ED',
    wrong: '#F0475B',
    wrongBg: '#FDE7EA',

    // Hearts
    heart: '#F0475B',

    // Surfaces
    background: '#FFFFFF',
    surface: '#F5F6FA',
    surfaceAlt: '#EEF0F7',
    border: '#E2E4EE',

    // Text
    text: '#1A1B2E',
    textMuted: '#6B6F82',
    textOnPrimary: '#FFFFFF',

    // Locked / disabled
    locked: '#C7CAD6',
  },

  spacing: (n: number) => n * 8, // spacing(1) = 8, spacing(2) = 16 ...

  radius: {
    sm: 8,
    md: 12,
    lg: 20,
    pill: 999,
  },

  font: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 26,
    xxl: 34,
  },
} as const;

export type Theme = typeof theme;
