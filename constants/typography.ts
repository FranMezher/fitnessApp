import type { TextStyle } from 'react-native';

export const text: Record<string, TextStyle> = {
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
