import { useThemeStore } from '../store/useThemeStore';

export interface Theme {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  tabBar: string;
  tabInactive: string;
  accent: string;
  miniPlayerBg: string;
  miniPlayerBtn: string;
  miniPlayerText: string;
  miniPlayerSub: string;
  progressTrack: string;
  iconPrimary: string;
}

export const lightTheme: Theme = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  card: '#FFFFFF',
  text: '#111111',
  textSecondary: '#555555',
  textMuted: '#999999',
  border: '#E0E0E0',
  tabBar: '#FFFFFF',
  tabInactive: '#888888',
  accent: '#FF982D',
  miniPlayerBg: '#111111',
  miniPlayerBtn: '#222222',
  miniPlayerText: '#FFFFFF',
  miniPlayerSub: '#CFCFCF',
  progressTrack: '#DDDDDD',
  iconPrimary: '#111111',
};

export const darkTheme: Theme = {
  background: '#121212',
  surface: '#1E1E1E',
  card: '#1E1E1E',
  text: '#F0F0F0',
  textSecondary: '#AAAAAA',
  textMuted: '#666666',
  border: '#333333',
  tabBar: '#1C1C1C',
  tabInactive: '#666666',
  accent: '#FF982D',
  miniPlayerBg: '#2A2A2A',
  miniPlayerBtn: '#3A3A3A',
  miniPlayerText: '#F0F0F0',
  miniPlayerSub: '#999999',
  progressTrack: '#444444',
  iconPrimary: '#F0F0F0',
};

export const useTheme = (): Theme => {
  const isDark = useThemeStore((state) => state.isDark);
  return isDark ? darkTheme : lightTheme;
};
