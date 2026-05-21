import type { TextStyle } from 'react-native';

export const text: Record<string, TextStyle> = {
  // Hero — large impact headers
  heroLg: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: -0.96,  // -0.02em at 48px
  },
  heroMd: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: -0.32,  // -0.01em at 32px
  },

  // Headlines
  headlineLg: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  headlineMd: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },

  // Body
  bodyLg: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'SpaceGrotesk_400Regular',
    lineHeight: 25.6,  // 1.6x
  },
  bodyMd: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'SpaceGrotesk_400Regular',
    lineHeight: 21,    // 1.5x
  },

  // Labels
  labelCaps: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  labelSm: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'SpaceGrotesk_500Medium',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Data / monospace feel (Space Grotesk medium for tabular data)
  dataMono: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'SpaceGrotesk_500Medium',
  },

  // Legacy aliases — kept so existing screens don't break immediately
  hero: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk_600SemiBold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'SpaceGrotesk_400Regular',
  },
};
