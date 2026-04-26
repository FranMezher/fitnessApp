export const colors = {
  bg:           '#080808',
  surface:      'rgba(255,255,255,0.05)',
  surfaceHover: 'rgba(255,255,255,0.08)',
  border:       'rgba(255,255,255,0.09)',
  borderAccent: 'rgba(204,255,0,0.35)',
  neon:         '#CCFF00',
  orange:       '#FF6B35',
  teal:         '#3DFFA0',
  purple:       '#B388FF',
  text:         '#F2F2F2',
  muted:        '#888888',
  dim:          '#444444',
};

export const glass = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 16,
} as const;

export const glassNeon = {
  ...glass,
  backgroundColor: 'rgba(204,255,0,0.07)',
  borderColor: colors.borderAccent,
} as const;

export const glassOrange = {
  ...glass,
  backgroundColor: 'rgba(255,107,53,0.08)',
  borderColor: 'rgba(255,107,53,0.3)',
} as const;
