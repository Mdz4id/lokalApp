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
  sectionText?: string; // Optional override for section headers
}

export const lightTheme: Theme = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  card: '#FFFFFF',
  text: '#111111',
  sectionText:"#111111",
  textSecondary: '#555555',
  textMuted: '#999999',
  border: '#E0E0E0',
  tabBar: '#FFFFFF',
  tabInactive: '#888888',
  accent: '#FF982D',
  miniPlayerBg: '#ffaa3ae2',
  miniPlayerBtn: '#ff6a00',
  miniPlayerText: '#000000',
  miniPlayerSub: '#221b1b',
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
  sectionText:"#FFFFFF",
  accent: '#FF982D',
  miniPlayerBg: '#2a2a2ae4',
  miniPlayerBtn: '#666565',
  miniPlayerText: '#F0F0F0',
  miniPlayerSub: '#999999',
  progressTrack: '#444444',
  iconPrimary: '#F0F0F0',
};

export const useTheme = (): Theme => {
  const isDark = useThemeStore((state) => state.isDark);
  return isDark ? darkTheme : lightTheme;
};
