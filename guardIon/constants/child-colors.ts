export type ChildColorTheme = {
  main: string;
  muted: string;
  fill: string;
  border: string;
};

const CHILD_COLOR_PALETTE: Record<string, ChildColorTheme> = {
  '1': {
    main: '#0D9488',
    muted: '#CCFBF1',
    fill: 'rgba(13, 148, 136, 0.18)',
    border: '#0F766E',
  },
  '2': {
    main: '#2563EB',
    muted: '#DBEAFE',
    fill: 'rgba(37, 99, 235, 0.18)',
    border: '#1D4ED8',
  },
  '3': {
    main: '#7C3AED',
    muted: '#EDE9FE',
    fill: 'rgba(124, 58, 237, 0.18)',
    border: '#6D28D9',
  },
};

const FALLBACK: ChildColorTheme = {
  main: '#072B59',
  muted: '#D3E3F4',
  fill: 'rgba(7, 43, 89, 0.18)',
  border: '#072B59',
};

export function getChildColorTheme(childId: string): ChildColorTheme {
  return CHILD_COLOR_PALETTE[childId] ?? FALLBACK;
}
