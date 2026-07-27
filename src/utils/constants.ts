export const PRIMARY_COLOR = '#38a9e5';

export const THEME_COLORS = {
  dark: {
    background: '#0a050d',
    screen: '#060913',
    surface: 'rgba(255,255,255,0.05)',
    card: '#111827',
    text: '#ffffff',
    textSecondary: '#71717a',
    textMuted: '#6b7280',
    border: 'rgba(255,255,255,0.1)',
    accent: PRIMARY_COLOR,
    accentSoft: 'rgba(56,169,229,0.14)',
    shadow: '#000000',
  },
  light: {
    background: '#fff',
    screen: '#ffffff',
    surface: 'rgba(15,23,42,0.04)',
    card: '#ffffff',
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    border: 'rgba(15,23,42,0.08)',
    accent: PRIMARY_COLOR,
    accentSoft: 'rgba(56,169,229,0.10)',
    shadow: '#0f172a',
  },
} as const;
