export const colors = {
  brandForest: '#0f3b2e',
  brandOlive: '#6b8e3d',
  honeydew: '#f0f7ea',
  cornsilk: '#fffae0',
  vanillaCustard: '#eee59f',
  willowGreen: '#aad480',
  emerald: '#75c97f',
  brume: '#c2f2e4',
  menthe: '#35c8b4',
  limonade: '#edf7be',
  verveine: '#a4cf4a',
  background: '#f0f7ea',
  backgroundAlt: '#e9f4df',
  foreground: '#13231a',
  foregroundSoft: '#2b3c31',
  card: '#fffffb',
  cardWarm: '#f7faf5',
  muted: '#94a3b8',
  mutedForeground: '#64748b',
  subtle: '#7a8b80',
  border: '#d8e8d3',
  borderStrong: '#bdd6b6',
  input: '#d7e8d1',
  primary: '#3a9f4b',
  primaryGlow: '#75c97f',
  primaryDark: '#236236',
  primarySoft: '#e7f6df',
  primaryBorder: '#bfe4b9',
  forest: '#123f2c',
  forestDeep: '#062217',
  forestSoft: '#e7f3df',
  moss: '#6f8f62',
  mineral: '#f5faef',
  skySoft: '#eef8fb',
  sky: '#1c7890',
  amberSoft: '#fffae0',
  amber: '#9f7115',
  dangerSoft: '#fff1f2',
  danger: '#c92c4a',
  dark: '#0e1c17',
  shadow: '#50665a',
  successSurface: '#f1f8ee',
  successBorder: '#bddbb7',
  successText: '#1f5b31',
  infoSurface: '#f2f8fa',
  infoBorder: '#bdd9df',
  infoText: '#155f73',
  warningSurface: '#fffaf0',
  warningBorder: '#ead9ad',
  warningText: '#76520d',
  criticalSurface: '#fff5f6',
  criticalBorder: '#ecc9cf',
  criticalText: '#9f1f3a',
  neutralSurface: '#e8ece6',
  neutralBorder: '#bdc8bc',
  neutralText: '#435348',
  iconSurface: '#e1eddd',
  iconBorder: '#bfd3ba',
  // Seed + Linear Botanical Precision Tokens
  snowWhite: '#fcfcf7',
  warmStone: '#eeeee9',
  forestDepths: '#1c3a13',
  limePulse: '#d3fa99',
  hairlineBorder: '#e6ede3',
  ink: '#13231a',
  pewter: '#64748b',
  cameraOverlay: 'rgba(0,0,0,0.24)',
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 999,
  // Constrained Vocabulary (Seed + Linear)
  control: 12,
  compact: 12,
  card: 16,
  container: 24,
  pill: 9999,
} as const;

export const spacing = {
  // Legacy aliases remain during screen migration. New/touched UI uses layout below.
  screen: 20,
  section: 18,
  // Linear 4px-base scale
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const typography = {
  display: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  section: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  bodyStrong: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  label: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
  metadata: { fontSize: 11, lineHeight: 16, fontWeight: '500' },
  metric: { fontSize: 24, lineHeight: 28, fontWeight: '600' },
} as const;

export const layout = {
  screenPadding: 16,
  sectionGap: 16,
  contentGap: 12,
  compactGap: 8,
  bottomNavClearance: 120,
} as const;

export const controlSize = {
  minimumTouchTarget: 44,
  compact: 44,
  default: 48,
  field: 52,
} as const;

export const elevation = {
  content: 0,
  floating: 8,
  navigation: 18,
} as const;

export const iconSize = {
  compact: 16,
  default: 20,
  navigation: 22,
  emphasis: 28,
} as const;
