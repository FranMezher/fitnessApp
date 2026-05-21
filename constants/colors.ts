export const colors = {
  // Base
  bg:           '#080808',
  neon:         '#CCFF00',
  orange:       '#FF6B35',
  teal:         '#3DFFA0',
  purple:       '#B388FF',
  text:         '#F2F2F2',
  muted:        '#888888',
  dim:          '#444444',
  gold:         '#FFD700',

  // Surface layers (Stitch "Kinetic Obsidian")
  surface:               '#131313',
  surfaceDim:            '#131313',
  surfaceBright:         '#3a3939',
  surfaceContainerLowest:'#0e0e0e',
  surfaceContainerLow:   '#1c1b1b',
  surfaceContainer:      '#201f1f',
  surfaceContainerHigh:  '#2a2a2a',
  surfaceContainerHighest:'#353534',

  // Legacy aliases (kept for backward compat)
  surfaceHover: 'rgba(255,255,255,0.08)',
  border:       'rgba(255,255,255,0.09)',
  borderAccent: 'rgba(204,255,0,0.35)',
};

export const glass = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(16px)',
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 12,
} as const;

export const glassNeon = {
  ...glass,
  backgroundColor: 'rgba(204,255,0,0.08)',
  borderColor: colors.borderAccent,
} as const;

export const glassOrange = {
  ...glass,
  backgroundColor: 'rgba(255,107,53,0.10)',
  borderColor: 'rgba(255,107,53,0.4)',
} as const;

export const glowShadows = {
  neon: {
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.27,
    shadowRadius: 20,
    elevation: 12,
  },
  orange: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  teal: {
    shadowColor: '#3DFFA0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
